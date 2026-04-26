import { audioGraph } from './audioGraph';
import { useAudioStore } from '../stores/audio';
import { useGameStore } from '../stores/game';
import { DETECTION_CONFIG } from '../constants.js';
import { detectNaturalNoteWithOctave, buildDetectionTargets, type DetectionTarget } from './noteFrequency.js';
import { checkMicrophoneAnswer } from '../game/scoring.js';
import { generateNewNote } from '../game/noteGenerator.js';

const DETECTION_TARGETS: DetectionTarget[] = buildDetectionTargets();

export function startDetectionLoop(buffer: Float32Array): void {
    detectPitch(buffer);
}

function detectPitch(buffer: Float32Array): void {
    const audioStore = useAudioStore();
    const gameStore = useGameStore();

    if (!audioStore.isListening) return;

    const now = performance.now();

    audioGraph.analyser!.getFloatTimeDomainData(buffer as Float32Array<ArrayBuffer>);

    // Calculate volume (RMS)
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
        sum += (buffer[i] ?? 0) * (buffer[i] ?? 0);
    }
    const volume = Math.sqrt(sum / buffer.length);
    const volumePercent = Math.min(100, volume * 1000);

    audioStore.volumePercent = volumePercent;
    audioStore.volumeColor = volumePercent > 5 ? '#28a745' : '#dc3545';

    // Hold until silence after a triggered answer
    if (gameStore.waitingForSilence) {
        if (volume < 0.015) {
            gameStore.waitingForSilence = false;
            if (gameStore.advanceOnSilence) {
                gameStore.advanceOnSilence = false;
                generateNewNote();
            }
            audioStore.clearPitchCandidate();
        }
        audioGraph.animationFrameId = requestAnimationFrame(() => detectPitch(buffer));
        return;
    }

    const [pitch, clarity] = audioGraph.detector!.findPitch(buffer, audioGraph.audioContext!.sampleRate);

    if (clarity >= DETECTION_CONFIG.minClarity && volume >= DETECTION_CONFIG.minVolume) {
        const naturalNote = detectNaturalNoteWithOctave(pitch, DETECTION_TARGETS);

        if (naturalNote) {
            const stableDuration = updatePitchStability(naturalNote, now, audioStore);
            audioStore.detectedPitch = `Detected: ${naturalNote}`;

            const canTrigger =
                stableDuration >= DETECTION_CONFIG.requiredStableMs &&
                now - audioStore.pitchStability.lastTriggeredAt >= DETECTION_CONFIG.triggerCooldownMs;

            if (canTrigger) {
                audioStore.pitchStability.lastTriggeredAt = now;
                gameStore.waitingForSilence = true;
                checkMicrophoneAnswer(naturalNote);
            }
        } else {
            audioStore.clearPitchCandidate();
        }
    } else {
        audioStore.clearPitchCandidate();
    }

    audioGraph.animationFrameId = requestAnimationFrame(() => detectPitch(buffer));
}

function updatePitchStability(
    note: string,
    now: number,
    audioStore: ReturnType<typeof useAudioStore>
): number {
    const stability = audioStore.pitchStability;
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

