"use client";

import { useEffect, useMemo, useState } from "react";
import {
  choices,
  queueCorrection,
  recordExam,
  recordSkill,
  seededShuffle,
  type Progress,
  type SkillArea,
} from "./spanish-engine";
import {
  cumulativeGrammar,
  cumulativeLexicon,
  grammarByLevel,
  lexiconByLevel,
  missionsByLevel,
  type LevelId,
} from "./spanish-curriculum";
import { formatClock, speakSpanish } from "./spanish-ui";

export type DrillKind = "recall" | "listening" | "sentences";

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

function makeDrill(level: LevelId, kind: DrillKind): Question[] {
  if (kind === "recall") return seededShuffle(lexiconByLevel[level], Date.now()).slice(0, 12).map((item, index) => ({
    id: `drill-word:${item.id}`, skill: "vocabulary", prompt: item.english, note: "Choose the Spanish retrieval", answer: item.spanish,
    choices: choices(item.spanish, lexiconByLevel[level].map((entry) => entry.spanish), index + item.spanish.length), explanation: item.cue, speech: item.spanish,
  }));
  if (kind === "listening") return seededShuffle(missionsByLevel[level], Date.now()).slice(0, 12).map((item, index) => ({
    id: `drill-listen:${item.id}`, skill: "listening", prompt: "Escucha", note: "Listen, then choose the meaning", answer: item.translation,
    choices: choices(item.translation, missionsByLevel[level].map((entry) => entry.translation), index + item.model.length), explanation: item.model, speech: item.model, listening: true,
  }));
  return seededShuffle(grammarByLevel[level], Date.now()).slice(0, 12).map((item, index) => ({
    id: `drill-sentence:${item.id}`, skill: "sentence", prompt: item.formula, note: "Choose the line that uses this structure", answer: item.example,
    choices: choices(item.example, grammarByLevel[level].map((entry) => entry.example), index + item.example.length), explanation: `${item.translation} · ${item.explanation}`, speech: item.example,
  }));
}

function QuestionStage({ question, position, total, chosen, choose, advance }: { question: Question; position: number; total: number; chosen: string; choose: (value: string) => void; advance: () => void }) {
  return <><header className="session-topbar"><span /><div><span>{question.note}</span><strong>{question.skill}</strong></div><small>{position + 1} / {total}</small></header><div className="session-progress"><i style={{ width: `${(position + (chosen ? 1 : 0)) / total * 100}%` }} /></div><section className="quiz-stage"><div className={`quiz-prompt ${question.listening ? "listening" : ""}`}><span>{question.note}</span><h1>{question.prompt}</h1>{question.speech && <button className="sound-button" onClick={() => speakSpanish(question.speech!)}><b>◖))</b><small>{question.listening ? "Play audio" : "Hear it"}</small></button>}</div><div className="answer-grid">{question.choices.map((option, index) => <button key={`${option}-${index}`} disabled={Boolean(chosen)} className={chosen ? option === question.answer ? "correct" : option === chosen ? "wrong" : "muted" : ""} onClick={() => choose(option)}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div>{chosen && <div className={`answer-ribbon ${chosen === question.answer ? "" : "wrong"}`}><div><strong>{chosen === question.answer ? "Bien recuperado." : `Answer: ${question.answer}`}</strong><span>{question.explanation}</span></div>{question.speech && <button onClick={() => speakSpanish(question.speech!)}>◖))</button>}<button onClick={advance}>{position === total - 1 ? "See result" : "Continue"} →</button></div>}</section></>;
}

export function DrillSession({ progress, update, close, kind }: Props & { kind: DrillKind }) {
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
  const advance = () => {
    if (position === questions.length - 1) { setFinished(true); return; }
    setPosition((value) => value + 1); setChosen("");
  };
  if (finished) {
    const score = Math.round(correct / questions.length * 100);
    return <main className="session-shell result-stage"><span>{kind.toUpperCase()} LAB COMPLETE</span><strong>{score}%</strong><h1>{score >= 80 ? "Retrieval is getting cleaner." : "The misses have a return date."}</h1><p>Every missed item entered the correction loop. Correct it now and once more on a later learning day.</p><button className="primary-action" onClick={close}>Back to practice <span>→</span></button></main>;
  }
  return <main className="session-shell"><button className="floating-close" onClick={close} aria-label="Close practice">×</button><QuestionStage question={question} position={position} total={questions.length} chosen={chosen} choose={choose} advance={advance} /></main>;
}

