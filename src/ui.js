import { addTask, completeTask, listTasks, searchTasks } from './tasks.js';

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

  const searchForm = document.getElementById('search-form');
  const searchResults = document.getElementById('search-results');

  searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(searchForm);
    const query = data.get('query');
    const matches = searchTasks(query);
    const payload = { query, matches };

    searchResults.hidden = false;
    searchResults.textContent =
      matches.length === 0
        ? `No tasks matching “${query}”.`
        : matches.map((task) => `${task.title} (${task.id})`).join(', ');

    // Agent-triggered submits set agentInvoked. respondWith() is how the
    // declarative tool returns a value instead of navigating away.
    if (event.agentInvoked && typeof event.respondWith === 'function') {
      event.respondWith(
        Promise.resolve({
          content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
        }),
      );
    }
  });

  const connectRelay = document.getElementById('connect-relay');
  connectRelay?.addEventListener('click', () => {
    if (document.querySelector('script[data-webmcp-embed]')) return;
    // Classic script on purpose — embed.js must stay unbundled so it can
    // fetch sibling widget.html. Do not load this on every page view: with
    // no relay process it scans ws://127.0.0.1:9333–9348 and IPv6 and floods
    // the console. That scan is unrelated to the Chrome inspector.
    const script = document.createElement('script');
    script.src = '/webmcp-relay/embed.js';
    script.dataset.webmcpEmbed = '1';
    script.dataset.relayPort = '9333';
    document.body.appendChild(script);
    connectRelay.disabled = true;
    connectRelay.textContent = 'Relay embed loaded (needs npm run relay or Cursor MCP)';
  });

  renderTasks();
}

export function setWebmcpStatus(text) {
  const status = document.getElementById('webmcp-status');
  if (status) status.textContent = text;
}
