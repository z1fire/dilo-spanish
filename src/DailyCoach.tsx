"use client";

import { useMemo, useState } from "react";
import GrammarMixer from "./GrammarMixer";
import {
  DAILY_STEPS,
  choices,
  completePlan,
  completeStep,
  dueCorrections,
  getArchive,
  queueCorrection,
  recordPlanPosition,
  recordReviewMiss,
  recordSkill,
  recordWordConfidence,
  resolveCorrection,
  scheduleReview,
  seededShuffle,
  similarityScore,
  type DailyStep,
  type Progress,
} from "./spanish-engine";
import { grammarByLevel, lexiconByLevel, missionsByLevel } from "./spanish-curriculum";
import { formatDuration, sentenceTokens, speakSpanish, tokensMatch } from "./spanish-ui";

type Props = {
  progress: Progress;
  update: (recipe: (current: Progress) => Progress) => void;
  close: () => void;
};

const stepLabels: Record<DailyStep, { short: string; title: string; note: string }> = {
  cards: { short: "CARDS", title: "Meet today’s language", note: "Preview without scoring" },
  recall: { short: "RECALL", title: "Pull it from memory", note: "Answers stay hidden until you commit" },
  grammar: { short: "GRAMMAR", title: "Notice, then build", note: "Form connected to meaning" },
  listen: { short: "LISTEN", title: "Understand the scene", note: "Meaning before transcript" },
  build: { short: "BUILD", title: "Assemble a real line", note: "Word order and agreement" },
  read: { short: "READ", title: "Read a complete exchange", note: "Support only when needed" },
  speak: { short: "SPEAK", title: "Carry both sides aloud", note: "Four coherent turns" },
};

function SoundButton({ text, slow = false }: { text: string; slow?: boolean }) {
  return <button type="button" className="audio-button" onClick={() => speakSpanish(text, slow ? .63 : .84)}><span aria-hidden="true">◖))</span>{slow ? "Slow" : "Hear it"}</button>;
}

function StepHeader({ step, kicker }: { step: DailyStep; kicker?: string }) {
  const position = DAILY_STEPS.indexOf(step) + 1;
  return <div className="coach-heading"><span>{kicker ?? `STEP ${position} OF ${DAILY_STEPS.length}`} · {stepLabels[step].short}</span><h1>{stepLabels[step].title}</h1><p>{stepLabels[step].note}</p></div>;
}

function completeCardExample(level: Progress["selectedLevel"], word: { spanish: string; english: string }) {
  const normalize = (value: string) => value.toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[¿?¡!.,;:…“”"«»]/g, " ").replace(/\s+/g, " ").trim();
  const target = ` ${normalize(word.spanish)} `;
  const mission = missionsByLevel[level].find((item) => ` ${normalize(item.model)} `.includes(target));
  if (mission) return { spanish: mission.model, english: mission.translation };
  const grammar = grammarByLevel[level].find((item) => ` ${normalize(item.example)} `.includes(target));
  if (grammar) return { spanish: grammar.example, english: grammar.translation };
  return { spanish: `«${word.spanish.replace("…", "").trim()}»`, english: word.english };
}

function CardSpeechPractice({ phrase }: { phrase: string }) {
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const [manual, setManual] = useState(false);
  const practice = () => {
    const Constructor = (window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor }).SpeechRecognition
      ?? (window as unknown as { webkitSpeechRecognition?: RecognitionConstructor }).webkitSpeechRecognition;
    if (!Constructor) { setManual(true); return; }
    const recognition = new Constructor();
    recognition.lang = "es-ES"; recognition.interimResults = false; recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      setHeard(`${transcript} · ${similarityScore(transcript, phrase)}% match`);
      setListening(false);
    };
    recognition.onerror = () => { setListening(false); setManual(true); };
    recognition.onend = () => setListening(false);
    setHeard(""); setListening(true); recognition.start();
  };
  return <div className="card-speech-practice"><button onClick={() => speakSpanish(phrase)}>◖)) Hear word</button><button disabled={listening} onClick={practice}>{listening ? "Listening…" : "Speak this phrase"}</button>{manual && <span>Say it aloud, then continue.</span>}{heard && <span>Heard: {heard}</span>}</div>;
}

