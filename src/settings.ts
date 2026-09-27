import { GAME_ORDER } from './games.js';
import type { Difficulty, GameId, GameRecord, GameResult, GameSettings, SaveData } from './types.js';

const STORAGE_KEY = 'rhythm-variety:v9';
const LEGACY_KEYS = [
  'deep-rhythm-party:v5',
  'deep-rhythm-party:v4',
  'deep-rhythm-party:v3',
  'deep-rhythm-party:v2',
  'deep-rhythm-party:v1'
] as const;

const DEFAULT_SETTINGS: GameSettings = {
  difficulty: 'easy',
  audioOffsetMs: 0,
  musicVolume: 0.72,
  sfxVolume: 0.9,
  haptics: true,
  autoPractice: true,
  showPracticeHints: true,
  externalMusic: true,
  freeSelect: true,
  showHud: false,
  showLiveJudgement: false
};

const emptyRecord = (): GameRecord => ({ highScore: 0, bestCombo: 0, bestStars: 0, plays: 0 });
const emptyGames = (): Record<GameId, GameRecord> => Object.fromEntries(GAME_ORDER.map((id) => [id, emptyRecord()])) as Record<GameId, GameRecord>;
const DEFAULT_SAVE: SaveData = { version: 9, settings: { ...DEFAULT_SETTINGS }, games: emptyGames(), totalPlays: 0 };

const isDifficulty = (v: unknown): v is Difficulty => v === 'easy' || v === 'normal' || v === 'hard';
const clamp = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, Number.isFinite(v) ? v : min));
const nn = (v: unknown): number => Number.isFinite(Number(v)) ? Math.max(0, Number(v)) : 0;
const stars = (v: unknown): 0|1|2|3 => Math.min(3, Math.round(nn(v))) as 0|1|2|3;
const bool = (v: unknown, fallback: boolean): boolean => typeof v === 'boolean' ? v : fallback;

export interface RecordResultOutcome {
  newHighScore: boolean;
  newBestStars: boolean;
  unlockedGameId: GameId | null;
}

export class SaveStore {
  private data: SaveData;

  constructor() {
    this.data = this.load();
    this.persist();
  }

  get snapshot(): SaveData { return structuredClone(this.data); }
  get settings(): GameSettings { return { ...this.data.settings }; }
  get totalStars(): number { return GAME_ORDER.reduce((sum, id) => sum + this.data.games[id].bestStars, 0); }
  getRecord(id: GameId): GameRecord { return { ...this.data.games[id] }; }

  isUnlocked(id: GameId): boolean {
    if (this.data.settings.freeSelect) return true;
    const index = GAME_ORDER.indexOf(id);
    if (index <= 0) return true;
    const previous = GAME_ORDER[index - 1];
    return previous ? this.data.games[previous].plays > 0 : false;
  }

  updateSettings(next: Partial<GameSettings>): void {
    const c = this.data.settings;
    this.data.settings = {
      difficulty: isDifficulty(next.difficulty) ? next.difficulty : c.difficulty,
      audioOffsetMs: clamp(Number.isFinite(next.audioOffsetMs) ? Number(next.audioOffsetMs) : c.audioOffsetMs, -250, 250),
      musicVolume: clamp(Number.isFinite(next.musicVolume) ? Number(next.musicVolume) : c.musicVolume, 0, 1),
      sfxVolume: clamp(Number.isFinite(next.sfxVolume) ? Number(next.sfxVolume) : c.sfxVolume, 0, 1),
      haptics: typeof next.haptics === 'boolean' ? next.haptics : c.haptics,
      autoPractice: typeof next.autoPractice === 'boolean' ? next.autoPractice : c.autoPractice,
      showPracticeHints: typeof next.showPracticeHints === 'boolean' ? next.showPracticeHints : c.showPracticeHints,
      externalMusic: typeof next.externalMusic === 'boolean' ? next.externalMusic : c.externalMusic,
      freeSelect: typeof next.freeSelect === 'boolean' ? next.freeSelect : c.freeSelect,
      showHud: typeof next.showHud === 'boolean' ? next.showHud : c.showHud,
      showLiveJudgement: typeof next.showLiveJudgement === 'boolean' ? next.showLiveJudgement : c.showLiveJudgement
    };
    this.persist();
  }

