import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';

const require = createRequire(import.meta.url);
const relayBrowserDir = path.join(
  path.dirname(require.resolve('@mcp-b/webmcp-local-relay/package.json')),
  'dist/browser',
);

const RELAY_FILES = new Set(['embed.js', 'widget.html', 'widget.js']);

/**
 * Serve the relay embed as *real static files*, not a Vite bundle.
 * embed.js fetches sibling widget.html from its own URL directory; bundling
 * would break that sibling lookup.
 */
function serveRelayEmbed() {
  const middleware = (req, res, next) => {
    const name = path.basename((req.url ?? '').split('?')[0] ?? '');
    if (!RELAY_FILES.has(name)) {
      next();
      return;
    }

    const file = path.join(relayBrowserDir, name);
    if (!fs.existsSync(file)) {
      next();
      return;
    }

    const type = name.endsWith('.js') ? 'text/javascript; charset=utf-8' : 'text/html; charset=utf-8';
    res.setHeader('Content-Type', type);
    fs.createReadStream(file).pipe(res);
  };

  return {
    name: 'serve-relay-embed',
    configureServer(server) {
      server.middlewares.use('/webmcp-relay', middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use('/webmcp-relay', middleware);
    },
  };
}

// Vite is only here to serve ES modules on http://localhost — WebMCP rejects
// opaque file: origins, so a real HTTP origin is required even for this toy app.
export default defineConfig({
  plugins: [serveRelayEmbed()],
  server: {
    port: 5173,
    strictPort: true,
  },
});
