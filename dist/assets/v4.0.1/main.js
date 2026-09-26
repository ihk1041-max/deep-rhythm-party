import { AudioEngine } from './audio.js';
import { GAME_ORDER, getGameDefinition, getSectionLabel } from './games.js';
import { GameRenderer } from './renderer.js';
import { RhythmGame } from './rhythm.js';
import { SaveStore } from './settings.js';
const byId = (id) => {
    const element = document.getElementById(id);
    if (!element)
        throw new Error(`Missing element #${id}`);
    return element;
};
const isGameId = (value) => value === 'mendako-pop' || value === 'crab-clap' || value === 'fugu-puku' || value === 'deep-remix';
class App {
    audio = new AudioEngine();
    store = new SaveStore();
    canvas = byId('game-canvas');
    renderer = new GameRenderer(this.canvas);
    game = null;
    mode = 'title';
    selectedGameId = 'mendako-pop';
    titlePanel = byId('title-panel');
    selectPanel = byId('select-panel');
    gamePanel = byId('game-panel');
    resultPanel = byId('result-panel');
    settingsPanel = byId('settings-panel');
    statusText = byId('status-text');
    comboText = byId('combo-text');
    sectionText = byId('section-text');
    progressBar = byId('progress-bar');
    selectMessage = byId('select-message');
    constructor() {
        this.bindEvents();
        this.populateSettings();
        this.refreshSummary();
        this.refreshStageCards();
        this.switchMode('title');
        requestAnimationFrame(this.loop);
        this.registerServiceWorker();
    }
    bindEvents() {
        byId('play-button').addEventListener('click', () => {
            this.refreshStageCards();
            this.clearSelectMessage();
            this.switchMode('select');
        });
        byId('settings-button').addEventListener('click', () => this.switchMode('settings'));
        byId('select-back-button').addEventListener('click', () => this.switchMode('title'));
        byId('settings-back-button').addEventListener('click', () => this.switchMode('title'));
        byId('retry-button').addEventListener('click', () => void this.startGame(this.selectedGameId));
        byId('result-select-button').addEventListener('click', () => {
            this.refreshStageCards();
            this.clearSelectMessage();
            this.switchMode('select');
        });
        document.querySelectorAll('[data-game-id]').forEach((button) => {
            button.addEventListener('click', () => {
                const gameId = button.dataset.gameId;
                if (!isGameId(gameId))
                    return;
                if (!this.store.isUnlocked(gameId)) {
                    this.showLockedMessage(gameId, button);
                    return;
                }
                this.clearSelectMessage();
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
        const music = byId('music-range');
        const sfx = byId('sfx-range');
        const haptics = byId('haptics-toggle');
        const autoPractice = byId('practice-toggle');
        difficulty.addEventListener('change', () => {
            this.store.updateSettings({ difficulty: difficulty.value });
        });
        offset.addEventListener('input', () => {
            const value = Number(offset.value);
            byId('offset-value').textContent = `${value > 0 ? '+' : ''}${value} ms`;
            this.store.updateSettings({ audioOffsetMs: value });
        });
        const updateVolumes = () => {
            const musicVolume = Number(music.value) / 100;
            const sfxVolume = Number(sfx.value) / 100;
            byId('music-value').textContent = `${Math.round(musicVolume * 100)}%`;
            byId('sfx-value').textContent = `${Math.round(sfxVolume * 100)}%`;
            this.store.updateSettings({ musicVolume, sfxVolume });
            this.audio.setVolumes(musicVolume, sfxVolume);
        };
        music.addEventListener('input', updateVolumes);
        sfx.addEventListener('input', updateVolumes);
        haptics.addEventListener('change', () => {
            this.store.updateSettings({ haptics: haptics.checked });
            if (haptics.checked)
                this.vibrate(12);
        });
        autoPractice.addEventListener('change', () => {
            this.store.updateSettings({ autoPractice: autoPractice.checked });
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
        const firstPlay = this.store.getRecord(gameId).plays === 0;
        const shouldPractice = this.store.settings.autoPractice && firstPlay && gameId !== 'deep-remix';
        await this.startSession(gameId, shouldPractice);
    }
    async startSession(gameId, practice) {
        try {
            await this.audio.unlock();
            const settings = this.store.settings;
            const definition = getGameDefinition(gameId);
            this.selectedGameId = gameId;
            this.audio.setVolumes(settings.musicVolume, settings.sfxVolume);
            byId('latency-info').textContent = `推定Audio出力遅延: 約${this.audio.getEstimatedOutputLatencyMs()} ms`;
            this.game?.stop();
            this.statusText.textContent = practice ? 'れんしゅう：合図のあとにまねしてタップ！' : '4カウントのあと、音楽にのろう！';
            this.comboText.textContent = '';
            this.sectionText.textContent = practice ? 'PRACTICE' : 'COUNT IN';
            this.progressBar.style.transform = 'scaleX(0)';
            byId('game-stage-label').textContent = `${practice ? 'PRACTICE' : `STAGE ${String(definition.stage).padStart(2, '0')}`} · ${definition.bpm} BPM`;
            byId('game-title').textContent = practice ? `${definition.title} れんしゅう` : definition.title;
            byId('game-instruction').textContent = practice ? 'まず短いフレーズでタイミングをつかもう' : definition.instruction;
            this.switchMode('game');
            this.game = new RhythmGame({
                audio: this.audio, definition, difficulty: settings.difficulty, audioOffsetMs: settings.audioOffsetMs, practice,
                onHud: (combo, progress, sectionLabel) => {
                    this.comboText.textContent = combo >= 2 ? `COMBO ${combo}` : '';
                    this.sectionText.textContent = practice ? 'PRACTICE' : sectionLabel;
                    this.progressBar.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;
                },
                onJudge: (judge, deltaMs) => this.handleJudge(judge, deltaMs),
                onFinish: (result) => {
                    if (practice) {
                        this.game = null;
                        this.statusText.textContent = 'れんしゅうOK！ 本番スタート！';
                        window.setTimeout(() => { void this.startSession(gameId, false); }, 700);
                    }
                    else {
                        this.finishGame(result);
                    }
                }
            });
            this.game.start();
        }
        catch (error) {
            console.error(error);
            this.statusText.textContent = '音声を開始できませんでした。ブラウザの音声設定を確認してください。';
        }
    }
    handleJudge(judge, deltaMs) {
        const settings = this.store.settings;
        if (settings.haptics) {
            this.vibrate(judge === 'MISS' ? 22 : judge === 'PERFECT' ? 12 : 8);
        }
        if (judge === 'MISS') {
            this.statusText.textContent = 'MISS';
            return;
        }
        if (judge === 'PERFECT') {
            this.statusText.textContent = 'PERFECT!';
            return;
        }
        const timing = deltaMs === undefined
            ? ''
            : deltaMs < -12
                ? ' · すこし はやい'
                : deltaMs > 12
                    ? ' · すこし おそい'
                    : '';
        this.statusText.textContent = `${judge}${timing}`;
    }
    finishGame(result) {
        const outcome = this.store.recordResult(result);
        this.renderResult(result, outcome.newHighScore, outcome.unlockedGameId);
        this.refreshSummary();
        this.refreshStageCards();
        this.game = null;
        if (this.store.settings.haptics)
            this.vibrate(result.score >= 90 ? [18, 40, 18] : 14);
        window.setTimeout(() => this.switchMode('result'), 260);
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
        byId('result-timing').textContent = result.averageAbsOffsetMs > 0
            ? `${result.averageAbsOffsetMs} ms`
            : '—';
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
            ? '曲とひとつになった！最高のリズム！'
            : result.score >= 68
                ? 'いいグルーヴ！後半もかなり合ってる！'
                : result.score >= 48
                    ? '曲を聴いて、合図の続きを感じてみよう！'
                    : 'まずはドラムの拍に合わせてみよう！';
        byId('result-message').textContent = message;
    }
    populateSettings() {
        const settings = this.store.settings;
        const difficulty = byId('difficulty-select');
        const offset = byId('offset-range');
        const music = byId('music-range');
        const sfx = byId('sfx-range');
        const haptics = byId('haptics-toggle');
        const autoPractice = byId('practice-toggle');
        difficulty.value = settings.difficulty;
        offset.value = String(settings.audioOffsetMs);
        music.value = String(Math.round(settings.musicVolume * 100));
        sfx.value = String(Math.round(settings.sfxVolume * 100));
        haptics.checked = settings.haptics;
        autoPractice.checked = settings.autoPractice;
        byId('offset-value').textContent = `${settings.audioOffsetMs > 0 ? '+' : ''}${settings.audioOffsetMs} ms`;
        byId('music-value').textContent = `${Math.round(settings.musicVolume * 100)}%`;
        byId('sfx-value').textContent = `${Math.round(settings.sfxVolume * 100)}%`;
    }
    refreshSummary() {
        const save = this.store.snapshot;
        byId('total-stars').textContent = `${this.store.totalStars} / 12`;
        byId('total-plays').textContent = String(save.totalPlays);
    }
    refreshStageCards() {
        for (const gameId of GAME_ORDER) {
            const card = document.querySelector(`[data-game-id="${gameId}"]`);
            if (!card)
                continue;
            const record = this.store.getRecord(gameId);
            const unlocked = this.store.isUnlocked(gameId);
            const definition = getGameDefinition(gameId);
            card.disabled = false;
            card.setAttribute('aria-disabled', String(!unlocked));
            card.classList.toggle('locked', !unlocked);
            const score = card.querySelector('[data-score]');
            const stars = card.querySelector('[data-stars]');
            const lock = card.querySelector('[data-lock]');
            const bpm = card.querySelector('[data-bpm]');
            if (score)
                score.textContent = unlocked ? `BEST ${record.highScore}` : 'LOCKED';
            if (stars)
                stars.textContent = unlocked ? '★'.repeat(record.bestStars) + '☆'.repeat(3 - record.bestStars) : '🔒';
            if (lock)
                lock.hidden = unlocked;
            if (bpm)
                bpm.textContent = `${definition.bpm} BPM`;
        }
    }
    showLockedMessage(gameId, card) {
        const index = GAME_ORDER.indexOf(gameId);
        const previousId = index > 0 ? GAME_ORDER[index - 1] : undefined;
        const title = getGameDefinition(gameId).title;
        const requirement = previousId
            ? `${getGameDefinition(previousId).title}を1回遊ぶと解放されます。`
            : 'まだ解放されていません。';
        this.selectMessage.textContent = `${title}：${requirement}`;
        this.selectMessage.hidden = false;
        card.classList.remove('locked-bump');
        void card.offsetWidth;
        card.classList.add('locked-bump');
        window.setTimeout(() => card.classList.remove('locked-bump'), 420);
    }
    clearSelectMessage() {
        this.selectMessage.hidden = true;
        this.selectMessage.textContent = '';
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
            sectionLabel: getSectionLabel(definition, 0),
            lastJudgeAgeMs: Number.POSITIVE_INFINITY,
            combo: 0,
            hitPulse: this.mode === 'result' ? 0.08 : 0,
            missPulse: 0,
            musicPulse: 0,
            practice: false
        };
        this.renderer.render(state, timeMs);
        requestAnimationFrame(this.loop);
    };
    vibrate(pattern) {
        if ('vibrate' in navigator)
            navigator.vibrate(pattern);
    }
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