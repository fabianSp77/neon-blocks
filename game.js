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
const MIN_CELL = 10;

// Dynamic cell size
let CELL = BASE_CELL;

// Timing constants
const DEFAULT_DAS = 133;    // Delayed Auto Shift (ms)
const DEFAULT_ARR = 10;     // Auto Repeat Rate (ms)
const MAX_LOCK_MOVES = 15;
const LOCK_DELAY_MS = 500;
const SPAWN_FADE_SPEED = 0.1;

// Game mode constants
const SPRINT_TARGET = 40;
const ULTRA_DURATION_MS = 120000;   // 2 minutes
const LINES_PER_LEVEL = 10;

// Visual constants
const BG_STAR_COUNT = 60;
const BG_GRID_SPACING = 40;
const MAX_PLAYER_NAME_LENGTH = 10;
const DEFAULT_PLAYER_NAME = 'ANONYM';
const COUNTDOWN_START = 3;

// Layout constants
const MOBILE_BREAKPOINT = 768;
const MOBILE_PADDING = 16;

// Score animation
const SCORE_LERP_SPEED = 0.15;   // How fast the displayed score catches up

// Perfect Clear bonus
const PERFECT_CLEAR_BONUS = 3000;

// Level color themes (hue shifts for background/border glow)
const LEVEL_THEMES = [
    { bg: [0, 240, 255],  accent: [0, 240, 255],  name: 'Cyan' },       // Level 1-4
    { bg: [100, 0, 255],  accent: [176, 0, 255],   name: 'Purple' },     // Level 5-8
    { bg: [255, 0, 170],  accent: [255, 0, 170],   name: 'Pink' },       // Level 9-12
    { bg: [255, 68, 0],   accent: [255, 106, 0],   name: 'Orange' },     // Level 13-16
    { bg: [255, 215, 0],  accent: [255, 230, 0],   name: 'Gold' },       // Level 17-20
    { bg: [255, 255, 255], accent: [255, 255, 255], name: 'Platinum' },   // Level 21+
];

// Achievement definitions
const ACHIEVEMENTS = {
    firstClear:   { id: 'firstClear',   label: 'FIRST BLOOD',     desc: 'Erste Linie!', icon: '\u{1F525}' },
    firstTetris:  { id: 'firstTetris',  label: 'TETRIS!',         desc: 'Erster Tetris!', icon: '\u{1F4A5}' },
    firstTspin:   { id: 'firstTspin',   label: 'T-SPIN MASTER',   desc: 'Erster T-Spin!', icon: '\u{1F300}' },
    combo5:       { id: 'combo5',       label: '5x COMBO',        desc: '5er Combo!', icon: '\u{26A1}' },
    combo10:      { id: 'combo10',      label: '10x COMBO',       desc: '10er Combo!', icon: '\u{1F525}\u{1F525}' },
    level5:       { id: 'level5',       label: 'AUFWAERMEN',      desc: 'Level 5 erreicht!', icon: '\u{2B50}' },
    level10:      { id: 'level10',      label: 'SPEED DEMON',     desc: 'Level 10 erreicht!', icon: '\u{1F47F}' },
    level15:      { id: 'level15',      label: 'UNSTOPPABLE',     desc: 'Level 15 erreicht!', icon: '\u{1F451}' },
    perfectClear: { id: 'perfectClear', label: 'PERFECT CLEAR',   desc: 'Board komplett leer!', icon: '\u{2728}' },
    backToBack3:  { id: 'backToBack3',  label: 'BACK-TO-BACK x3', desc: '3x Back-to-Back!', icon: '\u{1F4AB}' },
    score50k:     { id: 'score50k',     label: '50K CLUB',        desc: '50.000 Punkte!', icon: '\u{1F3C6}' },
    score100k:    { id: 'score100k',    label: '100K LEGEND',     desc: '100.000 Punkte!', icon: '\u{1F48E}' },
};

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
    vs: 'Lokal 1v1 - Wer ueberlebt gewinnt!',
    online: 'Online 1v1 - Spiele gegen einen Freund!',
};

// VS mode board gap
const VS_GAP = 3; // cells between boards

const DROP_SPEEDS = [800,720,630,550,470,380,300,220,150,100,80,65,50,40,30,25,20,15,10,8,5];

/** @param {number} level - Current game level (1-based) */
function getDropInterval(level) {
    const clampedLevel = Math.max(1, Math.min(level, DROP_SPEEDS.length));
    return DROP_SPEEDS[clampedLevel - 1];
}

// --- Settings Manager ---
class SettingsManager {
    constructor() {
        this.defaults = { volume: 30, sfx: true, music: true, ghost: true, colorblind: false, haptic: true, das: DEFAULT_DAS, arr: DEFAULT_ARR, startLevel: 1 };
        this.settings = { ...this.defaults };
        this.load();
    }

