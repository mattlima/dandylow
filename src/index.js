import { Renderer, Stave, StaveNote, Voice, Formatter, Accidental, StaveConnector } from 'vexflow';
import { PitchDetector } from 'pitchy';

// Constants
const PITCH_CLASSES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const LEVEL_NOTES = {
  1: ['C'],
  2: ['C', 'G'],
  3: ['C', 'G', 'F'],
  4: ['C', 'G', 'F', 'D'],
  5: ['C', 'G', 'F', 'D', 'A'],
  6: ['C', 'G', 'F', 'D', 'A', 'E'],
  7: ['C', 'G', 'F', 'D', 'A', 'E', 'B']
};

// Treble clef note ranges (C4 to C6)
const TREBLE_NOTES = {
  'C': ['C/4', 'C/5'],
  'D': ['D/4', 'D/5'],
  'E': ['E/4', 'E/5'],
  'F': ['F/4', 'F/5'],
  'G': ['G/4', 'G/5'],
  'A': ['A/4', 'A/5'],
  'B': ['B/4', 'B/5']
};

// Bass clef note ranges (E2 to E4)
const BASS_NOTES = {
  'C': ['C/3', 'C/4'],
  'D': ['D/2', 'D/3'],
  'E': ['E/2', 'E/3'],
  'F': ['F/2', 'F/3'],
  'G': ['G/2', 'G/3'],
  'A': ['A/2', 'A/3'],
  'B': ['B/2', 'B/3']
};

// Grand staff note ranges (C2 to C6)
const GRAND_NOTES = {
  'C': ['C/2', 'C/3', 'C/4', 'C/5', 'C/6'],
  'D': ['D/2', 'D/3', 'D/4', 'D/5'],
  'E': ['E/2', 'E/3', 'E/4', 'E/5'],
  'F': ['F/2', 'F/3', 'F/4', 'F/5'],
  'G': ['G/2', 'G/3', 'G/4', 'G/5'],
  'A': ['A/2', 'A/3', 'A/4', 'A/5'],
  'B': ['B/2', 'B/3', 'B/4', 'B/5']
};

const DETECTION_CONFIG = {
  minClarity: 0.9,
  minVolume: 0.03,
  requiredStableMs: 180,
  maxFrameGapMs: 100,
  triggerCooldownMs: 250,
  centsTolerance: 30
};

const DETECTION_TARGETS = buildDetectionTargets();

// Application state
const state = {
  level: 1,
  clef: 'treble',
  inputMode: 'microphone',
  currentNote: null,
  currentNoteClass: null,
  currentNoteScientific: null,
  score: { correct: 0, total: 0 },
  streak: 0,
  audioContext: null,
  micStream: null,
  micSource: null,
  analyser: null,
  detector: null,
  isListening: false,
  isRestartingMic: false,
  animationFrameId: null,
  waitingForSilence: false,
  advanceOnSilence: false,
  pitchStability: {
    note: null,
    firstSeenAt: 0,
    lastSeenAt: 0,
    lastTriggeredAt: 0
  }
};

// DOM Elements
const elements = {
  levelSelect: document.getElementById('level-select'),
  clefSelect: document.getElementById('clef-select'),
  micModeBtn: document.getElementById('mic-mode-btn'),
  keyboardModeBtn: document.getElementById('keyboard-mode-btn'),
  staffContainer: document.getElementById('staff-container'),
  feedback: document.getElementById('feedback'),
  micStatus: document.getElementById('mic-status'),
  detectedPitch: document.getElementById('detected-pitch'),
  volumeBar: document.getElementById('volume-bar'),
  volumeLevel: document.getElementById('volume-level'),
  keyboardContainer: document.getElementById('keyboard-container'),
  pianoKeyboard: document.getElementById('piano-keyboard'),
  nextBtn: document.getElementById('next-btn'),
  resetBtn: document.getElementById('reset-btn'),
  score: document.getElementById('score'),
  accuracy: document.getElementById('accuracy'),
  streak: document.getElementById('streak')
};

// Initialize the application
async function init() {
  setupEventListeners();
  generateNewNote();
  updateScoreDisplay();

  // Auto-start microphone if in microphone mode
  if (state.inputMode === 'microphone') {
    elements.micStatus.textContent = '🎤 Connecting microphone...';
    await ensureMicrophoneActive();
  }
}