function makeCheckpoint(level: LevelId): Question[] {
  const lexicon = cumulativeLexicon(level);
  const grammar = cumulativeGrammar(level);
  const missions = missionsByLevel[level];
  const listening = seededShuffle(lexicon, 2027 + lexicon.length).slice(0, 20).map((item, index): Question => ({
    id: `exam-listen:${level}:${item.id}`, skill: "listening", prompt: "Escucha", note: "Listening · choose the meaning", answer: item.english,
    choices: choices(item.english, lexicon.map((entry) => entry.english), index + 300), explanation: `${item.spanish} · ${item.cue}`, speech: item.spanish, listening: true,
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
  const [chosen, setChosen] = useState("");
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [finished, setFinished] = useState(false);
  const question = questions[position];

  const finish = () => {
    if (finished) return;
    const correct = Object.values(answers).filter(Boolean).length;
    const score = Math.round(correct / questions.length * 100);
    update((current) => recordExam(current, { at: new Date().toISOString(), level: current.selectedLevel, score, correct, total: questions.length }));
    setFinished(true);
  };

  useEffect(() => {
    if (!started || finished) return;
    const timer = window.setTimeout(() => {
      if (seconds <= 1) finish();
      else setSeconds((value) => value - 1);
    }, 1000);
    return () => window.clearTimeout(timer);
  });

  const choose = (value: string) => {
    const correct = value === question.answer;
    setChosen(value);
    setAnswers((current) => ({ ...current, [position]: correct }));
    update((current) => {
      let next = recordSkill(current, question.skill, correct);
      if (!correct) next = queueCorrection(next, { id: question.id, skill: question.skill, prompt: question.prompt, answer: question.answer, choices: question.choices, explanation: question.explanation, speech: question.speech });
      return next;
    });
  };
  const advance = () => {
    if (position === questions.length - 1) { const finalAnswers = { ...answers, [position]: chosen === question.answer }; const correct = Object.values(finalAnswers).filter(Boolean).length; const score = Math.round(correct / questions.length * 100); update((current) => recordExam(current, { at: new Date().toISOString(), level: current.selectedLevel, score, correct, total: questions.length })); setAnswers(finalAnswers); setFinished(true); return; }
    setPosition((value) => value + 1); setChosen("");
  };

  if (!started) return <main className="exam-shell"><button className="floating-close" onClick={close}>×</button><section className="exam-intro"><span>{progress.selectedLevel} · CEFR-ALIGNED CHECKPOINT</span><h1>Forty questions.<br /><em>Forty focused minutes.</em></h1><p>Twenty listening items and twenty reading/usage items sample everything available through {progress.selectedLevel}. An 80% best score is one of five graduation requirements.</p><div><article><strong>20</strong><small>listening</small></article><article><strong>20</strong><small>reading + usage</small></article><article><strong>80%</strong><small>graduation target</small></article></div><button className="primary-action" onClick={() => setStarted(true)}>Start checkpoint <span>→</span></button><small>This is a course checkpoint, not an official CEFR certification exam.</small></section></main>;

  if (finished) {
    const correct = Object.values(answers).filter(Boolean).length;
    const score = Math.round(correct / questions.length * 100);
    return <main className="exam-shell result-stage"><span>{progress.selectedLevel} CHECKPOINT COMPLETE</span><strong>{score}%</strong><h1>{score >= 80 ? "Checkpoint cleared." : "Review, retrieve, return."}</h1><p>{correct} of {questions.length} correct. Every miss is already in the correction loop.</p><div className="wrong-review">{questions.filter((_, index) => answers[index] === false).slice(0, 8).map((item) => <article key={item.id}><span>{item.skill}</span><b>{item.prompt}</b><p>{item.answer}</p></article>)}</div><button className="primary-action" onClick={close}>Back to Dilo <span>→</span></button></main>;
  }

  return <main className="session-shell exam-session"><div className="exam-clock">{formatClock(seconds)}</div><button className="floating-close" onClick={close}>×</button><QuestionStage question={question} position={position} total={questions.length} chosen={chosen} choose={choose} advance={advance} /></main>;
}
