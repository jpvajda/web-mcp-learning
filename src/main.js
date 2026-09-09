import { initializeWebMCPPolyfill } from '@mcp-b/webmcp-polyfill';
import { wireUi } from './ui.js';
import { registerImperativeTools } from './webmcp.js';

/**
 * Install document.modelContext when the browser does not ship WebMCP yet.
 *
 * This is a no-op if document.modelContext already exists (native Chrome
 * origin trial / flag, or a previous install). It does not replace the
 * native object.
 *
 * installTestingShim: Chrome inspector extensions (WebMCP Inspector /
 * Model Context Tool Inspector) call navigator.modelContextTesting, not
 * just registerTool. The shim is skipped if a native testing API is already
 * present. Off by default in the package; we opt in for this learning app.
 */
const hadNativeContext = typeof document !== 'undefined' && 'modelContext' in document && Boolean(document.modelContext);

initializeWebMCPPolyfill({ installTestingShim: true });

wireUi();

void registerImperativeTools({
  runtime: hadNativeContext ? 'native' : 'polyfill',
});
