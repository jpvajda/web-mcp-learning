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

Later parts add imperative WebMCP tools, a declarative search form, a polyfill, and a local MCP relay so Cursor or Claude Desktop can call those tools.
