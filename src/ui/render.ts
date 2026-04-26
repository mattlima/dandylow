import { Renderer, Stave, StaveNote, Voice, Formatter, StaveConnector } from 'vexflow';
import { elements } from './elements.js';

function getClefForGrandStaffNote(note: string): 'treble' | 'bass' {
  const octave = parseInt(note.split('/')[1] ?? '4', 10);
  return octave >= 4 ? 'treble' : 'bass';
}

export function renderStaff(note: string, clef: string): void {
  elements.staffContainer.innerHTML = '';

  const vf = new Renderer(elements.staffContainer, Renderer.Backends.SVG);

  if (clef === 'grand') {
    vf.resize(500, 260);
    const context = vf.getContext();

    const trebleStave = new Stave(60, 30, 360);
    trebleStave.addClef('treble');
    trebleStave.setContext(context).draw();

    const bassStave = new Stave(60, 130, 360);
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

    const noteClef = getClefForGrandStaffNote(note);
    const targetStave = noteClef === 'treble' ? trebleStave : bassStave;

    const notes = [new StaveNote({ keys: [note], duration: 'w', clef: noteClef })];
    const voice = new Voice({ numBeats: 4, beatValue: 4 });
    voice.addTickables(notes);

    new Formatter().joinVoices([voice]).format([voice], 300);
    voice.draw(context, targetStave);
    return;
  }

  vf.resize(500, 200);
  const context = vf.getContext();

  const stave = new Stave(10, 40, 400);
  stave.addClef(clef);
  stave.setContext(context).draw();

  const notes = [new StaveNote({ keys: [note], duration: 'w', clef })];
  const voice = new Voice({ numBeats: 4, beatValue: 4 });
  voice.addTickables(notes);

  new Formatter().joinVoices([voice]).format([voice], 350);
  voice.draw(context, stave);
}
