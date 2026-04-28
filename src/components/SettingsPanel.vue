<template>
    <div class="settings-overlay" @click.self="$emit('close')">
        <div class="settings-panel">
            <div class="settings-header">
                <h2>Settings</h2>
                <button class="settings-close-btn" @click="$emit('close')">✕</button>
            </div>

            <div class="settings-tabs" role="tablist" aria-label="Settings tabs">
                <button class="settings-tab-btn" :class="{ active: activeTab === 'basic' }" role="tab"
                    :aria-selected="activeTab === 'basic'" @click="activeTab = 'basic'">
                    Basic
                </button>
                <button class="settings-tab-btn" :class="{ active: activeTab === 'advanced' }" role="tab"
                    :aria-selected="activeTab === 'advanced'" @click="activeTab = 'advanced'">
                    Advanced
                </button>
            </div>

            <div v-if="activeTab === 'basic'">
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
                                        :title="'Detection threshold: ' + Math.round(thresholdPercent) + '%'">
                                    </div>
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
                            <input id="settings-sens-slider" type="range" :min="sensitivityMinLevel"
                                :max="sensitivityMaxLevel" step="1" v-model.number="sensitivityLevel" />
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

            <div v-else>
                <div class="settings-group">
                    <div class="advanced-header-row">
                        <label>Advanced Tuning</label>
                        <button class="btn-secondary" @click="resetAdvancedDefaults">Reset To Defaults</button>
                    </div>
                    <p class="advanced-note">
                        Changes are saved immediately to this profile and used in real time.
                    </p>
                </div>

                <div class="settings-group">
                    <label>Detection</label>
                    <div class="advanced-grid">
                        <label class="advanced-field">
                            <span>Min Clarity</span>
                            <input type="number" step="0.01" min="0.5" max="0.99"
                                v-model.number="advancedSettingsLocal.detection.minClarity" />
                        </label>
                        <label class="advanced-field">
                            <span>Min Volume Floor</span>
                            <input type="number" step="0.0001" min="0.0001" max="0.5"
                                v-model.number="advancedSettingsLocal.detection.minVolume" />
                        </label>
                        <label class="advanced-field">
                            <span>Required Stable (ms)</span>
                            <input type="number" step="10" min="50" max="2000"
                                v-model.number="advancedSettingsLocal.detection.requiredStableMs" />
                        </label>
                        <label class="advanced-field">
                            <span>Max Frame Gap (ms)</span>
                            <input type="number" step="1" min="16" max="1000"
                                v-model.number="advancedSettingsLocal.detection.maxFrameGapMs" />
                        </label>
                        <label class="advanced-field">
                            <span>Trigger Cooldown (ms)</span>
                            <input type="number" step="10" min="0" max="2000"
                                v-model.number="advancedSettingsLocal.detection.triggerCooldownMs" />
                        </label>
                        <label class="advanced-field">
                            <span>Silence Gate Volume</span>
                            <input type="number" step="0.0001" min="0.0001" max="0.5"
                                v-model.number="advancedSettingsLocal.detection.silenceGateVolume" />
                        </label>
                        <label class="advanced-field">
                            <span>Silence Gate Time (ms)</span>
                            <input type="number" step="10" min="0" max="2000"
                                v-model.number="advancedSettingsLocal.detection.silenceGateRequiredMs" />
                        </label>
                        <label class="advanced-field">
                            <span>Cents Tolerance</span>
                            <input type="number" step="1" min="1" max="100"
                                v-model.number="advancedSettingsLocal.detection.centsTolerance" />
                        </label>
                    </div>
                </div>

                <div class="settings-group">
                    <label>Progression</label>
                    <div class="advanced-grid">
                        <label class="advanced-field">
                            <span>Min Presentations</span>
                            <input type="number" step="1" min="1" max="200"
                                v-model.number="advancedSettingsLocal.progression.minPresentations" />
                        </label>
                        <label class="advanced-field">
                            <span>Min Streak</span>
                            <input type="number" step="1" min="1" max="100"
                                v-model.number="advancedSettingsLocal.progression.minStreak" />
                        </label>
                    </div>
                </div>

                <div class="settings-group">
                    <label>Note Selection</label>
                    <div class="advanced-grid">
                        <label class="advanced-field">
                            <span>Seen Note Weight Floor</span>
                            <input type="number" step="0.01" min="0.05" max="1"
                                v-model.number="advancedSettingsLocal.noteSelection.minSeenNoteWeight" />
                        </label>
                        <label class="advanced-field">
                            <span>Streak Decay Rate</span>
                            <input type="number" step="0.01" min="0" max="2"
                                v-model.number="advancedSettingsLocal.noteSelection.streakDecayRate" />
                        </label>
                        <label class="advanced-field">
                            <span>Miss Rate Boost</span>
                            <input type="number" step="0.01" min="0" max="2"
                                v-model.number="advancedSettingsLocal.noteSelection.missRateBoost" />
                        </label>
                    </div>
                </div>

                <div class="settings-group">
                    <label>Timing + Audio Graph</label>
                    <div class="advanced-grid">
                        <label class="advanced-field">
                            <span>Keyboard Auto-Advance (ms)</span>
                            <input type="number" step="10" min="0" max="5000"
                                v-model.number="advancedSettingsLocal.gameplayTiming.keyboardAutoAdvanceMs" />
                        </label>
                        <label class="advanced-field">
                            <span>Incorrect Feedback Hide (ms)</span>
                            <input type="number" step="10" min="0" max="5000"
                                v-model.number="advancedSettingsLocal.gameplayTiming.incorrectFeedbackAutohideMs" />
                        </label>
                        <label class="advanced-field">
                            <span>Analyzer FFT Size</span>
                            <input type="number" step="256" min="256" max="32768"
                                v-model.number="advancedSettingsLocal.microphone.analyserFftSize" />
                        </label>
                    </div>
                </div>
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
    defaultAdvancedSettings,
    resolveAdvancedSettings,
    type AdvancedSettings,
    SENSITIVITY_CONFIG,
    clampSensitivityLevel,
    sensitivityLevelToVolumeThreshold,
    sensitivityLevelToLabel,
    VOLUME_PERCENT_MULTIPLIER
} from '../constants';

