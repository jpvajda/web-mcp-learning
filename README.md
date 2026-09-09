# WebMCP Learning Sandbox

A toy in-memory **task tracker** for learning [WebMCP](https://webmachinelearning.github.io/webmcp/) (`document.modelContext`). Not production code. Nothing is saved. Do not use this as a basis for automating any real third-party site.

Chrome inspector extensions (WebMCP Inspector, Model Context Tool Inspector, WebMCP Extension) are **unreliable** on current Chrome. They often look for `navigator.modelContextTesting`, which many builds do not expose even when `document.modelContext` works. **Skip them.** Test with the page console (below).

## Setup

Requires [Node.js](https://nodejs.org/) 22+.

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) (HTTP, not a `file:` URL — WebMCP rejects opaque origins).

The status line should mention `document.modelContext` and four tools. The UI still works if WebMCP is missing.

## Tools

The forms and the tools call the same functions in [`src/tasks.js`](src/tasks.js).

| Tool | How it is registered | Purpose |
| --- | --- | --- |
| `add_task` | Imperative — [`src/webmcp.js`](src/webmcp.js) | Create a task (`title` required; `priority` low/medium/high; `dueDate` YYYY-MM-DD) |
| `list_tasks` | Imperative | Return the in-memory array as JSON |
| `complete_task` | Imperative | Mark complete by `taskId` or exact `title` |
| `search_tasks` | Declarative — HTML `toolname` / `tooldescription` on the Search form | Find tasks by title keyword |

`@mcp-b/webmcp-polyfill` runs first in [`src/main.js`](src/main.js). If Chrome already has `document.modelContext`, the polyfill is a no-op.

## Test (page console)

Open DevTools on the app tab (the page console, not an extension console).

List tools:

```js
const ctx = document.modelContext;
const tools = await ctx.getTools();
console.log(tools.map((t) => t.name));
// expect: add_task, complete_task, list_tasks, search_tasks
```

Add, list, complete (same three actions as the UI):

```js
const ctx = document.modelContext;
const tools = await ctx.getTools();

const add = tools.find((t) => t.name === "add_task");
await ctx.executeTool(add, JSON.stringify({ title: "Buy milk", priority: "high" }));

const list = tools.find((t) => t.name === "list_tasks");
console.log(await ctx.executeTool(list, "{}"));

const complete = tools.find((t) => t.name === "complete_task");
await ctx.executeTool(complete, JSON.stringify({ title: "Buy milk" }));
```

The list on the page should update. You can also add / search / complete through the forms — that is the same in-memory store.

## Optional: desktop agent (Cursor or Claude Desktop)

Only needed if you want an AI chat to call these tools. The relay is extra infrastructure, not required to learn the API.

1. Keep `npm run dev` running and the tab open.
2. Add this to Cursor MCP settings (`~/.cursor/mcp.json` or project `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "webmcp-task-tracker": {
      "command": "node",
      "args": ["/Users/jvajda/Documents/Github_Personal/web-mcp-learning/scripts/relay.mjs"]
    }
  }
}
```

3. Reload MCP servers. Cursor spawns [`scripts/relay.mjs`](scripts/relay.mjs); you do not run it yourself.
4. On the page, click **Connect desktop MCP relay**.
5. Ask: “add a task called Buy milk, high priority.”

`npm run relay` in a terminal only smoke-tests that the socket binds, then waits on stdin. Do not run it at the same time as Cursor’s copy.

Leave the relay button off unless you are doing this. Clicking it with no relay running floods the console with failed `ws://127.0.0.1:9333–9348` probes.

## Optional: Playwright vs tools

[`playwright-comparison.spec.js`](playwright-comparison.spec.js) does add / list / complete with DOM selectors only — no `modelContext`.

```bash
npx playwright install chromium
npm run test:playwright
```

| | DOM / Playwright | WebMCP tools |
| --- | --- | --- |
| How you find the action | Inspect `#title`, `#priority`, `button.complete` | Read `name`, `description`, `inputSchema` |
| Breaks when you rename a CSS id | Yes | No — tools call `addTask()` / `completeTask()` |
| What the agent needs | A visible page and stable selectors | Schemas that say *when* to call and return enough state (ids) that it does not scrape the list |

Tool `description` is the routing signal for an agent, not docs for humans. That is why the comments in [`src/webmcp.js`](src/webmcp.js) treat it that way.
