import { persist } from './state.js';

export function recordConversation(state, role, text) {
  state.conversations.push({ id: Date.now(), role, text, time: new Date().toISOString() });
  persist('conversations');
}

export function recentConversation(state, limit = 6) {
  return state.conversations.slice(-limit);
}

export function clearConversation(state) {
  state.conversations = [];
  persist('conversations');
}
