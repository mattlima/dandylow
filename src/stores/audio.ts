import { defineStore } from 'pinia';
import { ref } from 'vue';

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

    const pitchStability = ref<PitchStability>({
        note: null,
        firstSeenAt: 0,
        lastSeenAt: 0,
        lastTriggeredAt: 0
    });

    function resetPitchStability(): void {
        clearPitchCandidate();
        pitchStability.value.lastTriggeredAt = 0;
    }

    function clearPitchCandidate(): void {
        pitchStability.value.note = null;
        pitchStability.value.firstSeenAt = 0;
        pitchStability.value.lastSeenAt = 0;
    }

    return {
        isListening, isRestartingMic,
        micStatusText, micStatusActive,
        detectedPitch, volumePercent, volumeColor,
        pitchStability,
        resetPitchStability, clearPitchCandidate
    };
});
