<template>
  <div class="pitch-display" :class="{ hidden: gameStore.inputMode === 'keyboard' }">
    <div class="pitch-info">
      <span
        class="status-indicator"
        :class="{ active: audioStore.micStatusActive }"
      >{{ audioStore.micStatusText }}</span>
      <span class="detected-pitch">{{ audioStore.detectedPitch }}</span>
    </div>
    <div class="volume-meter-container">
      <div class="volume-meter-label">
        <span>Sound Level:</span>
        <span class="volume-level" :style="{ color: audioStore.volumeColor }">
          {{ Math.round(audioStore.volumePercent) }}%
        </span>
      </div>
      <div class="volume-meter">
        <div class="volume-bar" :style="{ width: audioStore.volumePercent + '%' }"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGameStore } from '../stores/game';
import { useAudioStore } from '../stores/audio';

const gameStore = useGameStore();
const audioStore = useAudioStore();
</script>
