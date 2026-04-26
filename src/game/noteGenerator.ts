import { useGameStore } from '../stores/game';
import { useAudioStore } from '../stores/audio';
import { LEVEL_NOTES, TREBLE_NOTES, BASS_NOTES, GRAND_NOTES, type NoteRangeMap } from '../constants.js';
import { vexKeyToScientific } from '../audio/noteFrequency.js';
import { renderStaff } from '../ui/render.js';

function getNoteRangeForClef(clef: string): NoteRangeMap {
    if (clef === 'treble') return TREBLE_NOTES;
    if (clef === 'bass') return BASS_NOTES;
    return GRAND_NOTES;
}

export function generateNewNote(): void {
    const gameStore = useGameStore();
    const audioStore = useAudioStore();

    gameStore.waitingForSilence = false;
    gameStore.advanceOnSilence = false;
    audioStore.resetPitchStability();
    gameStore.hideFeedback();

    const availableNotes = LEVEL_NOTES[gameStore.level] ?? [];
    const randomNote = availableNotes[Math.floor(Math.random() * availableNotes.length)];
    if (!randomNote) return;

    const noteRange = getNoteRangeForClef(gameStore.clef);
    const possibleNotes = noteRange[randomNote] ?? [];
    const selectedNote = possibleNotes[Math.floor(Math.random() * possibleNotes.length)];
    if (!selectedNote) return;

    gameStore.setCurrentNote(selectedNote, randomNote, vexKeyToScientific(selectedNote));
    renderStaff(selectedNote, gameStore.clef);
}

