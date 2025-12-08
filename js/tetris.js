// tetris.js – exakt wie in deiner Vorlage, als Modul
export const TetrisAPI = {};

const COLS = 10, ROWS = 20, BLOCK = 24;
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.style.width = (COLS * BLOCK) + 'px';
canvas.style.height = (ROWS * BLOCK) + 'px';
ctx.scale(BLOCK, BLOCK);

let board, cur, nextPiece, score = 0, level = 0, lines = 0;
let dropInterval = 1000, lastDrop = 0;
let gameOver = false, paused = false;

// Pieces (wie in Vorlage)
const pieces = {
    I: { color: '#00e5ff', blocks: [[0, 1], [1, 1], [2, 1], [3, 1]] },
    J: { color: '#0055ff', blocks: [[0, 0], [0, 1], [1, 1], [2, 1]] },
    L: { color: '#ff9900', blocks: [[2, 0], [0, 1], [1, 1], [2, 1]] },
    O: { color: '#ffd700', blocks: [[1, 0], [2, 0], [1, 1], [2, 1]] },
    S: { color: '#00cc44', blocks: [[1, 0], [2, 0], [0, 1], [1, 1]] },
    T: { color: '#b26cff', blocks: [[1, 0], [0, 1], [1, 1], [2, 1]] },
    Z: { color: '#ff3366', blocks: [[0, 0], [1, 0], [1, 1], [2, 1]] },
};
const bag = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

function emptyBoard() { return Array.from({ length: ROWS }, () => Array(COLS).fill(null)); }
function clone(o) { return JSON.parse(JSON.stringify(o)); }

function pieceToMatrix(cells) {
    let maxX = 0, maxY = 0;
    for (const [x, y] of cells) { if (x > maxX) maxX = x; if (y > maxY) maxY = y; }
    const m = Array.from({ length: maxY + 1 }, () => Array(maxX + 1).fill(0));
    cells.forEach(([x, y]) => m[y][x] = 1);
    return m;
}

function rotateMatrix(m) {
    const h = m.length, w = m[0].length;
    const r = Array.from({ length: w }, () => Array(h).fill(0));
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) r[x][h - 1 - y] = m[y][x];
    return r;
}

function randomPiece() {
    if (!randomPiece._bag || randomPiece._bag.length === 0) {
        randomPiece._bag = bag.slice();
        for (let i = randomPiece._bag.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [randomPiece._bag[i], randomPiece._bag[j]] = [randomPiece._bag[j], randomPiece._bag[i]];
        }
    }
    return randomPiece._bag.pop();
}

function getTopOffset(shape) { for (let y = 0; y < shape.length; y++) if (shape[y].some(v => v)) return y; return 0; }

function collides(shape, x, y) {
    for (let sy = 0; sy < shape.length; sy++) {
        for (let sx = 0; sx < shape[0].length; sx++) {
            if (!shape[sy][sx]) continue;
            const bx = x + sx, by = y + sy;
            if (bx < 0 || bx >= COLS || by >= ROWS) return true;
            if (by >= 0 && board[by][bx]) return true;
        }
    }
    return false;
}

function spawnPiece() {
    if (!nextPiece) nextPiece = randomPiece();
    const type = nextPiece;
    nextPiece = randomPiece();
    const shape = pieceToMatrix(pieces[type].blocks);
    const x = Math.floor((COLS - shape[0].length) / 2);
    const y = -getTopOffset(shape);
    cur = { type, shape, x, y, color: pieces[type].color };
    if (collides(cur.shape, cur.x, cur.y)) gameOver = true;
}

function lockPiece() {
    const s = cur.shape;
    for (let y = 0; y < s.length; y++) {
        for (let x = 0; x < s[0].length; x++) {
            if (s[y][x]) {
                const bx = cur.x + x, by = cur.y + y;
                if (by >= 0 && by < ROWS && bx >= 0 && bx < COLS) board[by][bx] = { type: cur.type, color: cur.color };
            }
        }
    }
    clearLines();
    spawnPiece();
}

