export type Word = {
  word: string;
  meaning: string;
  note?: string;
  unit: number;
};

export type Pattern = {
  pattern: string;
  meaning: string;
  example: string;
  translation: string;
  unit: number;
};

export type DialogueLine = {
  speaker: "A" | "B";
  line: string;
  translation: string;
};

export type CourseUnit = {
  id: number;
  stage: string;
  title: string;
  spanish: string;
  promise: string;
  situation: string;
  color: "clay" | "blue" | "olive" | "gold";
  dialogue: DialogueLine[];
  words: Word[];
  patterns: Pattern[];
};

const unit = (
  id: number,
  details: Omit<CourseUnit, "id">,
): CourseUnit => ({ id, ...details });

export const courseUnits: CourseUnit[] = [
  unit(1, {
    stage: "Primer contacto",
    title: "Meet someone new",
    spanish: "Mucho gusto",
    promise: "Say hello, introduce yourself, and keep a first exchange moving.",
    situation: "You arrive at a neighborhood gathering and meet Lucía.",
    color: "clay",
    dialogue: [
      { speaker: "A", line: "Hola, ¿cómo te llamas?", translation: "Hi, what’s your name?" },
      { speaker: "B", line: "Me llamo Alex. ¿Y tú?", translation: "My name is Alex. And you?" },
      { speaker: "A", line: "Soy Lucía. Mucho gusto.", translation: "I’m Lucía. Nice to meet you." },
      { speaker: "B", line: "Igualmente. Soy de Boston.", translation: "Likewise. I’m from Boston." },
    ],
    words: [
      { word: "hola", meaning: "hello", unit: 1 },
      { word: "buenos días", meaning: "good morning", unit: 1 },
      { word: "gracias", meaning: "thank you", unit: 1 },
      { word: "por favor", meaning: "please", unit: 1 },
      { word: "perdón", meaning: "excuse me / sorry", unit: 1 },
      { word: "nombre", meaning: "name", note: "el nombre", unit: 1 },
      { word: "también", meaning: "also / too", unit: 1 },
      { word: "encantado/a", meaning: "pleased to meet you", note: "match -o / -a to the speaker", unit: 1 },
    ],
    patterns: [
      { pattern: "Me llamo + nombre", meaning: "My name is…", example: "Me llamo Elena.", translation: "My name is Elena.", unit: 1 },
      { pattern: "Soy de + lugar", meaning: "I’m from…", example: "Soy de Nueva York.", translation: "I’m from New York.", unit: 1 },
    ],
  }),
  unit(2, {
    stage: "Café",
    title: "Order without pointing",
    spanish: "Un café, por favor",
    promise: "Ask for food and drinks, make a small change, and request the bill.",
    situation: "You stop at a busy café for breakfast.",
    color: "gold",
    dialogue: [
      { speaker: "A", line: "Buenos días. ¿Qué le pongo?", translation: "Good morning. What can I get you?" },
      { speaker: "B", line: "Quiero un café con leche y una tostada.", translation: "I’d like a coffee with milk and toast." },
      { speaker: "A", line: "¿Algo más?", translation: "Anything else?" },
      { speaker: "B", line: "Nada más, gracias. La cuenta, por favor.", translation: "Nothing else, thanks. The bill, please." },
    ],
    words: [
      { word: "agua", meaning: "water", note: "el agua", unit: 2 },
      { word: "café", meaning: "coffee", note: "el café", unit: 2 },
      { word: "pan", meaning: "bread", note: "el pan", unit: 2 },
      { word: "leche", meaning: "milk", note: "la leche", unit: 2 },
      { word: "menú", meaning: "menu", note: "el menú", unit: 2 },
      { word: "cuenta", meaning: "bill / check", note: "la cuenta", unit: 2 },
      { word: "con", meaning: "with", unit: 2 },
      { word: "sin", meaning: "without", unit: 2 },
    ],
    patterns: [
      { pattern: "Quiero + nombre", meaning: "I want / I’d like…", example: "Quiero una botella de agua.", translation: "I’d like a bottle of water.", unit: 2 },
      { pattern: "¿Me pone + nombre?", meaning: "Could I have…?", example: "¿Me pone un café solo?", translation: "Could I have a black coffee?", unit: 2 },
    ],
  }),
  unit(3, {
    stage: "Tu mundo",
    title: "Talk about your people",
    spanish: "Esta es mi familia",
    promise: "Describe home, family, work, and the people around you.",
    situation: "A new friend asks about your life back home.",
    color: "olive",
    dialogue: [
      { speaker: "A", line: "¿Vives aquí con tu familia?", translation: "Do you live here with your family?" },
      { speaker: "B", line: "No, vivo con una amiga.", translation: "No, I live with a friend." },
      { speaker: "A", line: "¿Cómo es tu piso?", translation: "What is your apartment like?" },
      { speaker: "B", line: "Es pequeño, pero hay mucha luz.", translation: "It’s small, but there’s lots of light." },
    ],
    words: [
      { word: "familia", meaning: "family", note: "la familia", unit: 3 },
      { word: "amigo/a", meaning: "friend", unit: 3 },
      { word: "casa", meaning: "house / home", note: "la casa", unit: 3 },
      { word: "trabajo", meaning: "work / job", note: "el trabajo", unit: 3 },
      { word: "ciudad", meaning: "city", note: "la ciudad", unit: 3 },
      { word: "grande", meaning: "big", unit: 3 },
      { word: "pequeño/a", meaning: "small", unit: 3 },
      { word: "vivir", meaning: "to live", unit: 3 },
    ],
    patterns: [
      { pattern: "Hay + nombre", meaning: "There is / there are…", example: "Hay dos habitaciones.", translation: "There are two rooms.", unit: 3 },
      { pattern: "mi / tu + nombre", meaning: "my / your…", example: "Mi hermana vive con su familia.", translation: "My sister lives with her family.", unit: 3 },
    ],
  }),
  unit(4, {
    stage: "La ciudad",
    title: "Find your way",
    spanish: "¿Dónde está?",
    promise: "Ask where something is and understand the directions that follow.",
    situation: "Your phone is dying and you need to find the station.",
    color: "blue",
    dialogue: [
      { speaker: "A", line: "Perdón, ¿dónde está la estación?", translation: "Excuse me, where is the station?" },
      { speaker: "B", line: "Sigue todo recto y gira a la derecha.", translation: "Go straight ahead and turn right." },
      { speaker: "A", line: "¿Está lejos?", translation: "Is it far?" },
      { speaker: "B", line: "No, está a cinco minutos.", translation: "No, it’s five minutes away." },
    ],
    words: [
      { word: "calle", meaning: "street", note: "la calle", unit: 4 },
      { word: "estación", meaning: "station", note: "la estación", unit: 4 },
      { word: "izquierda", meaning: "left", unit: 4 },
      { word: "derecha", meaning: "right", unit: 4 },
      { word: "recto", meaning: "straight ahead", unit: 4 },
      { word: "cerca", meaning: "near", unit: 4 },
      { word: "lejos", meaning: "far", unit: 4 },
      { word: "girar", meaning: "to turn", unit: 4 },
    ],
    patterns: [
      { pattern: "¿Dónde está + nombre?", meaning: "Where is…?", example: "¿Dónde está el museo?", translation: "Where is the museum?", unit: 4 },
      { pattern: "Tienes que + infinitivo", meaning: "You have to…", example: "Tienes que girar a la izquierda.", translation: "You have to turn left.", unit: 4 },
    ],
  }),
  unit(5, {
    stage: "Cada día",
    title: "Tell your daily story",
    spanish: "Así es mi día",
    promise: "Talk about your routine, schedules, and how often things happen.",
    situation: "You compare a normal weekday with a classmate.",
    color: "clay",
    dialogue: [
      { speaker: "A", line: "¿A qué hora empiezas a trabajar?", translation: "What time do you start work?" },
      { speaker: "B", line: "Empiezo a las nueve y termino a las cinco.", translation: "I start at nine and finish at five." },
      { speaker: "A", line: "¿Comes en casa?", translation: "Do you eat at home?" },
      { speaker: "B", line: "Normalmente como cerca del trabajo.", translation: "I normally eat near work." },
    ],
    words: [
      { word: "hoy", meaning: "today", unit: 5 },
      { word: "mañana", meaning: "morning / tomorrow", unit: 5 },
      { word: "tarde", meaning: "afternoon / late", unit: 5 },
      { word: "noche", meaning: "night", unit: 5 },
      { word: "siempre", meaning: "always", unit: 5 },
      { word: "nunca", meaning: "never", unit: 5 },
      { word: "empezar", meaning: "to begin", unit: 5 },
      { word: "terminar", meaning: "to finish", unit: 5 },
    ],
    patterns: [
      { pattern: "A las + hora", meaning: "At + time", example: "Ceno a las ocho.", translation: "I have dinner at eight.", unit: 5 },
      { pattern: "Normalmente + presente", meaning: "Normally I…", example: "Normalmente voy en autobús.", translation: "I normally go by bus.", unit: 5 },
    ],
  }),
  unit(6, {
    stage: "Tiempo libre",
    title: "Make a plan",
    spanish: "¿Te apetece?",
    promise: "Share what you like, invite someone out, and settle on a plan.",
    situation: "You’re deciding what to do this weekend.",
    color: "olive",
    dialogue: [
      { speaker: "A", line: "¿Te apetece ir al cine el sábado?", translation: "Do you feel like going to the movies Saturday?" },
      { speaker: "B", line: "Sí, me encanta el cine.", translation: "Yes, I love movies." },
      { speaker: "A", line: "¿Puedes a las siete?", translation: "Can you make it at seven?" },
      { speaker: "B", line: "Perfecto. Nos vemos allí.", translation: "Perfect. See you there." },
    ],
    words: [
      { word: "gustar", meaning: "to like", unit: 6 },
      { word: "encantar", meaning: "to love", unit: 6 },
      { word: "poder", meaning: "can / to be able to", unit: 6 },
      { word: "querer", meaning: "to want", unit: 6 },
      { word: "cine", meaning: "movie theater / movies", note: "el cine", unit: 6 },
      { word: "música", meaning: "music", note: "la música", unit: 6 },
      { word: "sábado", meaning: "Saturday", unit: 6 },
      { word: "juntos/as", meaning: "together", unit: 6 },
    ],
    patterns: [
      { pattern: "Me gusta + nombre / infinitivo", meaning: "I like…", example: "Me gusta bailar.", translation: "I like dancing.", unit: 6 },
      { pattern: "Voy a + infinitivo", meaning: "I’m going to…", example: "Voy a descansar el domingo.", translation: "I’m going to rest on Sunday.", unit: 6 },
    ],
  }),
  unit(7, {
    stage: "De viaje",
    title: "Handle the essentials",
    spanish: "Tengo una reserva",
    promise: "Check in, solve a simple travel problem, and ask for help clearly.",
    situation: "You arrive at your hotel after a long trip.",
    color: "gold",
    dialogue: [
      { speaker: "A", line: "Buenas tardes. Tengo una reserva a nombre de Lee.", translation: "Good afternoon. I have a reservation under Lee." },
      { speaker: "B", line: "Sí, una habitación para dos noches.", translation: "Yes, a room for two nights." },
      { speaker: "A", line: "Exacto. ¿A qué hora es el desayuno?", translation: "Exactly. What time is breakfast?" },
      { speaker: "B", line: "De siete a diez, en la planta baja.", translation: "From seven to ten, on the ground floor." },
    ],
    words: [
      { word: "reserva", meaning: "reservation", note: "la reserva", unit: 7 },
      { word: "habitación", meaning: "room", note: "la habitación", unit: 7 },
      { word: "billete", meaning: "ticket", note: "el billete", unit: 7 },
      { word: "aeropuerto", meaning: "airport", note: "el aeropuerto", unit: 7 },
      { word: "equipaje", meaning: "luggage", note: "el equipaje", unit: 7 },
      { word: "ayuda", meaning: "help", note: "la ayuda", unit: 7 },
      { word: "problema", meaning: "problem", note: "el problema", unit: 7 },
      { word: "desayuno", meaning: "breakfast", note: "el desayuno", unit: 7 },
    ],
    patterns: [
      { pattern: "Tengo + nombre", meaning: "I have…", example: "Tengo una reserva para esta noche.", translation: "I have a reservation for tonight.", unit: 7 },
      { pattern: "¿Puede + infinitivo?", meaning: "Can you…?", example: "¿Puede ayudarme?", translation: "Can you help me?", unit: 7 },
    ],
  }),
  unit(8, {
    stage: "Conversación real",
    title: "Stay in the conversation",
    spanish: "Cuéntame más",
    promise: "React naturally, connect ideas, and recover when you miss something.",
    situation: "A relaxed conversation moves beyond rehearsed questions.",
    color: "blue",
    dialogue: [
      { speaker: "A", line: "¿Qué te parece la ciudad?", translation: "What do you think of the city?" },
      { speaker: "B", line: "Me gusta mucho porque es tranquila.", translation: "I like it a lot because it’s peaceful." },
      { speaker: "A", line: "Sí, pero en verano hay mucha gente.", translation: "Yes, but in summer there are lots of people." },
      { speaker: "B", line: "¿Puedes repetirlo más despacio?", translation: "Can you repeat that more slowly?" },
    ],
    words: [
      { word: "porque", meaning: "because", unit: 8 },
      { word: "pero", meaning: "but", unit: 8 },
      { word: "quizás", meaning: "maybe", unit: 8 },
      { word: "claro", meaning: "of course / clear", unit: 8 },
      { word: "despacio", meaning: "slowly", unit: 8 },
      { word: "repetir", meaning: "to repeat", unit: 8 },
      { word: "pensar", meaning: "to think", unit: 8 },
      { word: "entender", meaning: "to understand", unit: 8 },
    ],
    patterns: [
      { pattern: "Creo que + frase", meaning: "I think that…", example: "Creo que es una buena idea.", translation: "I think it’s a good idea.", unit: 8 },
      { pattern: "¿Puedes repetir + ...?", meaning: "Can you repeat…?", example: "¿Puedes repetirlo más despacio?", translation: "Can you repeat that more slowly?", unit: 8 },
    ],
  }),
];

