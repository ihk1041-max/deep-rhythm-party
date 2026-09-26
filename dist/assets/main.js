import { AudioEngine } from './audio.js';
import { GAME_ORDER, getGameDefinition } from './games.js';
import { GameRenderer } from './renderer.js';
import { RhythmGame } from './rhythm.js';
import { SaveStore } from './settings.js';
const byId = (id) => {
    const element = document.getElementById(id);
    if (!element)
        throw new Error(`Missing element #${id}`);
    return element;
};
const isGameId = (value) => value === 'mendako-pop' || value === 'crab-clap' || value === 'fugu-puku';
class App {
    audio = new AudioEngine();
    store = new SaveStore();
    canvas = byId('game-canvas');
    renderer = new GameRenderer(this.canvas);
    game = null;
    mode = 'title';
    selectedGameId = 'mendako-pop';
    animationFrame = 0;
    titlePanel = byId('title-panel');
    selectPanel = byId('select-panel');
    gamePanel = byId('game-panel');
    resultPanel = byId('result-panel');
    settingsPanel = byId('settings-panel');
    statusText = byId('status-text');
    comboText = byId('combo-text');
    progressBar = byId('progress-bar');
    constructor() {
        this.bindEvents();
        this.populateSettings();
        this.refreshSummary();
        this.refreshStageCards();
        this.switchMode('title');
        this.loop(performance.now());
        this.registerServiceWorker();
    }
    bindEvents() {
        byId('play-button').addEventListener('click', () => {
            this.refreshStageCards();
            this.switchMode('select');
        });
        byId('settings-button').addEventListener('click', () => this.switchMode('settings'));
        byId('select-back-button').addEventListener('click', () => this.switchMode('title'));
        byId('settings-back-button').addEventListener('click', () => this.switchMode('title'));
        byId('retry-button').addEventListener('click', () => void this.startGame(this.selectedGameId));
        byId('result-select-button').addEventListener('click', () => {
            this.refreshStageCards();
            this.switchMode('select');
        });
        document.querySelectorAll('[data-game-id]').forEach((button) => {
            button.addEventListener('click', () => {
                const gameId = button.dataset.gameId;
                if (!isGameId(gameId) || !this.store.isUnlocked(gameId))
                    return;
                this.selectedGameId = gameId;
                void this.startGame(gameId);
            });
        });
        this.canvas.addEventListener('pointerdown', (event) => {
            if (this.mode !== 'game')
                return;
            event.preventDefault();
            this.game?.tap();
        });
        window.addEventListener('keydown', (event) => {
            if (event.code === 'Space' && this.mode === 'game') {
                event.preventDefault();
                this.game?.tap();
            }
        });
        const difficulty = byId('difficulty-select');
        const offset = byId('offset-range');
        const volume = byId('volume-range');
        difficulty.addEventListener('change', () => {
            this.store.updateSettings({ difficulty: difficulty.value });
        });
        offset.addEventListener('input', () => {
            const value = Number(offset.value);
            byId('offset-value').textContent = `${value > 0 ? '+' : ''}${value} ms`;
            this.store.updateSettings({ audioOffsetMs: value });
        });
        volume.addEventListener('input', () => {
            const value = Number(volume.value) / 100;
            byId('volume-value').textContent = `${Math.round(value * 100)}%`;
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
    async startGame(gameId) {
        if (!this.store.isUnlocked(gameId))
            return;
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
            byId('game-stage-label').textContent = `STAGE ${String(definition.stage).padStart(2, '0')}`;
            byId('game-title').textContent = definition.title;
            byId('game-instruction').textContent = definition.instruction;
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
        }
        catch (error) {
            console.error(error);
            this.statusText.textContent = '音声を開始できませんでした。ブラウザの音声設定を確認してください。';
        }
    }
    handleJudge(judge, deltaMs) {
        if (judge === 'MISS') {
            this.statusText.textContent = 'MISS';
            return;
        }
        const signed = deltaMs === undefined ? '' : ` ${deltaMs > 0 ? '+' : ''}${deltaMs}ms`;
        this.statusText.textContent = `${judge}${signed}`;
    }
    finishGame(result) {
        const outcome = this.store.recordResult(result);
        this.renderResult(result, outcome.newHighScore, outcome.unlockedGameId);
        this.refreshSummary();
        this.refreshStageCards();
        this.game = null;
        window.setTimeout(() => this.switchMode('result'), 220);
    }
    renderResult(result, newHighScore, unlockedGameId) {
        const definition = getGameDefinition(result.gameId);
        byId('result-game-title').textContent = definition.title;
        byId('result-score').textContent = String(result.score);
        byId('result-stars').textContent = '★'.repeat(result.stars) + '☆'.repeat(3 - result.stars);
        byId('result-perfect').textContent = String(result.counts.PERFECT);
        byId('result-great').textContent = String(result.counts.GREAT);
        byId('result-good').textContent = String(result.counts.GOOD);
        byId('result-miss').textContent = String(result.counts.MISS);
        byId('result-combo').textContent = String(result.maxCombo);
        const badge = byId('result-badge');
        if (unlockedGameId) {
            badge.textContent = `NEW! ${getGameDefinition(unlockedGameId).title} 解放`;
            badge.hidden = false;
        }
        else if (newHighScore) {
            badge.textContent = 'NEW HIGH SCORE!';
            badge.hidden = false;
        }
        else {
            badge.hidden = true;
        }
        const message = result.score >= 90
            ? 'すごい！ノリノリ！'
            : result.score >= 65
                ? 'いいリズム！もう一回！'
                : result.score >= 45
                    ? 'いい感じ！あと少し！'
                    : 'リズムを覚えて再挑戦！';
        byId('result-message').textContent = message;
    }
    populateSettings() {
        const settings = this.store.settings;
        const difficulty = byId('difficulty-select');
        const offset = byId('offset-range');
        const volume = byId('volume-range');
        difficulty.value = settings.difficulty;
        offset.value = String(settings.audioOffsetMs);
        volume.value = String(Math.round(settings.masterVolume * 100));
        byId('offset-value').textContent = `${settings.audioOffsetMs > 0 ? '+' : ''}${settings.audioOffsetMs} ms`;
        byId('volume-value').textContent = `${Math.round(settings.masterVolume * 100)}%`;
    }
    refreshSummary() {
        const save = this.store.snapshot;
        byId('total-stars').textContent = `${this.store.totalStars} / 9`;
        byId('total-plays').textContent = String(save.totalPlays);
    }
    refreshStageCards() {
        for (const gameId of GAME_ORDER) {
            const card = document.querySelector(`[data-game-id="${gameId}"]`);
            if (!card)
                continue;
            const record = this.store.getRecord(gameId);
            const unlocked = this.store.isUnlocked(gameId);
            card.disabled = !unlocked;
            card.classList.toggle('locked', !unlocked);
            const score = card.querySelector('[data-score]');
            const stars = card.querySelector('[data-stars]');
            const lock = card.querySelector('[data-lock]');
            if (score)
                score.textContent = unlocked ? `BEST ${record.highScore}` : 'LOCKED';
            if (stars)
                stars.textContent = unlocked ? '★'.repeat(record.bestStars) + '☆'.repeat(3 - record.bestStars) : '🔒';
            if (lock)
                lock.hidden = unlocked;
        }
    }
    switchMode(mode) {
        this.mode = mode;
        this.titlePanel.hidden = mode !== 'title';
        this.selectPanel.hidden = mode !== 'select';
        this.gamePanel.hidden = mode !== 'game';
        this.resultPanel.hidden = mode !== 'result';
        this.settingsPanel.hidden = mode !== 'settings';
    }
    loop = (timeMs) => {
        this.game?.update();
        const definition = getGameDefinition(this.selectedGameId);
        const state = this.game?.getRenderState(this.mode) ?? {
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
    registerServiceWorker() {
        if (!('serviceWorker' in navigator))
            return;
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js').catch((error) => {
                console.warn('Service worker registration failed:', error);
            });
        });
    }
}
new App();
//# sourceMappingURL=main.js.map