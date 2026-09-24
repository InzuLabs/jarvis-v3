import { storage } from './storage.js';
export const state = { view: 'home', coreState: 'IDLE', tasks: storage.get('tasks'), notes: storage.get('notes'), reminders: storage.get('reminders'), conversations: storage.get('conversations'), preferences: storage.get('preferences'), profile: storage.get('profile'), timer: { running: false, remaining: 0, total: 0, handle: null } };
export function persist(key) { storage.set(key, state[key]); }
export function addConversation(role, text) { state.conversations.push({ id: Date.now(), role, text, time: new Date().toISOString() }); persist('conversations'); }