function CardsStep({ progress, update, done }: Props & { done: () => void }) {
  const plan = getArchive(progress).currentPlan!;
  const words = lexiconByLevel[progress.selectedLevel].filter((item) => plan.recallWordIds.includes(item.id));
  const [position, setPosition] = useState(() => Math.min(plan.flashcardPosition, Math.max(0, words.length - 1)));
  const [revealed, setRevealed] = useState(false);
  const [passComplete, setPassComplete] = useState(() => Boolean(words.length && plan.flashcardPosition >= words.length));
  const word = words[position];
  if (!word) return <div className="empty-step"><StepHeader step="cards" /><h2>No scheduled cards today.</h2><p>Your queue is clear, so you can continue to recall.</p><button className="primary-action" onClick={done}>Continue <span>→</span></button></div>;
  const example = completeCardExample(progress.selectedLevel, word);
  const advance = () => {
    if (position >= words.length - 1) {
      update((current) => recordPlanPosition(current, "cards", words.length));
      setPassComplete(true); setRevealed(false); return;
    }
    update((current) => recordPlanPosition(current, "cards", position + 1));
    setPosition((value) => value + 1); setRevealed(false);
  };
  const repeatPass = () => {
    update((current) => recordPlanPosition(current, "cards", 0));
    setPosition(0); setRevealed(false); setPassComplete(false);
  };
  if (passComplete) return <section className="coach-panel"><StepHeader step="cards" kicker="FLASHCARD PASS COMPLETE" /><div className="card-pass-complete"><span>STUDY PASS FINISHED</span><h2>Flashcard pass complete.</h2><p>You can repeat the scheduled set as many times as you want. Extra passes never change recall progress, return timing, XP, or today’s completion.</p><div><button onClick={repeatPass}>↻ Review flashcards again</button><button className="primary-action" onClick={done}>Start recall test <span>→</span></button></div></div></section>;
  return <section className="coach-panel"><StepHeader step="cards" /><div className="learning-brief"><div><span>FULL-CARD STUDY · {position + 1}/{words.length}</span><h2>Learn first. Test second.</h2><p>Start with Spanish, then reveal the meaning, usage cue, example, audio, and speaking practice. Nothing here is scored.</p></div><aside><span>UP NEXT</span><strong>Recall test</strong><small>Same scheduled words · answers hidden</small></aside></div><div className="flashcard-stage">{!revealed ? <article className="flashcard front"><div className="flashcard-count">{position + 1} / {words.length}</div><button className="card-face-button" onClick={() => setRevealed(true)}><span>FLASHCARD FRONT · LOOK & LISTEN</span><strong>{word.spanish}</strong><small>Tap to reveal the complete card ↗</small></button><div className="card-audio"><SoundButton text={word.spanish} /></div></article> : <article className="flashcard back"><div className="flashcard-count">{position + 1} / {words.length}</div><span>COMPLETE FLASHCARD · LISTEN & SAY IT</span><strong>{word.spanish}</strong><p>{word.english}</p><small>{word.cue}</small><div className="card-example"><span>EXAMPLE IN CONTEXT</span><b>{example.spanish}</b><small>{example.english}</small></div><div className="card-audio"><SoundButton text={word.spanish} /><SoundButton text={example.spanish} slow /></div><CardSpeechPractice phrase={word.spanish} /><button className="primary-action" onClick={advance}>{position === words.length - 1 ? "Finish this flashcard pass" : "Next flashcard"}<span>→</span></button></article>}</div></section>;
}

type RecallMode = "meaning" | "audio" | "reading";

