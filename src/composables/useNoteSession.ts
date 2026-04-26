import { generateNewNote } from '../game/noteGenerator';
import { resetSession } from '../game/scoring';

export function useNoteSession() {
    return {
        nextNote: generateNewNote,
        resetSession
    };
}
