import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function worker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  return (await import(workerUrl.href)).default;
}

test("server-renders the finished Dilo course", async () => {
  const app = await worker();
  const response = await app.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>Dilo — Spanish you can use today<\/title>/i);
  assert.match(html, /Preparando tu camino/);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|react-loading-skeleton/);
});

test("keeps progress protected and starter assets removed", async () => {
  const [page, layout, packageJson, appSource, progressRoute] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../src/SpanishApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/progress/route.ts", import.meta.url), "utf8"),
  ]);
  assert.match(page, /SpanishApp/);
  assert.match(layout, /Dilo — Spanish you can use today/);
  assert.match(appSource, /Speak sooner\./);
  assert.match(appSource, /Spanish that leaves/);
  assert.match(progressRoute, /getChatGPTUser/);
  assert.match(progressRoute, /status: 401/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)));
});

test("builds a repository-path-safe GitHub Pages companion", async () => {
  const [html, manifest, serviceWorker, appSource] = await Promise.all([
    readFile(new URL("../docs/index.html", import.meta.url), "utf8"),
    readFile(new URL("../docs/manifest.webmanifest", import.meta.url), "utf8"),
    readFile(new URL("../docs/sw.js", import.meta.url), "utf8"),
    readFile(new URL("../src/SpanishApp.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(html, /\.\/assets\/index-/);
  assert.match(html, /https:\/\/z1fire\.github\.io\/dilo-spanish\//);
  assert.match(manifest, /"start_url": "\.\/#today"/);
  assert.match(manifest, /"scope": "\.\/"/);
  assert.match(serviceWorker, /dilo-pages-v2/);
  assert.match(serviceWorker, /pathname\.startsWith\("\/api\/"\)/);
  assert.match(appSource, /https:\/\/dilo-spanish-a1\.z1ifre\.chatgpt\.site/);
});
