import {
  grammarByLevel,
  lexiconByLevel,
  missionsByLevel,
  type LevelId,
} from "./spanish-curriculum";

export const DAILY_STEPS = ["cards", "recall", "grammar", "listen", "build", "read", "speak"] as const;
export type DailyStep = typeof DAILY_STEPS[number];
export type SkillArea = "vocabulary" | "grammar" | "listening" | "reading" | "sentence" | "speaking" | "pronunciation";

export type ReviewState = {
  dueDay: number;
  interval: number;
  repetitions: number;
  lapses: number;
};

export type SkillStat = {
  attempts: number;
  correct: number;
  lastPracticed: string;
};

export type Correction = {
  id: string;
  level: LevelId;
  skill: SkillArea;
  prompt: string;
  answer: string;
  choices: string[];
  explanation: string;
  speech?: string;
  dueDay: number;
  correctStreak: number;
  misses: number;
};

export type ExamAttempt = {
  at: string;
  score: number;
  correct: number;
  total: number;
  level: LevelId;
};

export type DailyPlan = {
  id: string;
  level: LevelId;
  learningDay: number;
  missionIndex: number;
  phase: number;
  newWordIds: string[];
  recallWordIds: string[];
  grammarIds: string[];
  completedSteps: DailyStep[];
  flashcardPosition: number;
  recallPosition: number;
  grammarPosition: number;
  startedOn: string;
  completedOn: string;
  bonus: boolean;
};

export type StudyDay = {
  id: string;
  level: LevelId;
  learningDay: number;
  missionIndex: number;
  phase: number;
  newWordIds: string[];
  recallWordIds: string[];
  grammarIds: string[];
  completedSteps: DailyStep[];
  startedOn: string;
  completedOn: string;
  replayCount: number;
};

export type LevelArchive = {
  learningDay: number;
  missionSessionCount: number;
  learnedWordIds: string[];
  learnedGrammarIds: string[];
  reviews: Record<string, ReviewState>;
  grammarReviews: Record<string, ReviewState>;
  currentPlan: DailyPlan | null;
  bonusDate: string;
  examHistory: ExamAttempt[];
};

export type Progress = {
  version: 3;
  onboarded: boolean;
  goal: string;
  dailyMinutes: number;
  dailyNew: number;
  showHelp: boolean;
  selectedLevel: LevelId;
  graduatedLevels: LevelId[];
  archives: Partial<Record<LevelId, LevelArchive>>;
  xp: number;
  streak: number;
  lastStudyDate: string;
  activeDays: string[];
  trainingSeconds: number;
  trainingTodaySeconds: number;
  trainingDate: string;
  skillStats: Record<string, SkillStat>;
  corrections: Correction[];
  examHistory: ExamAttempt[];
  studyHistory: Partial<Record<LevelId, StudyDay[]>>;
  wordConfidence: Record<string, number>;
  pronunciationDone: string[];
};

export type GraduationStatus = {
  ready: boolean;
  requirements: Array<{ label: string; current: number; target: number; met: boolean }>;
};

export function localDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(date);
}

export function emptyArchive(): LevelArchive {
  return {
    learningDay: 0,
    missionSessionCount: 0,
    learnedWordIds: [],
    learnedGrammarIds: [],
    reviews: {},
    grammarReviews: {},
    currentPlan: null,
    bonusDate: "",
    examHistory: [],
  };
}

export function starterProgress(): Progress {
  return {
    version: 3,
    onboarded: false,
    goal: "Speak with confidence",
    dailyMinutes: 20,
    dailyNew: 6,
    showHelp: true,
    selectedLevel: "A1",
    graduatedLevels: [],
    archives: { A1: emptyArchive() },
    xp: 0,
    streak: 0,
    lastStudyDate: "",
    activeDays: [],
    trainingSeconds: 0,
    trainingTodaySeconds: 0,
    trainingDate: localDate(),
    skillStats: {},
    corrections: [],
    examHistory: [],
    studyHistory: {},
    wordConfidence: {},
    pronunciationDone: [],
  };
}

