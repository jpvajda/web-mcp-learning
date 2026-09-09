# WebMCP Learning Sandbox

A self-contained toy **task tracker** for learning [WebMCP](https://webmachinelearning.github.io/webmcp/) (`document.modelContext`) hands-on. Not production code. In-memory state only — nothing is saved, and this app is not a basis for automating any real third-party site.

## Setup

Requires [Node.js](https://nodejs.org/) 22+ (the local MCP relay in a later part needs it).

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Serve over HTTP — WebMCP rejects opaque `file:` origins.

## What is here so far (Part 1)

A minimal UI:

1. **Add Task** — title, priority (low / medium / high), due date
2. **List Tasks** — in-memory JS array
3. **Mark complete** — by the button on each row (task id)

## Imperative tools (Part 2)

The page feature-detects `document.modelContext` (falls back to `navigator.modelContext`) and registers three tools that call the same functions as the UI:

| Tool | Purpose |
| --- | --- |
| `add_task` | Create a task (`title` required; `priority` enum; `dueDate` date) |
| `list_tasks` | Return the current in-memory array as JSON |
| `complete_task` | Mark a task complete by `taskId` or `title` |

Without native WebMCP or the Part 4 polyfill, registration is a silent no-op and the forms still work.

## Declarative tool (Part 3)

`search_tasks` is **not** registered in JS. The Search form uses `toolname`, `tooldescription`, and `toolparamdescription`. The browser (or later the polyfill) builds the JSON Schema from those attributes and the named inputs.

## Polyfill (Part 4)

`@mcp-b/webmcp-polyfill` is initialized in `src/main.js` **before** tools register.

- If the browser already has `document.modelContext` (Chrome flag / origin trial), `initializeWebMCPPolyfill()` is a **no-op** and does not replace the native object.
- `installTestingShim: true` adds `navigator.modelContextTesting` so inspector extensions can list and execute tools. The shim is skipped if a native testing API is already present.

A later part adds a local MCP relay so Cursor or Claude Desktop can call these tools.
