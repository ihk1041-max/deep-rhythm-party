import { getSceneForBeat, getSectionLabel } from './games.js';
const WINDOWS = {
    easy: [76, 138, 205],
    normal: [50, 96, 150],
    hard: [34, 70, 112]
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
    externalMusic;
    onHud;
    onJudge;
    onFinish;
    targets;
    secondsPerBeat;
    practice;
    cues;
    endBeat;
    showLiveJudgement;
    startTime = 0;
    playing = false;
    finished = false;
    combo = 0;
    maxCombo = 0;
    lastJudge;
    lastJudgeAt = 0;
    lastAction;
    lastActionAt = 0;
    hitPulseStartedAt = -Infinity;
    missPulseStartedAt = -Infinity;
    strayMisses = 0;
    held = false;
    activeGroups = new Set();
    constructor(options) {
        this.audio = options.audio;
        this.definition = options.definition;
        this.difficulty = options.difficulty;
        this.audioOffsetMs = options.audioOffsetMs;
        this.externalMusic = options.externalMusic;
        this.onHud = options.onHud;
        this.onJudge = options.onJudge;
        this.onFinish = options.onFinish;
        this.practice = options.practice ?? false;
        this.showLiveJudgement = options.showLiveJudgement ?? false;
        const sourceTargets = this.practice ? this.definition.practiceTargets : this.definition.targets;
        this.cues = this.practice ? this.definition.practiceCues : this.definition.cues;
        this.targets = sourceTargets.map((target) => ({ ...target }));
        this.endBeat = this.practice ? this.definition.practiceEndBeat : this.definition.endBeat;
        this.secondsPerBeat = 60 / this.definition.bpm;
    }
    start() {
        this.audio.stopAll();
        this.startTime = this.audio.now() + 0.7;
        this.playing = true;
        this.finished = false;
        for (let beat = 0; beat < 4; beat += 1) {
            this.audio.scheduleCount(this.beatToTime(beat), beat === 3);
        }
        this.audio.scheduleSong(this.definition, this.startTime, this.endBeat, this.externalMusic && !this.practice);
        this.cues.forEach((cue, index) => {
            this.audio.scheduleCue(cue, this.beatToTime(cue.beat), index, this.definition.scene);
        });
        if (this.practice) {
            this.audio.scheduleVoice('go', this.beatToTime(4), 0.56);
        }
        else {
            for (const cue of this.definition.voiceCues) {
                this.audio.scheduleVoice(cue.sample, this.beatToTime(cue.beat), cue.gain ?? 0.66);
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
        if (judgedCount === this.targets.length && beat >= this.endBeat - 0.12) {
            this.finish();
        }
    }
    input(action) {
        if (!this.playing || this.finished)
            return;
        this.lastAction = action;
        this.lastActionAt = this.audio.now();
        if (action === 'press')
            this.held = true;
        if (action === 'release')
            this.held = false;
        const correctedInput = this.audio.now() - this.audioOffsetMs / 1000;
        const maxWindowMs = WINDOWS[this.difficulty][2];
        let best;
        let bestDelta = Number.POSITIVE_INFINITY;
        for (const target of this.targets) {
            if (target.judge || target.action !== action)
                continue;
            if (action === 'release' && target.group && !this.activeGroups.has(target.group))
                continue;
            const deltaMs = (correctedInput - this.beatToTime(target.beat)) * 1000;
            if (Math.abs(deltaMs) < Math.abs(bestDelta)) {
                best = target;
                bestDelta = deltaMs;
            }
        }
        if (!best || Math.abs(bestDelta) > maxWindowMs) {
            if (this.definition.penalizeStray && this.getBeat() >= 4)
                this.applyStrayMiss(action);
            return;
        }
        const [perfectMs, greatMs] = WINDOWS[this.difficulty];
        const abs = Math.abs(bestDelta);
        const judge = abs <= perfectMs ? 'PERFECT' : abs <= greatMs ? 'GREAT' : 'GOOD';
        this.applyJudge(best, judge, bestDelta, true);
    }
    getExpectedAction() {
        if (!this.playing || this.finished)
            return undefined;
        const beat = this.getBeat();
        let best;
        let bestDistance = Number.POSITIVE_INFINITY;
        for (const target of this.targets) {
            if (target.judge)
                continue;
            const distance = target.beat - beat;
            if (distance < -0.45)
                continue;
            if (distance < bestDistance) {
                best = target;
                bestDistance = distance;
            }
        }
        return best?.action;
    }
    getRenderState(mode) {
        const now = this.playing ? this.audio.now() : 0;
        const ageMs = this.lastJudgeAt > 0 ? Math.max(0, (now - this.lastJudgeAt) * 1000) : Number.POSITIVE_INFINITY;
        const actionAgeMs = this.lastActionAt > 0 ? Math.max(0, (now - this.lastActionAt) * 1000) : Number.POSITIVE_INFINITY;
        const hitAge = now - this.hitPulseStartedAt;
        const missAge = now - this.missPulseStartedAt;
        const hitPulse = hitAge >= 0 && hitAge < 0.34 ? 1 - hitAge / 0.34 : 0;
        const missPulse = missAge >= 0 && missAge < 0.4 ? 1 - missAge / 0.4 : 0;
        const beat = this.getBeat();
        const halfBeatPhase = Math.abs(beat * 2 - Math.round(beat * 2));
        const musicPulse = Math.max(0, 1 - halfBeatPhase / 0.32);
        const recentCue = this.getRecentCue(beat);
        const section = this.definition.sections.reduce((active, candidate) => beat >= candidate.startBeat ? candidate : active, this.definition.sections[0] ?? { startBeat: 0, label: '' });
        const state = {
            mode,
            gameId: this.definition.id,
            scene: getSceneForBeat(this.definition, beat),
            beat,
            targets: this.targets,
            cues: this.cues,
            sectionLabel: getSectionLabel(this.definition, beat),
            lastJudgeAgeMs: ageMs,
            combo: this.combo,
            hitPulse,
            missPulse,
            musicPulse,
            practice: this.practice,
            held: this.held,
            lastActionAgeMs: actionAgeMs,
            strayMisses: this.strayMisses,
            missCount: this.strayMisses + this.targets.filter((target) => target.judge === 'MISS').length,
            sectionAgeBeats: Math.max(0, beat - section.startBeat),
            endBeat: this.endBeat,
            showLiveJudgement: this.showLiveJudgement,
            ...(recentCue ? { recentCue } : {}),
            ...(this.lastJudge ? { lastJudge: this.lastJudge } : {}),
            ...(this.lastAction ? { lastAction: this.lastAction } : {})
        };
        return state;
    }
    getBeat() {
        if (!this.playing)
            return 0;
        return (this.audio.now() - this.startTime) / this.secondsPerBeat;
    }
    getRecentCue(beat) {
        let best;
        for (const cue of this.cues) {
            const age = beat - cue.beat;
            if (age < -0.2 || age > Math.max(1.4, cue.durationBeats ?? 0.8))
                continue;
            if (!best || Math.abs(age) < Math.abs(best.ageBeats))
                best = { ...cue, ageBeats: age };
        }
        return best;
    }
    applyJudge(target, judge, deltaMs, fromInput) {
        target.judge = judge;
        target.deltaMs = Math.round(deltaMs);
        this.lastJudge = judge;
        this.lastJudgeAt = this.audio.now();
        if (judge === 'MISS') {
            this.combo = 0;
            this.missPulseStartedAt = this.audio.now();
            if (target.group)
                this.activeGroups.delete(target.group);
        }
        else {
            this.combo += 1;
            this.maxCombo = Math.max(this.maxCombo, this.combo);
            if (target.action === 'press' && target.group)
                this.activeGroups.add(target.group);
            if (target.action === 'release' && target.group)
                this.activeGroups.delete(target.group);
            if (fromInput)
                this.hitPulseStartedAt = this.audio.now();
        }
        this.audio.playInput(judge, target.action, getSceneForBeat(this.definition, target.beat), target.beat);
        this.onJudge(judge, Math.round(deltaMs), false);
    }
    applyStrayMiss(action) {
        const now = this.audio.now();
        if (now - this.lastJudgeAt < 0.09 && this.lastJudge === 'MISS')
            return;
        this.strayMisses += 1;
        this.combo = 0;
        this.lastJudge = 'MISS';
        this.lastJudgeAt = now;
        this.missPulseStartedAt = now;
        this.audio.playInput('MISS', action, getSceneForBeat(this.definition, this.getBeat()), this.getBeat());
        this.onJudge('MISS', undefined, true);
    }
    finish() {
        if (this.finished)
            return;
        this.finished = true;
        this.playing = false;
        const counts = { PERFECT: 0, GREAT: 0, GOOD: 0, MISS: this.strayMisses };
        let total = 0;
        let offsetTotal = 0;
        let offsetCount = 0;
        let earlyInputs = 0;
        let lateInputs = 0;
        for (const target of this.targets) {
            const judge = target.judge ?? 'MISS';
            counts[judge] += 1;
            total += POINTS[judge];
            if (target.deltaMs !== undefined && judge !== 'MISS') {
                offsetTotal += Math.abs(target.deltaMs);
                offsetCount += 1;
                if (target.deltaMs < -12)
                    earlyInputs += 1;
                if (target.deltaMs > 12)
                    lateInputs += 1;
            }
        }
        const rawScore = this.targets.length > 0 ? total / this.targets.length : 0;
        const strayPenalty = Math.min(28, this.strayMisses * 4);
        const score = Math.max(0, Math.round(rawScore - strayPenalty));
        const stars = score >= 90 ? 3 : score >= 68 ? 2 : score >= 48 ? 1 : 0;
        const averageAbsOffsetMs = offsetCount > 0 ? Math.round(offsetTotal / offsetCount) : 0;
        this.onFinish({
            gameId: this.definition.id,
            score,
            maxCombo: this.maxCombo,
            counts,
            stars,
            averageAbsOffsetMs,
            strayMisses: this.strayMisses,
            earlyInputs,
            lateInputs
        });
    }
    beatToTime(beat) {
        return this.startTime + beat * this.secondsPerBeat;
    }
}
//# sourceMappingURL=rhythm.js.map