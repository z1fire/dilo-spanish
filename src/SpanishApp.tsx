"use client";

import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  checkpointQuestions,
  courseUnits,
  curriculumTotals,
  patterns,
  phrases,
  situationPrompts,
  vocabulary,
  type CourseUnit,
  type Pattern,
  type Word,
} from "./spanish-data";
import "./spanish.css";

type View = "today" | "path" | "practice" | "phrasebook" | "progress";
type LibraryTab = "phrases" | "words" | "patterns";
type SyncStatus = "checking" | "saving" | "synced" | "device" | "error" | "conflict";
type Account = { mode: "checking" | "signed-in" | "device"; displayName?: string; email?: string };
type Question = {
  prompt: string;
  note: string;
  options: readonly string[];
  answer: string;
  speech?: string;
  skill: "Words" | "Meaning" | "Patterns" | "Listening" | "Situations";
  sourceId: string;
  explanation?: string;
  listening?: boolean;
};
type Session = {
  title: string;
  eyebrow: string;
  questions: Question[];
  kind: "unit" | "drill" | "checkpoint";
  unit?: number;
};

type Progress = {
  version: 1;
  onboarded: boolean;
  dailyGoal: number;
  goal: string;
  xp: number;
  streak: number;
  lastStudyDate: string;
  activeDays: string[];
  completedUnits: number[];
  learnedWords: string[];
  learnedPatterns: string[];
  practicedPhrases: string[];
  reviewCount: number;
  correctCount: number;
  checkpointScores: number[];
};

const STORAGE_KEY = "dilo:spanish-a1:progress:v1";
const STORAGE_TIME_KEY = "dilo:spanish-a1:saved-at:v1";
const PREFERENCES_KEY = "dilo:spanish-a1:preferences:v1";
const RECOVERY_KEY = "dilo:spanish-a1:recovery:v1";
const SYNCED_APP_URL = "https://dilo-spanish-a1.z1ifre.chatgpt.site";

function todayKey() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());
}

function starterProgress(): Progress {
  return {
    version: 1,
    onboarded: false,
    dailyGoal: 10,
    goal: "Speak with confidence",
    xp: 0,
    streak: 0,
    lastStudyDate: "",
    activeDays: [],
    completedUnits: [],
    learnedWords: [],
    learnedPatterns: [],
    practicedPhrases: [],
    reviewCount: 0,
    correctCount: 0,
    checkpointScores: [],
  };
}

function normalizeProgress(value: unknown): Progress {
  const base = starterProgress();
  if (!value || typeof value !== "object") return base;
  const raw = value as Partial<Progress>;
  const strings = (item: unknown) => Array.isArray(item) ? item.filter((entry): entry is string => typeof entry === "string") : [];
  const numbers = (item: unknown) => Array.isArray(item) ? item.filter((entry): entry is number => typeof entry === "number" && Number.isFinite(entry)) : [];
  return {
    ...base,
    ...raw,
    version: 1,
    onboarded: Boolean(raw.onboarded),
    dailyGoal: [5, 10, 15].includes(Number(raw.dailyGoal)) ? Number(raw.dailyGoal) : 10,
    goal: typeof raw.goal === "string" ? raw.goal : base.goal,
    xp: Math.max(0, Number(raw.xp) || 0),
    streak: Math.max(0, Number(raw.streak) || 0),
    lastStudyDate: typeof raw.lastStudyDate === "string" ? raw.lastStudyDate : "",
    activeDays: strings(raw.activeDays).slice(-366),
    completedUnits: numbers(raw.completedUnits),
    learnedWords: strings(raw.learnedWords),
    learnedPatterns: strings(raw.learnedPatterns),
    practicedPhrases: strings(raw.practicedPhrases),
    reviewCount: Math.max(0, Number(raw.reviewCount) || 0),
    correctCount: Math.max(0, Number(raw.correctCount) || 0),
    checkpointScores: numbers(raw.checkpointScores).slice(-20),
  };
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

function shuffled<T>(items: readonly T[], seed = Date.now()) {
  const next = [...items];
  let state = seed % 2147483647 || 1;
  for (let index = next.length - 1; index > 0; index -= 1) {
    state = state * 16807 % 2147483647;
    const target = state % (index + 1);
    [next[index], next[target]] = [next[target], next[index]];
  }
  return next;
}

function pickOptions(answer: string, pool: string[], seed: number) {
  const choices = shuffled(unique(pool.filter((item) => item !== answer)), seed).slice(0, 3);
  return shuffled([...choices, answer], seed + 97);
}

function speakSpanish(text: string, rate = 0.82) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "es-ES";
  utterance.rate = rate;
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find((item) => item.lang.toLowerCase() === "es-es")
    ?? voices.find((item) => item.lang.toLowerCase().startsWith("es"));
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}

function updateStudyDay(progress: Progress) {
  const today = todayKey();
  if (progress.lastStudyDate === today) return progress;
  const previous = new Date(`${progress.lastStudyDate || "1970-01-01"}T12:00:00`);
  const current = new Date(`${today}T12:00:00`);
  const gap = Math.round((current.getTime() - previous.getTime()) / 86400000);
  return {
    ...progress,
    lastStudyDate: today,
    streak: gap === 1 ? progress.streak + 1 : 1,
    activeDays: unique([...progress.activeDays, today]).slice(-366),
  };
}

