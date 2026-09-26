import { GAME_ORDER } from './games.js';
import type { Difficulty, GameId, GameRecord, GameResult, GameSettings, SaveData } from './types.js';

const STORAGE_KEY = 'deep-rhythm-party:v4';
const V3_STORAGE_KEY = 'deep-rhythm-party:v3';
const V2_STORAGE_KEY = 'deep-rhythm-party:v2';
const V1_STORAGE_KEY = 'deep-rhythm-party:v1';

const DEFAULT_SETTINGS: GameSettings = {
  difficulty: 'easy', audioOffsetMs: 0, musicVolume: 0.72, sfxVolume: 0.9,
  haptics: true, autoPractice: true
};
const emptyRecord = (): GameRecord => ({ highScore: 0, bestCombo: 0, bestStars: 0, plays: 0 });
const emptyGames = (): Record<GameId, GameRecord> => ({
  'mendako-pop': emptyRecord(), 'crab-clap': emptyRecord(), 'fugu-puku': emptyRecord(), 'deep-remix': emptyRecord()
});
const DEFAULT_SAVE: SaveData = { version: 4, settings: { ...DEFAULT_SETTINGS }, games: emptyGames(), totalPlays: 0 };
const isDifficulty = (v: unknown): v is Difficulty => v === 'easy' || v === 'normal' || v === 'hard';
const clamp = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, Number.isFinite(v) ? v : min));
const nn = (v: unknown): number => Number.isFinite(Number(v)) ? Math.max(0, Number(v)) : 0;
const stars = (v: unknown): 0|1|2|3 => Math.min(3, Math.round(nn(v))) as 0|1|2|3;
const bool = (v: unknown, fallback: boolean): boolean => typeof v === 'boolean' ? v : fallback;
const starsFromScore = (score: number): 0|1|2|3 => score >= 90 ? 3 : score >= 68 ? 2 : score >= 48 ? 1 : 0;

export interface RecordResultOutcome { newHighScore: boolean; newBestStars: boolean; unlockedGameId: GameId | null; }

export class SaveStore {
  private data: SaveData;
  constructor() { this.data = this.load(); this.persist(); }
  get snapshot(): SaveData { return structuredClone(this.data); }
  get settings(): GameSettings { return { ...this.data.settings }; }
  get totalStars(): number { return GAME_ORDER.reduce((sum, id) => sum + this.data.games[id].bestStars, 0); }
  getRecord(id: GameId): GameRecord { return { ...this.data.games[id] }; }
  isUnlocked(id: GameId): boolean {
    const index = GAME_ORDER.indexOf(id); if (index <= 0) return true;
    const prev = GAME_ORDER[index - 1]; return prev ? this.data.games[prev].plays > 0 : false;
  }
  updateSettings(next: Partial<GameSettings>): void {
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
  recordResult(result: GameResult): RecordResultOutcome {
    const record = this.data.games[result.gameId]; const beforeHigh = record.highScore; const beforeStars = record.bestStars;
    const index = GAME_ORDER.indexOf(result.gameId); const nextId = index >= 0 ? (GAME_ORDER[index + 1] ?? null) : null;
    const wasUnlocked = nextId ? this.isUnlocked(nextId) : true;
    record.highScore = Math.max(record.highScore, Math.round(result.score)); record.bestCombo = Math.max(record.bestCombo, result.maxCombo);
    record.bestStars = Math.max(record.bestStars, result.stars) as 0|1|2|3; record.plays += 1; this.data.totalPlays += 1; this.persist();
    return { newHighScore: result.score > beforeHigh, newBestStars: result.stars > beforeStars, unlockedGameId: nextId && !wasUnlocked && this.isUnlocked(nextId) ? nextId : null };
  }
  private load(): SaveData {
    const v4 = this.read(STORAGE_KEY); if (v4) return this.normalize(v4);
    const v3 = this.read(V3_STORAGE_KEY); if (v3) return this.normalize(v3);
    const v2 = this.read(V2_STORAGE_KEY); if (v2) return this.migrateLegacy(v2);
    const v1 = this.read(V1_STORAGE_KEY); if (v1) return this.migrateV1(v1);
    return structuredClone(DEFAULT_SAVE);
  }
  private normalize(raw: unknown): SaveData {
    if (!raw || typeof raw !== 'object') return structuredClone(DEFAULT_SAVE);
    const p = raw as Record<string, unknown>; const s = p.settings && typeof p.settings === 'object' ? p.settings as Record<string, unknown> : {};
    return { version: 4, settings: {
      difficulty: isDifficulty(s.difficulty) ? s.difficulty : DEFAULT_SETTINGS.difficulty,
      audioOffsetMs: clamp(Number(s.audioOffsetMs ?? 0), -250, 250), musicVolume: clamp(Number(s.musicVolume ?? .72), 0, 1),
      sfxVolume: clamp(Number(s.sfxVolume ?? .9), 0, 1), haptics: bool(s.haptics, true), autoPractice: bool(s.autoPractice, true)
    }, games: this.normalizeGames(p.games), totalPlays: nn(p.totalPlays) };
  }
  private migrateLegacy(raw: unknown): SaveData {
    if (!raw || typeof raw !== 'object') return structuredClone(DEFAULT_SAVE);
    const p = raw as Record<string, unknown>; const s = p.settings && typeof p.settings === 'object' ? p.settings as Record<string, unknown> : {};
    const master = clamp(Number(s.masterVolume ?? .8), 0, 1); const games = this.normalizeGames(p.games);
    return { version: 4, settings: { difficulty: isDifficulty(s.difficulty) ? s.difficulty : 'easy', audioOffsetMs: clamp(Number(s.audioOffsetMs ?? 0), -250, 250), musicVolume: master * .9, sfxVolume: master, haptics: true, autoPractice: true }, games, totalPlays: Math.max(nn(p.totalPlays), GAME_ORDER.reduce((sum,id)=>sum+games[id].plays,0)) };
  }
  private migrateV1(raw: unknown): SaveData {
    if (!raw || typeof raw !== 'object') return structuredClone(DEFAULT_SAVE);
    const p = raw as Record<string, unknown>; const s = p.settings && typeof p.settings === 'object' ? p.settings as Record<string, unknown> : {};
    const master = clamp(Number(s.masterVolume ?? .8),0,1); const high = nn(p.highScore); const plays = nn(p.plays); const games = emptyGames();
    games['mendako-pop'] = { highScore: high, bestCombo: nn(p.bestCombo), bestStars: starsFromScore(high), plays };
    return { version:4, settings:{ difficulty:isDifficulty(s.difficulty)?s.difficulty:'easy', audioOffsetMs:clamp(Number(s.audioOffsetMs ?? 0),-250,250), musicVolume:master*.9, sfxVolume:master, haptics:true, autoPractice:true }, games, totalPlays:plays };
  }
  private normalizeGames(raw: unknown): Record<GameId, GameRecord> {
    const source = raw && typeof raw === 'object' ? raw as Partial<Record<GameId, unknown>> : {}; const games = emptyGames();
    for (const id of GAME_ORDER) { const r = source[id] && typeof source[id] === 'object' ? source[id] as Record<string, unknown> : {}; games[id] = { highScore: nn(r.highScore), bestCombo: nn(r.bestCombo), bestStars: stars(r.bestStars), plays: nn(r.plays) }; }
    return games;
  }
  private read(key:string): unknown|null { try { const raw=localStorage.getItem(key); return raw ? JSON.parse(raw) : null; } catch { return null; } }
  private persist(): void { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data)); } catch (e) { console.warn('Save failed:', e); } }
}
