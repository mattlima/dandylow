export type NoteRangeMap = Record<string, string[]>;

export type NoteStatus = 'pending' | 'correct' | 'incorrect';

export interface SequenceNote {
    note: string;           // VexFlow key, e.g. "C/4"
    noteClass: string;      // e.g. "C"
    noteScientific: string; // e.g. "C4"
    status: NoteStatus;
}

export const PITCH_CLASSES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;

export const LEVEL_NOTES: Record<number, string[]> = {
    1: ['C'],
    2: ['C', 'G'],
    3: ['C', 'G', 'F'],
    4: ['C', 'G', 'F', 'D'],
    5: ['C', 'G', 'F', 'D', 'A'],
    6: ['C', 'G', 'F', 'D', 'A', 'E'],
    7: ['C', 'G', 'F', 'D', 'A', 'E', 'B']
};

export const LEVEL_MAX = Object.keys(LEVEL_NOTES).length;

// Treble clef note ranges (C4 to C6)
export const TREBLE_NOTES: NoteRangeMap = {
    C: ['C/4', 'C/5'],
    D: ['D/4', 'D/5'],
    E: ['E/4', 'E/5'],
    F: ['F/4', 'F/5'],
    G: ['G/4', 'G/5'],
    A: ['A/4', 'A/5'],
    B: ['B/4', 'B/5']
};

// Bass clef note ranges (E2 to E4)
export const BASS_NOTES: NoteRangeMap = {
    C: ['C/3', 'C/4'],
    D: ['D/2', 'D/3'],
    E: ['E/2', 'E/3'],
    F: ['F/2', 'F/3'],
    G: ['G/2', 'G/3'],
    A: ['A/2', 'A/3'],
    B: ['B/2', 'B/3']
};

// Grand staff note ranges (C2 to C6)
export const GRAND_NOTES: NoteRangeMap = {
    C: ['C/2', 'C/3', 'C/4', 'C/5', 'C/6'],
    D: ['D/2', 'D/3', 'D/4', 'D/5'],
    E: ['E/2', 'E/3', 'E/4', 'E/5'],
    F: ['F/2', 'F/3', 'F/4', 'F/5'],
    G: ['G/2', 'G/3', 'G/4', 'G/5'],
    A: ['A/2', 'A/3', 'A/4', 'A/5'],
    B: ['B/2', 'B/3', 'B/4', 'B/5']
};

export interface DetectionConfig {
    minClarity: number;
    minVolume: number;
    requiredStableMs: number;
    maxFrameGapMs: number;
    triggerCooldownMs: number;
    silenceGateVolume: number;
    silenceGateRequiredMs: number;
    centsTolerance: number;
}

export const DETECTION_CONFIG: DetectionConfig = {
    // Slightly lower clarity/volume defaults improve iPad mic detection reliability.
    minClarity: 0.86,
    minVolume: 0.02,
    requiredStableMs: 180,
    maxFrameGapMs: 100,
    triggerCooldownMs: 250,
    silenceGateVolume: 0.008,
    silenceGateRequiredMs: 200,
    centsTolerance: 30
};

export interface MicrophoneConfig {
    analyserFftSize: number;
}

export const MICROPHONE_CONFIG: MicrophoneConfig = {
    analyserFftSize: 2048
};

export interface GameplayTimingConfig {
    keyboardAutoAdvanceMs: number;
    incorrectFeedbackAutohideMs: number;
}

export const GAMEPLAY_TIMING_CONFIG: GameplayTimingConfig = {
    keyboardAutoAdvanceMs: 1200,
    incorrectFeedbackAutohideMs: 2000
};

export const VOLUME_PERCENT_MULTIPLIER = 1000;

export interface SensitivityConfig {
    minLevel: number;
    legacyMaxLevel: number;
    maxLevel: number;
    defaultLevel: number;
    legacyMinThreshold: number;
    legacyMaxThreshold: number;
    extendedMinThreshold: number;
}

export const SENSITIVITY_CONFIG: SensitivityConfig = {
    minLevel: 1,
    legacyMaxLevel: 10,
    maxLevel: 15,
    defaultLevel: 5,
    legacyMinThreshold: 0.0015,
    legacyMaxThreshold: 0.05,
    extendedMinThreshold: 0.0006
};

export interface SensitivityLabelConfig {
    lowMax: number;
    mediumMax: number;
    highMax: number;
}

export const SENSITIVITY_LABEL_CONFIG: SensitivityLabelConfig = {
    lowMax: 5,
    mediumMax: 10,
    highMax: 13
};

export function clampSensitivityLevel(level: number): number {
    if (!Number.isFinite(level)) return SENSITIVITY_CONFIG.defaultLevel;
    const rounded = Math.round(level);
    return Math.min(SENSITIVITY_CONFIG.maxLevel, Math.max(SENSITIVITY_CONFIG.minLevel, rounded));
}

export function sensitivityLevelToVolumeThreshold(level: number): number {
    const clamped = clampSensitivityLevel(level);

    // Preserve existing behavior for levels 1-10, then extend to even more sensitive levels.
    if (clamped <= SENSITIVITY_CONFIG.legacyMaxLevel) {
        const legacySpan = SENSITIVITY_CONFIG.legacyMaxLevel - SENSITIVITY_CONFIG.minLevel;
        const ratio = (SENSITIVITY_CONFIG.legacyMaxLevel - clamped) / legacySpan;
        return SENSITIVITY_CONFIG.legacyMinThreshold +
            ratio * (SENSITIVITY_CONFIG.legacyMaxThreshold - SENSITIVITY_CONFIG.legacyMinThreshold);
    }

    const extendedSpan = SENSITIVITY_CONFIG.maxLevel - SENSITIVITY_CONFIG.legacyMaxLevel;
    const ratio = (SENSITIVITY_CONFIG.maxLevel - clamped) / extendedSpan;
    return SENSITIVITY_CONFIG.extendedMinThreshold +
        ratio * (SENSITIVITY_CONFIG.legacyMinThreshold - SENSITIVITY_CONFIG.extendedMinThreshold);
}

