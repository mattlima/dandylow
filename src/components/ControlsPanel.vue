<template>
  <details class="controls-details">
    <summary class="controls-summary">📊 Level Progress</summary>

    <div class="controls">
      <div class="controls-level">
        <div class="control-group">
          <label for="level-select">Level:</label>
          <select id="level-select" :value="gameStore.level" @change="onLevelChange">
            <option value="1">Level 1 – C only</option>
            <option value="2">Level 2 – C, G</option>
            <option value="3">Level 3 – C, G, F</option>
            <option value="4">Level 4 – C, G, F, D</option>
            <option value="5">Level 5 – C, G, F, D, A</option>
            <option value="6">Level 6 – C, G, F, D, A, E</option>
            <option value="7">Level 7 – All notes</option>
          </select>
        </div>
      </div>

      <div class="controls-matrix">
        <table class="pitch-table">
          <thead>
            <tr>
              <th class="pitch-octave-header"></th>
              <th v-for="pc in PITCH_CLASSES" :key="pc"
                :class="['pitch-col-header', { 'pitch-col-ghost': !activePitchClasses.includes(pc) }]">{{ pc }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="octave in clefOctaves" :key="octave">
              <td class="pitch-octave-label">{{ octave }}</td>
              <td v-for="pc in PITCH_CLASSES" :key="pc" :class="['pitch-cell', {
                'pitch-cell-ghost': !activePitchClasses.includes(pc),
                'pitch-cell-invalid': !isValidNote(pc, octave)
              }]">{{ getCellValue(pc, octave) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </details>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '../stores/game';
import { useProfilesStore } from '../stores/profiles';
import { useNoteSession } from '../composables/useNoteSession';
import {
  PITCH_CLASSES,
  LEVEL_NOTES,
  TREBLE_NOTES,
  BASS_NOTES,
  GRAND_NOTES,
  type NoteRangeMap
} from '../constants';

const gameStore = useGameStore();
const profilesStore = useProfilesStore();
const { nextSequence } = useNoteSession();

function onLevelChange(e: Event): void {
  gameStore.level = parseInt((e.target as HTMLSelectElement).value);
  nextSequence();
}

const activePitchClasses = computed<string[]>(() =>
  [...(LEVEL_NOTES[gameStore.level] ?? [])]
);

function getClefRange(clef: string): NoteRangeMap {
  if (clef === 'treble') return TREBLE_NOTES;
  if (clef === 'bass') return BASS_NOTES;
  return GRAND_NOTES;
}

const clefOctaves = computed<number[]>(() => {
  const range = getClefRange(gameStore.clef);
  const octaves = new Set<number>();
  for (const notes of Object.values(range)) {
    for (const note of notes) {
      const o = parseInt(note.split('/')[1] ?? '0');
      if (o > 0) octaves.add(o);
    }
  }
  return Array.from(octaves).sort((a, b) => b - a); // descending
});

function isValidNote(pc: string, octave: number): boolean {
  const range = getClefRange(gameStore.clef);
  return (range[pc] ?? []).includes(`${pc}/${octave}`);
}

function getCellValue(pc: string, octave: number): string {
  if (!isValidNote(pc, octave)) return '';
  const key = `${pc}${octave}`;
  const stat = profilesStore.activeProfile?.pitchStats?.[key];
  if (!stat || stat.presentations === 0) return '–';
  const pct = Math.round((stat.correct / stat.presentations) * 100);
  const streakStr = stat.streak > 0 ? ` 🔥${stat.streak}` : '';
  return `${pct}%/${stat.presentations}${streakStr}`;
}
</script>
