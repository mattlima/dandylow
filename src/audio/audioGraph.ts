import type { PitchDetector } from 'pitchy';

/**
 * Non-reactive container for Web Audio graph objects.
 * These must NOT be wrapped in Vue reactivity (Proxy breaks Web Audio internals).
 * Both microphone.ts and pitchDetection.ts import from here to avoid a circular dependency.
 */
export const audioGraph = {
    audioContext: null as AudioContext | null,
    micStream: null as MediaStream | null,
    micSource: null as MediaStreamAudioSourceNode | null,
    analyser: null as AnalyserNode | null,
    detector: null as PitchDetector<Float32Array> | null,
    animationFrameId: null as number | null,
};
