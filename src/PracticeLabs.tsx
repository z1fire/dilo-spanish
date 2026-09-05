"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import GrammarMixer from "./GrammarMixer";
import {
  choices,
  queueCorrection,
  recordExam,
  recordPronunciation,
  recordSkill,
  seededShuffle,
  similarityScore,
  type Progress,
  type SkillArea,
  type StudyDay,
} from "./spanish-engine";
import {
  cumulativeGrammar,
  cumulativeLexicon,
  grammarByLevel,
  levelSoundLessons,
  lexiconByLevel,
  missionsByLevel,
  type LevelId,
} from "./spanish-curriculum";
import { formatClock, speakSpanish } from "./spanish-ui";

export type DrillKind = "recall" | "listening" | "sentences" | "reading" | "grammar" | "pronunciation";

type Question = {
  id: string;
  skill: SkillArea;
  prompt: string;
  note: string;
  answer: string;
  choices: string[];
  explanation: string;
  speech?: string;
  listening?: boolean;
};

type Props = {
  progress: Progress;
  update: (recipe: (current: Progress) => Progress) => void;
  close: () => void;
};

function makeDrill(level: LevelId, kind: Exclude<DrillKind, "grammar" | "pronunciation">): Question[] {
  const lexicon = lexiconByLevel[level];
  const grammar = grammarByLevel[level];
  const missions = missionsByLevel[level];
  if (kind === "recall") return seededShuffle(lexicon, Date.now()).slice(0, 12).map((item, index) => ({
    id: `drill-word:${item.id}`, skill: "vocabulary", prompt: item.english, note: "Choose the Spanish retrieval", answer: item.spanish,
    choices: choices(item.spanish, lexicon.map((entry) => entry.spanish), index + item.spanish.length), explanation: item.cue, speech: item.spanish,
  }));
  if (kind === "listening") {
    const pool = [
      ...missions.map((item) => ({ id: item.id, source: item.model, meaning: item.translation, note: item.situation })),
      ...lexicon.map((item) => ({ id: item.id, source: item.spanish, meaning: item.english, note: item.cue })),
    ];
    return seededShuffle(pool, Date.now()).slice(0, 20).map((item, index) => ({
      id: `drill-listen:${item.id}`, skill: "listening", prompt: "Escucha", note: "Listen, then choose the meaning", answer: item.meaning,
      choices: choices(item.meaning, pool.map((entry) => entry.meaning), index + item.source.length), explanation: `${item.source} · ${item.note}`, speech: item.source, listening: true,
    }));
  }
  if (kind === "sentences") {
    const pool = [
      ...grammar.map((item) => ({ id: item.id, prompt: item.formula, source: item.example, meaning: item.translation, note: item.explanation })),
      ...missions.map((item) => ({ id: item.id, prompt: item.canDo, source: item.model, meaning: item.translation, note: item.situation })),
    ];
    return seededShuffle(pool, Date.now()).slice(0, 16).map((item, index) => ({
      id: `drill-sentence:${item.id}`, skill: "sentence", prompt: item.prompt, note: "Choose the useful line", answer: item.source,
      choices: choices(item.source, pool.map((entry) => entry.source), index + item.source.length), explanation: `${item.meaning} · ${item.note}`, speech: item.source,
    }));
  }
  const readingPool = [
    ...missions.map((item) => ({ id: item.id, source: `${item.opener} ${item.model} ${item.followUp} ${item.closing}`, meaning: item.canDo, note: item.translation })),
    ...grammar.map((item) => ({ id: item.id, source: item.example, meaning: item.translation, note: item.explanation })),
  ];
  return seededShuffle(readingPool, Date.now()).slice(0, 16).map((item, index) => ({
    id: `drill-reading:${item.id}`, skill: "reading", prompt: item.source, note: "Read first; use audio only after answering", answer: item.meaning,
    choices: choices(item.meaning, readingPool.map((entry) => entry.meaning), index + item.source.length), explanation: item.note, speech: item.source,
  }));
}

