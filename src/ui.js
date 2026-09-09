import { addTask, completeTask, listTasks } from './tasks.js';

const taskListEl = () => document.getElementById('task-list');
const emptyEl = () => document.getElementById('empty-list');

export function renderTasks() {
  const list = taskListEl();
  const empty = emptyEl();
  const tasks = listTasks();

  list.replaceChildren();

  for (const task of tasks) {
    const item = document.createElement('li');
    item.dataset.taskId = task.id;
    if (task.completed) item.classList.add('completed');

    const meta = [task.priority, task.dueDate || 'no due date'].join(' · ');
    const label = document.createElement('span');
    label.textContent = `${task.title} (${meta})`;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'complete';
    button.textContent = task.completed ? 'Completed' : 'Mark complete';
    button.disabled = task.completed;
    button.addEventListener('click', () => {
      completeTask({ taskId: task.id });
      renderTasks();
    });

    item.append(label, button);
    list.append(item);
  }

  empty.hidden = tasks.length > 0;
}

export function wireUi() {
  const form = document.getElementById('add-task-form');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    addTask({
      title: data.get('title'),
      priority: data.get('priority'),
      dueDate: data.get('dueDate'),
    });
    form.reset();
    renderTasks();
  });

  renderTasks();
}

export function setWebmcpStatus(text) {
  const status = document.getElementById('webmcp-status');
  if (status) status.textContent = text;
}
