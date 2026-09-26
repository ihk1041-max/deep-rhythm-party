import { AudioEngine } from './audio.js';
import { getSectionLabel } from './games.js';
import type {
  Difficulty,
  GameDefinition,
  GameResult,
  Judge,
  JudgeCounts,
  RenderState,
  TargetState
} from './types.js';

const WINDOWS: Record<Difficulty, readonly [number, number, number]> = {
  easy: [72, 132, 195],
  normal: [48, 92, 145],
  hard: [32, 68, 108]
};

const POINTS: Record<Judge, number> = {
  PERFECT: 100,
  GREAT: 82,
  GOOD: 52,
  MISS: 0
};

export interface RhythmGameOptions {
  audio: AudioEngine;
  definition: GameDefinition;
  difficulty: Difficulty;
  audioOffsetMs: number;
  onHud: (combo: number, progress: number, sectionLabel: string) => void;
  onJudge: (judge: Judge, deltaMs?: number) => void;
  onFinish: (result: GameResult) => void;
  practice?: boolean;
}

export class RhythmGame {
  private readonly audio: AudioEngine;
  private readonly definition: GameDefinition;
  private readonly difficulty: Difficulty;
  private readonly audioOffsetMs: number;
  private readonly onHud: RhythmGameOptions['onHud'];
  private readonly onJudge: RhythmGameOptions['onJudge'];
  private readonly onFinish: RhythmGameOptions['onFinish'];
  private readonly targets: TargetState[];
  private readonly secondsPerBeat: number;
  private readonly practice: boolean;
  private readonly cueBeats: readonly number[];
  private readonly endBeat: number;

  private startTime = 0;
  private playing = false;
  private finished = false;
  private combo = 0;
  private maxCombo = 0;
  private lastJudge: Judge | undefined;
  private lastJudgeAt = 0;
  private hitPulseStartedAt = -Infinity;
  private missPulseStartedAt = -Infinity;

  constructor(options: RhythmGameOptions) {
    this.audio = options.audio;
    this.definition = options.definition;
    this.difficulty = options.difficulty;
    this.audioOffsetMs = options.audioOffsetMs;
    this.onHud = options.onHud;
    this.onJudge = options.onJudge;
    this.onFinish = options.onFinish;
    this.practice = options.practice ?? false;
    const beats = this.practice ? this.definition.practiceTargets : this.definition.targets;
    this.cueBeats = this.practice ? this.definition.practiceCueBeats : this.definition.cueBeats;
    this.targets = beats.map((beat) => ({ beat }));
    this.endBeat = this.practice ? Math.max(...beats, 12) + 3 : this.definition.endBeat;
    this.secondsPerBeat = 60 / this.definition.bpm;
  }

  start(): void {
    this.audio.stopAll();
    this.startTime = this.audio.now() + 0.65;
    this.playing = true;
    this.finished = false;

    for (let beat = 0; beat < 4; beat += 1) {
      this.audio.scheduleCount(this.beatToTime(beat), beat === 3);
    }

    this.audio.scheduleSong(
      this.definition.id,
      this.startTime,
      this.definition.bpm,
      this.endBeat
    );

    this.cueBeats.forEach((beat, index) => {
      this.audio.scheduleCue(this.definition.id, this.beatToTime(beat), index);
    });

    if (this.practice) {
      this.audio.scheduleVoice('go', this.beatToTime(4), 0.58);
    } else {
      for (const cue of this.definition.voiceCues) {
        this.audio.scheduleVoice(cue.sample, this.beatToTime(cue.beat), cue.gain ?? 0.68);
      }
    }
  }

  stop(): void {
    this.playing = false;
    this.audio.stopAll();
  }

  update(): void {
    if (!this.playing || this.finished) return;

    const correctedNow = this.audio.now() - this.audioOffsetMs / 1000;
    const maxWindowMs = WINDOWS[this.difficulty][2];

    for (const target of this.targets) {
      if (target.judge) continue;
      const deltaMs = (correctedNow - this.beatToTime(target.beat)) * 1000;
      if (deltaMs > maxWindowMs) {
        this.applyJudge(target, 'MISS', deltaMs, false);
      }
    }

    const beat = this.getBeat();
    const progress = Math.min(1, Math.max(0, beat / this.endBeat));
    this.onHud(this.combo, progress, getSectionLabel(this.definition, beat));

    const judgedCount = this.targets.filter((target) => target.judge).length;
    if (judgedCount === this.targets.length && beat >= this.endBeat - 0.15) {
      this.finish();
    }
  }

