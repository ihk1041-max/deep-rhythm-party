import type { RenderState, TargetState } from './types.js';

interface Bubble {
  x: number;
  y: number;
  radius: number;
  speed: number;
  phase: number;
}

export class GameRenderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private bubbles: Bubble[] = [];
  private width = 0;
  private height = 0;
  private dpr = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D context is not available');
    this.ctx = context;
    this.resize();
    window.addEventListener('resize', () => this.resize(), { passive: true });
  }

  render(state: RenderState | null, timeMs: number): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.drawBackground(timeMs);

    const mode = state?.mode ?? 'title';
    const beat = state?.beat ?? 0;
    const hitPulse = state?.hitPulse ?? 0;

    if (mode === 'game' && state) {
      this.drawBeatGuide(state.targets, beat);
    }

    const idleWave = Math.sin(timeMs / 650) * 4;
    const beatBounce = mode === 'game' ? Math.max(0, Math.sin(beat * Math.PI)) * 3 : 0;
    const hitBounce = hitPulse * 24;
    this.drawMendako(this.width / 2, this.height * 0.53 + idleWave - beatBounce - hitBounce, 1 + hitPulse * 0.09, timeMs);

    if (mode === 'game' && state) {
      this.drawJudgeText(state);
      this.drawCountIn(beat);
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
  }

  private drawBackground(timeMs: number): void {
    const ctx = this.ctx;
    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#05162f');
    gradient.addColorStop(0.45, '#08375a');
    gradient.addColorStop(1, '#071325');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.globalAlpha = 0.12;
    for (let i = 0; i < 7; i += 1) {
      const x = ((i * 173 + timeMs * 0.008) % (this.width + 220)) - 110;
      ctx.beginPath();
      ctx.ellipse(x, this.height * 0.2, 22, this.height * 0.85, -0.3, 0, Math.PI * 2);
      ctx.fillStyle = '#6be4ff';
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (this.bubbles.length === 0) {
      this.bubbles = Array.from({ length: 24 }, (_, index) => ({
        x: (index * 79) % Math.max(1, this.width),
        y: (index * 137) % Math.max(1, this.height),
        radius: 2 + (index % 4),
        speed: 0.012 + (index % 5) * 0.004,
        phase: index * 0.9
      }));
    }

    ctx.strokeStyle = 'rgba(190, 244, 255, 0.25)';
    ctx.lineWidth = 1.2;
    for (const bubble of this.bubbles) {
      const y = (bubble.y - timeMs * bubble.speed + this.height * 4) % (this.height + 40) - 20;
      const x = bubble.x + Math.sin(timeMs / 800 + bubble.phase) * 12;
      ctx.beginPath();
      ctx.arc(x, y, bubble.radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(4, 18, 35, 0.45)';
    ctx.beginPath();
    ctx.moveTo(0, this.height);
    for (let x = 0; x <= this.width; x += 28) {
      const y = this.height - 34 - Math.sin(x * 0.035) * 10;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(this.width, this.height);
    ctx.closePath();
    ctx.fill();
  }

  private drawMendako(x: number, y: number, scale: number, timeMs: number): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    const bodyGradient = ctx.createRadialGradient(-28, -38, 10, 0, 0, 100);
    bodyGradient.addColorStop(0, '#ffd1e7');
    bodyGradient.addColorStop(0.55, '#ff83b7');
    bodyGradient.addColorStop(1, '#e94e91');
    ctx.fillStyle = bodyGradient;
    ctx.shadowColor = 'rgba(255, 120, 188, 0.45)';
    ctx.shadowBlur = 24;

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

    ctx.fillStyle = '#17223e';
    ctx.beginPath();
    ctx.arc(-28, -20, 8, 0, Math.PI * 2);
    ctx.arc(28, -20, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-25, -23, 2.6, 0, Math.PI * 2);
    ctx.arc(31, -23, 2.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#a92d70';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const smile = 3 + Math.sin(timeMs / 450) * 1.5;
    ctx.arc(0, -2, 15, smile * 0.02, Math.PI - smile * 0.02);
    ctx.stroke();

    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(-32, -58, 25, 12, -0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawBeatGuide(targets: readonly TargetState[], beat: number): void {
    const ctx = this.ctx;
    const centerX = this.width / 2;
    const centerY = this.height * 0.53;

    for (const target of targets) {
      if (target.judge) continue;
      const until = target.beat - beat;
      if (until < -0.2 || until > 1.15) continue;

      const progress = Math.min(1, Math.max(0, 1 - until));
      const radius = 140 - progress * 88;
      const alpha = 0.25 + progress * 0.75;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#fff0a8';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  private drawJudgeText(state: RenderState): void {
    if (!state.lastJudge || state.lastJudgeAgeMs > 550) return;
    const ctx = this.ctx;
    const alpha = Math.max(0, 1 - state.lastJudgeAgeMs / 550);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = '900 34px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = state.lastJudge === 'MISS' ? '#ff819c' : '#fff5ae';
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 8;
    ctx.fillText(state.lastJudge, this.width / 2, this.height * 0.25);
    ctx.restore();
  }

  private drawCountIn(beat: number): void {
    if (beat < 0 || beat >= 4) return;
    const count = Math.floor(beat) + 1;
    const ctx = this.ctx;
    ctx.save();
    ctx.font = '900 48px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.85;
    ctx.fillText(String(count), this.width / 2, this.height * 0.18);
    ctx.restore();
  }
}
