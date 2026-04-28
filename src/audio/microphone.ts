import { PitchDetector } from 'pitchy';
import { audioGraph } from './audioGraph';
import { useAudioStore } from '../stores/audio';
import { useGameStore } from '../stores/game';
import { startDetectionLoop } from './pitchDetection.js';
import { resolveAdvancedSettings } from '../constants.js';
import { useProfilesStore } from '../stores/profiles';

export async function startPitchDetection(): Promise<void> {
    const audioStore = useAudioStore();
    const gameStore = useGameStore();
    const profilesStore = useProfilesStore();
    const advanced = resolveAdvancedSettings(profilesStore.activeProfile?.preferences.advancedSettings);

    try {
        if (audioStore.isRestartingMic) return;
        audioStore.isRestartingMic = true;

        audioStore.micStatusText = '🎤 Connecting microphone...';
        audioStore.isListening = false;
        cleanupMicrophoneResources({ stopTracks: true });

        if (!audioGraph.audioContext) {
            audioGraph.audioContext = new AudioContext();
        }

        if (audioGraph.audioContext.state === 'suspended') {
            await audioGraph.audioContext.resume();
        }

        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false
            }
        });

        audioGraph.micStream = stream;
        const [track] = stream.getAudioTracks();
        if (track) {
            track.onended = () => {
                if (gameStore.inputMode === 'microphone') {
                    audioStore.micStatusText = '🎤 Reconnecting microphone...';
                    audioStore.isListening = false;
                    ensureMicrophoneActive();
                }
            };
        }

        const source = audioGraph.audioContext.createMediaStreamSource(stream);
        audioGraph.micSource = source;

        audioGraph.analyser = audioGraph.audioContext.createAnalyser();
        audioGraph.analyser.fftSize = advanced.microphone.analyserFftSize;
        source.connect(audioGraph.analyser);

        const bufferLength = audioGraph.analyser.fftSize;
        const buffer = new Float32Array(bufferLength);

        audioGraph.detector = PitchDetector.forFloat32Array(bufferLength);
        audioStore.isListening = true;
        audioStore.resetPitchStability();

        audioStore.micStatusText = '🎤 Microphone active';
        audioStore.micStatusActive = true;
        gameStore.hideFeedback();

        startDetectionLoop(buffer);
    } catch (error) {
        const err = error as DOMException;
        audioStore.micStatusText = '🎤 Microphone access denied';

        let errorMessage = '⚠️ Please allow microphone access or use keyboard mode';
        if (err.name === 'NotAllowedError') {
            errorMessage =
                '⚠️ Microphone permission denied. Please enable it in your browser settings or use keyboard mode.';
        } else if (err.name === 'NotFoundError') {
            errorMessage = '⚠️ No microphone found. Please connect a microphone or use keyboard mode.';
        }

        gameStore.showFeedback('incorrect', errorMessage);
    } finally {
        const audioStore = useAudioStore();
        audioStore.isRestartingMic = false;
    }
}

export function stopPitchDetection(): void {
    const audioStore = useAudioStore();
    audioStore.isListening = false;
    audioStore.resetPitchStability();
    cleanupMicrophoneResources({ stopTracks: true });
    audioStore.micStatusText = '🎤 Microphone inactive';
    audioStore.micStatusActive = false;
    audioStore.detectedPitch = 'Listening...';
    audioStore.volumePercent = 0;
    audioStore.volumeColor = '#667eea';
}

export function cleanupMicrophoneResources({ stopTracks }: { stopTracks: boolean }): void {
    if (audioGraph.animationFrameId) {
        cancelAnimationFrame(audioGraph.animationFrameId);
        audioGraph.animationFrameId = null;
    }

    if (audioGraph.micSource) {
        audioGraph.micSource.disconnect();
        audioGraph.micSource = null;
    }

    if (audioGraph.analyser) {
        audioGraph.analyser.disconnect();
        audioGraph.analyser = null;
    }

    if (stopTracks && audioGraph.micStream) {
        audioGraph.micStream.getTracks().forEach((track) => track.stop());
        audioGraph.micStream = null;
    }
}

export async function ensureMicrophoneActive(): Promise<void> {
    const audioStore = useAudioStore();
    const gameStore = useGameStore();

    if (gameStore.inputMode !== 'microphone') return;

    const streamTrack = audioGraph.micStream?.getAudioTracks?.()[0];
    const trackEnded = !streamTrack || streamTrack.readyState === 'ended';
    const contextSuspended = audioGraph.audioContext?.state === 'suspended';

    if (contextSuspended && !trackEnded && audioGraph.audioContext) {
        try {
            await audioGraph.audioContext.resume();
            audioStore.isListening = true;
            return;
        } catch {
            // Fall through to full restart
        }
    }

    if (!audioStore.isListening || trackEnded || contextSuspended) {
        await startPitchDetection();
    }
}

