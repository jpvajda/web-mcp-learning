import { wireUi } from './ui.js';
import { registerImperativeTools } from './webmcp.js';

wireUi();

// Feature-detects and no-ops if the browser has no WebMCP surface.
// Part 4 will install a polyfill so this succeeds without Chrome flags.
void registerImperativeTools();
