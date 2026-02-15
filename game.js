// ============================================================
// NEON BLOCKS - Modern Tetris-Style Browser Game v2.0
// ============================================================

(() => {
"use strict";

// --- Constants ---
const COLS = 10;
const ROWS = 20;
const HIDDEN_ROWS = 2;
const TOTAL_ROWS = ROWS + HIDDEN_ROWS;
const BASE_CELL = 30;

// Dynamic cell size
let CELL = BASE_CELL;

const COLORS_NORMAL = {
    I: { fill: '#00f0ff', glow: 'rgba(0,240,255,0.6)', dark: '#006670', pattern: 'lines' },
    O: { fill: '#ffe600', glow: 'rgba(255,230,0,0.6)', dark: '#665c00', pattern: 'dots' },
    T: { fill: '#b000ff', glow: 'rgba(176,0,255,0.6)', dark: '#460066', pattern: 'cross' },
    S: { fill: '#00ff6a', glow: 'rgba(0,255,106,0.6)', dark: '#00662a', pattern: 'zigzag' },
    Z: { fill: '#ff0044', glow: 'rgba(255,0,68,0.6)', dark: '#660019', pattern: 'diamond' },
    J: { fill: '#0066ff', glow: 'rgba(0,102,255,0.6)', dark: '#002966', pattern: 'stripe' },
    L: { fill: '#ff6a00', glow: 'rgba(255,106,0,0.6)', dark: '#662a00', pattern: 'grid' },
};

const COLORS_COLORBLIND = {
    I: { fill: '#648FFF', glow: 'rgba(100,143,255,0.6)', dark: '#324880', pattern: 'lines' },
    O: { fill: '#FFB000', glow: 'rgba(255,176,0,0.6)', dark: '#805800', pattern: 'dots' },
    T: { fill: '#DC267F', glow: 'rgba(220,38,127,0.6)', dark: '#6E1340', pattern: 'cross' },
    S: { fill: '#FE6100', glow: 'rgba(254,97,0,0.6)', dark: '#7F3100', pattern: 'zigzag' },
    Z: { fill: '#785EF0', glow: 'rgba(120,94,240,0.6)', dark: '#3C2F78', pattern: 'diamond' },
    J: { fill: '#00B4D8', glow: 'rgba(0,180,216,0.6)', dark: '#005A6C', pattern: 'stripe' },
    L: { fill: '#FFD166', glow: 'rgba(255,209,102,0.6)', dark: '#806933', pattern: 'grid' },
};

let COLORS = COLORS_NORMAL;

const PIECES = {
    I: [
        [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
        [[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]],
        [[0,0,0,0],[0,0,0,0],[1,1,1,1],[0,0,0,0]],
        [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]],
    ],
    O: [[[1,1],[1,1]],[[1,1],[1,1]],[[1,1],[1,1]],[[1,1],[1,1]]],
    T: [
        [[0,1,0],[1,1,1],[0,0,0]],
        [[0,1,0],[0,1,1],[0,1,0]],
        [[0,0,0],[1,1,1],[0,1,0]],
        [[0,1,0],[1,1,0],[0,1,0]],
    ],
    S: [
        [[0,1,1],[1,1,0],[0,0,0]],
        [[0,1,0],[0,1,1],[0,0,1]],
        [[0,0,0],[0,1,1],[1,1,0]],
        [[1,0,0],[1,1,0],[0,1,0]],
    ],
    Z: [
        [[1,1,0],[0,1,1],[0,0,0]],
        [[0,0,1],[0,1,1],[0,1,0]],
        [[0,0,0],[1,1,0],[0,1,1]],
        [[0,1,0],[1,1,0],[1,0,0]],
    ],
    J: [
        [[1,0,0],[1,1,1],[0,0,0]],
        [[0,1,1],[0,1,0],[0,1,0]],
        [[0,0,0],[1,1,1],[0,0,1]],
        [[0,1,0],[0,1,0],[1,1,0]],
    ],
    L: [
        [[0,0,1],[1,1,1],[0,0,0]],
        [[0,1,0],[0,1,0],[0,1,1]],
        [[0,0,0],[1,1,1],[1,0,0]],
        [[1,1,0],[0,1,0],[0,1,0]],
    ],
};

const WALL_KICKS = {
    normal: [
        [[ 0, 0],[-1, 0],[-1, 1],[ 0,-2],[-1,-2]],
        [[ 0, 0],[ 1, 0],[ 1,-1],[ 0, 2],[ 1, 2]],
        [[ 0, 0],[ 1, 0],[ 1, 1],[ 0,-2],[ 1,-2]],
        [[ 0, 0],[-1, 0],[-1,-1],[ 0, 2],[-1, 2]],
    ],
    I: [
        [[ 0, 0],[-2, 0],[ 1, 0],[-2,-1],[ 1, 2]],
        [[ 0, 0],[-1, 0],[ 2, 0],[-1, 2],[ 2,-1]],
        [[ 0, 0],[ 2, 0],[-1, 0],[ 2, 1],[-1,-2]],
        [[ 0, 0],[ 1, 0],[-2, 0],[ 1,-2],[-2, 1]],
    ],
};

const LINE_SCORES = [0, 100, 300, 500, 800];
const TSPIN_SCORES = { none: 0, mini: 100, full: 400, miniSingle: 200, single: 800, double: 1200, triple: 1600 };
const COMBO_BONUS = 50;
const SOFT_DROP_SCORE = 1;
const HARD_DROP_SCORE = 2;

const MODE_DESCRIPTIONS = {
    classic: 'Endloser Modus - Spiele bis zum Ende!',
    sprint: 'Schaffe 40 Lines so schnell wie moeglich!',
    ultra: '2 Minuten - Maximaler Score!',
};

function getDropInterval(level) {
    const speeds = [800,720,630,550,470,380,300,220,150,100,80,65,50,40,30,25,20,15,10,8,5];
    return speeds[Math.min(level - 1, speeds.length - 1)];
}

// --- Settings Manager ---
class SettingsManager {
    constructor() {
        this.defaults = { volume: 30, sfx: true, music: true, ghost: true, colorblind: false, haptic: true };
        this.settings = { ...this.defaults };
        this.load();
    }

    load() {
        try {
            const saved = JSON.parse(localStorage.getItem('neonblocks_settings'));
            if (saved) Object.assign(this.settings, saved);
        } catch(e) {}
    }

    save() {
        localStorage.setItem('neonblocks_settings', JSON.stringify(this.settings));
    }

    get(key) { return this.settings[key]; }

    set(key, value) {
        this.settings[key] = value;
        this.save();
    }

    toggle(key) {
        this.settings[key] = !this.settings[key];
        this.save();
        return this.settings[key];
    }
}

// --- Audio Engine ---
class AudioEngine {
    constructor(settings) {
        this.ctx = null;
        this.settings = settings;
        this.masterGain = null;
        this.musicGain = null;
        this.musicPlaying = false;
        this.musicNodes = [];
    }

    init() {
        if (this.ctx) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = this.settings.get('volume') / 100;
            this.masterGain.connect(this.ctx.destination);
            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.value = 0.15;
            this.musicGain.connect(this.masterGain);
        } catch(e) {}
    }

    setVolume(vol) {
        if (this.masterGain) this.masterGain.gain.value = vol / 100;
    }

    play(type) {
        if (!this.settings.get('sfx') || !this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);

        switch(type) {
            case 'move':
                osc.type = 'sine'; osc.frequency.setValueAtTime(300 + Math.random() * 40, now);
                gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                osc.start(now); osc.stop(now + 0.05); break;
            case 'rotate':
                osc.type = 'sine'; osc.frequency.setValueAtTime(500, now);
                osc.frequency.exponentialRampToValueAtTime(700, now + 0.08);
                gain.gain.setValueAtTime(0.15, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                osc.start(now); osc.stop(now + 0.08); break;
            case 'drop':
                osc.type = 'triangle'; osc.frequency.setValueAtTime(200, now);
                osc.frequency.exponentialRampToValueAtTime(60, now + 0.15);
                gain.gain.setValueAtTime(0.25, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                osc.start(now); osc.stop(now + 0.15); break;
            case 'lock':
                osc.type = 'square'; osc.frequency.setValueAtTime(150, now);
                gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                osc.start(now); osc.stop(now + 0.1); break;
            case 'clear': {
                osc.type = 'sine'; osc.frequency.setValueAtTime(400, now);
                osc.frequency.exponentialRampToValueAtTime(800, now + 0.2);
                gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                osc.start(now); osc.stop(now + 0.25);
                const osc2 = this.ctx.createOscillator(); const gain2 = this.ctx.createGain();
                osc2.connect(gain2); gain2.connect(this.masterGain);
                osc2.type = 'sine'; osc2.frequency.setValueAtTime(600, now + 0.05);
                osc2.frequency.exponentialRampToValueAtTime(1200, now + 0.25);
                gain2.gain.setValueAtTime(0.15, now + 0.05); gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                osc2.start(now + 0.05); osc2.stop(now + 0.3); break;
            }
            case 'tetris': {
                [523, 659, 784, 1047].forEach((freq, i) => {
                    const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
                    o.connect(g); g.connect(this.masterGain); o.type = 'sine';
                    o.frequency.setValueAtTime(freq, now + i * 0.08);
                    g.gain.setValueAtTime(0.2, now + i * 0.08); g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.2);
                    o.start(now + i * 0.08); o.stop(now + i * 0.08 + 0.2);
                }); break;
            }
            case 'tspin': {
                osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, now);
                osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
                osc.frequency.exponentialRampToValueAtTime(900, now + 0.2);
                gain.gain.setValueAtTime(0.15, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                osc.start(now); osc.stop(now + 0.3); break;
            }
            case 'hold':
                osc.type = 'sine'; osc.frequency.setValueAtTime(440, now);
                osc.frequency.setValueAtTime(550, now + 0.05);
                gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                osc.start(now); osc.stop(now + 0.1); break;
            case 'gameover': {
                [400, 350, 300, 200, 150].forEach((freq, i) => {
                    const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
                    o.connect(g); g.connect(this.masterGain); o.type = 'sawtooth';
                    o.frequency.setValueAtTime(freq, now + i * 0.15);
                    g.gain.setValueAtTime(0.15, now + i * 0.15); g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.3);
                    o.start(now + i * 0.15); o.stop(now + i * 0.15 + 0.3);
                }); break;
            }
            case 'levelup': {
                [523, 659, 784, 1047, 1319].forEach((freq, i) => {
                    const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
                    o.connect(g); g.connect(this.masterGain); o.type = 'triangle';
                    o.frequency.setValueAtTime(freq, now + i * 0.07);
                    g.gain.setValueAtTime(0.2, now + i * 0.07); g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.15);
                    o.start(now + i * 0.07); o.stop(now + i * 0.07 + 0.15);
                }); break;
            }
            case 'countdown':
                osc.type = 'sine'; osc.frequency.setValueAtTime(880, now);
                gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                osc.start(now); osc.stop(now + 0.15); break;
            case 'countdownGo':
                osc.type = 'sine'; osc.frequency.setValueAtTime(1320, now);
                gain.gain.setValueAtTime(0.25, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                osc.start(now); osc.stop(now + 0.25); break;
        }
    }

    startMusic() {
        if (!this.ctx || !this.settings.get('music') || this.musicPlaying) return;
        this.musicPlaying = true;
        this._playMusicLoop();
    }

    _playMusicLoop() {
        if (!this.musicPlaying || !this.ctx) return;
        const now = this.ctx.currentTime;
        const bpm = 128;
        const beatLen = 60 / bpm;

        // Synthwave bass line
        const bassNotes = [65.41, 73.42, 82.41, 73.42, 65.41, 82.41, 98.00, 82.41]; // C2-ish
        const loopLen = bassNotes.length * beatLen;

        bassNotes.forEach((freq, i) => {
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.connect(g); g.connect(this.musicGain);
            o.type = 'sawtooth';
            o.frequency.setValueAtTime(freq, now + i * beatLen);
            g.gain.setValueAtTime(0.12, now + i * beatLen);
            g.gain.setValueAtTime(0.08, now + i * beatLen + beatLen * 0.5);
            g.gain.setValueAtTime(0.001, now + i * beatLen + beatLen * 0.95);
            o.start(now + i * beatLen);
            o.stop(now + i * beatLen + beatLen);
            this.musicNodes.push(o);
        });

        // Pad
        const padO = this.ctx.createOscillator();
        const padG = this.ctx.createGain();
        padO.connect(padG); padG.connect(this.musicGain);
        padO.type = 'sine';
        padO.frequency.setValueAtTime(261.63, now);
        padG.gain.setValueAtTime(0.04, now);
        padO.start(now); padO.stop(now + loopLen);
        this.musicNodes.push(padO);

        this._musicTimeout = setTimeout(() => this._playMusicLoop(), loopLen * 1000 - 50);
    }

    stopMusic() {
        this.musicPlaying = false;
        clearTimeout(this._musicTimeout);
        this.musicNodes.forEach(n => { try { n.stop(); } catch(e) {} });
        this.musicNodes = [];
    }
}

// --- Particle System ---
class Particle {
    constructor(x, y, color, type = 'square') {
        this.x = x; this.y = y;
        this.vx = (Math.random() - 0.5) * (type === 'spark' ? 10 : 6);
        this.vy = (Math.random() - 0.5) * (type === 'spark' ? 10 : 6) - 2;
        this.life = 1;
        this.decay = type === 'spark' ? 0.03 + Math.random() * 0.03 : 0.015 + Math.random() * 0.02;
        this.size = type === 'spark' ? 1 + Math.random() * 2 : 2 + Math.random() * 3;
        this.color = color; this.type = type;
    }

    update() {
        this.x += this.vx; this.y += this.vy;
        this.vy += 0.1; this.life -= this.decay; this.size *= 0.98;
    }

    draw(ctx) {
        if (this.life <= 0) return;
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = this.type === 'spark' ? 10 : 6;
        if (this.type === 'spark') {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
        }
        ctx.restore();
    }
}

class ParticleSystem {
    constructor() { this.particles = []; this.MAX = 400; }

    emit(x, y, color, count = 15, type = 'square') {
        for (let i = 0; i < count && this.particles.length < this.MAX; i++) {
            this.particles.push(new Particle(x, y, color, type));
        }
    }

    emitLine(row, color) {
        for (let col = 0; col < COLS; col++) {
            this.emit(col * CELL + CELL/2, (row - HIDDEN_ROWS) * CELL + CELL/2, color, 4);
            this.emit(col * CELL + CELL/2, (row - HIDDEN_ROWS) * CELL + CELL/2, '#fff', 2, 'spark');
        }
    }

    update() { this.particles = this.particles.filter(p => { p.update(); return p.life > 0; }); }
    draw(ctx) { this.particles.forEach(p => p.draw(ctx)); }
}

// --- Line Clear Animation ---
class LineClearAnimation {
    constructor(rows) { this.rows = rows; this.progress = 0; this.duration = 20; this.done = false; }
    update() { this.progress++; if (this.progress >= this.duration) this.done = true; }
    getAlpha() { return 1 - (this.progress / this.duration); }
    getFlash() { return this.progress < 6 ? (1 - this.progress / 6) * 0.8 : 0; }
}

// --- Confetti System ---
class ConfettiSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.active = false;
    }

    burst(count = 60) {
        this.active = true;
        const w = this.canvas.width, h = this.canvas.height;
        const colors = ['#00f0ff','#ff00aa','#ffe600','#00ff6a','#b000ff','#ff6a00'];
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: w/2 + (Math.random()-0.5) * w * 0.3,
                y: h * 0.3,
                vx: (Math.random()-0.5) * 12,
                vy: -Math.random() * 10 - 4,
                size: 3 + Math.random() * 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random()-0.5) * 0.3,
                life: 1,
                decay: 0.008 + Math.random() * 0.008,
            });
        }
    }

    update() {
        if (!this.active) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.particles = this.particles.filter(p => {
            p.x += p.vx; p.y += p.vy; p.vy += 0.2;
            p.rotation += p.rotSpeed; p.life -= p.decay;
            if (p.life <= 0) return false;
            this.ctx.save();
            this.ctx.globalAlpha = p.life;
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate(p.rotation);
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size * 0.6);
            this.ctx.restore();
            return true;
        });
        if (this.particles.length === 0) { this.active = false; this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); }
    }
}

