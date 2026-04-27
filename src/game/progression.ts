import {
    LEVEL_NOTES,
    TREBLE_NOTES,
    BASS_NOTES,
    GRAND_NOTES,
    PROGRESSION_CONFIG,
    type NoteRangeMap
} from '../constants';
import type { PitchStat } from '../stores/profiles';

function getClefRangeMap(clef: string): NoteRangeMap {
    if (clef === 'treble') return TREBLE_NOTES;
    if (clef === 'bass') return BASS_NOTES;
    return GRAND_NOTES;
}

/**
 * Returns true if every note in the given level (for the given clef's range)
 * meets the minimum presentations and minimum consecutive streak thresholds.
 */
export function isLevelComplete(
    level: number,
    clef: string,
    pitchStats: Record<string, PitchStat>
): boolean {
    const levelNotes = LEVEL_NOTES[level] ?? [];
    const rangeMap = getClefRangeMap(clef);
    const { minPresentations, minStreak } = PROGRESSION_CONFIG;

    for (const pc of levelNotes) {
        for (const vexNote of rangeMap[pc] ?? []) {
            // vexNote format: "C/4" → scientific key: "C4"
            const [noteClass, octave] = vexNote.split('/');
            if (!noteClass || !octave) continue;
            const stat = pitchStats[`${noteClass}${octave}`];
            if (!stat || stat.presentations < minPresentations || stat.streak < minStreak) {
                return false;
            }
        }
    }
    return true;
}

/**
 * Returns the first level (1–7) that is not yet complete for the given clef.
 * Returns 7 if all levels are complete.
 */
export function nextUnlockedLevel(
    clef: string,
    pitchStats: Record<string, PitchStat>
): number {
    for (let level = 1; level <= 7; level++) {
        if (!isLevelComplete(level, clef, pitchStats)) {
            return level;
        }
    }
    return 7;
}

/**
 * Computes the average accuracy (0–100) for all pitches in the given level's
 * clef range. Returns null when no pitch has been presented yet.
 */
export function levelAccuracy(
    level: number,
    clef: string,
    pitchStats: Record<string, PitchStat>
): number | null {
    const levelNotes = LEVEL_NOTES[level] ?? [];
    const rangeMap = getClefRangeMap(clef);

    let totalPresented = 0;
    let totalCorrect = 0;

    for (const pc of levelNotes) {
        for (const vexNote of rangeMap[pc] ?? []) {
            const [noteClass, octave] = vexNote.split('/');
            if (!noteClass || !octave) continue;
            const stat = pitchStats[`${noteClass}${octave}`];
            if (stat && stat.presentations > 0) {
                totalPresented += stat.presentations;
                totalCorrect += stat.correct;
            }
        }
    }

    if (totalPresented === 0) return null;
    return Math.round((totalCorrect / totalPresented) * 100);
}
