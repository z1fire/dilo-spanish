"use client";

import { useMemo, useState } from "react";
import GrammarMixer from "./GrammarMixer";
import {
  DAILY_STEPS,
  advanceCatchUpSession,
  canAdvanceCatchUp,
  choices,
  completePlan,
  completeStep,
  dueCorrections,
  getArchive,
  queueCorrection,
  recordPlanPosition,
  recordPronunciation,
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
import { grammarByLevel, levelSoundLessons, lexiconByLevel, missionsByLevel } from "./spanish-curriculum";
import { formatDuration, sentenceTokens, speakSpanish, tokensMatch } from "./spanish-ui";

type Props = {
  progress: Progress;
  update: (recipe: (current: Progress) => Progress) => void;
  close: () => void;
  openGrammarLibrary?: () => void;
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

function CardSpeechPractice({ phrase, listenLabel = "Hear word", onAttempt }: { phrase: string; listenLabel?: string; onAttempt?: (correct: boolean) => void }) {
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
      const score = similarityScore(transcript, phrase);
      setHeard(`${transcript} · ${score}% match`);
      onAttempt?.(score >= 65);
      setListening(false);
    };
    recognition.onerror = () => { setListening(false); setManual(true); };
    recognition.onend = () => setListening(false);
    setHeard(""); setListening(true); recognition.start();
  };
  return <div className="card-speech-practice"><button onClick={() => speakSpanish(phrase)}>◖)) {listenLabel}</button><button disabled={listening} onClick={practice}>{listening ? "Listening…" : "Speak this phrase"}</button>{manual && <span>Say it aloud, then continue.</span>}{heard && <span>Heard: {heard}</span>}</div>;
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

function RecallStep({ progress, update, done, optionalReplay = false }: Props & { done: () => void; optionalReplay?: boolean }) {
  const plan = getArchive(progress).currentPlan!;
  const originalWords = lexiconByLevel[progress.selectedLevel].filter((item) => plan.recallWordIds.includes(item.id));
  const [queue, setQueue] = useState(() => optionalReplay ? seededShuffle(originalWords, plan.learningDay + Date.now()) : originalWords);
  const [position, setPosition] = useState(() => optionalReplay ? 0 : Math.min(plan.recallPosition, Math.max(0, originalWords.length - 1)));
  const [feedback, setFeedback] = useState<"question" | "missed" | "correct" | "summary">(() => optionalReplay ? "question" : plan.recallPosition >= originalWords.length ? "summary" : "question");
  const [missedIds, setMissedIds] = useState<string[]>([]);
  const [round, setRound] = useState<"main" | "missed" | "shuffle" | "speak">(optionalReplay ? "shuffle" : "main");
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
  if (feedback === "summary") return <section className="coach-panel"><StepHeader step="recall" kicker={round === "main" ? "TODAY’S RECALL TEST COMPLETE" : "OPTIONAL RECALL ROUND COMPLETE"} /><div className="recall-summary"><strong>{round === "main" ? "Today’s recall test is complete." : "Optional recall round complete."}</strong><p>{round === "main" ? "Every scheduled word was retrieved successfully and its next automatic return slot is set. Every miss entered the correction-and-retry loop before the card could advance." : "Optional rounds do not change the schedule, XP, or today’s progress."}</p><div>{Boolean(missedIds.length) && <button onClick={() => startRound("missed")}>Retest missed words</button>}<button onClick={() => startRound("speak")}>Speaking-only round</button><button onClick={() => startRound("shuffle")}>Retry recall test</button><button className="primary-action" onClick={done}>{optionalReplay ? "Return to completed day" : "Continue to grammar"} <span>→</span></button></div></div></section>;
  if (round === "speak") return <section className="coach-panel"><StepHeader step="recall" kicker={`SPEAKING-ONLY ROUND · ${position + 1}/${queue.length} · OPTIONAL`} /><div className="learning-brief"><div><span>UNSCORED SPEAKING PASS</span><h2>Bring the word into your voice.</h2><p>Recall the Spanish aloud, then uncover it and compare. This pass never changes the automatic schedule.</p></div></div><article className="recall-card speaking-recall"><span>SAY THIS IN SPANISH</span><h2>{word.english}</h2>{feedback === "question" ? <button className="primary-action" onClick={() => setFeedback("correct")}>Show Spanish <span>→</span></button> : <div className="recall-confirmation"><span>COMPARE & SAY IT AGAIN</span><h2>{word.spanish}</h2><p>{word.english}</p><CardSpeechPractice phrase={word.spanish} /><button className="primary-action" onClick={advance}>Continue to next card <span>→</span></button></div>}</article></section>;
  return <section className="coach-panel"><StepHeader step="recall" kicker={`AUTOMATIC RECALL CADENCE · ${position + 1}/${queue.length}${round === "main" ? "" : " · OPTIONAL"}`} /><div className="learning-brief recall-brief"><div><span>{modeLabel}</span><h2>Retrieve it without the card.</h2><p>Choose from memory. A miss reveals the complete answer and must be retried before this card can advance.</p></div><aside><span>NEXT AUTOMATIC RETURN</span><strong>{nextInterval} learning day{nextInterval === 1 ? "" : "s"}</strong><small>Dilo sets the cadence after successful retrieval.</small></aside></div><article className="recall-card">{feedback === "question" && <>{mode === "audio" ? <><span>LISTEN · ANSWER HIDDEN</span><button className="listen-orb" onClick={() => speakSpanish(word.spanish)} aria-label="Play hidden Spanish prompt">◖))</button><p className="recall-instruction">Listen, then choose the meaning.</p></> : <><span>{mode === "meaning" ? "CHOOSE THE SPANISH YOU REMEMBER" : "CHOOSE THE MEANING"}</span><h2>{mode === "meaning" ? word.english : word.spanish}</h2></>}<div className="recall-choice-grid">{options.map((option, index) => <button key={option} onClick={() => chooseAnswer(option)}><b>{String.fromCharCode(65 + index)}</b><span>{option}</span></button>)}</div><button className="dont-recall" onClick={miss}>I don’t recall</button></>}{feedback === "missed" && <div className="recall-remediation"><span>MISSED · STUDY THE COMPLETE ANSWER</span><h2>{word.spanish}</h2><p>{word.english}</p><small>{word.cue}</small><div className="card-example"><span>EXAMPLE IN CONTEXT</span><b>{example.spanish}</b><small>{example.english}</small></div><div className="card-audio"><SoundButton text={word.spanish} /><SoundButton text={example.spanish} slow /></div><CardSpeechPractice phrase={word.spanish} /><p className="remediation-rule">This card cannot advance yet. Hide the answer and retrieve it again.</p><button className="primary-action" onClick={() => { resetSupport(); setFeedback("question"); }}>Hide answer & retry <span>→</span></button></div>}{feedback === "correct" && <div className="recall-confirmation"><span>CORRECT · QUICK CONFIRMATION</span><h2>{word.spanish}</h2><p>{word.english}</p><div className="confirmation-controls"><button onClick={() => speakSpanish(word.spanish)}>◖)) Hear word</button><button onClick={() => setShowSpeaking((value) => !value)}>Practice speaking</button><button onClick={() => setShowExample((value) => !value)}>{showExample ? "Hide example" : "See example"}</button><button onClick={() => setShowCue((value) => !value)}>{showCue ? "Hide usage cue" : "Show usage cue"}</button></div>{showCue && <small className="revealed-support">{word.cue}</small>}{showExample && <div className="card-example"><span>EXAMPLE IN CONTEXT</span><b>{example.spanish}</b><small>{example.english}</small><SoundButton text={example.spanish} /></div>}{showSpeaking && <CardSpeechPractice phrase={word.spanish} />}<button className="primary-action" onClick={advance}>Continue to next card <span>→</span></button></div>}</article></section>;
}

