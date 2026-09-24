import { recentConversation } from './conversation-history.js';

export function buildContext(state) {
  return {
    view: state.view,
    address: state.profile.address || 'My Lord',
    openTasks: state.tasks.filter(task => !task.done).length,
    savedNotes: state.notes.length,
    recentConversation: recentConversation(state)
  };
}
