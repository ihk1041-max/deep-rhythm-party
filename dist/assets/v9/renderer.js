const PALETTES = {
    bakery: ['#77c9ed', '#c5edf5', '#78b96a'],
    space: ['#141923', '#38434c', '#c79445'],
    frog: ['#173925', '#4e8b4e', '#efbf68'],
    bedroom: ['#3d335d', '#76658e', '#d0a16d'],
    penguin: ['#f2d3a0', '#fff0cf', '#bc765b'],
    robot: ['#6fc5ec', '#bfe9f6', '#ffbc6b'],
    moon: ['#5c7db5', '#e0b29a', '#7c9c6a'],
    chorus: ['#182843', '#395d88', '#efb84c'],
    mole: ['#553653', '#a65b78', '#e7b985'],
    dance: ['#4b2030', '#ac433f', '#f2a34f'],
    conference: ['#2e2735', '#74536b', '#d4a869'],
    ninja: ['#101922', '#283840', '#637b68']
};
const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
export class GameRenderer {
    canvas;
    ctx;
    width = 0;
    height = 0;
    dpr = 1;
    particles = [];
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
        if (state.hitPulse > .82 && this.previousHitPulse <= .82 && state.lastJudge === 'PERFECT')
            this.spawnParticles(timeMs);
        this.previousHitPulse = state.hitPulse;
        const c = this.ctx;
        c.save();
        c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        const shake = state.missPulse > 0 ? Math.sin(timeMs * .16) * 6 * state.missPulse : 0;
        c.translate(shake, 0);
        this.drawBackground(state.scene, timeMs, state.musicPulse, state.missPulse);
        const camera = this.getCamera(state, timeMs);
        c.save();
        c.translate(this.width * .5 + camera.x, this.height * .5 + camera.y);
        c.scale(camera.scale + state.hitPulse * .01, camera.scale + state.hitPulse * .01);
        c.translate(-this.width * .5, -this.height * .5);
        this.drawScene(state, timeMs);
        this.drawObscurer(state, timeMs);
        this.drawReaction(state);
        this.drawParticles(timeMs);
        c.restore();
        if (state.mode === 'game') {
            if (state.practice) {
                this.drawCueBubble(state);
                this.drawPracticeHint(state);
                this.drawCountIn(state.beat);
            }
            else {
                this.drawIntroSlate(state);
            }
            if (state.practice || state.showLiveJudgement)
                this.drawJudge(state.lastJudge, state.lastJudgeAgeMs, state.strayMisses);
            this.drawSectionSplash(state);
            this.drawFinale(state);
        }
        c.restore();
    }
    resize() {
        const rect = this.canvas.getBoundingClientRect();
        this.width = Math.max(1, rect.width);
        this.height = Math.max(1, rect.height);
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.canvas.width = Math.round(this.width * this.dpr);
        this.canvas.height = Math.round(this.height * this.dpr);
    }
    getCamera(s, t) {
        if (s.mode !== 'game' || s.practice)
            return { x: 0, y: 0, scale: 1 };
        let scale = 1 + s.musicPulse * .006;
        let x = Math.sin(s.beat * Math.PI * .5) * 1.6;
        if (s.sectionAgeBeats < .55) {
            const k = 1 - s.sectionAgeBeats / .55;
            scale += .035 * k;
        }
        if (s.scene === 'bakery' && s.sectionLabel.includes('CAMERA OUT'))
            scale = .82;
        if (s.scene === 'robot' && s.sectionLabel.includes('FAR AWAY'))
            scale = .72;
        if (s.scene === 'chorus' && s.sectionLabel.includes('ZOOM OUT'))
            scale = .78;
        if (s.scene === 'ninja' && s.sectionLabel.includes('STORM'))
            x += Math.sin(t * .02) * 4;
        return { x, y: 0, scale };
    }
    drawBackground(scene, t, pulse, miss) {
        const c = this.ctx;
        const p = PALETTES[scene];
        const g = c.createLinearGradient(0, 0, 0, this.height);
        g.addColorStop(0, p[0]);
        g.addColorStop(.6, p[1]);
        g.addColorStop(1, p[2]);
        c.fillStyle = g;
        c.fillRect(-12, 0, this.width + 24, this.height);
        c.globalAlpha = .08 + .04 * pulse;
        for (let i = 0; i < 8; i += 1) {
            const x = ((i * 157 + t * .012) % (this.width + 220)) - 110;
            c.fillStyle = '#fff';
            c.beginPath();
            c.ellipse(x, this.height * .18, 18, this.height * .75, -.2, 0, Math.PI * 2);
            c.fill();
        }
        c.globalAlpha = 1;
        if (miss > 0) {
            c.fillStyle = `rgba(255,60,80,${.12 * miss})`;
            c.fillRect(-12, 0, this.width + 24, this.height);
        }
    }
    drawScene(s, t) {
        switch (s.scene) {
            case 'bakery':
                this.drawGolf(s, t);
                break;
            case 'space':
                this.drawScrewbot(s, t);
                break;
            case 'frog':
                this.drawTambourine(s, t);
                break;
            case 'bedroom':
                this.drawMeeting(s, t);
                break;
            case 'penguin':
                this.drawFork(s, t);
                break;
            case 'robot':
                this.drawRally(s, t);
                break;
            case 'moon':
                this.drawDate(s, t);
                break;
            case 'chorus':
                this.drawBeatWatch(s, t);
                break;
            case 'mole':
                this.drawChoir(s, t);
                break;
            case 'dance':
                this.drawKarate(s, t);
                break;
            case 'conference':
                this.drawInterview(s, t);
                break;
            case 'ninja':
                this.drawSlice(s, t);
                break;
        }
    }
    drawGolf(s, t) {
        const c = this.ctx;
        const ground = this.height * .73;
        c.fillStyle = '#82c675';
        c.fillRect(0, ground, this.width, this.height - ground);
        c.fillStyle = '#73b864';
        c.beginPath();
        c.ellipse(this.width * .78, ground + 12, 120, 42, 0, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#edf6fb';
        c.fillRect(this.width * .82, ground - 100, 4, 100);
        c.fillStyle = '#ff6b7e';
        c.beginPath();
        c.moveTo(this.width * .82, ground - 100);
        c.lineTo(this.width * .82 + 42, ground - 84);
        c.lineTo(this.width * .82, ground - 68);
        c.fill();
        this.drawPerson(this.width * .25, ground - 18, '#f4d29a', '#315a7d', false);
        c.save();
        c.translate(this.width * .25 + 18, ground - 45);
        c.rotate(-1.1 + s.hitPulse * 1.35);
        c.strokeStyle = '#27384a';
        c.lineWidth = 5;
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(62, 36);
        c.stroke();
        c.restore();
        const target = this.nextTarget(s.targets, s.beat);
        if (target) {
            const d = target.beat - s.beat;
            const u = clamp(1 - d / 3.2);
            const x = this.width * (.48 - .16 * u);
            const y = ground - 120 * Math.sin(u * Math.PI) - 30;
            c.fillStyle = '#fff';
            c.beginPath();
            c.arc(x, y, 8, 0, Math.PI * 2);
            c.fill();
        }
        const cue = s.recentCue;
        const big = cue?.kind === 'lob';
        const birdX = this.width * .55;
        const birdY = this.height * .32 + (big ? 15 : 0);
        c.font = big ? '52px system-ui' : '36px system-ui';
        c.textAlign = 'center';
        c.fillText(big ? '🦅' : '🐦', birdX, birdY);
        if (cue && cue.ageBeats >= 0 && cue.ageBeats < .75) {
            c.fillStyle = 'rgba(255,255,255,.86)';
            c.beginPath();
            c.roundRect(birdX - 56, birdY - 72, 112, 34, 17);
            c.fill();
            c.fillStyle = '#27384a';
            c.font = '900 15px system-ui';
            c.fillText(cue.label ?? '', birdX, birdY - 50);
        }
        c.fillStyle = '#d6eef7';
        c.beginPath();
        c.ellipse(this.width * .82, ground + 22, 54, 17, 0, 0, Math.PI * 2);
        c.fill();
    }
    drawScrewbot(s, t) {
        const c = this.ctx;
        const floor = this.height * .74;
        c.fillStyle = '#202833';
        c.fillRect(0, floor, this.width, this.height - floor);
        c.fillStyle = '#4b5962';
        c.fillRect(0, floor - 36, this.width, 38);
        for (let x = -20; x < this.width + 50; x += 54) {
            c.fillStyle = '#1b222a';
            c.beginPath();
            c.arc(x + (t * .06 % 54), floor - 17, 12, 0, Math.PI * 2);
            c.fill();
        }
        const target = this.nextTarget(s.targets, s.beat);
        const delta = target ? target.beat - s.beat : 4;
        const robotX = this.width * .55 - delta * this.width * .13;
        c.save();
        c.translate(robotX, floor - 78);
        c.fillStyle = '#d6dde3';
        c.beginPath();
        c.roundRect(-40, -35, 80, 70, 18);
        c.fill();
        c.fillStyle = '#2d3740';
        c.fillRect(-24, -15, 48, 18);
        c.fillStyle = '#70e7ba';
        c.beginPath();
        c.arc(-10, -6, 5, 0, Math.PI * 2);
        c.arc(10, -6, 5, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#aeb8c1';
        c.beginPath();
        c.arc(0, -45, 25, 0, Math.PI * 2);
        c.fill();
        c.restore();
        const craneX = this.width * .55;
        c.strokeStyle = '#f1d35c';
        c.lineWidth = 10;
        c.beginPath();
        c.moveTo(craneX, this.height * .12);
        c.lineTo(craneX, s.held ? floor - 135 : this.height * .4);
        c.stroke();
        c.fillStyle = '#f1d35c';
        c.beginPath();
        c.roundRect(craneX - 34, (s.held ? floor - 152 : this.height * .4 - 18), 68, 36, 12);
        c.fill();
        if (s.held) {
            c.strokeStyle = '#fff0a0';
            c.lineWidth = 3;
            for (let i = 0; i < 4; i += 1) {
                const a = t * .02 + i * Math.PI / 2;
                c.beginPath();
                c.arc(robotX, floor - 123, 32 + i * 3, a, a + .7);
                c.stroke();
            }
        }
    }
    drawTambourine(s, t) {
        const c = this.ctx;
        const y = this.height * .55;
        this.drawSquirrel(this.width * .5, y, 1, s.recentCue?.kind === 'dance-left' || s.recentCue?.kind === 'dance-right');
        this.drawTambourineDisk(this.width * .5 + 58, y - 18, s.recentCue?.kind === 'dance-right' ? 1 : s.recentCue?.kind === 'dance-left' ? .55 : 0);
        c.save();
        c.translate(this.width * .5, this.height * .83);
        this.drawTambourineDisk(0, 0, s.hitPulse);
        c.restore();
        c.fillStyle = 'rgba(12,28,32,.55)';
        c.beginPath();
        c.roundRect(this.width * .08, this.height * .77, this.width * .34, 52, 18);
        c.roundRect(this.width * .58, this.height * .77, this.width * .34, 52, 18);
        c.fill();
        c.fillStyle = '#fff';
        c.font = '900 14px system-ui';
        c.textAlign = 'center';
        c.fillText('左：シャカ', this.width * .25, this.height * .77 + 32);
        c.fillText('右：パン', this.width * .75, this.height * .77 + 32);
    }
    drawMeeting(s, t) {
        const c = this.ctx;
        const y = this.height * .65;
        c.fillStyle = '#8c6748';
        c.fillRect(0, y + 55, this.width, this.height - y - 55);
        c.fillStyle = '#694a36';
        c.beginPath();
        c.ellipse(this.width * .5, y - 25, this.width * .36, 62, 0, 0, Math.PI * 2);
        c.fill();
        const cue = s.recentCue;
        const activeIndex = cue?.kind === 'knock' ? Math.floor(((cue.beat ?? 0) % 8) - 0.001) : 0;
        const xs = [.23, .41, .59, .77];
        xs.forEach((ratio, i) => { const isPlayer = i === 3; const spin = isPlayer ? (!s.hitPulse) : cue?.kind === 'knock' && cue.ageBeats < .45 && i === Math.round(((cue.beat % 8) - 0) / 1) % 3; this.drawChairPerson(this.width * ratio, y, spin ? Math.sin(t * .03) * .9 : 0, isPlayer, s.lastJudge === 'MISS' && isPlayer && s.lastJudgeAgeMs < 380); });
        c.fillStyle = 'rgba(255,255,255,.86)';
        c.beginPath();
        c.roundRect(this.width * .36, this.height * .18, this.width * .28, 52, 16);
        c.fill();
        c.fillStyle = '#3e3551';
        c.textAlign = 'center';
        c.font = '900 16px system-ui';
        c.fillText('議題：リズム', this.width * .5, this.height * .18 + 32);
    }
    drawFork(s, t) {
        const c = this.ctx;
        const table = this.height * .62;
        c.fillStyle = '#f0d1a4';
        c.fillRect(0, table, this.width, this.height - table);
        const target = this.nextTarget(s.targets, s.beat);
        if (target) {
            const d = target.beat - s.beat;
            const u = clamp(1 - d / 2);
            const x = this.width * (.82 - .55 * u);
            const y = table - 62 - 45 * Math.sin(u * Math.PI);
            c.fillStyle = (target.beat > 56) ? '#c86c42' : '#70b45f';
            c.beginPath();
            c.arc(x, y, (target.beat > 56) ? 12 : 8, 0, Math.PI * 2);
            c.fill();
        }
        c.strokeStyle = '#dfe7ea';
        c.lineWidth = 7;
        const fx = this.width * .27;
        const fy = table + 10 - s.hitPulse * 30;
        c.beginPath();
        c.moveTo(fx, fy + 120);
        c.lineTo(fx, fy);
        c.stroke();
        [-10, 0, 10].forEach(dx => { c.beginPath(); c.moveTo(fx + dx, fy); c.lineTo(fx + dx, fy - 44); c.stroke(); });
        c.fillStyle = '#7b5036';
        c.beginPath();
        c.arc(this.width * .82, table - 35, 28, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#f3cda8';
        c.beginPath();
        c.arc(this.width * .82, table - 45, 19, 0, Math.PI * 2);
        c.fill();
    }
    drawRally(s, t) {
        const c = this.ctx;
        if (s.sectionLabel.includes('SUNSET')) {
            c.fillStyle = 'rgba(255,125,80,.2)';
            c.fillRect(0, 0, this.width, this.height);
        }
        const far = s.sectionLabel.includes('FAR AWAY');
        const gap = far ? .37 : .29;
        this.drawPlane(this.width * (.5 - gap), this.height * .56, -1);
        this.drawPlane(this.width * (.5 + gap), this.height * .43, 1);
        const target = this.nextTarget(s.targets, s.beat);
        if (target) {
            const d = target.beat - s.beat;
            const length = d > 1.25 ? 2 : 1;
            const u = clamp(1 - d / length);
            const x = this.width * (.5 + gap - (gap * 2) * u);
            const y = this.height * (.46 - .12 * Math.sin(u * Math.PI));
            c.fillStyle = '#fff';
            c.beginPath();
            c.ellipse(x, y, 7, 4, .2, 0, Math.PI * 2);
            c.fill();
        }
        c.fillStyle = 'rgba(255,255,255,.75)';
        for (let i = 0; i < 5; i += 1) {
            const x = (i * 140 + t * .02) % (this.width + 180) - 90;
            c.beginPath();
            c.ellipse(x, this.height * (.18 + (i % 2) * .09), 60, 20, 0, 0, Math.PI * 2);
            c.fill();
        }
    }
    drawDate(s, t) {
        const c = this.ctx;
        const ground = this.height * .72;
        c.fillStyle = '#6d9a61';
        c.fillRect(0, ground, this.width, this.height - ground);
        c.fillStyle = '#6e503b';
        c.fillRect(this.width * .22, ground - 72, this.width * .34, 14);
        c.fillRect(this.width * .26, ground - 58, 10, 58);
        c.fillRect(this.width * .48, ground - 58, 10, 58);
        this.drawPerson(this.width * .32, ground - 78, '#efc09b', '#517db0', false);
        this.drawPerson(this.width * .46, ground - 78, '#f4c7a3', '#e58b9f', false);
        c.font = '30px system-ui';
        c.fillText('🐿️', this.width * .62, ground - 18);
        c.fillText('🐿️', this.width * .70, ground - 18);
        const target = this.nextTarget(s.targets, s.beat);
        const cue = target ? this.cueBeforeTarget(s, target.beat, 4.2) : s.recentCue;
        if (target) {
            const d = target.beat - s.beat;
            const total = cue?.kind === 'lob' ? 4 : cue?.kind === 'dish-left' ? 2.5 : 2;
            const u = clamp(1 - d / total);
            const x = this.width * (.94 - .58 * u);
            const bounces = cue?.kind === 'lob' ? 3 : cue?.kind === 'dish-left' ? 2 : 1;
            const phase = (u * bounces) % 1;
            const y = ground - 28 - 70 * Math.sin(phase * Math.PI);
            c.fillStyle = cue?.kind === 'lob' ? '#7c5339' : cue?.kind === 'dish-left' ? '#e68353' : '#f4f4f4';
            c.beginPath();
            c.arc(x, y, cue?.kind === 'lob' ? 10 : 12, 0, Math.PI * 2);
            c.fill();
        }
        if (s.hitPulse > .1) {
            c.strokeStyle = '#fff3a1';
            c.lineWidth = 7;
            c.beginPath();
            c.moveTo(this.width * .34, ground - 50);
            c.lineTo(this.width * .27, ground - 12);
            c.stroke();
        }
    }
    drawBeatWatch(s, t) {
        const c = this.ctx;
        const cx = this.width * .5, cy = this.height * .5, r = Math.min(this.width, this.height) * .31;
        c.fillStyle = '#f5edd8';
        c.beginPath();
        c.arc(cx, cy, r, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = '#28384b';
        c.lineWidth = 9;
        c.stroke();
        for (let i = 0; i < 12; i += 1) {
            const a = -Math.PI / 2 + i * Math.PI * 2 / 12;
            const x = cx + Math.cos(a) * r * .82;
            const y = cy + Math.sin(a) * r * .82;
            c.fillStyle = i % 4 === 2 ? '#a46fe0' : '#f0a54c';
            c.beginPath();
            c.arc(x, y, 12, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = '#26323f';
            c.beginPath();
            c.arc(x - 3, y - 2, 2, 0, Math.PI * 2);
            c.arc(x + 3, y - 2, 2, 0, Math.PI * 2);
            c.fill();
        }
        const a = -Math.PI / 2 + (s.beat % 12) / 12 * Math.PI * 2;
        c.strokeStyle = '#2a435f';
        c.lineWidth = 8;
        c.beginPath();
        c.moveTo(cx, cy);
        c.lineTo(cx + Math.cos(a) * r * .72, cy + Math.sin(a) * r * .72);
        c.stroke();
        c.fillStyle = '#2a435f';
        c.beginPath();
        c.arc(cx, cy, 13, 0, Math.PI * 2);
        c.fill();
        if (s.hitPulse > .2) {
            const hx = cx + Math.cos(a) * r * .84, hy = cy + Math.sin(a) * r * .84;
            c.font = '28px system-ui';
            c.textAlign = 'center';
            c.fillText('✋', hx, hy);
        }
    }
    drawChoir(s, t) {
        const c = this.ctx;
        const y = this.height * .61;
        const xs = [.3, .5, .7];
        xs.forEach((x, i) => { const open = i < 2 ? (Math.sin(s.beat * Math.PI * .5) > 0) : s.held; this.drawSinger(this.width * x, y, open, i === 2, s.lastJudge === 'MISS' && s.lastJudgeAgeMs < 350); });
        c.strokeStyle = '#ffe9a6';
        c.lineWidth = 5;
        c.beginPath();
        c.moveTo(this.width * .14, this.height * .34);
        c.lineTo(this.width * .14 + 52 * Math.cos(t * .006), this.height * .34 - 52 * Math.sin(t * .006));
        c.stroke();
        c.fillStyle = '#f7d2b1';
        c.beginPath();
        c.arc(this.width * .14, this.height * .38, 26, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = 'rgba(255,255,255,.13)';
        for (let i = 0; i < 8; i += 1) {
            c.beginPath();
            c.arc(this.width * (.17 + i * .1), this.height * .2 + Math.sin(t / 350 + i) * 10, 4, 0, Math.PI * 2);
            c.fill();
        }
    }
    drawKarate(s, t) {
        const c = this.ctx;
        const ground = this.height * .74;
        c.fillStyle = '#35241c';
        c.fillRect(0, ground, this.width, this.height - ground);
        c.fillStyle = '#f1e4c5';
        c.fillRect(this.width * .08, this.height * .17, this.width * .84, this.height * .46);
        c.strokeStyle = '#b07d55';
        c.lineWidth = 5;
        c.strokeRect(this.width * .08, this.height * .17, this.width * .84, this.height * .46);
        this.drawKarateGuy(this.width * .32, ground - 12, s.hitPulse, s.lastJudge === 'MISS' && s.lastJudgeAgeMs < 350);
        const target = this.nextTarget(s.targets, s.beat);
        if (target) {
            const d = target.beat - s.beat;
            const u = clamp(1 - d / 1.2);
            const x = this.width * (.88 - .46 * u);
            const y = ground - 120 + 18 * Math.sin(t * .01);
            const combo = target.beat % 1 !== 0;
            c.fillStyle = combo ? '#f35e66' : '#d0a94f';
            c.beginPath();
            c.arc(x, y, combo ? 11 : 15, 0, Math.PI * 2);
            c.fill();
        }
        c.fillStyle = '#9d3d35';
        c.font = '950 18px system-ui';
        c.textAlign = 'center';
        c.fillText('気 合', this.width * .72, this.height * .29);
    }
    drawInterview(s, t) {
        const c = this.ctx;
        const floor = this.height * .73;
        c.fillStyle = '#4f3d33';
        c.fillRect(0, floor, this.width, this.height - floor);
        this.drawChampion(this.width * .55, floor - 10, s.held, s.hitPulse, s.lastJudge === 'MISS' && s.lastJudgeAgeMs < 360);
        this.drawReporter(this.width * .24, floor - 18);
        c.fillStyle = '#111722';
        c.fillRect(this.width * .27, floor - 115, 5, 90);
        c.fillStyle = '#d8dfe6';
        c.beginPath();
        c.arc(this.width * .27, floor - 120, 9, 0, Math.PI * 2);
        c.fill();
        if (s.recentCue && s.recentCue.ageBeats < .9) {
            c.fillStyle = 'rgba(255,255,255,.9)';
            c.beginPath();
            c.roundRect(this.width * .1, this.height * .18, this.width * .8, 54, 18);
            c.fill();
            c.fillStyle = '#2f2632';
            c.font = '900 15px system-ui';
            c.textAlign = 'center';
            c.fillText(s.recentCue.label ?? '', this.width * .5, this.height * .18 + 34);
        }
        if (s.hitPulse > .25) {
            c.fillStyle = `rgba(255,255,255,${s.hitPulse * .65})`;
            c.fillRect(0, 0, this.width, this.height);
        }
    }
    drawSlice(s, t) {
        const c = this.ctx;
        const ground = this.height * .74;
        c.fillStyle = '#263c31';
        c.fillRect(0, ground, this.width, this.height - ground);
        this.drawSamurai(this.width * .3, ground - 8, s.held, s.hitPulse, s.lastJudge === 'MISS' && s.lastJudgeAgeMs < 350);
        const cue = s.recentCue;
        const target = this.nextTarget(s.targets, s.beat);
        if (target) {
            const d = target.beat - s.beat;
            const total = target.action === 'release' ? 3 : 2;
            const u = clamp(1 - d / total);
            const x = this.width * (.9 - .45 * u);
            const y = ground - 78 - 20 * Math.sin(u * Math.PI);
            c.fillStyle = '#1a2429';
            c.beginPath();
            c.arc(x, y, 22, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = '#ff5b63';
            c.beginPath();
            c.arc(x - 7, y - 4, 4, 0, Math.PI * 2);
            c.arc(x + 7, y - 4, 4, 0, Math.PI * 2);
            c.fill();
        }
        if (cue?.kind === 'charge' && cue.ageBeats >= 0) {
            for (let i = 0; i < 5; i += 1) {
                c.fillStyle = 'rgba(20,30,35,.8)';
                c.beginPath();
                c.arc(this.width * (.62 + i * .07), ground - 75 - 10 * (i % 2), 14, 0, Math.PI * 2);
                c.fill();
            }
        }
        if (s.held) {
            c.strokeStyle = 'rgba(255,245,190,.7)';
            c.lineWidth = 4;
            c.beginPath();
            c.arc(this.width * .3, ground - 70, 68 + t % 16, 0, Math.PI * 2);
            c.stroke();
        }
    }
    drawObscurer(s, t) {
        if (s.practice)
            return;
        const c = this.ctx;
        if (s.scene === 'space' && s.sectionLabel.includes('LIGHTS DOWN')) {
            c.fillStyle = 'rgba(4,7,10,.62)';
            c.fillRect(0, 0, this.width, this.height);
            const g = c.createRadialGradient(this.width * .55, this.height * .58, 10, this.width * .55, this.height * .58, 95);
            g.addColorStop(0, 'rgba(255,230,120,.25)');
            g.addColorStop(1, 'rgba(255,230,120,0)');
            c.fillStyle = g;
            c.fillRect(0, 0, this.width, this.height);
        }
        if (s.scene === 'robot' && s.sectionLabel.includes('SUNSET')) {
            c.fillStyle = 'rgba(140,45,80,.2)';
            c.fillRect(0, 0, this.width, this.height);
        }
        if (s.scene === 'chorus' && s.sectionLabel.includes('CLOUD COVER')) {
            c.fillStyle = 'rgba(235,245,255,.38)';
            for (let i = 0; i < 5; i += 1) {
                const x = (i * 120 + t * .03) % (this.width + 150) - 75;
                c.beginPath();
                c.ellipse(x, this.height * .43, 80, 38, 0, 0, Math.PI * 2);
                c.fill();
            }
        }
        if (s.scene === 'ninja' && s.sectionLabel.includes('FOG')) {
            c.fillStyle = 'rgba(220,235,225,.22)';
            for (let i = 0; i < 6; i += 1) {
                const x = (i * 100 + t * .025) % (this.width + 120) - 60;
                c.beginPath();
                c.ellipse(x, this.height * .55, 75, 44, 0, 0, Math.PI * 2);
                c.fill();
            }
        }
        if (s.scene === 'ninja' && s.sectionLabel.includes('STORM')) {
            c.strokeStyle = 'rgba(210,235,255,.32)';
            c.lineWidth = 2;
            for (let i = 0; i < 20; i += 1) {
                const x = (i * 37 + t * .18) % this.width;
                c.beginPath();
                c.moveTo(x, 0);
                c.lineTo(x - 55, this.height * .7);
                c.stroke();
            }
        }
        if (s.scene === 'moon' && s.sectionLabel.includes('DOG RUNS BY')) {
            const x = (t * .22 % (this.width + 220)) - 110;
            c.font = '82px system-ui';
            c.textAlign = 'center';
            c.fillText('🐕', x, this.height * .68);
        }
        if (s.scene === 'bedroom' && s.sectionLabel.includes('BOSS WATCHING')) {
            c.save();
            c.globalAlpha = .82;
            c.fillStyle = '#f0c49e';
            c.beginPath();
            c.arc(this.width * .88, this.height * .22, 55, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = '#242c35';
            c.beginPath();
            c.arc(this.width * .86, this.height * .2, 6, 0, Math.PI * 2);
            c.arc(this.width * .91, this.height * .2, 6, 0, Math.PI * 2);
            c.fill();
            c.restore();
        }
        if (s.scene === 'dance' && s.sectionLabel.includes('NIGHT TRAINING')) {
            c.fillStyle = 'rgba(18,10,24,.38)';
            c.fillRect(0, 0, this.width, this.height);
        }
    }
    drawReaction(s) {
        if (s.lastJudgeAgeMs > 480 || !s.lastJudge)
            return;
        const c = this.ctx;
        const miss = s.lastJudge === 'MISS';
        const near = s.lastJudge === 'GOOD';
        const alpha = clamp(1 - s.lastJudgeAgeMs / 480);
        const words = {
            bakery: { ok: 'SWING!', near: 'かすっ', bad: '空振り!' }, space: { ok: 'KACHI!', near: 'ちょいズレ', bad: 'ギギ…' }, frog: { ok: 'SHAKE!', near: 'おっと', bad: 'ちがう!' }, bedroom: { ok: 'PITA!', near: 'ズレた', bad: 'ガタン!' },
            penguin: { ok: 'SUKA!', near: '端っこ', bad: 'ポロッ' }, robot: { ok: 'PON!', near: 'かすっ', bad: 'すかっ' }, moon: { ok: 'KICK!', near: '弱い!', bad: '直撃!? ' }, chorus: { ok: 'HIGH FIVE!', near: 'ふらっ', bad: 'スカ!' },
            mole: { ok: '♪', near: 'ん?', bad: '!? ' }, dance: { ok: 'HIT!', near: 'こつん', bad: 'すかっ' }, conference: { ok: 'FLASH!', near: 'えーと', bad: '……' }, ninja: { ok: 'SLASH!', near: '浅い!', bad: '逃げた!' }
        };
        const w = words[s.scene];
        c.save();
        c.globalAlpha = alpha;
        c.font = `950 ${miss ? 24 : near ? 22 : 28}px system-ui`;
        c.textAlign = 'center';
        c.lineWidth = 7;
        c.strokeStyle = 'rgba(20,24,34,.55)';
        c.fillStyle = miss ? '#ffd1d8' : near ? '#dff3ff' : '#fff4a3';
        const text = miss ? w.bad : near ? w.near : w.ok;
        c.strokeText(text, this.width * .5, this.height * .31);
        c.fillText(text, this.width * .5, this.height * .31);
        c.restore();
    }
    drawIntroSlate(s) {
        if (s.beat < 0 || s.beat >= 4)
            return;
        const c = this.ctx;
        const u = clamp(s.beat / 4);
        const lines = {
            bakery: '合図を聞いて、最後の拍でスイング。', space: 'つかむ。2拍か3拍で離す。', frog: '聞く。左右でそのまま返す。', bedroom: '3人が止まった、その次が自分。',
            penguin: '飛んだ音から同じ長さだけ待つ。', robot: '普通は次。長い合図はもう1拍待つ。', moon: 'ボールの種類で待つ拍が変わる。', chorus: '合図なしでも1拍ずつ刻む。',
            mole: '前の2人と同じ長さだけ歌う。', dance: '飛んできた拍でパンチ。', conference: '質問のリズムで返事を変える。', ninja: '一体は斬る。大群は構える。'
        };
        c.save();
        c.globalAlpha = Math.sin(Math.PI * u) * .92;
        c.fillStyle = 'rgba(8,12,28,.58)';
        c.beginPath();
        c.roundRect(this.width * .1, this.height * .17, this.width * .8, 76, 24);
        c.fill();
        c.fillStyle = '#fff';
        c.font = '950 18px system-ui';
        c.textAlign = 'center';
        c.fillText(lines[s.scene], this.width * .5, this.height * .17 + 46);
        c.restore();
    }
    drawSectionSplash(s) {
        if (s.practice || s.sectionLabel === 'COUNT IN' || s.sectionAgeBeats > 1.05)
            return;
        const c = this.ctx;
        const u = clamp(s.sectionAgeBeats / 1.05);
        const alpha = Math.sin(Math.PI * u);
        c.save();
        c.globalAlpha = alpha * .88;
        c.fillStyle = 'rgba(8,14,30,.68)';
        c.beginPath();
        c.roundRect(this.width * .2, this.height * .14, this.width * .6, 46, 15);
        c.fill();
        c.fillStyle = '#fff';
        c.font = '950 16px system-ui';
        c.textAlign = 'center';
        c.fillText(s.sectionLabel, this.width * .5, this.height * .14 + 29);
        c.restore();
    }
    drawFinale(s) {
        const left = s.endBeat - s.beat;
        if (left > 2.4 || left < -.25)
            return;
        const u = 1 - clamp(left / 2.4);
        const troubled = s.missCount >= Math.max(2, Math.ceil(Math.max(1, s.targets.length) * .22));
        const c = this.ctx;
        const endings = {
            bakery: { ok: 'ナイスショット!', bad: '池ポチャ!', oi: '⛳✨', bi: '🏌️💦', sub: '鳥たちも大拍手', bsub: '鳥が気まずそうに飛んでいく' },
            space: { ok: '出荷完了!', bad: '再調整!', oi: '🤖💡', bi: '🤖⚡', sub: '全ロボ起動', bsub: 'ネジが一本ころころ…' },
            frog: { ok: 'スーパーセッション!', bad: '別の曲!?', oi: '🪇🐿️', bi: '🪇❓', sub: 'リスが満足げ', bsub: 'リスが首をかしげた' },
            bedroom: { ok: '会議終了!', bad: '議事録延期!', oi: '🪑✨', bi: '🪑💫', sub: '全員ぴったり停止', bsub: 'イスだけまだ回っている' },
            penguin: { ok: 'いただきます!', bad: '床に落ちた!', oi: '🍡✨', bi: '🍡💨', sub: '串いっぱい', bsub: '最後の一個が逃げた' },
            robot: { ok: 'ラリー継続!', bad: '落下!', oi: '🏸✈️', bi: '🏸☁️', sub: '空の向こうまで続く', bsub: '羽根が雲へ消えた' },
            moon: { ok: 'デート成功!', bad: '空気が…!', oi: '💞⚽', bi: '💞💥', sub: 'みんな無事', bsub: 'ベンチの後ろでボールが跳ねた' },
            chorus: { ok: '時間ぴったり!', bad: '何時だっけ?', oi: '⌚✨', bi: '⌚❓', sub: '拍は止まらない', bsub: '時計だけ先へ進んだ' },
            mole: { ok: 'ハモった!', bad: 'バラバラ!', oi: '🎤🎶', bi: '🎤😵', sub: '指揮者も満足', bsub: '最後の音だけ三人別々' },
            dance: { ok: '修行完了!', bad: '修行続行!', oi: '🥋🔥', bi: '🥋💦', sub: '最後の一撃も決まった', bsub: '屋台のお皿は無事…たぶん' },
            conference: { ok: '会見終了!', bad: 'ノーコメント!', oi: '🎙️📸', bi: '🎙️😶', sub: '新聞の一面へ', bsub: '記者だけ盛り上がった' },
            ninja: { ok: '一件落着!', bad: '逃げられた!', oi: '⚔️🌸', bi: '⚔️💨', sub: '最後の敵も一閃', bsub: '影だけが残った' }
        };
        const e = endings[s.scene];
        c.save();
        c.globalAlpha = Math.min(.76, u * .92);
        c.fillStyle = 'rgba(5,9,22,.74)';
        c.fillRect(0, 0, this.width, this.height);
        c.translate(this.width * .5, this.height * .47);
        const bounce = 1 + Math.sin(Math.min(1, u) * Math.PI) * .11;
        c.scale(bounce, bounce);
        c.globalAlpha = clamp((u - .1) / .9);
        c.textAlign = 'center';
        c.font = '950 46px system-ui';
        c.fillText(troubled ? e.bi : e.oi, 0, -48);
        c.font = '950 33px system-ui';
        c.fillStyle = troubled ? '#ffd0d8' : '#fff5a8';
        c.fillText(troubled ? e.bad : e.ok, 0, 8);
        c.font = '800 13px system-ui';
        c.fillStyle = '#d8ecf3';
        c.fillText(troubled ? e.bsub : e.sub, 0, 37);
        c.restore();
    }
    drawCueBubble(s) { const cue = s.recentCue; if (!cue?.label || cue.ageBeats > 1.05 || cue.ageBeats < -.1)
        return; const c = this.ctx; const alpha = 1 - Math.max(0, cue.ageBeats - .65) / .4; c.globalAlpha = Math.max(.25, alpha); c.fillStyle = 'rgba(5,13,27,.76)'; c.beginPath(); c.roundRect(this.width * .16, this.height * .11, this.width * .68, 54, 20); c.fill(); c.fillStyle = '#fff'; c.font = '900 17px system-ui'; c.textAlign = 'center'; c.fillText(cue.label, this.width * .5, this.height * .11 + 34); c.globalAlpha = 1; }
    drawPracticeHint(s) { const target = this.nextTarget(s.targets, s.beat); if (!target)
        return; const d = target.beat - s.beat; if (d > 2.3 || d < -.3)
        return; let text = 'タップ!'; if (target.action === 'release')
        text = 'はなす!';
    else if (target.action === 'left')
        text = 'ひだり!';
    else if (target.action === 'right')
        text = 'みぎ!';
    else if (target.action === 'press' && ['space', 'mole', 'ninja'].includes(s.scene))
        text = 'おす!'; const c = this.ctx; c.fillStyle = 'rgba(255,255,255,.92)'; c.beginPath(); c.roundRect(this.width * .31, this.height * .82, this.width * .38, 48, 18); c.fill(); c.fillStyle = '#222a3c'; c.font = '950 18px system-ui'; c.textAlign = 'center'; c.fillText(text, this.width * .5, this.height * .82 + 31); }
    drawJudge(judge, ageMs, stray) { if (!judge || ageMs > 650)
        return; const c = this.ctx; const fade = 1 - ageMs / 650; c.globalAlpha = fade; c.font = '950 34px system-ui'; c.textAlign = 'center'; c.fillStyle = judge === 'PERFECT' ? '#fff39d' : judge === 'GREAT' ? '#8cf4ff' : judge === 'GOOD' ? '#c6e7ff' : '#ff8298'; c.fillText(judge === 'MISS' && stray > 0 ? 'MISS!' : judge, this.width * .5, this.height * .27); c.globalAlpha = 1; }
    drawCountIn(beat) { if (beat < 0 || beat >= 4)
        return; const c = this.ctx; const n = Math.floor(beat) + 1; const frac = beat - Math.floor(beat); c.globalAlpha = 1 - frac * .55; c.fillStyle = '#fff'; c.font = `950 ${72 + 20 * (1 - frac)}px system-ui`; c.textAlign = 'center'; c.fillText(String(n), this.width * .5, this.height * .49); c.globalAlpha = 1; }
    drawPerson(x, y, skin, shirt, sad) { const c = this.ctx; c.save(); c.translate(x, y); c.fillStyle = shirt; c.beginPath(); c.roundRect(-26, -20, 52, 62, 18); c.fill(); c.fillStyle = skin; c.beginPath(); c.arc(0, -45, 25, 0, Math.PI * 2); c.fill(); c.fillStyle = '#26313b'; c.beginPath(); c.arc(-8, -48, 3, 0, Math.PI * 2); c.arc(8, -48, 3, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#26313b'; c.lineWidth = 3; c.beginPath(); if (sad) {
        c.arc(0, -34, 8, Math.PI, Math.PI * 2);
    }
    else {
        c.arc(0, -39, 8, 0, Math.PI);
    } c.stroke(); c.restore(); }
    drawSquirrel(x, y, scale, active) { const c = this.ctx; c.save(); c.translate(x, y); c.scale(scale, scale); c.fillStyle = '#bd7a4a'; c.beginPath(); c.arc(0, -26, 34, 0, Math.PI * 2); c.fill(); c.beginPath(); c.ellipse(-35, 0, 28, 40, -.8, 0, Math.PI * 2); c.fill(); c.fillStyle = '#f0c89c'; c.beginPath(); c.ellipse(0, -20, 22, 18, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = '#222'; c.beginPath(); c.arc(-8, -29, 3, 0, Math.PI * 2); c.arc(8, -29, 3, 0, Math.PI * 2); c.fill(); if (active) {
        c.fillStyle = '#fff1a6';
        c.beginPath();
        c.arc(0, 18, 6, 0, Math.PI * 2);
        c.fill();
    } c.restore(); }
    drawTambourineDisk(x, y, pulse) { const c = this.ctx; c.save(); c.translate(x, y); c.scale(1 + pulse * .07, 1 + pulse * .07); c.fillStyle = '#f0bd45'; c.beginPath(); c.arc(0, 0, 35, 0, Math.PI * 2); c.fill(); c.fillStyle = '#422e2b'; c.beginPath(); c.arc(0, 0, 25, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#fff2b0'; c.lineWidth = 3; for (let i = 0; i < 6; i += 1) {
        const a = i * Math.PI / 3;
        c.beginPath();
        c.arc(Math.cos(a) * 34, Math.sin(a) * 34, 5, 0, Math.PI * 2);
        c.stroke();
    } c.restore(); }
    drawChairPerson(x, y, angle, player, sad) { const c = this.ctx; c.save(); c.translate(x, y); c.rotate(angle); c.fillStyle = player ? '#f1b45f' : '#6b8fc4'; c.beginPath(); c.roundRect(-22, -6, 44, 48, 12); c.fill(); c.fillStyle = '#313946'; c.fillRect(-30, 35, 60, 9); c.strokeStyle = '#313946'; c.lineWidth = 5; c.beginPath(); c.moveTo(0, 44); c.lineTo(-22, 62); c.moveTo(0, 44); c.lineTo(22, 62); c.stroke(); c.fillStyle = '#f0c7a4'; c.beginPath(); c.arc(0, -30, 21, 0, Math.PI * 2); c.fill(); c.fillStyle = '#26303a'; c.beginPath(); c.arc(-7, -33, 2.5, 0, Math.PI * 2); c.arc(7, -33, 2.5, 0, Math.PI * 2); c.fill(); if (sad) {
        c.strokeStyle = '#26303a';
        c.beginPath();
        c.arc(0, -20, 7, Math.PI, Math.PI * 2);
        c.stroke();
    } c.restore(); }
    drawPlane(x, y, flip) { const c = this.ctx; c.save(); c.translate(x, y); c.scale(flip, 1); c.fillStyle = '#f7dd79'; c.beginPath(); c.ellipse(0, 0, 34, 13, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = '#4c6f8f'; c.beginPath(); c.moveTo(-5, -4); c.lineTo(14, -30); c.lineTo(22, -3); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(-18, -5, 7, 0, Math.PI * 2); c.fill(); c.restore(); }
    drawSinger(x, y, open, player, sad) { const c = this.ctx; c.save(); c.translate(x, y); c.fillStyle = player ? '#f3cb71' : '#df8ca7'; c.beginPath(); c.roundRect(-28, -18, 56, 68, 20); c.fill(); c.fillStyle = '#f0c8a2'; c.beginPath(); c.arc(0, -42, 26, 0, Math.PI * 2); c.fill(); c.fillStyle = '#222'; c.beginPath(); c.arc(-8, -46, 3, 0, Math.PI * 2); c.arc(8, -46, 3, 0, Math.PI * 2); c.fill(); c.fillStyle = '#6d2a36'; if (open) {
        c.beginPath();
        c.ellipse(0, -30, 8, 12, 0, 0, Math.PI * 2);
        c.fill();
    }
    else {
        c.fillRect(-8, -30, 16, 3);
    } if (sad) {
        c.strokeStyle = '#333';
        c.beginPath();
        c.arc(0, -22, 7, Math.PI, Math.PI * 2);
        c.stroke();
    } c.restore(); }
    drawKarateGuy(x, y, pulse, sad) { const c = this.ctx; c.save(); c.translate(x, y); c.fillStyle = '#f5f2e8'; c.beginPath(); c.roundRect(-32, -85, 64, 90, 16); c.fill(); c.fillStyle = '#15191e'; c.fillRect(-34, -36, 68, 8); c.fillStyle = '#e4b590'; c.beginPath(); c.arc(0, -108, 25, 0, Math.PI * 2); c.fill(); c.fillStyle = '#20252b'; c.beginPath(); c.arc(-8, -110, 3, 0, Math.PI * 2); c.arc(8, -110, 3, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#e4b590'; c.lineWidth = 12; c.beginPath(); c.moveTo(22, -64); c.lineTo(75 + pulse * 20, -72); c.stroke(); if (sad) {
        c.font = '24px system-ui';
        c.fillText('💦', 18, -122);
    } c.restore(); }
    drawChampion(x, y, held, pulse, sad) { const c = this.ctx; c.save(); c.translate(x, y); c.fillStyle = '#ef8f51'; c.beginPath(); c.roundRect(-38, -92, 76, 98, 24); c.fill(); c.fillStyle = '#f1c3a0'; c.beginPath(); c.arc(0, -118, 27, 0, Math.PI * 2); c.fill(); c.fillStyle = '#20262c'; c.beginPath(); c.arc(-9, -120, 3, 0, Math.PI * 2); c.arc(9, -120, 3, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#ef8f51'; c.lineWidth = 14; c.beginPath(); if (held) {
        c.moveTo(-28, -70);
        c.lineTo(-72, -108);
        c.moveTo(28, -70);
        c.lineTo(72, -108);
    }
    else {
        c.moveTo(-28, -65);
        c.lineTo(-58, -40);
        c.moveTo(28, -65);
        c.lineTo(58, -40);
    } c.stroke(); if (pulse > .2) {
        c.font = '28px system-ui';
        c.fillText('✨', 42, -125);
    } if (sad) {
        c.font = '24px system-ui';
        c.fillText('?', 0, -145);
    } c.restore(); }
    drawReporter(x, y) { const c = this.ctx; c.save(); c.translate(x, y); c.fillStyle = '#536e8e'; c.beginPath(); c.roundRect(-26, -72, 52, 76, 18); c.fill(); c.fillStyle = '#eac4a5'; c.beginPath(); c.arc(0, -95, 23, 0, Math.PI * 2); c.fill(); c.fillStyle = '#222'; c.beginPath(); c.arc(-7, -97, 2.5, 0, Math.PI * 2); c.arc(7, -97, 2.5, 0, Math.PI * 2); c.fill(); c.restore(); }
    drawSamurai(x, y, held, pulse, sad) { const c = this.ctx; c.save(); c.translate(x, y); c.fillStyle = '#253440'; c.beginPath(); c.roundRect(-34, -86, 68, 88, 20); c.fill(); c.fillStyle = '#e8b893'; c.beginPath(); c.arc(0, -110, 24, 0, Math.PI * 2); c.fill(); c.fillStyle = '#111820'; c.fillRect(-23, -120, 46, 16); c.strokeStyle = '#dfe7e9'; c.lineWidth = 5; c.beginPath(); c.moveTo(held ? -48 : 22, -62); c.lineTo(held ? 48 : 86, -118 + pulse * 25); c.stroke(); if (sad) {
        c.font = '24px system-ui';
        c.fillText('💨', 12, -140);
    } c.restore(); }
    spawnParticles(time) { for (let i = 0; i < 18; i += 1) {
        const a = Math.PI * 2 * i / 18 + (i % 3) * .2;
        const speed = 1.4 + (i % 5) * .35;
        this.particles.push({ x: this.width * .5, y: this.height * .45, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed - 1.1, born: time, life: 560 + (i % 4) * 80, size: 3 + (i % 4) });
    } }
    drawParticles(time) { const c = this.ctx; this.particles = this.particles.filter(p => time - p.born < p.life); for (const p of this.particles) {
        const age = time - p.born;
        const u = age / p.life;
        c.globalAlpha = 1 - u;
        c.fillStyle = '#fff6a9';
        c.beginPath();
        c.arc(p.x + p.vx * age * .08, p.y + p.vy * age * .08 + age * age * .00012, p.size * (1 - u * .4), 0, Math.PI * 2);
        c.fill();
    } c.globalAlpha = 1; }
    cueBeforeTarget(s, targetBeat, maxGap) { let best; for (const cue of s.cues) {
        if (cue.beat > targetBeat)
            break;
        const gap = targetBeat - cue.beat;
        if (gap <= maxGap)
            best = cue;
    } return best; }
    nextTarget(targets, beat) { return targets.find(t => !t.judge && t.beat >= beat - .3); }
}
//# sourceMappingURL=renderer.js.map