import { useGameStore } from '../stores/game';
import { useAudioStore } from '../stores/audio';
import { generateNewNote } from './noteGenerator';

export function checkKeyboardAnswer(pitchClass: string): void {
    const gameStore = useGameStore();
    if (!gameStore.currentNoteClass) return;
    const isCorrect = pitchClass === gameStore.currentNoteClass;
    gameStore.applyAnswerResult(isCorrect, gameStore.currentNoteClass);
    if (isCorrect) setTimeout(() => generateNewNote(), 1500);
}

export function checkMicrophoneAnswer(noteWithOctave: string): void {
    const gameStore = useGameStore();
    if (!gameStore.currentNoteScientific) return;
    const isCorrect = noteWithOctave === gameStore.currentNoteScientific;
    gameStore.applyAnswerResult(isCorrect, gameStore.currentNoteScientific);
}

export function resetSession(): void {
    const gameStore = useGameStore();
    const audioStore = useAudioStore();
    gameStore.resetScore();
    audioStore.resetPitchStability();
    generateNewNote();
}

