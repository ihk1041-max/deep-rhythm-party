import { AudioEngine } from './audio.js';
import { GAME_ORDER, getGameDefinition, getReviewLines, getSceneForBeat, getSectionLabel } from './games.js';
import { GameRenderer } from './renderer.js';
import { RhythmGame } from './rhythm.js';
import { SaveStore } from './settings.js';
import type { AppMode, Difficulty, GameId, GameResult, InputAction, Judge, RenderState, SceneKind } from './types.js';

const byId = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing element #${id}`);
  return element as T;
};

const isGameId = (value: string | undefined): value is GameId =>
  typeof value === 'string' && (GAME_ORDER as readonly string[]).includes(value);

const TITLE_SCENES: readonly SceneKind[] = ['bakery','space','frog','bedroom','penguin','robot','moon','chorus','mole','dance','conference','ninja'];

class App {
  private readonly audio = new AudioEngine();
  private readonly store = new SaveStore();
  private readonly canvas = byId<HTMLCanvasElement>('game-canvas');
  private readonly renderer = new GameRenderer(this.canvas);
  private game: RhythmGame | null = null;
  private mode: AppMode = 'title';
  private selectedGameId: GameId = 'bread-factory';
  private pointerDownAt = 0;
  private pointerDownAction: InputAction = 'press';
  private spaceDownAt = 0;
  private currentPractice = false;
  private practiceRetryCount = 0;

  private readonly titlePanel = byId<HTMLElement>('title-panel');
  private readonly selectPanel = byId<HTMLElement>('select-panel');
  private readonly gamePanel = byId<HTMLElement>('game-panel');
  private readonly resultPanel = byId<HTMLElement>('result-panel');
  private readonly settingsPanel = byId<HTMLElement>('settings-panel');
  private readonly statusText = byId<HTMLElement>('status-text');
  private readonly comboText = byId<HTMLElement>('combo-text');
  private readonly sectionText = byId<HTMLElement>('section-text');
  private readonly progressBar = byId<HTMLElement>('progress-bar');
  private readonly selectMessage = byId<HTMLElement>('select-message');
  private readonly stageList = byId<HTMLElement>('stage-list');

  constructor() {
    this.buildStageCards();
    this.bindEvents();
    this.populateSettings();
    this.refreshSummary();
    this.refreshStageCards();
    this.switchMode('title');
    requestAnimationFrame(this.loop);
    this.registerServiceWorker();
  }

  private buildStageCards(): void {
    this.stageList.textContent = '';
    let lastWorld = 0;
    for (const gameId of GAME_ORDER) {
      const definition = getGameDefinition(gameId);
      if (definition.world !== lastWorld) {
        lastWorld = definition.world;
        const heading = document.createElement('div');
        heading.className = 'world-heading';
        heading.innerHTML = `<span>WORLD ${definition.world}</span><strong>${definition.world === 1 ? '合図・コピー' : definition.world === 2 ? '待ち時間・拍キープ' : 'ボイス・アクション'}</strong>`;
        this.stageList.append(heading);
      }

      const card = document.createElement('button');
      card.type = 'button';
      card.className = `stage-card${definition.isRemix ? ' remix-card' : ''}`;
      card.dataset.gameId = gameId;
      card.style.setProperty('--stage-accent', definition.accent);
      card.innerHTML = `
        <span class="stage-number">${String(definition.stage).padStart(2, '0')}</span>
        <span class="stage-icon">${definition.icon}</span>
        <span class="stage-copy">
          <strong>${definition.title}</strong>
          <small>${definition.shortDescription}</small>
          <em>${definition.controlHint}</em>
        </span>
        <span class="stage-record">
          <strong data-stars>☆☆☆</strong>
          <small data-score>BEST 0</small>
          <small data-bpm>${definition.bpm} BPM</small>
        </span>
        <span class="stage-lock" data-lock hidden>🔒</span>
      `;
      this.stageList.append(card);
    }
  }

