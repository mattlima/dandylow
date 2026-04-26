import { TREBLE_NOTES, BASS_NOTES, GRAND_NOTES, DETECTION_CONFIG, type NoteRangeMap } from '../constants.js';

export interface DetectionTarget {
  note: string;
  frequency: number;
}

export function buildDetectionTargets(): DetectionTarget[] {
  const allRanges: NoteRangeMap[] = [TREBLE_NOTES, BASS_NOTES, GRAND_NOTES];
  const uniqueNotes = new Set<string>();

  for (const range of allRanges) {
    for (const notes of Object.values(range)) {
      notes.forEach((note) => uniqueNotes.add(vexKeyToScientific(note)));
    }
  }

  return Array.from(uniqueNotes).map((note) => ({
    note,
    frequency: scientificNoteToFrequency(note)
  }));
}

export function vexKeyToScientific(note: string): string {
  return note.replace('/', '');
}

export function scientificNoteToFrequency(note: string): number {
  const match = note.match(/^([A-G])(\d)$/);
  if (!match) return 0;

  const letter = match[1] as string;
  const octave = parseInt(match[2] as string, 10);

  const semitoneByLetter: Record<string, number> = {
    C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11
  };

  const midi = (octave + 1) * 12 + (semitoneByLetter[letter] ?? 0);
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function detectNaturalNoteWithOctave(
  pitch: number,
  targets: DetectionTarget[]
): string | null {
  let closestNote: string | null = null;
  let minAbsCents = Infinity;

  for (const target of targets) {
    const cents = 1200 * Math.log2(pitch / target.frequency);
    const absCents = Math.abs(cents);
    if (absCents <= DETECTION_CONFIG.centsTolerance && absCents < minAbsCents) {
      minAbsCents = absCents;
      closestNote = target.note;
    }
  }

  return closestNote;
}