// Setup event listeners
function setupEventListeners() {
  elements.levelSelect.addEventListener('change', (e) => {
    state.level = parseInt(e.target.value);
    generateNewNote();
  });

  elements.clefSelect.addEventListener('change', (e) => {
    state.clef = e.target.value;
    generateNewNote();
  });

  elements.micModeBtn.addEventListener('click', () => {
    switchInputMode('microphone');
  });

  elements.keyboardModeBtn.addEventListener('click', () => {
    switchInputMode('keyboard');
  });

  elements.nextBtn.addEventListener('click', () => {
    generateNewNote();
  });

  elements.resetBtn.addEventListener('click', () => {
    resetSession();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      ensureMicrophoneActive();
    }
  });

  window.addEventListener('focus', () => {
    ensureMicrophoneActive();
  });

  window.addEventListener('pageshow', () => {
    ensureMicrophoneActive();
  });

  // Some Chrome audio setups only fully initialize after a user gesture.
  const recoverOnGesture = () => {
    ensureMicrophoneActive();
  };
  window.addEventListener('pointerdown', recoverOnGesture, { passive: true });
  window.addEventListener('keydown', recoverOnGesture);

  // Piano keyboard event listeners
  elements.pianoKeyboard.querySelectorAll('.key').forEach(key => {
    key.addEventListener('click', () => {
      const note = key.dataset.note;
      handleKeyboardInput(note);
    });
  });
}

// Switch input mode
async function switchInputMode(mode) {
  state.inputMode = mode;

  elements.micModeBtn.classList.toggle('active', mode === 'microphone');
  elements.keyboardModeBtn.classList.toggle('active', mode === 'keyboard');

  if (mode === 'microphone') {
    elements.keyboardContainer.classList.add('hidden');
    await startPitchDetection();
  } else {
    elements.keyboardContainer.classList.remove('hidden');
    stopPitchDetection();
  }
}

// Start pitch detection
async function startPitchDetection() {
  try {
    if (state.isRestartingMic) return;
    state.isRestartingMic = true;

    console.log('Starting pitch detection...');
    elements.micStatus.textContent = '🎤 Connecting microphone...';

    state.isListening = false;
    cleanupMicrophoneResources({ stopTracks: true });

    if (!state.audioContext) {
      state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      console.log('Audio context created');
    }

    if (state.audioContext.state === 'suspended') {
      await state.audioContext.resume();
      console.log('Audio context resumed');
    }

    console.log('Requesting microphone access...');
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      }
    });
    console.log('Microphone access granted');

    state.micStream = stream;
    const [track] = stream.getAudioTracks();
    if (track) {
      track.onended = () => {
        if (state.inputMode === 'microphone') {
          elements.micStatus.textContent = '🎤 Reconnecting microphone...';
          state.isListening = false;
          ensureMicrophoneActive();
        }
      };
    }

    const source = state.audioContext.createMediaStreamSource(stream);
    state.micSource = source;

    state.analyser = state.audioContext.createAnalyser();
    state.analyser.fftSize = 2048;
    source.connect(state.analyser);
    console.log('Audio analyser connected');

    const bufferLength = state.analyser.fftSize;
    const buffer = new Float32Array(bufferLength);

    state.detector = PitchDetector.forFloat32Array(bufferLength);
    state.isListening = true;
    resetPitchStability();
    console.log('Pitch detector initialized');

    elements.micStatus.textContent = '🎤 Microphone active';
    elements.micStatus.classList.add('active');

    // Clear any previous error messages
    elements.feedback.classList.add('hidden');

    detectPitch(buffer);
  } catch (error) {
    console.error('Error accessing microphone:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);

    elements.micStatus.textContent = '🎤 Microphone access denied';

    let errorMessage = '⚠️ Please allow microphone access or use keyboard mode';
    if (error.name === 'NotAllowedError') {
      errorMessage = '⚠️ Microphone permission denied. Please enable it in your browser settings or use keyboard mode.';
    } else if (error.name === 'NotFoundError') {
      errorMessage = '⚠️ No microphone found. Please connect a microphone or use keyboard mode.';
    }

    elements.feedback.textContent = errorMessage;
    elements.feedback.classList.remove('hidden', 'correct', 'incorrect');
    elements.feedback.style.background = '#fff3cd';
    elements.feedback.style.color = '#856404';
  } finally {
    state.isRestartingMic = false;
  }
}

