"use client";

import { useMemo, useState } from "react";
import type { LevelId } from "./spanish-curriculum";
import { grammarMixerFrames, mixerSentence } from "./spanish-mixer";
import { seededShuffle, similarityScore } from "./spanish-engine";
import { sentenceTokens, speakSpanish } from "./spanish-ui";

type Props = {
  level: LevelId;
  rounds?: number;
  compact?: boolean;
  seed?: number;
  onComplete?: (confident: boolean) => void;
};

type MixerTile = { id: string; text: string };
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

const labels = ["FRAME", "WHO + LINKED VERB", "IDEA", "ENDING"];

function sentenceTiles(sentence: string) {
  return sentenceTokens(sentence).map((text, index) => ({ id: `${index}:${text}`, text }));
}

function scramble(tiles: MixerTile[], seed: number) {
  const shuffled = seededShuffle(tiles, seed);
  if (shuffled.length > 1 && shuffled.every((tile, index) => tile.id === tiles[index].id)) return [...shuffled.slice(1), shuffled[0]];
  return shuffled;
}

function MixerSpeechPractice({ target }: { target: string }) {
  const [listening, setListening] = useState(false);
  const [message, setMessage] = useState("Listen, shadow, then record your sentence.");
  const practice = () => {
    const Constructor = (window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor }).SpeechRecognition
      ?? (window as unknown as { webkitSpeechRecognition?: RecognitionConstructor }).webkitSpeechRecognition;
    if (!Constructor) { setMessage("Automatic checking is unavailable here. Say the complete sentence aloud and self-check honestly."); return; }
    const recognition = new Constructor();
    recognition.lang = "es-ES"; recognition.interimResults = false; recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      setMessage(`Heard: ${transcript} · ${similarityScore(transcript, target)}% word match`);
      setListening(false);
    };
    recognition.onerror = () => { setListening(false); setMessage("I couldn’t hear that clearly. Move closer and try once more."); };
    recognition.onend = () => setListening(false);
    setListening(true); setMessage("Listening… say the complete sentence."); recognition.start();
  };
  return <div className="mixer-speaking-practice"><span>SAY YOUR GRAMMAR SENTENCE</span><div><button onClick={() => speakSpanish(target, .72)}>◖)) Hear my sentence</button><button disabled={listening} onClick={practice}>{listening ? "Listening…" : "Speak my sentence"}</button></div><small>{message}</small></div>;
}

