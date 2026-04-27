<template>
  <EntryScreen v-if="gameStore.screen === 'entry'" />
  <ClefSelectScreen v-else-if="gameStore.screen === 'clef-select'" />

  <div v-else class="container">
    <header class="game-header">
      <button class="settings-open-btn" @click="settingsOpen = true">⚙️ Settings</button>
      <div class="game-header-line">
        <h1>🎵 Sight Reading Practice 🎵</h1>
        <p class="subtitle">Learn to read music with the Dandelot method!</p>
      </div>
    </header>

    <ScoreBoard />
    <StaffView />
    <FeedbackBanner />
    <PitchPanel v-if="gameStore.inputMode === 'microphone'" />
    <p v-else class="keyboard-mic-note">
      Microphone tools are hidden in keyboard mode. Open Settings and switch Input Mode to Microphone to enable them.
    </p>
    <ControlsPanel />
    <KeyboardPanel />
    <SessionActions />

    <SettingsPanel v-if="settingsOpen" @close="settingsOpen = false" @switch-mode="switchInputMode" />
    <LevelUpModal v-if="gameStore.pendingLevelUp !== null" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useGameStore } from './stores/game';
import { useProfilesStore } from './stores/profiles';
import { useMicrophone } from './composables/useMicrophone';
import { nextUnlockedLevel } from './game/progression';
import ControlsPanel from './components/ControlsPanel.vue';
import ScoreBoard from './components/ScoreBoard.vue';
import StaffView from './components/StaffView.vue';
import FeedbackBanner from './components/FeedbackBanner.vue';
import PitchPanel from './components/PitchPanel.vue';
import KeyboardPanel from './components/KeyboardPanel.vue';
import SessionActions from './components/SessionActions.vue';
import EntryScreen from './components/EntryScreen.vue';
import ClefSelectScreen from './components/ClefSelectScreen.vue';
import SettingsPanel from './components/SettingsPanel.vue';
import LevelUpModal from './components/LevelUpModal.vue';

const gameStore = useGameStore();
const profilesStore = useProfilesStore();
const { startMic, stopMic } = useMicrophone();
const settingsOpen = ref(false);

// Persist in-game preference changes (level, clef, inputMode, sequenceLength) back to active profile
watch(
  () => ({ level: gameStore.level, clef: gameStore.clef, inputMode: gameStore.inputMode, sequenceLength: gameStore.sequenceLength }),
  (prefs) => {
    const id = profilesStore.activeProfileId;
    if (id) profilesStore.updatePreferences(id, prefs);
  }
);

// Restore the correct level when a profile is activated (overrides preferences.level with earned level)
watch(
  () => profilesStore.activeProfileId,
  (id) => {
    if (!id) return;
    const stats = profilesStore.activeProfile?.pitchStats ?? {};
    gameStore.level = nextUnlockedLevel(gameStore.clef, stats);
  }
);

// Re-evaluate unlocked level when clef changes mid-session
watch(
  () => gameStore.clef,
  (clef) => {
    const stats = profilesStore.activeProfile?.pitchStats ?? {};
    gameStore.level = nextUnlockedLevel(clef, stats);
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
