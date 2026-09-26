export type Difficulty = 'easy' | 'normal' | 'hard';
export type Judge = 'PERFECT' | 'GREAT' | 'GOOD' | 'MISS';

export interface GameSettings {
  difficulty: Difficulty;
  audioOffsetMs: number;
  masterVolume: number;
}

export interface SaveData {
  version: 1;
  settings: GameSettings;
  highScore: number;
  bestCombo: number;
  plays: number;
}

export interface JudgeCounts {
  PERFECT: number;
  GREAT: number;
  GOOD: number;
  MISS: number;
}

export interface GameResult {
  score: number;
  maxCombo: number;
  counts: JudgeCounts;
  stars: 1 | 2 | 3;
}

export interface TargetState {
  beat: number;
  judge?: Judge;
  deltaMs?: number;
}

export interface RenderState {
  mode: 'title' | 'game' | 'result' | 'settings';
  beat: number;
  targets: readonly TargetState[];
  lastJudge?: Judge;
  lastJudgeAgeMs: number;
  combo: number;
  hitPulse: number;
}
