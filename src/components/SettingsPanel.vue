<template>
    <div class="settings-overlay" @click.self="$emit('close')">
        <div class="settings-panel">
            <div class="settings-header">
                <h2>Settings</h2>
                <button class="settings-close-btn" @click="$emit('close')">✕</button>
            </div>

            <div class="settings-group">
                <label for="settings-clef-select">Clef</label>
                <select id="settings-clef-select" :value="gameStore.clef" @change="onClefChange">
                    <option value="treble">Treble</option>
                    <option value="bass">Bass</option>
                    <option value="grand">Grand Staff</option>
                </select>
            </div>

            <div class="settings-group">
                <label>Input Mode</label>
                <div class="toggle-group">
                    <button class="toggle-btn" :class="{ active: gameStore.inputMode === 'microphone' }"
                        @click="$emit('switchMode', 'microphone')">🎤 Microphone</button>
                    <button class="toggle-btn" :class="{ active: gameStore.inputMode === 'keyboard' }"
                        @click="$emit('switchMode', 'keyboard')">🎹 Keyboard</button>
                </div>
            </div>

            <div class="settings-group">
                <label for="settings-seq-length">Sequence Length</label>
                <div class="sequence-length-row">
                    <input id="settings-seq-length" type="range" min="4" max="30" step="1"
                        v-model.number="sequenceLengthLocal" />
                    <span class="sequence-length-value">{{ sequenceLengthLocal }} notes</span>
                </div>
            </div>

            <div class="settings-group">
                <label>Microphone Level</label>

                <template v-if="gameStore.inputMode === 'microphone'">
                    <p class="mic-permission-note" v-if="!audioStore.isListening">
                        🎤 Click below to activate the microphone, then sing or play to verify the level crosses the
                        threshold.
                    </p>

                    <button v-if="!audioStore.isListening" class="btn-primary settings-activate-btn"
                        :disabled="activating" @click="activateMic">
                        {{ activating ? '⏳ Connecting...' : '🎤 Activate Microphone' }}
                    </button>

                    <div v-else>
                        <div class="volume-meter-container">
                            <div class="volume-meter-label">
                                <span>Volume</span>
                                <span class="volume-level">{{ Math.round(audioStore.volumePercent) }}%</span>
                            </div>
                            <div class="volume-meter">
                                <div class="volume-bar"
                                    :style="{ width: audioStore.volumePercent + '%', background: calibrationBarColor }">
                                </div>
                                <div class="volume-threshold-marker" :style="{ left: thresholdPercent + '%' }"
                                    :title="'Detection threshold: ' + Math.round(thresholdPercent) + '%'"></div>
                            </div>
                            <div class="volume-threshold-legend">
                                <span class="thresh-label">Threshold: {{ Math.round(thresholdPercent) }}%</span>
                                <span
                                    :class="audioStore.volumePercent >= thresholdPercent ? 'thresh-ok' : 'thresh-low'">
                                    {{ volumeLevelMessage }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div class="sensitivity-row">
                        <label class="sensitivity-label" for="settings-sens-slider">
                            Microphone Sensitivity: <strong>{{ sensitivityLabel }}</strong>
                        </label>
                        <input id="settings-sens-slider" type="range" :min="sensitivityMinLevel" :max="sensitivityMaxLevel" step="1"
                            v-model.number="sensitivityLevel" />
                        <div class="sensitivity-hints">
                            <span>Less sensitive (louder input needed)</span>
                            <span>More sensitive</span>
                        </div>
                        <p v-if="isUltraSensitivity" class="sensitivity-tip">
                            Ultra mode (11-15) is tuned for low-gain mobile microphones like iPad.
                        </p>
                    </div>
                </template>

                <template v-else>
                    <p class="keyboard-mode-note">
                        ⌨️ Keyboard mode is active. To enable microphone tools, switch Input Mode to
                        <strong>Microphone</strong> above.
                    </p>
                </template>
            </div>
            <div class="settings-group settings-group--danger">
                <label>Reset Progress</label>
                <p class="reset-data-note">Clears all pitch stats and scores for <strong>{{
                    profilesStore.activeProfile?.name
                        }}</strong>. This cannot be undone.</p>
                <template v-if="!confirmingReset">
                    <button class="btn-danger" @click="confirmingReset = true">🗑 Reset All Data</button>
                </template>
                <template v-else>
                    <p class="reset-data-confirm-msg">Are you sure? All progress will be lost.</p>
                    <div class="reset-data-actions">
                        <button class="btn-danger" @click="doReset">Yes, reset everything</button>
                        <button class="btn-secondary" @click="confirmingReset = false">Cancel</button>
                    </div>
                </template>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useGameStore } from '../stores/game';
