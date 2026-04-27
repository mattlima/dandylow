<template>
    <div class="container entry-screen">
        <header>
            <h1>🎵 Sight Reading Practice 🎵</h1>
            <p class="subtitle">Learn to read music with the Dandelot method!</p>
        </header>

        <!-- Step 1: Profile selection -->
        <section class="entry-section">
            <h2>Who's playing?</h2>

            <div class="profile-list" v-if="profileList.length">
                <button v-for="p in profileList" :key="p.id" class="profile-btn"
                    :class="{ active: selectedProfileId === p.id }" @click="selectProfile(p.id)">
                    <span class="profile-btn-name">{{ p.name }}</span>
                    <span v-if="p.id === profilesStore.activeProfileId" class="profile-last-used">last used</span>
                    <span v-if="selectedProfileId === p.id" class="profile-btn-check">✓</span>
                </button>
            </div>

            <div class="new-profile-divider">
                <span>{{ profileList.length ? 'or add a new player' : 'Create your first player' }}</span>
            </div>

            <div class="new-profile-row">
                <input v-model="newName" class="new-profile-input" placeholder="New player name..." maxlength="30"
                    @keydown.enter="createAndSelect" />
                <button class="btn-secondary" :disabled="!newName.trim()" @click="createAndSelect">
                    Add Player
                </button>
            </div>
        </section>

        <!-- Step 2: Audio setup (only once a profile is selected) -->
        <section class="entry-section" v-if="selectedProfileId">
            <h2>{{ selectedInputMode === 'microphone' ? '🎤 Microphone Setup' : '⌨️ Input Mode' }}</h2>

            <template v-if="selectedInputMode === 'microphone'">
                <p class="mic-permission-note">
                    🔒 Your browser will ask for microphone access — please click <strong>Allow</strong> when prompted.
                </p>

                <div v-if="!micActivated" class="mic-activate-row">
                    <button class="btn-primary" :disabled="activating" @click="activateMic">
                        {{ activating ? '⏳ Connecting...' : '🎤 Activate Microphone' }}
                    </button>
                    <button class="btn-text" @click="switchToKeyboard">Use keyboard mode instead</button>
                </div>

                <div v-else class="mic-calibration">
                    <p class="mic-status-ok">✅ Microphone connected — sing or hum to test the meter below.</p>

                    <div class="volume-meter-container">
                        <div class="volume-meter-label">
                            <span>Volume</span>
                            <span class="volume-level">{{ Math.round(audioStore.volumePercent) }}%</span>
                        </div>
                        <div class="volume-meter">
                            <div class="volume-bar"
                                :style="{ width: audioStore.volumePercent + '%', background: calibrationBarColor }">
                            </div>
                            <!-- Detection threshold marker -->
                            <div class="volume-threshold-marker" :style="{ left: thresholdPercent + '%' }"
                                :title="'Detection threshold: ' + Math.round(thresholdPercent) + '%'"></div>
                        </div>
                        <div class="volume-threshold-legend">
                            <span class="thresh-label">Threshold: {{ Math.round(thresholdPercent) }}%</span>
                            <span :class="audioStore.volumePercent >= thresholdPercent ? 'thresh-ok' : 'thresh-low'">
                                {{ volumeLevelMessage }}
                            </span>
                        </div>
                    </div>

                    <div class="sensitivity-row">
                        <label class="sensitivity-label" for="sens-slider">
                            Microphone Sensitivity: <strong>{{ sensitivityLabel }}</strong>
                        </label>
                        <input id="sens-slider" type="range" min="1" max="10" step="1"
                            v-model.number="sensitivityLevel" />
                        <div class="sensitivity-hints">
                            <span>Less sensitive (louder input needed)</span>
                            <span>More sensitive</span>
                        </div>
                    </div>
                </div>
            </template>

            <template v-else>
                <p class="keyboard-mode-note">
                    ⌨️ Keyboard mode selected — no microphone needed.
                    <button class="btn-text" @click="switchToMicrophone">Switch to microphone mode</button>
                </p>
            </template>
        </section>

        <!-- Start button -->
        <div class="start-row">
            <button class="btn-start" :disabled="!selectedProfileId" @click="startPlaying">
                Start Playing →
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useProfilesStore } from '../stores/profiles';
import { useAudioStore } from '../stores/audio';
import { useGameStore } from '../stores/game';
import { startPitchDetection } from '../audio/microphone';