function GrammarStep({ progress, update, done, openGrammarLibrary }: Props & { done: () => void }) {
  const archive = getArchive(progress);
  const plan = archive.currentPlan!;
  const allLessons = grammarByLevel[progress.selectedLevel];
  const lessons = allLessons.filter((item) => plan.grammarIds.includes(item.id));
  const [position, setPosition] = useState(() => Math.min(plan.grammarPosition, Math.max(0, lessons.length - 1)));
  const [stage, setStage] = useState<"learn" | "recall">("learn");
  const [result, setResult] = useState<"" | "wrong" | "correct">("");
  const lesson = lessons[position];
  if (!lesson) return <div className="empty-step"><StepHeader step="grammar" /><h2>No grammar targets today.</h2><button className="primary-action" onClick={done}>Continue to listening <span>→</span></button></div>;
  const lessonIndex = allLessons.findIndex((item) => item.id === lesson.id);
  const reviewTarget = Boolean(archive.grammarReviews[lesson.id]);
  const taught = new Set([...archive.learnedGrammarIds, ...Object.keys(archive.grammarReviews), lesson.id]).size;
  const stable = Object.values(archive.grammarReviews).filter((item) => item.repetitions >= 3).length;
  const coverage = Math.min(100, taught / allLessons.length * 100);
  const options = choices(lesson.example, allLessons.map((item) => item.example), plan.learningDay * 31 + lessonIndex * 17);
  const answer = (option: string) => {
    if (result === "correct") return;
    const correct = option === lesson.example;
    setResult(correct ? "correct" : "wrong");
    update((current) => {
      let next = recordSkill(current, "grammar", correct);
      if (correct) return scheduleReview(next, lesson.id, true, true);
      next = recordReviewMiss(next, lesson.id, true);
      return queueCorrection(next, { id: `grammar:${lesson.id}`, skill: "grammar", prompt: lesson.translation, answer: lesson.example, choices: options, explanation: `${lesson.title}: ${lesson.formula}. ${lesson.explanation}`, speech: lesson.example });
    });
  };
  const reopenLesson = () => { setStage("learn"); setResult(""); };
  const beginRecall = () => { setStage("recall"); setResult(""); };
  const advance = () => {
    if (position >= lessons.length - 1) { update((current) => recordPlanPosition(current, "grammar", lessons.length)); done(); return; }
    update((current) => recordPlanPosition(current, "grammar", position + 1));
    setPosition((value) => value + 1); setStage("learn"); setResult("");
  };
  return <section className="coach-panel"><StepHeader step="grammar" /><div className="grammar-lab-instructions"><span>FULL-SYLLABUS GRAMMAR · {reviewTarget ? "REVIEW TARGET" : "NEW TARGET"} · {lessonIndex + 1}/{allLessons.length}</span><h2>{lesson.title}</h2><p>First understand how the pattern works. Then hide the lesson and retrieve it from memory—the answer is never visible during the question.</p><i><b style={{ width: `${coverage}%` }} /></i><small>{taught} taught · {stable} stable · {Math.max(0, allLessons.length - taught)} still to introduce</small>{openGrammarLibrary && <button onClick={openGrammarLibrary}>Browse all {allLessons.length} grammar targets →</button>}</div><article className={`grammar-teach-card grammar-stage-${stage}`}><div className="grammar-stage-track" aria-label="Grammar lesson stages"><span className={stage === "learn" ? "active" : "complete"}><b>1</b> Learn</span><i>→</i><span className={stage === "recall" ? "active" : ""}><b>2</b> Recall</span></div>{stage === "learn" ? <><span>{lesson.level} · MEANING-LINKED PATTERN</span><h3>Understand the pattern</h3><code>{lesson.formula}</code><div className="grammar-notice"><strong>What to notice</strong><p>{lesson.explanation} Read the structure from left to right, keep the fixed Spanish pieces in place, and change the descriptive slots with the agreement the sentence requires.</p></div><button className="grammar-model" onClick={() => speakSpanish(lesson.example)}><span>◖))</span><strong>{lesson.example}</strong><em>{lesson.translation}</em></button><GrammarMixer key={`daily-${lesson.id}`} level={progress.selectedLevel} rounds={1} compact seed={lessonIndex} /><div className="grammar-study-steps"><span><b>1</b> Read the pattern</span><span><b>2</b> Listen and shadow</span><span><b>3</b> Recall without looking</span></div><button className="grammar-recall-start" onClick={beginRecall}>Hide the lesson & start recall <span>→</span></button></> : <><span>RECALL · LESSON HIDDEN</span><h3>Which Spanish sentence expresses “{lesson.translation}”?</h3><p className="grammar-recall-cue">Choose from memory. The pattern and model stay hidden until you answer correctly.</p><div className="grammar-recall-choices">{options.map((option, index) => <button key={option} onClick={() => answer(option)} disabled={result === "correct"}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div>{!result && <button className="grammar-help-button" onClick={reopenLesson}>Need help? Reopen the lesson</button>}{result && <div className="grammar-feedback"><div className={`grammar-result-note ${result}`}><span>{result === "correct" ? `Correct — ${lesson.formula}` : "Not quite. Compare the word order and try another choice, or reopen the lesson for help."}</span>{result === "wrong" && <button onClick={reopenLesson}>Reopen lesson</button>}</div>{result === "correct" && <div className="grammar-answer-review"><strong>Why this works</strong><code>{lesson.formula}</code><button className="grammar-model" onClick={() => speakSpanish(lesson.example)}><span>◖))</span><strong>{lesson.example}</strong><em>{lesson.translation}</em></button><p>{lesson.explanation}</p><CardSpeechPractice phrase={lesson.example} listenLabel="Hear model" onAttempt={(correct) => update((current) => recordSkill(current, "speaking", correct))} /><button className="grammar-next-target" onClick={advance}>{position + 1 >= lessons.length ? "Continue to listening" : "Next grammar target"} <span>→</span></button></div>}</div>}</>}</article></section>;
}

