export function reply(text, context) {
  const address = context.address || 'My Lord';
  return `${text}, ${address}.`;
}

export function unavailable(capability, context) {
  return reply(`The local ${capability} is unavailable. I will not pretend the action succeeded.`, context);
}

export function unknown(context) {
  return reply('I do not yet have a local action for that request. Try asking what I can do.', context);
}