function RecallStep({ progress, update, done }: Props & { done: () => void }) {
  const plan = getArchive(progress).currentPlan!;
  const originalWords = lexiconByLevel[progress.selectedLevel].filter((item) => plan.recallWordIds.includes(item.id));
  const [queue, setQueue] = useState(() => originalWords);
  const [position, setPosition] = useState(() => Math.min(plan.recallPosition, Math.max(0, originalWords.length - 1)));
  const [feedback, setFeedback] = useState<"question" | "missed" | "correct" | "summary">(() => plan.recallPosition >= originalWords.length ? "summary" : "question");
  const [missedIds, setMissedIds] = useState<string[]>([]);
  const [round, setRound] = useState<"main" | "missed" | "shuffle" | "speak">("main");
  const [showCue, setShowCue] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const [showSpeaking, setShowSpeaking] = useState(false);
  const word = queue[position];
  if (!word) return <div className="empty-step"><StepHeader step="recall" /><p>No recall items are due.</p><button className="primary-action" onClick={done}>Continue <span>→</span></button></div>;
  const example = completeCardExample(progress.selectedLevel, word);
  const review = getArchive(progress).reviews[word.id];
  const mode: RecallMode = (["meaning", "audio", "reading"] as const)[(position + (review?.repetitions ?? 0)) % 3];
  const answer = mode === "meaning" ? word.spanish : word.english;
  const optionPool = mode === "meaning" ? lexiconByLevel[progress.selectedLevel].map((item) => item.spanish) : lexiconByLevel[progress.selectedLevel].map((item) => item.english);
  const options = choices(answer, optionPool, plan.learningDay * 43 + position * 17 + (review?.repetitions ?? 0));
  const modeLabel = mode === "meaning" ? "MEANING → SPANISH" : mode === "audio" ? "AUDIO → MEANING" : "SPANISH → MEANING";
  const nextInterval = Math.max(1, (review?.interval ?? 0) + 1);
  const resetSupport = () => { setShowCue(false); setShowExample(false); setShowSpeaking(false); };
  const miss = () => {
    if (round === "main") {
      update((current) => recordReviewMiss(recordWordConfidence(recordSkill(current, "vocabulary", false), word.id, false), word.id));
      setMissedIds((current) => Array.from(new Set([...current, word.id])));
    }
    resetSupport(); setFeedback("missed");
  };
  const chooseAnswer = (option: string) => {
    if (option !== answer) { miss(); return; }
    if (round === "main") update((current) => recordWordConfidence(recordSkill(current, "vocabulary", true), word.id, true));
    resetSupport(); setFeedback("correct");
  };
  const advance = () => {
    if (round === "main") {
      update((current) => recordPlanPosition(scheduleReview(current, word.id, true), "recall", Math.min(originalWords.length, position + 1)));
    }
    if (position >= queue.length - 1) { setFeedback("summary"); return; }
    setPosition((value) => value + 1); resetSupport(); setFeedback("question");
  };
  const startRound = (nextRound: "missed" | "shuffle" | "speak") => {
    const pool = nextRound === "missed" ? originalWords.filter((item) => missedIds.includes(item.id)) : seededShuffle(originalWords, plan.learningDay + Date.now());
    if (!pool.length) return;
    setQueue(pool); setRound(nextRound); setPosition(0); resetSupport(); setFeedback("question");
  };
  if (feedback === "summary") return <section className="coach-panel"><StepHeader step="recall" kicker={round === "main" ? "TODAY’S RECALL TEST COMPLETE" : "OPTIONAL RECALL ROUND COMPLETE"} /><div className="recall-summary"><strong>{round === "main" ? "Today’s recall test is complete." : "Optional recall round complete."}</strong><p>{round === "main" ? "Every scheduled word was retrieved successfully and its next automatic return slot is set. Every miss entered the correction-and-retry loop before the card could advance." : "Optional rounds do not change the schedule, XP, or today’s progress."}</p><div>{Boolean(missedIds.length) && <button onClick={() => startRound("missed")}>Retest missed words</button>}<button onClick={() => startRound("speak")}>Speaking-only round</button><button onClick={() => startRound("shuffle")}>Retry recall test</button><button className="primary-action" onClick={done}>Continue to grammar <span>→</span></button></div></div></section>;
  if (round === "speak") return <section className="coach-panel"><StepHeader step="recall" kicker={`SPEAKING-ONLY ROUND · ${position + 1}/${queue.length} · OPTIONAL`} /><div className="learning-brief"><div><span>UNSCORED SPEAKING PASS</span><h2>Bring the word into your voice.</h2><p>Recall the Spanish aloud, then uncover it and compare. This pass never changes the automatic schedule.</p></div></div><article className="recall-card speaking-recall"><span>SAY THIS IN SPANISH</span><h2>{word.english}</h2>{feedback === "question" ? <button className="primary-action" onClick={() => setFeedback("correct")}>Show Spanish <span>→</span></button> : <div className="recall-confirmation"><span>COMPARE & SAY IT AGAIN</span><h2>{word.spanish}</h2><p>{word.english}</p><CardSpeechPractice phrase={word.spanish} /><button className="primary-action" onClick={advance}>Continue to next card <span>→</span></button></div>}</article></section>;
  return <section className="coach-panel"><StepHeader step="recall" kicker={`AUTOMATIC RECALL CADENCE · ${position + 1}/${queue.length}${round === "main" ? "" : " · OPTIONAL"}`} /><div className="learning-brief recall-brief"><div><span>{modeLabel}</span><h2>Retrieve it without the card.</h2><p>Choose from memory. A miss reveals the complete answer and must be retried before this card can advance.</p></div><aside><span>NEXT AUTOMATIC RETURN</span><strong>{nextInterval} learning day{nextInterval === 1 ? "" : "s"}</strong><small>Dilo sets the cadence after successful retrieval.</small></aside></div><article className="recall-card">{feedback === "question" && <>{mode === "audio" ? <><span>LISTEN · ANSWER HIDDEN</span><button className="listen-orb" onClick={() => speakSpanish(word.spanish)} aria-label="Play hidden Spanish prompt">◖))</button><p className="recall-instruction">Listen, then choose the meaning.</p></> : <><span>{mode === "meaning" ? "CHOOSE THE SPANISH YOU REMEMBER" : "CHOOSE THE MEANING"}</span><h2>{mode === "meaning" ? word.english : word.spanish}</h2></>}<div className="recall-choice-grid">{options.map((option, index) => <button key={option} onClick={() => chooseAnswer(option)}><b>{String.fromCharCode(65 + index)}</b><span>{option}</span></button>)}</div><button className="dont-recall" onClick={miss}>I don’t recall</button></>}{feedback === "missed" && <div className="recall-remediation"><span>MISSED · STUDY THE COMPLETE ANSWER</span><h2>{word.spanish}</h2><p>{word.english}</p><small>{word.cue}</small><div className="card-example"><span>EXAMPLE IN CONTEXT</span><b>{example.spanish}</b><small>{example.english}</small></div><div className="card-audio"><SoundButton text={word.spanish} /><SoundButton text={example.spanish} slow /></div><CardSpeechPractice phrase={word.spanish} /><p className="remediation-rule">This card cannot advance yet. Hide the answer and retrieve it again.</p><button className="primary-action" onClick={() => { resetSupport(); setFeedback("question"); }}>Hide answer & retry <span>→</span></button></div>}{feedback === "correct" && <div className="recall-confirmation"><span>CORRECT · QUICK CONFIRMATION</span><h2>{word.spanish}</h2><p>{word.english}</p><div className="confirmation-controls"><button onClick={() => speakSpanish(word.spanish)}>◖)) Hear word</button><button onClick={() => setShowSpeaking((value) => !value)}>Practice speaking</button><button onClick={() => setShowExample((value) => !value)}>{showExample ? "Hide example" : "See example"}</button><button onClick={() => setShowCue((value) => !value)}>{showCue ? "Hide usage cue" : "Show usage cue"}</button></div>{showCue && <small className="revealed-support">{word.cue}</small>}{showExample && <div className="card-example"><span>EXAMPLE IN CONTEXT</span><b>{example.spanish}</b><small>{example.english}</small><SoundButton text={example.spanish} /></div>}{showSpeaking && <CardSpeechPractice phrase={word.spanish} />}<button className="primary-action" onClick={advance}>Continue to next card <span>→</span></button></div>}</article></section>;
}