function ListenStep({ progress, update, done }: Props & { done: () => void }) {
  const plan = getArchive(progress).currentPlan!;
  const mission = missionsByLevel[progress.selectedLevel][plan.missionIndex];
  const missionPool = missionsByLevel[progress.selectedLevel];
  const [meaningResult, setMeaningResult] = useState<"" | "wrong" | "correct">("");
  const [gapResult, setGapResult] = useState<"" | "wrong" | "correct">("");
  const [optionalPosition, setOptionalPosition] = useState(0);
  const [optionalResult, setOptionalResult] = useState<"" | "wrong" | "correct">("");
  const optionalItems = useMemo(() => seededShuffle([
    ...missionPool.map((item) => ({ id: item.id, source: item.model, meaning: item.translation, note: item.situation })),
    ...lexiconByLevel[progress.selectedLevel].map((item) => ({ id: item.id, source: item.spanish, meaning: item.english, note: item.cue })),
  ], plan.learningDay + 509).slice(0, 20), [missionPool, plan.learningDay, progress.selectedLevel]);
  const optionalItem = optionalItems[optionalPosition];
  const meaningChoices = choices(mission.translation, missionPool.map((item) => item.translation), plan.learningDay + 31);
  const modelTokens = sentenceTokens(mission.model);
  const gapLength = Math.min(3, Math.max(1, Math.floor(modelTokens.length / 3)));
  const answerSegment = modelTokens.slice(-gapLength).join(" ");
  const maskedLine = `${modelTokens.slice(0, -gapLength).join(" ")} _____`;
  const segmentPool = missionPool.map((item) => sentenceTokens(item.model).slice(-gapLength).join(" "));
  const gapChoices = choices(answerSegment, segmentPool, plan.learningDay + 87);
  const optionalChoices = choices(optionalItem.meaning, optionalItems.map((item) => item.meaning), plan.learningDay * 19 + optionalPosition);
  const chooseMeaning = (option: string) => {
    const correct = option === mission.translation;
    setMeaningResult(correct ? "correct" : "wrong");
    update((current) => {
      let next = recordSkill(current, "listening", correct);
      if (!correct) next = queueCorrection(next, { id: `listen:${mission.id}`, skill: "listening", prompt: "What did you hear?", answer: mission.translation, choices: meaningChoices, explanation: mission.model, speech: mission.model });
      return next;
    });
  };
  const checkGap = (option: string) => {
    const correct = option === answerSegment;
    setGapResult(correct ? "correct" : "wrong");
    update((current) => {
      let next = recordSkill(current, "listening", correct);
      if (!correct) next = queueCorrection(next, { id: `gap:${mission.id}`, skill: "listening", prompt: maskedLine, answer: answerSegment, choices: gapChoices, explanation: `Complete line: ${mission.model}`, speech: mission.model });
      return next;
    });
  };
  const answerOptional = (option: string) => {
    const correct = option === optionalItem.meaning;
    setOptionalResult(correct ? "correct" : "wrong");
    update((current) => {
      let next = recordSkill(current, "listening", correct);
      if (!correct) next = queueCorrection(next, { id: `listening-bank:${progress.selectedLevel}:${optionalItem.id}`, skill: "listening", prompt: "Listen again and choose the meaning.", answer: optionalItem.meaning, choices: optionalChoices, explanation: `${optionalItem.source} means ${optionalItem.meaning}. ${optionalItem.note}`, speech: optionalItem.source });
      return next;
    });
  };
  const nextOptional = () => { setOptionalPosition((value) => (value + 1) % optionalItems.length); setOptionalResult(""); };
  return <section className="coach-panel"><StepHeader step="listen" kicker={`${mission.domain.toUpperCase()} · ${mission.title}`} /><div className="required-practice-wrap"><div className="listening-lab mission-listening"><div className="listening-instructions"><span>LISTENING LADDER · STEP 1 / 2</span><h2>Understand it before you read it.</h2><p>Play the real-life mission line and choose its meaning. The Spanish transcript stays hidden until you catch the message.</p><button className="big-listen-button" onClick={() => speakSpanish(mission.model)}><span>◖))</span> Play mission line</button><button className="slow-listen-link" onClick={() => speakSpanish(mission.model, .62)}>Play slower</button></div><div className="listening-answer-stack">{meaningChoices.map((option, index) => <button key={option} onClick={() => chooseMeaning(option)} disabled={meaningResult === "correct"}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}{meaningResult && <div className={`listening-result-note ${meaningResult}`}>{meaningResult === "correct" ? `Correct — ${mission.model}` : "Not yet. Replay the phrase and listen for the mission words."}</div>}</div></div>{meaningResult === "correct" && <div className="dictation-lab"><div><span>LISTENING LADDER · STEP 2 / 2</span><h2>Catch the missing Spanish.</h2><p>Replay the full line, then select the piece hidden from the transcript.</p><button className="big-listen-button" onClick={() => speakSpanish(mission.model)}><span>◖))</span> Replay without reading</button></div><div><strong>{maskedLine}</strong><div className="dictation-options">{gapChoices.map((option) => <button key={option} onClick={() => checkGap(option)} disabled={gapResult === "correct"}>{option}</button>)}</div>{gapResult && <div className={`listening-result-note ${gapResult}`}>{gapResult === "correct" ? "Correct · you caught the missing Spanish." : "Not yet · replay the line and listen around the blank."}{gapResult === "correct" && <button onClick={done}>Continue to sentence building →</button>}</div>}</div></div>}<details className="extra-practice"><summary>Extra listening reps <span>20-question practice bank</span></summary><div className="listening-lab optional-listening"><div className="listening-instructions"><span>OPTIONAL LISTENING · {optionalPosition + 1}/{optionalItems.length}</span><h2>Keep training your ear.</h2><p>This practice bank awards extra practice credit without changing today’s required mission.</p><button className="big-listen-button" onClick={() => speakSpanish(optionalItem.source)}><span>◖))</span> Play Spanish</button><button className="slow-listen-link" onClick={() => speakSpanish(optionalItem.source, .62)}>Play slower</button></div><div className="listening-answer-stack">{optionalChoices.map((option, index) => <button key={option} onClick={() => answerOptional(option)} disabled={optionalResult === "correct"}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}{optionalResult && <div className={`listening-result-note ${optionalResult}`}>{optionalResult === "correct" ? `Correct — ${optionalItem.source}` : "Not yet. Replay and listen for the key words."}{optionalResult === "correct" && <button onClick={nextOptional}>Next →</button>}</div>}</div></div></details></div></section>;
}

