import { useGameStore } from '../stores/game';
import { useAudioStore } from '../stores/audio';
import { useProfilesStore } from '../stores/profiles';
import { LEVEL_NOTES, TREBLE_NOTES, BASS_NOTES, GRAND_NOTES, NOTE_SELECTION_CONFIG, type NoteRangeMap, type SequenceNote } from '../constants.js';
import { vexKeyToScientific } from '../audio/noteFrequency.js';
import { renderStaff } from '../ui/render.js';

function getNoteRangeForClef(clef: string): NoteRangeMap {
    if (clef === 'treble') return TREBLE_NOTES;
    if (clef === 'bass') return BASS_NOTES;
    return GRAND_NOTES;
}

type StatMap = Record<string, { presentations: number; correct: number; incorrect: number; streak: number }>;

/**
 * Compute a selection weight for a candidate note.
 * Base weight = 1 for all notes. Two multiplicative boost factors (each >= 1):
 *   - streakFactor = 1 / (1 + streak * 0.3)  -> streak-5 note gets ~half the weight of streak-0
 *   - missFactor   = 1 + min(missRate, 1) * 0.5  -> worst miss rate adds up to 1.5x
 * Unseen notes get weight 1 (neutral, not penalised).
 * Seen notes are clamped to a floor so new notes don't dominate too hard after level-up.
 * Example: when old notes are mastered and new notes are unseen, this yields roughly a 60/40 split.
 */
function noteWeight(scientific: string, stats: StatMap): number {
    const stat = stats[scientific];
    if (!stat || stat.presentations === 0) return 1;
    const streakFactor = 1 / (1 + stat.streak * 0.3);
    const missRate = stat.incorrect / stat.presentations;
    const missFactor = 1 + Math.min(missRate, 1) * 0.5;
    return Math.max(NOTE_SELECTION_CONFIG.minSeenNoteWeight, streakFactor * missFactor);
}

function pickWeightedNote(
    clef: string,
    availableNoteClasses: string[],
    stats: StatMap,
    previousScientific?: string
): SequenceNote | null {
    const noteRange = getNoteRangeForClef(clef);
    const candidates: Array<{ vexKey: string; noteClass: string; scientific: string; weight: number }> = [];
    for (const noteClass of availableNoteClasses) {
        for (const vexKey of noteRange[noteClass] ?? []) {
            const scientific = vexKeyToScientific(vexKey);
            candidates.push({ vexKey, noteClass, scientific, weight: noteWeight(scientific, stats) });
        }
    }
    if (candidates.length === 0) return null;

    const selectable = previousScientific
        ? candidates.filter((candidate) => candidate.scientific !== previousScientific)
        : candidates;
    const pool = selectable.length > 0 ? selectable : candidates;

    const totalWeight = pool.reduce((sum, c) => sum + c.weight, 0);
    let pick = Math.random() * totalWeight;
    for (const c of pool) {
        pick -= c.weight;
        if (pick <= 0) {
            return { note: c.vexKey, noteClass: c.noteClass, noteScientific: c.scientific, status: 'pending' };
        }
    }
    // Floating-point fallback: return last candidate
    const last = pool[pool.length - 1]!;
    return { note: last.vexKey, noteClass: last.noteClass, noteScientific: last.scientific, status: 'pending' };
}

export function generateNewSequence(): void {
    const gameStore = useGameStore();
    const audioStore = useAudioStore();
    const profilesStore = useProfilesStore();

    audioStore.resetPitchStability();

    const availableNoteClasses = LEVEL_NOTES[gameStore.level] ?? [];
    const stats = profilesStore.activeProfile?.pitchStats ?? {};
    const notes: SequenceNote[] = [];
    let previousScientific: string | undefined;

    for (let i = 0; i < gameStore.sequenceLength; i++) {
        const note = pickWeightedNote(gameStore.clef, availableNoteClasses, stats, previousScientific);
        if (note) {
            notes.push(note);
            previousScientific = note.noteScientific;
        }
    }

    if (notes.length === 0) return;

    gameStore.initSequence(notes);
    renderStaff(notes, 0, gameStore.clef);
}

