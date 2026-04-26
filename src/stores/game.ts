import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

const SUCCESS_MESSAGES = [
    '🎉 Excellent!',
    '⭐ Great job!',
    '🌟 Perfect!',
    '👏 Wonderful!',
    '🎵 Beautiful!'
];

export const useGameStore = defineStore('game', () => {
    // Settings
    const level = ref(1);
    const clef = ref('treble');
    const inputMode = ref<'microphone' | 'keyboard'>('microphone');

    // Current note
    const currentNote = ref<string | null>(null);
    const currentNoteClass = ref<string | null>(null);
    const currentNoteScientific = ref<string | null>(null);

    // Scoring
    const scoreCorrect = ref(0);
    const scoreTotal = ref(0);
    const streak = ref(0);
    const score = computed(() => ({ correct: scoreCorrect.value, total: scoreTotal.value }));
    const accuracy = computed(() =>
        scoreTotal.value === 0 ? 0 : Math.round((scoreCorrect.value / scoreTotal.value) * 100)
    );

    // Pitch gate flags (owned here so noteGenerator and pitchDetection share one source of truth)
    const waitingForSilence = ref(false);
    const advanceOnSilence = ref(false);

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

    function applyAnswerResult(isCorrect: boolean, expectedLabel: string): void {
        scoreTotal.value++;
        if (isCorrect) {
            scoreCorrect.value++;
            streak.value++;
            const msg =
                SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)] ?? '🎉 Excellent!';
            showFeedback('correct', msg);
            if (inputMode.value === 'microphone') {
                waitingForSilence.value = true;
                advanceOnSilence.value = true;
            }
        } else {
            streak.value = 0;
            showFeedback('incorrect', `❌ Try again! The note was ${expectedLabel}`, 2000);
            if (inputMode.value === 'microphone') {
                waitingForSilence.value = true;
                advanceOnSilence.value = false;
            }
        }
    }

    function setCurrentNote(note: string, noteClass: string, noteScientific: string): void {
        currentNote.value = note;
        currentNoteClass.value = noteClass;
        currentNoteScientific.value = noteScientific;
    }

    function resetScore(): void {
        scoreCorrect.value = 0;
        scoreTotal.value = 0;
        streak.value = 0;
        hideFeedback();
    }

    return {
        level, clef, inputMode,
        currentNote, currentNoteClass, currentNoteScientific,
        score, accuracy, streak,
        waitingForSilence, advanceOnSilence,
        feedbackMessage, feedbackType, feedbackVisible,
        showFeedback, hideFeedback, applyAnswerResult, setCurrentNote, resetScore
    };
});
