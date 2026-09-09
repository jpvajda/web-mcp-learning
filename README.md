# WebMCP Learning Sandbox

A self-contained toy **task tracker** for learning [WebMCP](https://webmachinelearning.github.io/webmcp/) (`document.modelContext`) hands-on. Not production code. In-memory state only — nothing is saved, and this app is not a basis for automating any real third-party site.

## Setup

Requires [Node.js](https://nodejs.org/) 22+ (the local MCP relay in a later part needs it).

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Serve over HTTP — WebMCP rejects opaque `file:` origins. Vite also sends `Origin-Agent-Cluster: ?1` because the polyfill refuses `registerTool` when the page is not origin-keyed.

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

## Local MCP relay (Part 5)

The page registers tools in the browser. Desktop agents speak MCP over stdio. `@mcp-b/webmcp-local-relay` bridges them: `embed.js` opens a WebSocket to `127.0.0.1:9333`, and `scripts/relay.mjs` is the MCP server Cursor or Claude Desktop spawn.

1. Keep `npm run dev` running and the app open at [http://localhost:5173](http://localhost:5173) (not a `file:` URL).
2. Add the relay to your MCP client. **Cursor** (`~/.cursor/mcp.json` or the project `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "webmcp-task-tracker": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/web-mcp-learning/scripts/relay.mjs"]
    }
  }
}
```

Replace `/ABSOLUTE/PATH/TO/web-mcp-learning` with this repo's path.

Equivalent without the wrapper script:

```json
{
  "mcpServers": {
    "webmcp-local-relay": {
      "command": "npx",
      "args": [
        "-y",
        "@mcp-b/webmcp-local-relay@latest",
        "--widget-origin",
        "http://localhost:5173"
      ]
    }
  }
}
```

**Claude Desktop:** download the `.mcpb` bundle from [GitHub Releases](https://github.com/WebMCP-org/npm-packages/releases) and double-click to install, or add the same JSON to Claude's MCP config.

3. Restart the MCP client (or reload MCP servers). Ask it to call `webmcp_list_sources` then `webmcp_list_tools`. You should see this tab and `add_task` / `list_tasks` / `complete_task` / `search_tasks`.
4. Ask: “add a task called Buy milk, high priority.” The list on the page should update.

`npm run relay` in a terminal only confirms the process starts; Cursor must spawn it over stdio for tools to appear in chat.

Node 22+ is required for the relay. The embed is served from the installed npm package at `/webmcp-relay/` (not bundled) so sibling `widget.html` still resolves.

## Manual verification (Part 6)

Use the Chrome extensions you already have: **WebMCP Extension** and **WebMCP Inspector** / **Model Context Tool Inspector**.

Some inspectors talk to `navigator.modelContextTesting`. This app installs that via the polyfill testing shim. If you are on native Chrome WebMCP instead, enable `chrome://flags/#enable-webmcp-testing` and relaunch.

1. `npm install && npm run dev` — open [http://localhost:5173](http://localhost:5173), not a `file:` URL.
2. Confirm the status line shows a polyfill or native `document.modelContext`.
3. Use **desktop Chrome**, not an embedded webview. The polyfill throws `SecurityError` when `originAgentCluster` is false (some embedded browsers ignore the `Origin-Agent-Cluster` header). Open both extensions. They should detect **4 tools**: `add_task`, `list_tasks`, `complete_task` (imperative) and `search_tasks` (declarative).
4. **Execute tab:** run `add_task` (title + priority enum + optional dueDate) then `list_tasks`. The schema-generated form should match those fields — `priority` is a low/medium/high choice, not a free-text box. The task should appear in the page list.
5. **Monitor / event-log tab:** submit the real Add Task form on the page. You should see tool registration and/or `toolchange` / invocation-related events. (UI submit is not itself a tool call; the interesting events are registration at load and later agent/inspector executes.)
6. **Relay + agent:** with Part 5 configured, ask an assistant “add a task called X”. It should pick `add_task` (not guess CSS selectors). Confirm the UI list updates. Then “what tasks are on the list?” should call `list_tasks`.

Console check if an extension looks empty:

```js
const tools = await document.modelContext.getTools();
console.log(tools.map((t) => t.name));
```

Expect `add_task`, `list_tasks`, `complete_task`, and `search_tasks`.

## Playwright vs WebMCP (Part 7)

[`playwright-comparison.spec.js`](playwright-comparison.spec.js) performs the same three actions — add, list, complete — using **only DOM selectors**. It never calls `document.modelContext`.

```bash
npx playwright install chromium
npm run test:playwright
```

| | Playwright / selector-guessing | WebMCP tools |
| --- | --- | --- |
| How the agent finds the action | Inspect the DOM (or a screenshot) for `#title`, `#priority`, `button.complete` | Read `name` + `description` + `inputSchema` |
| Lines of code for 3 actions | ~20 of brittle locators in the spec | 3 `registerTool` blocks; the agent writes no selectors |
| Breaks when you rename a CSS id | Yes | No — tools call `addTask()` / `completeTask()` |
| Breaks when you restyle the list | Often | No |
| Needs a visible page | Yes | Tool execute still runs the same JS even if the agent never "sees" the form |

An agent will prefer tools over screenshotting or selector-guessing when the tools look like a better bet than the DOM:

- **Unique names** (`add_task`, not `do_thing`) so the model can pick one without overlap.
- **When-to-call language in `description`** ("Use when the user wants to create a to-do") — this is the routing signal, not a comment for humans.
- **Explicit required vs optional fields** and enums (`priority: low|medium|high`) so the model does not invent values or omit `title`.
- **Return enough state** (`list_tasks` returns the full JSON array with ids) that the agent does not need to scrape the `<ul>` to call `complete_task`.

If descriptions are vague or schemas are empty objects, the model often ignores the tools and goes back to clicking. That is why the comments in `src/webmcp.js` treat `description` as agent-facing, not documentation.
