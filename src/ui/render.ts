import { Renderer, Stave, StaveNote, Voice, Formatter, StaveConnector, GhostNote } from 'vexflow';
import type { SequenceNote, NoteStatus } from '../constants';

const NOTE_SLOT_WIDTH = 55; // px allocated per note

function getClefForGrandStaffNote(note: string): 'treble' | 'bass' {
    const octave = parseInt(note.split('/')[1] ?? '4', 10);
    return octave >= 4 ? 'treble' : 'bass';
}

function applyNoteStyle(staveNote: StaveNote, status: NoteStatus): void {
    if (status === 'correct') {
        staveNote.setStyle({ fillStyle: '#28a745', strokeStyle: '#28a745' });
    } else if (status === 'incorrect') {
        staveNote.setStyle({ fillStyle: '#dc3545', strokeStyle: '#dc3545' });
    }
    // pending → default (black)
}

function layoutDimensions(noteCount: number, isGrand: boolean) {
    const formatWidth = Math.max(250, noteCount * NOTE_SLOT_WIDTH);
    const staveExtraWidth = isGrand ? 60 : 50;
    const staveWidth = formatWidth + staveExtraWidth;
    const xOffset = isGrand ? 60 : 10;
    const canvasWidth = xOffset + staveWidth + 20;
    const canvasHeight = isGrand ? 260 : 200;
    return { formatWidth, staveWidth, xOffset, canvasWidth, canvasHeight };
}

export function renderStaff(sequence: SequenceNote[], currentIndex: number, clef: string): void {
    const container = document.getElementById('staff-container');
    if (!container) return;
    container.innerHTML = '';

    if (sequence.length === 0) return;

    const { formatWidth, staveWidth, xOffset, canvasWidth, canvasHeight } =
        layoutDimensions(sequence.length, clef === 'grand');

    const vf = new Renderer(container as HTMLDivElement, Renderer.Backends.SVG);
    vf.resize(canvasWidth, canvasHeight);
    const context = vf.getContext();

    const numBeats = sequence.length;

    if (clef === 'grand') {
        const trebleStave = new Stave(xOffset, 30, staveWidth);
        trebleStave.addClef('treble');
        trebleStave.setContext(context).draw();

        const bassStave = new Stave(xOffset, 130, staveWidth);
        bassStave.addClef('bass');
        bassStave.setContext(context).draw();

        new StaveConnector(trebleStave, bassStave)
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            .setType(StaveConnector.type.BRACE!)
            .setContext(context)
            .draw();

        new StaveConnector(trebleStave, bassStave)
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            .setType(StaveConnector.type.SINGLE_LEFT!)
            .setContext(context)
            .draw();

        const trebleTickables: (StaveNote | GhostNote)[] = [];
        const bassTickables: (StaveNote | GhostNote)[] = [];

        sequence.forEach((seqNote) => {
            const noteClef = getClefForGrandStaffNote(seqNote.note);
            const staveNote = new StaveNote({ keys: [seqNote.note], duration: 'q', clef: noteClef });
            applyNoteStyle(staveNote, seqNote.status);

            if (noteClef === 'treble') {
                trebleTickables.push(staveNote);
                bassTickables.push(new GhostNote({ duration: 'q' }));
            } else {
                trebleTickables.push(new GhostNote({ duration: 'q' }));
                bassTickables.push(staveNote);
            }
        });

        const trebleVoice = new Voice({ numBeats, beatValue: 4 }).addTickables(trebleTickables);
        const bassVoice = new Voice({ numBeats, beatValue: 4 }).addTickables(bassTickables);

        new Formatter().joinVoices([trebleVoice, bassVoice]).format([trebleVoice, bassVoice], formatWidth);
        trebleVoice.draw(context, trebleStave);
        bassVoice.draw(context, bassStave);
        return;
    }

    const stave = new Stave(xOffset, 40, staveWidth);
    stave.addClef(clef);
    stave.setContext(context).draw();

    const tickables = sequence.map((seqNote) => {
        const staveNote = new StaveNote({ keys: [seqNote.note], duration: 'q', clef });
        applyNoteStyle(staveNote, seqNote.status);
        return staveNote;
    });

    const voice = new Voice({ numBeats, beatValue: 4 }).addTickables(tickables);
    new Formatter().joinVoices([voice]).format([voice], formatWidth);
    voice.draw(context, stave);
}

