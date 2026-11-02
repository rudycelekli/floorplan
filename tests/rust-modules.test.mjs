// Rust: `use` paths that start at a module the file declares are links inside the crate, not other crates.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lib } from './helpers.mjs';

const { extract } = await lib('extract.mjs');
const { createResolver } = await lib('resolve.mjs');

test('mod handlers; use handlers::list; links to the module, and real crates stay outside', () => {
  const src = 'mod handlers;\nmod db;\nuse handlers::list;\nuse self::db::Pool;\nuse serde::Serialize;\nfn main() {}\n';
  const main = { path: 'src/main.rs', lang: 'rust', ...extract(src, 'rust', 'src/main.rs') };
  const files = [main, { path: 'src/handlers.rs', lang: 'rust' }, { path: 'src/db/mod.rs', lang: 'rust' }];
  const resolve = createResolver('/no-such-folder', files);
  const where = (spec) => { const r = resolve(main, main.imports.find((i) => i.spec === spec && i.kind === 'use')); return r.file || (r.external ? `crate ${r.external}` : 'none'); };
  assert.equal(where('handlers::list'), 'src/handlers.rs');
  assert.equal(where('self::db::Pool'), 'src/db/mod.rs');
  assert.equal(where('serde::Serialize'), 'crate serde');
});
