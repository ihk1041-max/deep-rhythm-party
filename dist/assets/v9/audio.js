const midiToHz = (midi) => 440 * 2 ** ((midi - 69) / 12);
const STYLES = {
    bakery: { roots: [48, 53, 55, 50], chord: 'major', melody: [72, 76, 79, 81, 79, 76, 74, 77], melodyOffsets: [0, .75, 1.5, 2.5, 3.25], bassOffsets: [0, 2], wave: 'triangle', kick: .9, snare: .55, hat: .36, pad: .032, melodyGain: .034 },
    space: { roots: [41, 46, 43, 48], chord: 'minor', melody: [72, 75, 79, 82, 79, 77, 75, 70], melodyOffsets: [.5, 1.5, 2.75, 3.5], bassOffsets: [0, 1.5, 3], wave: 'sine', kick: .72, snare: .42, hat: .25, pad: .044, melodyGain: .03 },
    frog: { roots: [43, 47, 50, 45], chord: 'major', melody: [67, 69, 72, 74, 72, 76, 74, 69], melodyOffsets: [0, .5, 1.5, 2, 3], bassOffsets: [0, 2.5], wave: 'square', kick: .78, snare: .6, hat: .42, pad: .024, melodyGain: .025, swing: .06 },
    dream: { roots: [48, 45, 53, 50], chord: 'major', melody: [72, 74, 76, 79, 76, 74, 71, 72], melodyOffsets: [0, 1.5, 3], bassOffsets: [0, 2], wave: 'sine', kick: .44, snare: .25, hat: .15, pad: .05, melodyGain: .02 },
    penguin: { roots: [50, 55, 52, 57], chord: 'major', melody: [74, 78, 81, 83, 81, 78, 76, 79], melodyOffsets: [0, .5, 1.5, 2.5, 3.5], bassOffsets: [0, 1, 2, 3], wave: 'triangle', kick: .88, snare: .62, hat: .44, pad: .027, melodyGain: .03 },
    robot: { roots: [38, 41, 43, 36], chord: 'minor', melody: [62, 65, 67, 70, 67, 65, 60, 62], melodyOffsets: [0, 1, 2.5, 3], bassOffsets: [0, 1.5, 2.5], wave: 'sawtooth', kick: .98, snare: .7, hat: .5, pad: .02, melodyGain: .022 },
    moon: { roots: [45, 50, 48, 43], chord: 'mixed', melody: [69, 74, 76, 81, 79, 76, 74, 71], melodyOffsets: [.5, 1.5, 2.5, 3.5], bassOffsets: [0, 2], wave: 'sine', kick: .68, snare: .5, hat: .34, pad: .038, melodyGain: .026 },
    chorus: { roots: [48, 52, 53, 55], chord: 'major', melody: [72, 76, 79, 84, 81, 79, 76, 74], melodyOffsets: [0, 1, 2, 3], bassOffsets: [0, 2], wave: 'triangle', kick: .62, snare: .45, hat: .22, pad: .052, melodyGain: .028 },
    mole: { roots: [43, 46, 48, 41], chord: 'minor', melody: [67, 70, 72, 75, 72, 70, 65, 67], melodyOffsets: [0, .75, 1.5, 2.25, 3.25], bassOffsets: [0, 2.5], wave: 'triangle', kick: .8, snare: .62, hat: .34, pad: .028, melodyGain: .027 },
    dance: { roots: [45, 48, 50, 52], chord: 'minor', melody: [69, 72, 76, 74, 77, 81, 79, 76], melodyOffsets: [0, .5, 1, 1.5, 2.5, 3, 3.5], bassOffsets: [0, 1, 2, 3], wave: 'square', kick: 1, snare: .74, hat: .56, pad: .022, melodyGain: .024 },
    conference: { roots: [48, 53, 50, 55], chord: 'major', melody: [72, 76, 74, 79, 76, 81, 79, 74], melodyOffsets: [0, 1.5, 2, 3.5], bassOffsets: [0, 2], wave: 'triangle', kick: .7, snare: .58, hat: .3, pad: .034, melodyGain: .025 },
    ninja: { roots: [40, 45, 43, 38], chord: 'minor', melody: [64, 67, 71, 72, 71, 67, 66, 62], melodyOffsets: [0, .5, 1.5, 2.75, 3.5], bassOffsets: [0, 2], wave: 'sawtooth', kick: .82, snare: .7, hat: .48, pad: .018, melodyGain: .02 },
    'remix-a': { roots: [48, 43, 53, 45], chord: 'mixed', melody: [72, 76, 79, 74, 81, 77, 83, 79], melodyOffsets: [0, .5, 1.5, 2, 3, 3.5], bassOffsets: [0, 1.5, 2.5], wave: 'triangle', kick: .96, snare: .7, hat: .5, pad: .028, melodyGain: .03 },
    'remix-b': { roots: [50, 43, 46, 53], chord: 'mixed', melody: [74, 77, 81, 79, 83, 81, 76, 78], melodyOffsets: [0, .5, 1, 2, 2.5, 3.5], bassOffsets: [0, 1, 2.5], wave: 'square', kick: 1, snare: .76, hat: .56, pad: .025, melodyGain: .028 },
    'remix-c': { roots: [45, 50, 41, 48], chord: 'mixed', melody: [69, 72, 76, 79, 83, 81, 77, 74], melodyOffsets: [0, .5, 1, 1.5, 2.5, 3, 3.5], bassOffsets: [0, 1.5, 2, 3], wave: 'sawtooth', kick: 1, snare: .82, hat: .62, pad: .022, melodyGain: .026 }
};
export class AudioEngine {
    context = null;
    master = null;
    musicBus = null;
    sfxBus = null;
    active = new Set();
    musicVolume = 0.72;
    sfxVolume = 0.9;
    voiceBuffers = new Map();
    externalBuffers = new Map();
    failedExternal = new Set();
    voiceLoad = null;
    async unlock() {
        if (!this.context) {
            this.context = new AudioContext({ latencyHint: 'interactive' });
            this.master = this.context.createGain();
            this.musicBus = this.context.createGain();
            this.sfxBus = this.context.createGain();
            this.master.gain.value = 0.92;
            this.musicBus.gain.value = this.musicVolume;
            this.sfxBus.gain.value = this.sfxVolume;
            this.musicBus.connect(this.master);
            this.sfxBus.connect(this.master);
            this.master.connect(this.context.destination);
        }
        if (this.context.state !== 'running')
            await this.context.resume();
        if (!this.voiceLoad)
            this.voiceLoad = this.loadVoiceSamples();
        await this.voiceLoad;
    }
    async prepareGame(definition, allowExternal) {
        if (!allowExternal || !definition.externalMusic || !this.context)
            return false;
        const file = definition.externalMusic.file;
        if (this.externalBuffers.has(file))
            return true;
        if (this.failedExternal.has(file))
            return false;
        try {
            const response = await fetch(`./${file}`, { cache: 'no-store' });
            if (!response.ok)
                throw new Error(`${response.status}`);
            const data = await response.arrayBuffer();
            const decoded = await this.context.decodeAudioData(data);
            this.externalBuffers.set(file, decoded);
            return true;
        }
        catch (error) {
            this.failedExternal.add(file);
            console.info(`CC0 music not installed (${file}); using built-in synchronized music.`, error);
            return false;
        }
    }
    now() {
        if (!this.context)
            throw new Error('AudioEngine is not unlocked');
        return this.context.currentTime;
    }
    getEstimatedOutputLatencyMs() {
        if (!this.context)
            return 0;
        const context = this.context;
        const seconds = context.outputLatency ?? context.baseLatency ?? 0;
        return Math.max(0, Math.round(seconds * 1000));
    }
    setVolumes(music, sfx) {
        this.musicVolume = Math.min(1, Math.max(0, music));
        this.sfxVolume = Math.min(1, Math.max(0, sfx));
        if (!this.context)
            return;
        this.musicBus?.gain.setTargetAtTime(this.musicVolume, this.context.currentTime, 0.015);
        this.sfxBus?.gain.setTargetAtTime(this.sfxVolume, this.context.currentTime, 0.015);
    }
    scheduleCount(time, strong = false) {
        this.tone('sfx', time, strong ? 1040 : 720, 0.055, strong ? 0.14 : 0.08, 'triangle');
    }
    scheduleSong(definition, startTime, endBeat, useExternal) {
        const spb = 60 / definition.bpm;
        if (this.context && this.musicBus) {
            this.musicBus.gain.cancelScheduledValues(this.context.currentTime);
            this.musicBus.gain.setValueAtTime(this.musicVolume, this.context.currentTime);
            this.scheduleCueDucking(definition, startTime, spb);
        }
        if (useExternal && definition.externalMusic) {
            const buffer = this.externalBuffers.get(definition.externalMusic.file);
            if (buffer && this.context && this.musicBus) {
                const source = this.context.createBufferSource();
                const gain = this.context.createGain();
                source.buffer = buffer;
                source.loop = true;
                gain.gain.value = definition.externalMusic.gain ?? 0.62;
                source.connect(gain);
                gain.connect(this.musicBus);
                this.registerSource(source);
                source.start(startTime + 4 * spb + (definition.externalMusic.offsetSec ?? 0));
                source.stop(startTime + endBeat * spb + 0.1);
                return;
            }
        }
        this.scheduleSynthSong(definition, startTime, spb, endBeat);
    }
    scheduleCueDucking(definition, startTime, spb) {
        if (!this.musicBus)
            return;
        const important = new Set([
            'ding', 'charge', 'frog-call', 'alarm', 'dish-left', 'dish-right', 'bolt-short', 'bolt-long',
            'serve', 'lob', 'sing-short', 'sing-long', 'knock', 'dance-left', 'dance-right',
            'question-one', 'question-two', 'question-three', 'question-hold', 'camera-ready', 'switch'
        ]);
        for (const cue of definition.cues) {
            if (!important.has(cue.kind))
                continue;
            const t = startTime + cue.beat * spb;
            const pre = Math.max(startTime, t - .12);
            const low = this.musicVolume * (cue.kind === 'switch' ? .48 : .66);
            this.musicBus.gain.setValueAtTime(this.musicVolume, pre);
            this.musicBus.gain.linearRampToValueAtTime(low, t);
            this.musicBus.gain.linearRampToValueAtTime(this.musicVolume, t + Math.min(.32, spb * .7));
        }
    }
    scheduleCue(cue, time, index, scene) {
        switch (cue.kind) {
            case 'ding':
                this.tone('sfx', time, midiToHz(cue.pitch ?? 84), .09, .075, 'sine');
                this.tone('sfx', time + .018, midiToHz((cue.pitch ?? 84) + 7), .08, .035, 'triangle');
                break;
            case 'charge':
                this.riser(time, Math.max(.18, (cue.durationBeats ?? 2) * .14), .075);
                break;
            case 'frog-call':
                this.tone('sfx', time, 210 + (index % 3) * 35, .11, .09, 'square');
                this.tone('sfx', time + .045, 145 + (index % 2) * 25, .1, .055, 'triangle');
                break;
            case 'alarm':
                this.alarm(time, .12);
                break;
            case 'decoy-phone':
                this.tone('sfx', time, 520, .12, .065, 'sine');
                this.tone('sfx', time + .14, 660, .12, .06, 'sine');
                break;
            case 'decoy-bird':
                this.tone('sfx', time, 1280, .055, .045, 'sine');
                this.tone('sfx', time + .07, 1560, .05, .035, 'sine');
                break;
            case 'dish-left':
                this.clack(time, -.75, .08);
                break;
            case 'dish-right':
                this.clack(time, .75, .08);
                break;
            case 'bolt-short':
            case 'bolt-long':
                this.tone('sfx', time, cue.kind === 'bolt-short' ? 310 : 230, .08, .07, 'square');
                this.tone('sfx', time + .045, cue.kind === 'bolt-short' ? 430 : 350, .07, .045, 'sawtooth');
                break;
            case 'serve':
                this.tone('sfx', time, 620, .07, .08, 'triangle');
                this.noise('sfx', time, .045, .035, 1600, 'highpass');
                break;
            case 'lob':
                this.tone('sfx', time, 440, .22, .065, 'sine', .01, .18);
                this.tone('sfx', time + .08, 660, .18, .035, 'sine', .01, .15);
                break;
            case 'sing-short':
            case 'sing-long':
                this.tone('sfx', time, midiToHz(72 + (index % 3) * 2), Math.max(.18, (cue.durationBeats ?? 2) * .18), .052, 'sine', .04, .18);
                break;
            case 'knock':
                this.tone('sfx', time, 150, .045, .075, 'triangle');
                this.noise('sfx', time, .035, .035, 520, 'lowpass');
                break;
            case 'dance-left':
                this.clack(time, -.8, .08);
                this.tone('sfx', time, 280, .05, .045, 'square', .005, .04, -.6);
                break;
            case 'dance-right':
                this.clack(time, .8, .08);
                this.tone('sfx', time, 360, .05, .045, 'square', .005, .04, .6);
                break;
            case 'question-one':
                this.scheduleVoice('hey', time, .44);
                this.tone('sfx', time + .18, 720, .07, .04, 'triangle');
                break;
            case 'question-two':
                this.scheduleVoice('hey', time, .42);
                this.clap('sfx', time + .15, .05, .045);
                this.clap('sfx', time + .27, .05, .04);
                break;
            case 'question-three':
                this.scheduleVoice('hey', time, .42);
                this.clap('sfx', time + .13, .045, .044);
                this.clap('sfx', time + .24, .045, .04);
                this.clap('sfx', time + .35, .045, .037);
                this.tone('sfx', time + .03, 880, .09, .035, 'triangle');
                break;
            case 'question-hold':
                this.scheduleVoice('go', time, .42);
                this.riser(time + .12, .28, .045);
                break;
            case 'camera-ready':
                this.noise('sfx', time, .12, .045, 1800, 'bandpass');
                this.tone('sfx', time + .08, 420, .07, .035, 'triangle');
                break;
            case 'camera-decoy':
                this.noise('sfx', time, .16, .03, 3600, 'highpass');
                break;
            case 'switch':
                this.scheduleVoice('yeah', time, .64);
                this.finale(time + .06, 60, .07);
                break;
            default:
                this.tone('sfx', time, 760, .07, .05, 'triangle');
                break;
        }
    }
    playInput(judge, action, scene, beat) {
        if (!this.context)
            return;
        const now = this.context.currentTime;
        if (judge === 'MISS') {
            this.tone('sfx', now, 148, .13, .07, 'sawtooth');
            this.tone('sfx', now + .024, 112, .09, .035, 'square');
            return;
        }
        const quality = judge === 'PERFECT' ? 1 : judge === 'GREAT' ? .82 : .64;
        const pan = action === 'left' ? -.7 : action === 'right' ? .7 : 0;
        if (action === 'release') {
            this.tone('sfx', now, scene === 'space' ? 920 : 720, .09, .095 * quality, 'triangle', .004, .065, pan);
            this.noise('sfx', now + .02, .055, .035 * quality, 2200, 'highpass', pan);
            return;
        }
        const sceneBase = {
            bakery: 760, space: 560, frog: 360, bedroom: 820, penguin: 680, robot: 260,
            moon: 620, chorus: 740, mole: 180, dance: 520, conference: 700, ninja: 900
        };
        const base = sceneBase[scene] + ((Math.round(beat * 2) % 4) * 28);
        this.tone('sfx', now, base, .08, .085 * quality, scene === 'robot' ? 'square' : 'triangle', .005, .055, pan);
        if (judge === 'PERFECT')
            this.tone('sfx', now + .035, base * 1.5, .065, .04, 'sine', .003, .045, pan);
    }
    scheduleVoice(sample, time, gainValue = .66) {
        if (!this.context)
            return;
        const buffer = this.voiceBuffers.get(sample);
        const bus = this.getBus('sfx');
        if (!buffer || !bus)
            return;
        const source = this.context.createBufferSource();
        const gain = this.context.createGain();
        source.buffer = buffer;
        gain.gain.value = gainValue;
        source.connect(gain);
        gain.connect(bus);
        this.registerSource(source);
        source.start(time);
    }
    stopAll() {
        for (const source of this.active) {
            try {
                source.stop();
            }
            catch { /* already stopped */ }
        }
        this.active.clear();
    }
    async loadVoiceSamples() {
        if (!this.context)
            return;
        const samples = ['hey', 'go', 'yeah'];
        await Promise.all(samples.map(async (name) => {
            try {
                const response = await fetch(`./audio/${name}.wav`);
                if (!response.ok)
                    return;
                const decoded = await this.context.decodeAudioData(await response.arrayBuffer());
                this.voiceBuffers.set(name, decoded);
            }
            catch (error) {
                console.warn(`Voice sample load failed: ${name}`, error);
            }
        }));
    }
    scheduleSynthSong(definition, start, spb, endBeat) {
        const config = STYLES[definition.musicStyle];
        this.scheduleGroove(start, spb, endBeat, config);
        // Strong section boundaries are musical events, not just UI labels.
        for (const section of definition.sections) {
            if (section.startBeat <= 4 || section.startBeat >= endBeat - 1)
                continue;
            const time = start + section.startBeat * spb;
            this.scheduleSectionTurn(time, spb, config, section.startBeat);
        }
        // Regular fills make the backing track feel composed rather than looped.
        for (let fillBeat = 15.5; fillBeat < endBeat - 2; fillBeat += 16) {
            this.scheduleFill(start + fillBeat * spb, spb, config);
        }
        for (let beat = 4, bar = 0; beat < endBeat; beat += 4, bar += 1) {
            const root = config.roots[bar % config.roots.length] ?? config.roots[0] ?? 48;
            const chordKind = config.chord === 'mixed' ? (bar % 3 === 1 ? 'minor' : 'major') : config.chord;
            const finalPush = beat >= endBeat - 12;
            const midBreak = definition.sections.some((section) => Math.abs(section.startBeat - beat) < .01 && beat > 4);
            const padGain = config.pad * (midBreak ? .72 : finalPush ? 1.28 : 1);
            this.padChord(start + beat * spb, root, chordKind, spb * 3.65, padGain);
            for (const offset of config.bassOffsets) {
                const note = root + (offset >= 2 ? 7 : 0);
                this.bass(start + (beat + offset) * spb, note, spb * .46, (.055 + config.kick * .015) * (finalPush ? 1.12 : 1));
            }
            if (beat >= 8) {
                config.melodyOffsets.forEach((offset, i) => {
                    const note = config.melody[(bar * 2 + i) % config.melody.length] ?? 72;
                    const swing = config.swing && (i % 2 === 1) ? config.swing : 0;
                    this.pluck(start + (beat + offset + swing) * spb, note, spb * .22, config.melodyGain * (finalPush ? 1.25 : 1), config.wave);
                });
            }
            this.scheduleGameMotif(this.getSceneAtBeat(definition, beat), start + beat * spb, spb, bar, finalPush);
        }
        // Last bars become audibly busier so the player can feel the finale coming.
        for (let beat = Math.max(4, endBeat - 8); beat < endBeat; beat += .25) {
            const strong = Math.abs(beat - Math.round(beat)) < .001;
            this.hat(start + beat * spb, strong ? .03 * config.hat : .013 * config.hat, beat % 1 > .7);
        }
        this.finale(start + endBeat * spb, (config.roots[0] ?? 48) + 12, .095);
    }
    scheduleSectionTurn(time, spb, config, beat) {
        const root = (config.roots[Math.floor(beat / 4) % config.roots.length] ?? config.roots[0] ?? 48) + 12;
        this.noise('music', time - .08 * spb, .16, .025 * config.hat, 4200, 'highpass');
        this.kick(time, .065 * config.kick);
        this.pluck(time, root + 12, spb * .22, config.melodyGain * 1.8, config.wave);
        this.pluck(time + .5 * spb, root + 19, spb * .16, config.melodyGain * 1.15, config.wave);
    }
    getSceneAtBeat(definition, beat) {
        let scene = definition.scene;
        for (const section of definition.sections) {
            if (section.startBeat > beat)
                break;
            if (section.scene)
                scene = section.scene;
        }
        return scene;
    }
    scheduleGameMotif(scene, time, spb, bar, finalPush) {
        const g = finalPush ? 1.2 : 1;
        switch (scene) {
            case 'bakery':
                this.tone('music', time + 3.5 * spb, 1180, .045, .018 * g, 'sine');
                break;
            case 'space':
                [0, .5, 1, 1.5].forEach((o, i) => this.pluck(time + o * spb, 72 + i * 3 + (bar % 2) * 2, spb * .16, .014 * g, 'sine'));
                break;
            case 'frog':
                if (bar % 2 === 0) {
                    this.tone('music', time + 2.5 * spb, 330, .09, .017 * g, 'square');
                    this.tone('music', time + 3 * spb, 245, .09, .014 * g, 'triangle');
                }
                break;
            case 'bedroom':
                if (bar % 2 === 0)
                    this.pluck(time + 2 * spb, 84, spb * .38, .014 * g, 'sine');
                break;
            case 'penguin':
                this.tone('music', time + .5 * spb, 420, .045, .016 * g, 'triangle', .004, .04, -.55);
                this.tone('music', time + 2.5 * spb, 520, .045, .016 * g, 'triangle', .004, .04, .55);
                break;
            case 'robot':
                for (let o = 0; o < 4; o += 1)
                    this.tone('music', time + (o + .5) * spb, 118 + (o % 2) * 32, .035, .013 * g, 'square');
                break;
            case 'moon':
                this.pluck(time + 1.5 * spb, 81 + (bar % 3) * 2, spb * .3, .016 * g, 'sine');
                this.pluck(time + 3.25 * spb, 88 + (bar % 2) * 2, spb * .24, .012 * g, 'sine');
                break;
            case 'chorus':
                this.tone('music', time + 3 * spb, midiToHz(76), spb * .55, .012 * g, 'sine', .06, .22);
                this.tone('music', time + 3 * spb, midiToHz(79), spb * .55, .01 * g, 'sine', .06, .22);
                break;
            case 'mole':
                this.tone('music', time + .75 * spb, 170, .04, .018 * g, 'triangle');
                this.tone('music', time + 2.75 * spb, 190, .04, .018 * g, 'triangle');
                break;
            case 'dance':
                [0.5, 1.5, 2.5, 3.5].forEach((o) => this.pluck(time + o * spb, 84, spb * .12, .014 * g, 'square'));
                break;
            case 'conference':
                if (bar % 2 === 0) {
                    this.pluck(time + 1 * spb, 79, spb * .16, .018 * g, 'triangle');
                    this.pluck(time + 1.5 * spb, 83, spb * .16, .014 * g, 'triangle');
                }
                break;
            case 'ninja':
                this.pluck(time + .25 * spb, 88 - (bar % 3) * 2, spb * .13, .014 * g, 'triangle');
                this.pluck(time + 2.75 * spb, 83 - (bar % 2) * 2, spb * .13, .011 * g, 'triangle');
                break;
        }
    }
    scheduleGroove(start, spb, endBeat, config) {
        for (let beat = 4; beat < endBeat; beat += .5) {
            const step = Math.round(beat * 2);
            const whole = Math.abs(beat - Math.round(beat)) < .001;
            const pos = ((beat % 4) + 4) % 4;
            if (whole) {
                if (pos === 0 || pos === 2)
                    this.kick(start + beat * spb, .072 * config.kick);
                if (pos === 1 || pos === 3)
                    this.snare(start + beat * spb, .064 * config.snare);
            }
            this.hat(start + beat * spb, (step % 2 === 0 ? .026 : .017) * config.hat, step % 4 === 3);
        }
    }
    scheduleFill(time, spb, config) {
        const steps = [0, .25, .5, .75];
        steps.forEach((offset, index) => {
            this.snare(time + offset * spb, (.022 + index * .008) * config.snare);
            this.hat(time + offset * spb, (.02 + index * .006) * config.hat, index === steps.length - 1);
        });
        const root = config.roots[0] ?? 48;
        this.pluck(time + .75 * spb, root + 24, spb * .18, config.melodyGain * 1.35, config.wave);
    }
    finale(time, rootMidi, gain) {
        this.kick(time, gain * .8);
        this.padChord(time, rootMidi, 'major', .7, gain * .45);
        this.pluck(time, rootMidi + 24, .35, gain * .72);
    }
    padChord(time, root, kind, duration, gain) {
        const intervals = kind === 'minor' ? [0, 3, 7] : [0, 4, 7];
        for (const interval of intervals)
            this.tone('music', time, midiToHz(root + 12 + interval), duration, gain, 'triangle', .08, .32);
    }
    bass(time, midi, duration, gain) {
        this.tone('music', time, midiToHz(midi), duration, gain, 'triangle', .012, .12);
    }
    pluck(time, midi, duration, gain, wave = 'triangle') {
        this.tone('music', time, midiToHz(midi), duration, gain, wave, .006, .07);
    }
    kick(time, gainValue) {
        if (!this.context)
            return;
        const bus = this.getBus('music');
        if (!bus)
            return;
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(128, time);
        osc.frequency.exponentialRampToValueAtTime(46, time + .11);
        gain.gain.setValueAtTime(Math.max(.0001, gainValue), time);
        gain.gain.exponentialRampToValueAtTime(.0001, time + .13);
        osc.connect(gain);
        gain.connect(bus);
        this.registerSource(osc);
        osc.start(time);
        osc.stop(time + .14);
    }
    snare(time, gainValue) {
        this.noise('music', time, .09, gainValue, 1100, 'highpass');
        this.tone('music', time, 190, .07, gainValue * .28, 'triangle');
    }
    hat(time, gainValue, open) {
        this.noise('music', time, open ? .07 : .028, gainValue, 4800, 'highpass');
    }
    alarm(time, gainValue) {
        for (let i = 0; i < 4; i += 1) {
            this.tone('sfx', time + i * .075, i % 2 === 0 ? 980 : 760, .06, gainValue, 'square');
        }
    }
    riser(time, duration, gainValue) {
        if (!this.context)
            return;
        const bus = this.getBus('sfx');
        if (!bus)
            return;
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, time);
        osc.frequency.exponentialRampToValueAtTime(720, time + duration);
        gain.gain.setValueAtTime(.0001, time);
        gain.gain.exponentialRampToValueAtTime(Math.max(.0001, gainValue), time + duration * .25);
        gain.gain.exponentialRampToValueAtTime(.0001, time + duration);
        osc.connect(gain);
        gain.connect(bus);
        this.registerSource(osc);
        osc.start(time);
        osc.stop(time + duration + .02);
    }
    clack(time, pan, gainValue) {
        this.noise('sfx', time, .045, gainValue, 1600, 'bandpass', pan);
        this.tone('sfx', time, 420, .05, gainValue * .45, 'triangle', .004, .04, pan);
    }
    clap(bus, time, duration, gainValue) {
        this.noise(bus, time, duration, gainValue, 950, 'highpass');
        this.noise(bus, time + .018, duration * .65, gainValue * .6, 1300, 'bandpass');
    }
    noise(busKind, time, duration, gainValue, cutoff, filterType, pan = 0) {
        if (!this.context)
            return;
        const bus = this.getBus(busKind);
        if (!bus)
            return;
        const length = Math.max(1, Math.floor(this.context.sampleRate * duration));
        const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < length; i += 1)
            data[i] = Math.random() * 2 - 1;
        const source = this.context.createBufferSource();
        const filter = this.context.createBiquadFilter();
        const gain = this.context.createGain();
        const panner = this.context.createStereoPanner();
        filter.type = filterType;
        filter.frequency.value = cutoff;
        panner.pan.value = Math.min(1, Math.max(-1, pan));
        gain.gain.setValueAtTime(Math.max(.0001, gainValue), time);
        gain.gain.exponentialRampToValueAtTime(.0001, time + duration);
        source.buffer = buffer;
        source.connect(filter);
        filter.connect(gain);
        gain.connect(panner);
        panner.connect(bus);
        this.registerSource(source);
        source.start(time);
        source.stop(time + duration + .01);
    }
    tone(busKind, time, frequency, duration, gainValue, wave, attack = .004, release = .06, pan = 0) {
        if (!this.context)
            return;
        const bus = this.getBus(busKind);
        if (!bus)
            return;
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        const panner = this.context.createStereoPanner();
        osc.type = wave;
        osc.frequency.value = frequency;
        panner.pan.value = Math.min(1, Math.max(-1, pan));
        const peak = Math.max(.0001, gainValue);
        gain.gain.setValueAtTime(.0001, time);
        gain.gain.exponentialRampToValueAtTime(peak, time + Math.max(.001, attack));
        gain.gain.setValueAtTime(peak, Math.max(time + attack, time + duration - release));
        gain.gain.exponentialRampToValueAtTime(.0001, time + duration);
        osc.connect(gain);
        gain.connect(panner);
        panner.connect(bus);
        this.registerSource(osc);
        osc.start(time);
        osc.stop(time + duration + .02);
    }
    getBus(kind) {
        return kind === 'music' ? this.musicBus : this.sfxBus;
    }
    registerSource(source) {
        this.active.add(source);
        source.addEventListener('ended', () => this.active.delete(source), { once: true });
    }
}
//# sourceMappingURL=audio.js.map