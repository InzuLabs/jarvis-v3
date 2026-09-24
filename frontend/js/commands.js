export function parseCommand(input) {
  const normalized = input.trim().toLowerCase();
  if (/^timer\b|\btimer\s+for\b/.test(normalized)) return { type: 'timer', value: normalized };
  if (/^time\b|what(?:'s| is) the time/.test(normalized)) return { type: 'time' };
  if (/^search\b/.test(normalized)) return { type: 'search', query: input.trim().replace(/^search\s*/i, '') };
  if (/too much to do|organize my tasks/.test(normalized)) return { type: 'organize' };
  return { type: 'chat', value: input.trim() };
}
export function parseDuration(text) { const match = text.match(/(\d+)\s*(second|minute|hour)s?/i); if (!match) return 0; const units = { second: 1, minute: 60, hour: 3600 }; return Number(match[1]) * units[match[2].toLowerCase()]; }