import { useAudioStore } from '../stores/audio';
import { useProfilesStore } from '../stores/profiles';
import { useNoteSession } from '../composables/useNoteSession';
import { startPitchDetection } from '../audio/microphone';
import {
    SENSITIVITY_CONFIG,
    clampSensitivityLevel,
    sensitivityLevelToVolumeThreshold
} from '../constants';

const gameStore = useGameStore();
const audioStore = useAudioStore();
const profilesStore = useProfilesStore();
const { nextSequence } = useNoteSession();

const activating = ref(false);
const sensitivityLevel = ref<number>(
    clampSensitivityLevel(
        profilesStore.activeProfile?.preferences.sensitivityLevel ?? SENSITIVITY_CONFIG.defaultLevel
    )
);
const sequenceLengthLocal = ref<number>(gameStore.sequenceLength);
const sensitivityMinLevel = SENSITIVITY_CONFIG.minLevel;
const sensitivityMaxLevel = SENSITIVITY_CONFIG.maxLevel;

defineEmits<{
    close: [];
    switchMode: [mode: 'microphone' | 'keyboard'];
}>();

const sensitivityLabel = computed(() => {
    if (sensitivityLevel.value <= 5) return 'Low';
    if (sensitivityLevel.value <= 10) return 'Medium';
    if (sensitivityLevel.value <= 13) return 'High';
    return 'Ultra';
});

const isUltraSensitivity = computed(() =>
    sensitivityLevel.value > SENSITIVITY_CONFIG.legacyMaxLevel
);

const thresholdPercent = computed(() => Math.min(100, audioStore.volumeThreshold * 1000));

const calibrationBarColor = computed(() =>
    audioStore.volumePercent >= thresholdPercent.value ? '#28a745' : '#dc3545'
);

const volumeLevelMessage = computed(() =>
    audioStore.volumePercent >= thresholdPercent.value
        ? '✅ Good level'
        : '🔴 Sing louder or raise sensitivity'
);

watch(
    () => profilesStore.activeProfile?.preferences.sensitivityLevel,
    (savedLevel) => {
        const level = clampSensitivityLevel(savedLevel ?? SENSITIVITY_CONFIG.defaultLevel);
        sensitivityLevel.value = level;
        audioStore.volumeThreshold = sensitivityLevelToVolumeThreshold(level);
    },
    { immediate: true }
);

watch(sensitivityLevel, (level) => {
    const normalizedLevel = clampSensitivityLevel(level);
    if (normalizedLevel !== level) {
        sensitivityLevel.value = normalizedLevel;
        return;
    }

    const threshold = sensitivityLevelToVolumeThreshold(normalizedLevel);
    audioStore.volumeThreshold = threshold;
    const id = profilesStore.activeProfileId;
    if (id) {
        profilesStore.updatePreferences(id, { sensitivityLevel: normalizedLevel });
    }
});

watch(sequenceLengthLocal, (len) => {
    gameStore.sequenceLength = len;
    const id = profilesStore.activeProfileId;
    if (id) profilesStore.updatePreferences(id, { sequenceLength: len });
});

watch(
    () => gameStore.sequenceLength,
    (len) => { sequenceLengthLocal.value = len; }
);

function onClefChange(e: Event): void {
    gameStore.clef = (e.target as HTMLSelectElement).value;
    nextSequence();
}

async function activateMic(): Promise<void> {
    activating.value = true;
    await startPitchDetection();
    activating.value = false;
}

const confirmingReset = ref(false);

function doReset(): void {
    profilesStore.resetActiveProfileData();
    gameStore.resetScore();
    confirmingReset.value = false;
}
</script>