// Stop pitch detection
function stopPitchDetection() {
  state.isListening = false;
  resetPitchStability();
  cleanupMicrophoneResources({ stopTracks: true });
  elements.micStatus.textContent = '🎤 Microphone inactive';
  elements.micStatus.classList.remove('active');
  elements.detectedPitch.textContent = 'Listening...';
  elements.volumeBar.style.width = '0%';
  elements.volumeLevel.textContent = '0%';
  elements.volumeLevel.style.color = '#667eea';
}

function cleanupMicrophoneResources({ stopTracks }) {
  if (state.animationFrameId) {
    cancelAnimationFrame(state.animationFrameId);
    state.animationFrameId = null;
  }

  if (state.micSource) {
    state.micSource.disconnect();
    state.micSource = null;
  }

  if (state.analyser) {
    state.analyser.disconnect();
    state.analyser = null;
  }

  if (stopTracks && state.micStream) {
    state.micStream.getTracks().forEach(track => track.stop());
    state.micStream = null;
  }
}

async function ensureMicrophoneActive() {
  if (state.inputMode !== 'microphone') return;

  const streamTrack = state.micStream?.getAudioTracks?.()[0];
  const trackEnded = !streamTrack || streamTrack.readyState === 'ended';
  const contextSuspended = state.audioContext && state.audioContext.state === 'suspended';

  if (contextSuspended && !trackEnded && state.audioContext) {
    try {
      await state.audioContext.resume();
      state.isListening = true;
      return;
    } catch (error) {
      console.warn('Audio context resume failed, restarting mic:', error);
    }
  }

  if (!state.isListening || trackEnded || contextSuspended) {
    await startPitchDetection();
  }
}

// Detect pitch continuously
function detectPitch(buffer) {
  if (!state.isListening) return;

  const now = performance.now();

  state.analyser.getFloatTimeDomainData(buffer);

  // Calculate volume (RMS)
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) {
    sum += buffer[i] * buffer[i];
  }
  const volume = Math.sqrt(sum / buffer.length);
  const volumePercent = Math.min(100, volume * 1000);

  // Update volume meter and level display
  elements.volumeBar.style.width = `${volumePercent}%`;
  elements.volumeLevel.textContent = `${Math.round(volumePercent)}%`;

  // Add visual indicator for sound detection
  if (volumePercent > 5) {
    elements.volumeLevel.style.color = '#28a745';
  } else {
    elements.volumeLevel.style.color = '#dc3545';
  }

  // If waiting for silence after a correct answer, hold until audio drops off
  if (state.waitingForSilence) {
    if (volume < 0.015) {
      state.waitingForSilence = false;
      if (state.advanceOnSilence) {
        state.advanceOnSilence = false;
        generateNewNote();
      }
      resetPitchStability();
    }
    state.animationFrameId = requestAnimationFrame(() => detectPitch(buffer));
    return;
  }

  // Detect pitch
  const [pitch, clarity] = state.detector.findPitch(buffer, state.audioContext.sampleRate);

  if (clarity >= DETECTION_CONFIG.minClarity && volume >= DETECTION_CONFIG.minVolume) {
    const naturalNote = detectNaturalNoteWithOctave(pitch);

    if (naturalNote) {
      const stableDuration = updatePitchStability(naturalNote, now);
      elements.detectedPitch.textContent = `Detected: ${naturalNote}`;

      const canTrigger =
        stableDuration >= DETECTION_CONFIG.requiredStableMs &&
        now - state.pitchStability.lastTriggeredAt >= DETECTION_CONFIG.triggerCooldownMs;

      if (canTrigger) {
        state.pitchStability.lastTriggeredAt = now;
        state.waitingForSilence = true;
        checkMicrophoneAnswer(naturalNote);
      }
    } else {
      clearPitchCandidate();
    }
  } else {
    clearPitchCandidate();
  }

  state.animationFrameId = requestAnimationFrame(() => detectPitch(buffer));
}