function unique<T>(items: T[]) { return Array.from(new Set(items)); }
function strings(value: unknown) { return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []; }
function numbers(value: unknown) { return Array.isArray(value) ? value.filter((item): item is number => Number.isFinite(item)) : []; }
function finite(value: unknown, fallback = 0) { const next = Number(value); return Number.isFinite(next) ? next : fallback; }

function normalizeReviewMap(value: unknown): Record<string, ReviewState> {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(Object.entries(value as Record<string, Partial<ReviewState>>).map(([id, state]) => [id, {
    dueDay: Math.max(0, finite(state.dueDay)),
    interval: Math.max(0, finite(state.interval)),
    repetitions: Math.max(0, finite(state.repetitions)),
    lapses: Math.max(0, finite(state.lapses)),
  }]));
}

function normalizePlan(value: unknown, level: LevelId): DailyPlan | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<DailyPlan>;
  return {
    id: typeof raw.id === "string" ? raw.id : `${level}-${finite(raw.learningDay)}-restored`,
    level,
    learningDay: Math.max(0, finite(raw.learningDay)),
    missionIndex: Math.max(0, Math.min(11, finite(raw.missionIndex))),
    phase: Math.max(0, Math.min(2, finite(raw.phase))),
    newWordIds: strings(raw.newWordIds),
    recallWordIds: strings(raw.recallWordIds),
    grammarIds: strings(raw.grammarIds),
    completedSteps: strings(raw.completedSteps).filter((step): step is DailyStep => DAILY_STEPS.includes(step as DailyStep)),
    flashcardPosition: Math.max(0, finite(raw.flashcardPosition)),
    recallPosition: Math.max(0, finite(raw.recallPosition)),
    grammarPosition: Math.max(0, finite(raw.grammarPosition)),
    startedOn: typeof raw.startedOn === "string" ? raw.startedOn : localDate(),
    completedOn: typeof raw.completedOn === "string" ? raw.completedOn : "",
    bonus: Boolean(raw.bonus),
  };
}

function normalizeStudyDay(value: unknown, level: LevelId): StudyDay | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<StudyDay>;
  const learningDay = Math.max(0, finite(raw.learningDay));
  return {
    id: typeof raw.id === "string" ? raw.id : `${level}-${learningDay}-${String(raw.completedOn ?? "restored")}`,
    level,
    learningDay,
    missionIndex: Math.max(0, Math.min(11, finite(raw.missionIndex))),
    phase: Math.max(0, Math.min(2, finite(raw.phase))),
    newWordIds: strings(raw.newWordIds),
    recallWordIds: strings(raw.recallWordIds),
    grammarIds: strings(raw.grammarIds),
    completedSteps: strings(raw.completedSteps).filter((step): step is DailyStep => DAILY_STEPS.includes(step as DailyStep)),
    startedOn: typeof raw.startedOn === "string" ? raw.startedOn : "",
    completedOn: typeof raw.completedOn === "string" ? raw.completedOn : "",
    replayCount: Math.max(0, finite(raw.replayCount)),
  };
}

function normalizeArchive(value: unknown, level: LevelId): LevelArchive {
  const base = emptyArchive();
  if (!value || typeof value !== "object") return base;
  const raw = value as Partial<LevelArchive>;
  return {
    learningDay: Math.max(0, finite(raw.learningDay)),
    missionSessionCount: Math.max(0, finite(raw.missionSessionCount)),
    learnedWordIds: strings(raw.learnedWordIds),
    learnedGrammarIds: strings(raw.learnedGrammarIds),
    reviews: normalizeReviewMap(raw.reviews),
    grammarReviews: normalizeReviewMap(raw.grammarReviews),
    currentPlan: normalizePlan(raw.currentPlan, level),
    bonusDate: typeof raw.bonusDate === "string" ? raw.bonusDate : "",
    examHistory: Array.isArray(raw.examHistory) ? raw.examHistory.filter((item): item is ExamAttempt => Boolean(item && typeof item === "object")) : [],
  };
}

