import { onMounted, onUnmounted } from 'vue';
import {
    startPitchDetection,
    stopPitchDetection,
    ensureMicrophoneActive
} from '../audio/microphone';
import { useGameStore } from '../stores/game';
import { useAudioStore } from '../stores/audio';

export function useMicrophone() {
    const gameStore = useGameStore();
    const audioStore = useAudioStore();

    function handleRecovery(): void {
        ensureMicrophoneActive();
    }

    onMounted(async () => {
        document.addEventListener('visibilitychange', handleRecovery);
        window.addEventListener('focus', handleRecovery);
        window.addEventListener('pageshow', handleRecovery);
        window.addEventListener('pointerdown', handleRecovery, { passive: true });
        window.addEventListener('keydown', handleRecovery);

        if (gameStore.inputMode === 'microphone') {
            try {
                audioStore.micStatusText = '🎤 Connecting microphone...';
                await ensureMicrophoneActive();
            } catch (error) {
                console.error('Microphone initialization error:', error);
                audioStore.micStatusText = '🎤 Microphone inactive';
                gameStore.showFeedback(
                    'incorrect',
                    '⚠️ Unable to initialize microphone. Click anywhere to retry.'
                );
            }
        }
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
