const midiToHz = (midi) => 440 * 2 ** ((midi - 69) / 12);
export class AudioEngine {
    context = null;
    master = null;
    musicBus = null;
    sfxBus = null;
    active = new Set();
    musicVolume = 0.72;
    sfxVolume = 0.9;
    voiceBuffers = new Map();
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
        if (this.context.state !== 'running') {
            await this.context.resume();
        }
        if (!this.voiceLoad)
            this.voiceLoad = this.loadVoiceSamples();
        await this.voiceLoad;
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
        this.tone('sfx', time, strong ? 980 : 700, 0.055, strong ? 0.15 : 0.09, 'triangle');
    }
    scheduleSong(gameId, startTime, bpm, endBeat) {
        const spb = 60 / bpm;
        if (gameId === 'mendako-pop' || gameId === 'robot-stamp') {
            this.scheduleMendakoSong(startTime, spb, endBeat);
        }
        else if (gameId === 'crab-clap' || gameId === 'cat-dj') {
            this.scheduleCrabSong(startTime, spb, endBeat);
        }
        else if (gameId === 'fugu-puku' || gameId === 'ninja-mochi') {
            this.scheduleFuguSong(startTime, spb, endBeat);
        }
        else {
            this.scheduleRemixSong(startTime, spb, endBeat);
        }
    }
    scheduleCue(gameId, time, cueIndex) {
        if (gameId === 'deep-remix') {
            const mode = cueIndex % 3;
            if (mode === 0)
                this.scheduleCue('mendako-pop', time, cueIndex);
            else if (mode === 1)
                this.scheduleCue('crab-clap', time, cueIndex);
            else
                this.scheduleCue('fugu-puku', time, cueIndex);
            return;
        }
        if (gameId === 'crab-clap' || gameId === 'cat-dj') {
            this.clap('sfx', time, 0.07, 0.115);
            const notes = [72, 74, 76, 79];
            this.tone('sfx', time, midiToHz(notes[cueIndex % notes.length] ?? 72), 0.08, 0.05, 'square');
            return;
        }
        if (gameId === 'fugu-puku' || gameId === 'ninja-mochi') {
            const notes = [67, 71, 74, 76];
            const note = notes[cueIndex % notes.length] ?? 67;
            this.tone('sfx', time, midiToHz(note), 0.11, 0.075, 'sine');
            this.tone('sfx', time + 0.028, midiToHz(note + 7), 0.07, 0.035, 'triangle');
            return;
        }
        const notes = [76, 79, 81, 83];
        const note = notes[cueIndex % notes.length] ?? 76;
        this.tone('sfx', time, midiToHz(note), 0.10, 0.065, 'sine');
        this.tone('sfx', time + 0.035, midiToHz(note + 12), 0.06, 0.03, 'sine');
    }
    playHit(judge, gameId, beat) {
        if (!this.context)
            return;
        const now = this.context.currentTime;
        if (judge === 'MISS') {
            this.tone('sfx', now, 142, 0.13, 0.07, 'sawtooth');
            this.tone('sfx', now + 0.025, 120, 0.08, 0.035, 'square');
            return;
        }
        const quality = judge === 'PERFECT' ? 1 : judge === 'GREAT' ? 0.82 : 0.64;
        if (gameId === 'deep-remix') {
            const phase = Math.floor(beat / 12) % 3;
            this.playHit(judge, phase === 0 ? 'mendako-pop' : phase === 1 ? 'crab-clap' : 'fugu-puku', beat);
            return;
        }
        if (gameId === 'crab-clap' || gameId === 'cat-dj') {
            this.clap('sfx', now, 0.08, 0.145 * quality);
            this.tone('sfx', now, midiToHz(72 + (Math.round(beat) % 5)), 0.065, 0.045 * quality, 'square');
            return;
        }
        if (gameId === 'fugu-puku' || gameId === 'ninja-mochi') {
            const scale = [67, 69, 71, 74, 76];
            const note = scale[Math.abs(Math.round(beat * 2)) % scale.length] ?? 67;
            this.tone('sfx', now, midiToHz(note), 0.12, 0.105 * quality, 'sine');
            this.tone('sfx', now + 0.04, midiToHz(note + 12), 0.08, 0.055 * quality, 'triangle');
            return;
        }
        const scale = [72, 74, 76, 79, 81];
        const note = scale[Math.abs(Math.round(beat * 2)) % scale.length] ?? 72;
        this.tone('sfx', now, midiToHz(note), 0.10, 0.10 * quality, 'sine');
        this.tone('sfx', now + 0.03, midiToHz(note + 12), 0.07, 0.05 * quality, 'triangle');
    }
    scheduleVoice(sample, time, gainValue = 0.68) {
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
    async loadVoiceSamples() {
        if (!this.context)
            return;
        const samples = ['hey', 'go', 'yeah'];
        await Promise.all(samples.map(async (name) => {
            try {
                const response = await fetch(`./audio/${name}.wav`);
                if (!response.ok)
                    return;
                const data = await response.arrayBuffer();
                const decoded = await this.context.decodeAudioData(data);
                this.voiceBuffers.set(name, decoded);
            }
            catch (error) {
                console.warn(`Voice sample load failed: ${name}`, error);
            }
        }));
    }
    stopAll() {
        for (const source of this.active) {
            try {
                source.stop();
            }
            catch {
                // Already stopped.
            }
        }
        this.active.clear();
    }
    scheduleMendakoSong(start, spb, endBeat) {
        const roots = [48, 45, 41, 43];
        const chordTypes = ['major', 'minor', 'major', 'major'];
        const melody = [72, 76, 79, 76, 74, 77, 81, 79];
        this.scheduleGroove(start, spb, endBeat, 0.82, 0.58, 0.34, 'mendako-pop');
        for (let beat = 4, bar = 0; beat < endBeat; beat += 4, bar += 1) {
            const index = bar % roots.length;
            const root = roots[index] ?? 48;
            const chord = chordTypes[index] ?? 'major';
            this.padChord(start + beat * spb, root, chord, spb * 3.7, 0.032);
            this.bass(start + beat * spb, root, spb * 0.55, 0.07);
            this.bass(start + (beat + 2) * spb, root + 7, spb * 0.48, 0.052);
            if (beat >= 8) {
                for (let step = 0; step < 4; step += 1) {
                    const note = melody[(bar * 2 + step) % melody.length] ?? 72;
                    this.pluck(start + (beat + step) * spb, note, spb * 0.32, 0.032);
                }
            }
        }
        this.finale(start + endBeat * spb, 60, 0.09);
    }
    scheduleCrabSong(start, spb, endBeat) {
        const roots = [38, 41, 43, 45];
        const melody = [62, 65, 69, 67, 65, 70, 69, 74];
        this.scheduleGroove(start, spb, endBeat, 0.9, 0.74, 0.42, 'crab-clap');
        for (let beat = 4, bar = 0; beat < endBeat; beat += 4, bar += 1) {
            const root = roots[bar % roots.length] ?? 38;
            this.padChord(start + beat * spb, root, bar % 2 === 0 ? 'minor' : 'major', spb * 3.45, 0.025);
            for (const offset of [0, 1.5, 2.5]) {
                this.bass(start + (beat + offset) * spb, root + (offset > 2 ? 7 : 0), spb * 0.34, 0.075);
            }
            if (beat >= 8) {
                for (const offset of [0.5, 2, 3.5]) {
                    const note = melody[(bar + Math.round(offset * 2)) % melody.length] ?? 62;
                    this.pluck(start + (beat + offset) * spb, note + 12, spb * 0.18, 0.027, 'square');
                }
            }
        }
        this.finale(start + endBeat * spb, 50, 0.095);
    }
    scheduleFuguSong(start, spb, endBeat) {
        const roots = [43, 47, 40, 45];
        const melody = [67, 71, 74, 76, 74, 71, 69, 74];
        this.scheduleGroove(start, spb, endBeat, 0.76, 0.48, 0.3, 'fugu-puku');
        for (let beat = 4, bar = 0; beat < endBeat; beat += 4, bar += 1) {
            const root = roots[bar % roots.length] ?? 43;
            this.padChord(start + beat * spb, root, 'major', spb * 3.8, 0.035);
            for (let step = 0; step < 4; step += 1) {
                const bassNote = step === 3 ? root + 7 : root;
                this.bass(start + (beat + step) * spb, bassNote, spb * 0.48, 0.058);
            }
            if (beat >= 8) {
                for (const offset of [0, 1.5, 2.5]) {
                    const note = melody[(bar * 2 + Math.floor(offset)) % melody.length] ?? 67;
                    this.pluck(start + (beat + offset) * spb, note, spb * 0.3, 0.034, 'sine');
                }
            }
        }
        this.finale(start + endBeat * spb, 55, 0.09);
    }
    scheduleGroove(start, spb, endBeat, kickGain, snareGain, hatGain, gameId) {
        for (let beat = 4; beat < endBeat; beat += 0.5) {
            const step = Math.round(beat * 2);
            const wholeBeat = Math.abs(beat - Math.round(beat)) < 0.001;
            const barPosition = ((beat % 4) + 4) % 4;
            if (wholeBeat) {
                if (barPosition === 0 || barPosition === 2 || (gameId === 'crab-clap' && barPosition === 3)) {
                    this.kick(start + beat * spb, 0.07 * kickGain);
                }
                if (barPosition === 1 || barPosition === 3) {
                    this.snare(start + beat * spb, 0.065 * snareGain);
                }
            }
            const hatLevel = (step % 2 === 0 ? 0.025 : 0.017) * hatGain;
            this.hat(start + beat * spb, hatLevel, step % 4 === 3);
        }
    }
    scheduleRemixSong(start, spb, endBeat) {
        const roots = [48, 38, 43, 45, 41, 50];
        this.scheduleGroove(start, spb, endBeat, 0.92, 0.72, 0.42, 'deep-remix');
        for (let beat = 4, bar = 0; beat < endBeat; beat += 4, bar += 1) {
            const root = roots[bar % roots.length] ?? 48;
            const phase = Math.floor(beat / 12) % 3;
            this.padChord(start + beat * spb, root, phase === 1 ? 'minor' : 'major', spb * 3.55, 0.03);
            this.bass(start + beat * spb, root, spb * 0.48, 0.072);
            this.bass(start + (beat + 2) * spb, root + 7, spb * 0.4, 0.055);
            const pattern = phase === 0 ? [0, 1, 2.5, 3] : phase === 1 ? [0.5, 1.5, 2, 3.5] : [0, 1.5, 2.5, 3.5];
            for (let i = 0; i < pattern.length; i += 1) {
                const off = pattern[i] ?? 0;
                this.pluck(start + (beat + off) * spb, root + 24 + ((bar + i * 2) % 7), spb * 0.22, 0.032, phase === 1 ? 'square' : 'triangle');
            }
        }
        this.finale(start + endBeat * spb, 60, 0.11);
    }
    finale(time, rootMidi, gain) {
        this.kick(time, gain * 0.8);
        this.padChord(time, rootMidi, 'major', 0.7, gain * 0.5);
        this.pluck(time, rootMidi + 24, 0.35, gain * 0.75);
    }
    padChord(time, root, kind, duration, gain) {
        const intervals = kind === 'minor' ? [0, 3, 7] : [0, 4, 7];
        for (const interval of intervals) {
            this.tone('music', time, midiToHz(root + 12 + interval), duration, gain, 'triangle', 0.08, 0.32);
        }
    }
    bass(time, midi, duration, gain) {
        this.tone('music', time, midiToHz(midi), duration, gain, 'triangle', 0.012, 0.12);
    }
    pluck(time, midi, duration, gain, wave = 'triangle') {
        this.tone('music', time, midiToHz(midi), duration, gain, wave, 0.006, 0.07);
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
        osc.frequency.setValueAtTime(125, time);
        osc.frequency.exponentialRampToValueAtTime(46, time + 0.11);
        gain.gain.setValueAtTime(Math.max(0.0001, gainValue), time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.13);
        osc.connect(gain);
        gain.connect(bus);
        this.registerSource(osc);
        osc.start(time);
        osc.stop(time + 0.14);
    }
    snare(time, gainValue) {
        this.noise('music', time, 0.09, gainValue, 1100, 'highpass');
        this.tone('music', time, 190, 0.07, gainValue * 0.3, 'triangle');
    }
    hat(time, gainValue, open) {
        this.noise('music', time, open ? 0.07 : 0.028, gainValue, 4800, 'highpass');
    }
    clap(bus, time, duration, gainValue) {
        this.noise(bus, time, duration, gainValue, 950, 'highpass');
        this.noise(bus, time + 0.018, duration * 0.65, gainValue * 0.6, 1300, 'bandpass');
    }
    noise(busKind, time, duration, gainValue, cutoff, filterType) {
        if (!this.context)
            return;
        const bus = this.getBus(busKind);
        if (!bus)
            return;
        const length = Math.max(1, Math.floor(this.context.sampleRate * duration));
        const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
        const channel = buffer.getChannelData(0);
        for (let i = 0; i < channel.length; i += 1) {
            const envelope = 1 - i / channel.length;
            channel[i] = (Math.random() * 2 - 1) * envelope;
        }
        const source = this.context.createBufferSource();
        const filter = this.context.createBiquadFilter();
        const gain = this.context.createGain();
        source.buffer = buffer;
        filter.type = filterType;
        filter.frequency.value = cutoff;
        filter.Q.value = filterType === 'bandpass' ? 0.8 : 0.35;
        gain.gain.setValueAtTime(Math.max(0.0001, gainValue), time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
        source.connect(filter);
        filter.connect(gain);
        gain.connect(bus);
        this.registerSource(source);
        source.start(time);
        source.stop(time + duration + 0.01);
    }
    tone(busKind, time, frequency, duration, gainValue, type, attack = 0.008, release = 0.08) {
        if (!this.context)
            return;
        const bus = this.getBus(busKind);
        if (!bus)
            return;
        const oscillator = this.context.createOscillator();
        const gain = this.context.createGain();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, time);
        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, gainValue), time + Math.min(attack, duration * 0.35));
        gain.gain.setValueAtTime(Math.max(0.0001, gainValue * 0.7), Math.max(time + attack, time + duration - release));
        gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
        oscillator.connect(gain);
        gain.connect(bus);
        this.registerSource(oscillator);
        oscillator.start(time);
        oscillator.stop(time + duration + 0.02);
    }
    getBus(kind) {
        return kind === 'music' ? this.musicBus : this.sfxBus;
    }
    registerSource(source) {
        this.active.add(source);
        source.addEventListener('ended', () => {
            this.active.delete(source);
            source.disconnect();
        });
    }
}
//# sourceMappingURL=audio.js.map