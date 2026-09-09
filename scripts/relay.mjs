#!/usr/bin/env node
/**
 * Tiny Node wrapper around @mcp-b/webmcp-local-relay.
 *
 * Why this process exists: WebMCP tools live *inside the browser tab*.
 * Desktop agents (Cursor, Claude Desktop) speak MCP over stdio. This script
 * is the bridge — Cursor spawns it, it opens a loopback WebSocket, and the
 * page's embed.js connects that tab's document.modelContext tools through.
 *
 * Run via `npm run relay` only to confirm the socket binds. For real use,
 * point your MCP client at this file (see README).
 */

import { LocalRelayMcpServer } from '@mcp-b/webmcp-local-relay';

const PAGE_ORIGIN = 'http://localhost:5173';

const relay = new LocalRelayMcpServer({
  serverName: 'webmcp-task-tracker',
  serverVersion: '0.1.0',
  bridgeOptions: {
    host: '127.0.0.1',
    port: 9333,
    // Restrict to this Vite app so random tabs cannot publish tools here.
    allowedOrigins: [PAGE_ORIGIN],
  },
});

await relay.start();
await relay.startStdio();

process.stderr.write(
  `[webmcp-task-tracker] relay listening on ws://127.0.0.1:${relay.bridge.port} (origin ${PAGE_ORIGIN})\n`,
);

async function shutdown(reason) {
  process.stderr.write(`[webmcp-task-tracker] shutting down (${reason})\n`);
  try {
    await relay.stop();
  } catch (error) {
    process.stderr.write(`[webmcp-task-tracker] stop failed: ${error.message}\n`);
  }
  process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.stdin.on('end', () => void shutdown('stdin-closed'));