  private bindEvents(): void {
    byId<HTMLButtonElement>('start-button').addEventListener('click', () => {
      this.clearSelectMessage();
      this.refreshStageCards();
      this.switchMode('select');
    });
    byId<HTMLButtonElement>('settings-button').addEventListener('click', () => {
      this.populateSettings();
      this.switchMode('settings');
    });
    byId<HTMLButtonElement>('select-back-button').addEventListener('click', () => this.switchMode('title'));
    byId<HTMLButtonElement>('settings-back-button').addEventListener('click', () => {
      this.refreshStageCards();
      this.refreshSummary();
      this.switchMode('title');
    });
    byId<HTMLButtonElement>('game-quit-button').addEventListener('click', () => {
      this.game?.stop();
      this.game = null;
      this.refreshStageCards();
      this.switchMode('select');
    });
    byId<HTMLButtonElement>('retry-button').addEventListener('click', () => { void this.startGame(this.selectedGameId, false); });
    byId<HTMLButtonElement>('result-select-button').addEventListener('click', () => {
      this.refreshStageCards();
      this.switchMode('select');
    });

    this.stageList.addEventListener('click', (event) => {
      const card = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-game-id]');
      if (!card) return;
      const gameId = card.dataset.gameId;
      if (!isGameId(gameId)) return;
      if (!this.store.isUnlocked(gameId)) {
        this.showLockedMessage(gameId, card);
        return;
      }
      this.clearSelectMessage();
      void this.startGame(gameId, true);
    });

    this.canvas.addEventListener('pointerdown', (event) => {
      if (this.mode !== 'game' || !this.game) return;
      event.preventDefault();
      this.pointerDownAt = performance.now();
      this.canvas.setPointerCapture(event.pointerId);
      const definition = getGameDefinition(this.selectedGameId);
      if (definition.inputMode === 'split') {
        const rect = this.canvas.getBoundingClientRect();
        const action: InputAction = event.clientX < rect.left + rect.width / 2 ? 'left' : 'right';
        this.pointerDownAction = action;
        this.game.input(action);
      } else if (definition.inputMode === 'mixed') {
        const expected = this.game.getExpectedAction();
        if (expected === 'left' || expected === 'right') {
          const rect = this.canvas.getBoundingClientRect();
          const action: InputAction = event.clientX < rect.left + rect.width / 2 ? 'left' : 'right';
          this.pointerDownAction = action;
          this.game.input(action);
        } else {
          this.pointerDownAction = 'press';
          this.game.input('press');
        }
      } else {
        this.pointerDownAction = 'press';
        this.game.input('press');
      }
    });

    this.canvas.addEventListener('pointerup', (event) => {
      if (this.mode !== 'game' || !this.game) return;
      event.preventDefault();
      const definition = getGameDefinition(this.selectedGameId);
      const heldMs = performance.now() - this.pointerDownAt;
      if (this.pointerDownAction === 'press' && (definition.inputMode === 'hold' || (definition.inputMode === 'mixed' && heldMs >= 180))) {
        this.game.input('release');
      }
    });

