import { Renderer, Stave, StaveNote, Voice, Formatter, Accidental } from 'vexflow';
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

// Application state
const state = {
  level: 1,
  clef: 'treble',
  inputMode: 'microphone',
  currentNote: null,
  currentNoteClass: null,
  score: { correct: 0, total: 0 },
  streak: 0,
  audioContext: null,
  analyser: null,
  detector: null,
  isListening: false,
  animationFrameId: null
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
function init() {
  setupEventListeners();
  generateNewNote();
  updateScoreDisplay();
  
  // Auto-start microphone if in microphone mode
  if (state.inputMode === 'microphone') {
    startPitchDetection();
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
    console.log('Starting pitch detection...');
    
    if (!state.audioContext) {
      state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      console.log('Audio context created');
    }

    console.log('Requesting microphone access...');
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log('Microphone access granted');
    
    const source = state.audioContext.createMediaStreamSource(stream);
    
    state.analyser = state.audioContext.createAnalyser();
    state.analyser.fftSize = 2048;
    source.connect(state.analyser);
    console.log('Audio analyser connected');

    const bufferLength = state.analyser.fftSize;
    const buffer = new Float32Array(bufferLength);
    
    state.detector = PitchDetector.forFloat32Array(bufferLength);
    state.detector.inputLength = bufferLength;
    state.isListening = true;
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
  }
}

// Stop pitch detection
function stopPitchDetection() {
  state.isListening = false;
  if (state.animationFrameId) {
    cancelAnimationFrame(state.animationFrameId);
  }
  elements.micStatus.textContent = '🎤 Microphone inactive';
  elements.micStatus.classList.remove('active');
  elements.detectedPitch.textContent = 'Listening...';
  elements.volumeBar.style.width = '0%';
  elements.volumeLevel.textContent = '0%';
  elements.volumeLevel.style.color = '#667eea';
}

// Detect pitch continuously
function detectPitch(buffer) {
  if (!state.isListening) return;

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

  // Detect pitch
  const [pitch, clarity] = state.detector.findPitch(buffer, state.audioContext.sampleRate);

  if (clarity > 0.9 && volume > 0.01) {
    const noteFrequencies = {
      'C': [16.35, 32.70, 65.41, 130.81, 261.63, 523.25, 1046.50, 2093.00],
      'C#': [17.32, 34.65, 69.30, 138.59, 277.18, 554.37, 1108.73, 2217.46],
      'D': [18.35, 36.71, 73.42, 146.83, 293.66, 587.33, 1174.66, 2349.32],
      'D#': [19.45, 38.89, 77.78, 155.56, 311.13, 622.25, 1244.51, 2489.02],
      'E': [20.60, 41.20, 82.41, 164.81, 329.63, 659.25, 1318.51, 2637.02],
      'F': [21.83, 43.65, 87.31, 174.61, 349.23, 698.46, 1396.91, 2793.83],
      'F#': [23.12, 46.25, 92.50, 185.00, 369.99, 739.99, 1479.98, 2959.96],
      'G': [24.50, 49.00, 98.00, 196.00, 392.00, 783.99, 1567.98, 3135.96],
      'G#': [25.96, 51.91, 103.83, 207.65, 415.30, 830.61, 1661.22, 3322.44],
      'A': [27.50, 55.00, 110.00, 220.00, 440.00, 880.00, 1760.00, 3520.00],
      'A#': [29.14, 58.27, 116.54, 233.08, 466.16, 932.33, 1864.66, 3729.31],
      'B': [30.87, 61.74, 123.47, 246.94, 493.88, 987.77, 1975.53, 3951.07]
    };

    let closestNote = null;
    let minDiff = Infinity;

    for (const [note, freqs] of Object.entries(noteFrequencies)) {
      for (const freq of freqs) {
        const diff = Math.abs(pitch - freq);
        const cents = 1200 * Math.log2(pitch / freq);
        if (Math.abs(cents) < 30 && diff < minDiff) {
          minDiff = diff;
          closestNote = note.replace('#', '');
        }
      }
    }

    if (closestNote) {
      // Remove sharp from detected note - Dandelot method focuses on natural notes only
      // C# is interpreted as closest to C, D# as closest to D, etc.
      const naturalNote = closestNote.replace('#', '');
      elements.detectedPitch.textContent = `Detected: ${naturalNote}`;
      checkAnswer(naturalNote);
    }
  }

  state.animationFrameId = requestAnimationFrame(() => detectPitch(buffer));
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

  checkAnswer(noteClass);
}

// Check answer
function checkAnswer(pitchClass) {
  if (!state.currentNoteClass) return;

  const isCorrect = pitchClass === state.currentNoteClass;
  state.score.total++;

  if (isCorrect) {
    state.score.correct++;
    state.streak++;
    showFeedback(true);
    setTimeout(() => {
      generateNewNote();
    }, 1500);
  } else {
    state.streak = 0;
    showFeedback(false);
  }

  updateScoreDisplay();
}

// Show feedback
function showFeedback(isCorrect) {
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
    elements.feedback.textContent = `❌ Try again! The note was ${state.currentNoteClass}`;
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
  elements.feedback.classList.add('hidden');
  
  const availableNotes = LEVEL_NOTES[state.level];
  const randomNote = availableNotes[Math.floor(Math.random() * availableNotes.length)];
  
  state.currentNoteClass = randomNote;
  
  const noteRange = state.clef === 'treble' ? TREBLE_NOTES : BASS_NOTES;
  const possibleNotes = noteRange[randomNote];
  const selectedNote = possibleNotes[Math.floor(Math.random() * possibleNotes.length)];
  
  state.currentNote = selectedNote;
  
  renderStaff(selectedNote, state.clef);
}

// Render staff with VexFlow
function renderStaff(note, clef) {
  elements.staffContainer.innerHTML = '';

  const vf = new Renderer(elements.staffContainer, Renderer.Backends.SVG);
  vf.resize(500, 200);
  const context = vf.getContext();

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
  init();
});
