from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from html.parser import HTMLParser
from html import unescape
from pathlib import Path
from urllib.parse import parse_qs, quote, urlparse
from urllib.request import Request, urlopen
import ctypes
import json
import os
import platform
import shutil
import time

ROOT = Path(__file__).resolve().parent.parent
FRONTEND = ROOT / 'frontend'
_previous_cpu = None
_previous_cpu_at = None


class SearchParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.results = []
        self.current = None
        self.capture = None

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        classes = attributes.get('class', '').split()
        if tag == 'a' and ('result__a' in classes or 'result-link' in classes):
            self.current = {'title': '', 'url': unescape(attributes.get('href', ''))}
            self.capture = 'title'
        elif self.results and tag in ('td', 'div') and ('result__snippet' in classes or 'result-snippet' in classes):
            self.current = self.results[-1]
            self.capture = 'summary'
            self.current.setdefault('summary', '')

    def handle_data(self, data):
        if self.current and self.capture:
            self.current[self.capture] = self.current.get(self.capture, '') + data.strip() + ' '

    def handle_endtag(self, tag):
        if tag == 'a' and self.current and self.capture == 'title':
            self.current['title'] = self.current['title'].strip()
            self.results.append(self.current)
            self.current = None
            self.capture = None
        elif tag in ('td', 'div') and self.current and self.capture == 'summary':
            self.current['summary'] = self.current['summary'].strip()
            self.current = None
            self.capture = None


def cpu_usage():
    global _previous_cpu, _previous_cpu_at
    if os.name != 'nt':
        return {'available': False, 'value': None, 'reason': 'CPU metric adapter is currently Windows-specific'}
    class FileTime(ctypes.Structure):
        _fields_ = [('low', ctypes.c_uint32), ('high', ctypes.c_uint32)]

    idle, kernel, user = FileTime(), FileTime(), FileTime()
    if not ctypes.windll.kernel32.GetSystemTimes(ctypes.byref(idle), ctypes.byref(kernel), ctypes.byref(user)):
        return {'available': False, 'value': None, 'reason': 'GetSystemTimes failed'}
    values = lambda item: (item.high << 32) + item.low
    now = (values(idle), values(kernel), values(user))
    current_at = time.monotonic()
    if _previous_cpu is None:
        _previous_cpu, _previous_cpu_at = now, current_at
        return {'available': False, 'value': None, 'reason': 'Collecting first CPU sample'}
    idle_delta = now[0] - _previous_cpu[0]
    total_delta = (now[1] + now[2]) - (_previous_cpu[1] + _previous_cpu[2])
    _previous_cpu, _previous_cpu_at = now, current_at
    if total_delta <= 0:
        return {'available': False, 'value': None, 'reason': 'CPU sample unavailable'}
    return {'available': True, 'value': f'{max(0, min(100, round((1 - idle_delta / total_delta) * 100)))}%'}


def memory_usage():
    if os.name != 'nt':
        return {'available': False, 'value': None, 'reason': 'RAM metric adapter is currently Windows-specific'}
    class MemoryStatus(ctypes.Structure):
        _fields_ = [('length', ctypes.c_uint32), ('memory_load', ctypes.c_uint32), ('total', ctypes.c_uint64), ('available', ctypes.c_uint64), ('page_total', ctypes.c_uint64), ('page_available', ctypes.c_uint64), ('virtual_total', ctypes.c_uint64), ('virtual_available', ctypes.c_uint64), ('extended', ctypes.c_uint64)]
    status = MemoryStatus()
    status.length = ctypes.sizeof(status)
    if not ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(status)):
        return {'available': False, 'value': None, 'reason': 'GlobalMemoryStatusEx failed'}
    return {'available': True, 'value': f'{status.memory_load}%'}


def system_data():
    return {
        'cpu': cpu_usage(),
        'memory': memory_usage(),
        'disk': {'available': True, 'value': f'{round(shutil.disk_usage(ROOT).used / shutil.disk_usage(ROOT).total * 100)}%'},
        'operatingSystem': platform.platform(),
        'hostname': platform.node(),
        'backend': 'online'
    }


def web_search(query):
    request = Request('https://lite.duckduckgo.com/lite/?q=' + quote(query), headers={'User-Agent': 'JARVIS-V3-local-search/1.0'})
    with urlopen(request, timeout=12) as response:
        parser = SearchParser()
        parser.feed(response.read().decode('utf-8', errors='replace'))
    return {'query': query, 'source': 'DuckDuckGo', 'results': parser.results[:8]}


class Handler(BaseHTTPRequestHandler):
    def send_json(self, payload, status=200):
        body = json.dumps(payload).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        parsed = urlparse(self.path)
        try:
            if parsed.path == '/api/system':
                self.send_json(system_data())
                return
            if parsed.path == '/api/search':
                query = parse_qs(parsed.query).get('q', [''])[0].strip()
                if not query:
                    self.send_json({'error': 'A search query is required', 'results': []}, 400)
                    return
                self.send_json(web_search(query))
                return
            file_path = (FRONTEND / parsed.path.lstrip('/')).resolve()
            if file_path == FRONTEND:
                file_path = FRONTEND / 'index.html'
            if FRONTEND not in file_path.parents or not file_path.is_file():
                self.send_error(404)
                return
            content_type = 'text/html' if file_path.suffix == '.html' else 'text/css' if file_path.suffix == '.css' else 'application/javascript'
            body = file_path.read_bytes()
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except Exception as error:
            self.send_json({'error': str(error)}, 502)

    def log_message(self, format_string, *args):
        print(format_string % args)


if __name__ == '__main__':
    print('JARVIS V3 running at http://127.0.0.1:4173')
    ThreadingHTTPServer(('127.0.0.1', 4173), Handler).serve_forever()
