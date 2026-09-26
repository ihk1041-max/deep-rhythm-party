export type Difficulty = 'easy' | 'normal' | 'hard';
export type Judge = 'PERFECT' | 'GREAT' | 'GOOD' | 'MISS';
export type GameId = 'mendako-pop' | 'crab-clap' | 'fugu-puku';
export type AppMode = 'title' | 'select' | 'game' | 'result' | 'settings';
export type CharacterKind = 'mendako' | 'crab' | 'fugu';

export interface GameSettings {
  difficulty: Difficulty;
  audioOffsetMs: number;
  musicVolume: number;
  sfxVolume: number;
  haptics: boolean;
}

export interface GameRecord {
  highScore: number;
  bestCombo: number;
  bestStars: 0 | 1 | 2 | 3;
  plays: number;
}

export interface SaveData {
  version: 3;
  settings: GameSettings;
  games: Record<GameId, GameRecord>;
  totalPlays: number;
}

export interface JudgeCounts {
  PERFECT: number;
  GREAT: number;
  GOOD: number;
  MISS: number;
}

export interface GameResult {
  gameId: GameId;
  score: number;
  maxCombo: number;
  counts: JudgeCounts;
  stars: 0 | 1 | 2 | 3;
  averageAbsOffsetMs: number;
}

export interface TargetState {
  beat: number;
  judge?: Judge;
  deltaMs?: number;
}

export interface SongSection {
  startBeat: number;
  label: string;
}

export interface GameDefinition {
  id: GameId;
  stage: number;
  title: string;
  shortDescription: string;
  instruction: string;
  bpm: number;
  endBeat: number;
  targets: readonly number[];
  cueBeats: readonly number[];
  sections: readonly SongSection[];
  character: CharacterKind;
  accent: 'pink' | 'coral' | 'lime';
}

export interface RenderState {
  mode: AppMode;
  gameId: GameId;
  beat: number;
  targets: readonly TargetState[];
  cueBeats: readonly number[];
  sectionLabel: string;
  lastJudge?: Judge;
  lastJudgeAgeMs: number;
  combo: number;
  hitPulse: number;
  missPulse: number;
  musicPulse: number;
}
