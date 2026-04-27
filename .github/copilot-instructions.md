# Copilot Instructions for Dandylow

## Project Summary
Dandylow is a browser-based sight-reading trainer inspired by the Dandelot method.

Current stack:
- Vue 3 + TypeScript
- Vite build tooling
- Pinia for app state
- VexFlow for notation rendering
- Pitchy + Web Audio API for microphone pitch detection

Primary goals:
- Fast note-recognition practice for young learners
- Immediate feedback and progression tracking
- Reliable microphone pitch detection with keyboard fallback

## Current Feature Set

### Learning Progression
- 7 fixed levels of pitch classes (C only up to C D E F G A B)
- Progression is evaluated per clef using persisted per-pitch stats (`presentations`, `correct`, `incorrect`, `streak`)
- Level completion gate (`PROGRESSION_CONFIG`): minimum presentations plus consecutive-correct streak for every pitch in range

### Sequence-Based Sessions
- Gameplay is sequence-based, not single-note-based
- Default sequence length is 10 (user-adjustable 4 to 30)
- Each sequence note tracks status: `pending`, `correct`, or `incorrect`
- One attempt per note in both keyboard and microphone modes
- Sequence completion requires explicit user action (`Next Sequence`)

### Clefs and Ranges
- Treble mode: C4 to C6
- Bass mode: E2 to E4
- Grand staff mode: C2 to C6
- Grand staff rendering draws both staves with brace/left connector and routes each note to bass or treble staff by octave

### Input Modes
- Microphone mode with real-time pitch detection
- Keyboard mode via on-screen piano keys
- Microphone answer checking is octave-specific scientific notation (for example `C4`)
- Keyboard answer checking uses pitch class only (for example `C`)

### Scoring and Profiles
- Score, accuracy, and streak tracking
- Success/failure feedback banners
- Profile-based persistence in localStorage
- Persisted preferences include: level, clef, input mode, sensitivity level, sequence length

## Audio and Pitch Detection Design

### Detection Pipeline
- RMS volume is calculated every frame
- Pitch is estimated by Pitchy
- Detection targets are pre-built from all range notes (`buildDetectionTargets` in `src/audio/noteFrequency.ts`)
- Frequencies are computed from semitone math, not a hardcoded table

### Stability and Anti-False-Trigger Logic
Pitch detection is stateful and must remain stateful. Thresholds live in `DETECTION_CONFIG` in `src/constants.ts`.

Current guardrails:
- Minimum clarity threshold
- Minimum volume threshold
- Required continuous stable duration before triggering an answer
- Maximum frame gap allowed for the same stability candidate
- Cooldown between answer triggers
- Silence gate after microphone-triggered attempts

Important behavior:
- In microphone mode, both correct and incorrect attempts set `waitingForSilence`
- Advancing to the next note happens only after required silence is detected
- While waiting for silence, no new pitch answers may trigger

### Microphone Lifecycle Reliability
The app includes defensive recovery for common browser/Web Audio lifecycle issues.

Current expectations:
- Startup uses explicit reconnect path when microphone mode is active
- `AudioContext` is resumed if suspended
- Old tracks and graph nodes are cleaned before restart (`cleanupMicrophoneResources`)
- Recovery runs on visibility/focus/pageshow and user gesture (pointer/keyboard)
- Track-ended events trigger reconnect attempts

When changing mic code:
- Avoid dangling `MediaStream` tracks
- Avoid multiple simultaneous `requestAnimationFrame` loops
- Avoid duplicate analyser/source chains
- Keep status text accurate during reconnect states

## Architecture and File Ownership

```
src/
  main.ts               App bootstrap (Vue + Pinia), persisted profile load, score->profile stat sync
  App.vue               Root screen routing and shell composition (entry, clef-select, game)
  constants.ts          LEVEL_NOTES, range maps, DETECTION_CONFIG, progression/note selection config, shared types
  styles.scss           Global styling

  stores/
    game.ts             Session state, sequence state, scoring state, feedback, progression gate flags
    audio.ts            Microphone UI state, volume/pitch stability state, runtime thresholds
    profiles.ts         Profile persistence, preferences, aggregate stats, per-pitch stats, schema migration

  audio/
    audioGraph.ts       Non-reactive Web Audio object container
    microphone.ts       Mic lifecycle: start, stop, cleanup, ensureMicrophoneActive, track-ended recovery
    pitchDetection.ts   requestAnimationFrame loop, RMS volume, stability gating, silence gate, answer trigger
    noteFrequency.ts    Frequency math, detection target build, scientific/VexFlow conversion helpers

  game/
    noteGenerator.ts    Weighted sequence generation by level/clef and per-pitch mastery stats
    scoring.ts          checkKeyboardAnswer, checkMicrophoneAnswer, session reset, pitch stat recording
    progression.ts      isLevelComplete, nextUnlockedLevel, levelAccuracy

  composables/
    useMicrophone.ts    Lifecycle recovery hooks for microphone mode
    useNoteSession.ts   Sequence actions (`nextSequence`, `resetSession`)

  components/
    EntryScreen.vue, ClefSelectScreen.vue, SettingsPanel.vue, ControlsPanel.vue,
    StaffView.vue, KeyboardPanel.vue, PitchPanel.vue, ScoreBoard.vue,
    FeedbackBanner.vue, SessionActions.vue, LevelUpModal.vue

  ui/
    render.ts           VexFlow rendering for treble, bass, and grand staff sequence notes
```

## Development Commands
Use npm.

- `npm run dev`: start local development server
- `npm run build`: type-check and production build validation
- `npm run preview`: preview production build
- `npm run clean`: remove `dist` and `.vite`

## Change Guidelines

### Preserve Behavior Unless Requested
- Keep level definitions and clef/range mappings stable unless explicitly changed
- Keep microphone answer matching octave-specific; do not regress to pitch-class-only mic matching
- Keep `DETECTION_CONFIG` as the single source of truth for detection thresholds
- Keep one-attempt-per-note behavior in both input modes
- Keep explicit `Next Sequence` flow on sequence completion

### Keep Edits Focused
- Prefer minimal targeted edits
- Do not refactor unrelated modules during feature work
- Keep comments brief and only where logic is non-obvious

### Verify After Changes
For logic/UI changes, run at least:
1. `npm run build`

For microphone or pitch-detection changes, also verify manually:
1. Initial page load in microphone mode
2. Hard refresh behavior
3. Tab switch away and back
4. Window blur/focus
5. Correct and incorrect microphone attempts both require silence before advance
6. Keyboard mode remains unaffected

For sequence/progression changes, also verify manually:
1. One attempt per note is enforced
2. Staff note colors update per-note status
3. Sequence completion requires explicit `Next Sequence`
4. Level-up modal appears only when progression gate conditions are met

## Known Non-Goals
- No backend/server state
- No user authentication
- No cloud persistence (localStorage only)

## If You Add New Features
Update all relevant areas together:
1. Vue UI components under `src/components/` (if applicable)
2. Logic in relevant modules under `src/audio`, `src/game`, `src/stores`, or `src/composables`
3. Types/constants in `src/constants.ts` and/or store interfaces when state shape changes
4. Documentation in `README.md`
5. This instructions file when conventions or architecture evolve
