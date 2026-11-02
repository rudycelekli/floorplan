// A repo with a git submodule: git lists the submodule as one entry, not its files, so the scan has to
// treat it as a repo of its own to put its code on the map.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { makeProject, run, readJson, cleanup } from './helpers.mjs';

const root = makeProject({
  'app.js': 'import { price } from "./shared/index.js";\nconsole.log(price(1));\n',
  'shared/index.js': 'export const price = (n) => n * 100;\n',
}, { repos: ['.', 'shared'] });
// record shared/ as a submodule (a gitlink entry), the way `git submodule add` does
execFileSync('git', ['-C', root, 'update-index', '--add', '--cacheinfo', `160000,${'1'.repeat(40)},shared`]);
after(() => cleanup(root));

test("a checked-out submodule is scanned as its own repo, and the code using it links to it", () => {
  run('scan.mjs', root);
  const scan = readJson(path.join(root, 'floorplan', '.cache', 'scan.json'));
  assert.deepEqual(scan.repos.map((r) => r.path), ['.', 'shared']);
  assert.ok(scan.files.some((f) => f.path === 'shared/index.js' && f.repo === 'shared'), 'expected shared/index.js on the map');
  assert.deepEqual(scan.edges.map((e) => `${e.from} -> ${e.to}`), ['app.js -> shared/index.js']);
});
