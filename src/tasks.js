/**
 * In-memory task store.
 *
 * Why a plain array instead of a backend: WebMCP tools need a real function to
 * call. Sharing this module between the UI and later tool handlers is the
 * whole point — an agent invoking add_task must mutate the same state the
 * form uses, so the list on screen updates.
 */

let nextId = 1;
const tasks = [];

export function addTask({ title, priority = 'medium', dueDate = '' }) {
  const trimmed = String(title ?? '').trim();
  if (!trimmed) {
    throw new Error('title is required');
  }

  const allowed = new Set(['low', 'medium', 'high']);
  const normalizedPriority = allowed.has(priority) ? priority : 'medium';

  const task = {
    id: String(nextId++),
    title: trimmed,
    priority: normalizedPriority,
    dueDate: dueDate ? String(dueDate) : '',
    completed: false,
  };

  tasks.push(task);
  return task;
}

export function listTasks() {
  // Return a shallow copy so callers cannot mutate the store by accident.
  return tasks.map((task) => ({ ...task }));
}

export function completeTask({ taskId, title } = {}) {
  const id = taskId != null && String(taskId).trim() !== '' ? String(taskId).trim() : null;
  const matchTitle = title != null && String(title).trim() !== '' ? String(title).trim().toLowerCase() : null;

  if (!id && !matchTitle) {
    throw new Error('Provide taskId or title');
  }

  const task = tasks.find((candidate) => {
    if (id && candidate.id === id) return true;
    if (matchTitle && candidate.title.toLowerCase() === matchTitle) return true;
    return false;
  });

  if (!task) {
    throw new Error(id ? `No task with id "${id}"` : `No task titled "${title}"`);
  }

  task.completed = true;
  return { ...task };
}

export function searchTasks(query) {
  const needle = String(query ?? '').trim().toLowerCase();
  if (!needle) return [];
  return listTasks().filter((task) => task.title.toLowerCase().includes(needle));
}
