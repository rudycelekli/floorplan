// A solution-style tsconfig.json, as Vite's templates make: no settings of its own, just references to
// tsconfig.app.json and tsconfig.node.json, where the path aliases live.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { makeProject, run, readJson, cleanup } from './helpers.mjs';

const root = makeProject({
  'web/package.json': JSON.stringify({ name: 'web', private: true }),
  'web/tsconfig.json': JSON.stringify({ files: [], references: [{ path: './tsconfig.app.json' }, { path: './tsconfig.node.json' }] }),
  'web/tsconfig.app.json': JSON.stringify({ compilerOptions: { baseUrl: '.', paths: { '@/*': ['./src/*'] } }, include: ['src'] }),
  'web/tsconfig.node.json': JSON.stringify({ compilerOptions: { module: 'ESNext' }, include: ['vite.config.ts'] }),
  'web/src/lib/utils.ts': 'export const cn = (...c: string[]) => c.join(" ");\n',
  'web/src/App.tsx': 'import { cn } from "@/lib/utils";\nexport default () => cn("a");\n',
});
after(() => cleanup(root));

test("an alias from a referenced tsconfig links the file, and isn't an outside package", () => {
  run('scan.mjs', root);
  const scan = readJson(path.join(root, 'floorplan', '.cache', 'scan.json'));
  assert.deepEqual(scan.edges.map((e) => `${e.from} -> ${e.to}`), ['web/src/App.tsx -> web/src/lib/utils.ts']);
  assert.deepEqual(scan.externals.map((e) => e.id), []);
});
