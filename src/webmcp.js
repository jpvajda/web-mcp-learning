import { addTask, completeTask, listTasks } from './tasks.js';
import { renderTasks, setWebmcpStatus } from './ui.js';

/**
 * Resolve the WebMCP producer surface.
 *
 * Why this fallback exists:
 * - `document.modelContext` is the current Community Group draft API.
 * - `navigator.modelContext` is the deprecated alias some older runtimes
 *   still expose. Prefer document, then fall back.
 * - If neither exists, return null and do nothing. A missing browser API
 *   must never crash the page — the form UI has to keep working.
 */
export function getModelContext() {
  if (typeof document !== 'undefined' && document.modelContext) {
    return document.modelContext;
  }
  if (typeof navigator !== 'undefined' && navigator.modelContext) {
    return navigator.modelContext;
  }
  return null;
}

/**
 * MCP-shaped tool result. Agents and inspector extensions expect a
 * `content` array they can render, not a raw JS value.
 */
function toolResult(payload) {
  return {
    content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
  };
}

function toolError(message) {
  return {
    content: [{ type: 'text', text: JSON.stringify({ error: message }, null, 2) }],
    isError: true,
  };
}

export async function registerImperativeTools() {
  const modelContext = getModelContext();

  if (!modelContext || typeof modelContext.registerTool !== 'function') {
    setWebmcpStatus('WebMCP: unavailable (no document.modelContext / navigator.modelContext)');
    return;
  }

  // `description` is NOT documentation for humans reading this file.
  // It is the signal the agent uses to decide WHEN to call the tool.
  // Vague descriptions ("manages tasks") cause the model to pick the
  // wrong tool or skip tools and guess at the DOM instead.
  await modelContext.registerTool({
    name: 'add_task',
    description:
      'Create a new task in the in-memory tracker. Use when the user wants to add, create, or remember a to-do. Requires a title. Optional priority (low, medium, high) and dueDate (YYYY-MM-DD).',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Short name of the task to create.',
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'Importance of the task. Defaults to medium if omitted.',
        },
        dueDate: {
          type: 'string',
          format: 'date',
          description: 'Due date in YYYY-MM-DD format.',
        },
      },
      required: ['title'],
      additionalProperties: false,
    },
    async execute({ title, priority, dueDate } = {}) {
      try {
        // Same function the Add Task form calls — one source of truth.
        const task = addTask({ title, priority, dueDate });
        renderTasks();
        return toolResult({ ok: true, task });
      } catch (error) {
        return toolError(error.message);
      }
    },
  });

  await modelContext.registerTool({
    name: 'list_tasks',
    description:
      'Return every task currently in the in-memory list as JSON, including completed ones. Use when the user asks what tasks exist, what is on the list, or to inspect current state. No input required.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
    async execute() {
      return toolResult({ tasks: listTasks() });
    },
  });

  await modelContext.registerTool({
    name: 'complete_task',
    description:
      'Mark an existing task as completed. Use when the user says they finished, done, or completed a task. Identify the task by taskId (preferred) or by exact title.',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: {
          type: 'string',
          description: 'Id of the task to complete (from list_tasks).',
        },
        title: {
          type: 'string',
          description: 'Exact title of the task to complete, if id is unknown.',
        },
      },
      additionalProperties: false,
      anyOf: [{ required: ['taskId'] }, { required: ['title'] }],
    },
    async execute({ taskId, title } = {}) {
      try {
        const task = completeTask({ taskId, title });
        renderTasks();
        return toolResult({ ok: true, task });
      } catch (error) {
        return toolError(error.message);
      }
    },
  });

  const source = document.modelContext ? 'document.modelContext' : 'navigator.modelContext';
  setWebmcpStatus(`WebMCP: ${source} — 3 imperative tools registered`);
}
