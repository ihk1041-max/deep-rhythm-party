import { getGameDefinition } from './games.js';
import type { GameId, Judge, RenderState, TargetState } from './types.js';

interface Bubble {
  x: number;
  y: number;
  radius: number;
  speed: number;
  phase: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  bornAt: number;
  lifeMs: number;
  radius: number;
  hue: number;
}

export class GameRenderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private bubbles: Bubble[] = [];
  private particles: Particle[] = [];
  private width = 0;
  private height = 0;
  private dpr = 1;
  private previousHitPulse = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D context is not available');
    this.ctx = context;
    this.resize();
    window.addEventListener('resize', () => this.resize(), { passive: true });
  }

  render(state: RenderState, timeMs: number): void {
    const ctx = this.ctx;
    const definition = getGameDefinition(state.gameId);
    const cuePulse = state.mode === 'game' ? this.getCuePulse(state.beat, state.cueBeats) : 0;

    if (state.hitPulse > 0.82 && this.previousHitPulse <= 0.82) {
      this.spawnParticles(timeMs, state.gameId);
    }
    this.previousHitPulse = state.hitPulse;

    ctx.save();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const shake = state.missPulse > 0 ? Math.sin(timeMs * 0.12) * state.missPulse * 6 : 0;
    ctx.translate(shake, 0);

    this.drawBackground(timeMs, state.gameId, state.missPulse, state.musicPulse);

    if (state.mode === 'game') {
      this.drawBeatGuide(state.targets, state.beat, state.gameId);
    }

    const idleWave = Math.sin(timeMs / 650) * 4;
    const beatBounce = state.mode === 'game' ? state.musicPulse * 6 : 0;
    const hitBounce = state.hitPulse * 22;
    const centerY = this.height * 0.53 + idleWave - beatBounce - hitBounce;

    this.drawCharacter(
      definition.id,
      this.width / 2,
      centerY,
      1 + state.hitPulse * 0.08,
      timeMs,
      state.hitPulse,
      state.missPulse,
      cuePulse
    );

    this.drawParticles(timeMs);

    if (state.mode === 'game') {
      this.drawCueLabel(state.gameId, cuePulse);
      this.drawJudgeText(state.lastJudge, state.lastJudgeAgeMs);
      this.drawCountIn(state.beat);
    }

    ctx.restore();
  }

  private resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.width = Math.max(1, rect.width);
    this.height = Math.max(1, rect.height);
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.bubbles = [];
  }

  private drawBackground(timeMs: number, gameId: GameId, missPulse: number, musicPulse: number): void {
    const ctx = this.ctx;
    const palette: readonly [string, string, string] = gameId === 'crab-clap'
      ? ['#071c2f', '#0a4254', '#102537']
      : gameId === 'fugu-puku'
        ? ['#061d31', '#0b4a56', '#0c2637']
        : ['#05162f', '#08375a', '#071325'];

    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, palette[0]);
    gradient.addColorStop(0.48, palette[1]);
    gradient.addColorStop(1, palette[2]);
    ctx.fillStyle = gradient;
    ctx.fillRect(-10, 0, this.width + 20, this.height);

    if (musicPulse > 0) {
      const glow = ctx.createRadialGradient(
        this.width / 2,
        this.height * 0.48,
        10,
        this.width / 2,
        this.height * 0.48,
        Math.max(this.width, this.height) * 0.62
      );
      const pulseColor = gameId === 'crab-clap' ? '255, 143, 115' : gameId === 'fugu-puku' ? '222, 239, 126' : '255, 137, 190';
      glow.addColorStop(0, `rgba(${pulseColor}, ${0.075 * musicPulse})`);
      glow.addColorStop(1, `rgba(${pulseColor}, 0)`);
      ctx.fillStyle = glow;
      ctx.fillRect(-10, 0, this.width + 20, this.height);
    }

    ctx.globalAlpha = 0.1;
    for (let i = 0; i < 7; i += 1) {
      const x = ((i * 173 + timeMs * 0.008) % (this.width + 220)) - 110;
      ctx.beginPath();
      ctx.ellipse(x, this.height * 0.2, 22, this.height * 0.85, -0.3, 0, Math.PI * 2);
      ctx.fillStyle = gameId === 'fugu-puku' ? '#b8ffcc' : '#6be4ff';
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (this.bubbles.length === 0) {
      this.bubbles = Array.from({ length: 26 }, (_, index) => ({
        x: (index * 79) % Math.max(1, this.width),
        y: (index * 137) % Math.max(1, this.height),
        radius: 2 + (index % 4),
        speed: 0.012 + (index % 5) * 0.004,
        phase: index * 0.9
      }));
    }

    ctx.strokeStyle = 'rgba(195, 246, 255, 0.26)';
    ctx.lineWidth = 1.2;
    for (const bubble of this.bubbles) {
      const y = (bubble.y - timeMs * bubble.speed + this.height * 4) % (this.height + 40) - 20;
      const x = bubble.x + Math.sin(timeMs / 800 + bubble.phase) * 12;
      ctx.beginPath();
      ctx.arc(x, y, bubble.radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(4, 18, 35, 0.48)';
    ctx.beginPath();
    ctx.moveTo(-10, this.height);
    for (let x = -10; x <= this.width + 10; x += 28) {
      const y = this.height - 34 - Math.sin(x * 0.035) * 10;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(this.width + 10, this.height);
    ctx.closePath();
    ctx.fill();

    if (missPulse > 0) {
      ctx.fillStyle = `rgba(255, 76, 112, ${0.12 * missPulse})`;
      ctx.fillRect(-10, 0, this.width + 20, this.height);
    }
  }

  private drawCharacter(
    gameId: GameId,
    x: number,
    y: number,
    scale: number,
    timeMs: number,
    hitPulse: number,
    missPulse: number,
    cuePulse: number
  ): void {
    if (gameId === 'crab-clap') {
      this.drawCrab(x, y + 28, scale, timeMs, hitPulse, missPulse, cuePulse);
      return;
    }
    if (gameId === 'fugu-puku') {
      this.drawFugu(x, y, scale, timeMs, hitPulse, missPulse, cuePulse);
      return;
    }
    this.drawMendako(x, y, scale, timeMs, hitPulse, missPulse);
  }

  private drawMendako(
    x: number,
    y: number,
    scale: number,
    timeMs: number,
    hitPulse: number,
    missPulse: number
  ): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    const bodyGradient = ctx.createRadialGradient(-28, -38, 10, 0, 0, 100);
    bodyGradient.addColorStop(0, '#ffd8ea');
    bodyGradient.addColorStop(0.55, '#ff86b9');
    bodyGradient.addColorStop(1, '#e94e91');
    ctx.fillStyle = bodyGradient;
    ctx.shadowColor = 'rgba(255, 120, 188, 0.46)';
    ctx.shadowBlur = 26 + hitPulse * 18;

    ctx.beginPath();
    ctx.moveTo(-88, 22);
    ctx.bezierCurveTo(-92, -48, -58, -92, 0, -96);
    ctx.bezierCurveTo(58, -92, 92, -48, 88, 22);
    ctx.bezierCurveTo(73, 46, 57, 54, 42, 39);
    ctx.bezierCurveTo(25, 61, 10, 62, 0, 42);
    ctx.bezierCurveTo(-12, 63, -30, 60, -43, 39);
    ctx.bezierCurveTo(-62, 55, -78, 45, -88, 22);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ffb4d4';
    ctx.beginPath();
    ctx.ellipse(-66, -38, 34, 20, -0.55, 0, Math.PI * 2);
    ctx.ellipse(66, -38, 34, 20, 0.55, 0, Math.PI * 2);
    ctx.fill();

    this.drawFace(timeMs, hitPulse, missPulse, '#17223e', '#a92d70');

    ctx.globalAlpha = 0.28;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(-32, -58, 25, 12, -0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawFace(timeMs: number, hitPulse: number, missPulse: number, eyeColor: string, mouthColor: string): void {
    const ctx = this.ctx;
    ctx.fillStyle = eyeColor;
    if (hitPulse > 0.15) {
      ctx.lineWidth = 5;
      ctx.strokeStyle = eyeColor;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(-28, -18, 9, Math.PI * 0.1, Math.PI * 0.9);
      ctx.arc(28, -18, 9, Math.PI * 0.1, Math.PI * 0.9);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(-28, -20, 8, 0, Math.PI * 2);
      ctx.arc(28, -20, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-25, -23, 2.6, 0, Math.PI * 2);
      ctx.arc(31, -23, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = mouthColor;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (missPulse > 0.1) {
      ctx.arc(0, 10, 13, Math.PI * 1.1, Math.PI * 1.9);
    } else {
      const smile = 3 + Math.sin(timeMs / 450) * 1.5;
      ctx.arc(0, -2, 15, smile * 0.02, Math.PI - smile * 0.02);
    }
    ctx.stroke();
  }

  private drawCrab(
    x: number,
    y: number,
    scale: number,
    timeMs: number,
    hitPulse: number,
    missPulse: number,
    cuePulse: number
  ): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    const sway = Math.sin(timeMs / 500) * 3;
    ctx.translate(0, sway);

    ctx.strokeStyle = '#e65c62';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.moveTo(side * (36 + i * 10), 26 + i * 10);
        ctx.lineTo(side * (76 + i * 15), 44 + i * 9);
        ctx.stroke();
      }
    }

    const clawOpen = 0.22 + cuePulse * 0.45 + hitPulse * 0.5;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(side * 78, -18);
      ctx.rotate(side * (0.2 + cuePulse * 0.08));
      ctx.fillStyle = '#ff7d7f';
      ctx.shadowColor = 'rgba(255, 113, 113, .38)';
      ctx.shadowBlur = 18 + hitPulse * 16;
      ctx.beginPath();
      ctx.ellipse(0, 0, 29, 25, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#071c2f';
      ctx.beginPath();
      ctx.moveTo(side * -2, -3);
      ctx.lineTo(side * 32, -20 - clawOpen * 16);
      ctx.lineTo(side * 22, 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    const body = ctx.createRadialGradient(-20, -32, 8, 0, 0, 90);
    body.addColorStop(0, '#ffc0a4');
    body.addColorStop(0.55, '#ff7d7f');
    body.addColorStop(1, '#df4f62');
    ctx.fillStyle = body;
    ctx.shadowColor = 'rgba(255, 99, 108, .38)';
    ctx.shadowBlur = 24 + hitPulse * 16;
    ctx.beginPath();
    ctx.ellipse(0, 0, 75, 62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = '#e85d68';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(-32, -48);
    ctx.lineTo(-38, -78);
    ctx.moveTo(32, -48);
    ctx.lineTo(38, -78);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-38, -82, 14, 0, Math.PI * 2);
    ctx.arc(38, -82, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#18233b';
    ctx.beginPath();
    ctx.arc(-36, -82, 6, 0, Math.PI * 2);
    ctx.arc(36, -82, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#9b3445';
    ctx.lineWidth = 4;
    ctx.beginPath();
    if (missPulse > 0.1) {
      ctx.arc(0, 23, 14, Math.PI * 1.12, Math.PI * 1.88);
    } else {
      ctx.arc(0, 8, 16, 0.15, Math.PI - 0.15);
    }
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,.25)';
    ctx.beginPath();
    ctx.ellipse(-24, -24, 24, 12, -0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawFugu(
    x: number,
    y: number,
    scale: number,
    timeMs: number,
    hitPulse: number,
    missPulse: number,
    cuePulse: number
  ): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    const inflate = 1 + cuePulse * 0.07 + hitPulse * 0.13;
    ctx.scale(scale * inflate, scale * inflate);
    ctx.rotate(Math.sin(timeMs / 700) * 0.025);

    ctx.strokeStyle = '#d6da83';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    for (let i = 0; i < 16; i += 1) {
      const angle = (Math.PI * 2 * i) / 16;
      const r1 = 72;
      const r2 = 90 + cuePulse * 8;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * r1, Math.sin(angle) * r1);
      ctx.lineTo(Math.cos(angle) * r2, Math.sin(angle) * r2);
      ctx.stroke();
    }

    ctx.fillStyle = '#aebc57';
    ctx.beginPath();
    ctx.moveTo(70, 0);
    ctx.lineTo(112, -28);
    ctx.lineTo(108, 30);
    ctx.closePath();
    ctx.fill();

    const body = ctx.createRadialGradient(-24, -32, 6, 0, 0, 85);
    body.addColorStop(0, '#f5f0a4');
    body.addColorStop(0.58, '#d8dc72');
    body.addColorStop(1, '#9caf4f');
    ctx.fillStyle = body;
    ctx.shadowColor = 'rgba(216, 233, 108, .38)';
    ctx.shadowBlur = 24 + hitPulse * 15;
    ctx.beginPath();
    ctx.arc(0, 0, 76, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#17253d';
    ctx.beginPath();
    ctx.arc(-27, -18, 8, 0, Math.PI * 2);
    ctx.arc(27, -18, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-24, -21, 2.6, 0, Math.PI * 2);
    ctx.arc(30, -21, 2.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#66743e';
    ctx.lineWidth = 4;
    ctx.beginPath();
    if (missPulse > 0.1) {
      ctx.arc(0, 18, 11, Math.PI * 1.12, Math.PI * 1.88);
    } else if (hitPulse > 0.1) {
      ctx.arc(0, 8, 13, 0.1, Math.PI - 0.1);
    } else {
      ctx.arc(0, 5, 8 + cuePulse * 5, 0, Math.PI * 2);
    }
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,.25)';
    ctx.beginPath();
    ctx.ellipse(-28, -43, 25, 12, -0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawBeatGuide(targets: readonly TargetState[], beat: number, gameId: GameId): void {
    const ctx = this.ctx;
    const centerX = this.width / 2;
    const centerY = gameId === 'crab-clap' ? this.height * 0.56 : this.height * 0.53;

    for (const target of targets) {
      if (target.judge) continue;
      const until = target.beat - beat;
      if (until < -0.2 || until > 1.15) continue;

      const progress = Math.min(1, Math.max(0, 1 - until));
      const radius = 142 - progress * 88;
      const alpha = 0.24 + progress * 0.76;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = gameId === 'fugu-puku' ? '#e9f79b' : gameId === 'crab-clap' ? '#ffd0ae' : '#fff0a8';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  private drawJudgeText(judge: Judge | undefined, ageMs: number): void {
    if (!judge || ageMs > 620) return;
    const ctx = this.ctx;
    const alpha = Math.max(0, 1 - ageMs / 620);
    const rise = Math.min(16, ageMs * 0.028);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = '900 34px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = judge === 'MISS' ? '#ff819c' : judge === 'PERFECT' ? '#fff5ae' : '#d7f7ff';
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 9;
    ctx.fillText(judge, this.width / 2, this.height * 0.25 - rise);
    ctx.restore();
  }

  private drawCountIn(beat: number): void {
    if (beat < 0 || beat >= 4) return;
    const count = Math.floor(beat) + 1;
    const phase = beat - Math.floor(beat);
    const ctx = this.ctx;
    ctx.save();
    ctx.font = `900 ${50 + (1 - phase) * 10}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.9 - phase * 0.25;
    ctx.fillText(String(count), this.width / 2, this.height * 0.18);
    ctx.restore();
  }

  private drawCueLabel(gameId: GameId, cuePulse: number): void {
    if (cuePulse <= 0) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = Math.min(1, cuePulse * 1.5);
    ctx.font = '900 19px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#dffbff';
    const label = gameId === 'crab-clap' ? 'おてほん ♪' : gameId === 'fugu-puku' ? 'ぷく ♪' : 'きいて ♪';
    ctx.fillText(label, this.width / 2, this.height * 0.34);
    ctx.restore();
  }

  private getCuePulse(beat: number, cues: readonly number[]): number {
    let best = Number.POSITIVE_INFINITY;
    for (const cue of cues) best = Math.min(best, Math.abs(beat - cue));
    return best < 0.18 ? 1 - best / 0.18 : 0;
  }

  private spawnParticles(timeMs: number, gameId: GameId): void {
    const hue = gameId === 'crab-clap' ? 18 : gameId === 'fugu-puku' ? 72 : 328;
    for (let i = 0; i < 18; i += 1) {
      const angle = (Math.PI * 2 * i) / 18 + Math.random() * 0.18;
      const speed = 0.045 + Math.random() * 0.08;
      this.particles.push({
        x: this.width / 2,
        y: this.height * 0.5,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.025,
        bornAt: timeMs,
        lifeMs: 520 + Math.random() * 280,
        radius: 2.5 + Math.random() * 4,
        hue: hue + Math.random() * 24 - 12
      });
    }
  }

  private drawParticles(timeMs: number): void {
    const ctx = this.ctx;
    this.particles = this.particles.filter((particle) => timeMs - particle.bornAt < particle.lifeMs);
    for (const particle of this.particles) {
      const age = timeMs - particle.bornAt;
      const alpha = Math.max(0, 1 - age / particle.lifeMs);
      const x = particle.x + particle.vx * age;
      const y = particle.y + particle.vy * age + 0.000055 * age * age;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = `hsl(${particle.hue} 92% 76%)`;
      ctx.beginPath();
      ctx.arc(x, y, particle.radius * (0.7 + alpha * 0.5), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
