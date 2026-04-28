import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { AdvancedSettingsInput } from '../constants';
import { resolveAdvancedSettings } from '../constants';

export interface ProfilePreferences {
    level: number;
    clef: string;
    inputMode: 'microphone' | 'keyboard';
    sensitivityLevel: number; // 1-15; maps to mic volume threshold
    sequenceLength: number;   // notes per sequence (default 10)
    advancedSettings: AdvancedSettingsInput;
}

export interface ProfileStats {
    totalAttempts: number;
    totalCorrect: number;
    bestStreak: number;
    sessionsPlayed: number;
}

export interface PitchStat {
    presentations: number;
    correct: number;
    incorrect: number;
    streak: number; // current consecutive correct count; resets to 0 on any miss
}

export interface Profile {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    preferences: ProfilePreferences;
    stats: ProfileStats;
    pitchStats: Record<string, PitchStat>; // keyed by scientific pitch, e.g. "C4"
}

interface StorageSchema {
    version: number;
    activeProfileId: string | null;
    profiles: Record<string, Profile>;
}

const STORAGE_KEY = 'dandylow-data';
const SCHEMA_VERSION = 5;

function defaultPreferences(): ProfilePreferences {
    return {
        level: 1,
        clef: 'treble',
        inputMode: 'microphone',
        sensitivityLevel: 5,
        sequenceLength: 10,
        advancedSettings: resolveAdvancedSettings()
    };
}

function defaultStats(): ProfileStats {
    return { totalAttempts: 0, totalCorrect: 0, bestStreak: 0, sessionsPlayed: 0 };
}

function migrateSchema(raw: unknown): StorageSchema {
    if (!raw || typeof raw !== 'object') {
        return { version: SCHEMA_VERSION, activeProfileId: null, profiles: {} };
    }
    const data = raw as StorageSchema;

    // v1 or unknown → reset
    if (!data.version || data.version < 2) {
        return { version: SCHEMA_VERSION, activeProfileId: null, profiles: {} };
    }

    // v2 → v3: add sequenceLength to preferences and pitchStats to profiles (additive)
    if (data.version === 2) {
        const migratedProfiles: Record<string, Profile> = {};
        for (const [id, p] of Object.entries(data.profiles ?? {})) {
            migratedProfiles[id] = {
                ...p,
                preferences: { ...p.preferences, sequenceLength: p.preferences.sequenceLength ?? 10 },
                pitchStats: {}
            };
        }
        return { version: SCHEMA_VERSION, activeProfileId: data.activeProfileId, profiles: migratedProfiles };
    }

    // v3 → v4: add streak: 0 to all existing PitchStat entries (additive)
    if (data.version === 3) {
        const migratedProfiles: Record<string, Profile> = {};
        for (const [id, p] of Object.entries(data.profiles ?? {})) {
            const migratedStats: Record<string, PitchStat> = {};
            for (const [pitch, stat] of Object.entries(p.pitchStats ?? {})) {
                migratedStats[pitch] = { ...stat, streak: (stat as PitchStat & { streak?: number }).streak ?? 0 };
            }
            migratedProfiles[id] = { ...p, pitchStats: migratedStats };
        }
        return { version: SCHEMA_VERSION, activeProfileId: data.activeProfileId, profiles: migratedProfiles };
    }

    // v4 → v5: add per-profile advanced settings defaults and normalize all profile preferences
    if (data.version === 4) {
        const migratedProfiles: Record<string, Profile> = {};
        for (const [id, p] of Object.entries(data.profiles ?? {})) {
            migratedProfiles[id] = {
                ...p,
                preferences: {
                    ...p.preferences,
                    advancedSettings: resolveAdvancedSettings((p.preferences as ProfilePreferences).advancedSettings)
                }
            };
        }
        return { version: SCHEMA_VERSION, activeProfileId: data.activeProfileId, profiles: migratedProfiles };
    }

    // v5 — current: normalize in case values are manually edited in localStorage
    const normalizedProfiles: Record<string, Profile> = {};
    for (const [id, p] of Object.entries(data.profiles ?? {})) {
        normalizedProfiles[id] = {
            ...p,
            preferences: {
                ...p.preferences,
                advancedSettings: resolveAdvancedSettings((p.preferences as ProfilePreferences).advancedSettings)
            }
        };
    }
    return {
        version: SCHEMA_VERSION,
        activeProfileId: data.activeProfileId,
        profiles: normalizedProfiles
    };
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
            stats: defaultStats(),
            pitchStats: {}
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

    function updatePitchStat(id: string, scientificPitch: string, correct: boolean): void {
        const profile = profiles.value[id];
        if (!profile) return;
        const existing = profile.pitchStats[scientificPitch] ?? { presentations: 0, correct: 0, incorrect: 0, streak: 0 };
        const updated: PitchStat = {
            presentations: existing.presentations + 1,
            correct: existing.correct + (correct ? 1 : 0),
            incorrect: existing.incorrect + (correct ? 0 : 1),
            streak: correct ? (existing.streak ?? 0) + 1 : 0
        };
        profiles.value = {
            ...profiles.value,
            [id]: {
                ...profile,
                pitchStats: { ...profile.pitchStats, [scientificPitch]: updated },
                updatedAt: new Date().toISOString()
            }
        };
        saveToStorage();
    }

    function resetActiveProfileData(): void {
        const id = activeProfileId.value;
        if (!id) return;
        const profile = profiles.value[id];
        if (!profile) return;
        profiles.value = {
            ...profiles.value,
            [id]: {
                ...profile,
                pitchStats: {},
                stats: { totalAttempts: 0, totalCorrect: 0, bestStreak: 0, sessionsPlayed: 0 },
                updatedAt: new Date().toISOString()
            }
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
        updateStats,
        updatePitchStat,
        resetActiveProfileData
    };
});
