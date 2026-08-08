// Facade: components import from here, never from services/mock directly.
// Swap this file's contents for real httpClient calls once the Node.js API
// exists — no page or component needs to change.
export * from './mock/orderService';
