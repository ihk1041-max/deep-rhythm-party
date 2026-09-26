import { AudioEngine } from './audio.js';
import { GAME_ORDER, getGameDefinition } from './games.js';
import { GameRenderer } from './renderer.js';
import { RhythmGame } from './rhythm.js';
import { SaveStore } from './settings.js';
import type { AppMode, Difficulty, GameId, GameResult, Judge, RenderState } from './types.js';

const byId = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing element #${id}`);
  return element as T;
};

const isGameId = (value: string | undefined): value is GameId =>
  value === 'mendako-pop' || value === 'crab-clap' || value === 'fugu-puku';

class App {
  private readonly audio = new AudioEngine();
  private readonly store = new SaveStore();
  private readonly canvas = byId<HTMLCanvasElement>('game-canvas');
  private readonly renderer = new GameRenderer(this.canvas);
  private game: RhythmGame | null = null;
  private mode: AppMode = 'title';
  private selectedGameId: GameId = 'mendako-pop';
  private animationFrame = 0;

  private readonly titlePanel = byId<HTMLElement>('title-panel');
  private readonly selectPanel = byId<HTMLElement>('select-panel');
  private readonly gamePanel = byId<HTMLElement>('game-panel');
  private readonly resultPanel = byId<HTMLElement>('result-panel');
  private readonly settingsPanel = byId<HTMLElement>('settings-panel');
  private readonly statusText = byId<HTMLElement>('status-text');
  private readonly comboText = byId<HTMLElement>('combo-text');
  private readonly progressBar = byId<HTMLElement>('progress-bar');

  constructor() {
    this.bindEvents();
    this.populateSettings();
    this.refreshSummary();
    this.refreshStageCards();
    this.switchMode('title');
    this.loop(performance.now());
    this.registerServiceWorker();
  }

