# Copilot Instructions for Dandylow

## Project Summary
Dandylow is a browser-based sight-reading trainer inspired by the Dandelot method.

The app is intentionally lightweight:
- Single-page app with no framework
- Written in **TypeScript**, bundled with Parcel
- Modular source layout under `src/` (see File Ownership below)
- UI markup in `src/index.html`
- Styling in `src/styles.css`

Primary goals:
- Fast note-recognition practice for young learners
- Immediate feedback and progress tracking
- Reliable microphone pitch detection with keyboard fallback

## Current Feature Set

### Learning Progression
- 7 fixed levels of note classes (C only up to all naturals C D E F G A B)
- Random note generation constrained by selected level and clef

### Clefs and Ranges
- Treble mode: C4 to C6
- Bass mode: E2 to E4
- Grand staff mode: C2 to C6
- Grand staff rendering draws both staves with brace/left connector and routes each note to bass or treble staff by octave

### Input Modes
- Microphone mode with real-time pitch detection
- Keyboard mode via on-screen piano keys

### Scoring UX
- Score, accuracy, and streak tracking
- Success/failure feedback messages
- Next note and reset session controls

## Audio and Pitch Detection Design

### Detection Pipeline
- RMS volume is calculated each frame
- Pitch is estimated with Pitchy
- Detection targets are pre-built from all note ranges at startup (`buildDetectionTargets` in `src/audio/noteFrequency.ts`)
- Frequencies are computed from semitone math, not a hardcoded lookup table
- Microphone answer checking uses **octave-specific** scientific notation (e.g. `C4`, `G3`) via `checkMicrophoneAnswer`
- Keyboard answer checking uses note class only (e.g. `C`, `G`) via `checkKeyboardAnswer`

### Stability and Anti-False-Trigger Logic
Pitch detection is stateful and must remain stateful. All thresholds live in `DETECTION_CONFIG` in `src/constants.ts`.

Current guardrails:
- Minimum clarity threshold
- Minimum volume threshold
- Required continuous stable duration before triggering an answer
- Maximum frame gap allowed for the same stability candidate
- Cooldown between answer triggers
- Silence gate after microphone-triggered attempt

Important behavior:
- In microphone mode, only advance to the next note after a correct answer and return to silence
- Wrong attempts also require a brief return to silence before accepting a new trigger

### Microphone Lifecycle Reliability
The app includes defensive recovery for common Chrome/Web Audio lifecycle issues.

Current expectations:
- Startup uses explicit reconnect path when microphone mode is active
- AudioContext is resumed if suspended
- Old media tracks and graph nodes are cleaned up before restart (`cleanupMicrophoneResources`)
- Recovery runs on focus, visibility change, and pageshow
- Recovery can also trigger on user gesture (pointer/keyboard)
- Track-ended events trigger reconnect attempts

When changing mic code:
- Avoid leaving dangling MediaStream tracks
- Avoid multiple simultaneous requestAnimationFrame loops
- Avoid duplicate analyser/source chains
- Keep status text accurate during reconnect states

## File Ownership and Responsibilities

```
src/
  index.ts              Entry point: init, event wiring, input mode switching
  index.html            Controls, score UI, staff container, pitch/volume UI, keyboard UI
  styles.css            Visual design and layout
  state.ts              AppState interface, shared mutable state object, pitch stability helpers
  constants.ts          LEVEL_NOTES, note range maps (TREBLE/BASS/GRAND), DETECTION_CONFIG, types

  audio/
    microphone.ts       Mic lifecycle: start, stop, cleanup, ensureMicrophoneActive, track-ended recovery
    pitchDetection.ts   requestAnimationFrame loop, RMS volume, stability gating, answer triggering
    noteFrequency.ts    buildDetectionTargets, scientificNoteToFrequency, detectNaturalNoteWithOctave

  game/
    noteGenerator.ts    generateNewNote: picks random note constrained by level and clef
    scoring.ts          checkKeyboardAnswer, checkMicrophoneAnswer, applyAnswerResult, score display, resetSession

  ui/
    elements.ts         Typed DOM element references
    render.ts           renderStaff: VexFlow rendering for treble, bass, and grand staff
    keyboard.ts         On-screen piano keyboard event wiring
```

## Development Commands
Use npm.

- `npm run dev`: start local development server
- `npm run build`: production build validation
- `npm run clean`: remove dist and Parcel cache

## Change Guidelines

### Preserve Behavior Unless Requested
- Keep level definitions stable
- Keep clef/range mappings stable unless explicitly changed
- Keep octave-specific microphone matching; do not regress to note-class-only matching for mic input
- Keep `DETECTION_CONFIG` as the single source of truth for all detection thresholds

### Keep Edits Focused
- Prefer minimal targeted edits
- Do not refactor unrelated modules during feature work
- Keep comments brief and only where logic is non-obvious

### Verify After Changes
For logic/UI changes, run at least:
1. `npm run build`

For microphone changes, also verify manually:
1. Initial page load in microphone mode
2. Hard refresh behavior
3. Tab switch away and back
4. Window blur/focus
5. Wrong-note and correct-note flows in microphone mode
6. Keyboard mode unaffected

## Known Non-Goals
- No backend/server state
- No user authentication
- No persistence layer for scores

## If You Add New Features
Update all of the following together:
1. UI controls in `src/index.html` (if applicable)
2. Logic in the relevant module(s) under `src/`
3. Types/constants in `src/constants.ts` or `src/state.ts` if state shape changes
4. Documentation in `README.md`
5. This instructions file when behavior conventions or architecture evolve
