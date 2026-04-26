<template>
  <div id="staff-container" ref="containerRef"></div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useGameStore } from '../stores/game';
import { renderStaff } from '../ui/render';

const gameStore = useGameStore();
const containerRef = ref<HTMLDivElement | null>(null);

function render(): void {
  if (gameStore.currentNote && gameStore.clef) {
    renderStaff(gameStore.currentNote, gameStore.clef);
  }
}

onMounted(render);

watch(
  () => [gameStore.currentNote, gameStore.clef] as const,
  render
);
</script>