  private bindEvents(): void {
    byId<HTMLButtonElement>('play-button').addEventListener('click', () => {
      this.refreshStageCards();
      this.switchMode('select');
    });
    byId<HTMLButtonElement>('settings-button').addEventListener('click', () => this.switchMode('settings'));
    byId<HTMLButtonElement>('select-back-button').addEventListener('click', () => this.switchMode('title'));
    byId<HTMLButtonElement>('settings-back-button').addEventListener('click', () => this.switchMode('title'));
    byId<HTMLButtonElement>('retry-button').addEventListener('click', () => void this.startGame(this.selectedGameId));
    byId<HTMLButtonElement>('result-select-button').addEventListener('click', () => {
      this.refreshStageCards();
      this.switchMode('select');
    });

    document.querySelectorAll<HTMLButtonElement>('[data-game-id]').forEach((button) => {
      button.addEventListener('click', () => {
        const gameId = button.dataset.gameId;
        if (!isGameId(gameId) || !this.store.isUnlocked(gameId)) return;
        this.selectedGameId = gameId;
        void this.startGame(gameId);
      });
    });

    this.canvas.addEventListener('pointerdown', (event) => {
      if (this.mode !== 'game') return;
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
        this.refreshStageCards();
        this.switchMode('select');
      }
    });
  }

  private async startGame(gameId: GameId): Promise<void> {
    if (!this.store.isUnlocked(gameId)) return;

    try {
      await this.audio.unlock();
      const settings = this.store.settings;
      const definition = getGameDefinition(gameId);
      this.selectedGameId = gameId;
      this.audio.setVolume(settings.masterVolume);

      this.game?.stop();
      this.statusText.textContent = 'リズムに合わせてタップ！';
      this.comboText.textContent = 'COMBO 0';
      this.progressBar.style.transform = 'scaleX(0)';
      byId<HTMLElement>('game-stage-label').textContent = `STAGE ${String(definition.stage).padStart(2, '0')}`;
      byId<HTMLElement>('game-title').textContent = definition.title;
      byId<HTMLElement>('game-instruction').textContent = definition.instruction;
      this.switchMode('game');

      this.game = new RhythmGame({
        audio: this.audio,
        definition,
        difficulty: settings.difficulty,
        audioOffsetMs: settings.audioOffsetMs,
        onHud: (combo, progress) => {
          this.comboText.textContent = `COMBO ${combo}`;
          this.progressBar.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;
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
    const outcome = this.store.recordResult(result);
    this.renderResult(result, outcome.newHighScore, outcome.unlockedGameId);
    this.refreshSummary();
    this.refreshStageCards();
    this.game = null;
    window.setTimeout(() => this.switchMode('result'), 220);
  }

  private renderResult(result: GameResult, newHighScore: boolean, unlockedGameId: GameId | null): void {
    const definition = getGameDefinition(result.gameId);
    byId<HTMLElement>('result-game-title').textContent = definition.title;
    byId<HTMLElement>('result-score').textContent = String(result.score);
    byId<HTMLElement>('result-stars').textContent = '★'.repeat(result.stars) + '☆'.repeat(3 - result.stars);
    byId<HTMLElement>('result-perfect').textContent = String(result.counts.PERFECT);
    byId<HTMLElement>('result-great').textContent = String(result.counts.GREAT);
    byId<HTMLElement>('result-good').textContent = String(result.counts.GOOD);
    byId<HTMLElement>('result-miss').textContent = String(result.counts.MISS);
    byId<HTMLElement>('result-combo').textContent = String(result.maxCombo);

    const badge = byId<HTMLElement>('result-badge');
    if (unlockedGameId) {
      badge.textContent = `NEW! ${getGameDefinition(unlockedGameId).title} 解放`;
      badge.hidden = false;
    } else if (newHighScore) {
      badge.textContent = 'NEW HIGH SCORE!';
      badge.hidden = false;
    } else {
      badge.hidden = true;
    }

    const message = result.score >= 90
      ? 'すごい！ノリノリ！'
      : result.score >= 65
        ? 'いいリズム！もう一回！'
        : result.score >= 45
          ? 'いい感じ！あと少し！'
          : 'リズムを覚えて再挑戦！';
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

  private refreshSummary(): void {
    const save = this.store.snapshot;
    byId<HTMLElement>('total-stars').textContent = `${this.store.totalStars} / 9`;
    byId<HTMLElement>('total-plays').textContent = String(save.totalPlays);
  }

  private refreshStageCards(): void {
    for (const gameId of GAME_ORDER) {
      const card = document.querySelector<HTMLButtonElement>(`[data-game-id="${gameId}"]`);
      if (!card) continue;
      const record = this.store.getRecord(gameId);
      const unlocked = this.store.isUnlocked(gameId);
      card.disabled = !unlocked;
      card.classList.toggle('locked', !unlocked);

      const score = card.querySelector<HTMLElement>('[data-score]');
      const stars = card.querySelector<HTMLElement>('[data-stars]');
      const lock = card.querySelector<HTMLElement>('[data-lock]');
      if (score) score.textContent = unlocked ? `BEST ${record.highScore}` : 'LOCKED';
      if (stars) stars.textContent = unlocked ? '★'.repeat(record.bestStars) + '☆'.repeat(3 - record.bestStars) : '🔒';
      if (lock) lock.hidden = unlocked;
    }
  }

  private switchMode(mode: AppMode): void {
    this.mode = mode;
    this.titlePanel.hidden = mode !== 'title';
    this.selectPanel.hidden = mode !== 'select';
    this.gamePanel.hidden = mode !== 'game';
    this.resultPanel.hidden = mode !== 'result';
    this.settingsPanel.hidden = mode !== 'settings';
  }

  private loop = (timeMs: number): void => {
    this.game?.update();
    const definition = getGameDefinition(this.selectedGameId);
    const state: RenderState = this.game?.getRenderState(this.mode) ?? {
      mode: this.mode,
      gameId: this.selectedGameId,
      beat: 0,
      targets: [],
      cueBeats: definition.cueBeats,
      lastJudgeAgeMs: Number.POSITIVE_INFINITY,
      combo: 0,
      hitPulse: this.mode === 'result' ? 0.08 : 0,
      missPulse: 0
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
