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
  assert.match(html, /<title>Dilo — Spanish from first words to fluency<\/title>/i);
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
  assert.match(layout, /Dilo — Spanish from first words to fluency/);
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
  assert.match(serviceWorker, /dilo-pages-v4/);
  assert.match(serviceWorker, /pathname\.startsWith\("\/api\/"\)/);
  assert.match(appSource, /https:\/\/dilo-spanish-a1\.z1ifre\.chatgpt\.site/);
});

test("ships the complete A1–C2 learning engine", async () => {
  const [curriculum, engine, coach, labs, mixerUi, mixerData, appSource] = await Promise.all([
    readFile(new URL("../src/spanish-curriculum.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/spanish-engine.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/DailyCoach.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/PracticeLabs.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/GrammarMixer.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/spanish-mixer.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/SpanishApp.tsx", import.meta.url), "utf8"),
  ]);

  const tick = String.fromCharCode(96);
  const rowsFor = (sourceName, level) => {
    const start = curriculum.indexOf(`const ${sourceName}`);
    const end = curriculum.indexOf("\n};", start);
    const block = curriculum.slice(start, end);
    const marker = `${level}: ${tick}`;
    const rowStart = block.indexOf(marker) + marker.length;
    const rowEnd = block.indexOf(tick, rowStart);
    return block.slice(rowStart, rowEnd).trim().split(/\r?\n/);
  };

  for (const level of ["A1", "A2", "B1", "B2", "C1", "C2"]) {
    assert.equal(rowsFor("lexiconSource", level).length, 36, `${level} lexical core`);
    assert.equal(rowsFor("extendedLexiconSource", level).length, 24, `${level} extended lexical core`);
    assert.equal(rowsFor("grammarSource", level).length, 12, `${level} grammar core`);
    assert.equal(rowsFor("missionSource", level).length, 12, `${level} mission core`);
    assert.ok(rowsFor("missionSource", level).every((row) => row.split("|").length === 9), `${level} missions are complete`);
  }

  assert.match(curriculum, /\["A1", "A2", "B1", "B2", "C1", "C2"\]/);
  assert.match(engine, /DAILY_STEPS = \["cards", "recall", "grammar", "listen", "build", "read", "speak"\]/);
  assert.match(engine, /version: 3/);
  assert.match(engine, /Correction queue clear/);
  assert.match(engine, /recordStudyDayReplay/);
  assert.match(engine, /ReviewGrade = "again" \| "hard" \| "good" \| "easy"/);
  assert.match(engine, /canAdvanceCatchUp/);
  assert.match(coach, /FOUR-LINE MISSION/);
  assert.match(coach, /Speech recognition checks approximate word similarity, not accent/);
  assert.doesNotMatch(coach, /<input\b/);
  assert.doesNotMatch(coach, /Type what you remember|Write the complete Spanish line/);
  assert.match(coach, /Reveal answer/);
  assert.match(coach, /Retest missed only/);
  assert.match(mixerUi, /I can use the pattern/);
  assert.match(mixerData, /linked verb|agreement|subjunctive/i);
  assert.match(coach, /Choose the missing Spanish words/);
  assert.match(labs, /Twenty listening items and twenty reading\/usage items/);
  assert.match(labs, /move forward and back/);
  assert.match(labs, /EXACT DAY REPLAY/);
  assert.match(appSource, /A1 → C2/);
  assert.match(appSource, /Meaning-linked patterns/);
  assert.match(appSource, /EXACT STUDY HISTORY/);
  assert.match(appSource, /B2 IS THE CONVERSATIONAL FLUENCY THRESHOLD/);
});
