import { GAME_ORDER } from './games.js';
const STORAGE_KEY = 'deep-rhythm-party:v5';
const V4_STORAGE_KEY = 'deep-rhythm-party:v4';
const V3_STORAGE_KEY = 'deep-rhythm-party:v3';
const V2_STORAGE_KEY = 'deep-rhythm-party:v2';
const V1_STORAGE_KEY = 'deep-rhythm-party:v1';
const DEFAULT_SETTINGS = {
    difficulty: 'easy', audioOffsetMs: 0, musicVolume: 0.72, sfxVolume: 0.9,
    haptics: true, autoPractice: true
};
const emptyRecord = () => ({ highScore: 0, bestCombo: 0, bestStars: 0, plays: 0 });
const emptyGames = () => ({
    'mendako-pop': emptyRecord(), 'crab-clap': emptyRecord(), 'fugu-puku': emptyRecord(),
    'robot-stamp': emptyRecord(), 'cat-dj': emptyRecord(), 'ninja-mochi': emptyRecord(), 'deep-remix': emptyRecord()
});
const DEFAULT_SAVE = { version: 5, settings: { ...DEFAULT_SETTINGS }, games: emptyGames(), totalPlays: 0 };
const isDifficulty = (v) => v === 'easy' || v === 'normal' || v === 'hard';
const clamp = (v, min, max) => Math.min(max, Math.max(min, Number.isFinite(v) ? v : min));
const nn = (v) => Number.isFinite(Number(v)) ? Math.max(0, Number(v)) : 0;
const stars = (v) => Math.min(3, Math.round(nn(v)));
const bool = (v, fallback) => typeof v === 'boolean' ? v : fallback;
const starsFromScore = (score) => score >= 90 ? 3 : score >= 68 ? 2 : score >= 48 ? 1 : 0;
export class SaveStore {
    data;
    constructor() { this.data = this.load(); this.persist(); }
    get snapshot() { return structuredClone(this.data); }
    get settings() { return { ...this.data.settings }; }
    get totalStars() { return GAME_ORDER.reduce((sum, id) => sum + this.data.games[id].bestStars, 0); }
    getRecord(id) { return { ...this.data.games[id] }; }
    isUnlocked(id) {
        const index = GAME_ORDER.indexOf(id);
        if (index <= 0)
            return true;
        const prev = GAME_ORDER[index - 1];
        return prev ? this.data.games[prev].plays > 0 : false;
    }
    updateSettings(next) {
        const c = this.data.settings;
        this.data.settings = {
            difficulty: isDifficulty(next.difficulty) ? next.difficulty : c.difficulty,
            audioOffsetMs: clamp(Number.isFinite(next.audioOffsetMs) ? Number(next.audioOffsetMs) : c.audioOffsetMs, -250, 250),
            musicVolume: clamp(Number.isFinite(next.musicVolume) ? Number(next.musicVolume) : c.musicVolume, 0, 1),
            sfxVolume: clamp(Number.isFinite(next.sfxVolume) ? Number(next.sfxVolume) : c.sfxVolume, 0, 1),
            haptics: typeof next.haptics === 'boolean' ? next.haptics : c.haptics,
            autoPractice: typeof next.autoPractice === 'boolean' ? next.autoPractice : c.autoPractice
        };
        this.persist();
    }
    recordResult(result) {
        const record = this.data.games[result.gameId];
        const beforeHigh = record.highScore;
        const beforeStars = record.bestStars;
        const index = GAME_ORDER.indexOf(result.gameId);
        const nextId = index >= 0 ? (GAME_ORDER[index + 1] ?? null) : null;
        const wasUnlocked = nextId ? this.isUnlocked(nextId) : true;
        record.highScore = Math.max(record.highScore, Math.round(result.score));
        record.bestCombo = Math.max(record.bestCombo, result.maxCombo);
        record.bestStars = Math.max(record.bestStars, result.stars);
        record.plays += 1;
        this.data.totalPlays += 1;
        this.persist();
        return { newHighScore: result.score > beforeHigh, newBestStars: result.stars > beforeStars, unlockedGameId: nextId && !wasUnlocked && this.isUnlocked(nextId) ? nextId : null };
    }
    load() {
        const v5 = this.read(STORAGE_KEY);
        if (v5)
            return this.normalize(v5);
        const v4 = this.read(V4_STORAGE_KEY);
        if (v4)
            return this.normalize(v4);
        const v3 = this.read(V3_STORAGE_KEY);
        if (v3)
            return this.normalize(v3);
        const v2 = this.read(V2_STORAGE_KEY);
        if (v2)
            return this.migrateLegacy(v2);
        const v1 = this.read(V1_STORAGE_KEY);
        if (v1)
            return this.migrateV1(v1);
        return structuredClone(DEFAULT_SAVE);
    }
    normalize(raw) {
        if (!raw || typeof raw !== 'object')
            return structuredClone(DEFAULT_SAVE);
        const p = raw;
        const s = p.settings && typeof p.settings === 'object' ? p.settings : {};
        return { version: 5, settings: {
                difficulty: isDifficulty(s.difficulty) ? s.difficulty : DEFAULT_SETTINGS.difficulty,
                audioOffsetMs: clamp(Number(s.audioOffsetMs ?? 0), -250, 250), musicVolume: clamp(Number(s.musicVolume ?? .72), 0, 1),
                sfxVolume: clamp(Number(s.sfxVolume ?? .9), 0, 1), haptics: bool(s.haptics, true), autoPractice: bool(s.autoPractice, true)
            }, games: this.normalizeGames(p.games), totalPlays: nn(p.totalPlays) };
    }
    migrateLegacy(raw) {
        if (!raw || typeof raw !== 'object')
            return structuredClone(DEFAULT_SAVE);
        const p = raw;
        const s = p.settings && typeof p.settings === 'object' ? p.settings : {};
        const master = clamp(Number(s.masterVolume ?? .8), 0, 1);
        const games = this.normalizeGames(p.games);
        return { version: 5, settings: { difficulty: isDifficulty(s.difficulty) ? s.difficulty : 'easy', audioOffsetMs: clamp(Number(s.audioOffsetMs ?? 0), -250, 250), musicVolume: master * .9, sfxVolume: master, haptics: true, autoPractice: true }, games, totalPlays: Math.max(nn(p.totalPlays), GAME_ORDER.reduce((sum, id) => sum + games[id].plays, 0)) };
    }
    migrateV1(raw) {
        if (!raw || typeof raw !== 'object')
            return structuredClone(DEFAULT_SAVE);
        const p = raw;
        const s = p.settings && typeof p.settings === 'object' ? p.settings : {};
        const master = clamp(Number(s.masterVolume ?? .8), 0, 1);
        const high = nn(p.highScore);
        const plays = nn(p.plays);
        const games = emptyGames();
        games['mendako-pop'] = { highScore: high, bestCombo: nn(p.bestCombo), bestStars: starsFromScore(high), plays };
        return { version: 5, settings: { difficulty: isDifficulty(s.difficulty) ? s.difficulty : 'easy', audioOffsetMs: clamp(Number(s.audioOffsetMs ?? 0), -250, 250), musicVolume: master * .9, sfxVolume: master, haptics: true, autoPractice: true }, games, totalPlays: plays };
    }
    normalizeGames(raw) {
        const source = raw && typeof raw === 'object' ? raw : {};
        const games = emptyGames();
        for (const id of GAME_ORDER) {
            const r = source[id] && typeof source[id] === 'object' ? source[id] : {};
            games[id] = { highScore: nn(r.highScore), bestCombo: nn(r.bestCombo), bestStars: stars(r.bestStars), plays: nn(r.plays) };
        }
        return games;
    }
    read(key) { try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
    }
    catch {
        return null;
    } }
    persist() { try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    }
    catch (e) {
        console.warn('Save failed:', e);
    } }
}
//# sourceMappingURL=settings.js.map