function updatePitchStability(note, now) {
  const stability = state.pitchStability;
  const isSameCandidate =
    stability.note === note && now - stability.lastSeenAt <= DETECTION_CONFIG.maxFrameGapMs;

  if (!isSameCandidate) {
    stability.note = note;
    stability.firstSeenAt = now;
    stability.lastSeenAt = now;
    return 0;
  }

  stability.lastSeenAt = now;
  return now - stability.firstSeenAt;
}

function clearPitchCandidate() {
  state.pitchStability.note = null;
  state.pitchStability.firstSeenAt = 0;
  state.pitchStability.lastSeenAt = 0;
}

function resetPitchStability() {
  clearPitchCandidate();
  state.pitchStability.lastTriggeredAt = 0;
}

function detectNaturalNoteWithOctave(pitch) {
  let closestNote = null;
  let minAbsCents = Infinity;

  for (const target of DETECTION_TARGETS) {
    const cents = 1200 * Math.log2(pitch / target.frequency);
    const absCents = Math.abs(cents);
    if (absCents <= DETECTION_CONFIG.centsTolerance && absCents < minAbsCents) {
      minAbsCents = absCents;
      closestNote = target.note;
    }
  }

  return closestNote;
}

function buildDetectionTargets() {
  const allRanges = [TREBLE_NOTES, BASS_NOTES, GRAND_NOTES];
  const uniqueNotes = new Set();

  for (const range of allRanges) {
    for (const notes of Object.values(range)) {
      notes.forEach((note) => uniqueNotes.add(vexKeyToScientific(note)));
    }
  }

  return Array.from(uniqueNotes).map((note) => ({
    note,
    frequency: scientificNoteToFrequency(note)
  }));
}