export default function GrammarMixer({ level, rounds = 3, compact = false, seed = 0, onComplete }: Props) {
  const frames = useMemo(() => seededShuffle(grammarMixerFrames[level], level.charCodeAt(0) * 31 + level.charCodeAt(1) + seed), [level, seed]);
  const [round, setRound] = useState(0);
  const frame = frames[round % frames.length];
  const [selections, setSelections] = useState([0, 0, 0, 0]);
  const initialSentence = mixerSentence(frame, [0, 0, 0, 0]);
  const initialTiles = sentenceTiles(initialSentence);
  const [target, setTarget] = useState(initialSentence);
  const [expected, setExpected] = useState(initialTiles);
  const [bank, setBank] = useState(() => scramble(initialTiles, seed + 29));
  const [built, setBuilt] = useState<MixerTile[]>([]);
  const [needsMix, setNeedsMix] = useState(false);
  const [result, setResult] = useState("");
  const groups = [
    frame.lead.map((value) => ({ label: value, value })),
    frame.agreement.map((value) => ({ label: `${value.subject} · ${value.verb}${value.secondary ? ` · ${value.secondary}` : ""}`, value: value.subject })),
    frame.complements.map((value) => ({ label: value, value })),
    frame.endings.map((value) => ({ label: value || "no extra ending", value })),
  ];

  const select = (group: number, option: number) => {
    setSelections((current) => current.map((value, index) => index === group ? option : value));
    setNeedsMix(true); setResult("Selection changed · mix the new sentence before rebuilding.");
  };
  const mix = () => {
    const sentence = mixerSentence(frame, selections);
    const tiles = sentenceTiles(sentence);
    setTarget(sentence); setExpected(tiles); setBank(scramble(tiles, seed + round * 41 + selections.reduce((total, value) => total + value, 0) + 73));
    setBuilt([]); setNeedsMix(false); setResult("");
  };
  const add = (index: number) => {
    if (needsMix || result.startsWith("Correct")) return;
    const tile = bank[index];
    if (!tile) return;
    setBuilt((current) => [...current, tile]); setBank((current) => current.filter((_, itemIndex) => itemIndex !== index)); setResult("");
  };
  const remove = (index: number) => {
    if (result.startsWith("Correct")) return;
    const tile = built[index];
    if (!tile) return;
    setBank((current) => [...current, tile]); setBuilt((current) => current.filter((_, itemIndex) => itemIndex !== index)); setResult("");
  };
  const reset = () => {
    setBank(scramble(expected, seed + round * 47 + 101)); setBuilt([]); setResult("");
  };
  const check = () => {
    const correct = built.length === expected.length && built.every((tile, index) => tile.text === expected[index].text);
    setResult(correct ? "Correct pattern · your choices fit the required Spanish word order." : "Not yet · compare the order with the pattern note and move the tiles again.");
  };
  const next = () => {
    if (round + 1 >= rounds) { onComplete?.(true); return; }
    const nextRound = round + 1;
    const nextFrame = frames[nextRound % frames.length];
    const nextSentence = mixerSentence(nextFrame, [0, 0, 0, 0]);
    const tiles = sentenceTiles(nextSentence);
    setRound(nextRound); setSelections([0, 0, 0, 0]); setTarget(nextSentence); setExpected(tiles); setBank(scramble(tiles, seed + nextRound * 43 + 29));
    setBuilt([]); setNeedsMix(false); setResult("");
  };

  return <section className={`grammar-mixer ${compact ? "compact" : ""}`}>
    <header><div><span>MIX & MATCH PATTERN LAB · {round + 1}/{rounds}</span><h2>{frame.title}</h2><p>{frame.goal}</p></div></header>
    <div className="mixer-pattern-note"><strong>Build with vocabulary that makes sense</strong><p>{frame.note} Linked choices keep the completed sentence coherent.</p></div>
    <div className="mixer-slots">{groups.map((options, group) => <fieldset key={labels[group]}><legend>{labels[group]}</legend><div>{options.map((option, index) => <button key={`${option.value}-${index}`} className={selections[group] === index ? "active" : ""} onClick={() => select(group, index)}>{option.label}</button>)}</div></fieldset>)}</div>
    <button className="mixer-mix-button" onClick={mix}>{needsMix ? "Mix my new choices →" : "Reshuffle this sentence ↻"}</button>
    <div className="mixer-sentence-line">{built.length ? built.map((tile, index) => <button key={tile.id} onClick={() => remove(index)}>{tile.text}</button>) : <span>Tap the scrambled pieces below to build the sentence.</span>}</div>
    <div className="mixer-tile-bank">{bank.map((tile, index) => <button key={tile.id} onClick={() => add(index)} disabled={needsMix}>{tile.text}</button>)}</div>
    <div className="mixer-actions"><button onClick={reset} disabled={needsMix || result.startsWith("Correct")}>Reset order</button><button className="primary-action" onClick={check} disabled={needsMix || bank.length > 0}>Check pattern <span>→</span></button></div>
    {result && <div className={`mixer-result ${result.startsWith("Correct") ? "correct" : ""}`}><span>{result}</span>{result.startsWith("Correct") && <><strong>{target}</strong><MixerSpeechPractice target={target} />{onComplete && <button className="primary-action" onClick={next}>{round + 1 >= rounds ? "Finish pattern lab" : "Next pattern"} <span>→</span></button>}</>}</div>}
  </section>;
}