// --- Bag Randomizer ---
class BagRandomizer {
    constructor() { this.bag = []; this.types = Object.keys(PIECES); }
    next() {
        if (this.bag.length === 0) {
            this.bag = [...this.types];
            for (let i = this.bag.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
            }
        }
        return this.bag.pop();
    }
}

// --- Main Game ---
class NeonBlocks {
    constructor() {
        this.settingsManager = new SettingsManager();
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        this.bgCanvas = document.getElementById('bg-canvas');
        this.bgCtx = this.bgCanvas.getContext('2d');

        this.confettiCanvas = document.getElementById('confetti-canvas');
        this.confetti = new ConfettiSystem(this.confettiCanvas);

        this.audio = new AudioEngine(this.settingsManager);
        this.particles = new ParticleSystem();
        this.randomizer = new BagRandomizer();

        // Game mode
        this.gameMode = 'classic';
        this.modeTimer = 0;
        this.modeStartTime = 0;
        this.sprintTarget = 40;
        this.ultraDuration = 120000; // 2 minutes

        // State
        this.grid = [];
        this.currentPiece = null;
        this.holdPiece = null;
        this.holdUsed = false;
        this.nextPieces = [];
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.combo = -1;
        this.maxCombo = 0;
        this.tspinCount = 0;
        this.tetrisCount = 0;
        this.backToBack = false;
        this.gameState = 'start';
        this.lastDrop = 0;
        this.lockDelay = 0;
        this.lockMoves = 0;
        this.MAX_LOCK_MOVES = 15;
        this.LOCK_DELAY = 500;
        this.lastTspin = 'none';
        this.lineClearAnim = null;
        this.screenShake = 0;
        this.screenShakeIntensity = 0;
        this.levelUpFlash = 0;
        this.dangerPulse = 0;
        this.spawnAlpha = 1;

        // Player
        this.playerName = '';

        // DAS / ARR
        this.das = 133;
        this.arr = 10;
        this.keys = {};
        this.dasTimer = {};
        this.arrTimer = {};

        // Mobile detect
        this.isMobile = /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent) || window.innerWidth <= 768;