function clearLines() {
    let removed = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
        if (board[y].every(c => c)) { board.splice(y, 1); board.unshift(Array(COLS).fill(null)); removed++; y++; }
    }
    if (removed > 0) {
        lines += removed;
        score += (removed === 1 ? 100 : removed === 2 ? 300 : removed === 3 ? 500 : 800) * (level + 1);
        level = Math.floor(lines / 10);
        dropInterval = Math.max(100, 1000 - level * 100);
        updateHUD();
    }
}

function move(dx) { if (!cur || gameOver || paused) return; const nx = cur.x + dx; if (!collides(cur.shape, nx, cur.y)) cur.x = nx; }
function rotate() {
    if (!cur || gameOver || paused) return;
    const rotated = rotateMatrix(cur.shape);
    const kicks = [0, -1, 1, -2, 2];
    for (const k of kicks) {
        if (!collides(rotated, cur.x + k, cur.y)) {
            cur.shape = rotated;
            cur.x += k;
            // **cur.color bleibt unverändert**
            return;
        }
    }
}
function softDrop() { if (!cur || gameOver || paused) return; if (!collides(cur.shape, cur.x, cur.y + 1)) { cur.y++; score += 1; } else { lockPiece(); } }
function hardDrop() {
    if (!cur || gameOver || paused) return;
    while (!collides(cur.shape, cur.x, cur.y + 1)) {
        cur.y++;
        score += 2;
    }
    lockPiece();
    updateHUD();
}

function updateHUD() {
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
    document.getElementById('lines').textContent = lines;
}

function drawCell(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x + 0.03, y + 0.03, 0.94, 0.94);
    ctx.fillStyle = hexShade(color, -0.18);
    ctx.fillRect(x + 0.03, y + 0.03, 0.94, 0.2);
}
function hexShade(hex, percent) { const num = parseInt(hex.slice(1), 16); const r = Math.min(255, Math.max(0, Math.floor(((num >> 16) & 255) * (1 + percent)))); const g = Math.min(255, Math.max(0, Math.floor(((num >> 8) & 255) * (1 + percent)))); const b = Math.min(255, Math.max(0, Math.floor(((num) & 255) * (1 + percent)))); return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1); }

function render() {
    ctx.clearRect(0, 0, COLS, ROWS);
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            ctx.fillStyle = '#0b0b0b'; ctx.fillRect(x, y, 1, 1);
            ctx.strokeStyle = '#0f0f0f'; ctx.lineWidth = 0.03; ctx.strokeRect(x + 0.01, y + 0.01, 0.98, 0.98);
            const c = board[y][x]; if (c) drawCell(x, y, c.color);
        }
    }
    if (cur) { for (let y = 0; y < cur.shape.length; y++) { for (let x = 0; x < cur.shape[0].length; x++) { if (cur.shape[y][x]) { const bx = cur.x + x, by = cur.y + y; if (by >= 0) drawCell(bx, by, cur.color); } } } }
}

function step(time) {
    if (gameOver || paused) { render(); return; }
    if (time - lastDrop > dropInterval) {
        if (!collides(cur.shape, cur.x, cur.y + 1)) cur.y++;
        else lockPiece();
        lastDrop = time;
    }
    render();
    requestAnimationFrame(step);
}

function reset() {
    board = emptyBoard(); score = 0; lines = 0; level = 0; dropInterval = 1000; lastDrop = 0;
    gameOver = false; paused = false; nextPiece = randomPiece(); spawnPiece(); updateHUD();
}

reset();
requestAnimationFrame(step);


/* ---------- API für externe Steuerung ---------- */
window.TetrisAPI = {
    left: () => move(-1),
    right: () => move(1),
    rotate: () => rotate(),
    softDrop: () => softDrop(),
    hardDrop: () => hardDrop(),
    pause: () => { paused = true; },
    resume: () => { paused = false; lastDrop = performance.now(); },
    togglePause: () => { paused = !paused; },
    reset: () => { reset(); },
    getState: () => ({
        score, level, lines,
        board: clone(board),
        current: cur ? { type: cur.type, x: cur.x, y: cur.y } : {}
    })
};