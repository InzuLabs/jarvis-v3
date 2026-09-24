import { state, persist } from './state.js';
import { toast } from './ui.js';

const years = Array.from({ length: 21 }, (_, index) => new Date().getFullYear() - 5 + index);
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function option(value, label) {
  const item = document.createElement('option');
  item.value = value;
  item.textContent = label;
  return item;
}

function enhanceDateField() {
  const oldInput = document.querySelector('#task-due');
  if (!oldInput || document.querySelector('#task-day')) return;

  const field = oldInput.closest('.field');
  if (!field) return;
  field.classList.add('full');
  field.replaceChildren();

  const label = document.createElement('label');
  label.textContent = 'Due date';
  field.append(label);

  const controls = document.createElement('div');
  controls.className = 'date-selects';
  const day = document.createElement('select');
  const month = document.createElement('select');
  const year = document.createElement('select');
  day.id = 'task-day';
  month.id = 'task-month';
  year.id = 'task-year';
  day.setAttribute('aria-label', 'Due day');
  month.setAttribute('aria-label', 'Due month');
  year.setAttribute('aria-label', 'Due year');
  day.append(option('', 'Day'));
  month.append(option('', 'Month'));
  year.append(option('', 'Year'));
  for (let value = 1; value <= 31; value += 1) day.append(option(value, String(value).padStart(2, '0')));
  months.forEach((name, index) => month.append(option(index + 1, name)));
  years.forEach(value => year.append(option(value, value)));
  controls.append(day, month, year);
  const hint = document.createElement('small');
  hint.className = 'field-hint';
  hint.textContent = 'Select any day, month, and year.';
  field.append(controls, hint);
}

function selectedDate() {
  const day = Number(document.querySelector('#task-day')?.value);
  const month = Number(document.querySelector('#task-month')?.value);
  const year = Number(document.querySelector('#task-year')?.value);
  if (!day && !month && !year) return '';
  if (!day || !month || !year) return null;
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function saveTask(event) {
  if (!event.target.matches('#task-form')) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  const due = selectedDate();
  if (due === null) {
    toast('Please choose a valid day, month, and year.');
    return;
  }
  state.tasks.push({
    id: Date.now(),
    title: document.querySelector('#task-title').value,
    priority: document.querySelector('#task-priority').value,
    category: document.querySelector('#task-category').value,
    due,
    notes: document.querySelector('#task-notes').value,
    done: false
  });
  persist('tasks');
  toast('Task saved locally.');
  document.querySelector('#primary-nav [data-view="tasks"]')?.click();
}

document.addEventListener('submit', saveTask, true);
new MutationObserver(enhanceDateField).observe(document.querySelector('#app-view'), { childList: true, subtree: true });
enhanceDateField();