function wordQuestion(item: Word, index: number): Question {
  return {
    prompt: item.meaning,
    note: "Choose the Spanish word",
    options: pickOptions(item.word, vocabulary.map((entry) => entry.word), item.word.length * 43 + index),
    answer: item.word,
    speech: item.word.replace("/a", "a"),
    skill: "Words",
    sourceId: `word:${item.word}`,
    explanation: item.note,
  };
}

function patternQuestion(item: Pattern, index: number): Question {
  return {
    prompt: item.meaning,
    note: "Choose the useful pattern",
    options: pickOptions(item.pattern, patterns.map((entry) => entry.pattern), item.pattern.length * 31 + index),
    answer: item.pattern,
    speech: item.example,
    skill: "Patterns",
    sourceId: `pattern:${item.pattern}`,
    explanation: `${item.example} — ${item.translation}`,
  };
}

function unitQuestions(unit: CourseUnit): Question[] {
  const words = shuffled(unit.words).slice(0, 6).map(wordQuestion);
  const meanings = shuffled(unit.dialogue).slice(0, 2).map((line, index) => ({
    prompt: line.line,
    note: "What does this mean?",
    options: pickOptions(line.translation, phrases.map((entry) => entry.translation), line.line.length * 19 + index),
    answer: line.translation,
    speech: line.line,
    skill: "Meaning" as const,
    sourceId: `phrase:${unit.id}:${unit.dialogue.indexOf(line)}`,
  }));
  const grammar = unit.patterns.map(patternQuestion);
  return shuffled([...words, ...meanings, ...grammar]).slice(0, 10);
}

function listeningQuestions(): Question[] {
  return shuffled(phrases).slice(0, 10).map((item, index) => ({
    prompt: "Escucha",
    note: "Tap the speaker, then choose what you heard",
    options: pickOptions(item.spanish, phrases.map((entry) => entry.spanish), item.spanish.length * 23 + index),
    answer: item.spanish,
    speech: item.spanish,
    skill: "Listening",
    sourceId: `phrase:${item.id}`,
    explanation: item.translation,
    listening: true,
  }));
}

function situationQuestions(): Question[] {
  return shuffled(situationPrompts).map((item, index) => ({
    prompt: item.scenario,
    note: "What would you say?",
    options: shuffled(item.options, index + 101),
    answer: item.answer,
    speech: item.answer,
    skill: "Situations",
    sourceId: `situation:${index}`,
  }));
}

