// Node's subpath imports: `#…` specifiers mapped by the "imports" field of the nearest package.json.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { makeProject, run, readJson, cleanup } from './helpers.mjs';

const root = makeProject({
  'api/package.json': JSON.stringify({
    name: 'api', type: 'module',
    imports: { '#db': './src/db/index.js', '#lib/*': './src/lib/*.js', '#config': { node: './src/config.js', default: './src/config.browser.js' } },
  }),
  'api/src/db/index.js': 'export const db = {};\n',
  'api/src/lib/log.js': 'export const log = () => {};\n',
  'api/src/config.js': 'export default {};\n',
  'api/src/config.browser.js': 'export default {};\n',
  'api/src/server.js': 'import { db } from "#db";\nimport { log } from "#lib/log";\nimport config from "#config";\nimport { missing } from "#nope";\n',
});
after(() => cleanup(root));

test("subpath imports (#db, #lib/*) link through the nearest package.json's imports map", () => {
  run('scan.mjs', root);
  const scan = readJson(path.join(root, 'floorplan', '.cache', 'scan.json'));
  assert.deepEqual(scan.edges.filter((e) => e.from === 'api/src/server.js').map((e) => e.to).sort(),
    ['api/src/config.js', 'api/src/db/index.js', 'api/src/lib/log.js']);
  assert.deepEqual(scan.externals, []);
});