    load() {
        try {
            const saved = JSON.parse(localStorage.getItem('neonblocks_settings'));
            if (saved) Object.assign(this.settings, saved);
        } catch(e) {
            console.warn('Failed to load settings from localStorage:', e.message);
        }
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

// --- Lifetime Statistics ---
class LifetimeStats {
    constructor() {
        this.data = { games: 0, lines: 0, score: 0, tetrises: 0, tspins: 0, playtime: 0, bestScore: 0, bestLines: 0, bestLevel: 0 };
        this.load();
    }

    load() {
        try {
            const saved = JSON.parse(localStorage.getItem('neonblocks_lifetime'));
            if (saved) Object.assign(this.data, saved);
        } catch(e) { /* ignore */ }
    }

    save() {
        localStorage.setItem('neonblocks_lifetime', JSON.stringify(this.data));
    }

    record(stats) {
        this.data.games++;
        this.data.lines += stats.lines || 0;
        this.data.score += stats.score || 0;
        this.data.tetrises += stats.tetrises || 0;
        this.data.tspins += stats.tspins || 0;
        this.data.playtime += stats.playtime || 0;
        if (stats.score > this.data.bestScore) this.data.bestScore = stats.score;
        if (stats.lines > this.data.bestLines) this.data.bestLines = stats.lines;
        if (stats.level > this.data.bestLevel) this.data.bestLevel = stats.level;
        this.save();
    }

    get(key) { return this.data[key]; }
}

// --- Key Mapper ---
class KeyMapper {
    constructor() {
        this.defaults = {
            moveLeft: 'ArrowLeft',
            moveRight: 'ArrowRight',
            softDrop: 'ArrowDown',
            hardDrop: ' ',
            rotateCW: 'ArrowUp',
            rotateCCW: 'z',
            rotate180: 'a',
            hold: 'c',
        };
        this.bindings = { ...this.defaults };
        this.load();
        // Reverse map: physical key -> action
        this._buildReverseMap();
    }

    load() {
        try {
            const saved = JSON.parse(localStorage.getItem('neonblocks_keybinds'));
            if (saved) Object.assign(this.bindings, saved);
        } catch(e) { /* ignore */ }
    }

    save() {
        localStorage.setItem('neonblocks_keybinds', JSON.stringify(this.bindings));
        this._buildReverseMap();
    }

    _buildReverseMap() {
        this.reverseMap = {};
        for (const [action, key] of Object.entries(this.bindings)) {
            this.reverseMap[key] = action;
            // Also map uppercase for letter keys
            if (key.length === 1 && key.match(/[a-z]/i)) {
                this.reverseMap[key.toLowerCase()] = action;
                this.reverseMap[key.toUpperCase()] = action;
            }
        }
        // Extra binds that always work (non-remappable alternatives)
        if (!this.reverseMap['x'] && !this.reverseMap['X']) {
            this.reverseMap['x'] = 'rotateCW';
            this.reverseMap['X'] = 'rotateCW';
        }
        if (!this.reverseMap['Control']) this.reverseMap['Control'] = 'rotateCCW';
        if (!this.reverseMap['Shift']) this.reverseMap['Shift'] = 'hold';
    }

    getAction(key) {
        return this.reverseMap[key] || null;
    }

    set(action, key) {
        // Remove any other action bound to this key
        for (const [a, k] of Object.entries(this.bindings)) {
            if (k === key && a !== action) this.bindings[a] = '';
        }
        this.bindings[action] = key;
        this.save();
    }

    reset() {
        this.bindings = { ...this.defaults };
        this.save();
    }

    getKeyLabel(key) {
        const labels = {
            'ArrowLeft': '\u2190', 'ArrowRight': '\u2192', 'ArrowUp': '\u2191', 'ArrowDown': '\u2193',
            ' ': 'Space', 'Control': 'Ctrl', 'Shift': 'Shift', 'Enter': 'Enter',
        };
        return labels[key] || (key.length === 1 ? key.toUpperCase() : key);
    }
}

// --- Audio Engine ---
class AudioEngine {
    constructor(settings) {
        this.audioCtx = null;
        this.settings = settings;
        this.masterGain = null;
        this.musicGain = null;
        this.musicPlaying = false;
        this.musicNodes = [];
    }

    init() {
        if (this.audioCtx) return;
        try {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioCtx.createGain();
            this.masterGain.gain.value = this.settings.get('volume') / 100;
            this.masterGain.connect(this.audioCtx.destination);
            this.musicGain = this.audioCtx.createGain();
            this.musicGain.gain.value = 0.15;
            this.musicGain.connect(this.masterGain);
        } catch(e) {
            console.warn('AudioContext initialization failed:', e.message);
        }
    }

    setVolume(vol) {
        if (this.masterGain) this.masterGain.gain.value = vol / 100;
    }

    play(type) {
        if (!this.settings.get('sfx') || !this.audioCtx) return;
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
        const now = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
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
                const osc2 = this.audioCtx.createOscillator(); const gain2 = this.audioCtx.createGain();
                osc2.connect(gain2); gain2.connect(this.masterGain);
                osc2.type = 'sine'; osc2.frequency.setValueAtTime(600, now + 0.05);
                osc2.frequency.exponentialRampToValueAtTime(1200, now + 0.25);
                gain2.gain.setValueAtTime(0.15, now + 0.05); gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                osc2.start(now + 0.05); osc2.stop(now + 0.3); break;
            }
            case 'tetris': {
                [523, 659, 784, 1047].forEach((freq, i) => {
                    const o = this.audioCtx.createOscillator(); const g = this.audioCtx.createGain();
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
                    const o = this.audioCtx.createOscillator(); const g = this.audioCtx.createGain();
                    o.connect(g); g.connect(this.masterGain); o.type = 'sawtooth';
                    o.frequency.setValueAtTime(freq, now + i * 0.15);
                    g.gain.setValueAtTime(0.15, now + i * 0.15); g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.3);
                    o.start(now + i * 0.15); o.stop(now + i * 0.15 + 0.3);
                }); break;
            }
            case 'levelup': {
                [523, 659, 784, 1047, 1319].forEach((freq, i) => {
                    const o = this.audioCtx.createOscillator(); const g = this.audioCtx.createGain();
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
            case 'perfectClear': {
                // Triumphant ascending arpeggio
                [523, 659, 784, 1047, 1319, 1568].forEach((freq, i) => {
                    const o = this.audioCtx.createOscillator(); const g = this.audioCtx.createGain();
                    o.connect(g); g.connect(this.masterGain); o.type = 'sine';
                    o.frequency.setValueAtTime(freq, now + i * 0.06);
                    g.gain.setValueAtTime(0.25, now + i * 0.06); g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.3);
                    o.start(now + i * 0.06); o.stop(now + i * 0.06 + 0.3);
                }); break;
            }
            case 'achievement': {
                // Short celebratory chime
                [880, 1100, 1320].forEach((freq, i) => {
                    const o = this.audioCtx.createOscillator(); const g = this.audioCtx.createGain();
                    o.connect(g); g.connect(this.masterGain); o.type = 'triangle';
                    o.frequency.setValueAtTime(freq, now + i * 0.1);
                    g.gain.setValueAtTime(0.15, now + i * 0.1); g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.2);
                    o.start(now + i * 0.1); o.stop(now + i * 0.1 + 0.2);
                }); break;
            }
            case 'impact': {
                // Heavy thud for hard drop
                osc.type = 'sine'; osc.frequency.setValueAtTime(80, now);
                osc.frequency.exponentialRampToValueAtTime(30, now + 0.12);
                gain.gain.setValueAtTime(0.3, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
                osc.start(now); osc.stop(now + 0.12);
                // White noise burst
                const noiseOsc = this.audioCtx.createOscillator(); const noiseGain = this.audioCtx.createGain();
                noiseOsc.connect(noiseGain); noiseGain.connect(this.masterGain);
                noiseOsc.type = 'sawtooth'; noiseOsc.frequency.setValueAtTime(40, now);
                noiseGain.gain.setValueAtTime(0.08, now); noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                noiseOsc.start(now); noiseOsc.stop(now + 0.08); break;
            }
        }
    }

    /** Set danger level to adjust music tempo. 0=normal, 1=tense, 2=critical */
    setDangerLevel(level) {
        this._dangerLevel = level;
    }

    startMusic() {
        if (!this.audioCtx || !this.settings.get('music') || this.musicPlaying) return;
        this.musicPlaying = true;
        this._dangerLevel = 0;
        this._playMusicLoop();
    }

    _playMusicLoop() {
        if (!this.musicPlaying || !this.audioCtx) return;
        const now = this.audioCtx.currentTime;
        // Speed up BPM based on danger level
        const baseBpm = 128;
        const dangerBpm = this._dangerLevel === 2 ? 170 : this._dangerLevel === 1 ? 145 : baseBpm;
        const bpm = dangerBpm;
        const beatLen = 60 / bpm;

        // Synthwave bass line
        const bassNotes = [65.41, 73.42, 82.41, 73.42, 65.41, 82.41, 98.00, 82.41]; // C2-ish
        const loopLen = bassNotes.length * beatLen;

        bassNotes.forEach((freq, i) => {
            const o = this.audioCtx.createOscillator();
            const g = this.audioCtx.createGain();
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
        const padO = this.audioCtx.createOscillator();
        const padG = this.audioCtx.createGain();
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
        this.musicNodes.forEach(node => { try { node.stop(); } catch(_) { /* node already stopped */ } });
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

// --- VS Mode: Per-Player Game Board ---
class GameBoard {
    constructor(playerNum) {
        this.playerNum = playerNum;
        this.grid = []; this.currentPiece = null; this.holdPiece = null;
        this.holdUsed = false; this.nextPieces = [];
        this.score = 0; this.level = 1; this.lines = 0;
        this.combo = -1; this.maxCombo = 0;
        this.tspinCount = 0; this.tetrisCount = 0;
        this.backToBack = false; this.backToBackCount = 0;
        this.lastTspin = 'none'; this.lockDelay = 0; this.lockMoves = 0;
        this.lineClearAnim = null;
        this.screenShake = 0; this.screenShakeIntensity = 0;
        this.levelUpFlash = 0; this.dangerPulse = 0; this.spawnAlpha = 1;
        this.impactFlash = 0; this.impactFlashRows = [];
        this.randomizer = new BagRandomizer();
        this.alive = true; this.pendingGarbage = 0;
        this.lastDrop = 0; this.keys = {}; this.dasTimer = {}; this.arrTimer = {};
    }

    init() {
        this.grid = Array.from({ length: TOTAL_ROWS }, () => Array(COLS).fill(null));
        this.currentPiece = null; this.holdPiece = null; this.holdUsed = false;
        this.nextPieces = []; this.score = 0; this.level = 1; this.lines = 0;
        this.combo = -1; this.maxCombo = 0;
        this.tspinCount = 0; this.tetrisCount = 0;
        this.backToBack = false; this.backToBackCount = 0; this.lastTspin = 'none';
        this.lineClearAnim = null; this.screenShake = 0; this.levelUpFlash = 0;
        this.impactFlash = 0; this.impactFlashRows = [];
        this.randomizer = new BagRandomizer();
        this.alive = true; this.pendingGarbage = 0; this.lockDelay = 0; this.lockMoves = 0;
        this.lastDrop = 0;
        for (let i = 0; i < 5; i++) this.nextPieces.push(this.randomizer.next());
        this.spawnPiece();
    }

    spawnPiece(type) {
        if (!type) type = this.nextPieces.shift();
        while (this.nextPieces.length < 5) this.nextPieces.push(this.randomizer.next());
        const shape = PIECES[type][0];
        const piece = { type, rotation: 0, shape, x: Math.floor((COLS - shape[0].length) / 2), y: 0 };
        let firstBlockRow = 0;
        for (let r = 0; r < shape.length; r++) { if (shape[r].some(c => c)) { firstBlockRow = r; break; } }
        piece.y = HIDDEN_ROWS - firstBlockRow;
        if (!this.isValid(piece)) { piece.y--; if (!this.isValid(piece)) { this.alive = false; return null; } }
        this.currentPiece = piece; this.lockDelay = 0; this.lockMoves = 0;
        this.lastTspin = 'none'; this.holdUsed = false; this.spawnAlpha = 0;
        return piece;
    }

    isValid(piece, shape, x, y) {
        shape = shape || piece.shape; x = x !== undefined ? x : piece.x; y = y !== undefined ? y : piece.y;
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const newX = x + col, newY = y + row;
                    if (newX < 0 || newX >= COLS || newY >= TOTAL_ROWS) return false;
                    if (newY >= 0 && this.grid[newY] && this.grid[newY][newX]) return false;
                }
            }
        }
        return true;
    }

    movePiece(dx, dy) {
        const p = this.currentPiece; if (!p) return false;
        if (this.isValid(p, p.shape, p.x + dx, p.y + dy)) {
            p.x += dx; p.y += dy;
            if (dx !== 0) { this.lastTspin = 'none'; this.resetLockDelay(); }
            return true;
        }
        return false;
    }

    rotatePiece(dir = 1) {
        const p = this.currentPiece; if (!p || p.type === 'O') return false;
        if (dir === 2) {
            const newRot = (p.rotation + 2) % 4, newShape = PIECES[p.type][newRot];
            for (const [kx, ky] of [[0,0],[0,1],[0,-1],[1,0],[-1,0]]) {
                if (this.isValid(p, newShape, p.x + kx, p.y + ky)) {
                    p.x += kx; p.y += ky; p.rotation = newRot; p.shape = newShape;
                    this.resetLockDelay(); return true;
                }
            }
            return false;
        }
        const oldRot = p.rotation, newRot = (oldRot + dir + 4) % 4;
        const newShape = PIECES[p.type][newRot];
        const kicks = p.type === 'I' ? WALL_KICKS.I : WALL_KICKS.normal;
        const sign = dir === 1 ? 1 : -1;
        for (const [kx, ky] of kicks[dir === 1 ? oldRot : newRot]) {
            const testX = p.x + kx * sign, testY = p.y - ky * sign;
            if (this.isValid(p, newShape, testX, testY)) {
                p.x = testX; p.y = testY; p.rotation = newRot; p.shape = newShape;
                this.checkTspin(p); this.resetLockDelay(); return true;
            }
        }
        return false;
    }

    checkTspin(piece) {
        if (piece.type !== 'T') { this.lastTspin = 'none'; return; }
        const cx = piece.x + 1, cy = piece.y + 1;
        let filled = 0;
        [[cx-1,cy-1],[cx+1,cy-1],[cx-1,cy+1],[cx+1,cy+1]].forEach(([x, y]) => {
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
            default: return [[cx-1,cy-1],[cx-1,cy+1]];
        }
    }

    resetLockDelay() { if (this.lockMoves < MAX_LOCK_MOVES) { this.lockDelay = 0; this.lockMoves++; } }
    getGhostY() { const p = this.currentPiece; if (!p) return 0; let gy = p.y; while (this.isValid(p, p.shape, p.x, gy + 1)) gy++; return gy; }

    hardDrop() {
        const p = this.currentPiece; if (!p) return 0;
        let cells = 0;
        while (this.isValid(p, p.shape, p.x, p.y + 1)) { p.y++; cells++; }
        this.score += cells * HARD_DROP_SCORE;
        this.impactFlash = 8; this.impactFlashRows = [];
        for (let row = 0; row < p.shape.length; row++) { if (p.shape[row].some(c => c)) this.impactFlashRows.push(p.y + row - HIDDEN_ROWS); }
        if (cells > 3) { this.screenShake = Math.min(8, cells); this.screenShakeIntensity = Math.min(5, cells * 0.6); }
        return cells;
    }

    softDrop() { if (this.movePiece(0, 1)) { this.score += SOFT_DROP_SCORE; this.lastDrop = performance.now(); return true; } return false; }

    holdCurrentPiece() {
        if (this.holdUsed || !this.currentPiece) return false;
        const type = this.currentPiece.type;
        if (this.holdPiece) { const held = this.holdPiece; this.holdPiece = type; this.spawnPiece(held); }
        else { this.holdPiece = type; this.spawnPiece(); }
        this.holdUsed = true; return true;
    }

    lockPiece() {
        const p = this.currentPiece; if (!p) return { cleared: 0, attack: 0, rows: [] };
        for (let row = 0; row < p.shape.length; row++) {
            for (let col = 0; col < p.shape[row].length; col++) {
                if (p.shape[row][col]) {
                    const gy = p.y + row, gx = p.x + col;
                    if (gy >= 0 && gy < TOTAL_ROWS && gx >= 0 && gx < COLS) this.grid[gy][gx] = p.type;
                }
            }
        }
        this.currentPiece = null;
        return this.processScoring(this.checkLines());
    }

    checkLines() {
        const full = [];
        for (let row = 0; row < TOTAL_ROWS; row++) { if (this.grid[row] && this.grid[row].every(cell => cell !== null)) full.push(row); }
        return full;
    }

    clearLines(rows) {
        rows.sort((a, b) => a - b);
        for (const row of rows.reverse()) this.grid.splice(row, 1);
        while (this.grid.length < TOTAL_ROWS) this.grid.unshift(Array(COLS).fill(null));
    }

    processScoring(clearedRows) {
        const numLines = clearedRows.length;
        if (numLines === 0) { this.combo = -1; return { cleared: 0, attack: 0, rows: clearedRows }; }
        this.combo++; if (this.combo > this.maxCombo) this.maxCombo = this.combo;
        let points = 0;
        const isTetris = numLines === 4, isTspin = this.lastTspin !== 'none';
        if (isTspin) {
            this.tspinCount++;
            if (this.lastTspin === 'mini') points = numLines === 0 ? TSPIN_SCORES.mini : TSPIN_SCORES.miniSingle;
            else points = [0, TSPIN_SCORES.single, TSPIN_SCORES.double, TSPIN_SCORES.triple][numLines] || 0;
        } else { points = LINE_SCORES[numLines] || 0; }
        if (isTetris) this.tetrisCount++;
        if ((isTetris || isTspin) && this.backToBack) { this.backToBackCount++; points = Math.floor(points * 1.5); }
        else if (!(isTetris || isTspin)) { this.backToBackCount = 0; }
        this.backToBack = isTetris || isTspin;
        if (this.combo > 0) points += COMBO_BONUS * this.combo * this.level;
        points *= this.level; this.score += points; this.lines += numLines;
        const newLevel = Math.floor(this.lines / LINES_PER_LEVEL) + 1;
        if (newLevel > this.level) { this.level = newLevel; this.levelUpFlash = 20; }
        // Attack calculation
        const ATTACK_TABLE = [0, 0, 1, 2, 4];
        let attack = ATTACK_TABLE[numLines] || 0;
        if (isTspin) attack = Math.max(attack, numLines * 2);
        if (this.backToBack && this.backToBackCount > 0) attack += 1;
        if (this.combo > 1) attack += Math.floor(this.combo / 2);
        const isEmpty = this.grid.every(row => row.every(c => c === null));
        if (isEmpty) { this.score += PERFECT_CLEAR_BONUS * this.level; attack += 6; }
        if (numLines >= 2) { this.screenShake = Math.max(this.screenShake, 3 + numLines * 2); this.screenShakeIntensity = Math.max(this.screenShakeIntensity, 2 + numLines); }
        return { cleared: numLines, attack, rows: clearedRows, isTetris, isTspin, isEmpty };
    }

    addGarbage(count) {
        const gapCol = Math.floor(Math.random() * COLS);
        for (let i = 0; i < count; i++) {
            this.grid.shift();
            const row = Array(COLS).fill('G'); row[gapCol] = null;
            this.grid.push(row);
        }
        if (this.currentPiece && !this.isValid(this.currentPiece)) {
            this.currentPiece.y -= count;
            if (!this.isValid(this.currentPiece)) this.alive = false;
        }
    }

    getDangerLevel() {
        for (let row = HIDDEN_ROWS; row < TOTAL_ROWS; row++) {
            if (this.grid[row].some(c => c !== null)) {
                const h = row - HIDDEN_ROWS;
                if (h <= 4) return 2; if (h <= 8) return 1; return 0;
            }
        }
        return 0;
    }
}

// Garbage piece color
COLORS_NORMAL['G'] = { fill: '#555', glow: 'rgba(100,100,100,0.4)', dark: '#333', pattern: 'grid' };
COLORS_COLORBLIND['G'] = { fill: '#555', glow: 'rgba(100,100,100,0.4)', dark: '#333', pattern: 'grid' };

// --- Network Manager (PeerJS WebRTC) ---
class NetworkManager {
    constructor() {
        this.peer = null;
        this.conn = null;
        this.isHost = false;
        this.roomCode = '';
        this.onConnect = null;
        this.onData = null;
        this.onDisconnect = null;
        this.onError = null;
    }

    _generateRoomCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
        return code;
    }

    createRoom() {
        return new Promise((resolve, reject) => {
            this.roomCode = this._generateRoomCode();
            const peerId = 'neonblocks-' + this.roomCode;
            this.isHost = true;

            this.peer = new Peer(peerId, { debug: 0 });

            this.peer.on('open', () => resolve(this.roomCode));

            this.peer.on('connection', (conn) => {
                this.conn = conn;
                this._setupConnection(conn);
            });

            this.peer.on('error', (err) => {
                if (err.type === 'unavailable-id') {
                    this.peer.destroy();
                    this.createRoom().then(resolve).catch(reject);
                } else {
                    if (this.onError) this.onError(err);
                    reject(err);
                }
            });
        });
    }

    joinRoom(code) {
        return new Promise((resolve, reject) => {
            this.roomCode = code.toUpperCase().trim();
            const peerId = 'neonblocks-join-' + Date.now();
            this.isHost = false;

            this.peer = new Peer(peerId, { debug: 0 });

            this.peer.on('open', () => {
                const conn = this.peer.connect('neonblocks-' + this.roomCode, { reliable: true });
                this.conn = conn;

                conn.on('open', () => {
                    this._setupConnection(conn);
                    resolve();
                });

                conn.on('error', (err) => {
                    if (this.onError) this.onError(err);
                    reject(err);
                });
            });

            this.peer.on('error', (err) => {
                if (this.onError) this.onError(err);
                reject(err);
            });
        });
    }

    _setupConnection(conn) {
        conn.on('open', () => {
            if (this.onConnect) this.onConnect();
        });

        conn.on('data', (data) => {
            if (this.onData) this.onData(data);
        });

        conn.on('close', () => {
            if (this.onDisconnect) this.onDisconnect();
        });

        conn.on('error', (err) => {
            if (this.onError) this.onError(err);
        });

        // If connection was already open (joiner side), fire connect immediately
        if (conn.open && this.onConnect) this.onConnect();
    }

    send(data) {
        if (this.conn && this.conn.open) this.conn.send(data);
    }

    destroy() {
        if (this.conn) { try { this.conn.close(); } catch (_) { /* already closed */ } }
        if (this.peer) { try { this.peer.destroy(); } catch (_) { /* already destroyed */ } }
        this.conn = null;
        this.peer = null;
    }
}

// --- Main Game ---
class NeonBlocks {
    constructor() {
        this.settingsManager = new SettingsManager();
        this.lifetimeStats = new LifetimeStats();
        this.keyMapper = new KeyMapper();

        // --- Cache DOM elements ---
        this.dom = this._cacheDomElements();

        this.canvas = this.dom.gameCanvas;
        this.ctx = this.canvas.getContext('2d');

        this.bgCanvas = this.dom.bgCanvas;
        this.bgCtx = this.bgCanvas.getContext('2d');

        this.confettiCanvas = this.dom.confettiCanvas;
        this.confetti = new ConfettiSystem(this.confettiCanvas);

        this.audio = new AudioEngine(this.settingsManager);
        this.particles = new ParticleSystem();
        this.randomizer = new BagRandomizer();

        // Game mode
        this.gameMode = 'classic';
        this.modeTimer = 0;
        this.modeStartTime = 0;

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
        this.lastTspin = 'none';
        this.lineClearAnim = null;
        this.screenShake = 0;
        this.screenShakeIntensity = 0;
        this.levelUpFlash = 0;
        this.dangerPulse = 0;
        this.spawnAlpha = 1;

        // Dirty flags for UI optimization
        this._prevUI = { score: -1, level: -1, lines: -1, tspins: -1, tetrises: -1, maxCombo: -1 };

        // Score animation
        this.displayedScore = 0;

        // Hard drop impact flash
        this.impactFlash = 0;
        this.impactFlashRows = [];

        // Achievement system
        this.unlockedAchievements = new Set();
        this._achievementQueue = [];
        this._achievementVisible = false;
        this.backToBackCount = 0;

        // Level theme tracking
        this._currentThemeIndex = -1;

        // VS mode
        this.vsBoards = null; // [GameBoard, GameBoard] when in VS mode
        this.p2Name = '';

        // Online mode
        this.network = null;
        this.onlineReady = false;
        this._onlineSyncFrame = 0;

        // Player
        this.playerName = '';

        // DAS / ARR
        this.das = this.settingsManager.get('das');
        this.arr = this.settingsManager.get('arr');
        this.keys = {};
        this.dasTimer = {};
        this.arrTimer = {};

        // Mobile detect
        this.isMobile = /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent) || window.innerWidth <= MOBILE_BREAKPOINT;

        // Move settings button into HUD on mobile
        if (this.isMobile || window.innerWidth <= MOBILE_BREAKPOINT) {
            const settingsBtn = this.dom.settingsBtn;
            const hudSlot = this.dom.hudSettingsSlot;
            if (settingsBtn && hudSlot) {
                hudSlot.appendChild(settingsBtn);
            }
        }

        // High scores
        this._loadHighScores();

        // Restore player name
        this.playerName = localStorage.getItem('neonblocks_player') || '';
        if (this.playerName) this.dom.playerNameInput.value = this.playerName;

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
        this.setupOnlineLobby();
        this.setupMobileLeaderboard();
        this.updateHighScoreDisplay();
        this.resizeBg();

        // Focus
        setTimeout(() => this.dom.playerNameInput.focus(), 100);

        this.lastTime = 0;
        this.animFrame = requestAnimationFrame(t => this.loop(t));

        // Resize handler
        window.addEventListener('resize', () => { this.calculateCellSize(); this.resizeBg(); });
        window.addEventListener('orientationchange', () => { setTimeout(() => { this.calculateCellSize(); this.resizeBg(); }, 200); });

        // Recalculate after layout is fully settled (for mobile controls height)
        setTimeout(() => { this.calculateCellSize(); }, 300);
        setTimeout(() => { this.calculateCellSize(); }, 600);
    }

    /** Cache all frequently used DOM element references to avoid per-frame lookups. */
    _cacheDomElements() {
        return {
            gameCanvas: document.getElementById('game-canvas'),
            bgCanvas: document.getElementById('bg-canvas'),
            confettiCanvas: document.getElementById('confetti-canvas'),
            gameContainer: document.getElementById('game-container'),
            gameWrapper: document.getElementById('game-wrapper'),
            // Overlays
            startOverlay: document.getElementById('start-overlay'),
            pauseOverlay: document.getElementById('pause-overlay'),
            gameoverOverlay: document.getElementById('gameover-overlay'),
            // HUD elements (updated every frame)
            scoreDisplay: document.getElementById('score-display'),
            levelDisplay: document.getElementById('level-display'),
            linesDisplay: document.getElementById('lines-display'),
            hudScore: document.getElementById('hud-score'),
            hudLevel: document.getElementById('hud-level'),
            hudLines: document.getElementById('hud-lines'),
            tspinCount: document.getElementById('tspin-count'),
            tetrisCount: document.getElementById('tetris-count'),
            maxCombo: document.getElementById('max-combo'),
            comboDisplay: document.getElementById('combo-display'),
            modeTimer: document.getElementById('mode-timer'),
            countdownDisplay: document.getElementById('countdown-display'),
            // Player & controls
            playerNameInput: document.getElementById('player-name-input'),
            playerNameDisplay: document.getElementById('player-name-display'),
            startBtn: document.getElementById('start-btn'),
            resumeBtn: document.getElementById('resume-btn'),
            restartBtn: document.getElementById('restart-btn'),
            shareBtn: document.getElementById('share-btn'),
            settingsBtn: document.getElementById('settings-btn'),
            hudSettingsSlot: document.getElementById('hud-settings-slot'),
            // Settings
            settingsPanel: document.getElementById('settings-panel'),
            settingsOverlay: document.getElementById('settings-overlay'),
            settingsClose: document.getElementById('settings-close'),
            volumeSlider: document.getElementById('volume-slider'),
            // Game over stats
            finalScore: document.getElementById('final-score'),
            finalLevel: document.getElementById('final-level'),
            finalLines: document.getElementById('final-lines'),
            finalTspins: document.getElementById('final-tspins'),
            finalTetrises: document.getElementById('final-tetrises'),
            finalCombo: document.getElementById('final-combo'),
            finalTime: document.getElementById('final-time'),
            finalTimeLabel: document.getElementById('final-time-label'),
            finalPPS: document.getElementById('final-pps'),
            newHighscoreMsg: document.getElementById('new-highscore-msg'),
            personalBestMsg: document.getElementById('personal-best-msg'),
            gameoverRecords: document.getElementById('gameover-records'),
            // Leaderboards
            highscoreList: document.getElementById('highscore-list'),
            mobileHighscoreList: document.getElementById('mobile-highscore-list'),
            // Mobile
            mobileControls: document.getElementById('mobile-controls'),
            mobileHud: document.getElementById('mobile-hud'),
            mobileLeaderboard: document.getElementById('mobile-leaderboard'),
            lbToggle: document.getElementById('lb-toggle'),
            // Mode & stats
            modeDesc: document.getElementById('mode-desc'),
            statsBar: document.getElementById('stats-bar'),
            // VS mode
            p2NameGroup: document.getElementById('p2-name-group'),
            p2NameInput: document.getElementById('p2-name-input'),
            p1NameLabel: document.getElementById('p1-name-label'),
            vsControlsHint: document.getElementById('vs-controls-hint'),
            vsHud: document.getElementById('vs-hud'),
            vsP1Name: document.getElementById('vs-p1-name'),
            vsP2Name: document.getElementById('vs-p2-name'),
            vsP1Score: document.getElementById('vs-p1-score'),
            vsP2Score: document.getElementById('vs-p2-score'),
            vsP1Lines: document.getElementById('vs-p1-lines'),
            vsP2Lines: document.getElementById('vs-p2-lines'),
            vsP1Attack: document.getElementById('vs-p1-attack'),
            vsP2Attack: document.getElementById('vs-p2-attack'),
            vsResultOverlay: document.getElementById('vs-result-overlay'),
            vsWinnerText: document.getElementById('vs-winner-text'),
            vsResultDetail: document.getElementById('vs-result-detail'),
            vsStats: document.getElementById('vs-stats'),
            vsRestartBtn: document.getElementById('vs-restart-btn'),
            vsMenuBtn: document.getElementById('vs-menu-btn'),
            // Online mode
            onlineLobby: document.getElementById('online-lobby'),
            onlineCreateBtn: document.getElementById('online-create-btn'),
            onlineJoinBtn: document.getElementById('online-join-btn'),
            roomCodeInput: document.getElementById('room-code-input'),
            onlineStatus: document.getElementById('online-status'),
            onlineRoomDisplay: document.getElementById('online-room-display'),
            onlineRoomCode: document.getElementById('online-room-code'),
        };
    }

    /** Create the achievement toast container if it doesn't exist. */
    _ensureAchievementContainer() {
        if (!this._achievementContainer) {
            const container = document.createElement('div');
            container.id = 'achievement-container';
            container.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:9999;pointer-events:none;display:flex;flex-direction:column;align-items:center;gap:8px;';
            document.body.appendChild(container);
            this._achievementContainer = container;
        }
    }

    /** Load high scores from localStorage, migrating old format if needed. */
    _loadHighScores() {
        try {
            this.highScores = JSON.parse(localStorage.getItem('neonblocks_scores_v2') || '[]');
        } catch(e) {
            console.warn('Failed to parse high scores:', e.message);
            this.highScores = [];
        }
        try {
            const oldScores = JSON.parse(localStorage.getItem('neonblocks_scores') || '[]');
            if (oldScores.length > 0 && this.highScores.length === 0) {
                this.highScores = oldScores.map(s => typeof s === 'number' ? { name: '???', score: s, level: 1, lines: 0 } : s);
                localStorage.setItem('neonblocks_scores_v2', JSON.stringify(this.highScores));
            }
        } catch(e) {
            console.warn('Failed to migrate old scores:', e.message);
        }
    }

    /** Recalculate cell size based on available viewport space. */
    calculateCellSize() {
        const vh = window.innerHeight;
        const vw = window.innerWidth;
        const isMob = vw <= MOBILE_BREAKPOINT;

        let availH, availW;
        if (isMob) {
            const controlsH = (this.dom.mobileControls && this.dom.mobileControls.offsetHeight > 0) ? this.dom.mobileControls.offsetHeight : 200;
            const hudH = (this.dom.mobileHud && this.dom.mobileHud.offsetHeight > 0) ? this.dom.mobileHud.offsetHeight : 55;
            const lbH = (this.dom.mobileLeaderboard && this.dom.mobileLeaderboard.offsetHeight > 0) ? this.dom.mobileLeaderboard.offsetHeight : 30;
            const safeMargin = 20;

            const safeTop = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-top'), 10) || 0;
            const safeBottom = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-bottom'), 10) || 0;

            availH = vh - hudH - controlsH - lbH - safeMargin - safeTop - safeBottom;
            availW = vw - MOBILE_PADDING;

            if (this.dom.gameWrapper) {
                this.dom.gameWrapper.style.paddingTop = (hudH + 5) + 'px';
                this.dom.gameWrapper.style.paddingBottom = (controlsH + lbH + 5) + 'px';
            }
        } else {
            availH = vh - 60;
            availW = vw * 0.4;
        }

        const cellFromH = Math.floor(availH / ROWS);
        const cellFromW = Math.floor(availW / COLS);
        CELL = Math.max(MIN_CELL, Math.min(BASE_CELL, cellFromH, cellFromW));

        this.canvas.width = COLS * CELL;
        this.canvas.height = ROWS * CELL;

        this.confettiCanvas.width = this.canvas.width;
        this.confettiCanvas.height = this.canvas.height;
    }

    // --- Colorblind ---
    applyColorblind() {
        COLORS = this.settingsManager.get('colorblind') ? COLORS_COLORBLIND : COLORS_NORMAL;
    }

    // --- Settings Panel ---
    setupSettings() {
        const panel = this.dom.settingsPanel;
        const overlay = this.dom.settingsOverlay;
        const btn = this.dom.settingsBtn;
        const closeBtn = this.dom.settingsClose;

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

        btn.addEventListener('touchend', openSettings, { passive: false });
        btn.addEventListener('click', openSettings);
        closeBtn.addEventListener('touchend', closeSettings, { passive: false });
        closeBtn.addEventListener('click', closeSettings);
        overlay.addEventListener('touchend', closeSettings, { passive: false });
        overlay.addEventListener('click', closeSettings);

        const volSlider = this.dom.volumeSlider;
        const volValue = document.getElementById('volume-value');
        volSlider.value = this.settingsManager.get('volume');
        volValue.textContent = volSlider.value + '%';
        const handleVolume = () => {
            const val = parseInt(volSlider.value, 10);
            this.settingsManager.set('volume', Math.max(0, Math.min(100, val)));
            this.audio.setVolume(val);
            volValue.textContent = val + '%';
        };
        volSlider.addEventListener('input', handleVolume);
        volSlider.addEventListener('change', handleVolume);

        // DAS slider
        const dasSlider = document.getElementById('das-slider');
        const dasValue = document.getElementById('das-value');
        dasSlider.value = this.settingsManager.get('das');
        dasValue.textContent = dasSlider.value + 'ms';
        const handleDAS = () => {
            const val = parseInt(dasSlider.value, 10);
            this.settingsManager.set('das', val);
            this.das = val;
            dasValue.textContent = val + 'ms';
        };
        dasSlider.addEventListener('input', handleDAS);
        dasSlider.addEventListener('change', handleDAS);

        // ARR slider
        const arrSlider = document.getElementById('arr-slider');
        const arrValue = document.getElementById('arr-value');
        arrSlider.value = this.settingsManager.get('arr');
        arrValue.textContent = arrSlider.value + 'ms';
        const handleARR = () => {
            const val = parseInt(arrSlider.value, 10);
            this.settingsManager.set('arr', val);
            this.arr = val;
            arrValue.textContent = val + 'ms';
        };
        arrSlider.addEventListener('input', handleARR);
        arrSlider.addEventListener('change', handleARR);

        // Start level slider
        const lvlSlider = document.getElementById('start-level-slider');
        const lvlValue = document.getElementById('start-level-value');
        lvlSlider.value = this.settingsManager.get('startLevel');
        lvlValue.textContent = lvlSlider.value;
        const handleStartLevel = () => {
            const val = parseInt(lvlSlider.value, 10);
            this.settingsManager.set('startLevel', val);
            lvlValue.textContent = val;
        };
        lvlSlider.addEventListener('input', handleStartLevel);
        lvlSlider.addEventListener('change', handleStartLevel);

        // Update lifetime stats display
        this._updateLifetimeStatsDisplay();

        // Key binding buttons
        this._setupKeybindUI();

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

    _setupKeybindUI() {
        const buttons = document.querySelectorAll('.keybind-btn');
        let listeningBtn = null;
        let listeningHandler = null;

        const updateLabels = () => {
            buttons.forEach(btn => {
                const action = btn.dataset.action;
                const key = this.keyMapper.bindings[action];
                btn.textContent = key ? this.keyMapper.getKeyLabel(key) : '---';
            });
        };
        updateLabels();

        const startListening = (btn) => {
            if (listeningBtn) stopListening();
            listeningBtn = btn;
            btn.classList.add('listening');
            btn.textContent = '...';

            listeningHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.key === 'Escape') {
                    stopListening();
                    return;
                }
                this.keyMapper.set(btn.dataset.action, e.key);
                stopListening();
                updateLabels();
            };
            document.addEventListener('keydown', listeningHandler, true);
        };

        const stopListening = () => {
            if (listeningBtn) {
                listeningBtn.classList.remove('listening');
                document.removeEventListener('keydown', listeningHandler, true);
                listeningBtn = null;
                listeningHandler = null;
                updateLabels();
            }
        };

        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                startListening(btn);
            });
        });

        document.getElementById('keybind-reset').addEventListener('click', () => {
            this.keyMapper.reset();
            updateLabels();
        });
    }

    _updateLifetimeStatsDisplay() {
        const lt = this.lifetimeStats;
        const el = (id) => document.getElementById(id);
        el('lt-games').textContent = lt.get('games').toLocaleString();
        el('lt-lines').textContent = lt.get('lines').toLocaleString();
        el('lt-score').textContent = lt.get('score').toLocaleString();
        el('lt-tetrises').textContent = lt.get('tetrises').toLocaleString();
        el('lt-tspins').textContent = lt.get('tspins').toLocaleString();
        el('lt-best-score').textContent = lt.get('bestScore').toLocaleString();
        el('lt-best-level').textContent = lt.get('bestLevel');
        // Format playtime
        const totalMs = lt.get('playtime');
        const totalMin = Math.floor(totalMs / 60000);
        if (totalMin < 60) el('lt-playtime').textContent = totalMin + 'm';
        else el('lt-playtime').textContent = Math.floor(totalMin / 60) + 'h ' + (totalMin % 60) + 'm';
    }

    // --- Mode Selector ---
    setupModeSelector() {
        const modeBtns = document.querySelectorAll('.mode-btn');
        modeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                modeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.gameMode = btn.dataset.mode;
                this.dom.modeDesc.textContent = MODE_DESCRIPTIONS[this.gameMode];
                // Show/hide VS-specific UI
                const isVs = this.gameMode === 'vs';
                const isOnline = this.gameMode === 'online';
                this.dom.p2NameGroup.style.display = isVs ? '' : 'none';
                this.dom.vsControlsHint.style.display = isVs ? '' : 'none';
                this.dom.p1NameLabel.textContent = isVs ? 'Spieler 1' : 'Dein Name';
                // Show/hide Online lobby
                this.dom.onlineLobby.style.display = isOnline ? '' : 'none';
                this.dom.startBtn.style.display = isOnline ? 'none' : '';
                // Reset online lobby state when switching away
                if (!isOnline && this.network) {
                    this.network.destroy();
                    this.network = null;
                    this._resetOnlineLobby();
                }
            });
        });
    }

    // --- Online Lobby ---
    setupOnlineLobby() {
        this.dom.onlineCreateBtn.addEventListener('click', () => this._onlineCreateRoom());
        this.dom.onlineJoinBtn.addEventListener('click', () => this._onlineJoinRoom());
        this.dom.roomCodeInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this._onlineJoinRoom();
        });
    }

    _resetOnlineLobby() {
        this.dom.onlineStatus.textContent = '';
        this.dom.onlineStatus.className = 'online-status';
        this.dom.onlineRoomDisplay.style.display = 'none';
        this.dom.onlineCreateBtn.disabled = false;
        this.dom.onlineJoinBtn.disabled = false;
        this.dom.roomCodeInput.disabled = false;
    }

    _setOnlineStatus(text, type) {
        this.dom.onlineStatus.textContent = text;
        this.dom.onlineStatus.className = 'online-status' + (type ? ' ' + type : '');
    }

    _onlineCreateRoom() {
        if (this.network) this.network.destroy();
        this.network = new NetworkManager();
        this._setOnlineStatus('Raum wird erstellt...', '');
        this.dom.onlineCreateBtn.disabled = true;
        this.dom.onlineJoinBtn.disabled = true;

        this._setupNetworkCallbacks();

        this.network.createRoom().then((code) => {
            this.dom.onlineRoomDisplay.style.display = '';
            this.dom.onlineRoomCode.textContent = code;
            this._setOnlineStatus('Warte auf Gegner...', '');
        }).catch(() => {
            this._setOnlineStatus('Fehler beim Erstellen. Versuche es nochmal.', 'error');
            this.dom.onlineCreateBtn.disabled = false;
            this.dom.onlineJoinBtn.disabled = false;
        });
    }

    _onlineJoinRoom() {
        const code = this.dom.roomCodeInput.value.trim().toUpperCase();
        if (code.length < 4) {
            this._setOnlineStatus('Bitte gib einen gueltigen Code ein.', 'error');
            return;
        }
        if (this.network) this.network.destroy();
        this.network = new NetworkManager();
        this._setOnlineStatus('Verbinde...', '');
        this.dom.onlineCreateBtn.disabled = true;
        this.dom.onlineJoinBtn.disabled = true;
        this.dom.roomCodeInput.disabled = true;

        this._setupNetworkCallbacks();

        this.network.joinRoom(code).then(() => {
            this._setOnlineStatus('Verbunden! Warte auf Start...', 'success');
        }).catch(() => {
            this._setOnlineStatus('Raum nicht gefunden oder Fehler.', 'error');
            this.dom.onlineCreateBtn.disabled = false;
            this.dom.onlineJoinBtn.disabled = false;
            this.dom.roomCodeInput.disabled = false;
        });
    }

    _setupNetworkCallbacks() {
        this.network.onConnect = () => {
            this._setOnlineStatus('Gegner verbunden! Spiel startet...', 'success');
            // Send own name to opponent
            this.network.send({
                type: 'hello',
                name: this._sanitizePlayerName(this.dom.playerNameInput.value),
            });
            // Start game after a short delay so both sides can exchange names
            setTimeout(() => {
                if (this.gameState === 'start' || this.gameState === 'gameover') {
                    this.startGame();
                }
            }, 800);
        };

        this.network.onData = (data) => this._onlineHandleData(data);

        this.network.onDisconnect = () => {
            if (this.gameState === 'playing') {
                this.gameState = 'gameover';
                this.audio.stopMusic();
                this._onlineShowDisconnect();
            } else {
                this._setOnlineStatus('Gegner hat die Verbindung getrennt.', 'error');
                this._resetOnlineLobby();
            }
        };

        this.network.onError = () => {
            this._setOnlineStatus('Verbindungsfehler.', 'error');
            this.dom.onlineCreateBtn.disabled = false;
            this.dom.onlineJoinBtn.disabled = false;
            this.dom.roomCodeInput.disabled = false;
        };
    }

    _onlineHandleData(data) {
        if (!data || !data.type) return;

        switch (data.type) {
            case 'hello':
                this.p2Name = this._sanitizePlayerName(data.name);
                break;

            case 'state': {
                // Update remote board display
                const remote = this.vsBoards ? this.vsBoards[1] : null;
                if (!remote) return;
                remote.grid = data.grid;
                remote.score = data.score;
                remote.lines = data.lines;
                remote.level = data.level;
                remote.holdPiece = data.hold;
                remote.nextPieces = data.next || [];
                remote.screenShake = data.shake || 0;
                remote.screenShakeIntensity = data.shakeI || 0;
                remote.impactFlash = data.impact || 0;
                remote.impactFlashRows = data.impactRows || [];
                remote.levelUpFlash = data.levelFlash || 0;
                // Reconstruct current piece for rendering
                if (data.piece) {
                    remote.currentPiece = {
                        type: data.piece.type,
                        x: data.piece.x,
                        y: data.piece.y,
                        rotation: data.piece.rotation,
                        shape: PIECES[data.piece.type][data.piece.rotation],
                    };
                    remote._remoteGhostY = data.ghostY;
                } else {
                    remote.currentPiece = null;
                }
                break;
            }

            case 'garbage':
                if (this.vsBoards && this.vsBoards[0].alive) {
                    this.vsBoards[0].pendingGarbage += data.count;
                    const attackEl = this.dom.vsP2Attack;
                    attackEl.textContent = `+${data.count}`;
                    setTimeout(() => { attackEl.textContent = ''; }, 800);
                }
                break;

            case 'gameover':
                if (this.vsBoards && this.gameState === 'playing') {
                    this.vsBoards[1].alive = false;
                    this._vsGameOver(this.vsBoards[1]);
                }
                break;

            case 'lineClear':
                // Play remote clear sound
                if (data.isTetris) this.audio.play('tetris');
                else if (data.isTspin) this.audio.play('tspin');
                break;

            case 'rematch':
                if (this.gameState === 'gameover') this.startGame();
                break;
        }
    }

    _onlineSendState() {
        if (!this.network || !this.vsBoards) return;
        const local = this.vsBoards[0];
        this.network.send({
            type: 'state',
            grid: local.grid,
            piece: local.currentPiece ? {
                type: local.currentPiece.type,
                x: local.currentPiece.x,
                y: local.currentPiece.y,
                rotation: local.currentPiece.rotation,
            } : null,
            ghostY: local.currentPiece ? local.getGhostY() : 0,
            hold: local.holdPiece,
            next: local.nextPieces.slice(0, 3),
            score: local.score,
            lines: local.lines,
            level: local.level,
            shake: local.screenShake,
            shakeI: local.screenShakeIntensity,
            impact: local.impactFlash,
            impactRows: local.impactFlashRows,
            levelFlash: local.levelUpFlash,
        });
    }

    _onlineShowDisconnect() {
        this.dom.vsWinnerText.textContent = 'VERBINDUNG VERLOREN';
        this.dom.vsWinnerText.style.color = '#ff0044';
        this.dom.vsResultDetail.textContent = 'Gegner hat die Verbindung getrennt';

        const statsEl = this.dom.vsStats;
        while (statsEl.firstChild) statsEl.removeChild(statsEl.firstChild);

        this.dom.vsResultOverlay.classList.remove('hidden');
        this.audio.play('gameover');
    }

    // --- Background ---
    initBackground() {
        for (let i = 0; i < BG_STAR_COUNT; i++) {
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
        const theme = this._getLevelTheme();
        const [tr, tg, tb] = theme.bg;

        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);

        ctx.strokeStyle = `rgba(${tr}, ${tg}, ${tb}, 0.03)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x < this.bgCanvas.width; x += BG_GRID_SPACING) {
            ctx.moveTo(x, 0); ctx.lineTo(x, this.bgCanvas.height);
        }
        for (let y = 0; y < this.bgCanvas.height; y += BG_GRID_SPACING) {
            ctx.moveTo(0, y); ctx.lineTo(this.bgCanvas.width, y);
        }
        ctx.stroke();

        this.bgStars.forEach(star => {
            star.y += star.speed;
            if (star.y > this.bgCanvas.height) { star.y = 0; star.x = Math.random() * this.bgCanvas.width; }
            ctx.beginPath();
            ctx.fillStyle = `rgba(${tr}, ${tg}, ${tb}, ${star.alpha})`;
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    /** Initialize an empty game grid with TOTAL_ROWS x COLS cells. */
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

    /**
     * Spawn a new falling piece from the queue (or a specific type).
     * @param {string} [type] - Piece type to spawn; uses next from queue if omitted.
     * @returns {object|null} The spawned piece, or null if game over.
     */
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

    /**
     * Check if a piece placement is valid (no collisions, within bounds).
     * @param {object} piece - The piece to validate.
     * @param {number[][]} [shape] - Shape override (defaults to piece.shape).
     * @param {number} [x] - X position override (defaults to piece.x).
     * @param {number} [y] - Y position override (defaults to piece.y).
     * @returns {boolean}
     */
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

    /** Move the current piece by (dx, dy). Returns true if successful. */
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

    /** Rotate the current piece. @param {number} dir - 1=CW, -1=CCW, 2=180° */
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
            default: return [[cx-1,cy-1],[cx-1,cy+1]];
        }
    }

    resetLockDelay() {
        if (this.lockMoves < MAX_LOCK_MOVES) { this.lockDelay = 0; this.lockMoves++; }
    }

    /** Instantly drop the current piece to the bottom and lock it. */
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
        this.audio.play('impact');
        this.haptic(15);

        // Impact flash at landing row
        this.impactFlash = 8;
        this.impactFlashRows = [];
        for (let row = 0; row < p.shape.length; row++) {
            if (p.shape[row].some(c => c)) {
                this.impactFlashRows.push(p.y + row - HIDDEN_ROWS);
            }
        }

        // Screen shake proportional to drop distance
        if (cells > 3) {
            this.screenShake = Math.min(8, cells);
            this.screenShakeIntensity = Math.min(5, cells * 0.6);
        }

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

    /** Lock the current piece into the grid and trigger line clears. */
    lockPiece() {
        const p = this.currentPiece;
        if (!p) return;

        this.piecesPlaced = (this.piecesPlaced || 0) + 1;

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
        // Escalating combo: more particles for higher combos
        const comboMultiplier = Math.min(3, 1 + this.combo * 0.3);
        rows.forEach(row => {
            const firstColor = this.grid[row].find(c => c);
            const color = COLORS[firstColor] || COLORS.I;
            const particleCount = Math.floor(4 * comboMultiplier);
            const sparkCount = Math.floor(2 * comboMultiplier);
            for (let col = 0; col < COLS; col++) {
                this.particles.emit(col * CELL + CELL/2, (row - HIDDEN_ROWS) * CELL + CELL/2, color.fill, particleCount);
                this.particles.emit(col * CELL + CELL/2, (row - HIDDEN_ROWS) * CELL + CELL/2, '#fff', sparkCount, 'spark');
            }
        });
        rows.sort((a, b) => a - b);
        for (const row of rows.reverse()) this.grid.splice(row, 1);
        while (this.grid.length < TOTAL_ROWS) this.grid.unshift(Array(COLS).fill(null));

        // Perfect Clear check
        if (this._isGridEmpty()) {
            this.score += PERFECT_CLEAR_BONUS * this.level;
            this.audio.play('perfectClear');
            this.showScorePopup('PERFECT CLEAR!', '#ffe600');
            this.screenShake = 15; this.screenShakeIntensity = 8;
            this.confetti.burst(100);
            this.haptic(80);
            this._unlockAchievement('perfectClear');
        }
    }

    /** Calculate and apply score from cleared lines, combos, T-spins, and back-to-back. */
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
            this.backToBackCount++;
            points = Math.floor(points * 1.5);
            this.showScorePopup('BACK-TO-BACK!', '#ffe600');
        } else if (!(isTetris || isTspin)) {
            this.backToBackCount = 0;
        }
        this.backToBack = isTetris || isTspin;

        if (this.combo > 0) {
            points += COMBO_BONUS * this.combo * this.level;
            this.showScorePopup(`${this.combo}x COMBO`, '#ff6a00');

            // Escalating combo intensity: more shake + haptic as combo grows
            const comboShake = Math.min(10, 3 + this.combo);
            const comboIntensity = Math.min(6, 2 + this.combo * 0.5);
            if (comboShake > this.screenShake) {
                this.screenShake = comboShake;
                this.screenShakeIntensity = comboIntensity;
            }
            this.haptic(Math.min(80, 10 + this.combo * 8));
        }

        // Check achievements
        this._checkAchievements(numLines, isTetris, isTspin);

        points *= this.level;
        this.score += points;
        this.lines += numLines;

        // Sprint check
        if (this.gameMode === 'sprint' && this.lines >= SPRINT_TARGET) {
            this.gameOver(true);
            return;
        }

        const newLevel = Math.floor(this.lines / LINES_PER_LEVEL) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.audio.play('levelup');
            this.showScorePopup(`LEVEL ${this.level}!`, '#00ff6a');
            this.levelUpFlash = 20;
        }

        this.updateUI();
        this.updateComboDisplay();
    }

    /** Check if the grid is completely empty (Perfect Clear). */
    _isGridEmpty() {
        for (let row = 0; row < TOTAL_ROWS; row++) {
            if (this.grid[row].some(c => c !== null)) return false;
        }
        return true;
    }

    /** Unlock an achievement and show a toast. */
    _unlockAchievement(id) {
        if (this.unlockedAchievements.has(id)) return;
        const achievement = ACHIEVEMENTS[id];
        if (!achievement) return;
        this.unlockedAchievements.add(id);
        this.audio.play('achievement');
        this._achievementQueue.push(achievement);
        this._showNextAchievement();
    }

    _showNextAchievement() {
        if (this._achievementVisible || this._achievementQueue.length === 0) return;
        this._achievementVisible = true;
        this._ensureAchievementContainer();

        const achievement = this._achievementQueue.shift();
        const toast = document.createElement('div');
        toast.style.cssText = 'background:linear-gradient(135deg,rgba(0,0,0,0.9),rgba(30,0,60,0.9));border:1px solid rgba(255,230,0,0.6);border-radius:12px;padding:10px 20px;color:#fff;font-family:inherit;font-size:14px;display:flex;align-items:center;gap:10px;box-shadow:0 0 20px rgba(255,230,0,0.3);animation:achievementIn 0.4s ease-out;white-space:nowrap;';
        toast.innerHTML = '';

        const icon = document.createElement('span');
        icon.style.fontSize = '24px';
        icon.textContent = achievement.icon;

        const textDiv = document.createElement('div');
        const titleEl = document.createElement('div');
        titleEl.style.cssText = 'font-weight:bold;color:#ffe600;font-size:13px;letter-spacing:1px;';
        titleEl.textContent = achievement.label;
        const descEl = document.createElement('div');
        descEl.style.cssText = 'font-size:11px;color:rgba(255,255,255,0.7);';
        descEl.textContent = achievement.desc;
        textDiv.appendChild(titleEl);
        textDiv.appendChild(descEl);

        toast.appendChild(icon);
        toast.appendChild(textDiv);
        this._achievementContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.transition = 'opacity 0.5s, transform 0.5s';
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                toast.remove();
                this._achievementVisible = false;
                this._showNextAchievement();
            }, 500);
        }, 2500);
    }

    /** Check and trigger achievements based on current game state. */
    _checkAchievements(numLines, isTetris, isTspin) {
        if (numLines > 0 && this.lines - numLines === 0) this._unlockAchievement('firstClear');
        if (isTetris && this.tetrisCount === 1) this._unlockAchievement('firstTetris');
        if (isTspin && this.tspinCount === 1) this._unlockAchievement('firstTspin');
        if (this.combo >= 5) this._unlockAchievement('combo5');
        if (this.combo >= 10) this._unlockAchievement('combo10');
        if (this.level >= 5) this._unlockAchievement('level5');
        if (this.level >= 10) this._unlockAchievement('level10');
        if (this.level >= 15) this._unlockAchievement('level15');
        if (this.score >= 50000) this._unlockAchievement('score50k');
        if (this.score >= 100000) this._unlockAchievement('score100k');
        if (this.backToBackCount >= 3) this._unlockAchievement('backToBack3');
    }

    /** Get the current level's color theme. */
    _getLevelTheme() {
        const index = Math.min(Math.floor((this.level - 1) / 4), LEVEL_THEMES.length - 1);
        return LEVEL_THEMES[index];
    }

    showScorePopup(text, color) {
        const container = this.dom.gameContainer;
        const el = document.createElement('div');
        el.className = 'score-popup'; el.textContent = text; el.style.color = color;
        el.style.left = (20 + Math.random() * 60) + '%';
        el.style.top = (30 + Math.random() * 20) + '%';
        el.style.transform = 'translateX(-50%)';
        container.appendChild(el);
        setTimeout(() => el.remove(), 1200);
    }

    /** Trigger haptic feedback on supported devices. */
    haptic(ms = 10) {
        if (this.settingsManager.get('haptic') && navigator.vibrate) {
            try { navigator.vibrate(ms); } catch(_) { /* vibration not available */ }
        }
    }

    // --- Countdown ---
    startCountdown(callback) {
        const display = this.dom.countdownDisplay;
        let count = COUNTDOWN_START;
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

    /** End the current game, save scores, and show game-over overlay. */
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

        // Snapshot previous bests BEFORE recording
        const prevBestScore = this.lifetimeStats.get('bestScore');
        const prevBestLines = this.lifetimeStats.get('bestLines');
        const prevBestLevel = this.lifetimeStats.get('bestLevel');

        // Track lifetime stats
        this.lifetimeStats.record({
            score: this.score, lines: this.lines, level: this.level,
            tetrises: this.tetrisCount, tspins: this.tspinCount, playtime: elapsed,
        });
        this._updateLifetimeStatsDisplay();

        this.dom.finalScore.textContent = this.score.toLocaleString();
        this.dom.finalLevel.textContent = this.level;
        this.dom.finalLines.textContent = this.lines;
        this.dom.finalTspins.textContent = this.tspinCount;
        this.dom.finalTetrises.textContent = this.tetrisCount;
        this.dom.finalCombo.textContent = this.maxCombo;

        // Pieces per second
        const pps = elapsed > 0 ? (this.piecesPlaced / (elapsed / 1000)).toFixed(2) : '0.00';
        this.dom.finalPPS.textContent = pps;

        // Show time for sprint/ultra
        if (this.gameMode !== 'classic') {
            this.dom.finalTimeLabel.style.display = '';
            this.dom.finalTime.style.display = '';
            const secs = Math.floor(elapsed / 1000);
            const ms = elapsed % 1000;
            this.dom.finalTime.textContent = `${Math.floor(secs/60)}:${(secs%60).toString().padStart(2,'0')}.${ms.toString().padStart(3,'0').slice(0,2)}`;
        } else {
            this.dom.finalTimeLabel.style.display = 'none';
            this.dom.finalTime.style.display = 'none';
        }

        if (isNewHighscore && this.score > 0) {
            this.dom.newHighscoreMsg.style.display = 'block';
            this.confetti.burst(80);
        } else {
            this.dom.newHighscoreMsg.style.display = 'none';
        }

        // Personal best badges
        const records = this.dom.gameoverRecords;
        records.innerHTML = '';
        const addBadge = (label, isNew) => {
            const badge = document.createElement('span');
            badge.className = 'record-badge ' + (isNew ? 'new-record' : 'prev-record');
            badge.textContent = label;
            records.appendChild(badge);
        };

        const newBestScore = this.score > prevBestScore && this.score > 0;
        const newBestLines = this.lines > prevBestLines && this.lines > 0;
        const newBestLevel = this.level > prevBestLevel && this.level > 1;

        if (newBestScore) addBadge('New Best Score!', true);
        if (newBestLines) addBadge('New Best Lines!', true);
        if (newBestLevel) addBadge('New Best Level!', true);

        // Show personal best message
        if (newBestScore || newBestLines || newBestLevel) {
            this.dom.personalBestMsg.style.display = 'block';
            this.dom.personalBestMsg.textContent = 'PERSONAL BEST!';
        } else if (prevBestScore > 0) {
            const pct = Math.round((this.score / prevBestScore) * 100);
            this.dom.personalBestMsg.style.display = 'block';
            this.dom.personalBestMsg.textContent = `${pct}% deines Bests (${prevBestScore.toLocaleString()})`;
            this.dom.personalBestMsg.style.color = pct >= 80 ? '#00ff6a' : 'rgba(255,255,255,0.4)';
        } else {
            this.dom.personalBestMsg.style.display = 'none';
        }

        // Sprint win message
        const heading = this.dom.gameoverOverlay.querySelector('h2');
        heading.textContent = (isWin && this.gameMode === 'sprint') ? 'GESCHAFFT!' : 'GAME OVER';

        this.dom.gameoverOverlay.classList.remove('hidden');
    }

    // --- Share ---
    shareScore() {
        const modeLabel = { classic: 'Classic', sprint: 'Sprint', ultra: 'Ultra' }[this.gameMode];
        const text = `NEON BLOCKS ${modeLabel}\nScore: ${this.score.toLocaleString()} | Level ${this.level} | ${this.lines} Lines\nSpiel es selbst: https://fabiansp77.github.io/neon-blocks/`;

        if (navigator.share) {
            navigator.share({ title: 'NEON BLOCKS Score', text }).catch(() => {});
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                this.dom.shareBtn.textContent = '\u2713 KOPIERT!';
                setTimeout(() => { this.dom.shareBtn.textContent = '\u{1F517} SCORE TEILEN'; }, 2000);
            }).catch(() => {});
        }
    }

    /** Sanitize a raw player name input into a valid display name. */
    _sanitizePlayerName(raw) {
        const trimmed = (raw || '').trim().toUpperCase().slice(0, MAX_PLAYER_NAME_LENGTH);
        return trimmed || DEFAULT_PLAYER_NAME;
    }

    // --- Start / Restart ---
    startGame() {
        this.playerName = this._sanitizePlayerName(this.dom.playerNameInput.value);
        localStorage.setItem('neonblocks_player', this.playerName);
        this.dom.playerNameDisplay.textContent = this.playerName;

        if (this.gameMode === 'vs') {
            this.p2Name = this._sanitizePlayerName(this.dom.p2NameInput.value);
        }
        if (this.gameMode === 'online' && !this.p2Name) {
            this.p2Name = 'GEGNER';
        }

        this.audio.init();

        this.dom.startOverlay.classList.add('hidden');
        this.dom.gameoverOverlay.classList.add('hidden');
        this.dom.pauseOverlay.classList.add('hidden');
        if (this.dom.vsResultOverlay) this.dom.vsResultOverlay.classList.add('hidden');

        // Countdown then start
        this.gameState = 'countdown';
        this.startCountdown(() => {
            if (this.gameMode === 'vs') {
                this._initVsMode();
            } else if (this.gameMode === 'online') {
                this._initOnlineMode();
            } else {
                this.vsBoards = null;
                this.dom.vsHud.style.display = 'none';
                this._initGameState();
            }
            this.gameState = 'playing';
            this.lastDrop = performance.now();
            this.modeStartTime = Date.now();
            this.audio.startMusic();
            this.canvas.focus();
        });
    }

    /** Initialize Online 1v1 mode - like VS but only local board runs game logic. */
    _initOnlineMode() {
        const local = new GameBoard(1);
        const remote = new GameBoard(2);
        local.init();
        // Remote board is initialized with an empty grid; will be populated by network state
        remote.grid = Array.from({ length: TOTAL_ROWS }, () => Array(COLS).fill(null));
        remote.alive = true;
        remote.currentPiece = null;
        this.vsBoards = [local, remote];

        // Resize canvas for two boards
        this.canvas.width = (COLS * 2 + VS_GAP) * CELL;
        this.canvas.height = ROWS * CELL;
        this.confettiCanvas.width = this.canvas.width;
        this.confettiCanvas.height = this.canvas.height;

        // Show VS HUD
        this.dom.vsHud.style.display = '';
        this.dom.vsP1Name.textContent = this.playerName;
        this.dom.vsP2Name.textContent = this.p2Name;
        this.dom.vsP1Score.textContent = '0';
        this.dom.vsP2Score.textContent = '0';
        this.dom.vsP1Lines.textContent = '0 Lines';
        this.dom.vsP2Lines.textContent = '0 Lines';
        this.dom.vsP1Attack.textContent = '';
        this.dom.vsP2Attack.textContent = '';

        // Hide single-player stats bar
        if (this.dom.statsBar) this.dom.statsBar.style.display = 'none';

        this._onlineSyncFrame = 0;
    }

    _initGameState() {
        this.createGrid();
        this.currentPiece = null;
        this.holdPiece = null;
        this.holdUsed = false;
        this.nextPieces = [];
        const startLvl = (this.gameMode === 'classic') ? (this.settingsManager.get('startLevel') || 1) : 1;
        this.score = 0; this.level = startLvl; this.lines = 0;
        this.combo = -1; this.maxCombo = 0;
        this.tspinCount = 0; this.tetrisCount = 0; this.piecesPlaced = 0;
        this.backToBack = false; this.lastTspin = 'none';
        this.lineClearAnim = null;
        this.screenShake = 0; this.levelUpFlash = 0;
        this.randomizer = new BagRandomizer();
        this.particles = new ParticleSystem();
        this.displayedScore = 0;
        this.impactFlash = 0;
        this.impactFlashRows = [];
        this.unlockedAchievements = new Set();
        this._achievementQueue = [];
        this._achievementVisible = false;
        this.backToBackCount = 0;
        this._currentThemeIndex = -1;

        // Reset dirty flags so UI updates on first frame
        this._prevUI = { score: -1, level: -1, lines: -1, tspins: -1, tetrises: -1, maxCombo: -1 };

        for (let i = 0; i < 5; i++) this.nextPieces.push(this.randomizer.next());
        this.spawnPiece();
        this.updateUI();
        this.updateHoldDisplay();
        this.updateComboDisplay();
        this.dom.tspinCount.textContent = '0';
        this.dom.tetrisCount.textContent = '0';
        this.dom.maxCombo.textContent = '0';
        this.dom.modeTimer.textContent = '';
    }

    /** Initialize VS (1v1) mode with two game boards. */
    _initVsMode() {
        const b1 = new GameBoard(1);
        const b2 = new GameBoard(2);
        b1.init();
        b2.init();
        this.vsBoards = [b1, b2];

        // Resize canvas for two boards
        this.canvas.width = (COLS * 2 + VS_GAP) * CELL;
        this.canvas.height = ROWS * CELL;
        this.confettiCanvas.width = this.canvas.width;
        this.confettiCanvas.height = this.canvas.height;

        // Show VS HUD
        this.dom.vsHud.style.display = '';
        this.dom.vsP1Name.textContent = this.playerName;
        this.dom.vsP2Name.textContent = this.p2Name;
        this.dom.vsP1Score.textContent = '0';
        this.dom.vsP2Score.textContent = '0';
        this.dom.vsP1Lines.textContent = '0 Lines';
        this.dom.vsP2Lines.textContent = '0 Lines';
        this.dom.vsP1Attack.textContent = '';
        this.dom.vsP2Attack.textContent = '';

        // Hide single-player stats bar
        if (this.dom.statsBar) this.dom.statsBar.style.display = 'none';
    }

    /** Update VS mode game state for one tick. */
    _updateVsBoard(board, time, dt) {
        if (!board.alive) return;
        const interval = getDropInterval(board.level);
        if (time - board.lastDrop >= interval) {
            if (!board.movePiece(0, 1)) {
                board.lockDelay += interval;
                if (board.lockDelay >= LOCK_DELAY_MS) this._vsLockPiece(board);
            } else { board.lockDelay = 0; }
            board.lastDrop = time;
        }
        if (board.currentPiece && !board.isValid(board.currentPiece, board.currentPiece.shape, board.currentPiece.x, board.currentPiece.y + 1)) {
            board.lockDelay += dt;
            if (board.lockDelay >= LOCK_DELAY_MS) this._vsLockPiece(board);
        }
        if (board.lineClearAnim) {
            board.lineClearAnim.update();
            if (board.lineClearAnim.done) {
                board.clearLines(board.lineClearAnim.rows);
                board.lineClearAnim = null;
                // Apply pending garbage after own lines are cleared
                if (board.pendingGarbage > 0) {
                    board.addGarbage(board.pendingGarbage);
                    board.pendingGarbage = 0;
                }
                board.spawnPiece();
                if (!board.alive) this._vsGameOver(board);
            }
        }
        if (board.screenShake > 0) board.screenShake--;
        if (board.levelUpFlash > 0) board.levelUpFlash--;
        if (board.impactFlash > 0) board.impactFlash--;
    }

    /** Lock a piece on a VS board and handle attacks. */
    _vsLockPiece(board) {
        const result = board.lockPiece();
        if (result.cleared > 0) {
            this.audio.play(result.isTetris ? 'tetris' : result.isTspin ? 'tspin' : 'clear');
            board.lineClearAnim = new LineClearAnimation(result.rows);

            // Send attack to opponent
            if (result.attack > 0) {
                if (this.gameMode === 'online' && this.network && board.playerNum === 1) {
                    // Online: send garbage to remote opponent
                    this.network.send({ type: 'garbage', count: result.attack });
                    this.network.send({ type: 'lineClear', isTetris: result.isTetris, isTspin: result.isTspin });
                } else {
                    // Local VS: apply directly
                    const opponent = this.vsBoards[board.playerNum === 1 ? 1 : 0];
                    opponent.pendingGarbage += result.attack;
                }
                // Show attack indicator
                const attackEl = board.playerNum === 1 ? this.dom.vsP1Attack : this.dom.vsP2Attack;
                attackEl.textContent = `+${result.attack}`;
                setTimeout(() => { attackEl.textContent = ''; }, 800);
            }

            if (result.isEmpty) {
                this.audio.play('perfectClear');
                this.confetti.burst(60);
            }
        } else {
            this.audio.play('lock');
            // Apply pending garbage when player doesn't clear lines
            if (board.pendingGarbage > 0) {
                board.addGarbage(board.pendingGarbage);
                board.pendingGarbage = 0;
            }
            board.spawnPiece();
            if (!board.alive) this._vsGameOver(board);
        }
    }

    /** Handle VS DAS for a specific board. */
    _vsHandleDAS(board, now, leftKey, rightKey, downAction) {
        [leftKey, rightKey].forEach(key => {
            if (board.keys[key] && board.dasTimer[key]) {
                const elapsed = now - board.dasTimer[key];
                if (elapsed >= this.das) {
                    if (!board.arrTimer[key] || now - board.arrTimer[key] >= this.arr) {
                        board.movePiece(key === leftKey ? -1 : 1, 0);
                        board.arrTimer[key] = now;
                    }
                }
            }
        });
        if (downAction && board.keys[downAction]) board.softDrop();
    }

    /** Handle game over for a VS board. */
    _vsGameOver(losingBoard) {
        this.gameState = 'gameover';
        this.audio.stopMusic();

        // Online: notify opponent that we lost
        if (this.gameMode === 'online' && this.network && losingBoard.playerNum === 1) {
            this.network.send({ type: 'gameover' });
        }

        const winnerName = losingBoard.playerNum === 1 ? this.p2Name : this.playerName;
        const loserName = losingBoard.playerNum === 1 ? this.playerName : this.p2Name;

        this.dom.vsWinnerText.textContent = `${winnerName} GEWINNT!`;
        this.dom.vsWinnerText.style.color = losingBoard.playerNum === 1 ? '#ff00aa' : '#00f0ff';
        this.dom.vsResultDetail.textContent = `${loserName} hat verloren`;

        // Build stats
        const statsEl = this.dom.vsStats;
        while (statsEl.firstChild) statsEl.removeChild(statsEl.firstChild);
        const b1 = this.vsBoards[0], b2 = this.vsBoards[1];
        const rows = [
            ['', this.playerName, this.p2Name],
            ['Score', b1.score.toLocaleString(), b2.score.toLocaleString()],
            ['Lines', b1.lines, b2.lines],
            ['Level', b1.level, b2.level],
            ['Tetrisse', b1.tetrisCount, b2.tetrisCount],
            ['T-Spins', b1.tspinCount, b2.tspinCount],
            ['Max Combo', b1.maxCombo, b2.maxCombo],
        ];
        rows.forEach(([label, v1, v2], i) => {
            const lbl = document.createElement('span');
            lbl.className = 'stat-label';
            lbl.textContent = label;
            lbl.style.gridColumn = '1';
            const val1 = document.createElement('span');
            val1.className = 'stat-value';
            val1.textContent = v1;
            val1.style.color = i === 0 ? '#00f0ff' : '#fff';
            val1.style.gridColumn = '2';
            const val2 = document.createElement('span');
            val2.className = 'stat-value';
            val2.textContent = v2;
            val2.style.color = i === 0 ? '#ff00aa' : '#fff';
            val2.style.gridColumn = '3';
            statsEl.appendChild(lbl);
            statsEl.appendChild(val1);
            statsEl.appendChild(val2);
        });
        statsEl.style.gridTemplateColumns = '1fr 1fr 1fr';
        statsEl.style.display = 'grid';
        statsEl.style.gap = '4px 10px';

        this.confetti.burst(80);
        this.audio.play('gameover');
        this.dom.vsResultOverlay.classList.remove('hidden');
    }

    /** Update VS HUD display. */
    _updateVsHud() {
        if (!this.vsBoards) return;
        const [b1, b2] = this.vsBoards;
        this.dom.vsP1Score.textContent = b1.score.toLocaleString();
        this.dom.vsP2Score.textContent = b2.score.toLocaleString();
        this.dom.vsP1Lines.textContent = b1.lines + ' Lines';
        this.dom.vsP2Lines.textContent = b2.lines + ' Lines';
    }

    /** Render a single game board at a given x-offset on the canvas. */
    _renderVsBoard(board, xOffset, playerColor) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(xOffset, 0);

        // Screen shake
        if (board.screenShake > 0) {
            ctx.translate((Math.random()-0.5)*board.screenShakeIntensity, (Math.random()-0.5)*board.screenShakeIntensity);
        }

        // Board background
        ctx.fillStyle = 'rgba(5, 5, 15, 0.95)';
        ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL);

        // Level-up flash
        if (board.levelUpFlash > 0) {
            ctx.fillStyle = `rgba(0, 255, 106, ${(board.levelUpFlash / 20) * 0.2})`;
            ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL);
        }

        // Impact flash
        if (board.impactFlash > 0) {
            const flashAlpha = (board.impactFlash / 8) * 0.6;
            board.impactFlashRows.forEach(row => {
                if (row >= 0 && row < ROWS) {
                    ctx.fillStyle = `rgba(255,255,255,${flashAlpha})`;
                    ctx.fillRect(0, row * CELL, COLS * CELL, CELL);
                }
            });
        }

        // Grid lines (batched into single path)
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        for (let x = 0; x <= COLS; x++) { ctx.moveTo(x*CELL, 0); ctx.lineTo(x*CELL, ROWS*CELL); }
        for (let y = 0; y <= ROWS; y++) { ctx.moveTo(0, y*CELL); ctx.lineTo(COLS*CELL, y*CELL); }
        ctx.stroke();

        // Danger zone
        const danger = board.getDangerLevel();
        if (danger > 0) {
            board.dangerPulse += 0.05;
            const pulseAlpha = (Math.sin(board.dangerPulse * 3) + 1) * 0.5;
            const dColor = danger === 2 ? `rgba(255,0,68,${pulseAlpha * 0.15})` : `rgba(255,106,0,${pulseAlpha * 0.08})`;
            const dHeight = danger === 2 ? ROWS * CELL * 0.3 : ROWS * CELL * 0.15;
            const dGrad = ctx.createLinearGradient(0, 0, 0, dHeight);
            dGrad.addColorStop(0, dColor); dGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = dGrad; ctx.fillRect(0, 0, COLS * CELL, dHeight);
        }

        // Line clear flash
        if (board.lineClearAnim) {
            const flash = board.lineClearAnim.getFlash();
            if (flash > 0) {
                board.lineClearAnim.rows.forEach(row => {
                    ctx.fillStyle = `rgba(255,255,255,${flash})`;
                    ctx.fillRect(0, (row - HIDDEN_ROWS) * CELL, COLS * CELL, CELL);
                });
            }
        }

        // Placed blocks
        for (let row = HIDDEN_ROWS; row < TOTAL_ROWS; row++) {
            if (!board.grid[row]) continue;
            for (let col = 0; col < COLS; col++) {
                const cell = board.grid[row][col];
                if (cell) {
                    let alpha = 1;
                    if (board.lineClearAnim && board.lineClearAnim.rows.includes(row)) alpha = board.lineClearAnim.getAlpha();
                    this.drawCell(ctx, col * CELL, (row - HIDDEN_ROWS) * CELL, CELL, COLORS[cell], alpha);
                }
            }
        }

        // Ghost + current piece
        const p = board.currentPiece;
        if (p) {
            if (board.spawnAlpha < 1) board.spawnAlpha = Math.min(1, board.spawnAlpha + SPAWN_FADE_SPEED);
            const color = COLORS[p.type];

            // Ghost
            if (this.settingsManager.get('ghost')) {
                const ghostY = (board._remoteGhostY !== undefined) ? board._remoteGhostY : board.getGhostY();
                if (ghostY !== p.y) {
                    for (let row = 0; row < p.shape.length; row++) {
                        for (let col = 0; col < p.shape[row].length; col++) {
                            if (p.shape[row][col]) {
                                const drawY = (ghostY + row - HIDDEN_ROWS) * CELL;
                                const drawX = (p.x + col) * CELL;
                                if (drawY >= 0) {
                                    ctx.save(); ctx.globalAlpha = 0.18;
                                    ctx.fillStyle = color.fill;
                                    ctx.fillRect(drawX + 2, drawY + 2, CELL - 4, CELL - 4);
                                    ctx.globalAlpha = 0.35; ctx.strokeStyle = color.fill;
                                    ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
                                    ctx.strokeRect(drawX + 2, drawY + 2, CELL - 4, CELL - 4);
                                    ctx.setLineDash([]); ctx.restore();
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
                        if (drawY >= -CELL) this.drawCell(ctx, drawX, drawY, CELL, color, board.spawnAlpha);
                    }
                }
            }
        }

        // Pending garbage indicator (red bar on left side)
        if (board.pendingGarbage > 0) {
            const garbageHeight = Math.min(board.pendingGarbage, ROWS) * CELL;
            ctx.fillStyle = 'rgba(255,0,68,0.6)';
            ctx.fillRect(0, ROWS * CELL - garbageHeight, 3, garbageHeight);
        }

        // Border
        ctx.strokeStyle = playerColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, COLS * CELL, ROWS * CELL);

        ctx.restore();
    }

    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.audio.stopMusic();
            this.dom.pauseOverlay.classList.remove('hidden');
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.lastDrop = performance.now();
            this.audio.startMusic();
            this.dom.pauseOverlay.classList.add('hidden');
        }
    }

    // --- Controls ---
    setupControls() {
        const nameInput = this.dom.playerNameInput;
        const startBtn = this.dom.startBtn;

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
                // No pause in online mode
                if (this.gameMode === 'online') return;
                if (this.gameState === 'playing' || this.gameState === 'paused') {
                    e.preventDefault(); this.togglePause();
                }
                return;
            }

            if (this.gameState !== 'playing') return;

            // Online mode controls - remappable keys control local board
            if (this.gameMode === 'online' && this.vsBoards) {
                const local = this.vsBoards[0];
                if (!local.alive) return;
                const onlineAction = this.keyMapper.getAction(e.key);
                if (!onlineAction) return;
                e.preventDefault();
                const now = performance.now();
                switch(onlineAction) {
                    case 'moveLeft':
                        if (!local.keys['moveLeft']) { local.movePiece(-1, 0); local.dasTimer['moveLeft'] = now; this.audio.play('move'); }
                        local.keys['moveLeft'] = true; break;
                    case 'moveRight':
                        if (!local.keys['moveRight']) { local.movePiece(1, 0); local.dasTimer['moveRight'] = now; this.audio.play('move'); }
                        local.keys['moveRight'] = true; break;
                    case 'softDrop':
                        local.keys['softDrop'] = true; local.softDrop(); break;
                    case 'rotateCW':
                        local.rotatePiece(1); this.audio.play('rotate'); break;
                    case 'rotateCCW':
                        local.rotatePiece(-1); this.audio.play('rotate'); break;
                    case 'rotate180':
                        local.rotatePiece(2); this.audio.play('rotate'); break;
                    case 'hardDrop':
                        local.hardDrop(); this._vsLockPiece(local); this.audio.play('drop'); this.audio.play('impact');
                        this._onlineSendState(); break;
                    case 'hold':
                        if (local.holdCurrentPiece()) this.audio.play('hold'); break;
                }
                return;
            }

            // VS mode controls
            if (this.gameMode === 'vs' && this.vsBoards) {
                e.preventDefault();
                const [b1, b2] = this.vsBoards;
                const key = e.key.toLowerCase();
                const now = performance.now();

                // Player 1: WASD + Q/E/Space
                if (b1.alive) {
                    if (key === 'a') { if (!b1.keys['a']) { b1.movePiece(-1, 0); b1.dasTimer['a'] = now; } b1.keys['a'] = true; }
                    else if (key === 'd') { if (!b1.keys['d']) { b1.movePiece(1, 0); b1.dasTimer['d'] = now; } b1.keys['d'] = true; }
                    else if (key === 's') { b1.keys['s'] = true; b1.softDrop(); }
                    else if (key === 'w') { b1.rotatePiece(1); this.audio.play('rotate'); }
                    else if (key === 'e') { b1.rotatePiece(2); this.audio.play('rotate'); }
                    else if (key === 'q') { if (b1.holdCurrentPiece()) this.audio.play('hold'); }
                    else if (e.key === ' ') { b1.hardDrop(); this._vsLockPiece(b1); this.audio.play('drop'); this.audio.play('impact'); }
                }

                // Player 2: Arrows + Shift/Enter/Slash
                if (b2.alive) {
                    if (e.key === 'ArrowLeft') { if (!b2.keys['left']) { b2.movePiece(-1, 0); b2.dasTimer['left'] = now; } b2.keys['left'] = true; }
                    else if (e.key === 'ArrowRight') { if (!b2.keys['right']) { b2.movePiece(1, 0); b2.dasTimer['right'] = now; } b2.keys['right'] = true; }
                    else if (e.key === 'ArrowDown') { b2.keys['down'] = true; b2.softDrop(); }
                    else if (e.key === 'ArrowUp') { b2.rotatePiece(1); this.audio.play('rotate'); }
                    else if (key === '/') { b2.rotatePiece(2); this.audio.play('rotate'); }
                    else if (e.key === 'Shift') { if (b2.holdCurrentPiece()) this.audio.play('hold'); }
                    else if (e.key === 'Enter') { b2.hardDrop(); this._vsLockPiece(b2); this.audio.play('drop'); this.audio.play('impact'); }
                }
                return;
            }

            // Single-player controls (remappable)
            const action = this.keyMapper.getAction(e.key);
            if (action) {
                e.preventDefault();
                const now = performance.now();
                switch(action) {
                    case 'moveLeft':
                        if (!this.keys['moveLeft']) { this.movePiece(-1, 0); this.dasTimer['moveLeft'] = now; }
                        this.keys['moveLeft'] = true; break;
                    case 'moveRight':
                        if (!this.keys['moveRight']) { this.movePiece(1, 0); this.dasTimer['moveRight'] = now; }
                        this.keys['moveRight'] = true; break;
                    case 'softDrop':
                        this.keys['softDrop'] = true; this.softDrop(); break;
                    case 'rotateCW': this.rotatePiece(1); break;
                    case 'rotateCCW': this.rotatePiece(-1); break;
                    case 'rotate180': this.rotatePiece(2); break;
                    case 'hardDrop': this.hardDrop(); break;
                    case 'hold': this.holdCurrentPiece(); break;
                }
            }
        });

        document.addEventListener('keyup', e => {
            // Online mode key up
            if (this.gameMode === 'online' && this.vsBoards) {
                const local = this.vsBoards[0];
                const onUpAction = this.keyMapper.getAction(e.key);
                if (onUpAction) {
                    local.keys[onUpAction] = false;
                    if (onUpAction === 'moveLeft' || onUpAction === 'moveRight') delete local.dasTimer[onUpAction];
                }
                return;
            }
            // VS mode key up
            if (this.gameMode === 'vs' && this.vsBoards) {
                const [b1, b2] = this.vsBoards;
                const key = e.key.toLowerCase();
                if (key === 'a' || key === 'd' || key === 's') b1.keys[key] = false;
                if (key === 'a' || key === 'd') delete b1.dasTimer[key];
                if (e.key === 'ArrowLeft') { b2.keys['left'] = false; delete b2.dasTimer['left']; }
                if (e.key === 'ArrowRight') { b2.keys['right'] = false; delete b2.dasTimer['right']; }
                if (e.key === 'ArrowDown') b2.keys['down'] = false;
                return;
            }

            const upAction = this.keyMapper.getAction(e.key);
            if (upAction) {
                this.keys[upAction] = false;
                if (upAction === 'moveLeft' || upAction === 'moveRight') {
                    delete this.dasTimer[upAction];
                    if (upAction === 'moveLeft' && this.keys['moveRight']) { this.dasTimer['moveRight'] = performance.now(); }
                    else if (upAction === 'moveRight' && this.keys['moveLeft']) { this.dasTimer['moveLeft'] = performance.now(); }
                }
            }
        });

        startBtn.addEventListener('click', () => { if (nameInput.value.trim().length > 0) this.startGame(); });
        this.dom.restartBtn.addEventListener('click', () => this.startGame());
        this.dom.resumeBtn.addEventListener('click', () => this.togglePause());
        this.dom.shareBtn.addEventListener('click', () => this.shareScore());

        // VS mode buttons
        if (this.dom.vsRestartBtn) {
            this.dom.vsRestartBtn.addEventListener('click', () => {
                if (this.gameMode === 'online' && this.network) {
                    this.network.send({ type: 'rematch' });
                }
                this.startGame();
            });
        }
        if (this.dom.vsMenuBtn) {
            this.dom.vsMenuBtn.addEventListener('click', () => {
                this.dom.vsResultOverlay.classList.add('hidden');
                this.dom.vsHud.style.display = 'none';
                this.dom.startOverlay.classList.remove('hidden');
                this.gameState = 'start';
                this.vsBoards = null;
                // Clean up network if online
                if (this.network) {
                    this.network.destroy();
                    this.network = null;
                    this._resetOnlineLobby();
                }
                // Restore canvas size
                this.calculateCellSize();
                if (this.dom.statsBar) this.dom.statsBar.style.display = '';
            });
        }
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
        ['moveLeft', 'moveRight'].forEach(key => {
            if (this.keys[key] && this.dasTimer[key]) {
                const elapsed = now - this.dasTimer[key];
                if (elapsed >= this.das) {
                    if (!this.arrTimer[key] || now - this.arrTimer[key] >= this.arr) {
                        this.movePiece(key === 'moveLeft' ? -1 : 1, 0);
                        this.arrTimer[key] = now;
                    }
                }
            }
        });
        if (this.keys['softDrop']) this.softDrop();
    }

    /** Update score/level/lines displays with smooth score animation. */
    updateUI() {
        const prev = this._prevUI;

        // Smooth score counter animation (lerp toward actual score)
        if (this.displayedScore !== this.score) {
            const diff = this.score - this.displayedScore;
            const step = Math.max(1, Math.ceil(Math.abs(diff) * SCORE_LERP_SPEED));
            this.displayedScore = diff > 0
                ? Math.min(this.score, this.displayedScore + step)
                : Math.max(this.score, this.displayedScore - step);
        }

        if (prev.score !== this.displayedScore) {
            prev.score = this.displayedScore;
            const scoreStr = this.displayedScore.toLocaleString();
            this.dom.scoreDisplay.textContent = scoreStr;
            if (this.dom.hudScore) this.dom.hudScore.textContent = scoreStr;
        }
        if (prev.level !== this.level) {
            prev.level = this.level;
            this.dom.levelDisplay.textContent = this.level;
            if (this.dom.hudLevel) this.dom.hudLevel.textContent = this.level;
        }
        if (prev.lines !== this.lines) {
            prev.lines = this.lines;
            this.dom.linesDisplay.textContent = this.lines;
            if (this.dom.hudLines) this.dom.hudLines.textContent = this.lines;
        }
        if (prev.tspins !== this.tspinCount) {
            prev.tspins = this.tspinCount;
            this.dom.tspinCount.textContent = this.tspinCount;
        }
        if (prev.tetrises !== this.tetrisCount) {
            prev.tetrises = this.tetrisCount;
            this.dom.tetrisCount.textContent = this.tetrisCount;
        }
        if (prev.maxCombo !== this.maxCombo) {
            prev.maxCombo = this.maxCombo;
            this.dom.maxCombo.textContent = this.maxCombo;
        }
    }

    updateComboDisplay() {
        this.dom.comboDisplay.textContent = this.combo > 0 ? `${this.combo}x COMBO` : '';
    }

    /** Format milliseconds as M:SS.cc timer string. */
    _formatTimer(ms) {
        const secs = Math.floor(ms / 1000);
        const centisecs = Math.floor((ms % 1000) / 10);
        return `${Math.floor(secs/60)}:${(secs%60).toString().padStart(2,'0')}.${centisecs.toString().padStart(2,'0')}`;
    }

    updateModeTimer() {
        if (this.gameState !== 'playing') return;
        const elapsed = Date.now() - this.modeStartTime;
        const timerEl = this.dom.modeTimer;

        if (this.gameMode === 'sprint') {
            timerEl.textContent = this._formatTimer(elapsed);
            timerEl.style.color = '#00ff6a';
        } else if (this.gameMode === 'ultra') {
            const remaining = Math.max(0, ULTRA_DURATION_MS - elapsed);
            if (remaining <= 0) { this.gameOver(); return; }
            timerEl.textContent = this._formatTimer(remaining);
            timerEl.style.color = remaining < 10000 ? '#ff0044' : remaining < 30000 ? '#ffe600' : '#00ff6a';
        } else {
            timerEl.textContent = '';
        }
    }

    /** Check if an entry is a valid high-score object (not null/array). */
    _isScoreEntry(entry) {
        return typeof entry === 'object' && entry !== null && !Array.isArray(entry);
    }

    updateHighScoreDisplay() {
        const lists = [this.dom.highscoreList, this.dom.mobileHighscoreList];

        lists.forEach(list => {
            if (!list) return;
            // Clear all children safely (no innerHTML)
            while (list.firstChild) list.removeChild(list.firstChild);

            if (this.highScores.length === 0) {
                const li = document.createElement('li');
                const span = document.createElement('span');
                span.style.color = 'rgba(255,255,255,0.3)';
                span.textContent = 'Noch keine Scores';
                li.appendChild(span);
                list.appendChild(li);
                return;
            }
            this.highScores.slice(0, 10).forEach((entry, i) => {
                const li = document.createElement('li');
                const isObj = this._isScoreEntry(entry);
                const name = isObj ? entry.name : '???';
                const score = isObj ? entry.score : entry;

                const rankSpan = document.createElement('span');
                rankSpan.className = 'hs-rank';
                rankSpan.textContent = `#${i + 1}`;

                const nameSpan = document.createElement('span');
                nameSpan.className = 'hs-name';
                nameSpan.textContent = name;

                const scoreSpan = document.createElement('span');
                scoreSpan.className = 'hs-score';
                scoreSpan.textContent = score.toLocaleString();

                li.appendChild(rankSpan);
                li.appendChild(nameSpan);
                li.appendChild(scoreSpan);
                list.appendChild(li);
            });
        });
    }

    setupMobileLeaderboard() {
        const toggle = this.dom.lbToggle;
        const lb = this.dom.mobileLeaderboard;
        if (!toggle || !lb) return;

        const handleToggle = (e) => {
            e.preventDefault();
            e.stopPropagation();
            lb.classList.toggle('expanded');
        };
        toggle.addEventListener('touchend', handleToggle, { passive: false });
        toggle.addEventListener('click', handleToggle);
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

        // Base fill with glow (shadowBlur is expensive - only use for larger cells)
        ctx.fillStyle = color.fill;
        if (size > 14) {
            ctx.shadowColor = color.glow;
            ctx.shadowBlur = 8;
        }
        ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
        ctx.shadowBlur = 0;

        // Gradient overlay
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

        // Grid lines (batched into single path for fewer draw calls)
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        for (let x = 0; x <= COLS; x++) { ctx.moveTo(x*CELL, 0); ctx.lineTo(x*CELL, ROWS*CELL); }
        for (let y = 0; y <= ROWS; y++) { ctx.moveTo(0, y*CELL); ctx.lineTo(COLS*CELL, y*CELL); }
        ctx.stroke();

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
        if (this.spawnAlpha < 1) this.spawnAlpha = Math.min(1, this.spawnAlpha + SPAWN_FADE_SPEED);

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

    /** Main game loop - handles physics, input, animation, and rendering. */
    loop(time) {
        const dt = time - this.lastTime;
        this.lastTime = time;
        this.drawBackground();

        if (this.gameState === 'playing') {
            if (this.gameMode === 'online' && this.vsBoards) {
                // Online mode: only update local board, remote is display-only
                const local = this.vsBoards[0];
                this._vsHandleDAS(local, time, 'moveLeft', 'moveRight', 'softDrop');
                this._updateVsBoard(local, time, dt);
                this._updateVsHud();
                this.audio.setDangerLevel(local.getDangerLevel());
                // Send state to opponent periodically
                this._onlineSyncFrame++;
                if (this._onlineSyncFrame % 6 === 0) this._onlineSendState();
            } else if (this.gameMode === 'vs' && this.vsBoards) {
                // VS mode update
                const [b1, b2] = this.vsBoards;
                this._vsHandleDAS(b1, time, 'a', 'd', 's');
                this._vsHandleDAS(b2, time, 'left', 'right', 'down');
                this._updateVsBoard(b1, time, dt);
                this._updateVsBoard(b2, time, dt);
                this._updateVsHud();
                // Danger-based music: use highest danger level
                this.audio.setDangerLevel(Math.max(b1.getDangerLevel(), b2.getDangerLevel()));
            } else {
                // Single-player update
                this.handleDAS(time);
                const interval = getDropInterval(this.level);
                if (time - this.lastDrop >= interval) {
                    if (!this.movePiece(0, 1)) {
                        this.lockDelay += interval;
                        if (this.lockDelay >= LOCK_DELAY_MS) this.lockPiece();
                    } else { this.lockDelay = 0; }
                    this.lastDrop = time;
                }
                if (this.currentPiece && !this.isValid(this.currentPiece, this.currentPiece.shape, this.currentPiece.x, this.currentPiece.y + 1)) {
                    this.lockDelay += dt;
                    if (this.lockDelay >= LOCK_DELAY_MS) this.lockPiece();
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
                this.audio.setDangerLevel(this.getDangerLevel());
                this.updateUI();
            }
        }

        if (this.screenShake > 0) this.screenShake--;
        if (this.levelUpFlash > 0) this.levelUpFlash--;
        if (this.impactFlash > 0) this.impactFlash--;
        this.particles.update();
        this.confetti.update();
        this.render();
        this.animFrame = requestAnimationFrame(t => this.loop(t));
    }

    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // VS / Online mode rendering
        if ((this.gameMode === 'vs' || this.gameMode === 'online') && this.vsBoards) {
            const p2Offset = (COLS + VS_GAP) * CELL;

            // Draw gap between boards
            ctx.fillStyle = 'rgba(5, 5, 15, 0.95)';
            ctx.fillRect(COLS * CELL, 0, VS_GAP * CELL, ROWS * CELL);

            // Draw "VS" in the gap
            ctx.save();
            ctx.fillStyle = 'rgba(255,0,68,0.3)';
            ctx.font = `bold ${Math.max(10, CELL)}px Orbitron, monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('VS', COLS * CELL + (VS_GAP * CELL) / 2, ROWS * CELL / 2);
            ctx.restore();

            this._renderVsBoard(this.vsBoards[0], 0, 'rgba(0,240,255,0.3)');
            this._renderVsBoard(this.vsBoards[1], p2Offset, 'rgba(255,0,170,0.3)');
            return;
        }

        // Single-player rendering
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

        // Hard drop impact flash
        if (this.impactFlash > 0) {
            const flashAlpha = (this.impactFlash / 8) * 0.6;
            this.impactFlashRows.forEach(row => {
                if (row >= 0 && row < ROWS) {
                    ctx.fillStyle = `rgba(255,255,255,${flashAlpha})`;
                    ctx.fillRect(0, row * CELL, COLS * CELL, CELL);
                }
            });
        }

        this.drawGrid();

        if (this.gameState === 'playing' || this.gameState === 'paused') {
            this.drawCurrentPiece();
        }

        ctx.restore();
        this.particles.draw(ctx);

        // Border glow - changes color with level theme
        ctx.save();
        const theme = this._getLevelTheme();
        const [tr, tg, tb] = theme.accent;
        const borderGrad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        borderGrad.addColorStop(0, `rgba(${tr}, ${tg}, ${tb}, 0.15)`);
        borderGrad.addColorStop(0.5, `rgba(${tr}, ${tg}, ${tb}, 0.05)`);
        borderGrad.addColorStop(1, `rgba(${tr}, ${tg}, ${tb}, 0.15)`);
        ctx.strokeStyle = borderGrad;
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.restore();
    }
}

// --- Initialize ---
window.addEventListener('DOMContentLoaded', () => { new NeonBlocks(); });

})();
