<template>
  <div class="action-buttons">
    <button class="btn btn-primary" :disabled="!gameStore.sequenceComplete" @click="nextSequence">Next Sequence</button>
    <button class="btn btn-secondary" @click="resetSession">Reset Session</button>
  </div>
</template>

<script setup lang="ts">
import { useGameStore } from '../stores/game';
import { useNoteSession } from '../composables/useNoteSession';

const gameStore = useGameStore();
const { nextSequence, resetSession } = useNoteSession();
</script>
