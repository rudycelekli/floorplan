// chi (Go): routes declared inside r.Route("/path", func(r chi.Router) { … }) live under that path.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lib } from './helpers.mjs';

const { extract } = await lib('extract.mjs');

test('chi: routes inside r.Route sit under its path, nested too, and routes outside it do not', () => {
  const r = extract([
    `func main() {`,
    `  r := chi.NewRouter()`,
    `  r.Get("/health", health)`,
    `  r.Route("/articles", func(r chi.Router) {`,
    `    r.Get("/", listArticles)`,
    `    r.Route("/{articleID}", func(r chi.Router) {`,
    `      r.Get("/", getArticle)`,
    `      r.Delete("/", deleteArticle)`,
    `    })`,
    `  })`,
    `  r.Post("/login", login)`,
    `}`,
  ].join('\n'), 'go', 'cmd/api/main.go');
  assert.deepEqual(r.routes.map((x) => `${x.method} ${x.path}`),
    ['GET /health', 'GET /articles/', 'GET /articles/{articleID}/', 'DELETE /articles/{articleID}/', 'POST /login']);
});
