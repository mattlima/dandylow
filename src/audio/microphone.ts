import { PitchDetector } from 'pitchy';
import { state, resetPitchStability } from '../state.js';
import { elements } from '../ui/elements.js';
import { startDetectionLoop } from './pitchDetection.js';

export async function startPitchDetection(): Promise<void> {
  try {
    if (state.isRestartingMic) return;
    state.isRestartingMic = true;

    elements.micStatus.textContent = '🎤 Connecting microphone...';
    state.isListening = false;
    cleanupMicrophoneResources({ stopTracks: true });

    if (!state.audioContext) {
      state.audioContext = new AudioContext();
    }

    if (state.audioContext.state === 'suspended') {
      await state.audioContext.resume();
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      }
    });

    state.micStream = stream;
    const [track] = stream.getAudioTracks();
    if (track) {
      track.onended = () => {
        if (state.inputMode === 'microphone') {
          elements.micStatus.textContent = '🎤 Reconnecting microphone...';
          state.isListening = false;
          ensureMicrophoneActive();
        }
      };
    }

    const source = state.audioContext.createMediaStreamSource(stream);
    state.micSource = source;

    state.analyser = state.audioContext.createAnalyser();
    state.analyser.fftSize = 2048;
    source.connect(state.analyser);

    const bufferLength = state.analyser.fftSize;
    const buffer = new Float32Array(bufferLength);

    state.detector = PitchDetector.forFloat32Array(bufferLength);
    state.isListening = true;
    resetPitchStability();

    elements.micStatus.textContent = '🎤 Microphone active';
    elements.micStatus.classList.add('active');
    elements.feedback.classList.add('hidden');

    startDetectionLoop(buffer);
  } catch (error) {
    const err = error as DOMException;
    elements.micStatus.textContent = '🎤 Microphone access denied';

    let errorMessage = '⚠️ Please allow microphone access or use keyboard mode';
    if (err.name === 'NotAllowedError') {
      errorMessage = '⚠️ Microphone permission denied. Please enable it in your browser settings or use keyboard mode.';
    } else if (err.name === 'NotFoundError') {
      errorMessage = '⚠️ No microphone found. Please connect a microphone or use keyboard mode.';
    }

    elements.feedback.textContent = errorMessage;
    elements.feedback.classList.remove('hidden', 'correct', 'incorrect');
    elements.feedback.style.background = '#fff3cd';
    elements.feedback.style.color = '#856404';
  } finally {
    state.isRestartingMic = false;
  }
}

export function stopPitchDetection(): void {
  state.isListening = false;
  resetPitchStability();
  cleanupMicrophoneResources({ stopTracks: true });
  elements.micStatus.textContent = '🎤 Microphone inactive';
  elements.micStatus.classList.remove('active');
  elements.detectedPitch.textContent = 'Listening...';
  elements.volumeBar.style.width = '0%';
  elements.volumeLevel.textContent = '0%';
  elements.volumeLevel.style.color = '#667eea';
}

export function cleanupMicrophoneResources({ stopTracks }: { stopTracks: boolean }): void {
  if (state.animationFrameId) {
    cancelAnimationFrame(state.animationFrameId);
    state.animationFrameId = null;
  }

  if (state.micSource) {
    state.micSource.disconnect();
    state.micSource = null;
  }

  if (state.analyser) {
    state.analyser.disconnect();
    state.analyser = null;
  }

  if (stopTracks && state.micStream) {
    state.micStream.getTracks().forEach((track) => track.stop());
    state.micStream = null;
  }
}

export async function ensureMicrophoneActive(): Promise<void> {
  if (state.inputMode !== 'microphone') return;

  const streamTrack = state.micStream?.getAudioTracks?.()[0];
  const trackEnded = !streamTrack || streamTrack.readyState === 'ended';
  const contextSuspended = state.audioContext?.state === 'suspended';

  if (contextSuspended && !trackEnded && state.audioContext) {
    try {
      await state.audioContext.resume();
      state.isListening = true;
      return;
    } catch {
      // Fall through to full restart
    }
  }

  if (!state.isListening || trackEnded || contextSuspended) {
    await startPitchDetection();
  }
}
