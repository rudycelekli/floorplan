// Java, Kotlin and Scala imports of this codebase's own packages: a wildcard import links to the package's
// files, and nothing from one of its packages is listed as an outside library.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lib } from './helpers.mjs';

const { createResolver } = await lib('resolve.mjs');
const files = [
  { path: 'src/main/java/com/acme/model/Order.java', lang: 'java', pkg: 'com.acme.model' },
  { path: 'src/main/java/com/acme/model/Customer.java', lang: 'java', pkg: 'com.acme.model' },
  { path: 'src/main/kotlin/com/acme/util/Money.kt', lang: 'kotlin', pkg: 'com.acme.util' },
  { path: 'src/main/java/com/acme/app/Main.java', lang: 'java', pkg: 'com.acme.app' },
];
const resolve = createResolver('/no-such-folder', files);
const from = files[3];

test('a wildcard import of one of our packages links to its files', () => {
  assert.deepEqual(resolve(from, { spec: 'com.acme.model.*' }).files?.sort(), ['src/main/java/com/acme/model/Customer.java', 'src/main/java/com/acme/model/Order.java']);
  assert.deepEqual(resolve(from, { spec: 'com.acme.model._' }).files?.length, 2); // Scala
  assert.equal(resolve(from, { spec: 'com.acme.model.Order.*' }).file, 'src/main/java/com/acme/model/Order.java'); // a class's members
});

test("a top-level Kotlin function from one of our packages isn't an outside library", () => {
  assert.deepEqual(resolve(from, { spec: 'com.acme.util.formatPrice' }), { unresolved: true });
});

test('outside libraries and the standard library are still told apart', () => {
  assert.deepEqual(resolve(from, { spec: 'org.springframework.web.bind.annotation.*' }), { external: 'org.springframework.web', eco: 'maven' });
  assert.deepEqual(resolve(from, { spec: 'java.util.*' }), { builtin: true });
  assert.equal(resolve(from, { spec: 'com.acme.model.Order' }).file, 'src/main/java/com/acme/model/Order.java');
});
