import { parseCommand, parseDuration } from './commands.js';
import { buildContext } from './context-engine.js';
import { describeFacts, getFacts, rememberFact } from './memory.js';
import { recordConversation } from './conversation-history.js';
import { reply, unavailable, unknown } from './personality-engine.js';
import { formatDate, formatTime } from './ui.js';

function calculate(expression) {
  const tokens = expression.replace(/%/g, '/100').match(/\d+(?:\.\d+)?|[()+\-*/]/g);
  if (!tokens || tokens.join('') !== expression.replace(/\s+/g, '').replace(/%/g, '/100')) throw new Error('Invalid expression');
  let index = 0;
  const primary = () => { if (tokens[index] === '(') { index += 1; const value = additive(); if (tokens[index++] !== ')') throw new Error('Unbalanced expression'); return value; } const value = Number(tokens[index++]); if (!Number.isFinite(value)) throw new Error('Invalid number'); return value; };
  const multiplicative = () => { let value = primary(); while (tokens[index] === '*' || tokens[index] === '/') { const operator = tokens[index++]; const right = primary(); if (operator === '/' && right === 0) throw new Error('Division by zero'); value = operator === '*' ? value * right : value / right; } return value; };
  const additive = () => { let value = multiplicative(); while (tokens[index] === '+' || tokens[index] === '-') { const operator = tokens[index++]; const right = multiplicative(); value = operator === '+' ? value + right : value - right; } return value; };
  const result = additive(); if (index !== tokens.length) throw new Error('Invalid expression'); return result;
}

export async function executeCommand(text, dependencies) {
  const { state, api, persist, startTimer, openUrl = url => window.open(url, '_blank', 'noopener') } = dependencies;
  const context = buildContext(state);
  const command = parseCommand(text);
  try {
    switch (command.type) {
      case 'time': return reply(`It is ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, context);
      case 'date': return reply(`Today is ${formatDate()}`, context);
      case 'timer': {
        const seconds = parseDuration(text);
        if (!seconds) return reply('Please specify a duration, such as “set a timer for 5 minutes.”', context);
        startTimer(seconds);
        return reply(`Timer started for ${formatTime(seconds)}. I shall keep watch locally`, context);
      }
      case 'note':
        state.notes.push({ id: Date.now(), title: command.text, body: command.text, createdAt: new Date().toISOString() });
        persist('notes');
        return reply(`I have taken note of “${command.text}”`, context);
      case 'show-notes':
        return reply(state.notes.length ? `You have ${state.notes.length} saved note${state.notes.length === 1 ? '' : 's'}: ${state.notes.map(note => note.title).join('; ')}` : 'There are no saved notes yet', context);
      case 'remember':
        rememberFact(command.text);
        return reply(`I shall remember that ${command.text}`, context);
      case 'recall':
        return reply(getFacts().length ? `I know this about you: ${describeFacts()}` : describeFacts(), context);
      case 'open-youtube':
        openUrl('https://www.youtube.com/');
        return reply('YouTube is open', context);
      case 'youtube-search':
        openUrl('https://www.youtube.com/results?search_query=' + encodeURIComponent(command.query));
        return reply(`YouTube search opened for “${command.query}”`, context);
      case 'calculate':
        return reply(`The answer is ${calculate(command.expression)}`, context);
      case 'open-app':
        return unavailable(`“${command.target}” application control`, context);
      case 'planned':
        return unavailable('schedule and prioritization engine', context);
      case 'reminder':
        return unavailable('reminder notification service', context);
      case 'focus':
        return unavailable('focus mode', context);
      case 'help':
        return reply('I can report system status, tell the time or date, set timers, take and show notes, remember facts, open YouTube, search the web, manage tasks, and organize your day', context);
      case 'organize':
        return reply('Your open tasks are ready to be organized by the local prioritizer', context);
      case 'system': {
        const system = await api.getSystem();
        const metric = command.metric === 'memory' ? system.memory : system.cpu;
        return metric?.available ? reply(`Your ${command.metric === 'memory' ? 'RAM' : 'CPU'} is currently at ${metric.value}`, context) : unavailable(`${command.metric === 'memory' ? 'RAM' : 'CPU'} metric`, context);
      }
      case 'search': {
        const data = await api.search(command.query);
        return data.results?.length ? reply(`I found ${data.results.length} result${data.results.length === 1 ? '' : 's'} for “${command.query}”. The first is “${data.results[0].title}”`, context) : reply('No results were returned for that query', context);
      }
      default: return unknown(context);
    }
  } catch (error) {
    return command.type === 'search' ? unavailable('search backend', context) : command.type === 'system' ? unavailable('system backend', context) : unavailable('backend service', context);
  }
}

export function recordCommand(state, text) {
  recordConversation(state, 'YOU', text);
}
