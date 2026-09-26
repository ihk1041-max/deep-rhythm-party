import type { GameId, Judge } from './types.js';

export type ScheduledBeatKind = 'beat' | 'cue' | 'target';

export class AudioEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private active = new Set<AudioScheduledSourceNode>();
  private volume = 0.8;

  async unlock(): Promise<void> {
    if (!this.context) {
      this.context = new AudioContext({ latencyHint: 'interactive' });
      this.master = this.context.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.context.destination);
    }

    if (this.context.state !== 'running') {
      await this.context.resume();
    }
  }

  now(): number {
    if (!this.context) throw new Error('AudioEngine is not unlocked');
    return this.context.currentTime;
  }

  setVolume(value: number): void {
    this.volume = Math.min(1, Math.max(0, value));
    if (this.master && this.context) {
      this.master.gain.setTargetAtTime(this.volume, this.context.currentTime, 0.015);
    }
  }

  scheduleCount(time: number, strong = false): void {
    this.tone(time, strong ? 960 : 680, 0.06, strong ? 0.18 : 0.11, 'triangle');
  }

  scheduleGameBeat(gameId: GameId, time: number, kind: ScheduledBeatKind): void {
    if (gameId === 'mendako-pop') {
      if (kind === 'target') {
        this.tone(time, 820, 0.055, 0.13, 'sine');
        this.tone(time + 0.025, 1080, 0.04, 0.055, 'sine');
      } else if (kind === 'cue') {
        this.tone(time, 480, 0.035, 0.055, 'triangle');
      } else {
        this.tone(time, 360, 0.025, 0.03, 'sine');
      }
      return;
    }

    if (gameId === 'crab-clap') {
      if (kind === 'cue') {
        this.noiseClap(time, 0.075, 0.105);
        this.tone(time, 620, 0.045, 0.055, 'square');
      } else if (kind === 'target') {
        this.tone(time, 430, 0.025, 0.038, 'triangle');
      } else {
        this.tone(time, 300, 0.022, 0.025, 'triangle');
      }
      return;
    }

    if (kind === 'cue') {
      this.tone(time, 420, 0.075, 0.075, 'sine');
      this.tone(time + 0.02, 560, 0.055, 0.045, 'sine');
    } else if (kind === 'target') {
      this.tone(time, 760, 0.035, 0.052, 'triangle');
    } else {
      this.tone(time, 280, 0.025, 0.025, 'sine');
    }
  }

  playHit(judge: Judge, gameId: GameId): void {
    if (!this.context) return;
    const now = this.context.currentTime;

    if (judge === 'MISS') {
      this.tone(now, 145, 0.12, 0.075, 'sawtooth');
      return;
    }

    const quality = judge === 'PERFECT' ? 1 : judge === 'GREAT' ? 0.84 : 0.68;
    if (gameId === 'crab-clap') {
      this.noiseClap(now, 0.07, 0.12 * quality);
      this.tone(now, 720, 0.055, 0.075 * quality, 'square');
      return;
    }

    if (gameId === 'fugu-puku') {
      const base = judge === 'PERFECT' ? 920 : judge === 'GREAT' ? 780 : 680;
      this.tone(now, base, 0.08, 0.10, 'sine');
      this.tone(now + 0.035, base * 1.35, 0.07, 0.07, 'triangle');
      return;
    }

    const frequency = judge === 'PERFECT' ? 1180 : judge === 'GREAT' ? 940 : 760;
    this.tone(now, frequency, 0.08, 0.11, 'sine');
    this.tone(now + 0.035, frequency * 1.25, 0.06, 0.07, 'sine');
  }

  stopAll(): void {
    for (const source of this.active) {
      try {
        source.stop();
      } catch {
        // Already stopped.
      }
    }
    this.active.clear();
  }

  private registerSource(source: AudioScheduledSourceNode): void {
    this.active.add(source);
    source.addEventListener('ended', () => {
      this.active.delete(source);
      source.disconnect();
    });
  }

  private tone(
    time: number,
    frequency: number,
    duration: number,
    gainValue: number,
    type: OscillatorType
  ): void {
    if (!this.context || !this.master) return;

    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, time);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, gainValue), time + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    oscillator.connect(gain);
    gain.connect(this.master);
    this.registerSource(oscillator);

    oscillator.start(time);
    oscillator.stop(time + duration + 0.02);
  }

  private noiseClap(time: number, duration: number, gainValue: number): void {
    if (!this.context || !this.master) return;

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
    filter.type = 'highpass';
    filter.frequency.value = 900;
    gain.gain.setValueAtTime(Math.max(0.0001, gainValue), time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    this.registerSource(source);
    source.start(time);
    source.stop(time + duration + 0.015);
  }
}