function QuestionStage({ question, position, total, chosen, choose, advance }: { question: Question; position: number; total: number; chosen: string; choose: (value: string) => void; advance: () => void }) {
  return <><header className="session-topbar"><span /><div><span>{question.note}</span><strong>{question.skill}</strong></div><small>{position + 1} / {total}</small></header><div className="session-progress"><i style={{ width: `${(position + (chosen ? 1 : 0)) / total * 100}%` }} /></div><section className="quiz-stage"><div className={`quiz-prompt ${question.listening ? "listening" : ""}`}><span>{question.note}</span><h1>{question.prompt}</h1>{question.speech && <button className="sound-button" onClick={() => speakSpanish(question.speech!)}><b>◖))</b><small>{question.listening ? "Play audio" : "Hear after answering"}</small></button>}</div><div className="answer-grid">{question.choices.map((option, index) => <button key={`${option}-${index}`} disabled={Boolean(chosen)} className={chosen ? option === question.answer ? "correct" : option === chosen ? "wrong" : "muted" : ""} onClick={() => choose(option)}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div>{chosen && <div className={`answer-ribbon ${chosen === question.answer ? "" : "wrong"}`}><div><strong>{chosen === question.answer ? "Bien recuperado." : `Answer: ${question.answer}`}</strong><span>{question.explanation}</span></div>{question.speech && <button onClick={() => speakSpanish(question.speech!)}>◖))</button>}<button onClick={advance}>{position === total - 1 ? "See result" : "Continue"} →</button></div>}</section></>;
}

type RecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
};
type RecognitionConstructor = new () => RecognitionLike;

function PronunciationLab({ progress, update, close }: Props) {
  const lessons = levelSoundLessons(progress.selectedLevel);
  const items = useMemo(() => lessons.flatMap((lesson) => lesson.examples.map((example) => ({ lesson, example }))), [lessons]);
  const [position, setPosition] = useState(0);
  const [stage, setStage] = useState<"listen" | "speak" | "feedback">("listen");
  const [choice, setChoice] = useState("");
  const [heard, setHeard] = useState("");
  const [score, setScore] = useState(0);
  const [manual, setManual] = useState(false);
  const item = items[position];
  const options = choices(item.example, items.map((entry) => entry.example), position + 913, 3);
  const choose = (value: string) => {
    setChoice(value);
    update((current) => recordSkill(current, "listening", value === item.example));
  };
  const speak = () => {
    const Constructor = (window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor }).SpeechRecognition
      ?? (window as unknown as { webkitSpeechRecognition?: RecognitionConstructor }).webkitSpeechRecognition;
    if (!Constructor) { setManual(true); return; }
    const recognition = new Constructor(); recognition.lang = "es-ES"; recognition.interimResults = false; recognition.continuous = false;
    recognition.onresult = (event) => { const transcript = event.results[0]?.[0]?.transcript ?? ""; const nextScore = similarityScore(transcript, item.example); setHeard(transcript); setScore(nextScore); setStage("feedback"); update((current) => recordPronunciation(current, `${item.lesson.id}:${item.example}`, nextScore >= 65)); };
    recognition.onerror = () => setManual(true); recognition.onend = () => undefined; recognition.start();
  };
  const manualDone = () => { setHeard("Manual aloud check"); setScore(100); setStage("feedback"); update((current) => recordPronunciation(current, `${item.lesson.id}:${item.example}`, true)); };
  const next = () => { if (position >= items.length - 1) { close(); return; } setPosition((value) => value + 1); setStage("listen"); setChoice(""); setHeard(""); setScore(0); setManual(false); };
  return <main className="session-shell pronunciation-session"><button className="floating-close" onClick={close}>×</button><header className="session-topbar"><span /><div><span>SOUND & RHYTHM GYM</span><strong>{item.lesson.title}</strong></div><small>{position + 1} / {items.length}</small></header><section className="pronunciation-stage"><span>{item.lesson.focus}</span><h1>{stage === "listen" ? "Hear the target before you see it." : item.example}</h1><p>{item.lesson.tip}</p>{stage === "listen" && <><button className="listen-orb" onClick={() => speakSpanish(item.example, .68)}>◖))</button><div className="choice-list">{options.map((option) => <button key={option} disabled={Boolean(choice)} className={choice ? option === item.example ? "correct" : option === choice ? "wrong" : "muted" : ""} onClick={() => choose(option)}>{option}</button>)}</div>{choice && <button className="primary-action" onClick={() => setStage("speak")}>Now produce it <span>→</span></button>}</>}{stage === "speak" && <div className="pronunciation-record"><button onClick={() => speakSpanish(item.example, .68)}>◖)) Hear model</button><button className="primary-action" onClick={speak}>Speak this phrase <span>●</span></button>{manual && <button onClick={manualDone}>I said it aloud</button>}</div>}{stage === "feedback" && <div className="feedback-box"><strong>{score >= 65 ? `${score}% match · clear enough` : `${score}% match · try the model again`}</strong><p>{heard}</p><button onClick={() => speakSpanish(item.example, .68)}>◖)) {item.example}</button><button className="primary-action" onClick={score >= 65 ? next : () => setStage("speak")}>{score >= 65 ? (position === items.length - 1 ? "Finish gym" : "Next sound") : "Try again"} <span>→</span></button></div>}</section></main>;
}

