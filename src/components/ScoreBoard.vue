<template>
  <div class="score-board">
    <div class="score-item">
      <span class="score-label">Score:</span>
      <span class="score-value">{{ gameStore.score.correct }} / {{ gameStore.score.total }}</span>
    </div>
    <div class="score-item">
      <span class="score-label">Accuracy:</span>
      <span class="score-value">{{ gameStore.accuracy }}%</span>
    </div>
    <div class="score-item">
      <span class="score-label">Streak:</span>
      <span class="score-value">{{ gameStore.streak }} 🔥</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGameStore } from '../stores/game';

const gameStore = useGameStore();
</script>
