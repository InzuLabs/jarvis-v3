import { storage } from './storage.js';

const KEY = 'memory-facts';

function readFacts() {
  return storage.get(KEY) || [];
}

function writeFacts(facts) {
  storage.set(KEY, facts);
}

export function rememberFact(text) {
  const facts = readFacts();
  const normalized = text.trim();
  if (!normalized) return null;
  const fact = { id: Date.now(), text: normalized, createdAt: new Date().toISOString() };
  writeFacts([...facts, fact]);
  return fact;
}

export function getFacts() {
  return readFacts();
}

export function describeFacts() {
  const facts = getFacts();
  return facts.length ? facts.map(fact => fact.text).join('; ') : 'I do not have any saved personal facts yet.';
}