const gameStore = useGameStore();
const audioStore = useAudioStore();
const profilesStore = useProfilesStore();
const { nextSequence } = useNoteSession();

const activating = ref(false);
const activeTab = ref<'basic' | 'advanced'>('basic');
const sensitivityLevel = ref<number>(
    clampSensitivityLevel(
        profilesStore.activeProfile?.preferences.sensitivityLevel ?? SENSITIVITY_CONFIG.defaultLevel
    )
);
const sequenceLengthLocal = ref<number>(gameStore.sequenceLength);
const advancedSettingsLocal = ref<AdvancedSettings>(
    resolveAdvancedSettings(profilesStore.activeProfile?.preferences.advancedSettings)
);
const syncingAdvancedFromProfile = ref(false);
const sensitivityMinLevel = SENSITIVITY_CONFIG.minLevel;
const sensitivityMaxLevel = SENSITIVITY_CONFIG.maxLevel;

defineEmits<{
    close: [];
    switchMode: [mode: 'microphone' | 'keyboard'];
}>();

const sensitivityLabel = computed(() => {
    return sensitivityLevelToLabel(sensitivityLevel.value);
});

const isUltraSensitivity = computed(() =>
    sensitivityLevel.value > SENSITIVITY_CONFIG.legacyMaxLevel
);

const thresholdPercent = computed(() => {
    const floor = advancedSettingsLocal.value.detection.minVolume;
    const effectiveThreshold = Math.max(audioStore.volumeThreshold, floor);
    return Math.min(100, effectiveThreshold * VOLUME_PERCENT_MULTIPLIER);
});

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

watch(
    () => profilesStore.activeProfile?.preferences.advancedSettings,
    (savedSettings) => {
        syncingAdvancedFromProfile.value = true;
        advancedSettingsLocal.value = resolveAdvancedSettings(savedSettings);
        syncingAdvancedFromProfile.value = false;
    },
    { immediate: true, deep: true }
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
    advancedSettingsLocal,
    (nextSettings, prevSettings) => {
        if (syncingAdvancedFromProfile.value) return;
        const normalized = resolveAdvancedSettings(nextSettings);
        const id = profilesStore.activeProfileId;
        if (id) {
            profilesStore.updatePreferences(id, { advancedSettings: normalized });
        }
        if (
            prevSettings &&
            nextSettings.microphone.analyserFftSize !== prevSettings.microphone.analyserFftSize &&
            audioStore.isListening &&
            gameStore.inputMode === 'microphone'
        ) {
            startPitchDetection();
        }
    },
    { deep: true }
);

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

function resetAdvancedDefaults(): void {
    advancedSettingsLocal.value = defaultAdvancedSettings();
}
</script>
