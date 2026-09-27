export type Difficulty = 'easy' | 'normal' | 'hard';
export type Judge = 'PERFECT' | 'GREAT' | 'GOOD' | 'MISS';

export type GameId =
  | 'bread-factory'
  | 'space-delivery'
  | 'frog-radio'
  | 'nap-alarm'
  | 'remix-1'
  | 'penguin-waiter'
  | 'robot-maintenance'
  | 'moon-volley'
  | 'chorus-trio'
  | 'remix-2'
  | 'mole-mail'
  | 'dance-coach'
  | 'press-conference'
  | 'ninja-camera'
  | 'remix-3';

export type AppMode = 'title' | 'select' | 'game' | 'result' | 'settings';
export type InputAction = 'press' | 'release' | 'left' | 'right';
export type InputMode = 'tap' | 'hold' | 'split' | 'mixed';

export type SceneKind =
  | 'bakery'
  | 'space'
  | 'frog'
  | 'bedroom'
  | 'penguin'
  | 'robot'
  | 'moon'
  | 'chorus'
  | 'mole'
  | 'dance'
  | 'conference'
  | 'ninja';

export type MusicStyle =
  | 'bakery'
  | 'space'
  | 'frog'
  | 'dream'
  | 'penguin'
  | 'robot'
  | 'moon'
  | 'chorus'
  | 'mole'
  | 'dance'
  | 'conference'
  | 'ninja'
  | 'remix-a'
  | 'remix-b'
  | 'remix-c';

export type CueKind =
  | 'count'
  | 'ready'
  | 'ding'
  | 'charge'
  | 'frog-call'
  | 'alarm'
  | 'decoy-phone'
  | 'decoy-bird'
  | 'dish-left'
  | 'dish-right'
  | 'bolt-short'
  | 'bolt-long'
  | 'serve'
  | 'lob'
  | 'sing-short'
  | 'sing-long'
  | 'knock'
  | 'dance-left'
  | 'dance-right'
  | 'question-one'
  | 'question-two'
  | 'question-three'
  | 'question-hold'
  | 'camera-ready'
  | 'camera-decoy'
  | 'switch';

export type VoiceSample = 'hey' | 'go' | 'yeah';

export interface GameSettings {
  difficulty: Difficulty;
  audioOffsetMs: number;
  musicVolume: number;
  sfxVolume: number;
  haptics: boolean;
  autoPractice: boolean;
  showPracticeHints: boolean;
  externalMusic: boolean;
  freeSelect: boolean;
  showHud: boolean;
  showLiveJudgement: boolean;
}

export interface GameRecord {
  highScore: number;
  bestCombo: number;
  bestStars: 0 | 1 | 2 | 3;
  plays: number;
}

export interface SaveData {
  version: 9;
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
  strayMisses: number;
  lateInputs: number;
  earlyInputs: number;
}

export interface InputTargetDefinition {
  beat: number;
  action: InputAction;
  label?: string;
  group?: string;
}

export interface TargetState extends InputTargetDefinition {
  judge?: Judge;
  deltaMs?: number;
}

export interface CueEvent {
  beat: number;
  kind: CueKind;
  label?: string;
  durationBeats?: number;
  lane?: 'left' | 'right';
  pitch?: number;
}

export interface SceneSection {
  startBeat: number;
  label: string;
  scene?: SceneKind;
}

export interface VoiceCue {
  beat: number;
  sample: VoiceSample;
  gain?: number;
}

export interface ExternalMusic {
  file: string;
  bpm: number;
  offsetSec?: number;
  gain?: number;
}

export interface GameDefinition {
  id: GameId;
  stage: number;
  world: 1 | 2 | 3;
  isRemix: boolean;
  title: string;
  shortDescription: string;
  instruction: string;
  controlHint: string;
  bpm: number;
  endBeat: number;
  inputMode: InputMode;
  scene: SceneKind;
  musicStyle: MusicStyle;
  externalMusic?: ExternalMusic;
  targets: readonly InputTargetDefinition[];
  cues: readonly CueEvent[];
  sections: readonly SceneSection[];
  voiceCues: readonly VoiceCue[];
  practiceTargets: readonly InputTargetDefinition[];
  practiceCues: readonly CueEvent[];
  practiceEndBeat: number;
  penalizeStray: boolean;
  accent: string;
  icon: string;
}

export interface RecentCueState extends CueEvent {
  ageBeats: number;
}

export interface RenderState {
  mode: AppMode;
  gameId: GameId;
  scene: SceneKind;
  beat: number;
  targets: readonly TargetState[];
  cues: readonly CueEvent[];
  recentCue?: RecentCueState;
  sectionLabel: string;
  lastJudge?: Judge;
  lastJudgeAgeMs: number;
  combo: number;
  hitPulse: number;
  missPulse: number;
  musicPulse: number;
  practice: boolean;
  held: boolean;
  lastAction?: InputAction;
  lastActionAgeMs: number;
  strayMisses: number;
  missCount: number;
  sectionAgeBeats: number;
  endBeat: number;
  showLiveJudgement: boolean;
}
