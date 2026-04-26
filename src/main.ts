import { createApp, watchEffect } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import './styles.css';

const pinia = createPinia();
const app = createApp(App);
app.use(pinia);

// Load persisted profile data before mounting so components see it on first render.
import { useProfilesStore } from './stores/profiles';
import { useGameStore } from './stores/game';

const profilesStore = useProfilesStore();
profilesStore.loadFromStorage();

// Sync active profile stats whenever the game score changes.
let prevTotal = 0;
let prevCorrect = 0;
let prevStreak = 0;

watchEffect(() => {
    const gameStore = useGameStore();
    const id = profilesStore.activeProfileId;
    if (!id) return;

    const { correct, total } = gameStore.score;
    const streak = gameStore.streak;

    const attemptsDelta = total - prevTotal;
    const correctDelta = correct - prevCorrect;

    if (attemptsDelta > 0) {
        profilesStore.updateStats(id, {
            totalAttempts: attemptsDelta,
            totalCorrect: correctDelta,
            bestStreak: streak
        });
    }

    prevTotal = total;
    prevCorrect = correct;
    prevStreak = streak;
});

app.mount('#app');
