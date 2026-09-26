import { AudioEngine } from './audio.js';
import type { Difficulty, GameResult, Judge, JudgeCounts, RenderState, TargetState } from './types.js';

const BPM = 120;
const SECONDS_PER_BEAT = 60 / BPM;
const TARGET_BEATS = [4, 6, 8, 10, 12, 14, 16, 18] as const;
const END_BEAT = 20;

const WINDOWS: Record<Difficulty, readonly [number, number, number]> = {
  easy: [70, 130, 190],
  normal: [45, 90, 140],
  hard: [30, 65, 105]
};

const POINTS: Record<Judge, number> = {
  PERFECT: 100,
  GREAT: 80,
  GOOD: 50,
  MISS: 0
};

export interface RhythmGameOptions {
  audio: AudioEngine;
  difficulty: Difficulty;
  audioOffsetMs: number;
  onHud: (combo: number, progress: number) => void;
  onJudge: (judge: Judge, deltaMs?: number) => void;
  onFinish: (result: GameResult) => void;
}

export class RhythmGame {
  private readonly audio: AudioEngine;
  private readonly difficulty: Difficulty;
  private readonly audioOffsetMs: number;
  private readonly onHud: RhythmGameOptions['onHud'];
  private readonly onJudge: RhythmGameOptions['onJudge'];
  private readonly onFinish: RhythmGameOptions['onFinish'];
  private readonly targets: TargetState[] = TARGET_BEATS.map((beat) => ({ beat }));

  private startTime = 0;
  private playing = false;
  private finished = false;
  private combo = 0;
  private maxCombo = 0;
  private lastJudge: Judge | undefined;
  private lastJudgeAt = 0;
  private hitPulseStartedAt = -Infinity;

  constructor(options: RhythmGameOptions) {
    this.audio = options.audio;
    this.difficulty = options.difficulty;
    this.audioOffsetMs = options.audioOffsetMs;
    this.onHud = options.onHud;
    this.onJudge = options.onJudge;
    this.onFinish = options.onFinish;
  }

  start(): void {
    this.audio.stopAll();
    this.startTime = this.audio.now() + 0.55;
    this.playing = true;
    this.finished = false;

    for (let beat = 0; beat <= END_BEAT; beat += 1) {
      const time = this.beatToTime(beat);
      if (beat < 4) {
        this.audio.scheduleCount(time, beat === 3);
      } else {
        const accent = TARGET_BEATS.includes(beat as (typeof TARGET_BEATS)[number]);
        this.audio.scheduleBeat(time, accent);
      }
    }
  }

  stop(): void {
    this.playing = false;
    this.audio.stopAll();
  }

  update(): void {
    if (!this.playing || this.finished) return;

    const now = this.audio.now();
    const correctedNow = now - this.audioOffsetMs / 1000;
    const maxWindowMs = WINDOWS[this.difficulty][2];

    for (const target of this.targets) {
      if (target.judge) continue;
      const deltaMs = (correctedNow - this.beatToTime(target.beat)) * 1000;
      if (deltaMs > maxWindowMs) {
        this.applyJudge(target, 'MISS', deltaMs, false);
      }
    }

    const judgedCount = this.targets.filter((target) => target.judge).length;
    this.onHud(this.combo, judgedCount / this.targets.length);

    if (judgedCount === this.targets.length && this.getBeat() > END_BEAT - 0.25) {
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
      const abs = Math.abs(deltaMs);
      if (abs < Math.abs(bestDelta)) {
        best = target;
        bestDelta = deltaMs;
      }
    }

    if (!best || Math.abs(bestDelta) > maxWindowMs) {
      return;
    }

    const [perfectMs, greatMs] = WINDOWS[this.difficulty];
    const abs = Math.abs(bestDelta);
    const judge: Judge = abs <= perfectMs ? 'PERFECT' : abs <= greatMs ? 'GREAT' : 'GOOD';
    this.applyJudge(best, judge, bestDelta, true);
  }

  getRenderState(mode: RenderState['mode']): RenderState {
    const now = this.playing ? this.audio.now() : 0;
    const ageMs = this.lastJudgeAt > 0 ? Math.max(0, (now - this.lastJudgeAt) * 1000) : Number.POSITIVE_INFINITY;
    const pulseAge = now - this.hitPulseStartedAt;
    const hitPulse = pulseAge >= 0 && pulseAge < 0.28 ? 1 - pulseAge / 0.28 : 0;

    return {
      mode,
      beat: this.getBeat(),
      targets: this.targets,
      ...(this.lastJudge ? { lastJudge: this.lastJudge } : {}),
      lastJudgeAgeMs: ageMs,
      combo: this.combo,
      hitPulse
    };
  }

  getBeat(): number {
    if (!this.playing) return 0;
    return (this.audio.now() - this.startTime) / SECONDS_PER_BEAT;
  }

  private applyJudge(target: TargetState, judge: Judge, deltaMs: number, fromTap: boolean): void {
    target.judge = judge;
    target.deltaMs = Math.round(deltaMs);
    this.lastJudge = judge;
    this.lastJudgeAt = this.audio.now();

    if (judge === 'MISS') {
      this.combo = 0;
    } else {
      this.combo += 1;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      if (fromTap) this.hitPulseStartedAt = this.audio.now();
    }

    this.audio.playHit(judge);
    this.onJudge(judge, Math.round(deltaMs));
  }

  private finish(): void {
    if (this.finished) return;
    this.finished = true;
    this.playing = false;

    const counts: JudgeCounts = { PERFECT: 0, GREAT: 0, GOOD: 0, MISS: 0 };
    let total = 0;
    for (const target of this.targets) {
      const judge = target.judge ?? 'MISS';
      counts[judge] += 1;
      total += POINTS[judge];
    }

    const score = Math.round(total / this.targets.length);
    const stars: 1 | 2 | 3 = score >= 90 ? 3 : score >= 65 ? 2 : 1;
    this.onFinish({ score, maxCombo: this.maxCombo, counts, stars });
  }

  private beatToTime(beat: number): number {
    return this.startTime + beat * SECONDS_PER_BEAT;
  }
}