function BuildStep({ progress, update, done }: Props & { done: () => void }) {
  const plan = getArchive(progress).currentPlan!;
  const mission = missionsByLevel[progress.selectedLevel][plan.missionIndex];
  const requiredTiles = useMemo(() => seededShuffle(sentenceTokens(mission.model).map((text, index) => ({ text, key: `${index}:${text}` })), plan.learningDay + 211), [mission.model, plan.learningDay]);
  const optionalItems = useMemo(() => seededShuffle([
    ...grammarByLevel[progress.selectedLevel].map((item) => ({ id: `grammar:${item.id}`, model: item.example, translation: item.translation, note: item.explanation })),
    ...missionsByLevel[progress.selectedLevel].map((item) => ({ id: `mission:${item.id}`, model: item.model, translation: item.translation, note: item.situation })),
  ], plan.learningDay + 557).slice(0, 16), [plan.learningDay, progress.selectedLevel]);
  const [requiredSelected, setRequiredSelected] = useState<string[]>([]);
  const [requiredResult, setRequiredResult] = useState<"" | "correct" | "wrong">("");
  const [optionalPosition, setOptionalPosition] = useState(0);
  const [optionalSelected, setOptionalSelected] = useState<string[]>([]);
  const [optionalResult, setOptionalResult] = useState<"" | "correct" | "wrong">("");
  const optionalItem = optionalItems[optionalPosition];
  const optionalTiles = useMemo(() => seededShuffle(sentenceTokens(optionalItem.model).map((text, index) => ({ text, key: `${index}:${text}` })), plan.learningDay + optionalPosition * 41 + 733), [optionalItem.model, optionalPosition, plan.learningDay]);
  const requiredSelectedSet = new Set(requiredSelected);
  const optionalSelectedSet = new Set(optionalSelected);
  const requiredBuilt = requiredSelected.map((key) => requiredTiles.find((tile) => tile.key === key)!.text);
  const optionalBuilt = optionalSelected.map((key) => optionalTiles.find((tile) => tile.key === key)!.text);
  const addRequired = (key: string) => { setRequiredSelected((items) => [...items, key]); setRequiredResult(""); };
  const removeRequired = (index: number) => { setRequiredSelected((items) => items.filter((_, itemIndex) => itemIndex !== index)); setRequiredResult(""); };
  const resetRequired = () => { setRequiredSelected([]); setRequiredResult(""); };
  const checkRequired = () => {
    const correct = tokensMatch(requiredBuilt, mission.model);
    setRequiredResult(correct ? "correct" : "wrong");
    update((current) => {
      let next = recordSkill(current, "sentence", correct);
      if (!correct) next = queueCorrection(next, { id: `build:${mission.id}`, skill: "sentence", prompt: mission.translation, answer: mission.model, choices: choices(mission.model, missionsByLevel[current.selectedLevel].map((item) => item.model), plan.learningDay + 93), explanation: "Rebuild the whole idea; watch verb endings, agreement, and word order.", speech: mission.model });
      return next;
    });
  };
  const addOptional = (key: string) => { setOptionalSelected((items) => [...items, key]); setOptionalResult(""); };
  const removeOptional = (index: number) => { setOptionalSelected((items) => items.filter((_, itemIndex) => itemIndex !== index)); setOptionalResult(""); };
  const resetOptional = () => { setOptionalSelected([]); setOptionalResult(""); };
  const checkOptional = () => {
    const correct = tokensMatch(optionalBuilt, optionalItem.model);
    setOptionalResult(correct ? "correct" : "wrong");
    update((current) => {
      let next = recordSkill(current, "sentence", correct);
      if (!correct) next = queueCorrection(next, { id: `sentence-bank:${progress.selectedLevel}:${optionalItem.id}`, skill: "sentence", prompt: optionalItem.translation, answer: optionalItem.model, choices: choices(optionalItem.model, optionalItems.map((item) => item.model), plan.learningDay + optionalPosition + 809), explanation: `Natural Spanish order: ${optionalItem.model} ${optionalItem.note}`, speech: optionalItem.model });
      return next;
    });
  };
  const nextOptional = () => { setOptionalPosition((value) => (value + 1) % optionalItems.length); setOptionalSelected([]); setOptionalResult(""); };
  return <section className="coach-panel"><StepHeader step="build" kicker={`MISSION · ${mission.title}`} /><div className="required-practice-wrap"><div className="builder-lab mission-builder"><div className="builder-instructions"><span>BUILD THE MISSION · DAY {plan.phase + 1} / 3</span><h2>Assemble the line you will perform.</h2><p>{mission.translation} Put the Spanish into its natural order. Tap a placed piece to move it back.</p></div><div className="builder-board"><div className="sentence-line">{requiredBuilt.length ? requiredBuilt.map((text, index) => <button key={`${requiredSelected[index]}:placed`} onClick={() => removeRequired(index)}>{text}</button>) : <span>Tap the pieces below to build the mission line…</span>}</div><div className="word-bank">{requiredTiles.filter((tile) => !requiredSelectedSet.has(tile.key)).map((tile) => <button key={tile.key} onClick={() => addRequired(tile.key)}>{tile.text}</button>)}</div><div className="builder-actions"><button onClick={resetRequired}>Reset</button><button className="primary-action" disabled={!requiredSelected.length} onClick={checkRequired}>Check mission line <span>→</span></button></div>{requiredResult && <div className={`builder-result ${requiredResult}`}><span>{requiredResult === "correct" ? `Correct — ${mission.translation}` : "Almost. Move one piece at a time or reset and rebuild the mission line."}</span>{requiredResult === "correct" && <div><SoundButton text={mission.model} /><button className="primary-action" onClick={done}>Continue to reading <span>→</span></button></div>}</div>}</div></div><details className="extra-practice"><summary>Extra sentence reps <span>16-challenge practice bank</span></summary><div className="builder-lab optional-builder"><div className="builder-instructions"><span>OPTIONAL SENTENCE LAB · {optionalPosition + 1} / {optionalItems.length}</span><h2>Build another thought.</h2><p>{optionalItem.translation} This practice bank adds sentence-building evidence without changing today’s required mission.</p></div><div className="builder-board"><div className="sentence-line">{optionalBuilt.length ? optionalBuilt.map((text, index) => <button key={`${optionalSelected[index]}:placed`} onClick={() => removeOptional(index)}>{text}</button>) : <span>Tap the pieces below to build the sentence…</span>}</div><div className="word-bank">{optionalTiles.filter((tile) => !optionalSelectedSet.has(tile.key)).map((tile) => <button key={tile.key} onClick={() => addOptional(tile.key)}>{tile.text}</button>)}</div><div className="builder-actions"><button onClick={resetOptional}>Reset</button><button className="primary-action" disabled={!optionalSelected.length} onClick={checkOptional}>Check sentence <span>→</span></button></div>{optionalResult && <div className={`builder-result ${optionalResult}`}><span>{optionalResult === "correct" ? `Correct — ${optionalItem.translation}` : "Almost. Move one piece at a time or reset and try the Spanish order."}</span><div>{optionalResult === "correct" && <SoundButton text={optionalItem.model} />}<button onClick={nextOptional}>Next <span>→</span></button></div></div>}</div></div></details></div></section>;
}