        // Move settings button into HUD on mobile
        if (this.isMobile || window.innerWidth <= 768) {
            const settingsBtn = document.getElementById('settings-btn');
            const hudSlot = document.getElementById('hud-settings-slot');
            if (settingsBtn && hudSlot) {
                hudSlot.appendChild(settingsBtn);
            }
        }

        // High scores
        this.highScores = JSON.parse(localStorage.getItem('neonblocks_scores_v2') || '[]');
        const oldScores = JSON.parse(localStorage.getItem('neonblocks_scores') || '[]');
        if (oldScores.length > 0 && this.highScores.length === 0) {
            this.highScores = oldScores.map(s => typeof s === 'number' ? { name: '???', score: s, level: 1, lines: 0 } : s);
            localStorage.setItem('neonblocks_scores_v2', JSON.stringify(this.highScores));
        }

        // Restore player name
        this.playerName = localStorage.getItem('neonblocks_player') || '';
        const nameInput = document.getElementById('player-name-input');
        if (this.playerName) nameInput.value = this.playerName;

        // Apply settings
        this.applyColorblind();

        // Background
        this.bgStars = [];
        this.initBackground();

        // Calculate dynamic cell size
        this.calculateCellSize();

        this.setupControls();
        this.setupMobileControls();
        this.setupSwipeControls();
        this.setupSettings();
        this.setupModeSelector();
        this.setupMobileLeaderboard();
        this.updateHighScoreDisplay();
        this.resizeBg();

        // Focus
        setTimeout(() => nameInput.focus(), 100);

        this.lastTime = 0;
        this.animFrame = requestAnimationFrame(t => this.loop(t));

        // Resize handler
        window.addEventListener('resize', () => { this.calculateCellSize(); this.resizeBg(); });
        window.addEventListener('orientationchange', () => { setTimeout(() => { this.calculateCellSize(); this.resizeBg(); }, 200); });

