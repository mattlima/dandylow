<template>
  <div class="keyboard-container" :class="{ hidden: gameStore.inputMode !== 'keyboard' }">
    <div class="piano-keyboard" ref="keyboardRef">
      <button class="key white" data-note="C">C</button>
      <button class="key black" data-note="C#">C#</button>
      <button class="key white" data-note="D">D</button>
      <button class="key black" data-note="D#">D#</button>
      <button class="key white" data-note="E">E</button>
      <button class="key white" data-note="F">F</button>
      <button class="key black" data-note="F#">F#</button>
      <button class="key white" data-note="G">G</button>
      <button class="key black" data-note="G#">G#</button>
      <button class="key white" data-note="A">A</button>
      <button class="key black" data-note="A#">A#</button>
      <button class="key white" data-note="B">B</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useGameStore } from '../stores/game';
import { useKeyboardInput } from '../composables/useKeyboardInput';

const gameStore = useGameStore();
const keyboardRef = ref<HTMLDivElement | null>(null);
const { handleKeyPress } = useKeyboardInput();

onMounted(() => {
  if (!keyboardRef.value) return;
  keyboardRef.value.querySelectorAll<HTMLButtonElement>('.key').forEach((key) => {
    key.addEventListener('click', () => {
      const note = key.dataset['note'];
      if (!note) return;
      key.classList.add('active');
      setTimeout(() => key.classList.remove('active'), 200);
      handleKeyPress(note);
    });
  });
});
</script>