function ReadStep({ progress, update, done }: Props & { done: () => void }) {
  const plan = getArchive(progress).currentPlan!;
  const mission = missionsByLevel[progress.selectedLevel][plan.missionIndex];
  const pool = missionsByLevel[progress.selectedLevel];
  const support = plan.phase === 0
    ? { spanish: "De acuerdo.", translation: "Okay." }
    : plan.phase === 1
      ? { spanish: "De acuerdo, gracias.", translation: "Okay, thank you." }
      : { spanish: "Entendido, muchas gracias.", translation: "Understood, thank you very much." };
  const lines = [
    { speaker: "A", spanish: mission.model, translation: mission.translation },
    { speaker: "B", ...support },
  ];
  const options = choices(mission.translation, pool.map((item) => item.translation), plan.learningDay + plan.phase + 141);
  const [result, setResult] = useState<"" | "correct" | "wrong">("");
  const choose = (option: string) => {
    const correct = option === mission.translation;
    setResult(correct ? "correct" : "wrong");
    update((current) => {
      let next = recordSkill(current, "reading", correct);
      if (!correct) next = queueCorrection(next, { id: `read:${mission.id}:${plan.phase}`, skill: "reading", prompt: lines.map((line) => line.spanish).join(" "), answer: mission.translation, choices: options, explanation: `${mission.model} means ${mission.translation}`, speech: mission.model });
      return next;
    });
  };
  return <section className="coach-panel"><StepHeader step="read" kicker={`${progress.selectedLevel} GRADED READING`} /><div className="graded-reader"><div className="reader-intro"><span>GRADED READING · KNOWN MISSION LANGUAGE</span><h2>{mission.title} · mini dialogue</h2><p>Read the exchange first without translation. Tap a line only when you need support.</p></div><div className="reader-page">{lines.map((line, index) => <details key={`${line.speaker}:${line.spanish}`}><summary><span>{line.speaker}</span><strong lang="es">{line.spanish}</strong><button onClick={(event) => { event.preventDefault(); speakSpanish(line.spanish); }} aria-label={`Play line ${index + 1}`}>◖))</button></summary><p><em>{line.translation}</em></p></details>)}<div className="reader-question"><strong>What is speaker A communicating?</strong>{options.map((option) => <button key={option} onClick={() => choose(option)} disabled={result === "correct"}>{option}</button>)}{result && <div className={`reader-result ${result}`}><span>{result === "correct" ? "Correct · you understood the exchange in context." : "Not yet · reread speaker A and use the surrounding reply."}</span>{result === "correct" && <button onClick={done}>Continue to speaking <span>→</span></button>}</div>}</div></div></div></section>;
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
  const conversation = [
    { speaker: "PARTNER", learner: false, spanish: mission.opener, support: mission.situation },
    { speaker: "YOU", learner: true, spanish: mission.model, support: mission.translation },
    { speaker: "PARTNER", learner: false, spanish: mission.followUp, support: "The partner responds and keeps the exchange moving." },
    { speaker: "YOU", learner: true, spanish: mission.closing, support: `You complete the goal: ${mission.canDo}.` },
  ];
  const soundItems = useMemo(() => levelSoundLessons(progress.selectedLevel).flatMap((lesson) => lesson.examples.map((example) => ({ lesson, example }))), [progress.selectedLevel]);
  const [lineIndex, setLineIndex] = useState(0);
  const [passed, setPassed] = useState<boolean[]>([]);
  const [listening, setListening] = useState(false);
  const [feedback, setFeedback] = useState("Practice the full exchange: listen, shadow, then record all four lines.");
  const [score, setScore] = useState<number | null>(null);
  const [manual, setManual] = useState(false);
  const [showSoundGym, setShowSoundGym] = useState(false);
  const [soundPosition, setSoundPosition] = useState(0);
  const [soundListening, setSoundListening] = useState(false);
  const [soundManual, setSoundManual] = useState(false);
  const [soundScore, setSoundScore] = useState<number | null>(null);
  const [soundFeedback, setSoundFeedback] = useState("Listen, shadow, then record the target.");
  const activeTurn = conversation[lineIndex];
  const activeSound = soundItems[soundPosition];
  const allLinesPassed = conversation.every((_, index) => passed[index]);
  const missionReady = DAILY_STEPS.slice(0, 6).every((step) => plan.completedSteps.includes(step));
  const selectLine = (index: number) => { setLineIndex(index); setScore(null); setManual(false); setFeedback(`${conversation[index].speaker} line ${index + 1} selected. Listen, shadow twice, then record it.`); };
  const passLine = (message: string) => {
    const nextPassed = conversation.map((_, index) => passed[index] || index === lineIndex);
    const nextLine = nextPassed.findIndex((complete) => !complete);
    setPassed(nextPassed);
    if (nextLine >= 0) {
      setLineIndex(nextLine); setScore(null); setManual(false); setFeedback(`${message} Next: line ${nextLine + 1} of 4.`); return;
    }
    setFeedback(`${message} All four lines are complete—now perform the exchange once from beginning to end.`);
  };
  const practice = () => {
    const Constructor = (window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor }).SpeechRecognition
      ?? (window as unknown as { webkitSpeechRecognition?: RecognitionConstructor }).webkitSpeechRecognition;
    if (!Constructor) { setManual(true); setFeedback(`Automatic word checking is unavailable here. Perform line ${lineIndex + 1} aloud, then mark the spoken self-check.`); speakSpanish(activeTurn.spanish, .7); return; }
    const recognition = new Constructor();
    recognition.lang = "es-ES"; recognition.interimResults = false; recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      const nextScore = similarityScore(transcript, activeTurn.spanish);
      const correct = nextScore >= 65;
      setScore(nextScore);
      update((current) => recordSkill(current, "speaking", correct));
      if (correct) passLine(`Line ${lineIndex + 1} heard: ${transcript} · word match ${nextScore}%.`);
      else setFeedback(`Line ${lineIndex + 1} heard: ${transcript} · word match ${nextScore}%. Shadow twice and try again.`);
    };
    recognition.onerror = () => { setManual(true); setFeedback("I couldn’t check that recording. Try once more, or use the spoken self-check for this line."); };
    recognition.onend = () => setListening(false);
    setFeedback(`Listening… perform line ${lineIndex + 1}: ${activeTurn.spanish}`); setScore(null); setManual(false); setListening(true); recognition.start();
  };
  const manualPass = () => {
    passLine(`Line ${lineIndex + 1} marked complete after your spoken self-check.`);
    update((current) => recordSkill(current, "speaking", true));
  };
  const practiceSound = () => {
    const Constructor = (window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor }).SpeechRecognition
      ?? (window as unknown as { webkitSpeechRecognition?: RecognitionConstructor }).webkitSpeechRecognition;
    if (!Constructor) { setSoundManual(true); setSoundFeedback("Automatic word checking is unavailable. Say the target aloud, then use the spoken self-check."); speakSpanish(activeSound.example, .68); return; }
    const recognition = new Constructor();
    recognition.lang = "es-ES"; recognition.interimResults = false; recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      const nextScore = similarityScore(transcript, activeSound.example);
      setSoundScore(nextScore); setSoundFeedback(`${transcript} · word match ${nextScore}%. ${nextScore >= 65 ? "Now self-check the target sound and rhythm." : "Replay slowly and try once more."}`);
      update((current) => recordPronunciation(current, `${activeSound.lesson.id}:${activeSound.example}`, nextScore >= 65));
    };
    recognition.onerror = () => { setSoundManual(true); setSoundFeedback("I couldn’t check that recording. Try again or use the spoken self-check."); };
    recognition.onend = () => setSoundListening(false);
    setSoundFeedback(`Listening… say ${activeSound.example}`); setSoundScore(null); setSoundManual(false); setSoundListening(true); recognition.start();
  };
  const confirmSound = () => { setSoundScore(100); setSoundFeedback("Spoken self-check complete. Choose another target whenever you’re ready."); update((current) => recordPronunciation(current, `${activeSound.lesson.id}:${activeSound.example}`, true)); };
  const retrySound = () => { setSoundScore(null); setSoundFeedback("Replay slowly, exaggerate the target once, then repeat naturally."); speakSpanish(activeSound.example, .58); };
  return <section className="coach-panel"><StepHeader step="speak" kicker={`FOUR-LINE MISSION · ${mission.title}`} /><div className="conversation-stage"><div className="conversation-heading"><span>FOUR-LINE ROLE-PLAY · DAY {plan.phase + 1} / 3</span><h2>{plan.phase === 2 ? "Perform the complete exchange without reading." : "Practice the conversation from both sides."}</h2><p>Tap any turn to hear it. All four logically connected turns are required in today’s speaking checkpoint.</p></div>{conversation.map((turn, index) => <button key={`${turn.speaker}:${index}`} className={turn.learner ? "learner" : "partner"} onClick={() => speakSpanish(turn.spanish, .72)}><span>{turn.speaker} · ◖))</span><strong lang="es">{turn.spanish}</strong>{progress.showHelp && <em>{turn.support}</em>}</button>)}</div><div className="mission-checkpoint"><div className="checkpoint-intro"><span>REAL-LIFE CHECKPOINT · MISSION {plan.missionIndex + 1} · DAY {plan.phase + 1} / 3</span><h2>{plan.phase === 2 ? "Perform the full exchange without reading." : "Prove all four conversation lines."}</h2><p>{mission.situation} Take both roles: listen once, shadow twice, then record every line before performing the exchange from beginning to end.</p><div className="checkpoint-readiness">{DAILY_STEPS.slice(0, 6).map((step) => <span key={step} className={plan.completedSteps.includes(step) ? "ready" : ""}>{plan.completedSteps.includes(step) ? "✓" : "○"} {stepLabels[step].short}</span>)}</div></div><div className="speech-console mission-speech-console"><div className="mission-line-picker" role="tablist" aria-label="Choose a conversation line to practice">{conversation.map((turn, index) => <button key={`${turn.speaker}:line:${index}`} className={`${index === lineIndex ? "active" : ""} ${passed[index] ? "passed" : ""}`} onClick={() => selectLine(index)}><span>{passed[index] ? "✓" : index + 1}</span>{turn.speaker} · LINE {index + 1}</button>)}</div><button className="speaker-orb" onClick={() => speakSpanish(activeTurn.spanish, .7)} aria-label={`Play conversation line ${lineIndex + 1}`}>DI<span>◖)) MODEL {lineIndex + 1}/4</span></button><strong lang="es">{activeTurn.spanish}</strong>{progress.showHelp && <em>{activeTurn.support}</em>}<button className={`record-button ${listening ? "recording" : ""}`} disabled={listening} onClick={practice}><span>●</span>{listening ? "Listening…" : `Perform line ${lineIndex + 1} of 4`}</button>{manual && !passed[lineIndex] && <button className="manual-complete" onClick={manualPass}>I performed this line aloud · mark complete</button>}<div className="speech-feedback">{feedback}</div>{score !== null && <div className="speech-meter"><i style={{ width: `${score}%` }} /></div>}<button className="checkpoint-button" disabled={!missionReady || !allLinesPassed} onClick={done}>{!allLinesPassed ? `${passed.filter(Boolean).length}/4 lines complete` : plan.phase === 2 ? "I performed all four lines · complete mission" : "I performed all four lines · complete today"}</button><small className="speech-honesty">All four lines are required. Recognition checks words, not accent or rhythm; self-check pronunciation and fluency honestly.</small></div><div className="sound-gym-toggle"><button onClick={() => setShowSoundGym((value) => !value)}>{showSoundGym ? "Close sound gym" : "Open optional sound gym"}</button><span>Keep all {soundItems.length} current-level sound and rhythm targets available for extra practice.</span></div>{showSoundGym && <div className="sound-gym"><div className="sound-gym-intro"><span>OPTIONAL SOUND & RHYTHM GYM · {soundPosition + 1} / {soundItems.length}</span><h2>Train the sound, not just the word.</h2><p><strong>{activeSound.lesson.title} · {activeSound.lesson.focus}</strong>{activeSound.lesson.tip}</p></div><div><div className="sound-target-picker">{soundItems.map((item, index) => <button key={`${item.lesson.id}:${item.example}`} className={index === soundPosition ? "active" : ""} onClick={() => { setSoundPosition(index); setSoundScore(null); setSoundManual(false); setSoundFeedback("Listen, shadow, then record the target."); }}>{item.example}</button>)}</div><div className="speech-console sound-speech-console"><button className="speaker-orb" onClick={() => speakSpanish(activeSound.example, .68)} aria-label="Play sound target">R<span>◖)) MODEL</span></button><strong lang="es">{activeSound.example}</strong><em>{activeSound.lesson.focus}</em><button className={`record-button ${soundListening ? "recording" : ""}`} disabled={soundListening} onClick={practiceSound}><span>●</span>{soundListening ? "Listening…" : "Record my target"}</button>{soundManual && <button className="manual-complete" onClick={confirmSound}>I performed this target aloud · mark complete</button>}<div className="speech-feedback">{soundFeedback}</div>{soundScore !== null && <div className="speech-meter"><i style={{ width: `${soundScore}%` }} /></div>}<div className="self-checks"><button onClick={confirmSound}>Sound and rhythm felt accurate</button><button onClick={retrySound}>Needs another round</button></div><small className="speech-honesty">Recognition checks the words, not vowel quality, stress, linking, or regional accent. Use the lesson cue and an honest self-check.</small></div></div></div>}</div></section>;
}

