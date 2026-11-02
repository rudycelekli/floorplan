// `@/…` imports whose alias lives in a bundler config (vite.config, webpack) rather than a tsconfig.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lib } from './helpers.mjs';

const { createResolver } = await lib('resolve.mjs');
const resolveIn = (paths, from, spec) => {
  const files = paths.map((p) => ({ path: p, lang: 'javascript' }));
  return createResolver('/no-such-folder', files)(files.find((f) => f.path === from), { spec });
};

test("@/ links to the app's src/ folder, in a monorepo too", () => {
  const paths = ['apps/web/package.json', 'apps/web/vite.config.js', 'apps/web/src/components/Btn.vue', 'apps/web/src/main.js', 'src/other.js'];
  assert.deepEqual(resolveIn(paths, 'apps/web/src/main.js', '@/components/Btn.vue'), { file: 'apps/web/src/components/Btn.vue' });
});

test("@/ is never an outside package, even when nothing matches", () => {
  assert.deepEqual(resolveIn(['package.json', 'src/main.js'], 'src/main.js', '@/missing/thing'), { unresolved: true });
  assert.deepEqual(resolveIn(['package.json', 'src/main.js'], 'src/main.js', '@scope/pkg'), { external: '@scope/pkg', eco: 'npm' });
});
