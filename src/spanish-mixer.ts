import type { LevelId } from "./spanish-curriculum";

export type AgreementRow = {
  subject: string;
  verb: string;
  secondary?: string;
};

export type SpanishMixerFrame = {
  id: string;
  level: LevelId;
  title: string;
  goal: string;
  lead: string[];
  agreement: AgreementRow[];
  complements: string[];
  endings: string[];
  note: string;
};

export const grammarMixerFrames: Record<LevelId, SpanishMixerFrame[]> = {
  A1: [
    {
      id: "A1-present-needs", level: "A1", title: "Who needs what?", goal: "Link the subject to the present-tense ending.",
      lead: ["Hoy", "Ahora", "Esta mañana"],
      agreement: [
        { subject: "yo", verb: "necesito" }, { subject: "tú", verb: "necesitas" }, { subject: "ella", verb: "necesita" },
        { subject: "nosotros", verb: "necesitamos" }, { subject: "ustedes", verb: "necesitan" },
      ],
      complements: ["ayuda", "agua", "una reserva", "más tiempo"],
      endings: ["por favor", "aquí", "para mañana", "antes de salir"],
      note: "The subject and verb travel together. Spanish often omits the subject once the ending makes it clear.",
    },
    {
      id: "A1-description", level: "A1", title: "Describe people and places", goal: "Keep noun and adjective agreement audible.",
      lead: ["En mi opinión", "Para mí", "Normalmente"],
      agreement: [
        { subject: "el barrio", verb: "es", secondary: "tranquilo" }, { subject: "la ciudad", verb: "es", secondary: "tranquila" },
        { subject: "los cafés", verb: "son", secondary: "tranquilos" }, { subject: "las calles", verb: "son", secondary: "tranquilas" },
      ],
      complements: ["y tiene buen ambiente", "pero queda lejos", "durante la semana", "por la mañana"], endings: ["", "para vivir", "cuando no hay tráfico"],
      note: "Changing the noun automatically changes the verb and adjective. That agreement carries meaning even at beginner level.",
    },
  ],
  A2: [
    {
      id: "A2-preterite", level: "A2", title: "Finished past", goal: "Match the doer with a finished action.",
      lead: ["Ayer", "Anoche", "La semana pasada"],
      agreement: [
        { subject: "yo", verb: "fui" }, { subject: "tú", verb: "fuiste" }, { subject: "ella", verb: "fue" },
        { subject: "nosotros", verb: "fuimos" }, { subject: "ellos", verb: "fueron" },
      ],
      complements: ["al mercado", "a una reunión", "al centro", "a casa de Ana"],
      endings: ["por la mañana", "después del trabajo", "y volví tarde", "por primera vez"],
      note: "The preterite presents the trip as complete. Time markers help the listener place the event.",
    },
    {
      id: "A2-plans", level: "A2", title: "Plans and obligations", goal: "Vary intention, ability, and obligation without losing the infinitive.",
      lead: ["Mañana", "Este fin de semana", "Después"],
      agreement: [
        { subject: "yo", verb: "voy a" }, { subject: "tú", verb: "puedes" }, { subject: "ella", verb: "tiene que" },
        { subject: "nosotros", verb: "vamos a" }, { subject: "ustedes", verb: "pueden" },
      ],
      complements: ["llamar", "descansar", "hacer la reserva", "resolver el problema"],
      endings: ["temprano", "antes de las seis", "con calma", "si hay tiempo"],
      note: "The first verb carries person and tense; the action that follows remains in the infinitive.",
    },
  ],
  B1: [
    {
      id: "B1-background-event", level: "B1", title: "Background meets event", goal: "Combine an ongoing past scene with the event that changed it.",
      lead: ["Yo recuerdo que", "En ese momento", "Todo iba normal:", "Al principio"],
      agreement: [
        { subject: "yo", verb: "estaba trabajando", secondary: "cuando" }, { subject: "ella", verb: "volvía a casa", secondary: "cuando" },
        { subject: "nosotros", verb: "hablábamos", secondary: "cuando" }, { subject: "ellos", verb: "esperaban", secondary: "cuando" },
      ],
      complements: ["sonó el teléfono", "empezó la tormenta", "llegó el director", "se averió el coche"],
      endings: ["de repente", "sin previo aviso", "por suerte", "en ese momento"],
      note: "The imperfect opens the scene; the preterite moves the story. The linked event verb changes with the selected scene.",
    },
    {
      id: "B1-advice", level: "B1", title: "Advice with tact", goal: "Build useful conditional advice and give a reason.",
      lead: ["En tu lugar", "Si fuera tú", "Antes de decidir"],
      agreement: [
        { subject: "yo", verb: "hablaría" }, { subject: "yo", verb: "preguntaría" }, { subject: "yo", verb: "compararía" },
        { subject: "yo", verb: "pediría" },
      ],
      complements: ["con el equipo", "por el horario", "las dos opciones", "más información"],
      endings: ["primero", "con calma", "para evitar problemas", "antes de aceptar"],
      note: "The conditional makes advice less forceful. Add a reason so it sounds considered rather than formulaic.",
    },
  ],
  B2: [
    {
      id: "B2-conditions", level: "B2", title: "Conditions and consequences", goal: "Keep the si-clause and result clause in the right mood and tense.",
      lead: ["Si fuera posible", "Si tuviéramos más tiempo", "Si mejoraran el servicio", "Si se aclararan los datos"],
      agreement: [
        { subject: "yo", verb: "propondría" }, { subject: "nosotros", verb: "podríamos" }, { subject: "la empresa", verb: "debería" },
        { subject: "el equipo", verb: "aceptaría" },
      ],
      complements: ["otra fecha", "reducir el alcance", "ofrecer una solución", "revisar la conclusión"],
      endings: ["sin dudarlo", "en la primera fase", "antes de continuar", "con más cautela"],
      note: "A hypothetical si-clause uses the imperfect subjunctive; its likely result uses the conditional.",
    },
    {
      id: "B2-concession", level: "B2", title: "Concede, then position", goal: "Acknowledge a point without abandoning your argument.",
      lead: ["Aunque entiendo la preocupación", "Si bien faltan datos", "Hasta cierto punto", "Dicho esto"],
      agreement: [
        { subject: "yo", verb: "mantengo" }, { subject: "nosotros", verb: "consideramos" }, { subject: "el informe", verb: "demuestra" },
        { subject: "la evidencia", verb: "sugiere" },
      ],
      complements: ["que el cambio es necesario", "que conviene esperar", "una tendencia clara", "otra explicación posible"],
      endings: ["por estas razones", "a largo plazo", "con algunas reservas", "en este contexto"],
      note: "Concession strengthens an argument when the following position stays precise and proportionate.",
    },
  ],
  C1: [
    {
      id: "C1-evaluation", level: "C1", title: "Evaluate with precision", goal: "Calibrate certainty and connect evidence to a recommendation.",
      lead: ["Habida cuenta de los datos", "A juzgar por los resultados", "Sin perder de vista los límites", "En términos generales"],
      agreement: [
        { subject: "yo", verb: "sostendría" }, { subject: "nosotros", verb: "recomendaríamos" }, { subject: "el análisis", verb: "permite afirmar" },
        { subject: "la evidencia", verb: "pone de manifiesto" },
      ],
      complements: ["que conviene actuar por fases", "la revisión del procedimiento", "una relación relevante", "la necesidad de más pruebas"],
      endings: ["con cierta cautela", "antes de generalizar", "sin descartar alternativas", "de manera provisional"],
      note: "Advanced fluency includes controlling how strong a claim sounds, not simply making the sentence longer.",
    },
    {
      id: "C1-reformulation", level: "C1", title: "Reframe a difficult point", goal: "Hold the meaning while changing the register and angle.",
      lead: ["Dicho de otro modo", "Para ser más preciso", "Lo que intento señalar es que", "En última instancia"],
      agreement: [
        { subject: "el problema", verb: "radica" }, { subject: "la dificultad", verb: "consiste" }, { subject: "la diferencia", verb: "reside" },
        { subject: "el desacuerdo", verb: "surge" },
      ],
      complements: ["en el procedimiento", "en cómo se interpreta la prueba", "en las prioridades", "en una premisa no compartida"],
      endings: ["más que en el objetivo", "a largo plazo", "desde el principio", "entre ambos equipos"],
      note: "Reformulation is a core repair strategy: preserve the idea, then give the listener a clearer route into it.",
    },
  ],
  C2: [
    {
      id: "C2-synthesis", level: "C2", title: "Synthesize without flattening", goal: "Combine contrasting interpretations while preserving their limits.",
      lead: ["Lejos de excluirse", "Aun cuando parezcan incompatibles", "Vistas en conjunto", "Sin que ello resuelva la tensión"],
      agreement: [
        { subject: "las dos lecturas", verb: "revelan" }, { subject: "ambos informes", verb: "responden a" }, { subject: "la discrepancia", verb: "pone de relieve" },
        { subject: "cada explicación", verb: "capta" },
      ],
      complements: ["dimensiones distintas", "premisas difíciles de conciliar", "un límite metodológico", "una parte del fenómeno"],
      endings: ["sin agotar la cuestión", "según la escala adoptada", "con consecuencias diferentes", "de forma complementaria"],
      note: "C2 synthesis retains productive tension instead of forcing every source into one tidy conclusion.",
    },
    {
      id: "C2-register", level: "C2", title: "Shift register deliberately", goal: "Choose a stance that fits the audience while protecting the core message.",
      lead: ["Hablando sin ambages", "En términos institucionales", "Dicho llanamente", "Con la debida cautela"],
      agreement: [
        { subject: "nosotros", verb: "reconocemos" }, { subject: "la organización", verb: "deja constancia de" }, { subject: "yo", verb: "cuestiono" },
        { subject: "el informe", verb: "no permite sostener" },
      ],
      complements: ["que hubo errores", "las deficiencias detectadas", "la premisa central", "una conclusión tajante"],
      endings: ["y vamos a corregirlos", "sin menoscabar el trabajo previo", "por razones metodológicas", "a la luz de la evidencia"],
      note: "Register changes wording, rhythm, and social force. It should not quietly change the underlying claim.",
    },
  ],
};

export function mixerSentence(frame: SpanishMixerFrame, selections: number[]) {
  const lead = frame.lead[selections[0] % frame.lead.length];
  const row = frame.agreement[selections[1] % frame.agreement.length];
  const complement = frame.complements[selections[2] % frame.complements.length];
  const ending = frame.endings[selections[3] % frame.endings.length];
  if (row.secondary) return [lead, row.subject, row.verb, row.secondary, complement, ending].filter(Boolean).join(" ").replace(/\s+/g, " ");
  return [lead, row.subject, row.verb, complement, ending].filter(Boolean).join(" ").replace(/\s+/g, " ");
}