function CorrectionGate({ progress, update, finish }: Props & { finish: () => void }) {
  const corrections = dueCorrections(progress);
  const item = corrections[0] ?? null;
  const [result, setResult] = useState("");
  const [resultExplanation, setResultExplanation] = useState("");
  if (!item) return <section className="coach-panel correction-gate"><div className="correction-lab cleared"><div><span>AUTOMATIC CORRECTION LOOP</span><h2>Today’s misses are repaired.</h2><p>Anything you miss later will appear here automatically. Corrections never change the fixed vocabulary cadence.</p></div><div className="correction-clear-card"><span aria-hidden="true">✓</span><strong>Everything due is clear.</strong><small>The seven learning steps are complete and the day is ready to save.</small></div></div><div className="finish-day-bar"><div><span>READY TO FINISH</span><strong>7 / 7 steps · corrections clear</strong></div><button className="primary-action" onClick={finish}>Finish learning day <span>→</span></button></div></section>;
  const choose = (option: string) => {
    const correct = option === item.answer;
    setResult(correct ? item.correctStreak ? "Correct again · this miss is now cleared." : "Correct · this miss will return once tomorrow." : "Not yet · review the explanation and retry.");
    setResultExplanation(item.explanation);
    update((current) => resolveCorrection(recordSkill(current, item.skill, correct), item.id, correct));
    if (correct) window.setTimeout(() => setResult(""), 700);
  };
  return <section className="coach-panel correction-gate"><div className="correction-lab"><div><span>AUTOMATIC CORRECTION LOOP · {corrections.length} READY NOW</span><h2>{corrections.length} miss{corrections.length === 1 ? "" : "es"} ready to repair.</h2><p>Answer correctly now and once more on the next learning day. This extra practice never changes the fixed vocabulary cadence.</p></div><article className="correction-card"><span>{item.skill}</span><strong>{item.prompt}</strong>{item.speech && <div className="correction-audio-actions"><SoundButton text={item.speech} /><SoundButton text={item.speech} slow /></div>}<div className="choice-list">{item.choices.map((option) => <button key={option} onClick={() => choose(option)}>{option}</button>)}</div>{result && <p className={result.startsWith("Correct") ? "correct" : ""}>{result}<small>{resultExplanation}</small></p>}</article></div><div className="finish-day-bar blocked"><div><span>DAY COMPLETION LOCKED</span><strong>{corrections.length} correction{corrections.length === 1 ? "" : "s"} remaining</strong></div><button disabled>Clear corrections first</button></div></section>;
}

