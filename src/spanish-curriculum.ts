export type LevelId = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export type LevelMeta = {
  id: LevelId;
  name: string;
  milestone: string;
  description: string;
  promise: string;
  outsideHours: string;
  color: "clay" | "gold" | "olive" | "blue" | "ink" | "plum";
};

export type Lexeme = {
  id: string;
  level: LevelId;
  spanish: string;
  english: string;
  cue: string;
};

export type GrammarLesson = {
  id: string;
  level: LevelId;
  title: string;
  formula: string;
  explanation: string;
  example: string;
  translation: string;
};

export type Mission = {
  id: string;
  level: LevelId;
  title: string;
  domain: string;
  canDo: string;
  situation: string;
  opener: string;
  model: string;
  translation: string;
  followUp: string;
  closing: string;
};

export type SoundLesson = {
  id: string;
  level: LevelId;
  title: string;
  focus: string;
  examples: string[];
  tip: string;
};

export const levelOrder: LevelId[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export const levels: Record<LevelId, LevelMeta> = {
  A1: { id: "A1", name: "First contact", milestone: "Survival Spanish", description: "Build short exchanges about yourself, food, places, time, and immediate needs.", promise: "Handle predictable moments with prepared language.", outsideHours: "Add 1–2 hours/week of easy listening and real use.", color: "clay" },
  A2: { id: "A2", name: "Everyday independence", milestone: "Routine conversation", description: "Connect sentences, narrate simple events, make plans, and solve familiar problems.", promise: "Keep everyday exchanges moving without a script.", outsideHours: "Add 2–3 hours/week of graded input and conversation.", color: "gold" },
  B1: { id: "B1", name: "Connected speaker", milestone: "Independent Spanish", description: "Tell stories, explain opinions, manage travel, and understand clear standard speech.", promise: "Participate independently in most familiar situations.", outsideHours: "Add 3–5 hours/week of native media, reading, and speaking.", color: "olive" },
  B2: { id: "B2", name: "Fluent conversation", milestone: "Fluency threshold", description: "Interact spontaneously, defend a position, follow extended speech, and adjust register.", promise: "Hold regular conversation with a degree of fluency and spontaneity.", outsideHours: "Add 5–7 hours/week of sustained conversation and extensive input.", color: "blue" },
  C1: { id: "C1", name: "Advanced fluency", milestone: "Flexible, precise Spanish", description: "Express complex ideas smoothly for social, academic, and professional purposes.", promise: "Use a broad repertoire flexibly and with little obvious searching.", outsideHours: "Live in Spanish: long-form input, writing, feedback, and expert domains.", color: "ink" },
  C2: { id: "C2", name: "Mastery", milestone: "Nuanced command", description: "Synthesize difficult sources, infer subtle meaning, and reformulate with precision.", promise: "Communicate with near-complete flexibility across demanding contexts.", outsideHours: "Maintain immersion and seek native-level editorial and pronunciation feedback.", color: "plum" },
};

const lexiconSource: Record<LevelId, string> = {
  A1: `hola|hello|The h is silent
buenos días|good morning|Use before lunch
buenas tardes|good afternoon|Use after lunch
adiós|goodbye|Stress the final syllable
por favor|please|A complete politeness chunk
gracias|thank you|Keep the vowels crisp
perdón|excuse me / sorry|Useful to get attention
¿cómo te llamas?|what is your name?|Informal singular
me llamo…|my name is…|Literally “I call myself”
mucho gusto|nice to meet you|Common across the Spanish-speaking world
¿qué tal?|how’s it going?|A flexible greeting
bien|well / fine|Short natural reply
soy de…|I am from…|Origin uses ser
vivo en…|I live in…|Place uses vivir en
hablo un poco de español|I speak a little Spanish|A useful confidence phrase
no entiendo|I do not understand|Conversation repair
¿puede repetir?|can you repeat?|Formal or neutral request
más despacio|more slowly|Stress des-PA-cio
sí|yes|The accent distinguishes it from si = if
no|no / not|Placed before the verb
agua|water|Feminine noun that uses el in singular
café|coffee|Final stress needs the accent
pan|bread|Masculine noun
la cuenta|the bill / check|Restaurant essential
quiero…|I want / I would like…|Direct and normal in service contexts
¿cuánto cuesta?|how much does it cost?|Price question
el baño|the bathroom|The ñ is one sound
la estación|the station|Feminine noun
¿dónde está…?|where is…?|Location uses estar
aquí|here|Final stress
allí|there|Often pronounced a-YÍ or a-LLÍ by region
izquierda|left|Direction noun
derecha|right|Direction noun
hoy|today|One syllable
mañana|tomorrow / morning|Meaning comes from context
ahora|now|The h is silent`,
  A2: `ayer|yesterday|Pairs naturally with the preterite
anoche|last night|A finished past-time marker
la semana pasada|last week|Agreement: pasada matches semana
fui|I went / I was|Ir and ser share this preterite form
hice|I did / I made|Irregular preterite of hacer
tuve|I had|Irregular preterite of tener
primero|first|Sequence marker
luego|then / later|Sequence marker
después|afterward|Carries written stress
al final|in the end|Useful story closer
normalmente|normally|Routine marker
a veces|sometimes|Frequency phrase
casi nunca|hardly ever|Placed before or after the verb
todos los días|every day|Plural los días
me gusta|I like|The liked thing controls gusta/gustan
me encanta|I love|Literally “it delights me”
prefiero|I prefer|Stem-changing verb
creo que|I think that|Soft opinion opener
porque|because|One word in answers
por eso|that is why|Links result to cause
pero|but|Basic contrast
aunque|although / even though|Introduces concession
podemos…|we can…|Plan-making chunk
¿te apetece…?|do you feel like…?|Frequent in Spain; alternatives exist regionally
voy a…|I am going to…|Near future + infinitive
tengo que…|I have to…|Obligation + infinitive
hay que…|one has to…|Impersonal obligation
quedamos a las…|let’s meet at…|Useful plan phrase
la cita|appointment / date|Meaning depends on context
la farmacia|pharmacy|Stress: far-MA-cia
me duele…|…hurts|Singular body part
necesito ayuda|I need help|Direct request
está roto|it is broken|State uses estar
no funciona|it does not work|Problem-solving phrase
¿me puede ayudar?|can you help me?|Formal request with object pronoun
otra vez|again|Two-word adverbial chunk`,
  B1: `resulta que|it turns out that|Story-framing expression
de repente|suddenly|Narrative event marker
mientras|while|Links simultaneous events
desde entonces|since then|Connects past to present
solía…|I used to…|Imperfect of soler + infinitive
acababa de…|I had just…|Imperfect + de + infinitive
me di cuenta de que|I realized that|Keep de before que
por suerte|luckily|Speaker stance marker
por desgracia|unfortunately|Speaker stance marker
sin embargo|however|Strong contrast connector
además|moreover / besides|Adds information
en cambio|whereas / on the other hand|Contrasts alternatives
desde mi punto de vista|from my point of view|Opinion frame
estoy de acuerdo|I agree|Use estar de acuerdo
no estoy del todo de acuerdo|I do not entirely agree|Soft disagreement
depende de|it depends on|Always uses de
lo importante es que|the important thing is that|Often triggers subjunctive later
me parece que|it seems to me that|Common opinion hedge
una ventaja|an advantage|Feminine noun
un inconveniente|a drawback|Masculine noun
resolver|to solve|O→ue in some present forms
solicitar|to request / apply for|More formal than pedir
devolver|to return / give back|Stem-changing verb
quejarse|to complain|Reflexive verb
hacer una reserva|to make a reservation|Natural collocation
perder el vuelo|to miss the flight|Literally lose the flight
hacer transbordo|to transfer|Transport collocation
estar disponible|to be available|State with estar
llevarse bien|to get along|Reflexive reciprocal chunk
seguir en contacto|to stay in touch|Seguir + en
conseguir|to manage to / obtain|Stem-changing verb
mejorar|to improve|Regular -ar verb
el medio ambiente|the environment|Masculine despite -a ending
ahorrar|to save|Money, time, or resources
darse cuenta|to realize|Reflexive idiom
tener ganas de|to feel like|Follow with noun or infinitive`,
  B2: `a mi modo de ver|as I see it|A measured opinion frame
cabe destacar que|it is worth noting that|Formal emphasis
conviene recordar que|it is worth remembering that|Impersonal recommendation
no cabe duda de que|there is no doubt that|Certainty normally takes indicative
es posible que|it is possible that|Triggers subjunctive
por mucho que|no matter how much|Concessive frame
a pesar de que|despite the fact that|Contrast connector
siempre y cuando|provided that|Condition commonly takes subjunctive
en la medida en que|insofar as|Formal qualification
de ahí que|hence / which is why|Often followed by subjunctive
por consiguiente|consequently|Formal result connector
ahora bien|that said|Discourse pivot
plantear una cuestión|to raise an issue|Academic collocation
llevar a cabo|to carry out|Formal action collocation
poner de manifiesto|to make clear / reveal|Formal reporting chunk
tener en cuenta|to take into account|Fixed phrase
llegar a un acuerdo|to reach an agreement|Negotiation collocation
dar lugar a|to give rise to|Cause-and-effect chunk
estar a favor de|to be in favor of|Position phrase
estar en contra de|to be against|Position phrase
matizar|to qualify / add nuance|Argument skill
rebatir|to rebut|Formal debate verb
respaldar|to support / back up|Evidence collocation
cuestionar|to question / challenge|Can be analytical, not just interrogative
el enfoque|approach|Masculine noun
el alcance|scope / reach|Masculine noun
la evidencia|evidence|Often uncountable in English
el sesgo|bias|Research and media term
fiable|reliable|Works for all genders
contundente|forceful / compelling|Works for all genders
rentable|cost-effective / profitable|Context decides meaning
sostenible|sustainable|Works for all genders
a largo plazo|in the long term|Time horizon phrase
en términos de|in terms of|Analytical frame
hasta cierto punto|to a certain extent|Useful hedging
en última instancia|ultimately|Formal conclusion marker`,
  C1: `a grandes rasgos|broadly speaking|Signals a high-level summary
dicho de otro modo|put another way|Reformulation marker
por lo que respecta a|as regards|Formal topic shift
habida cuenta de|in view of|Formal causal phrase
sin perjuicio de|without prejudice to / notwithstanding|Legal-administrative register
a todas luces|clearly / manifestly|Strong stance marker
no deja de ser|it is still / remains|Nuanced concession
dista mucho de|is far from|Critical evaluation frame
se presta a|lends itself to|Evaluation collocation
adolecer de|to suffer from / be deficient in|Formal critical verb
poner en tela de juicio|to call into question|Fixed evaluative phrase
sentar un precedente|to set a precedent|Institutional collocation
zanjar una cuestión|to settle an issue|Formal resolution
sopesar|to weigh up|Deliberative verb
ahondar en|to delve into|Formal analysis verb
desentrañar|to unravel|Complex-problem verb
esclarecer|to clarify|Formal investigation verb
reivindicar|to advocate / reclaim|Meaning depends on context
propiciar|to foster / bring about|Formal causative verb
socavar|to undermine|Critical analysis verb
el cometido|remit / purpose|Institutional noun
la coyuntura|current situation / climate|Economic-political noun
el entramado|framework / network|Complex system noun
la envergadura|scale / magnitude|Formal noun
el planteamiento|approach / formulation|Academic noun
la premisa|premise|Argument noun
la salvedad|caveat|Qualification noun
el matiz|nuance|Masculine noun
verosímil|plausible|Formal adjective
fehaciente|conclusive / reliable|Evidence adjective
subyacente|underlying|Analytical adjective
ambiguo|ambiguous|Agreement: ambigua, ambiguos
paulatino|gradual|Agreement applies
tajante|categorical / blunt|Register-sensitive adjective
con creces|by far / more than enough|Idiomatic intensifier
de sobra|more than enough|Colloquial-neutral idiom`,
  C2: `a la postre|ultimately|Literary-formal connector
amén de|as well as|Elevated additive phrase
so pena de|on pain of|Legal-literary condition
por ende|therefore|Formal result connector
con todo|nevertheless|Concessive discourse marker
mal que pese a|despite what … may think|Idiomatic concession
huelga decir que|it goes without saying that|Elevated impersonal frame
ni que decir tiene|needless to say|Fixed emphatic phrase
de soslayo|obliquely / in passing|Idiomatic adverbial phrase
a sabiendas de|in full knowledge of|Intentionality phrase
traer a colación|to bring up|Formal discussion idiom
dar pábulo a|to fuel / lend credence to|Elevated collocation
hacer gala de|to display / show off|Evaluative idiom
pecar de|to err on the side of / suffer from|Critical idiom
rayar en|to verge on|Evaluation phrase
salir al paso de|to respond to / counter|Public discourse idiom
elucidar|to elucidate|Scholarly verb
dirimir|to settle / adjudicate|Formal dispute verb
coadyuvar a|to contribute to|Highly formal verb
desdeñar|to scorn / disregard|Literary-formal verb
el cariz|turn / complexion|Used for how a situation develops
la tesitura|predicament / juncture|Formal abstract noun
la idiosincrasia|distinctive character|Sociocultural noun
el acervo|heritage / body of knowledge|Cultural-institutional noun
la disyuntiva|dilemma / choice|Argument noun
el resquicio|loophole / small opening|Literal or figurative
la aquiescencia|acquiescence|Formal noun
el menoscabo|detriment / impairment|Legal-formal noun
inherente|inherent|Takes a
baladí|trivial|Usually in negative evaluation
meridiano|crystal clear|Figurative formal adjective
consustancial|intrinsic|Takes a
lacónico|laconic / terse|Register-rich adjective
sesudo|weighty / intellectual|Can be mildly ironic
a duras penas|with great difficulty|Idiomatic adverb
sin ambages|bluntly / without beating around the bush|Elevated idiom`,
};

function parseLexicon(level: LevelId, source: string): Lexeme[] {
  return source.trim().split("\n").map((row, index) => {
    const [spanish, english, cue] = row.split("|");
    return { id: `${level}-w${index + 1}`, level, spanish, english, cue };
  });
}

export const lexiconByLevel = Object.fromEntries(levelOrder.map((level) => [level, parseLexicon(level, lexiconSource[level])])) as Record<LevelId, Lexeme[]>;
export const allLexicon = levelOrder.flatMap((level) => lexiconByLevel[level]);

const grammarSource: Record<LevelId, string> = {
  A1: `Identity with ser|subject + ser + identity/origin|Use ser for who someone is and where they are from.|Soy estudiante y soy de Chicago.|I am a student and I am from Chicago.
States and location with estar|subject + estar + state/place|Use estar for location and temporary state.|Estamos cansados, pero estamos aquí.|We are tired, but we are here.
There is / there are|hay + noun|Hay does not change for singular or plural.|Hay una farmacia cerca.|There is a pharmacy nearby.
Noun gender and articles|el/la/los/las + noun|Learn the article with the noun; endings are clues, not guarantees.|La estación está al lado del hotel.|The station is next to the hotel.
Present -ar verbs|stem + o/as/a/amos/áis/an|Match the verb ending to the subject.|Trabajo en casa y hablamos español.|I work at home and we speak Spanish.
Present -er and -ir verbs|stem + o/es/e/emos or imos/en|The nosotros ending distinguishes -er and -ir verbs.|Como aquí, pero vivimos allí.|I eat here, but we live there.
Negation|no + conjugated verb|Put no directly before the conjugated verb.|No entiendo la pregunta.|I do not understand the question.
Questions|question word + verb + subject|Spanish keeps opening and closing question marks.|¿Dónde está el baño?|Where is the bathroom?
Adjective agreement|noun + adjective matching gender/number|Most descriptive adjectives follow the noun and agree with it.|Quiero una habitación tranquila.|I want a quiet room.
Possession|mi/tu/su/nuestro + noun|Possessives agree mainly with the thing possessed.|Mi hermana vive con nuestros padres.|My sister lives with our parents.
Gustar basics|me/te/le + gusta(n) + thing|The thing liked controls singular gusta or plural gustan.|Me gustan los mercados pequeños.|I like small markets.
Near future|ir + a + infinitive|Use the present of ir to state a plan.|Vamos a cenar a las ocho.|We are going to have dinner at eight.`,
  A2: `Finished past: preterite|preterite verb + finished time|Use the preterite for completed events in a bounded past.|Ayer compré el billete y llamé al hotel.|Yesterday I bought the ticket and called the hotel.
Background past: imperfect|imperfect verb + background|Use the imperfect for habits, descriptions, and ongoing background.|Cuando era niño, vivía cerca del mar.|When I was a child, I lived near the sea.
Preterite versus imperfect|background + interrupted event|Set the scene with imperfect; move the story with preterite.|Llovía cuando salimos de casa.|It was raining when we left home.
Present perfect|haber + past participle|Use he/has/ha/hemos/han + participle for relevant experience.|Esta semana he trabajado mucho.|I have worked a lot this week.
Direct objects|lo/la/los/las + verb|Replace a known direct object and place the pronoun before a conjugated verb.|La reserva la hice ayer.|I made the reservation yesterday.
Indirect objects|me/te/le/nos/les + verb|Use indirect pronouns for the recipient or beneficiary.|¿Me puede traer la cuenta?|Can you bring me the bill?
Reflexive routines|reflexive pronoun + verb|The pronoun matches the person doing the action to themself.|Me levanto temprano y me acuesto tarde.|I get up early and go to bed late.
Comparisons|más/menos… que; tan… como|Compare unequal or equal qualities with these frames.|Este tren es más rápido que el autobús.|This train is faster than the bus.
Commands: tú|affirmative command; no + subjunctive form|Positive and negative informal commands use different forms.|Gira a la derecha, pero no cruces aquí.|Turn right, but do not cross here.
Obligation|tener que / hay que + infinitive|Tener que is personal; hay que is general.|Tenemos que salir; hay que llegar temprano.|We have to leave; one has to arrive early.
Por and para|por = cause/path/exchange; para = purpose/destination|Choose by relationship, not by one English translation.|Este regalo es para Ana y lo compré por veinte euros.|This gift is for Ana, and I bought it for twenty euros.
Linking a story|primero, luego, mientras, al final|Sequence and contrast make short narration coherent.|Primero comimos; luego, mientras paseábamos, empezó a llover.|First we ate; then, while we were walking, it began to rain.`,
  B1: `Present subjunctive: influence|request/emotion + que + subjunctive|Use the subjunctive when one subject influences another.|Quiero que me llames cuando llegues.|I want you to call me when you arrive.
Subjunctive: doubt and evaluation|doubt/evaluation + que + subjunctive|The speaker frames the proposition rather than asserting it.|Es posible que tengan razón.|It is possible that they are right.
Future and probability|future form|Use the future for predictions and present probability.|Mañana hará sol; ahora serán las seis.|It will be sunny tomorrow; it is probably six now.
Conditional|infinitive + ía endings|Use it for hypotheticals, advice, and polite requests.|Yo hablaría con ella antes de decidir.|I would speak with her before deciding.
If clauses: real conditions|si + present, present/future/command|Do not use the present subjunctive directly after si for real conditions.|Si tengo tiempo, te llamaré.|If I have time, I will call you.
Relative clauses|noun + que/donde/quien + clause|Add identifying or descriptive information without a new sentence.|Busco un lugar donde podamos hablar.|I am looking for a place where we can talk.
Se constructions|se + third-person verb|Se can express impersonal meaning or passive focus.|Aquí se habla español y se venden libros.|Spanish is spoken here and books are sold.
Reported speech|decir que + shifted message|Report statements and adjust person/time where necessary.|Me dijo que llegaría más tarde.|She told me she would arrive later.
Past perfect|había + participle|Place one past event before another past event.|Cuando llamé, ya habían salido.|When I called, they had already left.
Gerund and ongoing action|estar/seguir + gerund|Show action in progress or continuing.|Seguimos buscando una solución.|We are still looking for a solution.
Connectors for argument|aunque, sin embargo, además, por eso|Mark concession, contrast, addition, and result clearly.|Es caro; sin embargo, merece la pena.|It is expensive; however, it is worth it.
Verbal periphrases|acabar de / volver a / dejar de + infinitive|Package phase, repetition, or cessation around an action.|Acabo de llegar y voy a volver a llamar.|I have just arrived and I am going to call again.`,
  B2: `Past subjunctive|past stem + ra endings|Use it in past influence, doubt, evaluation, and hypothetical frames.|Me pidió que revisara el informe.|She asked me to review the report.
Hypothetical si clauses|si + past subjunctive, conditional|Frame an unreal or unlikely present/future condition.|Si tuviéramos más datos, decidiríamos mejor.|If we had more data, we would decide better.
Past counterfactual|si + pluperfect subjunctive, conditional perfect|Reflect on an unreal past result.|Si lo hubiera sabido, habría actuado antes.|If I had known, I would have acted earlier.
Subjunctive in relative clauses|unknown/nonexistent noun + subjunctive|Use subjunctive when the referent is sought, denied, or uncertain.|Necesitamos una solución que funcione a largo plazo.|We need a solution that works in the long term.
Concession|aunque / por mucho que + mood|Mood shows whether the speaker treats the fact as asserted or hypothetical.|Aunque sea difícil, conviene intentarlo.|Even if it is difficult, it is worth trying.
Passive and result|ser + participle; estar + participle|Ser foregrounds an event; estar foregrounds its resulting state.|La propuesta fue aprobada y ya está publicada.|The proposal was approved and is now published.
Information structure|topic, focus, clitic doubling|Move known information and highlight contrast without losing reference.|A Marta la llamaron ayer; a Luis, no.|Marta was called yesterday; Luis was not.
Reported stance|según / al parecer / se dice que|Attribute information and calibrate certainty.|Al parecer, la medida se anunciará mañana.|Apparently, the measure will be announced tomorrow.
Nominalization|verb/adjective → abstract noun|Dense formal language often packages actions as nouns.|La reducción del gasto generó preocupación.|The reduction in spending caused concern.
Discourse markers|ahora bien / por consiguiente / de hecho|Signal pivots, consequences, and evidence across extended speech.|La idea es viable; ahora bien, requiere financiación.|The idea is viable; that said, it requires funding.
Register and mitigation|conditional / imperfect / hedge|Soften requests and disagreement to fit the relationship.|Quería saber si podrían aclarar este punto.|I wanted to know whether you could clarify this point.
Prepositional precision|verb/adjective + governed preposition|Learn chunks such as depender de and contribuir a.|La decisión depende de que exista un acuerdo.|The decision depends on an agreement existing.`,
  C1: `Advanced mood choice|indicative vs subjunctive as stance|Mood can present information as asserted, rejected, or merely entertained.|No es que falten ideas, sino que cuesta aplicarlas.|It is not that ideas are lacking, but rather that applying them is difficult.
Concessive layering|aun cuando / si bien / pese a que|Choose connector and mood to calibrate concession and register.|Si bien el método es sólido, adolece de cierta rigidez.|Although the method is sound, it suffers from a certain rigidity.
Impersonal academic voice|se + verb / cabe + infinitive|Depersonalize claims while keeping responsibility clear.|Cabe señalar que se omitieron dos variables.|It should be noted that two variables were omitted.
Reformulation|es decir / mejor dicho / dicho de otro modo|Repair, specify, or recast an idea in real time.|La medida fue parcial; mejor dicho, insuficiente.|The measure was partial—or rather, insufficient.
Thematic fronting|fronted constituent + resumptive structure|Control information flow and contrast in long discourse.|En cuanto a los costes, conviene analizarlos por separado.|As for the costs, they should be analyzed separately.
Subordinate tense sequence|reporting frame + matching subordinate tense|Track time and viewpoint across complex reporting.|Negó que hubiera recibido el aviso antes de que venciera el plazo.|He denied having received the notice before the deadline expired.
Participial clauses|participle + complement, main clause|Compress prior or contextual information in formal prose.|Examinados los datos, se descartó la hipótesis inicial.|Once the data had been examined, the initial hypothesis was rejected.
Gerund precision|gerund for simultaneous/manner, not later result|Avoid using the gerund for an action that occurs afterward.|Entró sonriendo y saludó al público.|She entered smiling and greeted the audience.
Lexical cohesion|repetition, synonym, superordinate, reference|Guide the reader through a topic without mechanical repetition.|La propuesta suscitó debate; esta iniciativa también recibió apoyo.|The proposal sparked debate; the initiative also received support.
Nuanced comparison|a diferencia de / frente a / en comparación con|Select a frame that matches contrast or neutral comparison.|Frente al enfoque anterior, este prioriza la prevención.|Unlike the previous approach, this one prioritizes prevention.
Evidential distance|supuestamente / según consta / todo apunta a que|Encode source and confidence explicitly.|Según consta en el acta, el acuerdo fue unánime.|According to the minutes, the agreement was unanimous.
Idiomatic preposition patterns|de cara a / a raíz de / en aras de|Use multiword prepositions as whole register-sensitive units.|A raíz de la crisis, se actuó en aras de la estabilidad.|As a result of the crisis, action was taken in the interest of stability.`,
  C2: `Rhetorical inversion|marked order for emphasis or style|Reorder constituents deliberately while preserving clarity.|Difícilmente cabría imaginar una respuesta más tajante.|It would be difficult to imagine a more categorical response.
Echo and refutation|¿Que…? / ni… / como si…|Reuse an interlocutor’s wording to question or reject it.|¿Que fue casual? Ni que no conociéramos los antecedentes.|That it was accidental? As if we did not know the background.
Polyphonic stance|conditional, quotation, and attribution|Let several voices coexist without confusing the speaker’s position.|La reforma resolvería, según sus defensores, un problema ya superado.|According to its advocates, the reform would solve a problem already overcome.
Strategic ellipsis|omit recoverable material|Create natural density without sacrificing interpretation.|Unos pedían cautela; otros, una respuesta inmediata.|Some called for caution; others, an immediate response.
Idiomatic intensification|fixed intensifier + evaluative phrase|Use conventional combinations rather than literal translation.|La explicación dista mucho de ser convincente.|The explanation is far from convincing.
Legal-administrative qualification|sin perjuicio de / salvo que / a efectos de|Define scope and exceptions with precision.|Se mantendrá el acuerdo, salvo que concurran nuevas circunstancias.|The agreement will remain unless new circumstances arise.
Literary viewpoint|free indirect style and shifted deixis|Track whose perception colors a passage without explicit reporting.|Mañana, pensó, todo habría quedado atrás.|Tomorrow, she thought, everything would be behind her.
Metaphor and connotation|figurative frame + register control|Interpret and deploy imagery without making it sound forced.|La propuesta abrió una brecha en un consenso hasta entonces sólido.|The proposal opened a breach in a previously solid consensus.
Pragmatic irony|literal wording + contextual reversal|Recognize that tone and context can invert surface meaning.|Sí, claro, porque improvisar siempre sale de maravilla.|Yes, of course, because improvising always works wonderfully.
Dense synthesis|source A + source B + evaluated conclusion|Integrate claims rather than list summaries.|Si se contrastan ambos informes, se desprende una conclusión menos tajante.|Comparing both reports yields a less categorical conclusion.
Micro-register shifts|neutral / colloquial / formal reformulation|Rephrase the same intent for audience, medium, and relationship.|No procede aplazarlo; dicho llanamente, no podemos esperar.|It is not appropriate to postpone it; plainly put, we cannot wait.
Phonostylistic control|pausing, prominence, rhythm, and stance|Prosody carries structure, certainty, tact, and irony in advanced speech.|No cuestiono el objetivo; cuestiono, eso sí, el procedimiento.|I do not question the goal; I do, however, question the procedure.`,
};

function parseGrammar(level: LevelId, source: string): GrammarLesson[] {
  return source.trim().split("\n").map((row, index) => {
    const [title, formula, explanation, example, translation] = row.split("|");
    return { id: `${level}-g${index + 1}`, level, title, formula, explanation, example, translation };
  });
}

export const grammarByLevel = Object.fromEntries(levelOrder.map((level) => [level, parseGrammar(level, grammarSource[level])])) as Record<LevelId, GrammarLesson[]>;
export const allGrammar = levelOrder.flatMap((level) => grammarByLevel[level]);

const missionSource: Record<LevelId, string> = {
  A1: `Meet someone|Social|introduce yourself and ask a name|A neighbor greets you at a gathering.|Hola, ¿cómo te llamas?|Me llamo Alex. Soy de Boston.|My name is Alex. I am from Boston.|Mucho gusto. ¿Vives aquí?|Sí, vivo cerca. Encantado.
Order breakfast|Food|order and make one polite change|You are at a busy café.|Buenos días. ¿Qué le pongo?|Quiero un café con leche y una tostada, por favor.|I would like a coffee with milk and toast, please.|¿Algo más?|Nada más, gracias. La cuenta, por favor.
Describe your home|Home|say what your home is like|A friend asks about your apartment.|¿Cómo es tu casa?|Es pequeña, pero hay mucha luz.|It is small, but there is a lot of light.|¿Cuántas habitaciones hay?|Hay dos habitaciones y una cocina.
Find the station|City|ask for and follow basic directions|Your phone has died near the city center.|Perdón, ¿dónde está la estación?|Siga todo recto y gire a la derecha.|Go straight ahead and turn right.|¿Está lejos?|No, está a cinco minutos.
Tell the time|Routine|state a simple schedule|A classmate compares daily routines.|¿A qué hora empiezas a trabajar?|Empiezo a las nueve y termino a las cinco.|I start at nine and finish at five.|¿Comes en casa?|No, como cerca del trabajo.
Buy what you need|Shopping|ask for an item, size, and price|You need a shirt at a small shop.|Hola, ¿qué busca?|Busco una camisa azul. ¿Cuánto cuesta?|I am looking for a blue shirt. How much is it?|Cuesta treinta euros.|Bien. ¿Tiene una talla más grande?
Talk about family|People|name and describe close people|A new friend asks about your family.|¿Tienes hermanos?|Sí, tengo una hermana. Es médica.|Yes, I have a sister. She is a doctor.|¿Dónde vive?|Vive en Miami con su familia.
Make a plan|Free time|invite someone and choose a time|You want to meet this weekend.|¿Te apetece ir al cine?|Sí. ¿Podemos quedar el sábado?|Yes. Can we meet on Saturday?|Perfecto. ¿A las siete?|Sí, nos vemos allí.
Check in|Travel|give a reservation name and ask a question|You arrive at your hotel.|Buenas tardes. ¿En qué puedo ayudarle?|Tengo una reserva a nombre de Lee.|I have a reservation under Lee.|Sí, para dos noches.|Exacto. ¿A qué hora es el desayuno?
Explain a problem|Help|state a simple problem and request help|Your room key does not work.|¿Todo bien?|No, la llave no funciona. ¿Me puede ayudar?|No, the key does not work. Can you help me?|Claro. Le doy otra.|Muchas gracias.
Talk about weather|Small talk|describe today’s weather and preference|You make small talk before class.|Hace buen tiempo hoy, ¿verdad?|Sí, hace sol, pero hace un poco de frío.|Yes, it is sunny, but it is a little cold.|¿Te gusta el invierno?|No mucho. Prefiero el verano.
Repair a conversation|Communication|ask for repetition or slower speech|You miss part of an announcement.|¿Tiene alguna pregunta?|Perdón, no entiendo. ¿Puede repetir más despacio?|Sorry, I do not understand. Can you repeat more slowly?|Sí, claro.|Gracias. Ahora entiendo.`,
  A2: `Tell yesterday’s story|Narration|sequence three finished events|A friend asks how yesterday went.|¿Qué hiciste ayer?|Primero trabajé; luego fui al mercado y después cené con Ana.|First I worked; then I went to the market and afterward I had dinner with Ana.|Parece un día completo.|Sí, pero al final descansé.
Describe childhood|Biography|contrast past habit and present|You compare where you grew up.|¿Cómo era tu barrio?|Era tranquilo y jugábamos en la calle todos los días.|It was quiet, and we played in the street every day.|¿Todavía vives allí?|No, ahora vivo en el centro.
Visit a doctor|Health|describe symptoms and understand advice|You have felt ill since yesterday.|¿Qué le pasa?|Me duele la garganta y tengo fiebre desde ayer.|My throat hurts, and I have had a fever since yesterday.|Tiene que descansar y beber agua.|De acuerdo. ¿Necesito medicina?
Return a purchase|Shopping|explain a product problem and request a solution|Headphones bought yesterday are broken.|¿En qué puedo ayudarle?|Compré estos auriculares ayer, pero no funcionan.|I bought these headphones yesterday, but they do not work.|¿Quiere cambiarlos?|Sí, prefiero otro modelo.
Arrange a visit|Plans|negotiate availability and confirm details|You are planning a museum visit.|¿Te viene bien el viernes?|El viernes no puedo, pero estoy libre el sábado por la mañana.|Friday does not work for me, but I am free Saturday morning.|Perfecto. Quedamos a las diez.|De acuerdo. Te escribo antes.
Rent an apartment|Housing|ask about features and conditions|You call about an apartment listing.|Llamo por el piso del anuncio.|Sí, todavía está disponible.|Yes, it is still available.|¿Cuántas habitaciones tiene?|Tiene dos, y el agua está incluida.
Travel by train|Transport|buy a ticket and clarify a connection|You need to reach Seville this evening.|Quisiera un billete para Sevilla.|Hay uno a las cinco con transbordo en Córdoba.|There is one at five with a transfer in Córdoba.|¿A qué hora llega?|Llega a las ocho y cuarto.
Share preferences|Leisure|compare options and give reasons|Friends are choosing a weekend activity.|¿Playa o montaña?|Prefiero la montaña porque me gusta caminar y hay menos gente.|I prefer the mountains because I like walking and there are fewer people.|A mí también, aunque está más lejos.|Podemos ir en tren.
Handle a phone call|Communication|leave and confirm a simple message|You call while a colleague is away.|Lo siento, Marta no está.|¿Puede decirle que llamó Daniel?|Can you tell her Daniel called?|Claro. ¿Tiene su número?|Sí, pero volveré a llamar esta tarde.
Explain a recipe|Food|give a short sequence of instructions|A friend wants your tortilla recipe.|¿Cómo haces la tortilla?|Primero corto las patatas; luego las frío y al final añado los huevos.|First I cut the potatoes; then I fry them and finally add the eggs.|¿Cuánto tiempo tarda?|Más o menos media hora.
Celebrate an event|Social|describe a recent celebration|A classmate asks about your weekend.|¿Qué tal la fiesta?|Ha sido estupenda. Vino toda mi familia y bailamos mucho.|It was great. My whole family came, and we danced a lot.|¿Recibiste algún regalo?|Sí, mis amigos me regalaron un libro.
Resolve a mix-up|Service|clarify what you ordered and what arrived|The server brought the wrong dish.|¿Está todo bien?|Perdone, pedí la sopa, pero me trajo la ensalada.|Excuse me, I ordered the soup, but you brought me the salad.|Lo siento. La cambio ahora mismo.|Gracias, no hay problema.`,
  B1: `Tell an unexpected story|Narration|manage background, sequence, and reaction|A trip did not go as planned.|¿Qué pasó con el viaje?|Íbamos hacia el aeropuerto cuando el coche se averió de repente.|We were heading to the airport when the car suddenly broke down.|¿Perdisteis el vuelo?|Casi, pero por suerte llegamos a tiempo.
Give practical advice|Advice|recommend a course of action with reasons|A friend is considering a move abroad.|No sé si debería aceptar el trabajo.|Yo hablaría con el equipo y pediría más información antes de decidir.|I would speak with the team and ask for more information before deciding.|¿Qué les preguntarías?|Sobre todo, preguntaría por el horario y el contrato.
Make a complaint|Service|describe evidence and request a fair remedy|A hotel room differs from the booking.|¿En qué puedo ayudarle?|La habitación que nos dieron no corresponde a la reserva.|The room we were given does not match the reservation.|Voy a comprobarlo.|Gracias. Quisiera una solución esta noche.
Defend a preference|Discussion|state, support, and qualify an opinion|A group debates remote work.|¿Prefieres trabajar desde casa?|En general sí, porque ahorro tiempo, aunque a veces echo de menos al equipo.|Generally yes, because I save time, although sometimes I miss the team.|Entonces, ¿qué opción elegirías?|Un modelo flexible me parece lo mejor.
Report what someone said|Communication|relay a message accurately|A colleague missed a meeting.|¿Qué dijo la directora?|Dijo que el proyecto seguiría adelante y que nos enviaría el calendario.|She said the project would continue and that she would send us the schedule.|¿Mencionó el presupuesto?|No, pero pidió que preparáramos preguntas.
Solve a travel disruption|Travel|ask about alternatives and consequences|Your train has been canceled.|El tren de las seis ha sido cancelado.|¿Hay otro que llegue hoy o puedo cambiar el billete?|Is there another one that arrives today, or can I change the ticket?|Hay un autobús a las siete.|Entonces cámbielo, por favor.
Discuss a news story|Media|summarize a report and identify uncertainty|A friend asks about an article.|¿De qué trata la noticia?|Explica que la ciudad quiere limitar el tráfico, pero aún no han decidido cómo.|It explains that the city wants to limit traffic, but they have not yet decided how.|¿Crees que funcionará?|Depende de las alternativas que ofrezcan.
Plan a project|Work|set priorities, roles, and a condition|Your group has one week for a presentation.|¿Cómo nos organizamos?|Si terminamos la investigación hoy, podremos preparar las diapositivas mañana.|If we finish the research today, we can prepare the slides tomorrow.|Yo puedo revisar los datos.|Perfecto; yo redacto la conclusión.
Explain a tradition|Culture|describe a custom and its meaning|A visitor asks about a local celebration.|¿Por qué se celebra esta fiesta?|Surgió hace muchos años y reúne a las familias del barrio.|It began many years ago and brings neighborhood families together.|¿Ha cambiado mucho?|Sí, aunque mantiene sus elementos principales.
Negotiate shared space|Home|raise a problem tactfully and propose a solution|Noise has become an issue with a roommate.|¿Podemos hablar del ruido?|Claro. No me di cuenta de que te molestaba.|Of course. I did not realize it bothered you.|¿Podrías usar auriculares por la noche?|Sí, y avísame si vuelve a pasar.
Compare education options|Learning|weigh advantages and drawbacks|A friend is choosing an online course.|¿Qué curso te convence más?|El primero es más completo; en cambio, el segundo ofrece horarios flexibles.|The first is more complete; on the other hand, the second offers flexible schedules.|¿Cuál elegirías?|Depende de cuánto tiempo puedas dedicarle.
Tell a turning point|Biography|connect cause, realization, and change|You explain why you changed careers.|¿Por qué cambiaste de profesión?|Me di cuenta de que quería un trabajo más creativo y empecé a formarme.|I realized that I wanted a more creative job and began training.|¿Fue difícil empezar de nuevo?|Sí, pero desde entonces estoy mucho más satisfecho.`,
  B2: `Lead a structured debate|Discussion|state, support, concede, and rebut|A group debates limits on city traffic.|¿Debería restringirse el tráfico en el centro?|Estoy a favor, siempre y cuando se mejore primero el transporte público.|I am in favor, provided that public transportation is improved first.|Algunos comercios temen perder clientes.|Es una preocupación válida, pero la evidencia de otras ciudades la matiza.
Negotiate a contract|Work|clarify priorities and reach a compromise|Two teams disagree on a delivery date.|No podemos aceptar ese plazo.|Entiendo el inconveniente; ahora bien, podríamos reducir el alcance inicial.|I understand the drawback; that said, we could reduce the initial scope.|¿Qué incluiría la primera fase?|Lo esencial, y el resto se entregaría un mes después.
Analyze a proposal|Academic|evaluate evidence, limits, and implications|A seminar examines a policy paper.|¿Te convence el argumento principal?|Hasta cierto punto, aunque el informe no tiene en cuenta los costes indirectos.|To a certain extent, although the report does not take indirect costs into account.|¿Eso invalida la conclusión?|No del todo, pero obliga a formularla con más cautela.
Handle a formal complaint|Service|document harm and request proportional action|A service outage caused a business loss.|¿Qué solución espera obtener?|Dado que la interrupción duró dos días, solicito una compensación proporcional.|Given that the interruption lasted two days, I request proportional compensation.|Revisaremos las condiciones.|Agradecería una respuesta por escrito esta semana.
Interpret an interview|Media|distinguish claim, implication, and stance|A public figure gives an ambiguous answer.|¿Cómo interpretas sus palabras?|No niega el problema; más bien cuestiona que la medida propuesta sea viable.|He does not deny the problem; rather, he questions whether the proposed measure is viable.|¿Crees que cambiará de posición?|Es posible, si aumenta la presión pública.
Mediate a disagreement|Social|reframe positions and find shared ground|Two friends disagree about shared plans.|Los dos queréis cosas distintas.|Sí, pero creo que podemos llegar a un acuerdo si aclaramos las prioridades.|Yes, but I think we can reach an agreement if we clarify the priorities.|¿Qué propones?|Dedicar una parte del viaje a cada interés.
Present a trend|Data|describe change, causes, and uncertainty|You explain a chart in a meeting.|¿Qué muestran los datos?|Se observa un aumento sostenido, probablemente debido a dos factores.|The data show a sustained increase, probably due to two factors.|¿Se mantendrá la tendencia?|No necesariamente; dependerá de la demanda futura.
Adapt register|Communication|deliver the same message tactfully and formally|A deadline must be renegotiated by email.|¿Cómo plantearías la petición?|Quería saber si sería posible ampliar el plazo hasta el viernes.|I wanted to know whether it would be possible to extend the deadline until Friday.|¿Darías una razón?|Sí, explicaría brevemente el imprevisto y ofrecería un avance.
Discuss sustainability|Society|balance benefits, costs, and long-term effects|A panel considers a new energy plan.|¿Es rentable la transición?|A corto plazo exige inversión; a largo plazo puede reducir costes y emisiones.|In the short term it requires investment; in the long term it can reduce costs and emissions.|¿Qué riesgo destacarías?|Que sus beneficios no se distribuyan de forma equitativa.
Review a cultural work|Culture|interpret technique and defend an evaluation|Friends discuss a film after a screening.|¿Qué te pareció el final?|Es deliberadamente ambiguo y obliga al espectador a reconsiderar la historia.|It is deliberately ambiguous and forces the viewer to reconsider the story.|A algunos les pareció confuso.|Lo entiendo, aunque esa incertidumbre me parece uno de sus aciertos.
Run a problem-solving meeting|Work|define root cause and choose next action|A launch missed its target.|¿Por qué falló el lanzamiento?|No fue un único error, sino una combinación de plazos poco realistas y mala coordinación.|It was not one error, but a combination of unrealistic deadlines and poor coordination.|¿Cuál es la prioridad ahora?|Corregir el proceso antes de asignar responsabilidades.
Reach the B2 threshold|Checkpoint|sustain spontaneous, balanced interaction|An examiner asks what fluency means to you.|¿Cuándo dirías que alguien habla con fluidez?|Cuando puede interactuar sin esfuerzo excesivo y ajustar lo que dice a la situación.|When they can interact without excessive effort and adapt what they say to the situation.|¿Significa no cometer errores?|No; significa comunicarse con soltura incluso cuando aparecen.`,
  C1: `Brief an executive|Professional|compress complexity into a clear recommendation|A director needs a two-minute decision brief.|¿Cuál es su recomendación?|Habida cuenta de los riesgos, convendría aplicar el cambio por fases y evaluarlo trimestralmente.|In view of the risks, it would be advisable to implement the change in phases and evaluate it quarterly.|¿Qué objeción prevé?|El coste inicial, si bien el retorno podría compensarlo con creces.
Critique a study|Academic|evaluate method, evidence, and scope precisely|A seminar reviews a new paper.|¿Qué limitación considera más relevante?|La muestra es amplia, pero adolece de un sesgo que limita el alcance de las conclusiones.|The sample is large, but it has a bias that limits the scope of the conclusions.|¿Descartaría el estudio?|No; lo tomaría como punto de partida, no como prueba definitiva.
Chair a difficult meeting|Professional|synthesize disagreement and restore direction|Discussion has become circular.|Parece que no avanzamos.|Permítanme reformular: coincidimos en el objetivo, pero discrepamos sobre el procedimiento.|Let me rephrase: we agree on the objective, but disagree about the procedure.|¿Cómo seguimos?|Sopesemos ambas opciones con los mismos criterios.
Analyze rhetoric|Media|identify framing, omission, and implied audience|You compare two headlines about the same event.|¿Por qué producen impresiones distintas?|Una destaca el conflicto; la otra, en cambio, pone de manifiesto la cooperación.|One highlights conflict; the other, by contrast, makes the cooperation clear.|¿Alguna es falsa?|No necesariamente, pero ambas seleccionan qué realidad mostrar.
Write diplomatically|Communication|state a serious objection without escalation|You must reject part of a proposal.|¿Cómo respondería?|Agradecemos el planteamiento; no obstante, algunos supuestos requieren mayor justificación.|We appreciate the approach; nevertheless, some assumptions require further justification.|¿Rechazaría todo?|No; propondría revisar esos puntos antes de continuar.
Interpret literature|Culture|connect language, viewpoint, and theme|A reading group examines an unreliable narrator.|¿Podemos confiar en el narrador?|Su versión resulta verosímil al principio, pero ciertos detalles la ponen en tela de juicio.|His version seems plausible at first, but certain details call it into question.|¿Qué efecto produce?|Obliga al lector a reconstruir lo que quizá ocurrió.
Advocate a policy|Society|build a nuanced case and answer objections|A public forum debates housing.|¿Qué medida defendería?|Propiciaría vivienda asequible sin menoscabar la diversidad de los barrios.|I would promote affordable housing without undermining neighborhood diversity.|¿Cómo evitaría efectos adversos?|Combinaría incentivos, protección y evaluación continua.
Resolve ambiguity|Professional|ask precise questions before acting|Instructions conflict across two documents.|¿Qué haría primero?|Esclarecería cuál de los criterios prevalece y dejaría constancia de la decisión.|I would clarify which criterion takes precedence and document the decision.|¿Por qué por escrito?|Para evitar interpretaciones divergentes más adelante.
Tell a layered story|Narration|control viewpoint, time shifts, and implication|You recount a decision that looked obvious only afterward.|¿Cuándo comprendiste lo que pasaba?|No fue hasta meses después cuando logré desentrañar las razones de su silencio.|It was not until months later that I managed to unravel the reasons for his silence.|¿Cambió eso tu recuerdo?|Por completo: lo que parecía indiferencia adquirió otro matiz.
Teach a complex idea|Explanation|use analogy, reformulation, and checks for understanding|A non-specialist asks about an expert topic.|No entiendo el concepto.|Piense en una red: cada cambio afecta al entramado, aunque no de forma inmediata.|Think of a network: each change affects the whole system, though not immediately.|Entonces, ¿nada actúa por separado?|Exacto; dicho de otro modo, las relaciones importan tanto como las partes.
Compare cultural norms|Intercultural|avoid stereotypes while explaining patterns|A colleague asks why communication styles differ.|¿Es siempre más indirecta esa cultura?|No conviene generalizar; hay tendencias, pero la situación y la persona son decisivas.|It is best not to generalize; there are tendencies, but the situation and the person are decisive.|¿Cómo debería adaptarme?|Observe, pregunte y ajuste su registro sin imitar estereotipos.
Reach advanced fluency|Checkpoint|speak flexibly, precisely, and almost effortlessly|An examiner asks what still requires effort.|¿Qué aspecto de su español sigue perfeccionando?|Busco mayor precisión idiomática, sobre todo al matizar ideas complejas en tiempo real.|I seek greater idiomatic precision, especially when qualifying complex ideas in real time.|¿Qué estrategia utiliza?|Reformulo, pido retroalimentación y comparo mis opciones con usos auténticos.`,
  C2: `Synthesize conflicting sources|Academic|integrate disagreement into a defensible account|Three reports reach incompatible conclusions.|¿Cómo explicaría la discrepancia?|Lejos de excluirse, los resultados responden a premisas y escalas de análisis distintas.|Far from excluding one another, the results arise from different assumptions and scales of analysis.|¿Qué conclusión extrae?|Que cualquier síntesis tajante pecaría de simplificación.
Interpret subtle irony|Pragmatics|infer meaning from wording, tone, and shared context|A speaker praises a clearly failed plan.|Dijo que había sido “un éxito impecable”.|La literalidad es elogiosa, pero la entonación y el contexto revelan una crítica mordaz.|The literal wording is praise, but the intonation and context reveal biting criticism.|¿Podría malinterpretarse?|Sin duda, si se desconoce la situación compartida.
Recast across registers|Communication|shift one message from colloquial to institutional|A spontaneous comment must become an official statement.|Dilo de forma institucional.|La organización reconoce las deficiencias detectadas y adoptará medidas para subsanarlas.|The organization acknowledges the shortcomings identified and will take measures to remedy them.|¿Y de forma llana?|Nos equivocamos y vamos a corregirlo.
Negotiate legal nuance|Professional|define scope, exceptions, and obligations|Two parties interpret a clause differently.|¿Qué margen deja la cláusula?|El acuerdo obliga a notificar, sin perjuicio de que las partes pacten una excepción expresa.|The agreement requires notification, without prejudice to the parties agreeing an explicit exception.|¿Cabe una excepción tácita?|La redacción no la excluye, pero sería difícil acreditarla.
Edit for voice|Writing|improve rhythm, precision, and authorial stance|A polished essay still sounds heavy.|¿Qué cambiarías?|Aligeraría las nominalizaciones y variaría el ritmo, amén de eliminar dos incisos redundantes.|I would lighten the nominalizations and vary the rhythm, as well as remove two redundant asides.|¿Perdería formalidad?|No; ganaría claridad sin rebajar el registro.
Mediate value conflict|Society|reveal assumptions and create a principled compromise|A dispute involves identity and resources.|¿Por qué no basta con repartir los recursos?|Porque la controversia atañe también al reconocimiento y a la idiosincrasia de cada grupo.|Because the controversy also concerns recognition and the distinctive character of each group.|¿Cómo se avanza?|Haciendo explícitos los valores en juego antes de negociar cifras.
Analyze historical causation|Academic|weigh structure, agency, and contingency|A debate reduces change to one cause.|¿Cuál fue la causa principal?|Plantearlo así falsea la disyuntiva: las estructuras condicionaron decisiones que no eran inevitables.|Framing it that way creates a false dilemma: structures constrained decisions that were not inevitable.|¿Entonces todo fue contingente?|Tampoco; hubo límites reales y márgenes de acción variables.
Respond under pressure|Professional|stay precise while challenged aggressively|An interviewer misstates your position.|Usted está evitando responder.|En absoluto; estoy distinguiendo dos cuestiones que su pregunta da por equivalentes.|Not at all; I am distinguishing two issues that your question treats as equivalent.|¿No es una evasiva?|No, es una precisión necesaria para responder sin ambages.
Read between the lines|Literature|infer suppressed motives from style and omission|A character’s letter avoids its main subject.|¿Qué sugiere el silencio?|Aquello que menciona de soslayo adquiere más peso que sus afirmaciones explícitas.|What she mentions obliquely carries more weight than her explicit statements.|¿Es una confesión?|No exactamente, pero deja un resquicio para esa lectura.
Debunk elegantly|Discussion|correct a sophisticated misconception without condescension|A confident claim rests on a category error.|¿Por qué no acepta el argumento?|Porque equipara correlación y causa, una premisa que los propios datos no permiten sostener.|Because it equates correlation and cause, a premise the data themselves do not support.|¿Lo considera absurdo?|No; lo considero verosímil, pero metodológicamente insostenible.
Orchestrate a keynote|Speaking|use pacing, emphasis, callback, and rhetorical arc|You close a high-stakes conference talk.|¿Con qué idea quiere que nos quedemos?|Con una muy sencilla: innovar no consiste en adivinar el futuro, sino en hacerlo habitable.|With a simple idea: innovation is not about guessing the future, but making it livable.|¿Y el principal obstáculo?|Creer, a sabiendas de su complejidad, que una solución aislada bastará.
Reach mastery|Checkpoint|operate with nuance across any demanding context|An examiner asks whether mastery has an endpoint.|¿Se termina alguna vez de aprender una lengua?|Difícilmente: dominarla no es agotarla, sino disponer de recursos para seguir descubriéndola.|Hardly: mastering it is not exhausting it, but having the resources to keep discovering it.|¿Qué demuestra entonces un C2?|Una flexibilidad extraordinaria, no una perfección absoluta.`,
};

function parseMissions(level: LevelId, source: string): Mission[] {
  return source.trim().split("\n").map((row, index) => {
    const [title, domain, canDo, situation, opener, model, translation, followUp, closing] = row.split("|");
    return { id: `${level}-m${index + 1}`, level, title, domain, canDo, situation, opener, model, translation, followUp, closing };
  });
}

export const missionsByLevel = Object.fromEntries(levelOrder.map((level) => [level, parseMissions(level, missionSource[level])])) as Record<LevelId, Mission[]>;
export const allMissions = levelOrder.flatMap((level) => missionsByLevel[level]);

export const soundLessons: SoundLesson[] = [
  { id: "A1-s1", level: "A1", title: "Five steady vowels", focus: "a · e · i · o · u", examples: ["casa", "mesa", "vino", "como", "luna"], tip: "Spanish vowels stay short and stable; avoid the English glide in ‘day’ or ‘go’." },
  { id: "A1-s2", level: "A1", title: "Syllables and written stress", focus: "CA-sa · ho-TEL · can-CIÓN", examples: ["casa", "hotel", "estación", "música"], tip: "If a word breaks the normal stress rule, the written accent marks the stressed vowel." },
  { id: "A2-s1", level: "A2", title: "Tapped r and trilled rr", focus: "pero ≠ perro", examples: ["pero", "perro", "caro", "carro"], tip: "Use one quick tongue tap for r between vowels; rr holds repeated contact." },
  { id: "A2-s2", level: "A2", title: "Clear stops and fricatives", focus: "b/v · d · g", examples: ["beber", "cada día", "amigo"], tip: "Between vowels, b/v, d, and g often soften; do not force a strong English stop." },
  { id: "B1-s1", level: "B1", title: "Linking across words", focus: "las‿amigas · un‿hotel", examples: ["las amigas", "un hotel", "vamos a entrar"], tip: "Spanish speech flows syllable to syllable; word boundaries do not create automatic pauses." },
  { id: "B1-s2", level: "B1", title: "Question and statement melody", focus: "¿Vienes? · Vienes.", examples: ["¿Vienes mañana?", "Vienes mañana.", "¿Qué prefieres?"], tip: "Prominence and the final contour signal intent; content questions often behave differently from yes/no questions." },
  { id: "B2-s1", level: "B2", title: "Rhythmic grouping", focus: "thought groups, not word-by-word speech", examples: ["A mi modo de ver, / conviene esperar.", "Si fuera posible, / lo cambiaría."], tip: "Group meaning into short units and place one clear prominence in each group." },
  { id: "B2-s2", level: "B2", title: "Regional listening range", focus: "s, ll/y, and final consonants", examples: ["ellos llegaron", "estás aquí", "las dos"], tip: "Train recognition across varieties; you do not need to imitate every regional feature." },
  { id: "C1-s1", level: "C1", title: "Prosody for stance", focus: "certainty · tact · contrast", examples: ["No cuestiono el objetivo; cuestiono el método.", "Quizá convendría revisarlo."], tip: "A shifted prominence can change what you correct, concede, or soften." },
  { id: "C1-s2", level: "C1", title: "Controlled reduction", focus: "natural speed without lost structure", examples: ["dicho de otro modo", "por lo que respecta a", "a raíz de"], tip: "Increase speed by linking predictable chunks, not by swallowing every vowel." },
  { id: "C2-s1", level: "C2", title: "Micro-register in voice", focus: "plain · formal · ironic", examples: ["Nos equivocamos.", "Se detectaron deficiencias.", "Qué oportuno."], tip: "Tempo, pitch range, and prominence help the listener infer register and implied attitude." },
  { id: "C2-s2", level: "C2", title: "Long-form delivery", focus: "paragraph-level arc", examples: ["planteamiento", "desarrollo", "matiz", "cierre"], tip: "Plan peaks and pauses across the whole contribution, not just inside isolated sentences." },
];

export const curriculumTotals = {
  levels: levelOrder.length,
  missions: allMissions.length,
  guidedSessions: allMissions.length * 3,
  lexicon: allLexicon.length,
  grammar: allGrammar.length,
  soundLessons: soundLessons.length,
};

export function levelIndex(level: LevelId) { return levelOrder.indexOf(level); }
export function cumulativeLexicon(level: LevelId) { return allLexicon.filter((item) => levelIndex(item.level) <= levelIndex(level)); }
export function cumulativeGrammar(level: LevelId) { return allGrammar.filter((item) => levelIndex(item.level) <= levelIndex(level)); }
export function levelSoundLessons(level: LevelId) { return soundLessons.filter((item) => item.level === level); }

