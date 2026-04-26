<template>
  <Transition name="feedback-fade">
    <div
      v-show="gameStore.feedbackVisible"
      class="feedback"
      :class="{
        correct: gameStore.feedbackType === 'correct',
        incorrect: gameStore.feedbackType === 'incorrect'
      }"
    >{{ gameStore.feedbackMessage }}</div>
  </Transition>
</template>

<script setup lang="ts">
import { useGameStore } from '../stores/game';

const gameStore = useGameStore();
</script>
