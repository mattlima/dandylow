import { state } from './state.js';
import { elements } from './ui/elements.js';
import { startPitchDetection, stopPitchDetection, ensureMicrophoneActive } from './audio/microphone.js';
import { generateNewNote } from './game/noteGenerator.js';
import { updateScoreDisplay, resetSession } from './game/scoring.js';
import { setupKeyboardListeners } from './ui/keyboard.js';

async function init(): Promise<void> {
  setupEventListeners();
  generateNewNote();
  updateScoreDisplay();

  if (state.inputMode === 'microphone') {
    elements.micStatus.textContent = '🎤 Connecting microphone...';
    await ensureMicrophoneActive();
  }
}

async function switchInputMode(mode: 'microphone' | 'keyboard'): Promise<void> {
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

function setupEventListeners(): void {
  elements.levelSelect.addEventListener('change', (e) => {
    state.level = parseInt((e.target as HTMLSelectElement).value);
    generateNewNote();
  });

  elements.clefSelect.addEventListener('change', (e) => {
    state.clef = (e.target as HTMLSelectElement).value;
    generateNewNote();
  });

  elements.micModeBtn.addEventListener('click', () => switchInputMode('microphone'));
  elements.keyboardModeBtn.addEventListener('click', () => switchInputMode('keyboard'));
  elements.nextBtn.addEventListener('click', () => generateNewNote());
  elements.resetBtn.addEventListener('click', () => resetSession());

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') ensureMicrophoneActive();
  });

  window.addEventListener('focus', () => ensureMicrophoneActive());
  window.addEventListener('pageshow', () => ensureMicrophoneActive());

  // Chrome audio may need a user gesture to fully initialize
  const recoverOnGesture = (): void => { ensureMicrophoneActive(); };
  window.addEventListener('pointerdown', recoverOnGesture, { passive: true });
  window.addEventListener('keydown', recoverOnGesture);

  setupKeyboardListeners();
}

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
