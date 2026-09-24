const PREFIX = 'jarvis-v3:';
const defaults = { tasks: [], notes: [], reminders: [], conversations: [], preferences: { animations: true, sound: true, readAloud: true, compact: false, reducedMotion: false }, profile: { displayName: 'My Lord', jarvisName: 'JARVIS', address: 'My Lord' } };
export const storage = {
  get(key) { try { const value = localStorage.getItem(PREFIX + key); return value ? JSON.parse(value) : structuredClone(defaults[key]); } catch { return structuredClone(defaults[key]); } },
  set(key, value) { localStorage.setItem(PREFIX + key, JSON.stringify(value)); return value; },
  remove(key) { localStorage.removeItem(PREFIX + key); },
  defaults
};
