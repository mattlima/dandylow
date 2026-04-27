import { onMounted, onUnmounted } from 'vue';
import {
    startPitchDetection,
    stopPitchDetection,
    ensureMicrophoneActive
} from '../audio/microphone';
import { useGameStore } from '../stores/game';

export function useMicrophone() {
    const gameStore = useGameStore();

    function handleRecovery(): void {
        // Only attempt recovery when in the game (not on the entry screen)
        if (gameStore.screen !== 'game') return;
        ensureMicrophoneActive();
    }

    onMounted(() => {
        document.addEventListener('visibilitychange', handleRecovery);
        window.addEventListener('focus', handleRecovery);
        window.addEventListener('pageshow', handleRecovery);
        window.addEventListener('pointerdown', handleRecovery, { passive: true });
        window.addEventListener('keydown', handleRecovery);
    });

    onUnmounted(() => {
        document.removeEventListener('visibilitychange', handleRecovery);
        window.removeEventListener('focus', handleRecovery);
        window.removeEventListener('pageshow', handleRecovery);
        window.removeEventListener('pointerdown', handleRecovery);
        window.removeEventListener('keydown', handleRecovery);
        stopPitchDetection();
    });

    return {
        startMic: startPitchDetection,
        stopMic: stopPitchDetection,
        ensureActive: ensureMicrophoneActive
    };
}
