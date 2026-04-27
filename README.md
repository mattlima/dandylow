# Dandylow

Dandylow is a browser-based sight-reading trainer inspired by the Dandelot method.

It is designed for fast, repeated note recognition with immediate feedback and a progression system that adapts to each learner profile.

## What It Does

### Progressive Levels (1-7)

The app uses 7 fixed pitch-class levels:

- Level 1: C
- Level 2: C, G
- Level 3: C, G, F
- Level 4: C, G, F, D
- Level 5: C, G, F, D, A
- Level 6: C, G, F, D, A, E
- Level 7: C, G, F, D, A, E, B

### Clefs and Ranges

- Treble: C4 to C6
- Bass: E2 to E4
- Grand staff: C2 to C6

Grand staff rendering draws both staves and routes each note to bass or treble by octave.

### Sequence-Based Practice

- Practice is sequence-based (default 10 notes, adjustable from 4 to 30)
- Each note is marked as pending, correct, or incorrect
- One attempt is allowed per note for both input modes
- Sequence completion requires explicit action with Next Sequence

### Input Modes

1. Microphone mode
- Real-time pitch detection using Web Audio + Pitchy
- Octave-specific answer matching (for example C4 must match C4)
- Detection guardrails: clarity threshold, volume threshold, stability window, trigger cooldown, silence gate

2. Keyboard mode
- On-screen piano keyboard fallback
- Pitch-class matching (for example C)

### Progress and Profiles

- Multiple local profiles
- Persisted preferences per profile: level, clef, input mode, sensitivity, sequence length
- Persisted per-pitch stats keyed by scientific pitch (presentations, correct, incorrect, streak)
- Clef-specific progression gate based on minimum presentations and minimum consecutive streak

## Tech Stack

- Vue 3 + TypeScript
- Vite
- Pinia
- VexFlow
- Pitchy
- Sass

## Project Structure

- [src/main.ts](src/main.ts): Vue bootstrap, Pinia setup, score-to-profile stat sync
- [src/App.vue](src/App.vue): Root screen flow and composition
- [src/constants.ts](src/constants.ts): Levels, ranges, detection/progression configs, shared types
- [src/stores/game.ts](src/stores/game.ts): Session, sequence, scoring, feedback state
- [src/stores/audio.ts](src/stores/audio.ts): Mic UI + pitch stability state
- [src/stores/profiles.ts](src/stores/profiles.ts): Persistence schema, profile stats, migrations
- [src/audio/microphone.ts](src/audio/microphone.ts): Mic lifecycle and recovery
- [src/audio/pitchDetection.ts](src/audio/pitchDetection.ts): Detection loop and silence-gated flow
- [src/game/noteGenerator.ts](src/game/noteGenerator.ts): Weighted sequence generation
- [src/game/scoring.ts](src/game/scoring.ts): Answer checks and progression gate trigger
- [src/ui/render.ts](src/ui/render.ts): Staff rendering (treble, bass, grand)

## Development

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
npm install
```

### Commands

```bash
npm run dev
npm run build
npm run preview
npm run clean
```

Optional deploy helper:

```bash
npm run s3
```

## Verification Checklist

After gameplay, state, or UI changes:

1. Run npm run build
2. Confirm keyboard flow still enforces one attempt per note
3. Confirm microphone flow advances only after silence gate (correct and incorrect)
4. Confirm sequence completion still requires Next Sequence
5. Confirm profile data and pitch stats persist across reload

## Browser Notes

Microphone mode requires browser permission and a browser with Web Audio and MediaDevices support.

## License

MIT
