import { getSectionLabel } from './games.js';
const WINDOWS = {
    easy: [72, 132, 195],
    normal: [48, 92, 145],
    hard: [32, 68, 108]
};
const POINTS = {
    PERFECT: 100,
    GREAT: 82,
    GOOD: 52,
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
    practice;
    cueBeats;
    endBeat;
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
        this.practice = options.practice ?? false;
        const beats = this.practice ? this.definition.practiceTargets : this.definition.targets;
        this.cueBeats = this.practice ? this.definition.practiceCueBeats : this.definition.cueBeats;
        this.targets = beats.map((beat) => ({ beat }));
        this.endBeat = this.practice ? Math.max(...beats, 12) + 3 : this.definition.endBeat;
        this.secondsPerBeat = 60 / this.definition.bpm;
    }
    start() {
        this.audio.stopAll();
        this.startTime = this.audio.now() + 0.65;
        this.playing = true;
        this.finished = false;
        for (let beat = 0; beat < 4; beat += 1) {
            this.audio.scheduleCount(this.beatToTime(beat), beat === 3);
        }
        this.audio.scheduleSong(this.definition.id, this.startTime, this.definition.bpm, this.endBeat);
        this.cueBeats.forEach((beat, index) => {
            this.audio.scheduleCue(this.definition.id, this.beatToTime(beat), index);
        });
        if (this.practice) {
            this.audio.scheduleVoice('go', this.beatToTime(4), 0.58);
        }
        else {
            for (const cue of this.definition.voiceCues) {
                this.audio.scheduleVoice(cue.sample, this.beatToTime(cue.beat), cue.gain ?? 0.68);
            }
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
        const beat = this.getBeat();
        const progress = Math.min(1, Math.max(0, beat / this.endBeat));
        this.onHud(this.combo, progress, getSectionLabel(this.definition, beat));
        const judgedCount = this.targets.filter((target) => target.judge).length;
        if (judgedCount === this.targets.length && beat >= this.endBeat - 0.15) {
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
        this.audio.playHit(judge, this.definition.id, target.beat);
        this.onJudge(judge, Math.round(deltaMs));
    }
    finish() {
        if (this.finished)
            return;
        this.finished = true;
        this.playing = false;
        const counts = { PERFECT: 0, GREAT: 0, GOOD: 0, MISS: 0 };
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
        const stars = score >= 90 ? 3 : score >= 68 ? 2 : score >= 48 ? 1 : 0;
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
    beatToTime(beat) {
        return this.startTime + beat * this.secondsPerBeat;
    }
}
//# sourceMappingURL=rhythm.js.map