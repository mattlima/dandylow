<template>
    <div class="container clef-select-screen">
        <header>
            <h1>Choose Your Clef</h1>
            <p class="subtitle">Pick where to continue. Each clef tracks progression independently.</p>
        </header>

        <div class="clef-grid">
            <button v-for="option in clefOptions" :key="option.key" class="clef-card"
                @click="startWithClef(option.key)">
                <div class="clef-card-title-row">
                    <span class="clef-symbol">{{ option.symbol }}</span>
                    <span class="clef-title">{{ option.label }}</span>
                </div>
                <p class="clef-range">{{ option.rangeLabel }}</p>

                <div class="clef-level-pill">Level {{ clefSummary(option.key).level }}</div>
                <p class="clef-notes">{{ clefSummary(option.key).noteClasses }}</p>

                <div class="clef-stats">
                    <span><strong>{{ clefSummary(option.key).practicedPitches }}/{{ clefSummary(option.key).totalPitches
                            }}</strong> pitches practiced</span>
                    <span>Accuracy: <strong>{{ clefSummary(option.key).accuracyLabel }}</strong></span>
                    <span>Best streak: <strong>{{ clefSummary(option.key).bestStreak }}</strong></span>
                </div>

                <div class="clef-card-cta">Play →</div>
            </button>
        </div>

        <div class="clef-select-actions">
            <button class="btn-secondary" @click="gameStore.screen = 'entry'">← Back to player selection</button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '../stores/game';
import { useProfilesStore, type PitchStat } from '../stores/profiles';
import { nextUnlockedLevel } from '../game/progression';
import { startPitchDetection } from '../audio/microphone';
import { generateNewSequence } from '../game/noteGenerator';
import { LEVEL_NOTES, TREBLE_NOTES, BASS_NOTES, GRAND_NOTES, type NoteRangeMap } from '../constants';

const gameStore = useGameStore();
const profilesStore = useProfilesStore();

const clefOptions = [
    { key: 'treble', label: 'Treble', symbol: '𝄞', rangeLabel: 'C4 to C6' },
    { key: 'bass', label: 'Bass', symbol: '𝄢', rangeLabel: 'E2 to E4' },
    { key: 'grand', label: 'Grand Staff', symbol: '𝄞 + 𝄢', rangeLabel: 'C2 to C6' }
] as const;

type ClefKey = (typeof clefOptions)[number]['key'];

type ClefSummary = {
    level: number;
    noteClasses: string;
    practicedPitches: number;
    totalPitches: number;
    accuracyLabel: string;
    bestStreak: number;
};

const pitchStats = computed<Record<string, PitchStat>>(() => profilesStore.activeProfile?.pitchStats ?? {});

function rangeMapForClef(clef: ClefKey): NoteRangeMap {
    if (clef === 'treble') return TREBLE_NOTES;
    if (clef === 'bass') return BASS_NOTES;
    return GRAND_NOTES;
}

function scientificPitchesForClef(clef: ClefKey): string[] {
    const map = rangeMapForClef(clef);
    const pitches: string[] = [];
    for (const vexList of Object.values(map)) {
        for (const vex of vexList) {
            const [pc, octave] = vex.split('/');
            if (!pc || !octave) continue;
            pitches.push(`${pc}${octave}`);
        }
    }
    return pitches;
}

function clefSummary(clef: ClefKey): ClefSummary {
    const stats = pitchStats.value;
    const level = nextUnlockedLevel(clef, stats);
    const levelNotes = (LEVEL_NOTES[level] ?? []).join(' ');
    const pitches = scientificPitchesForClef(clef);

    let practicedPitches = 0;
    let totalAttempts = 0;
    let totalCorrect = 0;
    let bestStreak = 0;

    for (const pitch of pitches) {
        const stat = stats[pitch];
        if (!stat) continue;
        if (stat.presentations > 0) practicedPitches++;
        totalAttempts += stat.presentations;
        totalCorrect += stat.correct;
        bestStreak = Math.max(bestStreak, stat.streak);
    }

    const accuracyLabel = totalAttempts > 0
        ? `${Math.round((totalCorrect / totalAttempts) * 100)}%`
        : '—';

    return {
        level,
        noteClasses: levelNotes || '—',
        practicedPitches,
        totalPitches: pitches.length,
        accuracyLabel,
        bestStreak
    };
}

async function startWithClef(clef: ClefKey): Promise<void> {
    const stats = pitchStats.value;
    gameStore.clef = clef;
    gameStore.level = nextUnlockedLevel(clef, stats);

    if (gameStore.inputMode === 'microphone') {
        await startPitchDetection();
    }

    generateNewSequence();
    gameStore.screen = 'game';
}
</script>
