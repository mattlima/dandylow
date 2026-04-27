<template>
    <div class="levelup-overlay" @click.self="dismiss">
        <div class="levelup-modal" role="dialog" aria-modal="true" aria-labelledby="levelup-title">
            <div class="levelup-stars">⭐⭐⭐</div>
            <h2 id="levelup-title" class="levelup-heading">Level {{ completedLevel }} complete!</h2>
            <p class="levelup-sub">You've mastered all the notes at this level.</p>
            <p class="levelup-next">Get ready for <strong>Level {{ gameStore.pendingLevelUp }}</strong> 🎵</p>
            <button class="btn-primary levelup-btn" @click="dismiss">Continue →</button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '../stores/game';
import { generateNewSequence } from '../game/noteGenerator';

const gameStore = useGameStore();

const completedLevel = computed(() => (gameStore.pendingLevelUp ?? 2) - 1);

function dismiss(): void {
    const next = gameStore.pendingLevelUp;
    if (next === null) return;
    gameStore.pendingLevelUp = null;
    gameStore.level = next;
    generateNewSequence();
}
</script>
