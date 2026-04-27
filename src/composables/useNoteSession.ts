import { generateNewSequence } from '../game/noteGenerator';
import { resetSession } from '../game/scoring';

export function useNoteSession() {
    return {
        nextSequence: generateNewSequence,
        resetSession
    };
}