export default function SpanishApp() {
  const [view, setView] = useState<View>("today");
  const [activeUnit, setActiveUnit] = useState<CourseUnit | null>(null);
  const [progress, setProgress] = useState<Progress>(starterProgress);
  const [ready, setReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("checking");
  const [account, setAccount] = useState<Account>({ mode: "checking" });
  const [remoteConflict, setRemoteConflict] = useState<{ progress: Progress; updatedAt: number } | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionFinished, setSessionFinished] = useState(false);
  const [libraryTab, setLibraryTab] = useState<LibraryTab>("phrases");
  const [search, setSearch] = useState("");
  const [goal, setGoal] = useState("Speak with confidence");
  const [dailyGoal, setDailyGoal] = useState(10);
  const [showReset, setShowReset] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const cloudUpdatedAtRef = useRef(0);
  const syncEnabledRef = useRef(false);
  const lastCloudPayloadRef = useRef("");

  useEffect(() => {
    const route = window.location.hash.replace("#", "") as View;
    let deviceProgress: Progress | null = null;
    let deviceTab: LibraryTab | null = null;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) deviceProgress = normalizeProgress(JSON.parse(stored));
      const prefs = window.localStorage.getItem(PREFERENCES_KEY);
      if (prefs) {
        const parsed = JSON.parse(prefs) as { libraryTab?: LibraryTab };
        if (parsed.libraryTab) deviceTab = parsed.libraryTab;
      }
    } catch {
      // A damaged browser copy should not stop the course from opening.
    }

    window.queueMicrotask(() => {
      if (["today", "path", "practice", "phrasebook", "progress"].includes(route)) setView(route);
      if (deviceProgress) setProgress(deviceProgress);
      if (deviceTab) setLibraryTab(deviceTab);
      setReady(true);
    });

    const isSitesApp = window.location.hostname.endsWith(".chatgpt.site") || window.location.hostname === "localhost";
    if (isSitesApp) {
      void fetch("/api/progress", { cache: "no-store", headers: { accept: "application/json" } })
        .then(async (response) => {
          if (!response.ok) throw new Error("device-only");
          const result = await response.json() as { available?: boolean; user?: { displayName?: string; email?: string }; progress?: unknown; updatedAt?: number };
          if (!result.available) throw new Error("device-only");
          const remoteUpdatedAt = Number(result.updatedAt) || 0;
          cloudUpdatedAtRef.current = remoteUpdatedAt;
          syncEnabledRef.current = true;
          setAccount({ mode: "signed-in", displayName: result.user?.displayName, email: result.user?.email });
          if (result.progress) {
            const remote = normalizeProgress(result.progress);
            const localSavedAt = Number(window.localStorage.getItem(STORAGE_TIME_KEY)) || 0;
            const localRaw = window.localStorage.getItem(STORAGE_KEY);
            const local = localRaw ? normalizeProgress(JSON.parse(localRaw)) : starterProgress();
            if (localSavedAt > remoteUpdatedAt && local.xp > 0 && JSON.stringify(local) !== JSON.stringify(remote)) {
              setRemoteConflict({ progress: remote, updatedAt: remoteUpdatedAt });
              setProgress(local);
              setSyncStatus("conflict");
              return;
            }
            setProgress(remote);
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(remote));
            window.localStorage.setItem(STORAGE_TIME_KEY, String(remoteUpdatedAt));
            lastCloudPayloadRef.current = JSON.stringify(remote);
          }
          setSyncStatus("synced");
        })
        .catch(() => {
          setAccount({ mode: "device" });
          setSyncStatus("device");
        });
    } else {
      window.queueMicrotask(() => {
        setAccount({ mode: "device" });
        setSyncStatus("device");
      });
    }

    if ("serviceWorker" in navigator) {
      const workerUrl = new URL("./sw.js", window.location.href);
      const workerScope = new URL("./", window.location.href);
      navigator.serviceWorker.register(workerUrl.pathname, { scope: workerScope.pathname }).catch(() => undefined);
    }
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
      void fetch("/api/progress", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ progress, expectedUpdatedAt: cloudUpdatedAtRef.current }),
      }).then(async (response) => {
        const result = await response.json() as { conflict?: boolean; progress?: unknown; updatedAt?: number };
        if (response.status === 409 && result.conflict && result.progress) {
          setRemoteConflict({ progress: normalizeProgress(result.progress), updatedAt: Number(result.updatedAt) || 0 });
          setSyncStatus("conflict");
          return;
        }
        if (!response.ok) throw new Error("sync failed");
        cloudUpdatedAtRef.current = Number(result.updatedAt) || cloudUpdatedAtRef.current;
        lastCloudPayloadRef.current = payload;
        window.localStorage.setItem(STORAGE_TIME_KEY, String(cloudUpdatedAtRef.current));
        setSyncStatus("synced");
      }).catch(() => setSyncStatus("error"));
    }, 1000);
    return () => window.clearTimeout(timeout);
  }, [progress, ready, remoteConflict]);

  useEffect(() => {
    window.location.hash = view;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [view]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const nextUnit = courseUnits.find((item) => !progress.completedUnits.includes(item.id));
  const coursePercent = Math.round(progress.completedUnits.length / courseUnits.length * 100);
  const accuracy = progress.reviewCount ? Math.round(progress.correctCount / progress.reviewCount * 100) : 0;
  const currentQuestion = session?.questions[questionIndex];
  const displayedScore = session ? Math.round(sessionCorrect / session.questions.length * 100) : 0;

  const libraryResults = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return null;
    if (libraryTab === "phrases") return phrases.filter((item) => `${item.spanish} ${item.translation} ${item.situation}`.toLocaleLowerCase().includes(query));
    if (libraryTab === "words") return vocabulary.filter((item) => `${item.word} ${item.meaning} ${item.note ?? ""}`.toLocaleLowerCase().includes(query));
    return patterns.filter((item) => `${item.pattern} ${item.meaning} ${item.example} ${item.translation}`.toLocaleLowerCase().includes(query));
  }, [libraryTab, search]);

  function navigate(next: View) {
    setActiveUnit(null);
    setSession(null);
    setSessionFinished(false);
    setView(next);
  }

  function openUnit(item: CourseUnit) {
    setActiveUnit(item);
    setSession(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function beginSession(next: Session) {
    setActiveUnit(null);
    setSession(next);
    setQuestionIndex(0);
    setAnswer(null);
    setSessionCorrect(0);
    setSessionFinished(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function chooseAnswer(option: string) {
    if (!currentQuestion || answer) return;
    setAnswer(option);
    const correct = option === currentQuestion.answer;
    if (correct) setSessionCorrect((value) => value + 1);
    setProgress((current) => {
      let next = updateStudyDay({
        ...current,
        xp: current.xp + (correct ? 8 : 2),
        reviewCount: current.reviewCount + 1,
        correctCount: current.correctCount + (correct ? 1 : 0),
      });
      if (correct && currentQuestion.skill === "Words") next = { ...next, learnedWords: unique([...next.learnedWords, currentQuestion.sourceId.replace("word:", "")]) };
      if (correct && currentQuestion.skill === "Patterns") next = { ...next, learnedPatterns: unique([...next.learnedPatterns, currentQuestion.sourceId.replace("pattern:", "")]) };
      if (correct && ["Meaning", "Listening"].includes(currentQuestion.skill)) next = { ...next, practicedPhrases: unique([...next.practicedPhrases, currentQuestion.sourceId.replace("phrase:", "")]) };
      return next;
    });
  }

  function advanceQuestion() {
    if (!session || !currentQuestion) return;
    if (questionIndex < session.questions.length - 1) {
      setQuestionIndex((value) => value + 1);
      setAnswer(null);
      return;
    }
    const score = Math.round(sessionCorrect / session.questions.length * 100);
    const passed = session.kind === "checkpoint" ? score >= 70 : score >= 75;
    setProgress((current) => {
      let next = updateStudyDay(current);
      if (session.kind === "unit" && session.unit && passed) {
        const completed = courseUnits.find((item) => item.id === session.unit)!;
        next = {
          ...next,
          completedUnits: unique([...next.completedUnits, session.unit]),
          learnedWords: unique([...next.learnedWords, ...completed.words.map((item) => item.word)]),
          learnedPatterns: unique([...next.learnedPatterns, ...completed.patterns.map((item) => item.pattern)]),
          practicedPhrases: unique([...next.practicedPhrases, ...completed.dialogue.map((_, index) => `${completed.id}:${index}`)]),
          xp: next.xp + 60,
        };
      }
      if (session.kind === "checkpoint") next = { ...next, checkpointScores: [...next.checkpointScores, score].slice(-20), xp: next.xp + (passed ? 100 : 30) };
      return next;
    });
    setSessionFinished(true);
  }

  function resolveConflict(choice: "device" | "cloud") {
    if (!remoteConflict) return;
    if (choice === "cloud") {
      window.localStorage.setItem(RECOVERY_KEY, JSON.stringify({ savedAt: Date.now(), progress }));
      setProgress(remoteConflict.progress);
      cloudUpdatedAtRef.current = remoteConflict.updatedAt;
      lastCloudPayloadRef.current = JSON.stringify(remoteConflict.progress);
      setRemoteConflict(null);
      setSyncStatus("synced");
      return;
    }
    cloudUpdatedAtRef.current = remoteConflict.updatedAt;
    lastCloudPayloadRef.current = "";
    setRemoteConflict(null);
    setSyncStatus("saving");
    setProgress((current) => ({ ...current }));
  }

  function exportProgress() {
    const blob = new Blob([JSON.stringify({ app: "Dilo", exportedAt: new Date().toISOString(), progress }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dilo-progress-${todayKey()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setToast("Progress backup downloaded");
  }

  async function importProgress(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as { app?: string; progress?: unknown };
      if (parsed.app !== "Dilo" || !parsed.progress) throw new Error("wrong format");
      setProgress(normalizeProgress(parsed.progress));
      setToast("Dilo progress restored");
    } catch {
      setToast("That file is not a Dilo backup");
    }
  }

  function resetProgress() {
    setProgress({ ...starterProgress(), onboarded: true, goal: progress.goal, dailyGoal: progress.dailyGoal });
    setShowReset(false);
    navigate("today");
    setToast("Progress reset");
  }

  if (!ready) {
    return <main className="loading-screen"><div className="loading-sun"><span>di</span></div><p>Preparando tu camino…</p></main>;
  }

  if (session && currentQuestion) {
    return (
      <main className="session-shell">
        <header className="session-topbar">
          <button onClick={() => setSession(null)} aria-label="Close practice">×</button>
          <div><span>{session.eyebrow}</span><strong>{session.title}</strong></div>
          <small>{questionIndex + 1} / {session.questions.length}</small>
        </header>
        <div className="session-progress"><i style={{ width: `${(questionIndex + (answer ? 1 : 0)) / session.questions.length * 100}%` }} /></div>
        {!sessionFinished ? (
          <section className="quiz-stage">
            <div className={`quiz-prompt ${currentQuestion.listening ? "listening" : ""}`}>
              <span>{currentQuestion.note}</span>
              <h1>{currentQuestion.prompt}</h1>
              {currentQuestion.speech && (
                <button className="sound-button" onClick={() => speakSpanish(currentQuestion.speech!)} aria-label={`Hear ${currentQuestion.speech}`}>
                  <b aria-hidden="true">◖))</b><small>{currentQuestion.listening ? "Play audio" : "Hear it"}</small>
                </button>
              )}
            </div>
            <div className="answer-grid">
              {currentQuestion.options.map((option, index) => {
                const correct = answer && option === currentQuestion.answer;
                const wrong = answer === option && option !== currentQuestion.answer;
                const muted = answer && !correct && !wrong;
                return <button key={`${option}-${index}`} disabled={Boolean(answer)} className={correct ? "correct" : wrong ? "wrong" : muted ? "muted" : ""} onClick={() => chooseAnswer(option)}><span>{String.fromCharCode(65 + index)}</span>{option}</button>;
              })}
            </div>
            {answer && (
              <div className={`answer-ribbon ${answer === currentQuestion.answer ? "" : "wrong"}`}>
                <div>
                  <strong>{answer === currentQuestion.answer ? "¡Muy bien!" : `Not quite — ${currentQuestion.answer}`}</strong>
                  <span>{currentQuestion.explanation ?? (answer === currentQuestion.answer ? "That phrase is ready for real life." : "Say the answer once before moving on.")}</span>
                </div>
                <button onClick={advanceQuestion}>{questionIndex === session.questions.length - 1 ? "See result" : "Continue"} →</button>
              </div>
            )}
          </section>
        ) : (
          <section className="session-result">
            <div className="result-sun"><span>{displayedScore >= (session.kind === "checkpoint" ? 70 : 75) ? "sí" : "otra"}</span></div>
            <p>{displayedScore >= (session.kind === "checkpoint" ? 70 : 75) ? "STEP CLEARED" : "ONE MORE PASS"}</p>
            <h1>{displayedScore}%</h1>
            <h2>{sessionCorrect} of {session.questions.length} correct</h2>
            <p>{displayedScore >= 75 ? "You made these words usable. Keep the rhythm small and regular." : "The misses are useful directions. Hear the answers once, then try the set again."}</p>
            <div><button className="primary-action" onClick={() => setSession(null)}>Back to Dilo <span>→</span></button><button onClick={() => beginSession({ ...session, questions: shuffled(session.questions) })}>Try again</button></div>
          </section>
        )}
      </main>
    );
  }

  if (activeUnit) {
    const complete = progress.completedUnits.includes(activeUnit.id);
    return (
      <main className="lesson-shell">
        <header className="lesson-topbar">
          <button onClick={() => setActiveUnit(null)} aria-label="Back to course">←</button>
          <span>RUTA {String(activeUnit.id).padStart(2, "0")} · {activeUnit.stage}</span>
          <small>{complete ? "Completed" : "In progress"}</small>
        </header>
        <section className={`lesson-hero ${activeUnit.color}`}>
          <div><span>REAL-LIFE MISSION</span><h1>{activeUnit.title}</h1><p>{activeUnit.situation}</p></div>
          <strong>{activeUnit.spanish}</strong>
        </section>
        <section className="lesson-body">
          <div className="lesson-section-head"><span>01 · LISTEN</span><h2>First, hear the exchange.</h2><p>Play each line. Read once, then look away and echo the rhythm.</p></div>
          <div className="dialogue-card">
            {activeUnit.dialogue.map((line, index) => <button key={`${line.line}-${index}`} onClick={() => speakSpanish(line.line)}><b>{line.speaker}</b><span><strong>{line.line}</strong><small>{line.translation}</small></span><i aria-hidden="true">◖))</i></button>)}
          </div>
          <div className="lesson-section-head"><span>02 · NOTICE</span><h2>Words worth keeping.</h2><p>Small, high-frequency pieces you can recombine outside this lesson.</p></div>
          <div className="lesson-word-grid">
            {activeUnit.words.map((item) => <button key={item.word} onClick={() => speakSpanish(item.word.replace("/a", "a"))}><span>{item.word}</span><strong>{item.meaning}</strong><small>{item.note ?? "Tap to hear"}</small></button>)}
          </div>
          <div className="lesson-section-head"><span>03 · BUILD</span><h2>Two patterns. Many sentences.</h2><p>Swap the final piece and the pattern becomes yours.</p></div>
          <div className="pattern-grid">
            {activeUnit.patterns.map((item) => <article key={item.pattern}><span>USE THIS FRAME</span><h3>{item.pattern}</h3><p>{item.meaning}</p><button onClick={() => speakSpanish(item.example)}>◖)) {item.example}</button><small>{item.translation}</small></article>)}
          </div>
          <div className="lesson-finish">
            <div><span>04 · MAKE IT STICK</span><h2>Ready for a ten-question check?</h2><p>Score 75% to clear this route. You can repeat it whenever you like.</p></div>
            <button className="primary-action" onClick={() => beginSession({ title: activeUnit.title, eyebrow: `Ruta ${activeUnit.id} · ${activeUnit.stage}`, questions: unitQuestions(activeUnit), kind: "unit", unit: activeUnit.id })}>{complete ? "Review route" : "Start the check"}<span>→</span></button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <button className="brand" onClick={() => navigate("today")} aria-label="Dilo home">
          <span className="brand-mark"><i>di</i><b aria-hidden="true" /></span>
          <span><strong>Dilo</strong><small>Spanish you can use today</small></span>
        </button>
        <div className="header-status">
          <span className={`sync-dot ${syncStatus}`} aria-hidden="true" />
          <span>{syncStatus === "synced" ? "Cloud saved" : syncStatus === "saving" || syncStatus === "checking" ? "Saving…" : syncStatus === "conflict" ? "Choose a copy" : "On this device"}</span>
          <b>{progress.streak || 0} día{progress.streak === 1 ? "" : "s"}</b>
        </div>
      </header>

      {account.mode === "device" && <div className="device-banner" role="status"><div><strong>Public device copy</strong><span>Your progress is saved in this browser. Export a backup before switching devices.</span></div><a href={SYNCED_APP_URL}>Open synced Dilo →</a></div>}

      <main className="main-content">
        {view === "today" && (
          <section className="today-view view-enter">
            <div className="today-hero">
              <div className="hero-copy">
                <span className="eyebrow">HOY · YOUR DAILY SPANISH</span>
                <h1>Speak sooner.<br />Remember <em>longer.</em></h1>
                <p>Learn the Spanish you actually reach for—one useful exchange, a handful of words, and a little speaking every day.</p>
                <div className="hero-meta"><span>{progress.goal}</span><span>{progress.dailyGoal} min rhythm</span></div>
              </div>
              <div className="hero-art" aria-hidden="true"><span>¡</span><b>DI</b><i>LO!</i><em /></div>
            </div>

            <div className="today-grid">
              <article className="next-card">
                <div className="card-topline"><span>NEXT REAL-LIFE ROUTE</span><small>{coursePercent}% course</small></div>
                <span className="route-number">{String(nextUnit?.id ?? 8).padStart(2, "0")}</span>
                <div className="route-copy">
                  <span>{nextUnit ? nextUnit.stage : "A1 CHECKPOINT"}</span>
                  <h2>{nextUnit?.spanish ?? "Ya puedes."}</h2>
                  <p>{nextUnit?.promise ?? "You cleared every route. Keep your Spanish warm with mixed practice."}</p>
                  <button className="primary-action" onClick={() => nextUnit ? openUnit(nextUnit) : beginSession({ title: "A1 checkpoint", eyebrow: "All eight routes", questions: shuffled(checkpointQuestions).map((item, index) => ({ ...item, skill: "Meaning", sourceId: `checkpoint:${index}` })), kind: "checkpoint" })}>{progress.xp ? "Continue today" : "Start speaking"}<span>→</span></button>
                </div>
                <div className="route-progress"><i style={{ width: `${Math.max(7, coursePercent)}%` }} /></div>
              </article>

              <aside className="today-side">
                <article className="rhythm-card"><div className="mini-sun"><span>{progress.streak || 0}</span></div><div><small>CURRENT RHYTHM</small><strong>{progress.streak || 0} day{progress.streak === 1 ? "" : "s"}</strong><p>Your first answer today keeps it going.</p></div></article>
                <article className="quick-card"><span>QUICK PRACTICE · 3–5 MIN</span><h3>Put Spanish on your tongue.</h3><div><button onClick={() => beginSession({ title: "Listen & choose", eyebrow: "Ten everyday lines", questions: listeningQuestions(), kind: "drill" })}><b>◖))</b><span>Listen & choose<small>{progress.practicedPhrases.length} phrases heard</small></span><i>→</i></button><button onClick={() => beginSession({ title: "Situation lab", eyebrow: "What would you say?", questions: situationQuestions(), kind: "drill" })}><b>¿?</b><span>Situation lab<small>Real-life response practice</small></span><i>→</i></button></div></article>
              </aside>
            </div>

            <div className="scope-strip">
              <span>A COMPLETE STARTING RHYTHM</span>
              <div><strong>{curriculumTotals.units}</strong><small>real-life routes</small></div>
              <div><strong>{curriculumTotals.words}</strong><small>core words</small></div>
              <div><strong>{curriculumTotals.patterns}</strong><small>sentence frames</small></div>
              <div><strong>{curriculumTotals.phrases}</strong><small>spoken lines</small></div>
              <button onClick={() => navigate("path")}>See the full path →</button>
            </div>
          </section>
        )}

        {view === "path" && (
          <section className="path-view view-enter">
            <div className="section-intro"><span className="eyebrow">LA RUTA · YOUR A1 PATH</span><h1>Eight stops.<br /><em>One real voice.</em></h1><p>Each route starts with a scene you might live this week. Listen first, notice the pattern, then make it your own.</p></div>
            <div className="path-summary"><span>START HERE</span><strong>{coursePercent}%</strong><p>{progress.completedUnits.length} of {courseUnits.length} routes cleared</p><i><em style={{ width: `${coursePercent}%` }} /></i></div>
            <div className="unit-road">
              {courseUnits.map((item) => {
                const complete = progress.completedUnits.includes(item.id);
                const unlocked = item.id === 1 || progress.completedUnits.includes(item.id - 1);
                return <article key={item.id} className={`road-unit ${item.color} ${complete ? "complete" : ""} ${!unlocked ? "locked" : ""}`}><div className="road-node"><span>{complete ? "✓" : String(item.id).padStart(2, "0")}</span></div><div className="road-card"><div><small>{item.stage}</small><h2>{item.title}</h2><b>{item.spanish}</b><p>{item.promise}</p><ul><li>{item.words.length} words</li><li>{item.patterns.length} patterns</li><li>{item.dialogue.length} spoken lines</li></ul></div><button disabled={!unlocked} onClick={() => openUnit(item)}>{complete ? "Review route" : unlocked ? "Open route" : "Clear the route above"}<span>{unlocked ? "→" : "•"}</span></button></div></article>;
              })}
            </div>
          </section>
        )}

        {view === "practice" && (
          <section className="practice-view view-enter">
            <div className="section-intro compact"><span className="eyebrow">PRÁCTICA · FOCUSED SETS</span><h1>Train the part<br />that needs <em>another turn.</em></h1><p>Short sets pull from the entire course. Listen, recall, and choose what you would actually say.</p></div>
            <div className="practice-grid">
              <button className="practice-card clay" onClick={() => beginSession({ title: "Word sprint", eyebrow: "Ten useful words", questions: shuffled(vocabulary).slice(0, 10).map(wordQuestion), kind: "drill" })}><span>01 · RECALL</span><b>PA</b><h2>Word sprint</h2><p>Quick English-to-Spanish choices across food, travel, people, and daily life.</p><small>10 prompts · mixed routes</small></button>
              <button className="practice-card blue" onClick={() => beginSession({ title: "Listen & choose", eyebrow: "Ten everyday lines", questions: listeningQuestions(), kind: "drill" })}><span>02 · EAR</span><b>OÍ</b><h2>Listen & choose</h2><p>Hear natural phrases at a calm pace and pick the line that matches.</p><small>10 prompts · audio support</small></button>
              <button className="practice-card olive" onClick={() => beginSession({ title: "Situation lab", eyebrow: "What would you say?", questions: situationQuestions(), kind: "drill" })}><span>03 · RESPONSE</span><b>DI</b><h2>Situation lab</h2><p>Order, ask, recover, invite, and respond without translating word by word.</p><small>10 prompts · real-life choices</small></button>
              <button className="practice-card ink" onClick={() => beginSession({ title: "A1 checkpoint", eyebrow: "All eight routes", questions: shuffled(checkpointQuestions).map((item, index) => ({ ...item, skill: "Meaning", sourceId: `checkpoint:${index}` })), kind: "checkpoint" })}><span>04 · CHECKPOINT</span><b>SÍ</b><h2>A1 mini check</h2><p>A mixed sweep of vocabulary, listening, useful patterns, and conversation recovery.</p><small>16 prompts · 70% target</small></button>
            </div>
            <div className="accuracy-panel"><div><span className="eyebrow">YOUR SIGNAL</span><h2>{progress.reviewCount ? `${accuracy}% across ${progress.reviewCount} answers.` : "Your signal begins with one answer."}</h2><p>{accuracy >= 80 ? "Recognition is steady. Add speed without losing the sound." : progress.reviewCount ? "Keep the sets short; each miss points to a useful next repetition." : "Choose any set above to establish a starting point."}</p></div><div className="accuracy-ring" style={{ "--score": `${accuracy * 3.6}deg` } as React.CSSProperties}><span>{accuracy || "—"}<small>{accuracy ? "%" : ""}</small></span></div></div>
          </section>
        )}

        {view === "phrasebook" && (
          <section className="library-view view-enter">
            <div className="library-head"><div><span className="eyebrow">A MANO · YOUR PHRASEBOOK</span><h1>Everything useful,<br /><em>within reach.</em></h1></div><label><span>Search Spanish or English</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Try: coffee, reserva, ¿dónde…?" /></label></div>
            <div className="library-tabs" role="tablist">{(["phrases", "words", "patterns"] as LibraryTab[]).map((tab) => <button key={tab} role="tab" aria-selected={libraryTab === tab} className={libraryTab === tab ? "active" : ""} onClick={() => setLibraryTab(tab)}>{tab}<span>{tab === "phrases" ? curriculumTotals.phrases : tab === "words" ? curriculumTotals.words : curriculumTotals.patterns}</span></button>)}</div>
            {libraryTab === "phrases" && <div className="phrase-library">{((libraryResults as typeof phrases | null) ?? phrases).map((item) => <button key={item.id} onClick={() => speakSpanish(item.spanish)}><span><small>RUTA {String(item.unit).padStart(2, "0")} · {item.situation}</small><strong>{item.spanish}</strong></span><p>{item.translation}</p><i>◖))</i></button>)}</div>}
            {libraryTab === "words" && <div className="word-library">{((libraryResults as Word[] | null) ?? vocabulary).map((item, index) => <button key={`${item.word}-${index}`} onClick={() => speakSpanish(item.word.replace("/a", "a"))}><span><small>RUTA {String(item.unit).padStart(2, "0")}</small><strong>{item.word}</strong><b>{item.note ?? ""}</b></span><p>{item.meaning}</p><i>◖))</i></button>)}</div>}
            {libraryTab === "patterns" && <div className="grammar-library">{((libraryResults as Pattern[] | null) ?? patterns).map((item) => <article key={`${item.unit}-${item.pattern}`}><span>RUTA {String(item.unit).padStart(2, "0")}</span><h3>{item.pattern}</h3><p>{item.meaning}</p><button onClick={() => speakSpanish(item.example)}>◖)) {item.example}</button><small>{item.translation}</small></article>)}</div>}
          </section>
        )}

        {view === "progress" && (
          <section className="progress-view view-enter">
            <div className="section-intro compact"><span className="eyebrow">TU RITMO · YOUR PROGRESS</span><h1>Useful Spanish,<br /><em>adding up.</em></h1><p>Coverage shows what the course has introduced. Accuracy comes only from answers you give.</p></div>
            <div className="stat-cards"><article><span>DÍAS</span><strong>{progress.streak}</strong><p>day rhythm</p></article><article><span>PUNTOS</span><strong>{progress.xp}</strong><p>practice XP</p></article><article><span>PALABRAS</span><strong>{progress.learnedWords.length}</strong><p>words covered</p></article><article><span>SEÑAL</span><strong>{accuracy || "—"}{accuracy ? "%" : ""}</strong><p>answer accuracy</p></article></div>
            <div className="coverage-panel"><div><span className="eyebrow">COURSE COVERAGE</span><h2>{coursePercent}% of the A1 path cleared.</h2><p>{progress.completedUnits.length} of {courseUnits.length} real-life routes</p></div><div className="coverage-bars"><div><span>Words introduced <b>{progress.learnedWords.length}/{curriculumTotals.words}</b></span><i><em style={{ width: `${Math.min(100, progress.learnedWords.length / curriculumTotals.words * 100)}%` }} /></i></div><div><span>Patterns introduced <b>{progress.learnedPatterns.length}/{curriculumTotals.patterns}</b></span><i><em style={{ width: `${Math.min(100, progress.learnedPatterns.length / curriculumTotals.patterns * 100)}%` }} /></i></div><div><span>Phrases practiced <b>{progress.practicedPhrases.length}/{curriculumTotals.phrases}</b></span><i><em style={{ width: `${Math.min(100, progress.practicedPhrases.length / curriculumTotals.phrases * 100)}%` }} /></i></div></div></div>
            <div className="progress-bottom">
              <article className={`cloud-card ${syncStatus}`}><span className="sync-dot" /><div><small>{account.mode === "signed-in" ? "SIGNED-IN PROGRESS" : "DEVICE PROGRESS"}</small><h3>{syncStatus === "synced" ? "Your newest phrase follows you." : syncStatus === "conflict" ? "Two progress copies need a choice." : account.mode === "device" ? "Safe in this browser." : "Checking your saved copy…"}</h3><p>{account.mode === "signed-in" ? `${account.displayName ?? account.email ?? "Your account"} · your private Dilo record` : "The public copy stays on this device. Export a backup or open the private app for account sync."}</p>{account.mode === "device" && <a href={`${SYNCED_APP_URL}/#progress`}>Open synced Dilo →</a>}</div></article>
              <article className="backup-card"><small>OWN YOUR COPY</small><h3>Backup & restore</h3><p>Dilo exports its own progress file and never touches your other language sites.</p><div><button onClick={exportProgress}>Export</button><button onClick={() => importRef.current?.click()}>Import</button><button className="danger" onClick={() => setShowReset(true)}>Reset</button></div><input ref={importRef} type="file" accept="application/json" onChange={(event) => void importProgress(event)} hidden /></article>
            </div>
            {progress.checkpointScores.length > 0 && <div className="history-panel"><span className="eyebrow">CHECKPOINT HISTORY</span><div>{progress.checkpointScores.map((score, index) => <span key={`${score}-${index}`} className={score >= 70 ? "pass" : ""}><strong>{score}%</strong><small>Attempt {index + 1}</small></span>)}</div></div>}
          </section>
        )}
      </main>

      <nav className="main-nav" aria-label="Primary navigation">
        <button className={view === "today" ? "active" : ""} onClick={() => navigate("today")}><span>HOY</span><small>Today</small></button>
        <button className={view === "path" ? "active" : ""} onClick={() => navigate("path")}><span>IR</span><small>Path</small></button>
        <button className={view === "practice" ? "active" : ""} onClick={() => navigate("practice")}><span>DI</span><small>Practice</small></button>
        <button className={view === "phrasebook" ? "active" : ""} onClick={() => navigate("phrasebook")}><span>ABC</span><small>Words</small></button>
        <button className={view === "progress" ? "active" : ""} onClick={() => navigate("progress")}><span>+</span><small>Progress</small></button>
      </nav>

      {!progress.onboarded && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
          <div className="onboarding-card">
            <div className="onboarding-sun"><span>di</span></div>
            <span className="eyebrow">TU PRIMERA FRASE</span>
            <h2 id="welcome-title">Spanish that leaves<br /><em>the textbook.</em></h2>
            <p>Dilo starts with a real exchange, then gives you just enough vocabulary and grammar to make it your own. Choose a rhythm, not a deadline.</p>
            <fieldset><legend>What brings you here?</legend><div>{["Speak with confidence", "Travel with ease", "Build an A1 foundation"].map((item) => <button key={item} className={goal === item ? "active" : ""} onClick={() => setGoal(item)}>{item}</button>)}</div></fieldset>
            <fieldset><legend>Your daily rhythm</legend><div>{[5, 10, 15].map((minutes) => <button key={minutes} className={dailyGoal === minutes ? "active" : ""} onClick={() => setDailyGoal(minutes)}><strong>{minutes}</strong><span>min</span></button>)}</div></fieldset>
            <button className="primary-action" onClick={() => setProgress((current) => ({ ...current, onboarded: true, goal, dailyGoal }))}>Say your first hola <span>→</span></button>
            <small>No streak pressure. Progress saves automatically.</small>
          </div>
        </div>
      )}

      {remoteConflict && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="conflict-title"><div className="conflict-card"><span className="eyebrow">SYNC PROTECTION</span><h2 id="conflict-title">Two copies were found.</h2><p>Nothing has been overwritten. Keep this device’s {progress.xp} XP or restore the cloud copy with {remoteConflict.progress.xp} XP.</p><div><button onClick={() => resolveConflict("device")}><strong>This device</strong><span>{progress.completedUnits.length} routes · {progress.xp} XP</span></button><button onClick={() => resolveConflict("cloud")}><strong>Cloud copy</strong><span>{remoteConflict.progress.completedUnits.length} routes · {remoteConflict.progress.xp} XP</span></button></div><small>The copy you do not choose is retained as recovery history.</small></div></div>}
      {showReset && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="reset-title"><div className="reset-card"><span>¿?</span><h2 id="reset-title">Reset your whole path?</h2><p>This clears course progress on this device and, when signed in, replaces the cloud copy. Export first if you may want it later.</p><div><button onClick={() => setShowReset(false)}>Keep my progress</button><button className="danger" onClick={resetProgress}>Reset everything</button></div></div></div>}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
