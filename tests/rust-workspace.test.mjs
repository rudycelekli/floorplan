// A Cargo workspace: one crate using another is a link inside the project, not an outside crate.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { makeProject, run, readJson, cleanup } from './helpers.mjs';

const root = makeProject({
  'Cargo.toml': '[workspace]\nmembers = ["crates/*"]\n',
  'crates/core/Cargo.toml': '[package]\nauthors = ["Shop team"]\nname = "shop-core"\nversion = "0.1.0"\n\n[dependencies]\nserde = "1"\n',
  'crates/core/src/lib.rs': 'pub mod models;\npub use self::models::Order;\n',
  'crates/core/src/models.rs': 'pub struct Order;\n',
  'crates/api/Cargo.toml': '[package]\nname = "api"\nversion = "0.1.0"\n\n[dependencies]\nshop-core = { path = "../core" }\nserde = "1"\n',
  'crates/api/src/main.rs': 'use shop_core::models::Order;\nuse shop_core::Order as O;\nuse serde::Serialize;\nfn main() {}\n',
});
after(() => cleanup(root));

test('a crate used by another crate of the workspace is linked, and only outside crates are packages', () => {
  run('scan.mjs', root);
  const scan = readJson(path.join(root, 'floorplan', '.cache', 'scan.json'));
  const from = scan.edges.filter((e) => e.from === 'crates/api/src/main.rs').map((e) => e.to).sort();
  assert.deepEqual(from, ['crates/core/src/lib.rs', 'crates/core/src/models.rs']);
  assert.deepEqual(scan.externals.map((e) => e.id), ['cargo:serde']);
});
