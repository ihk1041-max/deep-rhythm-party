import { GAME_ORDER } from './games.js';
const STORAGE_KEY = 'deep-rhythm-party:v2';
const LEGACY_STORAGE_KEY = 'deep-rhythm-party:v1';
const DEFAULT_SETTINGS = {
    difficulty: 'easy',
    audioOffsetMs: 0,
    masterVolume: 0.8
};
const emptyRecord = () => ({
    highScore: 0,
    bestCombo: 0,
    bestStars: 0,
    plays: 0
});
const DEFAULT_SAVE = {
    version: 2,
    settings: { ...DEFAULT_SETTINGS },
    games: {
        'mendako-pop': emptyRecord(),
        'crab-clap': emptyRecord(),
        'fugu-puku': emptyRecord()
    },
    totalPlays: 0
};
const isDifficulty = (value) => value === 'easy' || value === 'normal' || value === 'hard';
const clamp = (value, min, max) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
const asNonNegative = (value) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? Math.max(0, numeric) : 0;
};
const asStars = (value) => {
    const numeric = Math.round(asNonNegative(value));
    return Math.min(3, numeric);
};
const starsFromScore = (score) => score >= 90 ? 3 : score >= 65 ? 2 : score >= 45 ? 1 : 0;
export class SaveStore {
    data;
    constructor() {
        this.data = this.load();
        this.persist();
    }
    get snapshot() {
        return structuredClone(this.data);
    }
    get settings() {
        return { ...this.data.settings };
    }
    get totalStars() {
        return GAME_ORDER.reduce((sum, gameId) => sum + this.data.games[gameId].bestStars, 0);
    }
    getRecord(gameId) {
        return { ...this.data.games[gameId] };
    }
    isUnlocked(gameId) {
        const index = GAME_ORDER.indexOf(gameId);
        if (index <= 0)
            return true;
        const previous = GAME_ORDER[index - 1];
        return previous ? this.data.games[previous].plays > 0 : false;
    }
    updateSettings(next) {
        const current = this.data.settings;
        this.data.settings = {
            difficulty: isDifficulty(next.difficulty) ? next.difficulty : current.difficulty,
            audioOffsetMs: clamp(Number.isFinite(next.audioOffsetMs) ? Number(next.audioOffsetMs) : current.audioOffsetMs, -200, 200),
            masterVolume: clamp(Number.isFinite(next.masterVolume) ? Number(next.masterVolume) : current.masterVolume, 0, 1)
        };
        this.persist();
    }
    recordResult(result) {
        const record = this.data.games[result.gameId];
        const beforeHighScore = record.highScore;
        const beforeStars = record.bestStars;
        const gameIndex = GAME_ORDER.indexOf(result.gameId);
        const nextGameId = gameIndex >= 0 ? (GAME_ORDER[gameIndex + 1] ?? null) : null;
        const nextWasUnlocked = nextGameId ? this.isUnlocked(nextGameId) : true;
        record.highScore = Math.max(record.highScore, Math.round(result.score));
        record.bestCombo = Math.max(record.bestCombo, result.maxCombo);
        record.bestStars = Math.max(record.bestStars, result.stars);
        record.plays += 1;
        this.data.totalPlays += 1;
        this.persist();
        return {
            newHighScore: result.score > beforeHighScore,
            newBestStars: result.stars > beforeStars,
            unlockedGameId: nextGameId && !nextWasUnlocked && this.isUnlocked(nextGameId) ? nextGameId : null
        };
    }
    load() {
        const current = this.readJson(STORAGE_KEY);
        if (current)
            return this.normalizeV2(current);
        const legacy = this.readJson(LEGACY_STORAGE_KEY);
        if (legacy)
            return this.migrateLegacy(legacy);
        return structuredClone(DEFAULT_SAVE);
    }
    normalizeV2(raw) {
        if (!raw || typeof raw !== 'object')
            return structuredClone(DEFAULT_SAVE);
        const parsed = raw;
        const settingsRaw = parsed.settings && typeof parsed.settings === 'object'
            ? parsed.settings
            : {};
        const gamesRaw = parsed.games && typeof parsed.games === 'object'
            ? parsed.games
            : {};
        const games = {};
        for (const gameId of GAME_ORDER) {
            const recordRaw = gamesRaw[gameId] && typeof gamesRaw[gameId] === 'object'
                ? gamesRaw[gameId]
                : {};
            games[gameId] = {
                highScore: asNonNegative(recordRaw.highScore),
                bestCombo: asNonNegative(recordRaw.bestCombo),
                bestStars: asStars(recordRaw.bestStars),
                plays: asNonNegative(recordRaw.plays)
            };
        }
        const totalFromGames = GAME_ORDER.reduce((sum, gameId) => sum + games[gameId].plays, 0);
        return {
            version: 2,
            settings: {
                difficulty: isDifficulty(settingsRaw.difficulty) ? settingsRaw.difficulty : DEFAULT_SETTINGS.difficulty,
                audioOffsetMs: clamp(Number(settingsRaw.audioOffsetMs ?? 0), -200, 200),
                masterVolume: clamp(Number(settingsRaw.masterVolume ?? 0.8), 0, 1)
            },
            games,
            totalPlays: Math.max(asNonNegative(parsed.totalPlays), totalFromGames)
        };
    }
    migrateLegacy(raw) {
        if (!raw || typeof raw !== 'object')
            return structuredClone(DEFAULT_SAVE);
        const parsed = raw;
        const settingsRaw = parsed.settings && typeof parsed.settings === 'object'
            ? parsed.settings
            : {};
        const highScore = asNonNegative(parsed.highScore);
        const legacyPlays = asNonNegative(parsed.plays);
        const migrated = structuredClone(DEFAULT_SAVE);
        migrated.settings = {
            difficulty: isDifficulty(settingsRaw.difficulty) ? settingsRaw.difficulty : DEFAULT_SETTINGS.difficulty,
            audioOffsetMs: clamp(Number(settingsRaw.audioOffsetMs ?? 0), -200, 200),
            masterVolume: clamp(Number(settingsRaw.masterVolume ?? 0.8), 0, 1)
        };
        migrated.games['mendako-pop'] = {
            highScore,
            bestCombo: asNonNegative(parsed.bestCombo),
            bestStars: starsFromScore(highScore),
            plays: legacyPlays
        };
        migrated.totalPlays = legacyPlays;
        return migrated;
    }
    readJson(key) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : null;
        }
        catch {
            return null;
        }
    }
    persist() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
        }
        catch (error) {
            console.warn('Save failed:', error);
        }
    }
}
//# sourceMappingURL=settings.js.map