  tap(): void {
    if (!this.playing || this.finished) return;

    const correctedTap = this.audio.now() - this.audioOffsetMs / 1000;
    const maxWindowMs = WINDOWS[this.difficulty][2];

    let best: TargetState | undefined;
    let bestDelta = Number.POSITIVE_INFINITY;

    for (const target of this.targets) {
      if (target.judge) continue;
      const deltaMs = (correctedTap - this.beatToTime(target.beat)) * 1000;
      if (Math.abs(deltaMs) < Math.abs(bestDelta)) {
        best = target;
        bestDelta = deltaMs;
      }
    }

    if (!best || Math.abs(bestDelta) > maxWindowMs) return;

    const [perfectMs, greatMs] = WINDOWS[this.difficulty];
    const abs = Math.abs(bestDelta);
    const judge: Judge = abs <= perfectMs ? 'PERFECT' : abs <= greatMs ? 'GREAT' : 'GOOD';
    this.applyJudge(best, judge, bestDelta, true);
  }

  getRenderState(mode: RenderState['mode']): RenderState {
    const now = this.playing ? this.audio.now() : 0;
    const ageMs = this.lastJudgeAt > 0 ? Math.max(0, (now - this.lastJudgeAt) * 1000) : Number.POSITIVE_INFINITY;
    const hitAge = now - this.hitPulseStartedAt;
    const missAge = now - this.missPulseStartedAt;
    const hitPulse = hitAge >= 0 && hitAge < 0.34 ? 1 - hitAge / 0.34 : 0;
    const missPulse = missAge >= 0 && missAge < 0.38 ? 1 - missAge / 0.38 : 0;
    const beat = this.getBeat();
    const halfBeatPhase = Math.abs(beat * 2 - Math.round(beat * 2));
    const musicPulse = Math.max(0, 1 - halfBeatPhase / 0.32);

    return {
      mode,
      gameId: this.definition.id,
      beat,
      targets: this.targets,
      cueBeats: this.cueBeats,
      sectionLabel: getSectionLabel(this.definition, beat),
      ...(this.lastJudge ? { lastJudge: this.lastJudge } : {}),
      lastJudgeAgeMs: ageMs,
      combo: this.combo,
      hitPulse,
      missPulse,
      musicPulse,
      practice: this.practice
    };
  }

  getBeat(): number {
    if (!this.playing) return 0;
    return (this.audio.now() - this.startTime) / this.secondsPerBeat;
  }

  private applyJudge(target: TargetState, judge: Judge, deltaMs: number, fromTap: boolean): void {
    target.judge = judge;
    target.deltaMs = Math.round(deltaMs);
    this.lastJudge = judge;
    this.lastJudgeAt = this.audio.now();

    if (judge === 'MISS') {
      this.combo = 0;
      this.missPulseStartedAt = this.audio.now();
    } else {
      this.combo += 1;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      if (fromTap) this.hitPulseStartedAt = this.audio.now();
    }

    this.audio.playHit(judge, this.definition.id, target.beat);
    this.onJudge(judge, Math.round(deltaMs));
  }

  private finish(): void {
    if (this.finished) return;
    this.finished = true;
    this.playing = false;

    const counts: JudgeCounts = { PERFECT: 0, GREAT: 0, GOOD: 0, MISS: 0 };
    let total = 0;
    let offsetTotal = 0;
    let offsetCount = 0;
    for (const target of this.targets) {
      const judge = target.judge ?? 'MISS';
      counts[judge] += 1;
      total += POINTS[judge];
      if (target.deltaMs !== undefined && judge !== 'MISS') {
        offsetTotal += Math.abs(target.deltaMs);
        offsetCount += 1;
      }
    }

    const score = Math.round(total / this.targets.length);
    const stars: 0 | 1 | 2 | 3 = score >= 90 ? 3 : score >= 68 ? 2 : score >= 48 ? 1 : 0;
    const averageAbsOffsetMs = offsetCount > 0 ? Math.round(offsetTotal / offsetCount) : 0;
    this.onFinish({
      gameId: this.definition.id,
      score,
      maxCombo: this.maxCombo,
      counts,
      stars,
      averageAbsOffsetMs
    });
  }

  private beatToTime(beat: number): number {
    return this.startTime + beat * this.secondsPerBeat;
  }
}
