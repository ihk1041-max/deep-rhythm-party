export class AudioEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private active = new Set<OscillatorNode>();
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

  scheduleBeat(time: number, accent = false): void {
    this.tone(time, accent ? 780 : 520, 0.045, accent ? 0.16 : 0.08, 'sine');
  }

  scheduleCount(time: number, strong = false): void {
    this.tone(time, strong ? 960 : 680, 0.06, strong ? 0.18 : 0.11, 'triangle');
  }

  playHit(judge: 'PERFECT' | 'GREAT' | 'GOOD' | 'MISS'): void {
    if (!this.context) return;
    const now = this.context.currentTime;
    if (judge === 'MISS') {
      this.tone(now, 150, 0.12, 0.09, 'sawtooth');
      return;
    }
    const frequency = judge === 'PERFECT' ? 1180 : judge === 'GREAT' ? 940 : 760;
    this.tone(now, frequency, 0.08, 0.11, 'sine');
    this.tone(now + 0.035, frequency * 1.25, 0.06, 0.07, 'sine');
  }

  stopAll(): void {
    for (const oscillator of this.active) {
      try {
        oscillator.stop();
      } catch {
        // Already stopped.
      }
    }
    this.active.clear();
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
    this.active.add(oscillator);

    oscillator.addEventListener('ended', () => {
      this.active.delete(oscillator);
      oscillator.disconnect();
      gain.disconnect();
    });

    oscillator.start(time);
    oscillator.stop(time + duration + 0.02);
  }
}