export const vocabulary = courseUnits.flatMap((item) => item.words);
export const patterns = courseUnits.flatMap((item) => item.patterns);

export const phrases = courseUnits.flatMap((item) =>
  item.dialogue.map((entry, index) => ({
    id: `${item.id}:${index}`,
    unit: item.id,
    situation: item.stage,
    spanish: entry.line,
    translation: entry.translation,
  })),
);

export const situationPrompts = [
  { scenario: "You want to ask someone’s name.", answer: "¿Cómo te llamas?", options: ["¿Cómo te llamas?", "¿Dónde vives?", "¿Qué te gusta?", "¿A qué hora llegas?"] },
  { scenario: "You want a coffee with milk.", answer: "Quiero un café con leche.", options: ["Quiero un café con leche.", "La cuenta está aquí.", "No tomo café nunca.", "El café está lejos."] },
  { scenario: "You need to find the station.", answer: "¿Dónde está la estación?", options: ["¿Dónde está la estación?", "¿Cuánto cuesta la estación?", "¿Cuándo abre la calle?", "¿Quién vive aquí?"] },
  { scenario: "You want to say you like dancing.", answer: "Me gusta bailar.", options: ["Me gusta bailar.", "Voy a bailar ayer.", "Tengo un baile.", "Soy de bailar."] },
  { scenario: "You have a hotel reservation.", answer: "Tengo una reserva.", options: ["Tengo una reserva.", "Hago una habitación.", "Soy una reserva.", "Hay mi equipaje."] },
  { scenario: "You need the speaker to slow down.", answer: "Más despacio, por favor.", options: ["Más despacio, por favor.", "Más tarde, quizás.", "Todo recto, gracias.", "Nada más, por favor."] },
  { scenario: "You want to ask for the bill.", answer: "La cuenta, por favor.", options: ["La cuenta, por favor.", "El menú es grande.", "Tengo una habitación.", "¿Dónde está la cuenta?"] },
  { scenario: "You want to say where you are from.", answer: "Soy de Boston.", options: ["Soy de Boston.", "Estoy Boston.", "Hay Boston.", "Me llamo de Boston."] },
  { scenario: "You want to invite someone to the movies.", answer: "¿Te apetece ir al cine?", options: ["¿Te apetece ir al cine?", "¿Tienes el cine?", "¿Eres del cine?", "¿Dónde cine tú?"] },
  { scenario: "You did not understand.", answer: "No entiendo.", options: ["No entiendo.", "No termino.", "No encuentro.", "No empiezo."] },
] as const;

