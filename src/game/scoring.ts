import { state } from '../state.js';
import { elements } from '../ui/elements.js';
import { generateNewNote } from './noteGenerator.js';

const SUCCESS_MESSAGES = [
  '🎉 Excellent!',
  '⭐ Great job!',
  '🌟 Perfect!',
  '👏 Wonderful!',
  '🎵 Beautiful!'
];

export function checkKeyboardAnswer(pitchClass: string): void {
  if (!state.currentNoteClass) return;
  const isCorrect = pitchClass === state.currentNoteClass;
  applyAnswerResult(isCorrect, state.currentNoteClass);
}

export function checkMicrophoneAnswer(noteWithOctave: string): void {
  if (!state.currentNoteScientific) return;
  const isCorrect = noteWithOctave === state.currentNoteScientific;
  applyAnswerResult(isCorrect, state.currentNoteScientific);
}

function applyAnswerResult(isCorrect: boolean, expectedLabel: string): void {
  state.score.total++;

  if (isCorrect) {
    state.score.correct++;
    state.streak++;
    showFeedback(true, expectedLabel);
    if (state.inputMode === 'microphone') {
      state.waitingForSilence = true;
      state.advanceOnSilence = true;
    } else {
      setTimeout(() => generateNewNote(), 1500);
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

function showFeedback(isCorrect: boolean, expectedLabel: string): void {
  elements.feedback.classList.remove('hidden', 'correct', 'incorrect');

  if (isCorrect) {
    const msg = SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)] ?? '🎉 Excellent!';
    elements.feedback.textContent = msg;
    elements.feedback.classList.add('correct');
  } else {
    elements.feedback.textContent = `❌ Try again! The note was ${expectedLabel}`;
    elements.feedback.classList.add('incorrect');
    setTimeout(() => elements.feedback.classList.add('hidden'), 2000);
  }
}

export function updateScoreDisplay(): void {
  elements.score.textContent = `${state.score.correct} / ${state.score.total}`;
  const accuracy = state.score.total > 0
    ? Math.round((state.score.correct / state.score.total) * 100)
    : 0;
  elements.accuracy.textContent = `${accuracy}%`;
  elements.streak.textContent = `${state.streak} 🔥`;
}

export function resetSession(): void {
  state.score = { correct: 0, total: 0 };
  state.streak = 0;
  updateScoreDisplay();
  generateNewNote();
  elements.feedback.classList.add('hidden');
}