export function sensitivityLevelToLabel(level: number): 'Low' | 'Medium' | 'High' | 'Ultra' {
    if (level <= SENSITIVITY_LABEL_CONFIG.lowMax) return 'Low';
    if (level <= SENSITIVITY_LABEL_CONFIG.mediumMax) return 'Medium';
    if (level <= SENSITIVITY_LABEL_CONFIG.highMax) return 'High';
    return 'Ultra';
}

export interface ProgressionConfig {
    minPresentations: number;
    minStreak: number;
}

export const PROGRESSION_CONFIG: ProgressionConfig = {
    minPresentations: 10,
    minStreak: 5
};

export interface NoteSelectionConfig {
    minSeenNoteWeight: number;
    streakDecayRate: number;
    missRateBoost: number;
}

export const NOTE_SELECTION_CONFIG: NoteSelectionConfig = {
    // With unseen notes at weight 1, 2/3 gives an approximate 60/40 split for new vs mastered notes.
    minSeenNoteWeight: 2 / 3,
    streakDecayRate: 0.3,
    missRateBoost: 0.5
};

export interface AdvancedSettings {
    detection: DetectionConfig;
    progression: ProgressionConfig;
    noteSelection: NoteSelectionConfig;
    gameplayTiming: GameplayTimingConfig;
    microphone: MicrophoneConfig;
}

export interface AdvancedSettingsInput {
    detection?: Partial<DetectionConfig>;
    progression?: Partial<ProgressionConfig>;
    noteSelection?: Partial<NoteSelectionConfig>;
    gameplayTiming?: Partial<GameplayTimingConfig>;
    microphone?: Partial<MicrophoneConfig>;
}

export function defaultAdvancedSettings(): AdvancedSettings {
    return {
        detection: { ...DETECTION_CONFIG },
        progression: { ...PROGRESSION_CONFIG },
        noteSelection: { ...NOTE_SELECTION_CONFIG },
        gameplayTiming: { ...GAMEPLAY_TIMING_CONFIG },
        microphone: { ...MICROPHONE_CONFIG }
    };
}

function asFiniteNumber(value: unknown, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function clampNumber(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

export function resolveAdvancedSettings(overrides?: AdvancedSettingsInput): AdvancedSettings {
    const defaults = defaultAdvancedSettings();

    return {
        detection: {
            minClarity: clampNumber(asFiniteNumber(overrides?.detection?.minClarity, defaults.detection.minClarity), 0.5, 0.99),
            minVolume: clampNumber(asFiniteNumber(overrides?.detection?.minVolume, defaults.detection.minVolume), 0.0001, 0.5),
            requiredStableMs: clampNumber(asFiniteNumber(overrides?.detection?.requiredStableMs, defaults.detection.requiredStableMs), 50, 2000),
            maxFrameGapMs: clampNumber(asFiniteNumber(overrides?.detection?.maxFrameGapMs, defaults.detection.maxFrameGapMs), 16, 1000),
            triggerCooldownMs: clampNumber(asFiniteNumber(overrides?.detection?.triggerCooldownMs, defaults.detection.triggerCooldownMs), 0, 2000),
            silenceGateVolume: clampNumber(asFiniteNumber(overrides?.detection?.silenceGateVolume, defaults.detection.silenceGateVolume), 0.0001, 0.5),
            silenceGateRequiredMs: clampNumber(asFiniteNumber(overrides?.detection?.silenceGateRequiredMs, defaults.detection.silenceGateRequiredMs), 0, 2000),
            centsTolerance: clampNumber(asFiniteNumber(overrides?.detection?.centsTolerance, defaults.detection.centsTolerance), 1, 100)
        },
        progression: {
            minPresentations: clampNumber(asFiniteNumber(overrides?.progression?.minPresentations, defaults.progression.minPresentations), 1, 200),
            minStreak: clampNumber(asFiniteNumber(overrides?.progression?.minStreak, defaults.progression.minStreak), 1, 100)
        },
        noteSelection: {
            minSeenNoteWeight: clampNumber(asFiniteNumber(overrides?.noteSelection?.minSeenNoteWeight, defaults.noteSelection.minSeenNoteWeight), 0.05, 1),
            streakDecayRate: clampNumber(asFiniteNumber(overrides?.noteSelection?.streakDecayRate, defaults.noteSelection.streakDecayRate), 0, 2),
            missRateBoost: clampNumber(asFiniteNumber(overrides?.noteSelection?.missRateBoost, defaults.noteSelection.missRateBoost), 0, 2)
        },
        gameplayTiming: {
            keyboardAutoAdvanceMs: clampNumber(asFiniteNumber(overrides?.gameplayTiming?.keyboardAutoAdvanceMs, defaults.gameplayTiming.keyboardAutoAdvanceMs), 0, 5000),
            incorrectFeedbackAutohideMs: clampNumber(asFiniteNumber(overrides?.gameplayTiming?.incorrectFeedbackAutohideMs, defaults.gameplayTiming.incorrectFeedbackAutohideMs), 0, 5000)
        },
        microphone: {
            analyserFftSize: clampNumber(asFiniteNumber(overrides?.microphone?.analyserFftSize, defaults.microphone.analyserFftSize), 256, 32768)
        }
    };
}
