import { useGameStore } from '../stores/game';
import { useAudioStore } from '../stores/audio';
import { useProfilesStore } from '../stores/profiles';
import { generateNewSequence } from './noteGenerator';
import { renderStaff } from '../ui/render';
import { isLevelComplete } from './progression';

function recordPitchStat(scientificPitch: string, isCorrect: boolean): void {
    const profilesStore = useProfilesStore();
    const id = profilesStore.activeProfileId;
    if (id) profilesStore.updatePitchStat(id, scientificPitch, isCorrect);
}

function checkProgressionGate(): void {
    const gameStore = useGameStore();
    const profilesStore = useProfilesStore();
    if (gameStore.pendingLevelUp !== null) return; // already pending
    if (gameStore.level >= 7) return;
    const stats = profilesStore.activeProfile?.pitchStats ?? {};
    if (isLevelComplete(gameStore.level, gameStore.clef, stats)) {
        gameStore.pendingLevelUp = gameStore.level + 1;
    }
}

export function checkKeyboardAnswer(pitchClass: string): void {
    const gameStore = useGameStore();
    const audioStore = useAudioStore();

    if (gameStore.noteAttempted || gameStore.sequenceComplete) return;
    if (!gameStore.currentNoteClass || !gameStore.currentNoteScientific) return;

    const isCorrect = pitchClass === gameStore.currentNoteClass;
    const scientific = gameStore.currentNoteScientific;

    gameStore.applyAnswerResult(isCorrect, gameStore.currentNoteClass);
    recordPitchStat(scientific, isCorrect);
    checkProgressionGate();

    // Re-render staff to show note color, then advance sequence after a short pause
    renderStaff(gameStore.sequence, gameStore.currentSequenceIndex, gameStore.clef);
    setTimeout(() => {
        gameStore.advanceSequence();
        audioStore.resetPitchStability();
        renderStaff(gameStore.sequence, gameStore.currentSequenceIndex, gameStore.clef);
    }, 1200);
}

export function checkMicrophoneAnswer(noteWithOctave: string): void {
    const gameStore = useGameStore();

    if (gameStore.noteAttempted || gameStore.sequenceComplete) return;
    if (!gameStore.currentNoteScientific) return;

    const isCorrect = noteWithOctave === gameStore.currentNoteScientific;
    const scientific = gameStore.currentNoteScientific;

    gameStore.applyAnswerResult(isCorrect, gameStore.currentNoteScientific);
    recordPitchStat(scientific, isCorrect);
    checkProgressionGate();

    renderStaff(gameStore.sequence, gameStore.currentSequenceIndex, gameStore.clef);
}

export function resetSession(): void {
    const gameStore = useGameStore();
    const audioStore = useAudioStore();
    gameStore.resetScore();
    audioStore.resetPitchStability();
    generateNewSequence();
}