function migrateLegacy(raw: Record<string, unknown>): Progress {
  const base = starterProgress();
  const completedUnits = numbers(raw.completedUnits);
  const legacyWords = strings(raw.learnedWords);
  const legacyPatterns = strings(raw.learnedPatterns);
  const checkpointScores = numbers(raw.checkpointScores);
  const a1 = emptyArchive();
  a1.missionSessionCount = Math.min(36, completedUnits.length * 3);
  a1.learningDay = a1.missionSessionCount;
  a1.learnedWordIds = lexiconByLevel.A1.filter((item) => legacyWords.includes(item.spanish)).map((item) => item.id);
  a1.learnedGrammarIds = grammarByLevel.A1.slice(0, Math.min(12, legacyPatterns.length)).map((item) => item.id);
  a1.examHistory = checkpointScores.map((score, index) => ({ at: `legacy-${index + 1}`, level: "A1", score, correct: Math.round(score * .4), total: 40 }));
  const reviewCount = Math.max(0, finite(raw.reviewCount));
  const correctCount = Math.max(0, finite(raw.correctCount));
  return {
    ...base,
    onboarded: Boolean(raw.onboarded),
    goal: typeof raw.goal === "string" ? raw.goal : base.goal,
    dailyMinutes: [5, 10, 15, 20, 30].includes(finite(raw.dailyGoal)) ? Math.max(10, finite(raw.dailyGoal)) : 20,
    dailyNew: 6,
    archives: { A1: a1 },
    xp: Math.max(0, finite(raw.xp)),
    streak: Math.max(0, finite(raw.streak)),
    lastStudyDate: typeof raw.lastStudyDate === "string" ? raw.lastStudyDate : "",
    activeDays: strings(raw.activeDays).slice(-730),
    skillStats: reviewCount ? { vocabulary: { attempts: reviewCount, correct: Math.min(reviewCount, correctCount), lastPracticed: typeof raw.lastStudyDate === "string" ? raw.lastStudyDate : "" } } : {},
    examHistory: a1.examHistory,
  };
}

