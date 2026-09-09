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

A later section covers Chrome extension verification and a Playwright-vs-WebMCP comparison.
