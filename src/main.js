import { setWebmcpStatus, wireUi } from './ui.js';

wireUi();

// Part 2 will register tools here. Until then the page is a normal form app
// and WebMCP is simply not present.
setWebmcpStatus('WebMCP: unavailable (tools not registered yet)');
