import { defineStore } from 'pinia';
import { ref } from 'vue';
import { DETECTION_CONFIG } from '../constants';

export interface PitchStability {
    note: string | null;
    firstSeenAt: number;
    lastSeenAt: number;
    lastTriggeredAt: number;
}

export const useAudioStore = defineStore('audio', () => {
    const isListening = ref(false);
    const isRestartingMic = ref(false);

    // Display state for the pitch panel
    const micStatusText = ref('🎤 Microphone inactive');
    const micStatusActive = ref(false);
    const detectedPitch = ref('Listening...');
    const volumePercent = ref(0);
    const volumeColor = ref('#dc3545');

    // Runtime-adjustable volume threshold (overrides DETECTION_CONFIG.minVolume)
    const volumeThreshold = ref(DETECTION_CONFIG.minVolume);

    const pitchStability = ref<PitchStability>({
        note: null,
        firstSeenAt: 0,
        lastSeenAt: 0,
        lastTriggeredAt: 0
    });
    const silenceGateFirstSeenAt = ref(0);

    function resetPitchStability(): void {
        clearPitchCandidate();
        silenceGateFirstSeenAt.value = 0;
    }

    function clearPitchCandidate(): void {
        pitchStability.value.note = null;
        pitchStability.value.firstSeenAt = 0;
        pitchStability.value.lastSeenAt = 0;
    }

    function clearSilenceGateCandidate(): void {
        silenceGateFirstSeenAt.value = 0;
    }

    return {
        isListening, isRestartingMic,
        micStatusText, micStatusActive,
        detectedPitch, volumePercent, volumeColor,
        volumeThreshold,
        pitchStability,
        silenceGateFirstSeenAt,
        resetPitchStability, clearPitchCandidate, clearSilenceGateCandidate
    };
});
