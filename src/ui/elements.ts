function el<T extends HTMLElement>(id: string): T {
  const elem = document.getElementById(id);
  if (!elem) throw new Error(`Element #${id} not found`);
  return elem as T;
}

export const elements = {
  levelSelect: el<HTMLSelectElement>('level-select'),
  clefSelect: el<HTMLSelectElement>('clef-select'),
  micModeBtn: el<HTMLButtonElement>('mic-mode-btn'),
  keyboardModeBtn: el<HTMLButtonElement>('keyboard-mode-btn'),
  staffContainer: el<HTMLDivElement>('staff-container'),
  feedback: el<HTMLDivElement>('feedback'),
  micStatus: el<HTMLSpanElement>('mic-status'),
  detectedPitch: el<HTMLSpanElement>('detected-pitch'),
  volumeBar: el<HTMLDivElement>('volume-bar'),
  volumeLevel: el<HTMLSpanElement>('volume-level'),
  keyboardContainer: el<HTMLDivElement>('keyboard-container'),
  pianoKeyboard: el<HTMLDivElement>('piano-keyboard'),
  nextBtn: el<HTMLButtonElement>('next-btn'),
  resetBtn: el<HTMLButtonElement>('reset-btn'),
  score: el<HTMLSpanElement>('score'),
  accuracy: el<HTMLSpanElement>('accuracy'),
  streak: el<HTMLSpanElement>('streak')
};
