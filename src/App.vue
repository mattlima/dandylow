<template>
  <div class="container">
    <header>
      <h1>🎵 Sight Reading Practice 🎵</h1>
      <p class="subtitle">Learn to read music with the Dandelot method!</p>
    </header>

    <ControlsPanel @switch-mode="switchInputMode" />
    <ScoreBoard />
    <StaffView />
    <FeedbackBanner />
    <PitchPanel />
    <KeyboardPanel />
    <SessionActions />
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useGameStore } from './stores/game';
import { useProfilesStore } from './stores/profiles';
import { useMicrophone } from './composables/useMicrophone';
import { useNoteSession } from './composables/useNoteSession';
import ControlsPanel from './components/ControlsPanel.vue';
import ScoreBoard from './components/ScoreBoard.vue';
import StaffView from './components/StaffView.vue';
import FeedbackBanner from './components/FeedbackBanner.vue';
import PitchPanel from './components/PitchPanel.vue';
import KeyboardPanel from './components/KeyboardPanel.vue';
import SessionActions from './components/SessionActions.vue';

const gameStore = useGameStore();
const profilesStore = useProfilesStore();
const { startMic, stopMic } = useMicrophone();
const { nextNote } = useNoteSession();

onMounted(() => {
  // Apply active profile preferences if one is loaded
  const prefs = profilesStore.activeProfile?.preferences;
  if (prefs) {
    gameStore.level = prefs.level;
    gameStore.clef = prefs.clef;
    gameStore.inputMode = prefs.inputMode;
  }
  nextNote();
});

// Persist preference changes back to active profile
watch(
  () => ({ level: gameStore.level, clef: gameStore.clef, inputMode: gameStore.inputMode }),
  (prefs) => {
    const id = profilesStore.activeProfileId;
    if (id) profilesStore.updatePreferences(id, prefs);
  }
);

async function switchInputMode(mode: 'microphone' | 'keyboard'): Promise<void> {
  gameStore.inputMode = mode;
  if (mode === 'microphone') {
    await startMic();
  } else {
    stopMic();
  }
}
</script>