function GrammarStep({ progress, update, done }: Props & { done: () => void }) {
  const plan = getArchive(progress).currentPlan!;
  const lessons = grammarByLevel[progress.selectedLevel].filter((item) => plan.grammarIds.includes(item.id));
  const [position, setPosition] = useState(() => Math.min(plan.grammarPosition, Math.max(0, lessons.length - 1)));
  const [stage, setStage] = useState<"learn" | "retrieve" | "mix">("learn");
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<"" | "correct" | "wrong">("");
  const lesson = lessons[position];
  const tiles = useMemo(() => seededShuffle(sentenceTokens(lesson.example).map((text, index) => ({ text, key: `${index}:${text}` })), lesson.example.length), [lesson.example]);
  const selectedKeys = new Set(selected);
  const built = selected.map((key) => tiles.find((tile) => tile.key === key)!.text);
  const check = () => {
    const correct = tokensMatch(built, lesson.example);
    setResult(correct ? "correct" : "wrong");
    update((current) => {
      let next = recordSkill(current, "grammar", correct);
      next = scheduleReview(next, lesson.id, correct, true);
      if (!correct) next = queueCorrection(next, { id: `grammar:${lesson.id}`, skill: "grammar", prompt: lesson.formula, answer: lesson.example, choices: choices(lesson.example, grammarByLevel[current.selectedLevel].map((item) => item.example), position + 61), explanation: lesson.explanation, speech: lesson.example });
      return next;
    });
  };
  const advance = () => {
    if (position >= lessons.length - 1) { update((current) => recordPlanPosition(current, "grammar", lessons.length)); done(); return; }
    update((current) => recordPlanPosition(current, "grammar", position + 1));
    setPosition((value) => value + 1); setStage("learn"); setSelected([]); setResult("");
  };
  return <section className="coach-panel"><StepHeader step="grammar" kicker={`GRAMMAR ${position + 1}/${lessons.length}`} />{stage === "learn" ? <article className="grammar-lesson"><span>{lesson.level} · {lesson.title}</span><h2>{lesson.formula}</h2><p>{lesson.explanation}</p><button onClick={() => speakSpanish(lesson.example)}><strong>{lesson.example}</strong><small>{lesson.translation}</small><i>◖))</i></button><button className="primary-action" onClick={() => setStage("retrieve")}>Retrieve the pattern <span>→</span></button></article> : stage === "retrieve" ? <div className="tile-builder"><span>Build the example from memory</span><h3>{lesson.translation}</h3><div className="sentence-well">{built.length ? built.join(" ") : "Choose the words in order"}</div><div className="tile-bank">{tiles.map((tile) => <button key={tile.key} disabled={selectedKeys.has(tile.key) || Boolean(result)} onClick={() => setSelected((items) => [...items, tile.key])}>{tile.text}</button>)}</div>{!result && <div className="builder-actions"><button onClick={() => setSelected([])}>Reset</button><button className="primary-action" disabled={selected.length !== tiles.length} onClick={check}>Check line <span>→</span></button></div>}{result && <div className={`feedback-box ${result}`}><strong>{result === "correct" ? "Pattern assembled." : "Compare the complete line."}</strong><p>{lesson.example}</p><small>{lesson.explanation}</small><SoundButton text={lesson.example} /><button className="primary-action" onClick={() => setStage("mix")}>Vary the pattern <span>→</span></button></div>}</div> : <GrammarMixer level={progress.selectedLevel} rounds={1} compact onComplete={(confident) => { update((current) => recordSkill(current, "grammar", confident)); advance(); }} />}</section>;
}

