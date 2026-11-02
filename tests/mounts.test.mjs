// Prefixes from mounting routers, when the router and the app that mounts it share a file.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lib } from './helpers.mjs';

const { extract } = await lib('extract.mjs');
const { resolveRoutes } = await lib('routes.mjs');
const endpoints = (files) => resolveRoutes(Object.entries(files).map(([path, src]) => ({ path, lang: 'javascript', ...extract(src, 'javascript', path) })))
  .map((r) => `${r.method} ${r.path}${r.mountMw ? ` [${r.mountMw}]` : ''}`).sort();

test("a router mounted in the same file gets the prefix and the check, and the app's own routes don't", () => {
  assert.deepEqual(endpoints({
    'server.js': [
      `const app = express();`,
      `const router = express.Router();`,
      `router.get('/orders', listOrders);`,
      `app.get('/health', (req, res) => res.send('ok'));`,
      `app.use('/api', requireStaff, router);`,
    ].join('\n'),
  }), ['GET /api/orders [requireStaff]', 'GET /health']);
});

test('a router mounted on an app that is itself served under a name sits under both', () => {
  assert.deepEqual(endpoints({
    'functions/src/index.ts': [
      `import { onRequest } from 'firebase-functions/v2/https';`,
      `const app = express();`,
      `const router = express.Router();`,
      `router.get('/books', (req, res) => res.json([]));`,
      `app.get('/ping', (req, res) => res.send('ok'));`,
      `app.use('/v1', router);`,
      `export const api = onRequest(app);`,
    ].join('\n'),
  }), ['GET /api/ping', 'GET /api/v1/books']);
});
