import { computed } from 'vue';
import { useAudioStore } from '../stores/audio';

export function usePitchDetection() {
    const audioStore = useAudioStore();

    const detectedPitch = computed(() => audioStore.detectedPitch);
    const volumePercent = computed(() => audioStore.volumePercent);
    const volumeColor = computed(() => audioStore.volumeColor);
    const isListening = computed(() => audioStore.isListening);

    return { detectedPitch, volumePercent, volumeColor, isListening };
}