  recordResult(result: GameResult): RecordResultOutcome {
    const record = this.data.games[result.gameId];
    const beforeHigh = record.highScore;
    const beforeStars = record.bestStars;
    const index = GAME_ORDER.indexOf(result.gameId);
    const nextId = index >= 0 ? (GAME_ORDER[index + 1] ?? null) : null;
    const wasUnlocked = nextId ? this.isUnlocked(nextId) : true;

    record.highScore = Math.max(record.highScore, Math.round(result.score));
    record.bestCombo = Math.max(record.bestCombo, result.maxCombo);
    record.bestStars = Math.max(record.bestStars, result.stars) as 0|1|2|3;
    record.plays += 1;
    this.data.totalPlays += 1;
    this.persist();

    return {
      newHighScore: result.score > beforeHigh,
      newBestStars: result.stars > beforeStars,
      unlockedGameId: nextId && !wasUnlocked && this.isUnlocked(nextId) ? nextId : null
    };
  }

  private load(): SaveData {
    const current = this.read(STORAGE_KEY);
    if (current) return this.normalize(current);

    const previousV8 = this.read('rhythm-variety:v8');
    if (previousV8) return this.migrateLegacySettings(previousV8);

    const previousV7 = this.read('rhythm-variety:v7');
    if (previousV7) return this.migrateLegacySettings(previousV7);

    const previous = this.read('rhythm-variety:v6');
    if (previous) return this.migrateLegacySettings(previous);

    for (const key of LEGACY_KEYS) {
      const legacy = this.read(key);
      if (legacy) return this.migrateLegacySettings(legacy);
    }
    return structuredClone(DEFAULT_SAVE);
  }

  private normalize(raw: unknown): SaveData {
    if (!raw || typeof raw !== 'object') return structuredClone(DEFAULT_SAVE);
    const p = raw as Record<string, unknown>;
    const s = p.settings && typeof p.settings === 'object' ? p.settings as Record<string, unknown> : {};
    const games = emptyGames();
    const rawGames = p.games && typeof p.games === 'object' ? p.games as Partial<Record<GameId, unknown>> : {};
    for (const id of GAME_ORDER) {
      const r = rawGames[id] && typeof rawGames[id] === 'object' ? rawGames[id] as Record<string, unknown> : {};
      games[id] = { highScore: nn(r.highScore), bestCombo: nn(r.bestCombo), bestStars: stars(r.bestStars), plays: nn(r.plays) };
    }
    return {
      version: 9,
      settings: this.normalizeSettings(s),
      games,
      totalPlays: nn(p.totalPlays)
    };
  }

  private migrateLegacySettings(raw: unknown): SaveData {
    if (!raw || typeof raw !== 'object') return structuredClone(DEFAULT_SAVE);
    const p = raw as Record<string, unknown>;
    const s = p.settings && typeof p.settings === 'object' ? p.settings as Record<string, unknown> : {};
    const normalized = this.normalizeSettings(s);
    const legacyMaster = Number(s.masterVolume);
    if (Number.isFinite(legacyMaster) && !('musicVolume' in s)) {
      normalized.musicVolume = clamp(legacyMaster * .9, 0, 1);
      normalized.sfxVolume = clamp(legacyMaster, 0, 1);
    }
    return { version: 9, settings: normalized, games: emptyGames(), totalPlays: 0 };
  }

  private normalizeSettings(s: Record<string, unknown>): GameSettings {
    return {
      difficulty: isDifficulty(s.difficulty) ? s.difficulty : DEFAULT_SETTINGS.difficulty,
      audioOffsetMs: clamp(Number(s.audioOffsetMs ?? 0), -250, 250),
      musicVolume: clamp(Number(s.musicVolume ?? DEFAULT_SETTINGS.musicVolume), 0, 1),
      sfxVolume: clamp(Number(s.sfxVolume ?? DEFAULT_SETTINGS.sfxVolume), 0, 1),
      haptics: bool(s.haptics, true),
      autoPractice: bool(s.autoPractice, true),
      showPracticeHints: bool(s.showPracticeHints, true),
      externalMusic: bool(s.externalMusic, true),
      freeSelect: bool(s.freeSelect, true),
      showHud: bool(s.showHud, false),
      showLiveJudgement: bool(s.showLiveJudgement, false)
    };
  }

  private read(key: string): unknown | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (error) {
      console.warn('Save failed:', error);
    }
  }
}
