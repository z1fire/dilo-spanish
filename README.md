# Dilo

Dilo is a speaking-first Spanish learning app that runs from CEFR A1 through C2. It mirrors the learning discipline of the companion Mandarin app while replacing character and tone work with Spanish-specific conjugation, agreement, pronunciation, rhythm, register, and discourse practice.

## Learning loop

Every guided learning day follows the same complete loop:

1. Cards introduce a small lexical set without scoring it.
2. Recall uses think, reveal, and honest self-grading from meaning or audio.
3. Grammar teaches one form-meaning system and rebuilds an example.
4. Listening checks meaning before a no-typing missing-phrase challenge.
5. Build reconstructs the day’s mission line.
6. Read places that line in a four-turn exchange.
7. Speak requires all four lines, using browser speech recognition or an explicit manual fallback.

Objective misses enter a correction queue. A correction must be retrieved correctly now and on a later learning day. Unfinished sessions resume at the exact step, missed calendar days do not create a backlog, and one bonus learning day is available after the main session.

## Course shape

- Six levels: A1, A2, B1, B2, C1, C2
- 72 real-world missions, each revisited across three phases
- 216 minimum guided sessions before the rotating fluency loops
- 216 curated lexical chunks and 72 grammar systems
- Spanish sound and rhythm labs from stable vowels and stress to advanced prosody
- Forty-question timed checkpoints: 20 listening and 20 reading/usage
- Five graduation gates: lexical coverage, grammar coverage, missions, clear corrections, and an 80% checkpoint

B2 is labeled the conversational-fluency threshold; C1 is advanced fluency and C2 is mastery. The app explicitly asks learners to add increasing amounts of real conversation and extensive input at every level.

## Releases

- The Sites release uses private account-bound D1 progress sync with optimistic conflict recovery.
- The GitHub Pages release is repository-path-safe and stores progress on the current device.
- Both releases include the same curriculum, learning engine, PWA shell, import/export, and progress migration from the original A1 app.

## Development

```bash
npm install
npm run dev
npm test
npm run lint
```

`npm test` builds both the Sites and GitHub Pages variants and checks the rendered app shell.