export default function DailyCoach({ progress, update, close, openGrammarLibrary }: Props) {
  const archive = getArchive(progress);
  const plan = archive.currentPlan!;
  const nextStep = DAILY_STEPS.find((step) => !plan.completedSteps.includes(step));
  const [activeStep, setActiveStep] = useState<DailyStep | "gate">((nextStep ?? "gate") as DailyStep | "gate");
  const [dayComplete, setDayComplete] = useState(false);
  const [optionalRecall, setOptionalRecall] = useState(false);
  const mission = missionsByLevel[progress.selectedLevel][plan.missionIndex];
  const markDone = (step: DailyStep) => {
    update((current) => completeStep(current, step));
    const next = DAILY_STEPS[DAILY_STEPS.indexOf(step) + 1];
    setActiveStep(next ?? "gate");
  };
  const finish = () => { update((current) => completePlan(current)); setDayComplete(true); };
  const startNextLearningDay = () => {
    update((current) => advanceCatchUpSession(current));
    setDayComplete(false);
    setOptionalRecall(false);
    setActiveStep("cards");
  };
  const startOptionalRecall = () => {
    setDayComplete(false);
    setOptionalRecall(true);
    setActiveStep("recall");
  };
  const returnToReceipt = () => { setOptionalRecall(false); setDayComplete(true); };
  const catchUpAvailable = canAdvanceCatchUp(progress);
  const shared = { progress, update, close, openGrammarLibrary };
  return <main className="coach-shell"><header className="coach-topbar"><button onClick={close} aria-label="Close daily session">×</button><div><span>{progress.selectedLevel} · DAY {plan.learningDay + 1}{plan.bonus ? " · CATCH-UP" : ""}</span><strong>{mission.title}</strong></div><button className="help-toggle" onClick={() => update((current) => ({ ...current, showHelp: !current.showHelp }))}>{progress.showHelp ? "Help on" : "Help off"}</button></header><nav className="step-rail" aria-label="Daily session steps">{DAILY_STEPS.map((step, index) => { const complete = plan.completedSteps.includes(step); const available = complete || step === nextStep || step === activeStep; return <button key={step} className={complete ? "complete" : activeStep === step ? "active" : ""} disabled={!available} onClick={() => available && setActiveStep(step)}><span>{complete ? "✓" : index + 1}</span><small>{stepLabels[step].short}</small></button>; })}</nav><div className="coach-content">{activeStep === "cards" && <CardsStep {...shared} done={() => markDone("cards")} />}{activeStep === "recall" && <RecallStep key={optionalRecall ? "optional-recall" : "daily-recall"} {...shared} optionalReplay={optionalRecall} done={optionalRecall ? returnToReceipt : () => markDone("recall")} />}{activeStep === "grammar" && <GrammarStep {...shared} done={() => markDone("grammar")} />}{activeStep === "listen" && <ListenStep {...shared} done={() => markDone("listen")} />}{activeStep === "build" && <BuildStep {...shared} done={() => markDone("build")} />}{activeStep === "read" && <ReadStep {...shared} done={() => markDone("read")} />}{activeStep === "speak" && <SpeakStep {...shared} done={() => markDone("speak")} />}{activeStep === "gate" && <CorrectionGate {...shared} finish={finish} />}</div>{dayComplete && <div className="day-complete-backdrop" role="dialog" aria-modal="true" aria-labelledby="day-complete-title"><div className="day-complete-sheet"><button className="day-complete-close" onClick={close} aria-label="Close day summary">×</button><span className="day-complete-seal" aria-hidden="true">✓</span><span className="day-complete-kicker">{progress.selectedLevel} · MISSION {plan.missionIndex + 1} · DAY {plan.phase + 1}/3</span><h2 id="day-complete-title">{catchUpAvailable ? <>Your catch-up day<br /><em>is complete.</em></> : <>Today’s learning<br /><em>is complete.</em></>}</h2><p>{catchUpAvailable ? "You finished the older session and cleared everything due. You may now begin one full learning day for today, so a small carry-over never becomes your entire study session." : "You finished all seven required exercises and cleared everything due today. Your vocabulary and grammar return slots are already scheduled."}</p><div className="day-complete-stats"><div><strong>7 / 7</strong><span>steps complete</span></div><div><strong>{formatDuration(progress.trainingTodaySeconds)}</strong><span>active today</span></div><div><strong>Clear</strong><span>due corrections</span></div></div><div className="day-complete-actions">{catchUpAvailable && <button className="day-complete-advance" onClick={startNextLearningDay}>Start next learning day <span>→</span></button>}<button className="day-complete-done" onClick={close}>Finish for today</button><button onClick={startOptionalRecall}>Optional: retry today’s recall test</button></div><small>{catchUpAvailable ? "You can advance once because this lesson began on an earlier calendar day. The new lesson becomes today’s active session." : "Extra recall is always available, but it will not change the automatic return schedule, XP, or today’s completion."}</small></div></div>}</main>;
}
