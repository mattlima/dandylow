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
    minClarity: 0.9,
    minVolume: 0.03,
    requiredStableMs: 180,
    maxFrameGapMs: 100,
    triggerCooldownMs: 250,
    silenceGateVolume: 0.008,
    silenceGateRequiredMs: 220,
    centsTolerance: 30
};

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
}

export const NOTE_SELECTION_CONFIG: NoteSelectionConfig = {
    // With unseen notes at weight 1, 2/3 gives an approximate 60/40 split for new vs mastered notes.
    minSeenNoteWeight: 2 / 3
};
