<template>
  <div class="controls">
    <div class="control-group">
      <label for="level-select">Level:</label>
      <select id="level-select" :value="gameStore.level" @change="onLevelChange">
        <option value="1">Level 1 - C only</option>
        <option value="2">Level 2 - C, G</option>
        <option value="3">Level 3 - C, G, F</option>
        <option value="4">Level 4 - C, G, F, D</option>
        <option value="5">Level 5 - C, G, F, D, A</option>
        <option value="6">Level 6 - C, G, F, D, A, E</option>
        <option value="7">Level 7 - All notes</option>
      </select>
    </div>

    <div class="control-group">
      <label for="clef-select">Clef:</label>
      <select id="clef-select" :value="gameStore.clef" @change="onClefChange">
        <option value="treble">Treble</option>
        <option value="bass">Bass</option>
        <option value="grand">Grand Staff</option>
      </select>
    </div>

    <div class="control-group">
      <label>Input Mode:</label>
      <div class="toggle-group">
        <button
          class="toggle-btn"
          :class="{ active: gameStore.inputMode === 'microphone' }"
          @click="$emit('switchMode', 'microphone')"
        >🎤 Microphone</button>
        <button
          class="toggle-btn"
          :class="{ active: gameStore.inputMode === 'keyboard' }"
          @click="$emit('switchMode', 'keyboard')"
        >🎹 Keyboard</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGameStore } from '../stores/game';
import { useNoteSession } from '../composables/useNoteSession';

const gameStore = useGameStore();
const { nextNote } = useNoteSession();

defineEmits<{
  switchMode: [mode: 'microphone' | 'keyboard'];
}>();

function onLevelChange(e: Event): void {
  gameStore.level = parseInt((e.target as HTMLSelectElement).value);
  nextNote();
}

function onClefChange(e: Event): void {
  gameStore.clef = (e.target as HTMLSelectElement).value;
  nextNote();
}
</script>
