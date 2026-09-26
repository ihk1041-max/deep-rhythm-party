const WINDOWS = {
    easy: [70, 130, 190],
    normal: [45, 90, 140],
    hard: [30, 65, 105]
};
const POINTS = {
    PERFECT: 100,
    GREAT: 80,
    GOOD: 50,
    MISS: 0
};
export class RhythmGame {
    audio;
    definition;
    difficulty;
    audioOffsetMs;
    onHud;
    onJudge;
    onFinish;
    targets;
    secondsPerBeat;
    startTime = 0;
    playing = false;
    finished = false;
    combo = 0;
    maxCombo = 0;
    lastJudge;
    lastJudgeAt = 0;
    hitPulseStartedAt = -Infinity;
    missPulseStartedAt = -Infinity;
    constructor(options) {
        this.audio = options.audio;
        this.definition = options.definition;
        this.difficulty = options.difficulty;
        this.audioOffsetMs = options.audioOffsetMs;
        this.onHud = options.onHud;
        this.onJudge = options.onJudge;
        this.onFinish = options.onFinish;
        this.targets = this.definition.targets.map((beat) => ({ beat }));
        this.secondsPerBeat = 60 / this.definition.bpm;
    }
    start() {
        this.audio.stopAll();
        this.startTime = this.audio.now() + 0.55;
        this.playing = true;
        this.finished = false;
        for (let beat = 0; beat <= this.definition.endBeat; beat += 1) {
            const time = this.beatToTime(beat);
            if (beat < 4) {
                this.audio.scheduleCount(time, beat === 3);
                continue;
            }
            const kind = this.definition.cueBeats.includes(beat)
                ? 'cue'
                : this.definition.targets.includes(beat)
                    ? 'target'
                    : 'beat';
            this.audio.scheduleGameBeat(this.definition.id, time, kind);
        }
    }
    stop() {
        this.playing = false;
        this.audio.stopAll();
    }
    update() {
        if (!this.playing || this.finished)
            return;
        const correctedNow = this.audio.now() - this.audioOffsetMs / 1000;
        const maxWindowMs = WINDOWS[this.difficulty][2];
        for (const target of this.targets) {
            if (target.judge)
                continue;
            const deltaMs = (correctedNow - this.beatToTime(target.beat)) * 1000;
            if (deltaMs > maxWindowMs) {
                this.applyJudge(target, 'MISS', deltaMs, false);
            }
        }
        const judgedCount = this.targets.filter((target) => target.judge).length;
        this.onHud(this.combo, judgedCount / this.targets.length);
        if (judgedCount === this.targets.length && this.getBeat() >= this.definition.endBeat - 0.25) {
            this.finish();
        }
    }
    tap() {
        if (!this.playing || this.finished)
            return;
        const correctedTap = this.audio.now() - this.audioOffsetMs / 1000;
        const maxWindowMs = WINDOWS[this.difficulty][2];
        let best;
        let bestDelta = Number.POSITIVE_INFINITY;
        for (const target of this.targets) {
            if (target.judge)
                continue;
            const deltaMs = (correctedTap - this.beatToTime(target.beat)) * 1000;
            if (Math.abs(deltaMs) < Math.abs(bestDelta)) {
                best = target;
                bestDelta = deltaMs;
            }
        }
        if (!best || Math.abs(bestDelta) > maxWindowMs)
            return;
        const [perfectMs, greatMs] = WINDOWS[this.difficulty];
        const abs = Math.abs(bestDelta);
        const judge = abs <= perfectMs ? 'PERFECT' : abs <= greatMs ? 'GREAT' : 'GOOD';
        this.applyJudge(best, judge, bestDelta, true);
    }
    getRenderState(mode) {
        const now = this.playing ? this.audio.now() : 0;
        const ageMs = this.lastJudgeAt > 0 ? Math.max(0, (now - this.lastJudgeAt) * 1000) : Number.POSITIVE_INFINITY;
        const hitAge = now - this.hitPulseStartedAt;
        const missAge = now - this.missPulseStartedAt;
        const hitPulse = hitAge >= 0 && hitAge < 0.32 ? 1 - hitAge / 0.32 : 0;
        const missPulse = missAge >= 0 && missAge < 0.36 ? 1 - missAge / 0.36 : 0;
        return {
            mode,
            gameId: this.definition.id,
            beat: this.getBeat(),
            targets: this.targets,
            cueBeats: this.definition.cueBeats,
            ...(this.lastJudge ? { lastJudge: this.lastJudge } : {}),
            lastJudgeAgeMs: ageMs,
            combo: this.combo,
            hitPulse,
            missPulse
        };
    }
    getBeat() {
        if (!this.playing)
            return 0;
        return (this.audio.now() - this.startTime) / this.secondsPerBeat;
    }
    applyJudge(target, judge, deltaMs, fromTap) {
        target.judge = judge;
        target.deltaMs = Math.round(deltaMs);
        this.lastJudge = judge;
        this.lastJudgeAt = this.audio.now();
        if (judge === 'MISS') {
            this.combo = 0;
            this.missPulseStartedAt = this.audio.now();
        }
        else {
            this.combo += 1;
            this.maxCombo = Math.max(this.maxCombo, this.combo);
            if (fromTap)
                this.hitPulseStartedAt = this.audio.now();
        }
        this.audio.playHit(judge, this.definition.id);
        this.onJudge(judge, Math.round(deltaMs));
    }
    finish() {
        if (this.finished)
            return;
        this.finished = true;
        this.playing = false;
        const counts = { PERFECT: 0, GREAT: 0, GOOD: 0, MISS: 0 };
        let total = 0;
        for (const target of this.targets) {
            const judge = target.judge ?? 'MISS';
            counts[judge] += 1;
            total += POINTS[judge];
        }
        const score = Math.round(total / this.targets.length);
        const stars = score >= 90 ? 3 : score >= 65 ? 2 : score >= 45 ? 1 : 0;
        this.onFinish({ gameId: this.definition.id, score, maxCombo: this.maxCombo, counts, stars });
    }
    beatToTime(beat) {
        return this.startTime + beat * this.secondsPerBeat;
    }
}
//# sourceMappingURL=rhythm.js.map