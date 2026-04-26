import { elements } from './elements.js';
import { checkKeyboardAnswer } from '../game/scoring.js';

export function handleKeyboardInput(note: string): void {
  // Remove sharp — Dandelot method focuses on natural notes only
  const noteClass = note.replace('#', '');

  const key = elements.pianoKeyboard.querySelector<HTMLButtonElement>(`[data-note="${note}"]`);
  if (key) {
    key.classList.add('active');
    setTimeout(() => key.classList.remove('active'), 200);
  }

  checkKeyboardAnswer(noteClass);
}

export function setupKeyboardListeners(): void {
  elements.pianoKeyboard.querySelectorAll<HTMLButtonElement>('.key').forEach((key) => {
    key.addEventListener('click', () => {
      const note = key.dataset['note'];
      if (note) handleKeyboardInput(note);
    });
  });
}
