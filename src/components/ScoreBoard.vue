<template>
  <div class="score-board">
    <div class="score-item">
      <span class="score-label">Clef</span>
      <span class="score-value">{{ clefLabel }}</span>
    </div>
    <div class="score-divider"></div>
    <div class="score-item">
      <span class="score-label">Level</span>
      <span class="score-value">{{ gameStore.level }}</span>
    </div>
    <div class="score-divider"></div>
    <div class="score-item">
      <span class="score-label">Level Accuracy</span>
      <span class="score-value">{{ displayAccuracy }}</span>
    </div>
    <div class="score-divider"></div>
    <div class="score-item">
      <span class="score-label">Session</span>
      <span class="score-value">{{ gameStore.score.correct }}/{{ gameStore.score.total }}</span>
    </div>
    <div class="score-divider"></div>
    <div class="score-item">
      <span class="score-label">Streak</span>
      <span class="score-value">{{ gameStore.streak }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '../stores/game';
import { useProfilesStore } from '../stores/profiles';
import { levelAccuracy } from '../game/progression';

const gameStore = useGameStore();
const profilesStore = useProfilesStore();

const clefLabel = computed<string>(() => {
  if (gameStore.clef === 'treble') return '𝄞 Treble';
  if (gameStore.clef === 'bass') return '𝄢 Bass';
  return '𝄞𝄢 Grand';
});

const displayAccuracy = computed<string>(() => {
  const stats = profilesStore.activeProfile?.pitchStats ?? {};
  const pct = levelAccuracy(gameStore.level, gameStore.clef, stats);
  return pct === null ? '–' : `${pct}%`;
});
</script>
