import { state, resetPitchStability } from '../state.js';
import { LEVEL_NOTES, TREBLE_NOTES, BASS_NOTES, GRAND_NOTES, type NoteRangeMap } from '../constants.js';
import { elements } from '../ui/elements.js';
import { vexKeyToScientific } from '../audio/noteFrequency.js';
import { renderStaff } from '../ui/render.js';

function getNoteRangeForClef(clef: string): NoteRangeMap {
  if (clef === 'treble') return TREBLE_NOTES;
  if (clef === 'bass') return BASS_NOTES;
  return GRAND_NOTES;
}

export function generateNewNote(): void {
  state.waitingForSilence = false;
  state.advanceOnSilence = false;
  resetPitchStability();
  elements.feedback.classList.add('hidden');

  const availableNotes = LEVEL_NOTES[state.level] ?? [];
  const randomNote = availableNotes[Math.floor(Math.random() * availableNotes.length)];
  if (!randomNote) return;

  state.currentNoteClass = randomNote;

  const noteRange = getNoteRangeForClef(state.clef);
  const possibleNotes = noteRange[randomNote] ?? [];
  const selectedNote = possibleNotes[Math.floor(Math.random() * possibleNotes.length)];
  if (!selectedNote) return;

  state.currentNote = selectedNote;
  state.currentNoteScientific = vexKeyToScientific(selectedNote);

  renderStaff(selectedNote, state.clef);
}