export const checkpointQuestions = [
  { prompt: "Choose the natural first greeting.", options: ["Hola, ¿qué tal?", "Cuenta, por favor.", "Gira a la derecha.", "Tengo una reserva."], answer: "Hola, ¿qué tal?", note: "Conversation", speech: "Hola, ¿qué tal?" },
  { prompt: "‘Me llamo Ana’ means…", options: ["My name is Ana.", "I’m calling Ana.", "Ana is at home.", "I’m from Ana."], answer: "My name is Ana.", note: "Meaning", speech: "Me llamo Ana." },
  { prompt: "Ask for water politely.", options: ["Agua, por favor.", "Soy de agua.", "Hay por favor.", "Agua a la derecha."], answer: "Agua, por favor.", note: "Café", speech: "Agua, por favor." },
  { prompt: "Choose the word for ‘bill / check’.", options: ["la cuenta", "la calle", "la casa", "la tarde"], answer: "la cuenta", note: "Vocabulary", speech: "la cuenta" },
  { prompt: "Complete: ___ dos habitaciones.", options: ["Hay", "Soy", "Estoy", "Voy"], answer: "Hay", note: "Grammar", speech: "Hay dos habitaciones." },
  { prompt: "‘¿Dónde está la estación?’ asks…", options: ["Where is the station?", "When does the station open?", "How much is the ticket?", "Is the station small?"], answer: "Where is the station?", note: "Meaning", speech: "¿Dónde está la estación?" },
  { prompt: "The opposite of ‘cerca’ is…", options: ["lejos", "recto", "tarde", "grande"], answer: "lejos", note: "Vocabulary", speech: "lejos" },
  { prompt: "Choose the natural time phrase.", options: ["a las nueve", "en las nueve", "de las nueve", "por las nueve"], answer: "a las nueve", note: "Grammar", speech: "Empiezo a las nueve." },
  { prompt: "‘Me gusta la música’ means…", options: ["I like music.", "I make music.", "Music is far away.", "I need music."], answer: "I like music.", note: "Meaning", speech: "Me gusta la música." },
  { prompt: "Make a near-future plan.", options: ["Voy a descansar.", "Soy descansar.", "Tengo descansar.", "Hay descansar."], answer: "Voy a descansar.", note: "Grammar", speech: "Voy a descansar." },
  { prompt: "At a hotel, say you have a reservation.", options: ["Tengo una reserva.", "Quiero una calle.", "Soy una habitación.", "Hay un equipaje."], answer: "Tengo una reserva.", note: "Travel", speech: "Tengo una reserva." },
  { prompt: "Ask someone to help you.", options: ["¿Puede ayudarme?", "¿Ayuda dónde?", "¿Me ayuda de?", "¿Soy ayuda?"], answer: "¿Puede ayudarme?", note: "Travel", speech: "¿Puede ayudarme?" },
  { prompt: "Connect a reason with…", options: ["porque", "pero", "quizás", "nunca"], answer: "porque", note: "Grammar", speech: "Me gusta porque es tranquila." },
  { prompt: "Ask for repetition.", options: ["¿Puedes repetirlo?", "¿Puedes terminarlo?", "¿Quieres vivirlo?", "¿Tienes que girar?"], answer: "¿Puedes repetirlo?", note: "Conversation", speech: "¿Puedes repetirlo?" },
  { prompt: "‘Nos vemos allí’ means…", options: ["See you there.", "We live there.", "Let’s look here.", "They are over there."], answer: "See you there.", note: "Conversation", speech: "Nos vemos allí." },
  { prompt: "Choose the best recovery phrase.", options: ["No entiendo. Más despacio, por favor.", "Soy no español.", "No gusta hablar.", "Tengo despacio."], answer: "No entiendo. Más despacio, por favor.", note: "Conversation", speech: "No entiendo. Más despacio, por favor." },
] as const;

export const curriculumTotals = {
  units: courseUnits.length,
  words: vocabulary.length,
  patterns: patterns.length,
  phrases: phrases.length,
};