function scientificNoteToFrequency(note) {
  const match = note.match(/^([A-G])(\d)$/);
  if (!match) return 0;

  const [, letter, octaveString] = match;
  const octave = parseInt(octaveString, 10);
  const semitoneByLetter = {
    C: 0,
    D: 2,
    E: 4,
    F: 5,
    G: 7,
    A: 9,
    B: 11
  };

  const midi = (octave + 1) * 12 + semitoneByLetter[letter];
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function vexKeyToScientific(note) {
  return note.replace('/', '');
}

// Handle keyboard input
function handleKeyboardInput(note) {
  // Remove sharp from note - Dandelot method focuses on natural notes only
  // This allows the piano keyboard to have all keys visible for realism,
  // but interprets sharps as the nearest natural note
  const noteClass = note.replace('#', '');

  // Visual feedback
  const key = elements.pianoKeyboard.querySelector(`[data-note="${note}"]`);
  key.classList.add('active');
  setTimeout(() => key.classList.remove('active'), 200);

  checkKeyboardAnswer(noteClass);
}

function checkKeyboardAnswer(pitchClass) {
  if (!state.currentNoteClass) return;

  const isCorrect = pitchClass === state.currentNoteClass;
  applyAnswerResult(isCorrect, state.currentNoteClass);
}

function checkMicrophoneAnswer(noteWithOctave) {
  if (!state.currentNoteScientific) return;

  const isCorrect = noteWithOctave === state.currentNoteScientific;
  applyAnswerResult(isCorrect, state.currentNoteScientific);
}

// Check answer
function applyAnswerResult(isCorrect, expectedLabel) {
  state.score.total++;

  if (isCorrect) {
    state.score.correct++;
    state.streak++;
    showFeedback(true, expectedLabel);
    if (state.inputMode === 'microphone') {
      state.waitingForSilence = true;
      state.advanceOnSilence = true;
    } else {
      setTimeout(() => {
        generateNewNote();
      }, 1500);
    }
  } else {
    state.streak = 0;
    showFeedback(false, expectedLabel);
    if (state.inputMode === 'microphone') {
      state.waitingForSilence = true;
      state.advanceOnSilence = false;
    }
  }

  updateScoreDisplay();
}

// Show feedback
function showFeedback(isCorrect, expectedLabel = state.currentNoteClass) {
  elements.feedback.classList.remove('hidden', 'correct', 'incorrect');

  if (isCorrect) {
    const messages = [
      '🎉 Excellent!',
      '⭐ Great job!',
      '🌟 Perfect!',
      '👏 Wonderful!',
      '🎵 Beautiful!'
    ];
    elements.feedback.textContent = messages[Math.floor(Math.random() * messages.length)];
    elements.feedback.classList.add('correct');
  } else {
    elements.feedback.textContent = `❌ Try again! The note was ${expectedLabel}`;
    elements.feedback.classList.add('incorrect');
    setTimeout(() => {
      elements.feedback.classList.add('hidden');
    }, 2000);
  }
}

// Update score display
function updateScoreDisplay() {
  elements.score.textContent = `${state.score.correct} / ${state.score.total}`;

  const accuracy = state.score.total > 0
    ? Math.round((state.score.correct / state.score.total) * 100)
    : 0;
  elements.accuracy.textContent = `${accuracy}%`;

  elements.streak.textContent = `${state.streak} 🔥`;
}

// Generate new note
function generateNewNote() {
  state.waitingForSilence = false;
  state.advanceOnSilence = false;
  resetPitchStability();
  elements.feedback.classList.add('hidden');

  const availableNotes = LEVEL_NOTES[state.level];
  const randomNote = availableNotes[Math.floor(Math.random() * availableNotes.length)];

  state.currentNoteClass = randomNote;

  const noteRange = getNoteRangeForClef(state.clef);
  const possibleNotes = noteRange[randomNote];
  const selectedNote = possibleNotes[Math.floor(Math.random() * possibleNotes.length)];

  state.currentNote = selectedNote;
  state.currentNoteScientific = vexKeyToScientific(selectedNote);

  renderStaff(selectedNote, state.clef);
}

function getNoteRangeForClef(clef) {
  if (clef === 'treble') return TREBLE_NOTES;
  if (clef === 'bass') return BASS_NOTES;
  return GRAND_NOTES;
}

function getClefForGrandStaffNote(note) {
  const octave = parseInt(note.split('/')[1], 10);
  return octave >= 4 ? 'treble' : 'bass';
}

// Render staff with VexFlow
function renderStaff(note, clef) {
  elements.staffContainer.innerHTML = '';

  const vf = new Renderer(elements.staffContainer, Renderer.Backends.SVG);
  if (clef === 'grand') {
    vf.resize(500, 260);
  } else {
    vf.resize(500, 200);
  }
  const context = vf.getContext();

  if (clef === 'grand') {
    const trebleStave = new Stave(60, 30, 360);
    trebleStave.addClef('treble');
    trebleStave.setContext(context).draw();

    const bassStave = new Stave(60, 130, 360);
    bassStave.addClef('bass');
    bassStave.setContext(context).draw();

    new StaveConnector(trebleStave, bassStave)
      .setType(StaveConnector.type.BRACE)
      .setContext(context)
      .draw();

    new StaveConnector(trebleStave, bassStave)
      .setType(StaveConnector.type.SINGLE_LEFT)
      .setContext(context)
      .draw();

    const noteClef = getClefForGrandStaffNote(note);
    const targetStave = noteClef === 'treble' ? trebleStave : bassStave;

    const notes = [
      new StaveNote({
        keys: [note],
        duration: 'w',
        clef: noteClef
      })
    ];

    const voice = new Voice({ num_beats: 4, beat_value: 4 });
    voice.addTickables(notes);

    new Formatter().joinVoices([voice]).format([voice], 300);
    voice.draw(context, targetStave);
    return;
  }

  const stave = new Stave(10, 40, 400);
  stave.addClef(clef);
  stave.setContext(context).draw();

  const notes = [
    new StaveNote({
      keys: [note],
      duration: 'w',
      clef: clef
    })
  ];

  const voice = new Voice({ num_beats: 4, beat_value: 4 });
  voice.addTickables(notes);

  new Formatter().joinVoices([voice]).format([voice], 350);
  voice.draw(context, stave);
}

// Reset session
function resetSession() {
  state.score = { correct: 0, total: 0 };
  state.streak = 0;
  updateScoreDisplay();
  generateNewNote();
  elements.feedback.classList.add('hidden');
}

// Start the application
document.addEventListener('DOMContentLoaded', () => {
  init().catch((error) => {
    console.error('Initialization error:', error);
    elements.micStatus.textContent = '🎤 Microphone inactive';
    elements.feedback.textContent = '⚠️ Unable to initialize microphone. Click anywhere to retry.';
    elements.feedback.classList.remove('hidden', 'correct', 'incorrect');
    elements.feedback.style.background = '#fff3cd';
    elements.feedback.style.color = '#856404';
  });
});