export function DrillSession({ progress, update, close, kind }: Props & { kind: DrillKind }) {
  if (kind === "grammar") return <main className="session-shell mixer-session"><button className="floating-close" onClick={close}>×</button><GrammarMixer level={progress.selectedLevel} rounds={4} onComplete={(confident) => { update((current) => recordSkill(current, "grammar", confident)); close(); }} /></main>;
  if (kind === "pronunciation") return <PronunciationLab progress={progress} update={update} close={close} />;
  return <ObjectiveDrill progress={progress} update={update} close={close} kind={kind} />;
}

function ObjectiveDrill({ progress, update, close, kind }: Props & { kind: Exclude<DrillKind, "grammar" | "pronunciation"> }) {
  const questions = useMemo(() => makeDrill(progress.selectedLevel, kind), [kind, progress.selectedLevel]);
  const [position, setPosition] = useState(0);
  const [chosen, setChosen] = useState("");
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const question = questions[position];
  const choose = (value: string) => {
    const isCorrect = value === question.answer;
    setChosen(value);
    if (isCorrect) setCorrect((score) => score + 1);
    update((current) => {
      let next = recordSkill(current, question.skill, isCorrect);
      if (!isCorrect) next = queueCorrection(next, { id: question.id, skill: question.skill, prompt: question.prompt, answer: question.answer, choices: question.choices, explanation: question.explanation, speech: question.speech });
      return next;
    });
  };
  const advance = () => { if (position === questions.length - 1) { setFinished(true); return; } setPosition((value) => value + 1); setChosen(""); };
  if (finished) {
    const result = Math.round(correct / questions.length * 100);
    return <main className="session-shell result-stage"><span>{kind.toUpperCase()} LAB COMPLETE</span><strong>{result}%</strong><h1>{result >= 80 ? "Retrieval is getting cleaner." : "The misses have a return date."}</h1><p>Every missed item entered the correction loop. Correct it now and once more on a later learning day.</p><button className="primary-action" onClick={close}>Back to practice <span>→</span></button></main>;
  }
  return <main className="session-shell"><button className="floating-close" onClick={close} aria-label="Close practice">×</button><QuestionStage question={question} position={position} total={questions.length} chosen={chosen} choose={choose} advance={advance} /></main>;
}

function makeCheckpoint(level: LevelId): Question[] {
  const lexicon = cumulativeLexicon(level);
  const grammar = cumulativeGrammar(level);
  const missions = missionsByLevel[level];
  const listeningPool = [
    ...lexicon.map((item) => ({ id: item.id, source: item.spanish, meaning: item.english, note: item.cue })),
    ...missions.map((item) => ({ id: item.id, source: item.model, meaning: item.translation, note: item.situation })),
  ];
  const listening = seededShuffle(listeningPool, 2027 + lexicon.length).slice(0, 20).map((item, index): Question => ({
    id: `exam-listen:${level}:${item.id}`, skill: "listening", prompt: "Escucha", note: "Listening · choose the meaning", answer: item.meaning,
    choices: choices(item.meaning, listeningPool.map((entry) => entry.meaning), index + 300), explanation: `${item.source} · ${item.note}`, speech: item.source, listening: true,
  }));
  const readingPool = [
    ...missions.map((item) => ({ source: item.model, meaning: item.translation, note: item.canDo, id: item.id })),
    ...grammar.map((item) => ({ source: item.example, meaning: item.translation, note: item.explanation, id: item.id })),
  ];
  const reading = seededShuffle(readingPool, 4099 + grammar.length).slice(0, 20).map((item, index): Question => ({
    id: `exam-read:${level}:${item.id}`, skill: "reading", prompt: item.source, note: "Reading · choose the meaning", answer: item.meaning,
    choices: choices(item.meaning, readingPool.map((entry) => entry.meaning), index + 700), explanation: item.note, speech: item.source,
  }));
  return [...listening, ...reading];
}

