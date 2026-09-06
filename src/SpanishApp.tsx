"use client";

import { type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import DailyCoach from "./DailyCoach";
import { Checkpoint, DrillSession, StudyReplay, type DrillKind } from "./PracticeLabs";
import {
  advanceCatchUpSession,
  canAdvanceCatchUp,
  dueCorrections,
  ensureCurrentPlan,
  getArchive,
  graduateLevel,
  graduationStatus,
  localDate,
  normalizeProgress,
  recordSkill,
  recordStudyDayReplay,
  recordTrainingSeconds,
  resolveCorrection,
  skillAccuracy,
  switchLevel,
  type Progress,
  type SkillArea,
  type StudyDay,
} from "./spanish-engine";
import {
  allGrammar,
  allLexicon,
  allMissions,
  curriculumTotals,
  grammarByLevel,
  levelOrder,
  levels,
  levelSoundLessons,
  lexiconByLevel,
  missionsByLevel,
  soundLessons,
  type LevelId,
} from "./spanish-curriculum";
import { formatDuration, percent, speakSpanish } from "./spanish-ui";
import "./spanish.css";

type View = "today" | "course" | "practice" | "library" | "checkpoint" | "progress";
type LibraryTab = "words" | "grammar" | "missions" | "sounds";
type SyncStatus = "checking" | "saving" | "synced" | "device" | "error" | "conflict";
type Account = { mode: "checking" | "signed-in" | "device"; displayName?: string; email?: string };
type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

const STORAGE_KEY = "dilo:spanish:progress:v3";
const V2_STORAGE_KEY = "dilo:spanish:progress:v2";
const LEGACY_STORAGE_KEY = "dilo:spanish-a1:progress:v1";
const STORAGE_TIME_KEY = "dilo:spanish:saved-at:v3";
const V2_STORAGE_TIME_KEY = "dilo:spanish:saved-at:v2";
const PREFERENCES_KEY = "dilo:spanish:preferences:v3";
const V2_PREFERENCES_KEY = "dilo:spanish:preferences:v2";
const RECOVERY_KEY = "dilo:spanish:recovery:v3";
const SYNCED_APP_URL = "https://dilo-spanish-a1.z1ifre.chatgpt.site";
const APP_VERSION = "3.7.0";

function CorrectionLab({ progress, update, close }: { progress: Progress; update: (recipe: (current: Progress) => Progress) => void; close: () => void }) {
  const corrections = dueCorrections(progress);
  const pending = progress.corrections.find((correction) => correction.level === progress.selectedLevel);
  const item = corrections[0] ?? null;
  const [result, setResult] = useState("");
  const [resultExplanation, setResultExplanation] = useState("");
  if (!item) return <main className="session-shell result-stage"><span>AUTOMATIC CORRECTION LOOP</span><strong>✓</strong><h1>{pending ? "Your next check is scheduled." : "All corrections are clear."}</h1><p>{pending ? "You answered this correctly once. The final check unlocks on the next learning day; there is nothing else you need to do for it today." : "You have completed both retrievals for every correction at this level."}</p><button className="primary-action" onClick={close}>Back to practice <span>→</span></button></main>;
  const choose = (option: string) => {
    const correct = option === item.answer;
    setResult(correct ? item.correctStreak ? "Correct again · this miss is now cleared." : "Correct · this miss will return once tomorrow." : "Not yet · review the explanation and retry.");
    setResultExplanation(item.explanation);
    update((current) => resolveCorrection(recordSkill(current, item.skill, correct), item.id, correct));
    if (correct) window.setTimeout(() => setResult(""), 700);
  };
  return <main className="session-shell correction-session"><header className="session-topbar"><button onClick={close}>×</button><div><span>AUTOMATIC CORRECTION LOOP</span><strong>{corrections.length} ready now</strong></div><small>{item.correctStreak ? "2nd retrieval" : "1st retrieval"}</small></header><section className="quiz-stage"><div className="quiz-prompt"><span>{item.skill}</span><h1>{item.prompt}</h1>{item.speech && <div className="standalone-correction-audio"><button className="sound-button" onClick={() => speakSpanish(item.speech!)}><b>◖))</b><small>Hear it</small></button><button onClick={() => speakSpanish(item.speech!, .62)}>Play slower</button></div>}</div><div className="answer-grid">{item.choices.map((option, index) => <button key={option} onClick={() => choose(option)}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div>{result && <div className={`answer-ribbon ${result.startsWith("Correct") ? "" : "wrong"}`}><div><strong>{result}</strong><span>{resultExplanation}</span></div></div>}</section></main>;
}

export default function SpanishApp() {
  const [view, setView] = useState<View>("today");
  const [progress, setProgress] = useState<Progress>(() => ensureCurrentPlan(normalizeProgress(null)));
  const [ready, setReady] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const [drill, setDrill] = useState<DrillKind | null>(null);
  const [correctionsOpen, setCorrectionsOpen] = useState(false);
  const [examOpen, setExamOpen] = useState(false);
  const [replay, setReplay] = useState<StudyDay | null>(null);
  const [libraryTab, setLibraryTab] = useState<LibraryTab>("words");
  const [search, setSearch] = useState("");
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("checking");
  const [account, setAccount] = useState<Account>({ mode: "checking" });
  const [remoteConflict, setRemoteConflict] = useState<{ progress: Progress; updatedAt: number } | null>(null);
  const [showReset, setShowReset] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [toast, setToast] = useState("");
  const [goal, setGoal] = useState("Speak with confidence");
  const [dailyMinutes, setDailyMinutes] = useState(20);
  const [dailyNew, setDailyNew] = useState(6);
  const [startLevel, setStartLevel] = useState<LevelId>("A1");
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const cloudUpdatedAtRef = useRef(0);
  const syncEnabledRef = useRef(false);
  const lastCloudPayloadRef = useRef("");
  const lastInteractionRef = useRef(0);

  const update = useCallback((recipe: (current: Progress) => Progress) => setProgress((current) => recipe(current)), []);

  useEffect(() => {
    let device: Progress | null = null;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(V2_STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_STORAGE_KEY);
      if (stored) device = normalizeProgress(JSON.parse(stored));
      const prefs = window.localStorage.getItem(PREFERENCES_KEY) ?? window.localStorage.getItem(V2_PREFERENCES_KEY);
      if (prefs) {
        const parsed = JSON.parse(prefs) as { libraryTab?: LibraryTab };
        if (parsed.libraryTab) window.queueMicrotask(() => setLibraryTab(parsed.libraryTab!));
      }
    } catch { /* A damaged browser copy must never prevent Dilo from opening. */ }
    const route = window.location.hash.replace("#", "") as View;
    window.queueMicrotask(() => {
      if (["today", "course", "practice", "library", "checkpoint", "progress"].includes(route)) setView(route);
      if (device) setProgress(device);
      setReady(true);
      lastInteractionRef.current = Date.now();
    });

    const sitesHost = window.location.hostname.endsWith(".chatgpt.site") || window.location.hostname === "localhost";
    if (sitesHost) {
      void fetch("/api/progress", { cache: "no-store", headers: { accept: "application/json" } }).then(async (response) => {
        if (!response.ok) throw new Error("device-only");
        const result = await response.json() as { available?: boolean; user?: { displayName?: string; email?: string }; progress?: unknown; updatedAt?: number };
        if (!result.available) throw new Error("device-only");
        const remoteUpdatedAt = Number(result.updatedAt) || 0;
        cloudUpdatedAtRef.current = remoteUpdatedAt;
        syncEnabledRef.current = true;
        setAccount({ mode: "signed-in", displayName: result.user?.displayName, email: result.user?.email });
        if (result.progress) {
          const remote = normalizeProgress(result.progress);
          const localSavedAt = Number(window.localStorage.getItem(STORAGE_TIME_KEY) ?? window.localStorage.getItem(V2_STORAGE_TIME_KEY)) || 0;
          const localRaw = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(V2_STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_STORAGE_KEY);
          const local = localRaw ? normalizeProgress(JSON.parse(localRaw)) : normalizeProgress(null);
          if (localSavedAt > remoteUpdatedAt && local.xp > 0 && JSON.stringify(local) !== JSON.stringify(remote)) {
            setRemoteConflict({ progress: remote, updatedAt: remoteUpdatedAt }); setProgress(local); setSyncStatus("conflict"); return;
          }
          setProgress(remote); window.localStorage.setItem(STORAGE_KEY, JSON.stringify(remote)); window.localStorage.setItem(STORAGE_TIME_KEY, String(remoteUpdatedAt)); lastCloudPayloadRef.current = JSON.stringify(remote);
        }
        setSyncStatus("synced");
      }).catch(() => { setAccount({ mode: "device" }); setSyncStatus("device"); });
    } else { window.queueMicrotask(() => { setAccount({ mode: "device" }); setSyncStatus("device"); }); }
    if ("serviceWorker" in navigator) {
      const workerUrl = new URL("./sw.js", window.location.href);
      const workerScope = new URL("./", window.location.href);
      navigator.serviceWorker.register(workerUrl.pathname, { scope: workerScope.pathname }).catch(() => undefined);
    }
    const captureInstall = (event: Event) => { event.preventDefault(); setInstallPrompt(event as InstallPrompt); };
    window.addEventListener("beforeinstallprompt", captureInstall);
    return () => window.removeEventListener("beforeinstallprompt", captureInstall);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    window.localStorage.setItem(STORAGE_TIME_KEY, String(Date.now()));
    window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify({ libraryTab }));
  }, [libraryTab, progress, ready]);

  useEffect(() => {
    if (!ready || !syncEnabledRef.current || remoteConflict) return;
    const payload = JSON.stringify(progress);
    if (payload === lastCloudPayloadRef.current) return;
    const timeout = window.setTimeout(() => {
      setSyncStatus("saving");
      void fetch("/api/progress", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ progress, expectedUpdatedAt: cloudUpdatedAtRef.current }) }).then(async (response) => {
        const result = await response.json() as { conflict?: boolean; progress?: unknown; updatedAt?: number };
        if (response.status === 409 && result.conflict && result.progress) { setRemoteConflict({ progress: normalizeProgress(result.progress), updatedAt: Number(result.updatedAt) || 0 }); setSyncStatus("conflict"); return; }
        if (!response.ok) throw new Error("sync failed");
        cloudUpdatedAtRef.current = Number(result.updatedAt) || cloudUpdatedAtRef.current; lastCloudPayloadRef.current = payload; window.localStorage.setItem(STORAGE_TIME_KEY, String(cloudUpdatedAtRef.current)); setSyncStatus("synced");
      }).catch(() => setSyncStatus("error"));
    }, 900);
    return () => window.clearTimeout(timeout);
  }, [progress, ready, remoteConflict]);

  useEffect(() => {
    if (!ready) return;
    const interact = () => { lastInteractionRef.current = Date.now(); };
    ["pointerdown", "keydown", "touchstart"].forEach((name) => window.addEventListener(name, interact, { passive: true }));
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible" && document.hasFocus() && Date.now() - lastInteractionRef.current < 60000) update((current) => recordTrainingSeconds(current, 15));
    }, 15000);
    return () => { window.clearInterval(timer); ["pointerdown", "keydown", "touchstart"].forEach((name) => window.removeEventListener(name, interact)); };
  }, [ready, update]);

  useEffect(() => {
    window.location.hash = view;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [view]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 2500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const archive = getArchive(progress);
  const plan = archive.currentPlan!;
  const level = levels[progress.selectedLevel];
  const mission = missionsByLevel[progress.selectedLevel][plan.missionIndex];
  const planComplete = Boolean(plan.completedOn);
  const catchUpAvailable = canAdvanceCatchUp(progress);
  const dayProgress = percent(plan.completedSteps.length, 7);
  const bestExam = archive.examHistory.reduce((best, item) => Math.max(best, item.score), 0);
  const graduation = graduationStatus(progress);
  const corrections = dueCorrections(progress);
  const skillAreas: SkillArea[] = ["vocabulary", "grammar", "listening", "reading", "sentence", "speaking", "pronunciation"];
  const studyHistory = [...(progress.studyHistory[progress.selectedLevel] ?? [])].reverse();
  const confidentWords = lexiconByLevel[progress.selectedLevel].filter((item) => (progress.wordConfidence[item.id] ?? 0) >= 3).length;

  const filteredLibrary = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("es");
    const wordPool = allLexicon.filter((item) => levelOrder.indexOf(item.level) <= levelOrder.indexOf(progress.selectedLevel));
    const grammarPool = allGrammar.filter((item) => levelOrder.indexOf(item.level) <= levelOrder.indexOf(progress.selectedLevel));
    const missionPool = allMissions.filter((item) => levelOrder.indexOf(item.level) <= levelOrder.indexOf(progress.selectedLevel));
    const soundPool = soundLessons.filter((item) => levelOrder.indexOf(item.level) <= levelOrder.indexOf(progress.selectedLevel));
    if (!query) return { words: wordPool, grammar: grammarPool, missions: missionPool, sounds: soundPool };
    const includes = (...values: string[]) => values.join(" ").toLocaleLowerCase("es").includes(query);
    return {
      words: wordPool.filter((item) => includes(item.spanish, item.english, item.cue)),
      grammar: grammarPool.filter((item) => includes(item.title, item.formula, item.explanation, item.example, item.translation)),
      missions: missionPool.filter((item) => includes(item.title, item.domain, item.canDo, item.model, item.translation)),
      sounds: soundPool.filter((item) => includes(item.title, item.focus, item.tip, ...item.examples)),
    };
  }, [progress.selectedLevel, search]);

  function navigate(next: View) { setView(next); }
  function openDaily() {
    if (planComplete) {
      if (!canAdvanceCatchUp(progress)) { setToast("Today’s learning session is complete"); return; }
      setProgress((current) => advanceCatchUpSession(current));
    }
    setCoachOpen(true);
  }
  function resolveConflict(choice: "device" | "cloud") {
    if (!remoteConflict) return;
    if (choice === "cloud") { window.localStorage.setItem(RECOVERY_KEY, JSON.stringify({ savedAt: Date.now(), progress })); setProgress(remoteConflict.progress); cloudUpdatedAtRef.current = remoteConflict.updatedAt; lastCloudPayloadRef.current = JSON.stringify(remoteConflict.progress); setRemoteConflict(null); setSyncStatus("synced"); return; }
    cloudUpdatedAtRef.current = remoteConflict.updatedAt; lastCloudPayloadRef.current = ""; setRemoteConflict(null); setSyncStatus("saving"); setProgress((current) => ({ ...current }));
  }
  function exportProgress() {
    const blob = new Blob([JSON.stringify({ app: "Dilo", version: APP_VERSION, exportedAt: new Date().toISOString(), progress }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `dilo-spanish-${localDate()}.json`; link.click(); URL.revokeObjectURL(url); setToast("Progress backup downloaded");
  }
  async function importProgress(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = ""; if (!file) return;
    try { const parsed = JSON.parse(await file.text()) as { app?: string; progress?: unknown }; if (parsed.app !== "Dilo" || !parsed.progress) throw new Error("format"); setProgress(normalizeProgress(parsed.progress)); setToast("Dilo progress restored"); } catch { setToast("That file is not a Dilo backup"); }
  }
  function resetProgress() { setProgress(normalizeProgress({ version: 3, onboarded: true, goal: progress.goal, dailyMinutes: progress.dailyMinutes, dailyNew: progress.dailyNew })); setShowReset(false); setView("today"); setToast("Progress reset"); }
  async function installApp() { if (!installPrompt) return; await installPrompt.prompt(); await installPrompt.userChoice; setInstallPrompt(null); }

  if (!ready) return <main className="loading-screen"><div className="loading-sun"><span>di</span></div><p>Preparando tu camino…</p></main>;
  if (coachOpen) return <DailyCoach progress={progress} update={update} close={() => setCoachOpen(false)} openGrammarLibrary={() => { setCoachOpen(false); setLibraryTab("grammar"); setView("library"); }} />;
  if (drill) return <DrillSession progress={progress} update={update} kind={drill} close={() => setDrill(null)} />;
  if (correctionsOpen) return <CorrectionLab progress={progress} update={update} close={() => setCorrectionsOpen(false)} />;
  if (examOpen) return <Checkpoint progress={progress} update={update} close={() => setExamOpen(false)} />;
  if (replay) return <StudyReplay day={replay} close={() => { setProgress((current) => recordStudyDayReplay(current, replay.level, replay.id)); setReplay(null); }} />;

  return <div className="app-shell"><header className="site-header"><button className="brand" onClick={() => navigate("today")} aria-label="Dilo home"><span className="brand-mark"><i>di</i><b /></span><span><strong>Dilo</strong><small>Spanish from first words to fluency</small></span></button><div className="header-level"><button onClick={() => navigate("course")}><span>{progress.selectedLevel}</span><b>{level.name}</b></button></div><div className="header-status"><span className={`sync-dot ${syncStatus}`} /><span>{syncStatus === "synced" ? "Cloud saved" : syncStatus === "saving" || syncStatus === "checking" ? "Saving…" : syncStatus === "conflict" ? "Choose a copy" : "On this device"}</span><b>{progress.streak} day{progress.streak === 1 ? "" : "s"}</b></div></header>

    {account.mode === "device" && <div className="device-banner" role="status"><div><strong>Public device copy</strong><span>Progress stays in this browser. Export a backup or use the synced app.</span></div><a href={SYNCED_APP_URL}>Open synced Dilo →</a></div>}

    <main className="main-content">
      {view === "today" && <section className="today-view view-enter"><div className="today-hero"><div className="hero-copy"><span className="eyebrow">HOY · {progress.selectedLevel} · LEARNING DAY {plan.learningDay + 1}</span><h1>Speak sooner.<br />Grow into <em>fluency.</em></h1><p>Dilo trains one connected ability: remember useful Spanish, understand it at speed, shape accurate sentences, and carry a real exchange aloud.</p><div className="hero-meta"><span>{progress.goal}</span><span>{progress.dailyMinutes} minute rhythm</span><span>{progress.dailyNew} new lexical chunks</span></div></div><div className="hero-art" aria-hidden="true"><span>¡</span><b>DI</b><i>LO!</i><em /></div></div>
        <div className="today-grid"><article className="next-card daily-card"><div className="card-topline"><span>{planComplete ? "SESSION COMPLETE" : `NEXT · ${plan.completedSteps.length + 1} OF 7`}</span><small>{dayProgress}% of this session</small></div><span className="route-number">{String(plan.learningDay + 1).padStart(2, "0")}</span><div className="route-copy"><span>{level.milestone} · {mission.domain}</span><h2>{mission.title}</h2><p>{mission.situation} Today moves through cards, graded recall, grammar variation, listening, building, reading, and a four-line speaking mission.</p><button className="primary-action" onClick={openDaily} disabled={planComplete && !catchUpAvailable}>{planComplete ? catchUpAvailable ? "Continue with today’s catch-up session" : "Learning session complete" : plan.completedSteps.length ? "Resume exact step" : "Begin today"}<span>→</span></button>{catchUpAvailable && <small className="catchup-note">You finished a session begun on an earlier date. One fresh session is available today—no backlog was created.</small>}</div><div className="route-progress"><i style={{ width: `${Math.max(4, dayProgress)}%` }} /></div></article><aside className="today-side"><article className="rhythm-card"><div className="mini-sun"><span>{progress.streak}</span></div><div><small>CURRENT RHYTHM</small><strong>{progress.streak} day{progress.streak === 1 ? "" : "s"}</strong><p>Unfinished work resumes exactly. Missed days never create a lesson backlog.</p></div></article><article className="quick-card"><span>DUE NOW</span><h3>{corrections.length ? `${corrections.length} correction${corrections.length === 1 ? "" : "s"} waiting.` : "Your correction queue is clear."}</h3><div><button onClick={() => setCorrectionsOpen(true)}><b>↺</b><span>Correction loop<small>Correct now, then once on a later day</small></span><i>→</i></button><button onClick={() => setDrill("listening")}><b>OÍ</b><span>Listening sprint<small>20 items · normal-speed audio</small></span><i>→</i></button></div></article></aside></div>
        <div className="daily-map">{(["Cards", "Recall", "Grammar", "Listen", "Build", "Read", "Speak"] as const).map((label, index) => <article key={label} className={index < plan.completedSteps.length ? "done" : index === plan.completedSteps.length ? "next" : ""}><span>{index < plan.completedSteps.length ? "✓" : index + 1}</span><b>{label}</b><small>{["meet", "retrieve", "notice", "understand", "assemble", "connect", "perform"][index]}</small></article>)}</div>
        <div className="scope-strip fluency-scope"><span>THE COMPLETE DILO PATH</span><div><strong>{curriculumTotals.levels}</strong><small>CEFR levels</small></div><div><strong>{curriculumTotals.guidedSessions}</strong><small>guided days</small></div><div><strong>{curriculumTotals.missions}</strong><small>real missions</small></div><div><strong>{curriculumTotals.lexicon}</strong><small>core chunks</small></div><button onClick={() => navigate("course")}>See A1 → C2 →</button></div>
        <article className="fluency-note"><span>B2 IS THE CONVERSATIONAL FLUENCY THRESHOLD</span><h2>The path continues after “fluent.”</h2><p>At B2, regular interaction can become spontaneous and relatively unstrained. C1 develops flexible advanced fluency; C2 develops nuanced mastery. Dilo supplies a guided core—not a promise that app completion alone replaces hundreds of hours of real listening, reading, writing, and conversation.</p></article>
      </section>}

      {view === "course" && <section className="path-view view-enter"><div className="section-intro"><span className="eyebrow">LA RUTA · CEFR A1 TO C2</span><h1>Survival first.<br /><em>Nuance last.</em></h1><p>Each level contains 12 real-world missions. Every mission runs through establish, vary, and perform. Start where your Spanish honestly belongs, then finish the core, clear corrections, and score 80% to graduate that level.</p></div><div className="cefr-road">{levelOrder.map((id) => { const meta = levels[id]; const itemArchive = progress.archives[id]; const sessions = itemArchive?.missionSessionCount ?? 0; const complete = progress.graduatedLevels.includes(id); const active = progress.selectedLevel === id; return <article key={id} className={`cefr-level ${meta.color} ${complete ? "complete" : ""} ${active ? "active" : ""}`}><div className="cefr-code"><span>{complete ? "✓" : id}</span><small>{meta.milestone}</small></div><div><span>{meta.name}</span><h2>{meta.promise}</h2><p>{meta.description}</p><ul><li>12 missions × 3 phases</li><li>{lexiconByLevel[id].length} core lexical chunks</li><li>{grammarByLevel[id].length} grammar systems</li><li>{levelSoundLessons(id).length} pronunciation labs</li></ul><div className="level-meter"><i><em style={{ width: `${Math.min(100, sessions / 36 * 100)}%` }} /></i><small>{Math.min(36, sessions)}/36 guided sessions</small></div><p className="outside-work">Beyond Dilo: {meta.outsideHours}</p></div><button disabled={active} onClick={() => setProgress((current) => switchLevel(current, id))}>{active ? "Current level" : complete ? `Review ${id}` : `Start at ${id}`}</button></article>; })}</div><div className="mission-map"><div><span className="eyebrow">{progress.selectedLevel} · MISSION MAP</span><h2>Twelve things you will be able to do.</h2></div><div>{missionsByLevel[progress.selectedLevel].map((item, index) => { const phase = Math.max(0, Math.min(3, archive.missionSessionCount - index * 3)); return <article key={item.id}><span>{String(index + 1).padStart(2, "0")} · {item.domain}</span><h3>{item.title}</h3><p>{item.canDo}</p><i>{[0, 1, 2].map((dot) => <b key={dot} className={dot < phase ? "done" : ""} />)}</i></article>; })}</div></div></section>}

      {view === "practice" && <section className="practice-view view-enter"><div className="section-intro compact"><span className="eyebrow">PRÁCTICA · DELIBERATE WORK</span><h1>Train the weak link.<br /><em>Then reconnect it.</em></h1><p>Practice sets are separate from today’s teaching cadence. They add retrieval and feedback without moving the learning-day scheduler.</p></div><div className="practice-grid expanded"><button className="practice-card clay" onClick={() => setDrill("recall")}><span>01 · RETRIEVAL</span><b>RE</b><h2>Recall sprint</h2><p>English-to-Spanish retrieval across the current level’s lexical core.</p><small>12 prompts · corrections on every miss</small></button><button className="practice-card blue" onClick={() => setDrill("listening")}><span>02 · EAR</span><b>OÍ</b><h2>Listening bank</h2><p>Understand connected mission lines and high-frequency chunks before seeing them.</p><small>20 prompts · normal-speed audio</small></button><button className="practice-card olive" onClick={() => setDrill("sentences")}><span>03 · FORM</span><b>DI</b><h2>Sentence lab</h2><p>Connect grammar meaning to complete, useful Spanish sentences.</p><small>16 prompts · mixed grammar</small></button><button className="practice-card gold" onClick={() => setDrill("grammar")}><span>04 · GRAMMAR MIXER</span><b>±</b><h2>Meaning-linked patterns</h2><p>Change subjects, endings, and ideas while conjugation and agreement stay connected.</p><small>4 generative rounds · speak every line</small></button><button className="practice-card plum" onClick={() => setDrill("reading")}><span>05 · READING</span><b>LE</b><h2>Graded reading bank</h2><p>Read dialogues and structures for meaning, with audio available after the attempt.</p><small>16 prompts · cumulative comprehension</small></button><button className="practice-card gold" onClick={() => setDrill("pronunciation")}><span>06 · PRONUNCIATION</span><b>R</b><h2>Sound & rhythm gym</h2><p>Discriminate, model, and produce Spanish vowels, stress, linking, and prosody.</p><small>{levelSoundLessons(progress.selectedLevel).flatMap((item) => item.examples).length} listen-and-speak targets</small></button><button className="practice-card ink" onClick={() => setCorrectionsOpen(true)}><span>07 · CORRECTIONS</span><b>↺</b><h2>Correction loop</h2><p>Every objective miss returns until retrieved correctly on two learning days.</p><small>{corrections.length} due · {progress.corrections.filter((item) => item.level === progress.selectedLevel).length} pending</small></button><button className="practice-card plum" onClick={() => setExamOpen(true)}><span>08 · CHECKPOINT</span><b>40</b><h2>{progress.selectedLevel} checkpoint</h2><p>Twenty listening and twenty reading/usage questions under a forty-minute clock.</p><small>Navigate freely · 80% target · best {bestExam || "—"}{bestExam ? "%" : ""}</small></button></div><div className="skill-panel"><div><span className="eyebrow">YOUR SEVEN-SKILL SIGNAL</span><h2>Accuracy by what you actually do.</h2><p>Coverage never pretends to be mastery. These scores come only from answers and performances you submit.</p></div><div>{skillAreas.map((skill) => <article key={skill}><span>{skill}</span><strong>{skillAccuracy(progress, skill) || "—"}{skillAccuracy(progress, skill) ? "%" : ""}</strong><i><em style={{ width: `${skillAccuracy(progress, skill)}%` }} /></i></article>)}</div></div></section>}

      {view === "library" && <section className="library-view view-enter"><div className="library-head"><div><span className="eyebrow">A MANO · SEARCHABLE REFERENCE</span><h1>Words, structures,<br /><em>missions, sounds.</em></h1></div><label><span>Search Spanish or English through {progress.selectedLevel}</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Try: agreement, aunque, travel…" /></label></div><div className="library-tabs four" role="tablist">{(["words", "grammar", "missions", "sounds"] as LibraryTab[]).map((tab) => <button key={tab} role="tab" aria-selected={libraryTab === tab} className={libraryTab === tab ? "active" : ""} onClick={() => setLibraryTab(tab)}>{tab}<span>{filteredLibrary[tab].length}</span></button>)}</div>{libraryTab === "words" && <div className="word-library">{filteredLibrary.words.map((item) => <button key={item.id} onClick={() => speakSpanish(item.spanish)}><span><small>{item.level} · LEXICAL CHUNK</small><strong>{item.spanish}</strong><b>{item.cue}</b></span><p>{item.english}</p><i>◖))</i></button>)}</div>}{libraryTab === "grammar" && <div className="grammar-library">{filteredLibrary.grammar.map((item) => <article key={item.id}><span>{item.level} · {item.title}</span><h3>{item.formula}</h3><p>{item.explanation}</p><button onClick={() => speakSpanish(item.example)}>◖)) {item.example}</button><small>{item.translation}</small></article>)}</div>}{libraryTab === "missions" && <div className="mission-library">{filteredLibrary.missions.map((item) => <article key={item.id}><span>{item.level} · {item.domain}</span><h3>{item.title}</h3><p>{item.canDo}</p><button onClick={() => speakSpanish(item.model)}><strong>{item.model}</strong><small>{item.translation}</small><i>◖))</i></button></article>)}</div>}{libraryTab === "sounds" && <div className="sound-library">{filteredLibrary.sounds.map((item) => <article key={item.id}><span>{item.level} · SOUND & RHYTHM</span><h3>{item.title}</h3><b>{item.focus}</b><p>{item.tip}</p><div>{item.examples.map((example) => <button key={example} onClick={() => { speakSpanish(example, .7); update((current) => recordSkill(current, "pronunciation", true)); }}>{example}<i>◖))</i></button>)}</div></article>)}</div>}</section>}

      {view === "checkpoint" && <section className="checkpoint-view view-enter"><div className="checkpoint-hero"><span>{progress.selectedLevel} · READINESS</span><h1>Graduation is<br /><em>five pieces, not one score.</em></h1><p>Dilo checks introduced vocabulary, introduced grammar, mission performance, an empty correction queue, and a timed checkpoint. This prevents recognition alone from masquerading as usable Spanish.</p><button className="primary-action" onClick={() => setExamOpen(true)}>Take 40-question checkpoint <span>→</span></button></div><div className="requirements">{graduation.requirements.map((item, index) => <article key={item.label} className={item.met ? "met" : ""}><span>{item.met ? "✓" : index + 1}</span><div><small>{item.label}</small><strong>{item.current} / {item.target}</strong></div><i><em style={{ width: `${Math.min(100, item.current / item.target * 100)}%` }} /></i></article>)}</div><article className={`graduation-card ${graduation.ready ? "ready" : ""}`}><div><span>{graduation.ready ? "READY TO ADVANCE" : "KEEP BUILDING"}</span><h2>{graduation.ready ? `${progress.selectedLevel} is complete.` : `${graduation.requirements.filter((item) => !item.met).length} requirements remain.`}</h2><p>{progress.selectedLevel === "B2" ? "Completing B2 marks the conversational fluency threshold; C1 and C2 remain available for advanced fluency and mastery." : level.description}</p></div><div className="graduation-actions"><button disabled={!graduation.ready} onClick={() => setProgress((current) => { const completedLevel = current.selectedLevel; return switchLevel(graduateLevel(current), completedLevel); })}>Graduate and stay here</button><button className="primary-action" disabled={!graduation.ready} onClick={() => setProgress((current) => graduateLevel(current))}>{progress.selectedLevel === "C2" ? "Mark mastery complete" : `Graduate and enter next level`} <span>→</span></button></div></article><div className="exam-history"><span className="eyebrow">CHECKPOINT HISTORY</span>{archive.examHistory.length ? <div>{archive.examHistory.map((item, index) => <article key={`${item.at}-${index}`} className={item.score >= 80 ? "pass" : ""}><strong>{item.score}%</strong><span>{item.correct}/{item.total}</span><small>{item.at.startsWith("legacy") ? "Imported attempt" : new Date(item.at).toLocaleDateString()}</small></article>)}</div> : <p>No attempts yet. Take the checkpoint when you want a baseline; it does not consume your daily session.</p>}</div></section>}

      {view === "progress" && <section className="progress-view view-enter">
        <div className="section-intro compact"><span className="eyebrow">TU RITMO · HONEST PROGRESS</span><h1>Useful Spanish,<br /><em>adding up.</em></h1><p>Dilo distinguishes exposure, recall confidence, retrieval accuracy, active study time, and demonstrated mission performance.</p></div>
        <div className="stat-cards"><article><span>DÍAS</span><strong>{progress.streak}</strong><p>calendar rhythm</p></article><article><span>ACTIVO</span><strong>{formatDuration(progress.trainingSeconds)}</strong><p>focused study time</p></article><article><span>CONFIANZA</span><strong>{confidentWords}</strong><p>chunks recalled 3+ times</p></article><article><span>EXAMEN</span><strong>{bestExam || "—"}{bestExam ? "%" : ""}</strong><p>best checkpoint</p></article></div>
        <div className="coverage-panel"><div><span className="eyebrow">{progress.selectedLevel} COVERAGE</span><h2>{level.milestone}</h2><p>{level.promise}</p></div><div className="coverage-bars"><div><span>Lexical core introduced <b>{archive.learnedWordIds.length}/{lexiconByLevel[progress.selectedLevel].length}</b></span><i><em style={{ width: `${percent(archive.learnedWordIds.length, lexiconByLevel[progress.selectedLevel].length)}%` }} /></i></div><div><span>Grammar introduced <b>{archive.learnedGrammarIds.length}/{grammarByLevel[progress.selectedLevel].length}</b></span><i><em style={{ width: `${percent(archive.learnedGrammarIds.length, grammarByLevel[progress.selectedLevel].length)}%` }} /></i></div><div><span>Mission sessions <b>{Math.min(36, archive.missionSessionCount)}/36</b></span><i><em style={{ width: `${Math.min(100, archive.missionSessionCount / 36 * 100)}%` }} /></i></div></div></div>
        <div className="progress-bottom"><article className={`cloud-card ${syncStatus}`}><span className="sync-dot" /><div><small>{account.mode === "signed-in" ? "SIGNED-IN PROGRESS" : "DEVICE PROGRESS"}</small><h3>{syncStatus === "synced" ? "Your exact learning step follows you." : syncStatus === "conflict" ? "Two progress copies need a choice." : account.mode === "device" ? "Safe in this browser." : "Checking your saved copy…"}</h3><p>{account.mode === "signed-in" ? `${account.displayName ?? account.email ?? "Your account"} · private positions, scheduler, corrections, and exact study history` : "The public GitHub Pages copy is local-only. Export a backup or open the synced Sites release."}</p>{account.mode === "device" && <a href={`${SYNCED_APP_URL}/#progress`}>Open synced Dilo →</a>}</div></article><article className="backup-card"><small>OWN YOUR COPY · v{APP_VERSION}</small><h3>Backup, install, restore</h3><p>Exports include every CEFR archive, exact queue position, review schedule, correction, replay, and checkpoint.</p><div><button onClick={exportProgress}>Export</button><button onClick={() => importRef.current?.click()}>Import</button>{installPrompt ? <button onClick={() => void installApp()}>Install</button> : <button onClick={() => setShowInstallHelp(true)}>Install help</button>}<button className="danger" onClick={() => setShowReset(true)}>Reset</button></div><input ref={importRef} type="file" accept="application/json" onChange={(event) => void importProgress(event)} hidden /></article></div>
        <div className="active-days"><span className="eyebrow">RECENT ACTIVE DAYS</span><div>{Array.from({ length: 42 }, (_, index) => { const date = new Date(); date.setDate(date.getDate() - (41 - index)); const key = localDate(date); return <i key={key} className={progress.activeDays.includes(key) ? "active" : ""} title={key} />; })}</div><p>Active time counts only while Dilo is visible, focused, and you interacted within the last minute.</p></div>
        <div className="study-history"><div><span className="eyebrow">EXACT STUDY HISTORY · {progress.selectedLevel}</span><h2>Repeat the day you actually studied.</h2><p>Each snapshot keeps its vocabulary queue, grammar queue, mission, phase, and completed steps. Replays do not move scheduling or XP.</p></div>{studyHistory.length ? <div>{studyHistory.slice(0, 18).map((day) => <article key={day.id}><span><b>{new Date(`${day.completedOn}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</b><small>{day.level} · learning day {day.learningDay + 1}</small></span><div><strong>{missionsByLevel[day.level][day.missionIndex]?.title}</strong><small>{day.completedSteps.length}/7 steps · {day.recallWordIds.length} recall · {day.grammarIds.length} grammar</small></div><button onClick={() => setReplay(day)}>Replay{day.replayCount ? ` · ${day.replayCount}×` : ""}</button></article>)}</div> : <p className="empty-history">Finish your first complete learning loop and its exact snapshot will appear here.</p>}</div>
      </section>}
    </main>

    <nav className="main-nav" aria-label="Primary navigation"><button className={view === "today" ? "active" : ""} onClick={() => navigate("today")}><span>HOY</span><small>Today</small></button><button className={view === "course" ? "active" : ""} onClick={() => navigate("course")}><span>A→C</span><small>Course</small></button><button className={view === "practice" ? "active" : ""} onClick={() => navigate("practice")}><span>DI</span><small>Practice</small></button><button className={view === "library" ? "active" : ""} onClick={() => navigate("library")}><span>ABC</span><small>Library</small></button><button className={view === "checkpoint" ? "active" : ""} onClick={() => navigate("checkpoint")}><span>40</span><small>Check</small></button><button className={view === "progress" ? "active" : ""} onClick={() => navigate("progress")}><span>+</span><small>Progress</small></button></nav>

    {!progress.onboarded && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="welcome-title"><div className="onboarding-card expanded"><div className="onboarding-sun"><span>di</span></div><span className="eyebrow">A1 → C2 · YOUR FIRST LEARNING DAY</span><h2 id="welcome-title">Spanish that leaves<br /><em>the textbook.</em></h2><p>Dilo is a complete learning loop, not a list of quizzes. Every day moves from exposure to retrieval, form, comprehension, sentence building, reading, speaking, and correction.</p><fieldset><legend>What brings you here?</legend><div>{["Speak with confidence", "Travel and connect", "Reach professional fluency"].map((item) => <button key={item} className={goal === item ? "active" : ""} onClick={() => setGoal(item)}>{item}</button>)}</div></fieldset><fieldset><legend>Where should the guided path begin?</legend><div>{levelOrder.map((item) => <button key={item} className={startLevel === item ? "active" : ""} onClick={() => setStartLevel(item)}><strong>{item}</strong><span>{levels[item].milestone}</span></button>)}</div></fieldset><fieldset><legend>Focused daily rhythm</legend><div>{[10, 20, 30].map((minutes) => <button key={minutes} className={dailyMinutes === minutes ? "active" : ""} onClick={() => setDailyMinutes(minutes)}><strong>{minutes}</strong><span>min</span></button>)}</div></fieldset><fieldset><legend>New lexical chunks per learning day</legend><div>{[5, 8, 10].map((count) => <button key={count} className={dailyNew === count ? "active" : ""} onClick={() => setDailyNew(count)}><strong>{count}</strong><span>new</span></button>)}</div></fieldset><button className="primary-action" onClick={() => setProgress((current) => switchLevel({ ...current, onboarded: true, goal, dailyMinutes, dailyNew }, startLevel))}>Begin at {startLevel} <span>→</span></button><small>Not sure? Begin at A1, or take the checkpoint after onboarding for a baseline. You can switch levels without erasing any archive.</small></div></div>}
    {remoteConflict && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="conflict-title"><div className="conflict-card"><span className="eyebrow">SYNC PROTECTION</span><h2 id="conflict-title">Two copies were found.</h2><p>Nothing has been overwritten. Keep this device’s {progress.xp} XP at {progress.selectedLevel}, or restore the cloud copy with {remoteConflict.progress.xp} XP at {remoteConflict.progress.selectedLevel}.</p><div><button onClick={() => resolveConflict("device")}><strong>This device</strong><span>{progress.selectedLevel} · {progress.xp} XP</span></button><button onClick={() => resolveConflict("cloud")}><strong>Cloud copy</strong><span>{remoteConflict.progress.selectedLevel} · {remoteConflict.progress.xp} XP</span></button></div><small>The copy you do not choose is retained as recovery history.</small></div></div>}
    {showReset && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="reset-title"><div className="reset-card"><span>¿?</span><h2 id="reset-title">Reset the entire A1–C2 path?</h2><p>This clears every level archive, review schedule, correction, and checkpoint. Export first if you may want it later.</p><div><button onClick={() => setShowReset(false)}>Keep my progress</button><button className="danger" onClick={resetProgress}>Reset everything</button></div></div></div>}
    {showInstallHelp && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="install-title"><div className="install-card"><span className="eyebrow">INSTALL DILO</span><h2 id="install-title">Keep Spanish one tap away.</h2><p>The browser has not offered its automatic install prompt. Use the option for your device:</p><ol><li><strong>iPhone or iPad:</strong> open Share, then choose “Add to Home Screen.”</li><li><strong>Android:</strong> open the browser menu, then choose “Install app” or “Add to Home screen.”</li><li><strong>Desktop Chrome or Edge:</strong> use the install icon in the address bar or choose “Install Dilo” from the browser menu.</li></ol><button className="primary-action" onClick={() => setShowInstallHelp(false)}>Got it <span>✓</span></button></div></div>}
    {toast && <div className="toast" role="status">{toast}</div>}
  </div>;
}
