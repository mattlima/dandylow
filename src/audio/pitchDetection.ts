import { state, clearPitchCandidate } from '../state.js';
import { DETECTION_CONFIG } from '../constants.js';
import { elements } from '../ui/elements.js';
import { detectNaturalNoteWithOctave, buildDetectionTargets, type DetectionTarget } from './noteFrequency.js';
import { checkMicrophoneAnswer } from '../game/scoring.js';
import { generateNewNote } from '../game/noteGenerator.js';

const DETECTION_TARGETS: DetectionTarget[] = buildDetectionTargets();

export function startDetectionLoop(buffer: Float32Array): void {
  detectPitch(buffer);
}

function detectPitch(buffer: Float32Array): void {
  if (!state.isListening) return;

  const now = performance.now();

  state.analyser!.getFloatTimeDomainData(buffer as Float32Array<ArrayBuffer>);

  // Calculate volume (RMS)
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) {
    sum += (buffer[i] ?? 0) * (buffer[i] ?? 0);
  }
  const volume = Math.sqrt(sum / buffer.length);
  const volumePercent = Math.min(100, volume * 1000);

  elements.volumeBar.style.width = `${volumePercent}%`;
  elements.volumeLevel.textContent = `${Math.round(volumePercent)}%`;
  elements.volumeLevel.style.color = volumePercent > 5 ? '#28a745' : '#dc3545';

  // Hold until silence after a triggered answer
  if (state.waitingForSilence) {
    if (volume < 0.015) {
      state.waitingForSilence = false;
      if (state.advanceOnSilence) {
        state.advanceOnSilence = false;
        generateNewNote();
      }
      resetStability();
    }
    state.animationFrameId = requestAnimationFrame(() => detectPitch(buffer));
    return;
  }

  const [pitch, clarity] = state.detector!.findPitch(buffer, state.audioContext!.sampleRate);

  if (clarity >= DETECTION_CONFIG.minClarity && volume >= DETECTION_CONFIG.minVolume) {
    const naturalNote = detectNaturalNoteWithOctave(pitch, DETECTION_TARGETS);

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

function updatePitchStability(note: string, now: number): number {
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

function resetStability(): void {
  clearPitchCandidate();
}