export function normalizeProgress(value: unknown): Progress {
  const base = starterProgress();
  if (!value || typeof value !== "object") return ensureCurrentPlan(base);
  const raw = value as Record<string, unknown>;
  if (raw.version !== 2 && raw.version !== 3) return ensureCurrentPlan(migrateLegacy(raw));
  const selectedLevel = (["A1", "A2", "B1", "B2", "C1", "C2"].includes(String(raw.selectedLevel)) ? raw.selectedLevel : "A1") as LevelId;
  const archivesRaw = raw.archives && typeof raw.archives === "object" ? raw.archives as Partial<Record<LevelId, unknown>> : {};
  const archives: Partial<Record<LevelId, LevelArchive>> = {};
  (["A1", "A2", "B1", "B2", "C1", "C2"] as LevelId[]).forEach((level) => {
    if (archivesRaw[level]) archives[level] = normalizeArchive(archivesRaw[level], level);
  });
  if (!archives[selectedLevel]) archives[selectedLevel] = emptyArchive();
  const trainingDate = typeof raw.trainingDate === "string" ? raw.trainingDate : localDate();
  const progress: Progress = {
    ...base,
    version: 3,
    onboarded: Boolean(raw.onboarded),
    goal: typeof raw.goal === "string" ? raw.goal : base.goal,
    dailyMinutes: [10, 20, 30].includes(finite(raw.dailyMinutes)) ? finite(raw.dailyMinutes) : 20,
    dailyNew: [5, 6, 8, 10].includes(finite(raw.dailyNew)) ? finite(raw.dailyNew) : 6,
    showHelp: raw.showHelp !== false,
    selectedLevel,
    graduatedLevels: strings(raw.graduatedLevels).filter((item): item is LevelId => ["A1", "A2", "B1", "B2", "C1", "C2"].includes(item)),
    archives,
    xp: Math.max(0, finite(raw.xp)),
    streak: Math.max(0, finite(raw.streak)),
    lastStudyDate: typeof raw.lastStudyDate === "string" ? raw.lastStudyDate : "",
    activeDays: strings(raw.activeDays).slice(-730),
    trainingSeconds: Math.max(0, finite(raw.trainingSeconds)),
    trainingTodaySeconds: trainingDate === localDate() ? Math.max(0, finite(raw.trainingTodaySeconds)) : 0,
    trainingDate: localDate(),
    skillStats: raw.skillStats && typeof raw.skillStats === "object" ? raw.skillStats as Record<string, SkillStat> : {},
    corrections: Array.isArray(raw.corrections) ? raw.corrections.filter((item): item is Correction => Boolean(item && typeof item === "object")) : [],
    examHistory: Array.isArray(raw.examHistory) ? raw.examHistory.filter((item): item is ExamAttempt => Boolean(item && typeof item === "object")) : [],
    studyHistory: Object.fromEntries((['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as LevelId[]).map((level) => [level, (Array.isArray((raw.studyHistory as Partial<Record<LevelId, unknown[]>> | undefined)?.[level]) ? (raw.studyHistory as Partial<Record<LevelId, unknown[]>>)[level] ?? [] : []).map((item) => normalizeStudyDay(item, level)).filter((item): item is StudyDay => Boolean(item)).slice(-180)])),
    wordConfidence: raw.wordConfidence && typeof raw.wordConfidence === "object" ? Object.fromEntries(Object.entries(raw.wordConfidence as Record<string, unknown>).map(([id, score]) => [id, Math.max(0, Math.min(5, finite(score)))])) : {},
    pronunciationDone: strings(raw.pronunciationDone),
  };
  return ensureCurrentPlan(progress);
}

export function getArchive(progress: Progress, level = progress.selectedLevel): LevelArchive {
  return progress.archives[level] ?? emptyArchive();
}

function dueIds(map: Record<string, ReviewState>, day: number) {
  return Object.entries(map).filter(([, state]) => state.dueDay <= day).sort((a, b) => a[1].dueDay - b[1].dueDay).map(([id]) => id);
}

function makeDailyPlan(progress: Progress, level: LevelId, bonus = false): DailyPlan {
  const archive = getArchive(progress, level);
  const words = lexiconByLevel[level];
  const grammar = grammarByLevel[level];
  const learned = new Set(archive.learnedWordIds);
  const dueWords = dueIds(archive.reviews, archive.learningDay).filter((id) => learned.has(id));
  const newWordIds = words.filter((item) => !learned.has(item.id)).slice(0, progress.dailyNew).map((item) => item.id);
  const recallWordIds = unique([...dueWords, ...newWordIds]);
  const learnedGrammar = new Set(archive.learnedGrammarIds);
  const dueGrammar = dueIds(archive.grammarReviews, archive.learningDay).filter((id) => learnedGrammar.has(id)).slice(0, 2);
  const newGrammar = grammar.find((item) => !learnedGrammar.has(item.id));
  const grammarIds = unique([...dueGrammar, ...(newGrammar ? [newGrammar.id] : [])]);
  const missionSession = archive.missionSessionCount;
  const missionIndex = Math.floor(missionSession / 3) % missionsByLevel[level].length;
  const phase = missionSession % 3;
  return {
    id: `${level}-${archive.learningDay}-${Date.now()}`,
    level,
    learningDay: archive.learningDay,
    missionIndex,
    phase,
    newWordIds,
    recallWordIds: recallWordIds.length ? recallWordIds : words.slice((archive.learningDay * progress.dailyNew) % words.length, ((archive.learningDay * progress.dailyNew) % words.length) + progress.dailyNew).map((item) => item.id),
    grammarIds: grammarIds.length ? grammarIds : [grammar[archive.learningDay % grammar.length].id],
    completedSteps: [],
    flashcardPosition: 0,
    recallPosition: 0,
    grammarPosition: 0,
    startedOn: localDate(),
    completedOn: "",
    bonus,
  };
}

export function ensureCurrentPlan(progress: Progress): Progress {
  const level = progress.selectedLevel;
  const archive = getArchive(progress, level);
  if (archive.currentPlan && !archive.currentPlan.completedOn) return progress;
  if (archive.currentPlan?.completedOn === localDate()) return progress;
  const nextArchive = { ...archive, currentPlan: makeDailyPlan(progress, level) };
  return { ...progress, archives: { ...progress.archives, [level]: nextArchive } };
}

export function canAdvanceCatchUp(progress: Progress) {
  const archive = getArchive(progress);
  const plan = archive.currentPlan;
  return Boolean(plan?.completedOn === localDate() && plan.startedOn < localDate() && archive.bonusDate !== localDate());
}

export function advanceCatchUpSession(progress: Progress): Progress {
  const level = progress.selectedLevel;
  const archive = getArchive(progress, level);
  if (!canAdvanceCatchUp(progress)) return progress;
  const nextArchive = { ...archive, bonusDate: localDate(), currentPlan: makeDailyPlan(progress, level, true) };
  return { ...progress, archives: { ...progress.archives, [level]: nextArchive } };
}

export function recordPlanPosition(progress: Progress, step: "cards" | "recall" | "grammar", position: number): Progress {
  const level = progress.selectedLevel;
  const archive = getArchive(progress, level);
  const plan = archive.currentPlan;
  if (!plan) return progress;
  const key = step === "cards" ? "flashcardPosition" : step === "recall" ? "recallPosition" : "grammarPosition";
  const nextPosition = Math.max(0, Math.floor(position));
  if (plan[key] === nextPosition) return progress;
  return { ...progress, archives: { ...progress.archives, [level]: { ...archive, currentPlan: { ...plan, [key]: nextPosition } } } };
}

export function completeStep(progress: Progress, step: DailyStep): Progress {
  const level = progress.selectedLevel;
  const archive = getArchive(progress, level);
  const plan = archive.currentPlan;
  if (!plan || plan.completedSteps.includes(step)) return progress;
  return {
    ...progress,
    xp: progress.xp + 15,
    archives: { ...progress.archives, [level]: { ...archive, currentPlan: { ...plan, completedSteps: [...plan.completedSteps, step] } } },
  };
}

function nextStreak(progress: Progress) {
  const today = localDate();
  if (progress.lastStudyDate === today) return progress.streak;
  const previous = new Date(`${progress.lastStudyDate || "1970-01-01"}T12:00:00Z`).getTime();
  const current = new Date(`${today}T12:00:00Z`).getTime();
  return Math.round((current - previous) / 86400000) === 1 ? progress.streak + 1 : 1;
}

export function completePlan(progress: Progress): Progress {
  const level = progress.selectedLevel;
  const archive = getArchive(progress, level);
  const plan = archive.currentPlan;
  if (!plan || plan.completedOn || DAILY_STEPS.some((step) => !plan.completedSteps.includes(step))) return progress;
  if (dueCorrections(progress).length) return progress;
  const today = localDate();
  const nextArchive: LevelArchive = {
    ...archive,
    learningDay: archive.learningDay + 1,
    missionSessionCount: archive.missionSessionCount + 1,
    learnedWordIds: unique([...archive.learnedWordIds, ...plan.newWordIds]),
    learnedGrammarIds: unique([...archive.learnedGrammarIds, ...plan.grammarIds]),
    currentPlan: { ...plan, completedOn: today },
  };
  const historyItem: StudyDay = {
    id: plan.id,
    level,
    learningDay: plan.learningDay,
    missionIndex: plan.missionIndex,
    phase: plan.phase,
    newWordIds: [...plan.newWordIds],
    recallWordIds: [...plan.recallWordIds],
    grammarIds: [...plan.grammarIds],
    completedSteps: [...plan.completedSteps],
    startedOn: plan.startedOn,
    completedOn: today,
    replayCount: progress.studyHistory[level]?.find((item) => item.id === plan.id)?.replayCount ?? 0,
  };
  const priorHistory = progress.studyHistory[level] ?? [];
  return {
    ...progress,
    xp: progress.xp + 75,
    streak: nextStreak(progress),
    lastStudyDate: today,
    activeDays: unique([...progress.activeDays, today]).slice(-730),
    archives: { ...progress.archives, [level]: nextArchive },
    studyHistory: { ...progress.studyHistory, [level]: [...priorHistory.filter((item) => item.id !== plan.id), historyItem].slice(-180) },
  };
}

export function recordStudyDayReplay(progress: Progress, level: LevelId, id: string): Progress {
  return { ...progress, studyHistory: { ...progress.studyHistory, [level]: (progress.studyHistory[level] ?? []).map((item) => item.id === id ? { ...item, replayCount: item.replayCount + 1 } : item) } };
}

export function recordWordConfidence(progress: Progress, id: string, correct: boolean): Progress {
  const prior = progress.wordConfidence[id] ?? 0;
  return { ...progress, wordConfidence: { ...progress.wordConfidence, [id]: correct ? Math.min(5, prior + 1) : Math.max(0, prior - 1) } };
}

export function recordPronunciation(progress: Progress, id: string, correct: boolean): Progress {
  const done = correct ? unique([...progress.pronunciationDone, id]) : progress.pronunciationDone;
  return recordSkill({ ...progress, pronunciationDone: done }, "pronunciation", correct);
}

export function recordReviewMiss(progress: Progress, id: string, grammar = false): Progress {
  const level = progress.selectedLevel;
  const archive = getArchive(progress, level);
  const key = grammar ? "grammarReviews" : "reviews";
  const map = archive[key];
  const previous = map[id] ?? { dueDay: archive.learningDay, interval: 0, repetitions: 0, lapses: 0 };
  const state: ReviewState = {
    ...previous,
    dueDay: archive.learningDay,
    lapses: previous.lapses + 1,
  };
  return { ...progress, archives: { ...progress.archives, [level]: { ...archive, [key]: { ...map, [id]: state } } } };
}

export function scheduleReview(progress: Progress, id: string, correct: boolean, grammar = false): Progress {
  if (!correct) return recordReviewMiss(progress, id, grammar);
  const level = progress.selectedLevel;
  const archive = getArchive(progress, level);
  const key = grammar ? "grammarReviews" : "reviews";
  const map = archive[key];
  const previous = map[id] ?? { dueDay: archive.learningDay, interval: 0, repetitions: 0, lapses: 0 };
  const interval = Math.max(1, previous.interval + 1);
  const state: ReviewState = {
    dueDay: archive.learningDay + interval,
    interval,
    repetitions: previous.repetitions + 1,
    lapses: previous.lapses,
  };
  return { ...progress, archives: { ...progress.archives, [level]: { ...archive, [key]: { ...map, [id]: state } } } };
}

export function recordSkill(progress: Progress, skill: SkillArea, correct: boolean): Progress {
  const previous = progress.skillStats[skill] ?? { attempts: 0, correct: 0, lastPracticed: "" };
  return {
    ...progress,
    xp: progress.xp + (correct ? 6 : 2),
    skillStats: { ...progress.skillStats, [skill]: { attempts: previous.attempts + 1, correct: previous.correct + (correct ? 1 : 0), lastPracticed: localDate() } },
  };
}

export function skillAccuracy(progress: Progress, skill: SkillArea) {
  const stat = progress.skillStats[skill];
  return stat?.attempts ? Math.round(stat.correct / stat.attempts * 100) : 0;
}

export function queueCorrection(progress: Progress, correction: Omit<Correction, "dueDay" | "correctStreak" | "misses" | "level">): Progress {
  const existing = progress.corrections.find((item) => item.id === correction.id && item.level === progress.selectedLevel);
  if (existing) {
    return { ...progress, corrections: progress.corrections.map((item) => item === existing ? { ...item, dueDay: getArchive(progress).learningDay, correctStreak: 0, misses: item.misses + 1 } : item) };
  }
  return { ...progress, corrections: [...progress.corrections, { ...correction, level: progress.selectedLevel, dueDay: getArchive(progress).learningDay, correctStreak: 0, misses: 1 }] };
}

export function dueCorrections(progress: Progress) {
  const day = getArchive(progress).learningDay;
  return progress.corrections.filter((item) => item.level === progress.selectedLevel && item.dueDay <= day);
}

export function resolveCorrection(progress: Progress, id: string, correct: boolean): Progress {
  const day = getArchive(progress).learningDay;
  return {
    ...progress,
    corrections: progress.corrections.flatMap((item) => {
      if (item.id !== id || item.level !== progress.selectedLevel) return [item];
      if (!correct) return [{ ...item, correctStreak: 0, misses: item.misses + 1, dueDay: day }];
      if (item.correctStreak >= 1) return [];
      return [{ ...item, correctStreak: 1, dueDay: day + 1 }];
    }),
  };
}

export function recordTrainingSeconds(progress: Progress, seconds: number): Progress {
  const today = localDate();
  return { ...progress, trainingSeconds: progress.trainingSeconds + seconds, trainingTodaySeconds: (progress.trainingDate === today ? progress.trainingTodaySeconds : 0) + seconds, trainingDate: today };
}

export function recordExam(progress: Progress, attempt: ExamAttempt): Progress {
  const level = progress.selectedLevel;
  const archive = getArchive(progress, level);
  return {
    ...progress,
    xp: progress.xp + (attempt.score >= 80 ? 200 : 60),
    examHistory: [...progress.examHistory, attempt].slice(-30),
    archives: { ...progress.archives, [level]: { ...archive, examHistory: [...archive.examHistory, attempt].slice(-10) } },
  };
}

export function graduationStatus(progress: Progress, level = progress.selectedLevel): GraduationStatus {
  const archive = getArchive(progress, level);
  const best = archive.examHistory.reduce((score, item) => Math.max(score, item.score), 0);
  const pending = progress.corrections.filter((item) => item.level === level).length;
  const requirements = [
    { label: "Lexical core introduced", current: archive.learnedWordIds.length, target: lexiconByLevel[level].length, met: archive.learnedWordIds.length >= lexiconByLevel[level].length },
    { label: "Grammar core introduced", current: archive.learnedGrammarIds.length, target: grammarByLevel[level].length, met: archive.learnedGrammarIds.length >= grammarByLevel[level].length },
    { label: "Real-world missions", current: Math.min(12, Math.floor(archive.missionSessionCount / 3)), target: 12, met: archive.missionSessionCount >= 36 },
    { label: "Correction queue clear", current: pending ? 0 : 1, target: 1, met: pending === 0 },
    { label: "Checkpoint best", current: best, target: 80, met: best >= 80 },
  ];
  return { ready: requirements.every((item) => item.met), requirements };
}

export function graduateLevel(progress: Progress): Progress {
  const status = graduationStatus(progress);
  if (!status.ready) return progress;
  const order: LevelId[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const current = progress.selectedLevel;
  const next = order[order.indexOf(current) + 1];
  if (!next) return { ...progress, graduatedLevels: unique([...progress.graduatedLevels, current]) };
  const archives = { ...progress.archives, [next]: progress.archives[next] ?? emptyArchive() };
  return ensureCurrentPlan({ ...progress, selectedLevel: next, graduatedLevels: unique([...progress.graduatedLevels, current]), archives });
}

export function switchLevel(progress: Progress, level: LevelId): Progress {
  const archives = { ...progress.archives, [level]: progress.archives[level] ?? emptyArchive() };
  return ensureCurrentPlan({ ...progress, selectedLevel: level, archives });
}

export function normalizeSpeech(value: string) {
  return value.toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zñ0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

export function similarityScore(left: string, right: string) {
  const a = normalizeSpeech(left);
  const b = normalizeSpeech(right);
  if (!a || !b) return 0;
  if (a === b || a.includes(b) || b.includes(a)) return 100;
  const aWords = a.split(" ");
  const bWords = b.split(" ");
  const shared = aWords.filter((word) => bWords.includes(word)).length;
  const wordScore = shared / Math.max(aWords.length, bWords.length);
  const rows = Array.from({ length: a.length + 1 }, (_, index) => [index]);
  for (let j = 1; j <= b.length; j += 1) rows[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) for (let j = 1; j <= b.length; j += 1) rows[i][j] = a[i - 1] === b[j - 1] ? rows[i - 1][j - 1] : Math.min(rows[i - 1][j], rows[i][j - 1], rows[i - 1][j - 1]) + 1;
  const charScore = 1 - rows[a.length][b.length] / Math.max(a.length, b.length);
  return Math.round(Math.max(wordScore, charScore) * 100);
}

export function seededShuffle<T>(items: readonly T[], seed = Date.now()) {
  const next = [...items];
  let state = Math.abs(seed) % 2147483647 || 1;
  for (let index = next.length - 1; index > 0; index -= 1) {
    state = state * 16807 % 2147483647;
    const target = state % (index + 1);
    [next[index], next[target]] = [next[target], next[index]];
  }
  return next;
}

export function choices(answer: string, pool: string[], seed: number, count = 4) {
  return seededShuffle(unique([answer, ...seededShuffle(pool.filter((item) => item !== answer), seed).slice(0, count - 1)]), seed + 91);
}
