import { audioGraph } from './audioGraph';
import { useAudioStore } from '../stores/audio';
import { useGameStore } from '../stores/game';
import { resolveAdvancedSettings, VOLUME_PERCENT_MULTIPLIER } from '../constants.js';
import { useProfilesStore } from '../stores/profiles';
import { detectNaturalNoteWithOctave, buildDetectionTargets, type DetectionTarget } from './noteFrequency.js';
import { checkMicrophoneAnswer } from '../game/scoring.js';

const DETECTION_TARGETS: DetectionTarget[] = buildDetectionTargets();

export function startDetectionLoop(buffer: Float32Array): void {
    detectPitch(buffer);
}

function detectPitch(buffer: Float32Array): void {
    const audioStore = useAudioStore();
    const gameStore = useGameStore();
    const profilesStore = useProfilesStore();
    const advanced = resolveAdvancedSettings(profilesStore.activeProfile?.preferences.advancedSettings);
    const detectionConfig = advanced.detection;
    const effectiveVolumeThreshold = Math.max(audioStore.volumeThreshold, detectionConfig.minVolume);

    if (!audioStore.isListening) return;

    const now = performance.now();

    audioGraph.analyser!.getFloatTimeDomainData(buffer as Float32Array<ArrayBuffer>);

    // Calculate volume (RMS)
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
        sum += (buffer[i] ?? 0) * (buffer[i] ?? 0);
    }
    const volume = Math.sqrt(sum / buffer.length);
    const volumePercent = Math.min(100, volume * VOLUME_PERCENT_MULTIPLIER);

    audioStore.volumePercent = volumePercent;
    audioStore.volumeColor = volumePercent >= effectiveVolumeThreshold * VOLUME_PERCENT_MULTIPLIER
        ? '#28a745'
        : '#dc3545';

    // Hold until silence after a triggered answer — then advance sequence
    if (gameStore.waitingForSilence) {
        // On mobile mics, volume can dip briefly while a note is still held.
        // Require both low volume and no reliable pitch before treating input as silence.
        const [waitingPitch, waitingClarity] = audioGraph.detector!.findPitch(buffer, audioGraph.audioContext!.sampleRate);
        const waitingNaturalNote = detectNaturalNoteWithOctave(waitingPitch, DETECTION_TARGETS);
        const hasReliablePitch = waitingClarity >= detectionConfig.minClarity && Boolean(waitingNaturalNote);

        if (volume < detectionConfig.silenceGateVolume && !hasReliablePitch) {
            if (audioStore.silenceGateFirstSeenAt === 0) {
                audioStore.silenceGateFirstSeenAt = now;
            }

            const silenceDuration = now - audioStore.silenceGateFirstSeenAt;
            if (silenceDuration >= detectionConfig.silenceGateRequiredMs) {
                audioStore.clearPitchCandidate();
                gameStore.advanceSequence(); // resets waitingForSilence and noteAttempted
                audioStore.resetPitchStability();
            }
        } else {
            audioStore.clearSilenceGateCandidate();
        }

        if (!gameStore.waitingForSilence) {
            audioStore.clearPitchCandidate();
            audioStore.clearSilenceGateCandidate();
        }

        audioGraph.animationFrameId = requestAnimationFrame(() => detectPitch(buffer));
        return;
    }

    audioStore.clearSilenceGateCandidate();

    // Don't process pitch when sequence is complete or note already attempted
    if (gameStore.sequenceComplete || gameStore.noteAttempted) {
        audioGraph.animationFrameId = requestAnimationFrame(() => detectPitch(buffer));
        return;
    }

    const [pitch, clarity] = audioGraph.detector!.findPitch(buffer, audioGraph.audioContext!.sampleRate);

    if (clarity >= detectionConfig.minClarity && volume >= effectiveVolumeThreshold) {
        const naturalNote = detectNaturalNoteWithOctave(pitch, DETECTION_TARGETS);

        if (naturalNote) {
            const stableDuration = updatePitchStability(
                naturalNote,
                now,
                detectionConfig.maxFrameGapMs,
                audioStore
            );
            audioStore.detectedPitch = `Detected: ${naturalNote}`;

            const canTrigger =
                stableDuration >= detectionConfig.requiredStableMs &&
                now - audioStore.pitchStability.lastTriggeredAt >= detectionConfig.triggerCooldownMs;

            if (canTrigger) {
                audioStore.pitchStability.lastTriggeredAt = now;
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
    maxFrameGapMs: number,
    audioStore: ReturnType<typeof useAudioStore>
): number {
    const stability = audioStore.pitchStability;
    const isSameCandidate =
        stability.note === note && now - stability.lastSeenAt <= maxFrameGapMs;

    if (!isSameCandidate) {
        stability.note = note;
        stability.firstSeenAt = now;
        stability.lastSeenAt = now;
        return 0;
    }

    stability.lastSeenAt = now;
    return now - stability.firstSeenAt;
}