        // Recalculate after layout is fully settled (for mobile controls height)
        setTimeout(() => { this.calculateCellSize(); }, 300);
        setTimeout(() => { this.calculateCellSize(); }, 600);
    }

    // --- Dynamic Cell Sizing ---
    calculateCellSize() {
        const vh = window.innerHeight;
        const vw = window.innerWidth;
        const isMob = vw <= 768;

        let availH, availW;
        if (isMob) {
            // Measure actual controls/hud height, with generous fallbacks
            const controlsEl = document.getElementById('mobile-controls');
            const hudEl = document.getElementById('mobile-hud');
            const lbEl = document.getElementById('mobile-leaderboard');
            const controlsH = (controlsEl && controlsEl.offsetHeight > 0) ? controlsEl.offsetHeight : 200;
            const hudH = (hudEl && hudEl.offsetHeight > 0) ? hudEl.offsetHeight : 55;
            const lbH = (lbEl && lbEl.offsetHeight > 0) ? lbEl.offsetHeight : 30;
            const safeMargin = 20;

            // Account for safe areas
            const safeTop = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-top')) || 0;
            const safeBottom = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-bottom')) || 0;

            availH = vh - hudH - controlsH - lbH - safeMargin - safeTop - safeBottom;
            availW = vw - 16; // 8px padding each side

            // Update game-wrapper padding to account for controls
            const wrapper = document.getElementById('game-wrapper');
            if (wrapper) {
                wrapper.style.paddingTop = (hudH + 5) + 'px';
                wrapper.style.paddingBottom = (controlsH + lbH + 5) + 'px';
            }
        } else {
            availH = vh - 60;
            availW = vw * 0.4;
        }

        const cellFromH = Math.floor(availH / ROWS);
        const cellFromW = Math.floor(availW / COLS);
        CELL = Math.max(10, Math.min(BASE_CELL, cellFromH, cellFromW));

        this.canvas.width = COLS * CELL;
        this.canvas.height = ROWS * CELL;

        // Resize confetti canvas
        this.confettiCanvas.width = this.canvas.width;
        this.confettiCanvas.height = this.canvas.height;
    }

    // --- Colorblind ---
    applyColorblind() {
        COLORS = this.settingsManager.get('colorblind') ? COLORS_COLORBLIND : COLORS_NORMAL;
    }

    // --- Settings Panel ---
    setupSettings() {
        const panel = document.getElementById('settings-panel');
        const overlay = document.getElementById('settings-overlay');
        const btn = document.getElementById('settings-btn');
        const closeBtn = document.getElementById('settings-close');

        const openSettings = (e) => {
            e.preventDefault();
            e.stopPropagation();
            panel.classList.add('open');
            overlay.classList.add('open');
            if (this.gameState === 'playing') this.togglePause();
        };
        const closeSettings = (e) => {
            e.preventDefault();
            e.stopPropagation();
            panel.classList.remove('open');
            overlay.classList.remove('open');
        };

        // Use both touch and click for reliable mobile support
        btn.addEventListener('touchend', openSettings, { passive: false });
        btn.addEventListener('click', openSettings);
        closeBtn.addEventListener('touchend', closeSettings, { passive: false });
        closeBtn.addEventListener('click', closeSettings);
        overlay.addEventListener('touchend', closeSettings, { passive: false });
        overlay.addEventListener('click', closeSettings);

        // Volume slider - works with both touch drag and click
        const volSlider = document.getElementById('volume-slider');
        volSlider.value = this.settingsManager.get('volume');
        const handleVolume = () => {
            const val = parseInt(volSlider.value);
            this.settingsManager.set('volume', val);
            this.audio.setVolume(val);
        };
        volSlider.addEventListener('input', handleVolume);
        volSlider.addEventListener('change', handleVolume);

        // Toggle switches - use touchend + click with dedup
        document.querySelectorAll('.toggle-switch').forEach(el => {
            const setting = el.dataset.setting;
            if (this.settingsManager.get(setting)) el.classList.add('active');
            else el.classList.remove('active');

            let lastToggleTime = 0;
            const handleToggle = (e) => {
                e.preventDefault();
                e.stopPropagation();
                // Debounce to prevent double-fire from touch+click
                const now = Date.now();
                if (now - lastToggleTime < 300) return;
                lastToggleTime = now;

                const newVal = this.settingsManager.toggle(setting);
                el.classList.toggle('active', newVal);
                if (setting === 'colorblind') this.applyColorblind();
                if (setting === 'music') {
                    if (newVal && this.gameState === 'playing') this.audio.startMusic();
                    else this.audio.stopMusic();
                }
                this.haptic(5);
            };

            el.addEventListener('touchend', handleToggle, { passive: false });
            el.addEventListener('click', handleToggle);
        });
    }

    // --- Mode Selector ---
    setupModeSelector() {
        const modeDesc = document.getElementById('mode-desc');
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.gameMode = btn.dataset.mode;
                modeDesc.textContent = MODE_DESCRIPTIONS[this.gameMode];
            });
        });
    }

    // --- Background ---
    initBackground() {
        for (let i = 0; i < 60; i++) {
            this.bgStars.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                size: Math.random() * 2 + 0.5,
                speed: Math.random() * 0.3 + 0.1,
                alpha: Math.random() * 0.5 + 0.2,
            });
        }
    }

    resizeBg() {
        this.bgCanvas.width = window.innerWidth;
        this.bgCanvas.height = window.innerHeight;
    }

    drawBackground() {
        const ctx = this.bgCtx;
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);

        ctx.strokeStyle = 'rgba(0, 240, 255, 0.03)';
        ctx.lineWidth = 1;
        const gs = 40;
        for (let x = 0; x < this.bgCanvas.width; x += gs) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.bgCanvas.height); ctx.stroke();
        }
        for (let y = 0; y < this.bgCanvas.height; y += gs) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.bgCanvas.width, y); ctx.stroke();
        }

        this.bgStars.forEach(star => {
            star.y += star.speed;
            if (star.y > this.bgCanvas.height) { star.y = 0; star.x = Math.random() * this.bgCanvas.width; }
            ctx.beginPath();
            ctx.fillStyle = `rgba(0, 240, 255, ${star.alpha})`;
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    // --- Grid ---
    createGrid() {
        this.grid = Array.from({ length: TOTAL_ROWS }, () => Array(COLS).fill(null));
    }

    getDangerLevel() {
        for (let row = HIDDEN_ROWS; row < TOTAL_ROWS; row++) {
            if (this.grid[row].some(c => c !== null)) {
                const heightFromTop = row - HIDDEN_ROWS;
                if (heightFromTop <= 4) return 2;
                if (heightFromTop <= 8) return 1;
                return 0;
            }
        }
        return 0;
    }

    // --- Pieces ---
    spawnPiece(type) {
        if (!type) type = this.nextPieces.shift();
        while (this.nextPieces.length < 5) this.nextPieces.push(this.randomizer.next());

        const shape = PIECES[type][0];
        const piece = { type, rotation: 0, shape, x: Math.floor((COLS - shape[0].length) / 2), y: 0 };

        let firstBlockRow = 0;
        for (let r = 0; r < shape.length; r++) { if (shape[r].some(c => c)) { firstBlockRow = r; break; } }
        piece.y = HIDDEN_ROWS - firstBlockRow;

        if (!this.isValid(piece)) {
            piece.y--;
            if (!this.isValid(piece)) { this.gameOver(); return null; }
        }

        this.currentPiece = piece;
        this.lockDelay = 0;
        this.lockMoves = 0;
        this.lastTspin = 'none';
        this.holdUsed = false;
        this.spawnAlpha = 0;
        this.updateNextDisplay();
        return piece;
    }

    isValid(piece, shape, x, y) {
        shape = shape || piece.shape;
        x = x !== undefined ? x : piece.x;
        y = y !== undefined ? y : piece.y;

        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const newX = x + col;
                    const newY = y + row;
                    if (newX < 0 || newX >= COLS || newY >= TOTAL_ROWS) return false;
                    if (newY >= 0 && this.grid[newY] && this.grid[newY][newX]) return false;
                }
            }
        }
        return true;
    }

    movePiece(dx, dy) {
        const p = this.currentPiece;
        if (!p) return false;
        if (this.isValid(p, p.shape, p.x + dx, p.y + dy)) {
            p.x += dx; p.y += dy;
            if (dx !== 0) { this.lastTspin = 'none'; this.resetLockDelay(); }
            if (dx !== 0) this.audio.play('move');
            return true;
        }
        return false;
    }

    rotatePiece(dir = 1) {
        const p = this.currentPiece;
        if (!p || p.type === 'O') return false;

        // Handle 180° rotation
        if (dir === 2) {
            const oldRot = p.rotation;
            const newRot = (oldRot + 2) % 4;
            const newShape = PIECES[p.type][newRot];
            // Try at current position first, then basic kicks
            const kicks = [[0,0],[0,1],[0,-1],[1,0],[-1,0]];
            for (const [kx, ky] of kicks) {
                if (this.isValid(p, newShape, p.x + kx, p.y + ky)) {
                    p.x += kx; p.y += ky; p.rotation = newRot; p.shape = newShape;
                    this.resetLockDelay(); this.audio.play('rotate');
                    return true;
                }
            }
            return false;
        }

        const oldRot = p.rotation;
        const newRot = (oldRot + dir + 4) % 4;
        const newShape = PIECES[p.type][newRot];
        const kicks = p.type === 'I' ? WALL_KICKS.I : WALL_KICKS.normal;
        const kickIdx = dir === 1 ? oldRot : newRot;
        const kickTests = kicks[kickIdx];
        const sign = dir === 1 ? 1 : -1;

        for (const [kx, ky] of kickTests) {
            const testX = p.x + kx * sign;
            const testY = p.y - ky * sign;
            if (this.isValid(p, newShape, testX, testY)) {
                p.x = testX; p.y = testY; p.rotation = newRot; p.shape = newShape;
                this.checkTspin(p); this.resetLockDelay(); this.audio.play('rotate');
                return true;
            }
        }
        return false;
    }

    checkTspin(piece) {
        if (piece.type !== 'T') { this.lastTspin = 'none'; return; }
        const cx = piece.x + 1, cy = piece.y + 1;
        const corners = [[cx-1,cy-1],[cx+1,cy-1],[cx-1,cy+1],[cx+1,cy+1]];
        let filled = 0;
        corners.forEach(([x, y]) => {
            if (x < 0 || x >= COLS || y >= TOTAL_ROWS || (y >= 0 && this.grid[y] && this.grid[y][x])) filled++;
        });
        if (filled >= 3) {
            const fc = this.getTFrontCorners(piece);
            const ff = fc.filter(([x, y]) => x < 0 || x >= COLS || y >= TOTAL_ROWS || (y >= 0 && this.grid[y] && this.grid[y][x])).length;
            this.lastTspin = ff === 2 ? 'full' : 'mini';
        } else { this.lastTspin = 'none'; }
    }

    getTFrontCorners(piece) {
        const cx = piece.x + 1, cy = piece.y + 1;
        switch (piece.rotation) {
            case 0: return [[cx-1,cy-1],[cx+1,cy-1]];
            case 1: return [[cx+1,cy-1],[cx+1,cy+1]];
            case 2: return [[cx-1,cy+1],[cx+1,cy+1]];
            case 3: return [[cx-1,cy-1],[cx-1,cy+1]];
        }
    }

    resetLockDelay() {
        if (this.lockMoves < this.MAX_LOCK_MOVES) { this.lockDelay = 0; this.lockMoves++; }
    }

    hardDrop() {
        const p = this.currentPiece;
        if (!p) return;
        let cells = 0;
        while (this.isValid(p, p.shape, p.x, p.y + 1)) { p.y++; cells++; }
        this.score += cells * HARD_DROP_SCORE;

        for (let row = 0; row < p.shape.length; row++) {
            for (let col = 0; col < p.shape[row].length; col++) {
                if (p.shape[row][col]) {
                    const px = (p.x + col) * CELL + CELL/2;
                    for (let trail = 0; trail < Math.min(cells, 6); trail++) {
                        const py = (p.y + row - HIDDEN_ROWS - trail) * CELL + CELL/2;
                        this.particles.emit(px, py, COLORS[p.type].glow, 1, 'spark');
                    }
                }
            }
        }

        this.audio.play('drop');
        this.haptic(10);
        this.lockPiece();
    }

    softDrop() {
        if (this.movePiece(0, 1)) {
            this.score += SOFT_DROP_SCORE;
            this.lastDrop = performance.now();
            this.updateUI();
            return true;
        }
        return false;
    }

    getGhostY() {
        const p = this.currentPiece;
        if (!p) return 0;
        let gy = p.y;
        while (this.isValid(p, p.shape, p.x, gy + 1)) gy++;
        return gy;
    }

    holdCurrentPiece() {
        if (this.holdUsed || !this.currentPiece) return;
        this.audio.play('hold');
        this.haptic(5);
        const type = this.currentPiece.type;
        if (this.holdPiece) { const held = this.holdPiece; this.holdPiece = type; this.spawnPiece(held); }
        else { this.holdPiece = type; this.spawnPiece(); }
        this.holdUsed = true;
        this.updateHoldDisplay();
    }

    lockPiece() {
        const p = this.currentPiece;
        if (!p) return;

        for (let row = 0; row < p.shape.length; row++) {
            for (let col = 0; col < p.shape[row].length; col++) {
                if (p.shape[row][col]) {
                    const gy = p.y + row, gx = p.x + col;
                    if (gy >= 0 && gy < TOTAL_ROWS && gx >= 0 && gx < COLS) this.grid[gy][gx] = p.type;
                }
            }
        }

        for (let row = 0; row < p.shape.length; row++) {
            for (let col = 0; col < p.shape[row].length; col++) {
                if (p.shape[row][col]) {
                    const px = (p.x + col) * CELL + CELL/2;
                    const py = (p.y + row - HIDDEN_ROWS) * CELL + CELL/2;
                    this.particles.emit(px, py, COLORS[p.type].glow, 2);
                }
            }
        }

        this.audio.play('lock');

        const clearedRows = this.checkLines();
        this.processScoring(clearedRows);
        this.currentPiece = null;

        if (clearedRows.length > 0) {
            this.lineClearAnim = new LineClearAnimation(clearedRows);
        } else {
            this.spawnPiece();
        }
    }

    checkLines() {
        const full = [];
        for (let row = 0; row < TOTAL_ROWS; row++) {
            if (this.grid[row] && this.grid[row].every(cell => cell !== null)) full.push(row);
        }
        return full;
    }

    clearLines(rows) {
        rows.forEach(row => {
            const firstColor = this.grid[row].find(c => c);
            const color = COLORS[firstColor] || COLORS.I;
            this.particles.emitLine(row, color.fill);
        });
        rows.sort((a, b) => a - b);
        for (const row of rows.reverse()) this.grid.splice(row, 1);
        while (this.grid.length < TOTAL_ROWS) this.grid.unshift(Array(COLS).fill(null));
    }

    processScoring(clearedRows) {
        const numLines = clearedRows.length;
        if (numLines === 0) { this.combo = -1; this.updateComboDisplay(); return; }

        this.combo++;
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;

        let points = 0;
        const isTetris = numLines === 4;
        const isTspin = this.lastTspin !== 'none';

        if (isTspin) {
            this.tspinCount++;
            if (this.lastTspin === 'mini') { points = numLines === 0 ? TSPIN_SCORES.mini : TSPIN_SCORES.miniSingle; }
            else { points = [0, TSPIN_SCORES.single, TSPIN_SCORES.double, TSPIN_SCORES.triple][numLines] || 0; }
            this.audio.play('tspin');
            this.showScorePopup('T-SPIN!', '#b000ff');
            this.screenShake = 10; this.screenShakeIntensity = 4;
            this.haptic(30);
        } else {
            points = LINE_SCORES[numLines] || 0;
        }

        if (isTetris) {
            this.tetrisCount++; this.audio.play('tetris');
            this.showScorePopup('TETRIS!', '#00f0ff');
            this.screenShake = 12; this.screenShakeIntensity = 6;
            this.haptic(50);
        } else if (numLines > 0 && !isTspin) {
            this.audio.play('clear');
            this.haptic(15);
            if (numLines >= 2) { this.screenShake = 6; this.screenShakeIntensity = 3; }
        }

        if ((isTetris || isTspin) && this.backToBack) {
            points = Math.floor(points * 1.5);
            this.showScorePopup('BACK-TO-BACK!', '#ffe600');
        }
        this.backToBack = isTetris || isTspin;

        if (this.combo > 0) {
            points += COMBO_BONUS * this.combo * this.level;
            this.showScorePopup(`${this.combo}x COMBO`, '#ff6a00');
        }

        points *= this.level;
        this.score += points;
        this.lines += numLines;

        // Sprint check
        if (this.gameMode === 'sprint' && this.lines >= this.sprintTarget) {
            this.gameOver(true);
            return;
        }

        const newLevel = Math.floor(this.lines / 10) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.audio.play('levelup');
            this.showScorePopup(`LEVEL ${this.level}!`, '#00ff6a');
            this.levelUpFlash = 20;
        }

        this.updateUI();
        this.updateComboDisplay();
    }

    showScorePopup(text, color) {
        const container = document.getElementById('game-container');
        const el = document.createElement('div');
        el.className = 'score-popup'; el.textContent = text; el.style.color = color;
        el.style.left = (20 + Math.random() * 60) + '%';
        el.style.top = (30 + Math.random() * 20) + '%';
        el.style.transform = 'translateX(-50%)';
        container.appendChild(el);
        setTimeout(() => el.remove(), 1200);
    }

    // --- Haptic Feedback ---
    haptic(ms = 10) {
        if (this.settingsManager.get('haptic') && navigator.vibrate) {
            try { navigator.vibrate(ms); } catch(e) {}
        }
    }

    // --- Countdown ---
    startCountdown(callback) {
        const display = document.getElementById('countdown-display');
        let count = 3;
        display.classList.add('visible');

        const tick = () => {
            if (count > 0) {
                display.textContent = count;
                display.style.fontSize = '80px';
                this.audio.play('countdown');
                count--;
                setTimeout(tick, 700);
            } else {
                display.textContent = 'GO!';
                display.style.fontSize = '60px';
                this.audio.play('countdownGo');
                setTimeout(() => {
                    display.classList.remove('visible');
                    display.textContent = '';
                    callback();
                }, 500);
            }
        };
        tick();
    }

    // --- Game Over ---
    gameOver(isWin = false) {
        this.gameState = 'gameover';
        this.audio.stopMusic();

        if (!isWin) this.audio.play('gameover');

        const elapsed = Date.now() - this.modeStartTime;
        const isNewHighscore = this.highScores.length < 10 || this.score > (this.highScores[this.highScores.length - 1]?.score || 0);

        this.highScores.push({
            name: this.playerName || '???',
            score: this.score,
            level: this.level,
            lines: this.lines,
            mode: this.gameMode,
            time: elapsed,
        });
        this.highScores.sort((a, b) => b.score - a.score);
        this.highScores = this.highScores.slice(0, 10);
        localStorage.setItem('neonblocks_scores_v2', JSON.stringify(this.highScores));
        this.updateHighScoreDisplay();

        document.getElementById('final-score').textContent = this.score.toLocaleString();
        document.getElementById('final-level').textContent = this.level;
        document.getElementById('final-lines').textContent = this.lines;
        document.getElementById('final-tspins').textContent = this.tspinCount;
        document.getElementById('final-tetrises').textContent = this.tetrisCount;
        document.getElementById('final-combo').textContent = this.maxCombo;

        // Show time for sprint/ultra
        if (this.gameMode !== 'classic') {
            document.getElementById('final-time-label').style.display = '';
            document.getElementById('final-time').style.display = '';
            const secs = Math.floor(elapsed / 1000);
            const ms = elapsed % 1000;
            document.getElementById('final-time').textContent = `${Math.floor(secs/60)}:${(secs%60).toString().padStart(2,'0')}.${ms.toString().padStart(3,'0').slice(0,2)}`;
        } else {
            document.getElementById('final-time-label').style.display = 'none';
            document.getElementById('final-time').style.display = 'none';
        }

        const hsMsg = document.getElementById('new-highscore-msg');
        if (isNewHighscore && this.score > 0) {
            hsMsg.style.display = 'block';
            this.confetti.burst(80);
        } else {
            hsMsg.style.display = 'none';
        }

        // Sprint win message
        if (isWin && this.gameMode === 'sprint') {
            document.getElementById('gameover-overlay').querySelector('h2').textContent = 'GESCHAFFT!';
        } else {
            document.getElementById('gameover-overlay').querySelector('h2').textContent = 'GAME OVER';
        }

        document.getElementById('gameover-overlay').classList.remove('hidden');
    }

    // --- Share ---
    shareScore() {
        const modeLabel = { classic: 'Classic', sprint: 'Sprint', ultra: 'Ultra' }[this.gameMode];
        const text = `NEON BLOCKS ${modeLabel}\nScore: ${this.score.toLocaleString()} | Level ${this.level} | ${this.lines} Lines\nSpiel es selbst: https://fabiansp77.github.io/neon-blocks/`;

        if (navigator.share) {
            navigator.share({ title: 'NEON BLOCKS Score', text }).catch(() => {});
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                const btn = document.getElementById('share-btn');
                btn.textContent = '\u2713 KOPIERT!';
                setTimeout(() => { btn.innerHTML = '&#128279; SCORE TEILEN'; }, 2000);
            }).catch(() => {});
        }
    }

    // --- Start / Restart ---
    startGame() {
        const nameInput = document.getElementById('player-name-input');
        this.playerName = (nameInput.value || '').trim().toUpperCase().slice(0, 10) || 'ANONYM';
        localStorage.setItem('neonblocks_player', this.playerName);
        document.getElementById('player-name-display').textContent = this.playerName;

        this.audio.init();

        document.getElementById('start-overlay').classList.add('hidden');
        document.getElementById('gameover-overlay').classList.add('hidden');
        document.getElementById('pause-overlay').classList.add('hidden');

        // Countdown then start
        this.gameState = 'countdown';
        this.startCountdown(() => {
            this._initGameState();
            this.gameState = 'playing';
            this.lastDrop = performance.now();
            this.modeStartTime = Date.now();
            this.audio.startMusic();
            this.canvas.focus();
        });
    }

    _initGameState() {
        this.createGrid();
        this.currentPiece = null;
        this.holdPiece = null;
        this.holdUsed = false;
        this.nextPieces = [];
        this.score = 0; this.level = 1; this.lines = 0;
        this.combo = -1; this.maxCombo = 0;
        this.tspinCount = 0; this.tetrisCount = 0;
        this.backToBack = false; this.lastTspin = 'none';
        this.lineClearAnim = null;
        this.screenShake = 0; this.levelUpFlash = 0;
        this.randomizer = new BagRandomizer();
        this.particles = new ParticleSystem();

        for (let i = 0; i < 5; i++) this.nextPieces.push(this.randomizer.next());
        this.spawnPiece();
        this.updateUI();
        this.updateHoldDisplay();
        this.updateComboDisplay();
        document.getElementById('tspin-count').textContent = '0';
        document.getElementById('tetris-count').textContent = '0';
        document.getElementById('max-combo').textContent = '0';
        document.getElementById('mode-timer').textContent = '';
    }

    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.audio.stopMusic();
            document.getElementById('pause-overlay').classList.remove('hidden');
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.lastDrop = performance.now();
            this.audio.startMusic();
            document.getElementById('pause-overlay').classList.add('hidden');
        }
    }

    // --- Controls ---
    setupControls() {
        const nameInput = document.getElementById('player-name-input');
        const startBtn = document.getElementById('start-btn');
        const resumeBtn = document.getElementById('resume-btn');
        const shareBtn = document.getElementById('share-btn');

        const updateStartBtn = () => { startBtn.disabled = nameInput.value.trim().length === 0; };
        nameInput.addEventListener('input', updateStartBtn);
        updateStartBtn();

        nameInput.addEventListener('keydown', e => {
            if (e.key === 'Enter' && nameInput.value.trim().length > 0) {
                e.preventDefault();
                if (this.gameState === 'start' || this.gameState === 'gameover') this.startGame();
            }
        });

        document.addEventListener('keydown', e => {
            if (document.activeElement === nameInput && this.gameState === 'start') return;
            if (e.repeat && ['ArrowUp','x','z',' ','c','a'].includes(e.key.toLowerCase())) return;

            if (this.gameState === 'gameover' && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault(); this.startGame(); return;
            }

            if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
                if (this.gameState === 'playing' || this.gameState === 'paused') {
                    e.preventDefault(); this.togglePause();
                }
                return;
            }

            if (this.gameState !== 'playing') return;

            switch(e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    if (!this.keys['ArrowLeft']) { this.movePiece(-1, 0); this.dasTimer['ArrowLeft'] = performance.now(); }
                    this.keys['ArrowLeft'] = true; break;
                case 'ArrowRight':
                    e.preventDefault();
                    if (!this.keys['ArrowRight']) { this.movePiece(1, 0); this.dasTimer['ArrowRight'] = performance.now(); }
                    this.keys['ArrowRight'] = true; break;
                case 'ArrowDown':
                    e.preventDefault(); this.keys['ArrowDown'] = true; this.softDrop(); break;
                case 'ArrowUp': case 'x': case 'X':
                    e.preventDefault(); this.rotatePiece(1); break;
                case 'z': case 'Z': case 'Control':
                    e.preventDefault(); this.rotatePiece(-1); break;
                case 'a': case 'A':
                    e.preventDefault(); this.rotatePiece(2); break;
                case ' ':
                    e.preventDefault(); this.hardDrop(); break;
                case 'c': case 'C': case 'Shift':
                    e.preventDefault(); this.holdCurrentPiece(); break;
            }
        });

        document.addEventListener('keyup', e => {
            this.keys[e.key] = false;
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                delete this.dasTimer[e.key];
                if (e.key === 'ArrowLeft' && this.keys['ArrowRight']) { this.dasTimer['ArrowRight'] = performance.now(); }
                else if (e.key === 'ArrowRight' && this.keys['ArrowLeft']) { this.dasTimer['ArrowLeft'] = performance.now(); }
            }
        });

        startBtn.addEventListener('click', () => { if (nameInput.value.trim().length > 0) this.startGame(); });
        document.getElementById('restart-btn').addEventListener('click', () => this.startGame());
        resumeBtn.addEventListener('click', () => this.togglePause());
        shareBtn.addEventListener('click', () => this.shareScore());
    }

    setupMobileControls() {
        const repeatActions = { left: -1, right: 1 };
        let repeatTimers = {};

        document.querySelectorAll('.mobile-btn').forEach(btn => {
            const action = btn.dataset.action;

            const startAction = (e) => {
                e.preventDefault();
                btn.classList.add('pressed');

                if (action === 'pause') {
                    if (this.gameState === 'playing' || this.gameState === 'paused') this.togglePause();
                    return;
                }

                if (this.gameState !== 'playing') return;
                this.haptic(5);

                switch(action) {
                    case 'left': this.movePiece(-1, 0); break;
                    case 'right': this.movePiece(1, 0); break;
                    case 'down': this.softDrop(); break;
                    case 'rotate': this.rotatePiece(1); break;
                    case 'rotate180': this.rotatePiece(2); break;
                    case 'drop': this.hardDrop(); break;
                    case 'hold': this.holdCurrentPiece(); break;
                }

                // Auto-repeat for left/right/down
                if (action in repeatActions || action === 'down') {
                    clearInterval(repeatTimers[action]);
                    const dasDelay = setTimeout(() => {
                        repeatTimers[action] = setInterval(() => {
                            if (this.gameState !== 'playing') return;
                            if (action === 'down') this.softDrop();
                            else this.movePiece(repeatActions[action], 0);
                        }, this.arr);
                    }, this.das);
                    repeatTimers[action + '_das'] = dasDelay;
                }
            };

            const stopAction = (e) => {
                e.preventDefault();
                btn.classList.remove('pressed');
                clearInterval(repeatTimers[action]);
                clearTimeout(repeatTimers[action + '_das']);
            };

            btn.addEventListener('touchstart', startAction, { passive: false });
            btn.addEventListener('touchend', stopAction, { passive: false });
            btn.addEventListener('touchcancel', stopAction, { passive: false });
            btn.addEventListener('mousedown', startAction);
            btn.addEventListener('mouseup', stopAction);
            btn.addEventListener('mouseleave', stopAction);
        });
    }

    setupSwipeControls() {
        let touchStartX = 0, touchStartY = 0, touchStartTime = 0;
        let lastMoveX = 0;

        this.canvas.addEventListener('touchstart', (e) => {
            if (this.gameState !== 'playing') return;
            const t = e.touches[0];
            touchStartX = t.clientX; touchStartY = t.clientY;
            touchStartTime = Date.now();
            lastMoveX = touchStartX;
        }, { passive: true });

        this.canvas.addEventListener('touchmove', (e) => {
            if (this.gameState !== 'playing') return;
            e.preventDefault();
            const t = e.touches[0];
            const dx = t.clientX - lastMoveX;
            const threshold = CELL * 0.8;

            if (Math.abs(dx) > threshold) {
                this.movePiece(dx > 0 ? 1 : -1, 0);
                lastMoveX = t.clientX;
            }

            const dy = t.clientY - touchStartY;
            if (dy > CELL * 2) { this.softDrop(); touchStartY = t.clientY; }
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            if (this.gameState !== 'playing') return;
            const elapsed = Date.now() - touchStartTime;
            const t = e.changedTouches[0];
            const dy = t.clientY - touchStartY;
            const dx = Math.abs(t.clientX - touchStartX);

            if (elapsed < 250 && dx < 25 && Math.abs(dy) < 25) {
                this.rotatePiece(1);
            } else if (dy < -CELL * 2 && elapsed < 500) {
                this.hardDrop();
            }
        }, { passive: true });
    }

    handleDAS(now) {
        if (this.gameState !== 'playing') return;
        ['ArrowLeft', 'ArrowRight'].forEach(key => {
            if (this.keys[key] && this.dasTimer[key]) {
                const elapsed = now - this.dasTimer[key];
                if (elapsed >= this.das) {
                    if (!this.arrTimer[key] || now - this.arrTimer[key] >= this.arr) {
                        this.movePiece(key === 'ArrowLeft' ? -1 : 1, 0);
                        this.arrTimer[key] = now;
                    }
                }
            }
        });
        if (this.keys['ArrowDown']) this.softDrop();
    }

    // --- UI Updates ---
    updateUI() {
        const scoreStr = this.score.toLocaleString();
        document.getElementById('score-display').textContent = scoreStr;
        document.getElementById('level-display').textContent = this.level;
        document.getElementById('lines-display').textContent = this.lines;
        document.getElementById('tspin-count').textContent = this.tspinCount;
        document.getElementById('tetris-count').textContent = this.tetrisCount;
        document.getElementById('max-combo').textContent = this.maxCombo;

        // Mobile HUD
        const hudScore = document.getElementById('hud-score');
        const hudLevel = document.getElementById('hud-level');
        const hudLines = document.getElementById('hud-lines');
        if (hudScore) hudScore.textContent = scoreStr;
        if (hudLevel) hudLevel.textContent = this.level;
        if (hudLines) hudLines.textContent = this.lines;
    }

    updateComboDisplay() {
        const el = document.getElementById('combo-display');
        el.textContent = this.combo > 0 ? `${this.combo}x COMBO` : '';
    }

    updateModeTimer() {
        if (this.gameState !== 'playing') return;
        const elapsed = Date.now() - this.modeStartTime;
        const timerEl = document.getElementById('mode-timer');

        if (this.gameMode === 'sprint') {
            const secs = Math.floor(elapsed / 1000);
            const ms = Math.floor((elapsed % 1000) / 10);
            timerEl.textContent = `${Math.floor(secs/60)}:${(secs%60).toString().padStart(2,'0')}.${ms.toString().padStart(2,'0')}`;
            timerEl.style.color = '#00ff6a';
        } else if (this.gameMode === 'ultra') {
            const remaining = Math.max(0, this.ultraDuration - elapsed);
            if (remaining <= 0) { this.gameOver(); return; }
            const secs = Math.floor(remaining / 1000);
            const ms = Math.floor((remaining % 1000) / 10);
            timerEl.textContent = `${Math.floor(secs/60)}:${(secs%60).toString().padStart(2,'0')}.${ms.toString().padStart(2,'0')}`;
            timerEl.style.color = remaining < 10000 ? '#ff0044' : remaining < 30000 ? '#ffe600' : '#00ff6a';
        } else {
            timerEl.textContent = '';
        }
    }

    updateHighScoreDisplay() {
        // Update both desktop and mobile leaderboards
        const lists = [
            document.getElementById('highscore-list'),
            document.getElementById('mobile-highscore-list')
        ];

        lists.forEach(list => {
            if (!list) return;
            list.innerHTML = '';
            if (this.highScores.length === 0) {
                list.innerHTML = '<li><span style="color:rgba(255,255,255,0.3)">Noch keine Scores</span></li>';
                return;
            }
            this.highScores.slice(0, 10).forEach((entry, i) => {
                const li = document.createElement('li');
                const name = typeof entry === 'object' ? entry.name : '???';
                const score = typeof entry === 'object' ? entry.score : entry;
                const level = typeof entry === 'object' ? (entry.level || '-') : '-';
                const lines = typeof entry === 'object' ? (entry.lines || '-') : '-';
                li.innerHTML = `<span class="hs-rank">#${i + 1}</span><span class="hs-name">${this.escapeHtml(name)}</span><span class="hs-score">${score.toLocaleString()}</span>`;
                list.appendChild(li);
            });
        });
    }

    setupMobileLeaderboard() {
        const toggle = document.getElementById('lb-toggle');
        const lb = document.getElementById('mobile-leaderboard');
        if (!toggle || !lb) return;

        const handleToggle = (e) => {
            e.preventDefault();
            e.stopPropagation();
            lb.classList.toggle('expanded');
        };
        toggle.addEventListener('touchend', handleToggle, { passive: false });
        toggle.addEventListener('click', handleToggle);
    }

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // --- Preview Canvases ---
    drawPiecePreview(canvasId, type, cellSize) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (!type) return;
        const cs = cellSize || 20;
        const shape = PIECES[type][0], color = COLORS[type];
        const ox = (canvas.width - shape[0].length * cs) / 2;
        const oy = (canvas.height - shape.length * cs) / 2;
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) this.drawCell(ctx, ox + col * cs, oy + row * cs, cs, color, 1);
            }
        }
    }

    updateHoldDisplay() {
        this.drawPiecePreview('hold-canvas', this.holdPiece);
        this.drawPiecePreview('hud-hold', this.holdPiece, 8);
    }

    updateNextDisplay() {
        for (let i = 0; i < 3; i++) this.drawPiecePreview(`next-${i}`, this.nextPieces[i]);
        this.drawPiecePreview('hud-next', this.nextPieces[0], 8);
    }

    // --- Rendering ---
    drawCell(ctx, x, y, size, color, alpha = 1) {
        ctx.save();
        ctx.globalAlpha = alpha;

        // Base fill
        ctx.fillStyle = color.fill;
        ctx.shadowColor = color.glow;
        ctx.shadowBlur = size > 14 ? 8 : 4;
        ctx.fillRect(x + 1, y + 1, size - 2, size - 2);

        // Gradient overlay
        ctx.shadowBlur = 0;
        const grad = ctx.createLinearGradient(x, y, x, y + size);
        grad.addColorStop(0, 'rgba(255,255,255,0.25)');
        grad.addColorStop(0.5, 'rgba(255,255,255,0.05)');
        grad.addColorStop(1, 'rgba(0,0,0,0.15)');
        ctx.fillStyle = grad;
        ctx.fillRect(x + 2, y + 2, size - 4, size - 4);

        // Border
        ctx.strokeStyle = color.glow;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 1.5, y + 1.5, size - 3, size - 3);

        // Colorblind patterns
        if (this.settingsManager.get('colorblind') && size >= 14) {
            ctx.globalAlpha = alpha * 0.4;
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            const cx = x + size/2, cy = y + size/2;
            const s4 = size/4;
            switch(color.pattern) {
                case 'lines':
                    ctx.beginPath(); ctx.moveTo(x+3, cy); ctx.lineTo(x+size-3, cy); ctx.stroke(); break;
                case 'dots':
                    ctx.beginPath(); ctx.arc(cx, cy, 2, 0, Math.PI*2); ctx.stroke(); break;
                case 'cross':
                    ctx.beginPath(); ctx.moveTo(cx-s4, cy); ctx.lineTo(cx+s4, cy); ctx.moveTo(cx, cy-s4); ctx.lineTo(cx, cy+s4); ctx.stroke(); break;
                case 'zigzag':
                    ctx.beginPath(); ctx.moveTo(x+3, cy+2); ctx.lineTo(cx, cy-2); ctx.lineTo(x+size-3, cy+2); ctx.stroke(); break;
                case 'diamond':
                    ctx.beginPath(); ctx.moveTo(cx, cy-s4); ctx.lineTo(cx+s4, cy); ctx.lineTo(cx, cy+s4); ctx.lineTo(cx-s4, cy); ctx.closePath(); ctx.stroke(); break;
                case 'stripe':
                    ctx.beginPath(); ctx.moveTo(x+3, y+3); ctx.lineTo(x+size-3, y+size-3); ctx.stroke(); break;
                case 'grid':
                    ctx.beginPath(); ctx.moveTo(cx, y+3); ctx.lineTo(cx, y+size-3); ctx.moveTo(x+3, cy); ctx.lineTo(x+size-3, cy); ctx.stroke(); break;
            }
        }

        ctx.restore();
    }

    drawGrid() {
        const ctx = this.ctx;
        if (!this.grid || this.grid.length === 0) return;

        // Grid lines
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 0.5;
        for (let x = 0; x <= COLS; x++) { ctx.beginPath(); ctx.moveTo(x*CELL, 0); ctx.lineTo(x*CELL, ROWS*CELL); ctx.stroke(); }
        for (let y = 0; y <= ROWS; y++) { ctx.beginPath(); ctx.moveTo(0, y*CELL); ctx.lineTo(COLS*CELL, y*CELL); ctx.stroke(); }

        // Danger zone pulse
        const danger = this.getDangerLevel();
        if (danger > 0) {
            this.dangerPulse += 0.05;
            const pulseAlpha = (Math.sin(this.dangerPulse * 3) + 1) * 0.5;
            const dangerColor = danger === 2 ? `rgba(255,0,68,${pulseAlpha * 0.15})` : `rgba(255,106,0,${pulseAlpha * 0.08})`;
            const dangerHeight = danger === 2 ? ROWS * CELL * 0.3 : ROWS * CELL * 0.15;
            const dGrad = ctx.createLinearGradient(0, 0, 0, dangerHeight);
            dGrad.addColorStop(0, dangerColor);
            dGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = dGrad;
            ctx.fillRect(0, 0, COLS * CELL, dangerHeight);
        }

        // Line clear flash
        if (this.lineClearAnim) {
            const flash = this.lineClearAnim.getFlash();
            if (flash > 0) {
                this.lineClearAnim.rows.forEach(row => {
                    ctx.fillStyle = `rgba(255,255,255,${flash})`;
                    ctx.fillRect(0, (row - HIDDEN_ROWS) * CELL, COLS * CELL, CELL);
                });
            }
        }

        // Placed blocks
        for (let row = HIDDEN_ROWS; row < TOTAL_ROWS; row++) {
            if (!this.grid[row]) continue;
            for (let col = 0; col < COLS; col++) {
                const cell = this.grid[row][col];
                if (cell) {
                    let alpha = 1;
                    if (this.lineClearAnim && this.lineClearAnim.rows.includes(row)) alpha = this.lineClearAnim.getAlpha();
                    this.drawCell(ctx, col * CELL, (row - HIDDEN_ROWS) * CELL, CELL, COLORS[cell], alpha);
                }
            }
        }
    }

    drawCurrentPiece() {
        const p = this.currentPiece;
        if (!p) return;
        const ctx = this.ctx, color = COLORS[p.type];

        // Spawn fade-in
        if (this.spawnAlpha < 1) this.spawnAlpha = Math.min(1, this.spawnAlpha + 0.1);

        // Ghost piece
        if (this.settingsManager.get('ghost')) {
            const ghostY = this.getGhostY();
            if (ghostY !== p.y) {
                for (let row = 0; row < p.shape.length; row++) {
                    for (let col = 0; col < p.shape[row].length; col++) {
                        if (p.shape[row][col]) {
                            const drawY = (ghostY + row - HIDDEN_ROWS) * CELL;
                            const drawX = (p.x + col) * CELL;
                            if (drawY >= 0) {
                                ctx.save();
                                ctx.globalAlpha = 0.18;
                                ctx.fillStyle = color.fill;
                                ctx.fillRect(drawX + 2, drawY + 2, CELL - 4, CELL - 4);
                                ctx.globalAlpha = 0.35;
                                ctx.strokeStyle = color.fill;
                                ctx.lineWidth = 1;
                                ctx.setLineDash([3, 3]);
                                ctx.strokeRect(drawX + 2, drawY + 2, CELL - 4, CELL - 4);
                                ctx.setLineDash([]);
                                ctx.restore();
                            }
                        }
                    }
                }
            }
        }

        // Active piece
        for (let row = 0; row < p.shape.length; row++) {
            for (let col = 0; col < p.shape[row].length; col++) {
                if (p.shape[row][col]) {
                    const drawY = (p.y + row - HIDDEN_ROWS) * CELL;
                    const drawX = (p.x + col) * CELL;
                    if (drawY >= -CELL) this.drawCell(ctx, drawX, drawY, CELL, color, this.spawnAlpha);
                }
            }
        }
    }

    // --- Main Loop ---
    loop(time) {
        const dt = time - this.lastTime;
        this.lastTime = time;
        this.drawBackground();

        if (this.gameState === 'playing') {
            this.handleDAS(time);

            const interval = getDropInterval(this.level);
            if (time - this.lastDrop >= interval) {
                if (!this.movePiece(0, 1)) {
                    this.lockDelay += interval;
                    if (this.lockDelay >= this.LOCK_DELAY) this.lockPiece();
                } else { this.lockDelay = 0; }
                this.lastDrop = time;
            }

            if (this.currentPiece && !this.isValid(this.currentPiece, this.currentPiece.shape, this.currentPiece.x, this.currentPiece.y + 1)) {
                this.lockDelay += dt;
                if (this.lockDelay >= this.LOCK_DELAY) this.lockPiece();
            }

            if (this.lineClearAnim) {
                this.lineClearAnim.update();
                if (this.lineClearAnim.done) {
                    this.clearLines(this.lineClearAnim.rows);
                    this.lineClearAnim = null;
                    this.spawnPiece();
                }
            }

            this.updateModeTimer();
            // LIVE UI update every frame
            this.updateUI();
        }

        if (this.screenShake > 0) this.screenShake--;
        if (this.levelUpFlash > 0) this.levelUpFlash--;
        this.particles.update();
        this.confetti.update();
        this.render();
        this.animFrame = requestAnimationFrame(t => this.loop(t));
    }

    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.save();

        if (this.screenShake > 0) {
            ctx.translate((Math.random()-0.5)*this.screenShakeIntensity, (Math.random()-0.5)*this.screenShakeIntensity);
        }

        ctx.fillStyle = 'rgba(5, 5, 15, 0.95)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.levelUpFlash > 0) {
            const flashAlpha = (this.levelUpFlash / 20) * 0.2;
            ctx.fillStyle = `rgba(0, 255, 106, ${flashAlpha})`;
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        this.drawGrid();

        if (this.gameState === 'playing' || this.gameState === 'paused') {
            this.drawCurrentPiece();
        }

        ctx.restore();
        this.particles.draw(ctx);

        // Border glow
        ctx.save();
        const borderGrad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        borderGrad.addColorStop(0, 'rgba(0, 240, 255, 0.1)');
        borderGrad.addColorStop(0.5, 'rgba(176, 0, 255, 0.05)');
        borderGrad.addColorStop(1, 'rgba(255, 0, 170, 0.1)');
        ctx.strokeStyle = borderGrad;
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.restore();
    }
}

// --- Initialize ---
window.addEventListener('DOMContentLoaded', () => { new NeonBlocks(); });

})();
