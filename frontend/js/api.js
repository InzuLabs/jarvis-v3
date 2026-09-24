const API_BASE = '/api';
export const api = {
  async request(path, options = {}) { const response = await fetch(API_BASE + path, { headers: { 'Content-Type': 'application/json' }, ...options }); if (!response.ok) throw new Error('Backend unavailable'); return response.json(); },
  async command(command) { return this.request('/command', { method: 'POST', body: JSON.stringify({ command }) }); },
  async getSystem() { return this.request('/system'); }
};
export const isBackendAvailable = false;
