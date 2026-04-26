# Copilot Instructions for Dandylow

## Project Summary
Dandylow is a browser-based sight-reading trainer inspired by the Dandelot method.

The app is intentionally lightweight:
- Single-page app with no framework
- Main logic in `src/index.js`
- UI markup in `src/index.html`
- Styling in `src/styles.css`
- Bundled with Parcel

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
- Bass mode: E2 to E4 (existing distribution map in code)
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
- Candidate note is matched by cents tolerance against note frequency table
- Enharmonics are collapsed to natural notes (sharp stripped)

### Stability and Anti-False-Trigger Logic
Pitch detection is stateful and should remain stateful.

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
- Old media tracks and graph nodes are cleaned up before restart
- Recovery runs on focus, visibility change, and pageshow
- Recovery can also trigger on user gesture (pointer/keyboard)
- Track-ended events trigger reconnect attempts

When changing mic code:
- Avoid leaving dangling MediaStream tracks
- Avoid multiple simultaneous requestAnimationFrame loops
- Avoid duplicate analyser/source chains
- Keep status text accurate during reconnect states

## File Ownership and Responsibilities
- `src/index.js`: Application state, event wiring, note generation, audio pipeline, scoring, VexFlow rendering
- `src/index.html`: Controls, score UI, staff container, pitch/volume UI, keyboard UI
- `src/styles.css`: Visual design and layout
- `README.md`: Product-level documentation and setup

## Development Commands
Use npm.

- `npm run dev`: start local development server
- `npm run build`: production build validation
- `npm run clean`: remove dist and Parcel cache

## Change Guidelines

### Preserve Behavior Unless Requested
- Keep level definitions stable
- Keep clef/range mappings stable unless explicitly changed
- Keep natural-note matching behavior for answer checking

### Keep Edits Focused
- Prefer minimal targeted edits
- Do not refactor unrelated sections during feature work
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
- No framework migration unless explicitly requested

## If You Add New Features
Update all of the following together:
1. UI controls in `src/index.html` (if applicable)
2. Runtime logic in `src/index.js`
3. Documentation in `README.md`
4. This instructions file when behavior conventions or architecture evolve
