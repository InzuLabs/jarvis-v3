export function parseCommand(input) {
  const value = input.trim();
  const normalized = value.toLowerCase().replace(/[?!.,]/g, ' ').replace(/\s+/g, ' ');
  if (/\btimer\b/.test(normalized)) return { type: 'timer', value };
  if (/\b(?:what(?:'s| is)?|tell me)\s+(?:(?:the )?time|time)\b|^time\b/.test(normalized)) return { type: 'time' };
  if (/\b(?:today'?s date|date today|what date is it|what is the date)\b/.test(normalized)) return { type: 'date' };
  if (/\b(?:cpu|processor)\b.*\b(?:usage|load|doing|status)\b|\bhow is my computer(?: doing)?\b/.test(normalized)) return { type: 'system', metric: 'cpu' };
  if (/\bram\b.*\b(?:usage|memory|status|available)\b|\bmemory usage\b/.test(normalized)) return { type: 'system', metric: 'memory' };
  if (/\bsearch\s+(?:on\s+)?youtube\b|\byoutube\s+search\b/.test(normalized)) return { type: 'youtube-search', query: value.replace(/^.*?youtube(?:\s+search)?\s*(?:for)?\s*/i, '') };
  if (/^(?:calculate|compute|what is)\s+[-+*/().\d\s%]+$/i.test(value)) return { type: 'calculate', expression: value.replace(/^(?:calculate|compute|what is)\s+/i, '') };
  if (/^(?:search|look up|find)\b|\bsearch the web for\b|\bgoogle\b/.test(normalized)) {
    return { type: 'search', query: value.replace(/^(?:search(?: the web)? for|look up|find|google)\s*/i, '') };
  }
  const noteMatch = value.match(/^(?:take|make|write|create)\s+(?:a\s+)?note\s*[:\-]?\s*(.+)$/i);
  if (noteMatch) return { type: 'note', text: noteMatch[1].trim() };
  const rememberMatch = value.match(/^(?:remember|keep in mind|don't forget)\s+(?:that\s+)?(.+)$/i);
  if (rememberMatch) return { type: 'remember', text: rememberMatch[1].trim() };
  if (/\bwhat do you know about me\b|\bwhat do you remember about me\b/.test(normalized)) return { type: 'recall' };
  if (/^(?:show|list|read|display)\s+(?:me\s+)?my\s+notes?\b|^notes?\b/.test(normalized)) return { type: 'show-notes' };
  if (/\b(?:open|launch|go to)\s+(?:youtube|you tube)\b/.test(normalized)) return { type: 'open-youtube' };
  if (/\bstart focus mode\b/.test(normalized)) return { type: 'focus' };
  const appMatch = value.match(/^(?:open|launch|start)\s+(?:the\s+)?(.+)$/i);
  if (appMatch) return { type: 'open-app', target: appMatch[1].trim() };
  if (/\b(?:what'?s|what is) on my schedule|what should i do today|too much to do|organize my tasks/.test(normalized)) return { type: 'planned', value };
  if (/\bremind me\b/.test(normalized)) return { type: 'reminder', value };
  if (/\bwhat can you do\b|\bcapabilities\b|\bhelp\b/.test(normalized)) return { type: 'help' };
  return { type: 'chat', value };
}

export function parseDuration(text) {
  const match = text.match(/(\d+(?:\.\d+)?)\s*(second|minute|hour)s?/i);
  if (!match) return 0;
  const units = { second: 1, minute: 60, hour: 3600 };
  return Math.round(Number(match[1]) * units[match[2].toLowerCase()]);
}