export function Checkpoint({ progress, update, close }: Props) {
  const questions = useMemo(() => makeCheckpoint(progress.selectedLevel), [progress.selectedLevel]);
  const [started, setStarted] = useState(false);
  const [seconds, setSeconds] = useState(40 * 60);
  const [position, setPosition] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [finished, setFinished] = useState(false);
  const question = questions[position];

  const finish = useCallback(() => {
    if (finished) return;
    const correct = questions.filter((item, index) => answers[index] === item.answer).length;
    const score = Math.round(correct / questions.length * 100);
    update((current) => {
      let next = current;
      questions.forEach((item, index) => {
        const isCorrect = answers[index] === item.answer;
        next = recordSkill(next, item.skill, isCorrect);
        if (!isCorrect) next = queueCorrection(next, { id: item.id, skill: item.skill, prompt: item.prompt, answer: item.answer, choices: item.choices, explanation: item.explanation, speech: item.speech });
      });
      return recordExam(next, { at: new Date().toISOString(), level: current.selectedLevel, score, correct, total: questions.length });
    });
    setFinished(true);
  }, [answers, finished, questions, update]);

  useEffect(() => {
    if (!started || finished) return;
    const timer = window.setTimeout(() => { if (seconds <= 1) finish(); else setSeconds((value) => value - 1); }, 1000);
    return () => window.clearTimeout(timer);
  }, [started, finished, seconds, finish]);

  const retry = () => { setStarted(true); setSeconds(40 * 60); setPosition(0); setAnswers({}); setFinished(false); };

  if (!started) return <main className="exam-shell"><button className="floating-close" onClick={close}>×</button><section className="exam-intro"><span>{progress.selectedLevel} · CEFR-ALIGNED CHECKPOINT</span><h1>Forty questions.<br /><em>Forty focused minutes.</em></h1><p>Twenty listening items and twenty reading/usage items sample everything available through {progress.selectedLevel}. You can move forward and back, leave items unanswered, and submit when ready. An 80% best score is one of five graduation requirements.</p><div><article><strong>20</strong><small>listening</small></article><article><strong>20</strong><small>reading + usage</small></article><article><strong>80%</strong><small>graduation target</small></article></div><button className="primary-action" onClick={() => setStarted(true)}>Start checkpoint <span>→</span></button><small>This is a course checkpoint, not an official CEFR certification exam.</small></section></main>;

  if (finished) {
    const correct = questions.filter((item, index) => answers[index] === item.answer).length;
    const score = Math.round(correct / questions.length * 100);
    const wrong = questions.filter((item, index) => answers[index] !== item.answer);
    return <main className="exam-shell result-stage"><span>{progress.selectedLevel} CHECKPOINT COMPLETE</span><strong>{score}%</strong><h1>{score >= 80 ? "Checkpoint cleared." : "Review, retrieve, return."}</h1><p>{correct} of {questions.length} correct · {questions.length - Object.keys(answers).length} unanswered. Every miss is already in the correction loop.</p><div className="wrong-review">{wrong.map((item) => { const index = questions.indexOf(item); return <article key={`${item.id}-${index}`}><span>{item.skill} · {answers[index] ? "review" : "unanswered"}</span><b>{item.prompt}</b>{answers[index] && <small>Your answer: {answers[index]}</small>}<p>{item.answer}</p></article>; })}</div><div className="exam-result-actions"><button onClick={retry}>Fresh attempt</button><button className="primary-action" onClick={close}>Back to Dilo <span>→</span></button></div></main>;
  }

  return <main className="session-shell exam-session"><div className="exam-clock">{formatClock(seconds)}</div><button className="floating-close" onClick={close}>×</button><header className="session-topbar"><span /><div><span>{question.note}</span><strong>{question.skill}</strong></div><small>{position + 1} / {questions.length}</small></header><div className="session-progress"><i style={{ width: `${(position + 1) / questions.length * 100}%` }} /></div><section className="quiz-stage"><div className={`quiz-prompt ${question.listening ? "listening" : ""}`}><span>{question.note}</span><h1>{question.prompt}</h1>{question.speech && <button className="sound-button" onClick={() => speakSpanish(question.speech!)}><b>◖))</b><small>{question.listening ? "Play audio" : "Hear it"}</small></button>}</div><div className="answer-grid">{question.choices.map((option, index) => <button key={`${option}-${index}`} className={answers[position] === option ? "selected" : ""} onClick={() => setAnswers((current) => ({ ...current, [position]: option }))}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div><div className="exam-navigation"><button disabled={position === 0} onClick={() => setPosition((value) => value - 1)}>← Previous</button><span>{Object.keys(answers).length} answered · {questions.length - Object.keys(answers).length} open</span>{position < questions.length - 1 ? <button className="primary-action" onClick={() => setPosition((value) => value + 1)}>Next <span>→</span></button> : <button className="primary-action" onClick={finish}>Submit checkpoint <span>✓</span></button>}</div><div className="exam-question-map">{questions.map((_, index) => <button key={index} aria-label={`Question ${index + 1}`} className={`${position === index ? "current" : ""} ${answers[index] ? "answered" : ""}`} onClick={() => setPosition(index)}>{index + 1}</button>)}</div></section></main>;
}

export function StudyReplay({ day, close }: { day: StudyDay; close: () => void }) {
  const [step, setStep] = useState(0);
  const [revealed, setRevealed] = useState<string[]>([]);
  const words = lexiconByLevel[day.level].filter((item) => Array.from(new Set([...day.newWordIds, ...day.recallWordIds])).includes(item.id));
  const grammar = grammarByLevel[day.level].filter((item) => day.grammarIds.includes(item.id));
  const mission = missionsByLevel[day.level][day.missionIndex];
  const labels = ["Cards", "Recall", "Grammar", "Listen", "Build", "Read", "Speak"];
  const lines = [mission.opener, mission.model, mission.followUp, mission.closing];
  const next = () => { if (step === labels.length - 1) close(); else setStep((value) => value + 1); };
  return <main className="session-shell replay-session"><button className="floating-close" onClick={close}>×</button><header className="session-topbar"><span /><div><span>EXACT DAY REPLAY · {day.level} DAY {day.learningDay + 1}</span><strong>{mission.title}</strong></div><small>{step + 1} / 7</small></header><nav className="step-rail">{labels.map((label, index) => <button key={label} className={index === step ? "active" : index < step ? "complete" : ""} onClick={() => setStep(index)}><span>{index < step ? "✓" : index + 1}</span><small>{label}</small></button>)}</nav><section className="replay-stage"><span>{labels[step].toUpperCase()} · REPLAY DOES NOT CHANGE SCHEDULING OR XP</span><h1>{step < 2 ? "The language from this day." : mission.title}</h1>{step === 0 && <div className="replay-list">{words.map((word) => <button key={word.id} onClick={() => speakSpanish(word.spanish)}><strong>{word.spanish}</strong><small>{word.english} · {word.cue}</small><i>◖))</i></button>)}</div>}{step === 1 && <div className="replay-list recall">{words.map((word) => <button key={word.id} onClick={() => setRevealed((items) => Array.from(new Set([...items, word.id])))}><strong>{word.english}</strong><small>{revealed.includes(word.id) ? word.spanish : "Think or say it, then reveal"}</small></button>)}</div>}{step === 2 && <div className="replay-list">{grammar.map((item) => <button key={item.id} onClick={() => speakSpanish(item.example)}><strong>{item.formula}</strong><small>{item.example} · {item.translation}</small><i>◖))</i></button>)}</div>}{step === 3 && <div className="replay-focus"><p>{mission.situation}</p><button className="listen-orb" onClick={() => speakSpanish(mission.model)}>◖))</button><small>{mission.translation}</small></div>}{step === 4 && <div className="replay-focus"><p>{mission.translation}</p><button onClick={() => setRevealed((items) => Array.from(new Set([...items, "build"])))}>{revealed.includes("build") ? mission.model : "Reveal the useful Spanish line"}</button>{revealed.includes("build") && <button onClick={() => speakSpanish(mission.model)}>◖)) Hear it</button>}</div>}{step === 5 && <div className="reading-lines">{lines.map((line, index) => <button key={line} onClick={() => speakSpanish(line)}><b>{index % 2 ? "TÚ" : "A"}</b><span><strong>{line}</strong></span><i>◖))</i></button>)}</div>}{step === 6 && <div className="speaking-lines">{lines.map((line, index) => <article key={line}><b>{index % 2 ? "YOUR ROLE" : "OTHER ROLE"}</b><h3>{line}</h3><button onClick={() => speakSpanish(line)}>◖)) Model</button></article>)}</div>}<button className="primary-action replay-next" onClick={next}>{step === labels.length - 1 ? "Finish replay" : `Continue to ${labels[step + 1]}`} <span>→</span></button></section></main>;
}
