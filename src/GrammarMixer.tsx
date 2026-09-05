"use client";

import { useMemo, useState } from "react";
import type { LevelId } from "./spanish-curriculum";
import { grammarMixerFrames, mixerSentence } from "./spanish-mixer";
import { seededShuffle } from "./spanish-engine";
import { speakSpanish } from "./spanish-ui";

type Props = {
  level: LevelId;
  rounds?: number;
  compact?: boolean;
  onComplete: (confident: boolean) => void;
};

const labels = ["FRAME", "WHO + LINKED VERB", "IDEA", "ENDING"];

export default function GrammarMixer({ level, rounds = 3, compact = false, onComplete }: Props) {
  const frames = useMemo(() => seededShuffle(grammarMixerFrames[level], level.charCodeAt(0) * 31 + level.charCodeAt(1)), [level]);
  const [round, setRound] = useState(0);
  const [selections, setSelections] = useState([0, 0, 0, 0]);
  const [changed, setChanged] = useState<number[]>([]);
  const [support, setSupport] = useState(false);
  const frame = frames[round % frames.length];
  const sentence = mixerSentence(frame, selections);
  const groups = [
    frame.lead.map((value) => ({ label: value, value })),
    frame.agreement.map((value) => ({ label: `${value.subject} · ${value.verb}${value.secondary ? ` · ${value.secondary}` : ""}`, value: value.subject })),
    frame.complements.map((value) => ({ label: value, value })),
    frame.endings.map((value) => ({ label: value || "no extra ending", value })),
  ];

  const select = (group: number, option: number) => {
    setSelections((current) => current.map((value, index) => index === group ? option : value));
    setChanged((current) => Array.from(new Set([...current, group])));
  };

  const grade = (confident: boolean) => {
    if (round + 1 >= rounds) { onComplete(confident); return; }
    setRound((value) => value + 1);
    setSelections([0, 0, 0, 0]);
    setChanged([]);
    setSupport(false);
  };

  return <section className={`grammar-mixer ${compact ? "compact" : ""}`}>
    <header><div><span>SPANISH PATTERN MIXER · {round + 1}/{rounds}</span><h2>{frame.title}</h2><p>{frame.goal}</p></div><button onClick={() => setSupport((value) => !value)}>{support ? "Hide link" : "Why it works"}</button></header>
    {support && <aside>{frame.note}</aside>}
    <div className="mixer-output"><small>YOUR COHERENT LINE</small><strong>{sentence}</strong><button onClick={() => speakSpanish(sentence)}>◖)) Hear the whole line</button></div>
    <div className="mixer-slots">{groups.map((options, group) => <fieldset key={labels[group]}><legend>{labels[group]}</legend><div>{options.map((option, index) => <button key={`${option.value}-${index}`} className={selections[group] === index ? "active" : ""} onClick={() => select(group, index)}>{option.label}</button>)}</div></fieldset>)}</div>
    <div className="mixer-actions"><span>Change at least two meaning slots, then say the sentence aloud.</span><button disabled={changed.length < 2} onClick={() => grade(false)}>Needs practice</button><button className="primary-action" disabled={changed.length < 2} onClick={() => grade(true)}>I can use the pattern <span>→</span></button></div>
  </section>;
}
