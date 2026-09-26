import { AudioEngine } from './audio.js';
import { GameRenderer } from './renderer.js';
import { RhythmGame } from './rhythm.js';
import { SaveStore } from './settings.js';
import type { Difficulty, GameResult, Judge, RenderState } from './types.js';

const byId = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing element #${id}`);
  return element as T;
};

class App {
  private readonly audio = new AudioEngine();
  private readonly store = new SaveStore();
  private readonly canvas = byId<HTMLCanvasElement>('game-canvas');
  private readonly renderer = new GameRenderer(this.canvas);
  private game: RhythmGame | null = null;
  private mode: RenderState['mode'] = 'title';
  private lastResult: GameResult | null = null;
  private animationFrame = 0;

  private readonly titlePanel = byId<HTMLElement>('title-panel');
  private readonly gamePanel = byId<HTMLElement>('game-panel');
  private readonly resultPanel = byId<HTMLElement>('result-panel');
  private readonly settingsPanel = byId<HTMLElement>('settings-panel');
  private readonly statusText = byId<HTMLElement>('status-text');
  private readonly comboText = byId<HTMLElement>('combo-text');
  private readonly progressBar = byId<HTMLElement>('progress-bar');

  constructor() {
    this.bindEvents();
    this.populateSettings();
    this.refreshTitleStats();
    this.switchMode('title');
    this.loop(performance.now());
    this.registerServiceWorker();
  }

  private bindEvents(): void {
    byId<HTMLButtonElement>('play-button').addEventListener('click', () => void this.startGame());
    byId<HTMLButtonElement>('settings-button').addEventListener('click', () => this.switchMode('settings'));
    byId<HTMLButtonElement>('settings-back-button').addEventListener('click', () => this.switchMode('title'));
    byId<HTMLButtonElement>('retry-button').addEventListener('click', () => void this.startGame());
    byId<HTMLButtonElement>('result-title-button').addEventListener('click', () => this.switchMode('title'));

    this.canvas.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      this.game?.tap();
    });

    window.addEventListener('keydown', (event) => {
      if (event.code === 'Space' && this.mode === 'game') {
        event.preventDefault();
        this.game?.tap();
      }
    });

    const difficulty = byId<HTMLSelectElement>('difficulty-select');
    const offset = byId<HTMLInputElement>('offset-range');
    const volume = byId<HTMLInputElement>('volume-range');

    difficulty.addEventListener('change', () => {
      this.store.updateSettings({ difficulty: difficulty.value as Difficulty });
    });

    offset.addEventListener('input', () => {
      const value = Number(offset.value);
      byId<HTMLElement>('offset-value').textContent = `${value > 0 ? '+' : ''}${value} ms`;
      this.store.updateSettings({ audioOffsetMs: value });
    });

    volume.addEventListener('input', () => {
      const value = Number(volume.value) / 100;
      byId<HTMLElement>('volume-value').textContent = `${Math.round(value * 100)}%`;
      this.store.updateSettings({ masterVolume: value });
      this.audio.setVolume(value);
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.mode === 'game') {
        this.game?.stop();
        this.game = null;
        this.statusText.textContent = '中断しました。もう一度スタートしてください';
        this.switchMode('title');
      }
    });
  }

  private async startGame(): Promise<void> {
    try {
      await this.audio.unlock();
      const settings = this.store.settings;
      this.audio.setVolume(settings.masterVolume);

      this.game?.stop();
      this.statusText.textContent = '音に合わせて画面をタップ！';
      this.comboText.textContent = 'COMBO 0';
      this.progressBar.style.transform = 'scaleX(0)';
      this.switchMode('game');

      this.game = new RhythmGame({
        audio: this.audio,
        difficulty: settings.difficulty,
        audioOffsetMs: settings.audioOffsetMs,
        onHud: (combo, progress) => {
          this.comboText.textContent = `COMBO ${combo}`;
          this.progressBar.style.transform = `scaleX(${progress})`;
        },
        onJudge: (judge, deltaMs) => this.handleJudge(judge, deltaMs),
        onFinish: (result) => this.finishGame(result)
      });

      this.game.start();
    } catch (error) {
      console.error(error);
      this.statusText.textContent = '音声を開始できませんでした。ブラウザの音声設定を確認してください。';
    }
  }

  private handleJudge(judge: Judge, deltaMs?: number): void {
    if (judge === 'MISS') {
      this.statusText.textContent = 'MISS';
      return;
    }

    const signed = deltaMs === undefined ? '' : ` ${deltaMs > 0 ? '+' : ''}${deltaMs}ms`;
    this.statusText.textContent = `${judge}${signed}`;
  }

  private finishGame(result: GameResult): void {
    this.lastResult = result;
    this.store.recordResult(result.score, result.maxCombo);
    this.renderResult(result);
    this.refreshTitleStats();
    window.setTimeout(() => this.switchMode('result'), 250);
  }

  private renderResult(result: GameResult): void {
    byId<HTMLElement>('result-score').textContent = String(result.score);
    byId<HTMLElement>('result-stars').textContent = '★'.repeat(result.stars) + '☆'.repeat(3 - result.stars);
    byId<HTMLElement>('result-perfect').textContent = String(result.counts.PERFECT);
    byId<HTMLElement>('result-great').textContent = String(result.counts.GREAT);
    byId<HTMLElement>('result-good').textContent = String(result.counts.GOOD);
    byId<HTMLElement>('result-miss').textContent = String(result.counts.MISS);
    byId<HTMLElement>('result-combo').textContent = String(result.maxCombo);

    const message = result.score >= 90 ? 'すごい！ノリノリ！' : result.score >= 65 ? 'いいリズム！もう一回！' : 'だんだん合ってきた！';
    byId<HTMLElement>('result-message').textContent = message;
  }

  private populateSettings(): void {
    const settings = this.store.settings;
    const difficulty = byId<HTMLSelectElement>('difficulty-select');
    const offset = byId<HTMLInputElement>('offset-range');
    const volume = byId<HTMLInputElement>('volume-range');

    difficulty.value = settings.difficulty;
    offset.value = String(settings.audioOffsetMs);
    volume.value = String(Math.round(settings.masterVolume * 100));
    byId<HTMLElement>('offset-value').textContent = `${settings.audioOffsetMs > 0 ? '+' : ''}${settings.audioOffsetMs} ms`;
    byId<HTMLElement>('volume-value').textContent = `${Math.round(settings.masterVolume * 100)}%`;
  }

  private refreshTitleStats(): void {
    const save = this.store.snapshot;
    byId<HTMLElement>('high-score').textContent = String(save.highScore);
    byId<HTMLElement>('best-combo').textContent = String(save.bestCombo);
  }

  private switchMode(mode: RenderState['mode']): void {
    this.mode = mode;
    this.titlePanel.hidden = mode !== 'title';
    this.gamePanel.hidden = mode !== 'game';
    this.resultPanel.hidden = mode !== 'result';
    this.settingsPanel.hidden = mode !== 'settings';
  }

  private loop = (timeMs: number): void => {
    this.game?.update();
    const state = this.game?.getRenderState(this.mode) ?? {
      mode: this.mode,
      beat: 0,
      targets: [],
      lastJudgeAgeMs: Number.POSITIVE_INFINITY,
      combo: 0,
      hitPulse: this.lastResult && this.mode === 'result' ? 0.15 : 0
    };
    this.renderer.render(state, timeMs);
    this.animationFrame = requestAnimationFrame(this.loop);
  };

  private registerServiceWorker(): void {
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch((error) => {
        console.warn('Service worker registration failed:', error);
      });
    });
  }
}

new App();