function ListenStep({ progress, update, done }: Props & { done: () => void }) {
  const plan = getArchive(progress).currentPlan!;
  const mission = missionsByLevel[progress.selectedLevel][plan.missionIndex];
  const pool = missionsByLevel[progress.selectedLevel];
  const [phase, setPhase] = useState<"meaning" | "gap" | "done">("meaning");
  const [meaning, setMeaning] = useState("");
  const [gapAnswer, setGapAnswer] = useState("");
  const [message, setMessage] = useState("");
  const meaningChoices = choices(mission.translation, pool.map((item) => item.translation), plan.learningDay + 31);
  const modelTokens = sentenceTokens(mission.model);
  const gapLength = Math.min(3, Math.max(1, Math.floor(modelTokens.length / 3)));
  const answerSegment = modelTokens.slice(-gapLength).join(" ");
  const maskedLine = `${modelTokens.slice(0, -gapLength).join(" ")} _____`;
  const segmentPool = pool.map((item) => sentenceTokens(item.model).slice(-gapLength).join(" "));
  const gapChoices = choices(answerSegment, segmentPool, plan.learningDay + 87);
  const chooseMeaning = (option: string) => {
    const correct = option === mission.translation;
    setMeaning(option);
    update((current) => {
      let next = recordSkill(current, "listening", correct);
      if (!correct) next = queueCorrection(next, { id: `listen:${mission.id}`, skill: "listening", prompt: "What did you hear?", answer: mission.translation, choices: meaningChoices, explanation: mission.model, speech: mission.model });
      return next;
    });
  };
  const toGap = () => { setPhase("gap"); setMessage(""); };
  const checkGap = (option: string) => {
    const correct = option === answerSegment;
    setGapAnswer(option);
    setMessage(correct ? "The sounds and sentence ending line up." : `Complete line: ${mission.model}`);
    update((current) => {
      let next = recordSkill(current, "listening", correct);
      if (!correct) next = queueCorrection(next, { id: `gap:${mission.id}`, skill: "listening", prompt: maskedLine, answer: answerSegment, choices: gapChoices, explanation: `Complete line: ${mission.model}`, speech: mission.model });
      return next;
    });
    setPhase("done");
  };
  return <section className="coach-panel"><StepHeader step="listen" kicker={`${mission.domain.toUpperCase()} · ${mission.title}`} /><div className="listening-stage"><p>{mission.situation}</p><div className="listen-controls"><button className="listen-orb" onClick={() => speakSpanish(mission.model)} aria-label="Play normal audio">◖))</button><button onClick={() => speakSpanish(mission.model, .62)}>Slow replay</button></div>{phase === "meaning" && <><h2>What does the speaker mean?</h2><div className="choice-list">{meaningChoices.map((option) => <button key={option} disabled={Boolean(meaning)} className={meaning ? option === mission.translation ? "correct" : option === meaning ? "wrong" : "muted" : ""} onClick={() => chooseMeaning(option)}>{option}</button>)}</div>{meaning && <button className="primary-action coach-next" onClick={toGap}>Continue to missing phrase <span>→</span></button>}</>}{phase !== "meaning" && <div className="dictation"><span>Choose the missing Spanish words</span><h3 className="masked-line">{maskedLine}</h3><div className="choice-list">{gapChoices.map((option) => <button key={option} disabled={Boolean(gapAnswer)} className={gapAnswer ? option === answerSegment ? "correct" : option === gapAnswer ? "wrong" : "muted" : ""} onClick={() => checkGap(option)}>{option}</button>)}</div>{phase === "done" && <div className="feedback-box"><strong>{message}</strong><p>{mission.model}</p><small>{mission.translation}</small><SoundButton text={mission.model} /><button className="primary-action" onClick={done}>Continue <span>→</span></button></div>}</div>}</div></section>;
}

