// Import aliases that SvelteKit and Nuxt set up in a tsconfig they generate (.svelte-kit/, .nuxt/),
// which is never in git, so the scan only sees the project's own files.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lib } from './helpers.mjs';

const { createResolver } = await lib('resolve.mjs');
/** Where each import lands: a file, an outside package, or nowhere. */
function resolveAll(paths, imports) {
  const files = paths.map((p) => ({ path: p, lang: p.endsWith('.vue') ? 'vue' : p.endsWith('.svelte') ? 'svelte' : 'typescript' }));
  const resolve = createResolver('/no-such-folder', files);
  return imports.map(([from, spec]) => { const r = resolve(files.find((f) => f.path === from), { spec }); return r.file || (r.external ? `package ${r.external}` : 'unresolved'); });
}

test('SvelteKit: $lib is src/lib beside svelte.config.js, in a monorepo too', () => {
  assert.deepEqual(resolveAll(
    ['apps/shop/svelte.config.js', 'apps/shop/src/lib/db.ts', 'apps/shop/src/lib/index.ts', 'apps/shop/src/lib/Cart.svelte', 'apps/shop/src/routes/+page.server.ts'],
    [['apps/shop/src/routes/+page.server.ts', '$lib/db'], ['apps/shop/src/routes/+page.server.ts', '$lib'], ['apps/shop/src/routes/+page.server.ts', '$lib/Cart.svelte']],
  ), ['apps/shop/src/lib/db.ts', 'apps/shop/src/lib/index.ts', 'apps/shop/src/lib/Cart.svelte']);
});

test('Nuxt: ~ and @ are the source folder (app/ in Nuxt 4), ~~ and @@ the project folder', () => {
  assert.deepEqual(resolveAll(
    ['nuxt.config.ts', 'utils/format.ts', 'pages/index.vue'],
    [['pages/index.vue', '~/utils/format'], ['pages/index.vue', '@/utils/format']],
  ), ['utils/format.ts', 'utils/format.ts']);
  assert.deepEqual(resolveAll(
    ['web/nuxt.config.ts', 'web/app/composables/useCart.ts', 'web/app/pages/index.vue', 'web/server/utils/db.ts'],
    [['web/app/pages/index.vue', '~/composables/useCart'], ['web/app/pages/index.vue', '~~/server/utils/db'], ['web/app/pages/index.vue', '@nuxt/kit']],
  ), ['web/app/composables/useCart.ts', 'web/server/utils/db.ts', 'package @nuxt/kit']);
});

test('without the framework, the same imports are left alone', () => {
  assert.deepEqual(resolveAll(['src/lib/db.ts', 'src/main.ts'], [['src/main.ts', '$lib/db'], ['src/main.ts', '~/lib/db']]), ['unresolved', 'unresolved']);
});
