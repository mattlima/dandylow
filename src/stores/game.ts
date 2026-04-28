import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { SequenceNote } from '../constants';
import { resolveAdvancedSettings } from '../constants';
import { useProfilesStore } from './profiles';

const SUCCESS_MESSAGES = [
    '🎉 Excellent!',
    '⭐ Great job!',
    '🌟 Perfect!',
    '👏 Wonderful!',
    '🎵 Beautiful!'
];

export const useGameStore = defineStore('game', () => {
    const profilesStore = useProfilesStore();
    // Settings
    const level = ref(1);
    const clef = ref('treble');
    const inputMode = ref<'microphone' | 'keyboard'>('microphone');
    const sequenceLength = ref(10);

    // Sequence state
    const sequence = ref<SequenceNote[]>([]);
    const currentSequenceIndex = ref(0);
    const noteAttempted = ref(false);

    // Derived active note from current sequence position
    const currentNote = computed(() => sequence.value[currentSequenceIndex.value]?.note ?? null);
    const currentNoteClass = computed(() => sequence.value[currentSequenceIndex.value]?.noteClass ?? null);
    const currentNoteScientific = computed(() => sequence.value[currentSequenceIndex.value]?.noteScientific ?? null);
    const sequenceComplete = computed(
        () => sequence.value.length > 0 && currentSequenceIndex.value >= sequence.value.length
    );

    // Scoring
    const scoreCorrect = ref(0);
    const scoreTotal = ref(0);
    const streak = ref(0);
    const score = computed(() => ({ correct: scoreCorrect.value, total: scoreTotal.value }));
    const accuracy = computed(() =>
        scoreTotal.value === 0 ? 0 : Math.round((scoreCorrect.value / scoreTotal.value) * 100)
    );

    // Screen routing
    const screen = ref<'entry' | 'clef-select' | 'game'>('entry');

    // Mic silence gate flag
    const waitingForSilence = ref(false);

    // Level-up progression gate — set when current level is complete, cleared on modal dismiss
    const pendingLevelUp = ref<number | null>(null);

    // Feedback
    const feedbackMessage = ref('');
    const feedbackType = ref<'correct' | 'incorrect' | null>(null);
    const feedbackVisible = ref(false);
    let feedbackTimer: ReturnType<typeof setTimeout> | null = null;

    function showFeedback(
        type: 'correct' | 'incorrect',
        message: string,
        autohideMs?: number
    ): void {
        if (feedbackTimer) clearTimeout(feedbackTimer);
        feedbackMessage.value = message;
        feedbackType.value = type;
        feedbackVisible.value = true;
        if (autohideMs) {
            feedbackTimer = setTimeout(() => {
                feedbackVisible.value = false;
            }, autohideMs);
        }
    }

    function hideFeedback(): void {
        if (feedbackTimer) clearTimeout(feedbackTimer);
        feedbackVisible.value = false;
    }

    function markNoteStatus(status: 'correct' | 'incorrect'): void {
        const idx = currentSequenceIndex.value;
        const note = sequence.value[idx];
        if (!note) return;
        // Immutable update so watchers detect the change
        sequence.value = [
            ...sequence.value.slice(0, idx),
            { ...note, status },
            ...sequence.value.slice(idx + 1)
        ];
    }

    function applyAnswerResult(isCorrect: boolean, expectedLabel: string): void {
        if (noteAttempted.value) return; // one-attempt-per-note guard
        noteAttempted.value = true;

        scoreTotal.value++;
        markNoteStatus(isCorrect ? 'correct' : 'incorrect');

        if (isCorrect) {
            scoreCorrect.value++;
            streak.value++;
            const msg =
                SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)] ?? '🎉 Excellent!';
            showFeedback('correct', msg);
        } else {
            streak.value = 0;
            const feedbackMs = resolveAdvancedSettings(profilesStore.activeProfile?.preferences.advancedSettings)
                .gameplayTiming.incorrectFeedbackAutohideMs;
            showFeedback('incorrect', `❌ The note was ${expectedLabel}`, feedbackMs);
        }

        if (inputMode.value === 'microphone') {
            waitingForSilence.value = true;
        }
    }

    function advanceSequence(): void {
        currentSequenceIndex.value++;
        noteAttempted.value = false;
        waitingForSilence.value = false;
    }

    function initSequence(notes: SequenceNote[]): void {
        sequence.value = notes;
        currentSequenceIndex.value = 0;
        noteAttempted.value = false;
        waitingForSilence.value = false;
        hideFeedback();
    }

    function resetScore(): void {
        scoreCorrect.value = 0;
        scoreTotal.value = 0;
        streak.value = 0;
        hideFeedback();
    }

    return {
        level, clef, inputMode, sequenceLength,
        screen,
        sequence, currentSequenceIndex, noteAttempted, sequenceComplete,
        currentNote, currentNoteClass, currentNoteScientific,
        score, accuracy, streak,
        waitingForSilence,
        pendingLevelUp,
        feedbackMessage, feedbackType, feedbackVisible,
        showFeedback, hideFeedback, applyAnswerResult,
        markNoteStatus, advanceSequence, initSequence, resetScore
    };
});