function BuildStep({ progress, update, done }: Props & { done: () => void }) {
  const plan = getArchive(progress).currentPlan!;
  const mission = missionsByLevel[progress.selectedLevel][plan.missionIndex];
  const tiles = useMemo(() => seededShuffle(sentenceTokens(mission.model).map((text, index) => ({ text, key: `${index}:${text}` })), plan.learningDay + 211), [mission.model, plan.learningDay]);
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<"" | "correct" | "wrong">("");
  const selectedSet = new Set(selected);
  const built = selected.map((key) => tiles.find((tile) => tile.key === key)!.text);
  const check = () => {
    const correct = tokensMatch(built, mission.model);
    setResult(correct ? "correct" : "wrong");
    update((current) => {
      let next = recordSkill(current, "sentence", correct);
      if (!correct) next = queueCorrection(next, { id: `build:${mission.id}`, skill: "sentence", prompt: mission.translation, answer: mission.model, choices: choices(mission.model, missionsByLevel[current.selectedLevel].map((item) => item.model), plan.learningDay + 93), explanation: "Rebuild the whole idea; watch verb endings, agreement, and word order.", speech: mission.model });
      return next;
    });
  };
  return <section className="coach-panel"><StepHeader step="build" kicker={`MISSION · ${mission.title}`} /><div className="tile-builder mission-builder"><span>Say this in Spanish</span><h2>{mission.translation}</h2><div className="sentence-well">{built.length ? built.join(" ") : "Build the complete response"}</div><div className="tile-bank">{tiles.map((tile) => <button key={tile.key} disabled={selectedSet.has(tile.key) || Boolean(result)} onClick={() => setSelected((items) => [...items, tile.key])}>{tile.text}</button>)}</div>{!result ? <div className="builder-actions"><button onClick={() => setSelected([])}>Reset</button><button className="primary-action" disabled={selected.length !== tiles.length} onClick={check}>Check line <span>→</span></button></div> : <div className={`feedback-box ${result}`}><strong>{result === "correct" ? "Your line is ready." : "Use this order."}</strong><p>{mission.model}</p><SoundButton text={mission.model} /><button className="primary-action" onClick={done}>Continue <span>→</span></button></div>}</div></section>;
}

