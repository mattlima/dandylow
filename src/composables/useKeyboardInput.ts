import { checkKeyboardAnswer } from '../game/scoring';

export function useKeyboardInput() {
    function handleKeyPress(note: string): void {
        // Strip sharp — Dandelot method focuses on natural notes only
        const noteClass = note.replace('#', '');
        checkKeyboardAnswer(noteClass);
    }

    return { handleKeyPress };
}
