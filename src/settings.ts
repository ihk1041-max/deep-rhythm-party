import type { Difficulty, GameSettings, SaveData } from './types.js';

const STORAGE_KEY = 'deep-rhythm-party:v1';

const DEFAULT_SETTINGS: GameSettings = {
  difficulty: 'easy',
  audioOffsetMs: 0,
  masterVolume: 0.8
};

const DEFAULT_SAVE: SaveData = {
  version: 1,
  settings: { ...DEFAULT_SETTINGS },
  highScore: 0,
  bestCombo: 0,
  plays: 0
};

const isDifficulty = (value: unknown): value is Difficulty =>
  value === 'easy' || value === 'normal' || value === 'hard';

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export class SaveStore {
  private data: SaveData;

  constructor() {
    this.data = this.load();
  }

  get snapshot(): SaveData {
    return structuredClone(this.data);
  }

  get settings(): GameSettings {
    return { ...this.data.settings };
  }

  updateSettings(next: Partial<GameSettings>): void {
    const current = this.data.settings;
    this.data.settings = {
      difficulty: isDifficulty(next.difficulty) ? next.difficulty : current.difficulty,
      audioOffsetMs: clamp(
        Number.isFinite(next.audioOffsetMs) ? Number(next.audioOffsetMs) : current.audioOffsetMs,
        -200,
        200
      ),
      masterVolume: clamp(
        Number.isFinite(next.masterVolume) ? Number(next.masterVolume) : current.masterVolume,
        0,
        1
      )
    };
    this.persist();
  }

  recordResult(score: number, maxCombo: number): void {
    this.data.highScore = Math.max(this.data.highScore, Math.round(score));
    this.data.bestCombo = Math.max(this.data.bestCombo, maxCombo);
    this.data.plays += 1;
    this.persist();
  }

  private load(): SaveData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(DEFAULT_SAVE);

      const parsed = JSON.parse(raw) as Partial<SaveData>;
      const settings = parsed.settings ?? DEFAULT_SETTINGS;
      return {
        version: 1,
        settings: {
          difficulty: isDifficulty(settings.difficulty) ? settings.difficulty : DEFAULT_SETTINGS.difficulty,
          audioOffsetMs: clamp(Number(settings.audioOffsetMs ?? 0), -200, 200),
          masterVolume: clamp(Number(settings.masterVolume ?? 0.8), 0, 1)
        },
        highScore: Math.max(0, Number(parsed.highScore ?? 0)),
        bestCombo: Math.max(0, Number(parsed.bestCombo ?? 0)),
        plays: Math.max(0, Number(parsed.plays ?? 0))
      };
    } catch {
      return structuredClone(DEFAULT_SAVE);
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