const profilesStore = useProfilesStore();
const audioStore = useAudioStore();
const gameStore = useGameStore();

// Profile selection
const profileList = computed(() => Object.values(profilesStore.profiles));
const selectedProfileId = ref<string | null>(profilesStore.activeProfileId);
const newName = ref('');

// Mic calibration state
const micActivated = ref(false);
const activating = ref(false);
const sensitivityLevel = ref<number>(
    profilesStore.activeProfile?.preferences.sensitivityLevel ?? 5
);

// Input mode of the currently selected profile
const selectedInputMode = computed<'microphone' | 'keyboard'>(() => {
    if (!selectedProfileId.value) return 'microphone';
    const profile = profilesStore.profiles[selectedProfileId.value];
    return profile?.preferences.inputMode ?? 'microphone';
});

const sensitivityLabel = computed(() => {
    if (sensitivityLevel.value <= 3) return 'Low';
    if (sensitivityLevel.value <= 7) return 'Medium';
    return 'High';
});

// Position of the threshold marker on the volume meter (same scale as volumePercent)
const thresholdPercent = computed(() => Math.min(100, audioStore.volumeThreshold * 1000));

// Color the calibration bar against the actual threshold (not the hardcoded > 5 check)
const calibrationBarColor = computed(() =>
    audioStore.volumePercent >= thresholdPercent.value ? '#28a745' : '#dc3545'
);

const volumeLevelMessage = computed(() =>
    audioStore.volumePercent >= thresholdPercent.value
        ? '✅ Good level'
        : '🔴 Sing louder or raise sensitivity'
);

// sensitivityLevel 5 = 0.030 (current default); formula: 0.005 * (11 - level)
function sensitivityToThreshold(level: number): number {
    return 0.005 * (11 - level);
}

// Apply threshold change in real-time while the user drags the slider
watch(sensitivityLevel, (level) => {
    audioStore.volumeThreshold = sensitivityToThreshold(level);
});

function selectProfile(id: string): void {
    selectedProfileId.value = id;
    micActivated.value = false;
    const profile = profilesStore.profiles[id];
    const savedLevel = profile?.preferences.sensitivityLevel ?? 5;
    sensitivityLevel.value = savedLevel;
    audioStore.volumeThreshold = sensitivityToThreshold(savedLevel);
}

function createAndSelect(): void {
    const name = newName.value.trim();
    if (!name) return;
    const profile = profilesStore.createProfile(name);
    newName.value = '';
    selectProfile(profile.id);
}

async function activateMic(): Promise<void> {
    activating.value = true;
    await startPitchDetection();
    activating.value = false;
    micActivated.value = true;
}

function switchToKeyboard(): void {
    const id = selectedProfileId.value;
    if (!id) return;
    profilesStore.updatePreferences(id, { inputMode: 'keyboard' });
}

function switchToMicrophone(): void {
    const id = selectedProfileId.value;
    if (!id) return;
    profilesStore.updatePreferences(id, { inputMode: 'microphone' });
    micActivated.value = false;
}

function startPlaying(): void {
    const id = selectedProfileId.value;
    if (!id) return;

    // Save current sensitivity to profile
    profilesStore.updatePreferences(id, { sensitivityLevel: sensitivityLevel.value });

    // Apply threshold
    audioStore.volumeThreshold = sensitivityToThreshold(sensitivityLevel.value);

    // Apply profile preferences to game store.
    // Clef and level are finalized on the interstitial clef selection screen.
    const prefs = profilesStore.profiles[id]?.preferences;
    if (prefs) {
        gameStore.inputMode = prefs.inputMode;
        gameStore.sequenceLength = prefs.sequenceLength ?? 10;
    }

    // Set this as the active profile
    profilesStore.setActiveProfile(id);

    // Route to clef interstitial; selected clef then starts the game.
    gameStore.screen = 'clef-select';
}
</script>