function ReadStep({ progress, update, done }: Props & { done: () => void }) {
  const plan = getArchive(progress).currentPlan!;
  const mission = missionsByLevel[progress.selectedLevel][plan.missionIndex];
  const pool = missionsByLevel[progress.selectedLevel];
  const [support, setSupport] = useState(false);
  const [answer, setAnswer] = useState("");
  const options = choices(mission.canDo, pool.map((item) => item.canDo), plan.learningDay + 141);
  const lines = [mission.opener, mission.model, mission.followUp, mission.closing];
  const choose = (option: string) => {
    const correct = option === mission.canDo;
    setAnswer(option);
    update((current) => {
      let next = recordSkill(current, "reading", correct);
      if (!correct) next = queueCorrection(next, { id: `read:${mission.id}`, skill: "reading", prompt: mission.situation, answer: mission.canDo, choices: options, explanation: mission.translation });
      return next;
    });
  };
  return <section className="coach-panel"><StepHeader step="read" kicker={`${progress.selectedLevel} GRADED READING`} /><article className="reading-card"><div className="reading-title"><div><span>{mission.domain}</span><h2>{mission.title}</h2></div><button onClick={() => setSupport((value) => !value)}>{support ? "Hide help" : "Show help"}</button></div><div className="reading-lines">{lines.map((line, index) => <button key={line} onClick={() => speakSpanish(line)}><b>{index % 2 ? "TÚ" : "A"}</b><span><strong>{line}</strong>{support && <small>{index === 1 ? mission.translation : index === 0 ? mission.situation : index === 2 ? "The other speaker continues the exchange." : "The learner closes the exchange."}</small>}</span><i>◖))</i></button>)}</div><div className="reading-question"><span>COMPREHENSION</span><h3>What does the learner successfully do?</h3><div className="choice-list">{options.map((option) => <button key={option} disabled={Boolean(answer)} className={answer ? option === mission.canDo ? "correct" : option === answer ? "wrong" : "muted" : ""} onClick={() => choose(option)}>{option}</button>)}</div>{answer && <button className="primary-action" onClick={done}>Continue <span>→</span></button>}</div></article></section>;
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

function SpeakStep({ progress, update, done }: Props & { done: () => void }) {
  const plan = getArchive(progress).currentPlan!;
  const mission = missionsByLevel[progress.selectedLevel][plan.missionIndex];
  const lines = [mission.opener, mission.model, mission.followUp, mission.closing];
  const [passed, setPassed] = useState<number[]>([]);
  const [listening, setListening] = useState<number | null>(null);
  const [heard, setHeard] = useState("");
  const [manual, setManual] = useState(false);
  const practice = (index: number) => {
    const Constructor = (window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor }).SpeechRecognition
      ?? (window as unknown as { webkitSpeechRecognition?: RecognitionConstructor }).webkitSpeechRecognition;
    if (!Constructor) { setManual(true); return; }
    const recognition = new Constructor();
    recognition.lang = "es-ES"; recognition.interimResults = false; recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      const score = similarityScore(transcript, lines[index]);
      setHeard(`${transcript} · ${score}% match`);
      setListening(null);
      const correct = score >= 65;
      update((current) => recordSkill(current, "speaking", correct));
      if (correct) setPassed((items) => Array.from(new Set([...items, index])));
    };
    recognition.onerror = () => { setListening(null); setManual(true); };
    recognition.onend = () => setListening(null);
    setListening(index); setHeard(""); recognition.start();
  };
  const manualPass = (index: number) => {
    setPassed((items) => Array.from(new Set([...items, index])));
    update((current) => recordSkill(current, "speaking", true));
  };
  return <section className="coach-panel"><StepHeader step="speak" kicker={`FOUR-LINE MISSION · ${mission.title}`} /><div className="speaking-brief"><p>{mission.situation}</p><span>Carry both roles so the whole exchange lives in your voice.</span></div><div className="speaking-lines">{lines.map((line, index) => <article key={line} className={passed.includes(index) ? "passed" : ""}><b>{index % 2 ? "YOUR ROLE" : "OTHER ROLE"}</b><h3>{line}</h3>{progress.showHelp && <p>{index === 1 ? mission.translation : index === 0 ? mission.situation : "Continue the exchange naturally."}</p>}<div><button onClick={() => speakSpanish(line)}>◖)) Model</button><button disabled={listening !== null || passed.includes(index)} onClick={() => practice(index)}>{listening === index ? "Listening…" : passed.includes(index) ? "Passed ✓" : "Speak this line"}</button>{manual && !passed.includes(index) && <button onClick={() => manualPass(index)}>I said it aloud</button>}</div></article>)}</div>{heard && <p className="speech-result">Heard: {heard}</p>}<button className="primary-action coach-next" disabled={passed.length < lines.length} onClick={done}>Finish speaking <span>→</span></button><small className="coach-footnote">Speech recognition checks approximate word similarity, not accent. If the browser cannot listen, the honest manual fallback keeps the lesson accessible.</small></section>;
}