    window.addEventListener('keydown', (event) => {
      if (this.mode !== 'game' || !this.game || event.repeat) return;
      const definition = getGameDefinition(this.selectedGameId);
      if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
        event.preventDefault(); this.game.input('left'); return;
      }
      if (event.code === 'ArrowRight' || event.code === 'KeyD') {
        event.preventDefault(); this.game.input('right'); return;
      }
      if (event.code === 'Space' || event.code === 'Enter') {
        event.preventDefault();
        this.spaceDownAt = performance.now();
        if (definition.inputMode === 'split') this.game.input('left');
        else this.game.input('press');
      }
    });

    window.addEventListener('keyup', (event) => {
      if (this.mode !== 'game' || !this.game) return;
      if (event.code !== 'Space' && event.code !== 'Enter') return;
      const definition = getGameDefinition(this.selectedGameId);
      const heldMs = performance.now() - this.spaceDownAt;
      if (definition.inputMode === 'hold' || (definition.inputMode === 'mixed' && heldMs >= 180)) {
        event.preventDefault(); this.game.input('release');
      }
    });

    const difficulty = byId<HTMLSelectElement>('difficulty-select');
    const offset = byId<HTMLInputElement>('offset-range');
    const music = byId<HTMLInputElement>('music-range');
    const sfx = byId<HTMLInputElement>('sfx-range');
    const haptics = byId<HTMLInputElement>('haptics-toggle');
    const autoPractice = byId<HTMLInputElement>('practice-toggle');
    const externalMusic = byId<HTMLInputElement>('external-music-toggle');
    const freeSelect = byId<HTMLInputElement>('free-select-toggle');
    const showHud = byId<HTMLInputElement>('hud-toggle');
    const showLiveJudgement = byId<HTMLInputElement>('judgement-toggle');

    difficulty.addEventListener('change', () => {
      this.store.updateSettings({ difficulty: difficulty.value as Difficulty });
    });
    offset.addEventListener('input', () => {
      const value = Number(offset.value);
      this.store.updateSettings({ audioOffsetMs: value });
      byId<HTMLElement>('offset-value').textContent = `${value > 0 ? '+' : ''}${value} ms`;
    });
    const updateVolumes = () => {
      const musicValue = Number(music.value) / 100;
      const sfxValue = Number(sfx.value) / 100;
      this.store.updateSettings({ musicVolume: musicValue, sfxVolume: sfxValue });
      this.audio.setVolumes(musicValue, sfxValue);
      byId<HTMLElement>('music-value').textContent = `${Math.round(musicValue * 100)}%`;
      byId<HTMLElement>('sfx-value').textContent = `${Math.round(sfxValue * 100)}%`;
    };
    music.addEventListener('input', updateVolumes);
    sfx.addEventListener('input', updateVolumes);
    haptics.addEventListener('change', () => {
      this.store.updateSettings({ haptics: haptics.checked });
      if (haptics.checked) this.vibrate(12);
    });
    autoPractice.addEventListener('change', () => this.store.updateSettings({ autoPractice: autoPractice.checked }));
    externalMusic.addEventListener('change', () => this.store.updateSettings({ externalMusic: externalMusic.checked }));
    freeSelect.addEventListener('change', () => {
      this.store.updateSettings({ freeSelect: freeSelect.checked });
      this.refreshStageCards();
    });
    showHud.addEventListener('change', () => this.store.updateSettings({ showHud: showHud.checked }));
    showLiveJudgement.addEventListener('change', () => this.store.updateSettings({ showLiveJudgement: showLiveJudgement.checked }));

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.mode === 'game') {
        this.game?.stop();
        this.game = null;
        this.refreshStageCards();
        this.switchMode('select');
      }
    });
  }

  private async startGame(gameId: GameId, allowPractice: boolean): Promise<void> {
    if (!this.store.isUnlocked(gameId)) return;
    const firstPlay = this.store.getRecord(gameId).plays === 0;
    const definition = getGameDefinition(gameId);
    const shouldPractice = allowPractice && this.store.settings.autoPractice && firstPlay && !definition.isRemix;
    await this.startSession(gameId, shouldPractice);
  }

  private async startSession(gameId: GameId, practice: boolean): Promise<void> {
    try {
      await this.audio.unlock();
      const settings = this.store.settings;
      const definition = getGameDefinition(gameId);
      this.selectedGameId = gameId;
      this.currentPractice = practice;
      this.audio.setVolumes(settings.musicVolume, settings.sfxVolume);
      const cc0Ready = await this.audio.prepareGame(definition, settings.externalMusic);
      byId<HTMLElement>('latency-info').textContent = `推定Audio出力遅延: 約${this.audio.getEstimatedOutputLatencyMs()} ms`;

      this.game?.stop();
      this.statusText.textContent = practice
        ? `れんしゅう：${definition.controlHint}`
        : settings.showHud
          ? (cc0Ready ? 'CC0楽曲モード · 音を信じて！' : '音とキャラクターの動きをよく聞こう')
          : '';
      this.comboText.textContent = '';
      this.sectionText.textContent = practice ? 'PRACTICE' : 'COUNT IN';
      this.progressBar.style.transform = 'scaleX(0)';
      byId<HTMLElement>('game-stage-label').textContent = `${practice ? 'PRACTICE' : `GAME ${String(definition.stage).padStart(2, '0')}`} · ${definition.bpm} BPM`;
      byId<HTMLElement>('game-title').textContent = practice ? `${definition.title} · れんしゅう` : definition.title;
      byId<HTMLElement>('game-instruction').textContent = practice ? definition.instruction : definition.controlHint;
      byId<HTMLElement>('input-mode-badge').textContent = definition.controlHint;
      this.gamePanel.classList.toggle('immersive', !practice && !settings.showHud);
      this.switchMode('game');

      this.game = new RhythmGame({
        audio: this.audio,
        definition,
        difficulty: settings.difficulty,
        audioOffsetMs: settings.audioOffsetMs,
        externalMusic: settings.externalMusic,
        practice,
        showLiveJudgement: practice || settings.showLiveJudgement,
        onHud: (combo, progress, sectionLabel) => {
          this.comboText.textContent = combo >= 2 ? `COMBO ${combo}` : '';
          this.sectionText.textContent = practice ? 'PRACTICE' : sectionLabel;
          this.progressBar.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;
        },
        onJudge: (judge, deltaMs, stray) => this.handleJudge(judge, deltaMs, stray),
        onFinish: (result) => {
          if (practice) {
            this.game = null;
            if (result.score < 55 && this.practiceRetryCount < 1) {
              this.practiceRetryCount += 1;
              this.statusText.textContent = 'もう一度だけ練習しよう。音の合図を最後まで聞いて！';
              window.setTimeout(() => { void this.startSession(gameId, true); }, 900);
            } else {
              this.practiceRetryCount = 0;
              this.statusText.textContent = 'れんしゅうOK！ 本番へ！';
              window.setTimeout(() => { void this.startSession(gameId, false); }, 650);
            }
          } else {
            this.finishGame(result);
          }
        }
      });
      this.game.start();
    } catch (error) {
      console.error(error);
      this.statusText.textContent = '音声を開始できませんでした。ブラウザの音声設定を確認してください。';
    }
  }

  private handleJudge(judge: Judge, deltaMs?: number, stray = false): void {
    const settings = this.store.settings;
    if (settings.haptics) this.vibrate(judge === 'MISS' ? 22 : judge === 'PERFECT' ? 12 : 8);
    if (!this.currentPractice && !settings.showLiveJudgement) {
      this.statusText.textContent = '';
      return;
    }
    if (judge === 'MISS') {
      this.statusText.textContent = stray ? 'ちがう合図！' : 'MISS';
      return;
    }
    if (judge === 'PERFECT') {
      this.statusText.textContent = 'PERFECT!';
      return;
    }
    const timing = deltaMs === undefined ? '' : deltaMs < -12 ? ' · はやい' : deltaMs > 12 ? ' · おそい' : '';
    this.statusText.textContent = `${judge}${timing}`;
  }

  private finishGame(result: GameResult): void {
    const outcome = this.store.recordResult(result);
    this.renderResult(result, outcome.newHighScore, outcome.unlockedGameId);
    this.refreshSummary();
    this.refreshStageCards();
    this.game = null;
    if (this.store.settings.haptics) this.vibrate(result.score >= 90 ? [18,40,18] : 14);
    window.setTimeout(() => this.switchMode('result'), 240);
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
    byId<HTMLElement>('result-timing').textContent = result.averageAbsOffsetMs > 0 ? `${result.averageAbsOffsetMs} ms` : '—';

    const grade = result.score >= 90 ? 'ノリノリ！' : result.score >= 68 ? 'いい感じ！' : 'もういっかい！';
    byId<HTMLElement>('result-grade').textContent = grade;

    const badge = byId<HTMLElement>('result-badge');
    if (unlockedGameId && !this.store.settings.freeSelect) {
      badge.textContent = `NEW! ${getGameDefinition(unlockedGameId).title} 解放`;
      badge.hidden = false;
    } else if (newHighScore) {
      badge.textContent = 'NEW HIGH SCORE!';
      badge.hidden = false;
    } else {
      badge.hidden = true;
    }

    const reviewLines = getReviewLines(result.gameId, result.score, result.strayMisses, result.averageAbsOffsetMs, result.earlyInputs, result.lateInputs);
    byId<HTMLElement>('result-message').textContent = reviewLines[0] ?? '';
    const reviewList = byId<HTMLElement>('result-review-list');
    reviewList.textContent = '';
    for (const line of reviewLines) {
      const item = document.createElement('li');
      item.textContent = line;
      reviewList.append(item);
    }
  }

  private populateSettings(): void {
    const settings = this.store.settings;
    const difficulty = byId<HTMLSelectElement>('difficulty-select');
    const offset = byId<HTMLInputElement>('offset-range');
    const music = byId<HTMLInputElement>('music-range');
    const sfx = byId<HTMLInputElement>('sfx-range');
    const haptics = byId<HTMLInputElement>('haptics-toggle');
    const autoPractice = byId<HTMLInputElement>('practice-toggle');
    const externalMusic = byId<HTMLInputElement>('external-music-toggle');
    const freeSelect = byId<HTMLInputElement>('free-select-toggle');
    const showHud = byId<HTMLInputElement>('hud-toggle');
    const showLiveJudgement = byId<HTMLInputElement>('judgement-toggle');

    difficulty.value = settings.difficulty;
    offset.value = String(settings.audioOffsetMs);
    music.value = String(Math.round(settings.musicVolume * 100));
    sfx.value = String(Math.round(settings.sfxVolume * 100));
    haptics.checked = settings.haptics;
    autoPractice.checked = settings.autoPractice;
    externalMusic.checked = settings.externalMusic;
    freeSelect.checked = settings.freeSelect;
    showHud.checked = settings.showHud;
    showLiveJudgement.checked = settings.showLiveJudgement;
    byId<HTMLElement>('offset-value').textContent = `${settings.audioOffsetMs > 0 ? '+' : ''}${settings.audioOffsetMs} ms`;
    byId<HTMLElement>('music-value').textContent = `${Math.round(settings.musicVolume * 100)}%`;
    byId<HTMLElement>('sfx-value').textContent = `${Math.round(settings.sfxVolume * 100)}%`;
  }

  private refreshSummary(): void {
    const save = this.store.snapshot;
    byId<HTMLElement>('total-stars').textContent = `${this.store.totalStars} / ${GAME_ORDER.length * 3}`;
    byId<HTMLElement>('total-plays').textContent = String(save.totalPlays);
  }

  private refreshStageCards(): void {
    for (const gameId of GAME_ORDER) {
      const card = this.stageList.querySelector<HTMLButtonElement>(`[data-game-id="${gameId}"]`);
      if (!card) continue;
      const record = this.store.getRecord(gameId);
      const unlocked = this.store.isUnlocked(gameId);
      const score = card.querySelector<HTMLElement>('[data-score]');
      const stars = card.querySelector<HTMLElement>('[data-stars]');
      const lock = card.querySelector<HTMLElement>('[data-lock]');
      card.classList.toggle('locked', !unlocked);
      card.setAttribute('aria-disabled', String(!unlocked));
      if (score) score.textContent = unlocked ? `BEST ${record.highScore}` : 'LOCKED';
      if (stars) stars.textContent = unlocked ? '★'.repeat(record.bestStars) + '☆'.repeat(3 - record.bestStars) : '🔒';
      if (lock) lock.hidden = unlocked;
    }
    byId<HTMLElement>('free-select-note').textContent = this.store.settings.freeSelect
      ? '開発モード：全15ゲームを選択できます。'
      : '前のゲームを1回遊ぶと次が解放されます。';
  }

  private showLockedMessage(gameId: GameId, card: HTMLButtonElement): void {
    const index = GAME_ORDER.indexOf(gameId);
    const previousId = index > 0 ? GAME_ORDER[index - 1] : undefined;
    const title = getGameDefinition(gameId).title;
    const requirement = previousId ? `${getGameDefinition(previousId).title}を1回遊ぶと解放されます。` : 'まだ解放されていません。';
    this.selectMessage.textContent = `${title}：${requirement}`;
    this.selectMessage.hidden = false;
    card.classList.remove('locked-bump');
    void card.offsetWidth;
    card.classList.add('locked-bump');
    window.setTimeout(() => card.classList.remove('locked-bump'), 420);
  }

  private clearSelectMessage(): void {
    this.selectMessage.hidden = true;
    this.selectMessage.textContent = '';
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
    const idleScene = this.mode === 'title'
      ? (TITLE_SCENES[Math.floor(timeMs / 2400) % TITLE_SCENES.length] ?? getSceneForBeat(definition, 0))
      : getSceneForBeat(definition, 0);
    const state: RenderState = this.game?.getRenderState(this.mode) ?? {
      mode: this.mode,
      gameId: this.selectedGameId,
      scene: idleScene,
      beat: 0,
      targets: [],
      cues: definition.cues,
      sectionLabel: getSectionLabel(definition, 0),
      lastJudgeAgeMs: Number.POSITIVE_INFINITY,
      combo: 0,
      hitPulse: this.mode === 'result' ? .08 : 0,
      missPulse: 0,
      musicPulse: (Math.sin(timeMs / 360) + 1) * .15,
      practice: false,
      held: false,
      lastActionAgeMs: Number.POSITIVE_INFINITY,
      strayMisses: 0,
      missCount: 0,
      sectionAgeBeats: 0,
      endBeat: definition.endBeat,
      showLiveJudgement: this.store.settings.showLiveJudgement
    };
    this.renderer.render(state, timeMs);
    requestAnimationFrame(this.loop);
  };

  private vibrate(pattern: number | number[]): void {
    if ('vibrate' in navigator) navigator.vibrate(pattern);
  }

  private registerServiceWorker(): void {
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch((error) => console.warn('Service worker registration failed', error));
    }, { once: true });
  }
}

new App();
