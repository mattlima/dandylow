export interface PitchStability {
  note: string | null;
  firstSeenAt: number;
  lastSeenAt: number;
  lastTriggeredAt: number;
}

export interface AppState {
  level: number;
  clef: string;
  inputMode: 'microphone' | 'keyboard';
  currentNote: string | null;
  currentNoteClass: string | null;
  currentNoteScientific: string | null;
  score: { correct: number; total: number };
  streak: number;
  audioContext: AudioContext | null;
  micStream: MediaStream | null;
  micSource: MediaStreamAudioSourceNode | null;
  analyser: AnalyserNode | null;
  detector: import('pitchy').PitchDetector<Float32Array> | null;
  isListening: boolean;
  isRestartingMic: boolean;
  animationFrameId: number | null;
  waitingForSilence: boolean;
  advanceOnSilence: boolean;
  pitchStability: PitchStability;
}

export const state: AppState = {
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

export function resetPitchStability(): void {
  clearPitchCandidate();
  state.pitchStability.lastTriggeredAt = 0;
}

export function clearPitchCandidate(): void {
  state.pitchStability.note = null;
  state.pitchStability.firstSeenAt = 0;
  state.pitchStability.lastSeenAt = 0;
}
