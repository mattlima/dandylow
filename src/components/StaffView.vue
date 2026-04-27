<template>
  <div class="staff-wrapper">
    <div id="staff-container" ref="containerRef"></div>
    <Transition name="seq-complete">
      <div v-if="gameStore.sequenceComplete && gameStore.pendingLevelUp === null" class="seq-complete-overlay">
        <button class="btn btn-primary seq-next-btn" @click="nextSequence">Next Sequence ▶</button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useGameStore } from '../stores/game';
import { renderStaff } from '../ui/render';
import { useNoteSession } from '../composables/useNoteSession';

const { nextSequence } = useNoteSession();

const gameStore = useGameStore();
const containerRef = ref<HTMLDivElement | null>(null);

function render(): void {
  if (gameStore.sequence.length > 0 && gameStore.clef) {
    renderStaff(gameStore.sequence, gameStore.currentSequenceIndex, gameStore.clef);
  }
}

onMounted(render);

watch(
  () => [gameStore.sequence, gameStore.currentSequenceIndex, gameStore.clef] as const,
  render
);
</script>
