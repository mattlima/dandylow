import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface ProfilePreferences {
    level: number;
    clef: string;
    inputMode: 'microphone' | 'keyboard';
}

export interface ProfileStats {
    totalAttempts: number;
    totalCorrect: number;
    bestStreak: number;
    sessionsPlayed: number;
}

export interface Profile {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    preferences: ProfilePreferences;
    stats: ProfileStats;
}

interface StorageSchema {
    version: number;
    activeProfileId: string | null;
    profiles: Record<string, Profile>;
}

const STORAGE_KEY = 'dandylow-data';
const SCHEMA_VERSION = 1;

function defaultPreferences(): ProfilePreferences {
    return { level: 1, clef: 'treble', inputMode: 'microphone' };
}

function defaultStats(): ProfileStats {
    return { totalAttempts: 0, totalCorrect: 0, bestStreak: 0, sessionsPlayed: 0 };
}

function migrateSchema(raw: unknown): StorageSchema {
    // Baseline: if the data is unrecognized or an old version, return a clean slate.
    if (
        !raw ||
        typeof raw !== 'object' ||
        (raw as StorageSchema).version !== SCHEMA_VERSION
    ) {
        return { version: SCHEMA_VERSION, activeProfileId: null, profiles: {} };
    }
    return raw as StorageSchema;
}

export const useProfilesStore = defineStore('profiles', () => {
    const profiles = ref<Record<string, Profile>>({});
    const activeProfileId = ref<string | null>(null);

    const activeProfile = computed<Profile | null>(() =>
        activeProfileId.value ? (profiles.value[activeProfileId.value] ?? null) : null
    );

    function loadFromStorage(): void {
        try {
            const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
            const data = migrateSchema(raw);
            profiles.value = data.profiles;
            activeProfileId.value = data.activeProfileId;
        } catch {
            // Corrupt data — start clean
            profiles.value = {};
            activeProfileId.value = null;
        }
    }

    function saveToStorage(): void {
        const data: StorageSchema = {
            version: SCHEMA_VERSION,
            activeProfileId: activeProfileId.value,
            profiles: profiles.value
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    function createProfile(name: string): Profile {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const profile: Profile = {
            id,
            name,
            createdAt: now,
            updatedAt: now,
            preferences: defaultPreferences(),
            stats: defaultStats()
        };
        profiles.value = { ...profiles.value, [id]: profile };
        saveToStorage();
        return profile;
    }

    function setActiveProfile(id: string | null): void {
        activeProfileId.value = id;
        saveToStorage();
    }

    function updatePreferences(id: string, prefs: Partial<ProfilePreferences>): void {
        const profile = profiles.value[id];
        if (!profile) return;
        profiles.value = {
            ...profiles.value,
            [id]: {
                ...profile,
                preferences: { ...profile.preferences, ...prefs },
                updatedAt: new Date().toISOString()
            }
        };
        saveToStorage();
    }

    function updateStats(id: string, delta: Partial<ProfileStats>): void {
        const profile = profiles.value[id];
        if (!profile) return;
        const merged: ProfileStats = {
            totalAttempts: profile.stats.totalAttempts + (delta.totalAttempts ?? 0),
            totalCorrect: profile.stats.totalCorrect + (delta.totalCorrect ?? 0),
            bestStreak: Math.max(profile.stats.bestStreak, delta.bestStreak ?? 0),
            sessionsPlayed: profile.stats.sessionsPlayed + (delta.sessionsPlayed ?? 0)
        };
        profiles.value = {
            ...profiles.value,
            [id]: { ...profile, stats: merged, updatedAt: new Date().toISOString() }
        };
        saveToStorage();
    }

    return {
        profiles,
        activeProfileId,
        activeProfile,
        loadFromStorage,
        saveToStorage,
        createProfile,
        setActiveProfile,
        updatePreferences,
        updateStats
    };
});
