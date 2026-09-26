import { getGameDefinition } from './games.js';
export class GameRenderer {
    canvas;
    ctx;
    bubbles = [];
    particles = [];
    width = 0;
    height = 0;
    dpr = 1;
    previousHitPulse = 0;
    constructor(canvas) {
        this.canvas = canvas;
        const context = canvas.getContext('2d');
        if (!context)
            throw new Error('Canvas 2D context is not available');
        this.ctx = context;
        this.resize();
        window.addEventListener('resize', () => this.resize(), { passive: true });
    }
    render(state, timeMs) {
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
        this.drawCharacter(definition.id, this.width / 2, centerY, 1 + state.hitPulse * 0.08, timeMs, state.hitPulse, state.missPulse, cuePulse);
        this.drawParticles(timeMs);
        if (state.mode === 'game') {
            this.drawCueLabel(state.gameId, cuePulse);
            this.drawJudgeText(state.lastJudge, state.lastJudgeAgeMs);
            this.drawCountIn(state.beat);
        }
        ctx.restore();
    }
    resize() {
        const rect = this.canvas.getBoundingClientRect();
        this.width = Math.max(1, rect.width);
        this.height = Math.max(1, rect.height);
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.canvas.width = Math.round(this.width * this.dpr);
        this.canvas.height = Math.round(this.height * this.dpr);
        this.bubbles = [];
    }
    drawBackground(timeMs, gameId, missPulse, musicPulse) {
        const ctx = this.ctx;
        const palette = gameId === 'crab-clap'
            ? ['#071c2f', '#0a4254', '#102537']
            : gameId === 'fugu-puku'
                ? ['#061d31', '#0b4a56', '#0c2637']
                : gameId === 'deep-remix'
                    ? ['#07152d', '#17345b', '#24163d']
                    : ['#05162f', '#08375a', '#071325'];
        const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, palette[0]);
        gradient.addColorStop(0.48, palette[1]);
        gradient.addColorStop(1, palette[2]);
        ctx.fillStyle = gradient;
        ctx.fillRect(-10, 0, this.width + 20, this.height);
        if (musicPulse > 0) {
            const glow = ctx.createRadialGradient(this.width / 2, this.height * 0.48, 10, this.width / 2, this.height * 0.48, Math.max(this.width, this.height) * 0.62);
            const pulseColor = gameId === 'crab-clap' ? '255, 143, 115' : gameId === 'fugu-puku' ? '222, 239, 126' : gameId === 'deep-remix' ? '124, 225, 255' : '255, 137, 190';
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
            ctx.fillStyle = gameId === 'fugu-puku' ? '#b8ffcc' : gameId === 'deep-remix' ? '#d7a7ff' : '#6be4ff';
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
    drawCharacter(gameId, x, y, scale, timeMs, hitPulse, missPulse, cuePulse) {
        if (gameId === 'deep-remix') {
            const phase = Math.floor(timeMs / 900) % 3;
            if (phase === 0)
                this.drawMendako(x, y + 5, scale * 0.92, timeMs, hitPulse, missPulse);
            else if (phase === 1)
                this.drawCrab(x, y + 34, scale * 0.88, timeMs, hitPulse, missPulse, cuePulse);
            else
                this.drawFugu(x, y + 4, scale * 0.9, timeMs, hitPulse, missPulse, cuePulse);
            return;
        }
        if (gameId === 'robot-stamp') {
            this.drawRobot(x, y + 12, scale, timeMs, hitPulse, missPulse, cuePulse);
            return;
        }
        if (gameId === 'cat-dj') {
            this.drawCat(x, y + 6, scale, timeMs, hitPulse, missPulse, cuePulse);
            return;
        }
        if (gameId === 'ninja-mochi') {
            this.drawNinja(x, y + 12, scale, timeMs, hitPulse, missPulse, cuePulse);
            return;
        }
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
    drawMendako(x, y, scale, timeMs, hitPulse, missPulse) {
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
    drawFace(timeMs, hitPulse, missPulse, eyeColor, mouthColor) {
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
        }
        else {
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
        }
        else {
            const smile = 3 + Math.sin(timeMs / 450) * 1.5;
            ctx.arc(0, -2, 15, smile * 0.02, Math.PI - smile * 0.02);
        }
        ctx.stroke();
    }
    drawCrab(x, y, scale, timeMs, hitPulse, missPulse, cuePulse) {
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
        }
        else {
            ctx.arc(0, 8, 16, 0.15, Math.PI - 0.15);
        }
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.25)';
        ctx.beginPath();
        ctx.ellipse(-24, -24, 24, 12, -0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    drawFugu(x, y, scale, timeMs, hitPulse, missPulse, cuePulse) {
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
        }
        else if (hitPulse > 0.1) {
            ctx.arc(0, 8, 13, 0.1, Math.PI - 0.1);
        }
        else {
            ctx.arc(0, 5, 8 + cuePulse * 5, 0, Math.PI * 2);
        }
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.25)';
        ctx.beginPath();
        ctx.ellipse(-28, -43, 25, 12, -0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    drawRobot(x, y, scale, timeMs, hitPulse, missPulse, cuePulse) {
        const c = this.ctx;
        c.save();
        c.translate(x, y);
        c.scale(scale, scale);
        const bob = Math.sin(timeMs / 240) * 4;
        c.translate(0, bob);
        c.fillStyle = '#ffd45f';
        c.strokeStyle = '#3a354f';
        c.lineWidth = 7;
        c.lineJoin = 'round';
        c.beginPath();
        c.roundRect(-74, -72, 148, 124, 26);
        c.fill();
        c.stroke();
        c.fillStyle = '#30374d';
        c.beginPath();
        c.roundRect(-49, -45, 98, 48, 14);
        c.fill();
        c.fillStyle = missPulse > .1 ? '#ff6a81' : '#79f4ff';
        for (const sx of [-1, 1]) {
            c.beginPath();
            c.arc(sx * 25, -22, 8 + hitPulse * 4, 0, Math.PI * 2);
            c.fill();
        }
        c.strokeStyle = '#3a354f';
        c.lineWidth = 9;
        c.beginPath();
        c.moveTo(-70, 10);
        c.lineTo(-102, 26 - cuePulse * 18);
        c.moveTo(70, 10);
        c.lineTo(102, 26 - cuePulse * 18);
        c.stroke();
        c.fillStyle = '#ff815f';
        c.fillRect(-40, 17, 80, 18);
        c.fillStyle = '#fff0a8';
        c.fillRect(-28, 21, 56, 10);
        c.restore();
    }
    drawCat(x, y, scale, timeMs, hitPulse, missPulse, cuePulse) {
        const c = this.ctx;
        c.save();
        c.translate(x, y);
        c.scale(scale, scale);
        c.rotate(Math.sin(timeMs / 360) * .025);
        c.fillStyle = '#b38cff';
        c.beginPath();
        c.moveTo(-66, -55);
        c.lineTo(-84, -98);
        c.lineTo(-35, -78);
        c.lineTo(0, -88);
        c.lineTo(35, -78);
        c.lineTo(84, -98);
        c.lineTo(66, -55);
        c.quadraticCurveTo(88, 5, 58, 54);
        c.quadraticCurveTo(0, 82, -58, 54);
        c.quadraticCurveTo(-88, 5, -66, -55);
        c.fill();
        c.fillStyle = '#1f2340';
        c.beginPath();
        c.ellipse(-27, -23, 10, 7, 0, 0, Math.PI * 2);
        c.ellipse(27, -23, 10, 7, 0, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#ffccdc';
        c.beginPath();
        c.moveTo(-7, -2);
        c.lineTo(7, -2);
        c.lineTo(0, 7);
        c.closePath();
        c.fill();
        c.strokeStyle = '#1f2340';
        c.lineWidth = 4;
        c.beginPath();
        if (missPulse > .1)
            c.arc(0, 21, 12, Math.PI * 1.1, Math.PI * 1.9);
        else
            c.arc(0, 6, 16, .2, Math.PI - .2);
        c.stroke();
        c.strokeStyle = '#79f4ff';
        c.lineWidth = 8;
        c.beginPath();
        c.arc(0, -6, 89, -2.55, -.58);
        c.stroke();
        c.fillStyle = '#313955';
        for (const sx of [-1, 1]) {
            c.beginPath();
            c.arc(sx * 79, -36, 22 + cuePulse * 3, 0, Math.PI * 2);
            c.fill();
        }
        if (hitPulse > .05) {
            c.fillStyle = 'rgba(255,255,255,.8)';
            c.font = '900 32px system-ui';
            c.textAlign = 'center';
            c.fillText('♪', 0, -110 - hitPulse * 8);
        }
        c.restore();
    }
    drawNinja(x, y, scale, timeMs, hitPulse, missPulse, cuePulse) {
        const c = this.ctx;
        c.save();
        c.translate(x, y);
        c.scale(scale, scale);
        const crouch = cuePulse * 10;
        c.translate(0, crouch);
        c.fillStyle = '#27334f';
        c.beginPath();
        c.arc(0, -16, 72, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#f2c6a8';
        c.beginPath();
        c.roundRect(-48, -48, 96, 38, 15);
        c.fill();
        c.fillStyle = '#151b2d';
        for (const sx of [-1, 1]) {
            c.beginPath();
            c.ellipse(sx * 22, -30, 9, 5, 0, 0, Math.PI * 2);
            c.fill();
        }
        c.fillStyle = '#62e6b8';
        c.beginPath();
        c.moveTo(54, -50);
        c.lineTo(104, -70);
        c.lineTo(76, -31);
        c.closePath();
        c.fill();
        c.strokeStyle = '#dfe7f2';
        c.lineWidth = 9;
        c.lineCap = 'round';
        const swing = hitPulse * .9;
        c.beginPath();
        c.moveTo(45, 25);
        c.lineTo(88 - Math.sin(swing) * 30, -5 - Math.cos(swing) * 48);
        c.stroke();
        c.strokeStyle = missPulse > .1 ? '#ff718b' : '#62e6b8';
        c.lineWidth = 6;
        c.beginPath();
        c.arc(0, 18, 20, .25, Math.PI - .25);
        c.stroke();
        c.restore();
    }
    drawBeatGuide(targets, beat, gameId) {
        const ctx = this.ctx;
        const centerX = this.width / 2;
        const centerY = gameId === 'crab-clap' || gameId === 'cat-dj' ? this.height * 0.56 : this.height * 0.53;
        for (const target of targets) {
            if (target.judge)
                continue;
            const until = target.beat - beat;
            if (until < -0.2 || until > 1.15)
                continue;
            const progress = Math.min(1, Math.max(0, 1 - until));
            const radius = 142 - progress * 88;
            const alpha = 0.24 + progress * 0.76;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = gameId === 'fugu-puku' || gameId === 'ninja-mochi' ? '#e9f79b' : gameId === 'crab-clap' || gameId === 'cat-dj' ? '#ffd0ae' : gameId === 'robot-stamp' ? '#ffe083' : gameId === 'deep-remix' ? '#a6f1ff' : '#fff0a8';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }
    drawJudgeText(judge, ageMs) {
        if (!judge || ageMs > 620)
            return;
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
    drawCountIn(beat) {
        if (beat < 0 || beat >= 4)
            return;
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
    drawCueLabel(gameId, cuePulse) {
        if (cuePulse <= 0)
            return;
        const ctx = this.ctx;
        ctx.save();
        ctx.globalAlpha = Math.min(1, cuePulse * 1.5);
        ctx.font = '900 19px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#dffbff';
        const label = gameId === 'crab-clap' || gameId === 'cat-dj' ? 'おてほん ♪' : gameId === 'fugu-puku' ? 'ぷく ♪' : gameId === 'robot-stamp' ? 'ピッ ♪' : gameId === 'ninja-mochi' ? '構え！' : gameId === 'deep-remix' ? 'SWITCH! ♪' : 'きいて ♪';
        ctx.fillText(label, this.width / 2, this.height * 0.34);
        ctx.restore();
    }
    getCuePulse(beat, cues) {
        let best = Number.POSITIVE_INFINITY;
        for (const cue of cues)
            best = Math.min(best, Math.abs(beat - cue));
        return best < 0.18 ? 1 - best / 0.18 : 0;
    }
    spawnParticles(timeMs, gameId) {
        const hue = gameId === 'crab-clap' ? 18 : gameId === 'fugu-puku' ? 72 : gameId === 'deep-remix' ? 190 : 328;
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
    drawParticles(timeMs) {
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
//# sourceMappingURL=renderer.js.map