function CorrectionGate({ progress, update, finish }: Props & { finish: () => void }) {
  const corrections = dueCorrections(progress);
  const [answer, setAnswer] = useState("");
  const [item, setItem] = useState(() => corrections[0] ?? null);
  if (!item) return <section className="coach-complete"><span>DAILY LOOP COMPLETE</span><h1>Spanish moved<br /><em>from input to output.</em></h1><p>You met the language, retrieved it, varied its grammar, understood it, built it, read it, and spoke it.</p><div className="completion-receipt"><article><strong>7 / 7</strong><small>learning steps</small></article><article><strong>{formatDuration(progress.trainingTodaySeconds)}</strong><small>active today</small></article><article><strong>clear</strong><small>due corrections</small></article></div><button className="primary-action" onClick={finish}>Complete learning day <span>✓</span></button><small className="coach-footnote">If this was a session you began on an earlier date, Dilo will offer one catch-up session for today. It never creates a calendar backlog.</small></section>;
  const choose = (option: string) => {
    const correct = option === item.answer;
    setAnswer(option);
    update((current) => resolveCorrection(recordSkill(current, item.skill, correct), item.id, correct));
  };
  return <section className="coach-panel correction-gate"><div className="coach-heading"><span>CORRECTION LOOP · {corrections.length + (answer ? 1 : 0)} IN THIS PASS</span><h1>Fix it before<br />you finish.</h1><p>A miss returns now, then tomorrow. Two correct retrievals clear it.</p></div><article><span>{item.skill.toUpperCase()}</span><h2>{item.prompt}</h2>{item.speech && <SoundButton text={item.speech} />}<div className="choice-list">{item.choices.map((option) => <button key={option} disabled={Boolean(answer)} className={answer ? option === item.answer ? "correct" : option === answer ? "wrong" : "muted" : ""} onClick={() => choose(option)}>{option}</button>)}</div>{answer && <div className="feedback-box"><strong>{answer === item.answer ? (item.correctStreak ? "Correction cleared." : "Correct once. It returns next learning day.") : `Answer: ${item.answer}`}</strong><p>{item.explanation}</p><button className="primary-action" onClick={() => { setItem(dueCorrections(progress)[0] ?? null); setAnswer(""); }}>Next correction <span>→</span></button></div>}</article></section>;
}

export default function DailyCoach({ progress, update, close }: Props) {
  const archive = getArchive(progress);
  const plan = archive.currentPlan!;
  const nextStep = DAILY_STEPS.find((step) => !plan.completedSteps.includes(step));
  const [activeStep, setActiveStep] = useState<DailyStep | "gate">((nextStep ?? "gate") as DailyStep | "gate");
  const mission = missionsByLevel[progress.selectedLevel][plan.missionIndex];
  const markDone = (step: DailyStep) => {
    update((current) => completeStep(current, step));
    const next = DAILY_STEPS[DAILY_STEPS.indexOf(step) + 1];
    setActiveStep(next ?? "gate");
  };
  const finish = () => { update((current) => completePlan(current)); close(); };
  const shared = { progress, update, close };
  return <main className="coach-shell"><header className="coach-topbar"><button onClick={close} aria-label="Close daily session">×</button><div><span>{progress.selectedLevel} · DAY {plan.learningDay + 1}{plan.bonus ? " · CATCH-UP" : ""}</span><strong>{mission.title}</strong></div><button className="help-toggle" onClick={() => update((current) => ({ ...current, showHelp: !current.showHelp }))}>{progress.showHelp ? "Help on" : "Help off"}</button></header><nav className="step-rail" aria-label="Daily session steps">{DAILY_STEPS.map((step, index) => { const complete = plan.completedSteps.includes(step); const available = complete || step === nextStep || step === activeStep; return <button key={step} className={complete ? "complete" : activeStep === step ? "active" : ""} disabled={!available} onClick={() => available && setActiveStep(step)}><span>{complete ? "✓" : index + 1}</span><small>{stepLabels[step].short}</small></button>; })}</nav><div className="coach-content">{activeStep === "cards" && <CardsStep {...shared} done={() => markDone("cards")} />}{activeStep === "recall" && <RecallStep {...shared} done={() => markDone("recall")} />}{activeStep === "grammar" && <GrammarStep {...shared} done={() => markDone("grammar")} />}{activeStep === "listen" && <ListenStep {...shared} done={() => markDone("listen")} />}{activeStep === "build" && <BuildStep {...shared} done={() => markDone("build")} />}{activeStep === "read" && <ReadStep {...shared} done={() => markDone("read")} />}{activeStep === "speak" && <SpeakStep {...shared} done={() => markDone("speak")} />}{activeStep === "gate" && <CorrectionGate {...shared} finish={finish} />}</div></main>;
}
