import { defineConfig } from 'vite';

// Vite is only here to serve ES modules on http://localhost — WebMCP rejects
// opaque file: origins, so a real HTTP origin is required even for this toy app.
export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,
  },
});
