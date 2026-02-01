const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');
const noBtn = document.getElementById('noBtn');
const yesBtn = document.getElementById('yesBtn');
const deathScreen = document.getElementById('death-screen');
const victoryScreen = document.getElementById('victory-screen');
const hpDisplay = document.getElementById('hp-hearts');
const audioToggle = document.getElementById('audio-control');

let width, height, particles = [], mouse = { x: 0, y: 0 };
let gameState = 'playing';
let noState = { x: 0, y: 0, vx: 0, vy: 0 };
let bossHP = 3;
let audioCtx = null;

function init() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    noState.x = width / 2 + 120;
    noState.y = height / 2;
}

window.addEventListener('resize', init);
window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });

// --- SOUNDS ---
function playOof() {
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.1);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.1);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(t + 0.1);
}

function playDeath() {
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.linearRampToValueAtTime(20, t + 0.6);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.6);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(t + 0.6);
}

function playVictory() {
    if (!audioCtx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    notes.forEach((freq, i) => {
        const t = audioCtx.currentTime + (i * 0.1);
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(t); osc.stop(t + 0.5);
    });
}

audioToggle.addEventListener('click', () => {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    audioToggle.innerText = "🎵 AUDIO ACTIVE";
});

// --- PARTICLES (CONFETTI & HEARTS) ---
class Particle {
    constructor(x, y, type) {
        this.x = x; this.y = y;
        this.type = type;
        this.vx = (Math.random() - 0.5) * 15;
        this.vy = (Math.random() - 2) * 10;
        this.life = 1.0;
        this.color = type === 'heart' ? '#ff4d6d' : `hsl(${Math.random() * 360}, 100%, 70%)`;
        this.size = Math.random() * 5 + 3;
    }
    update() {
        this.x += this.vx; this.y += this.vy;
        this.vy += 0.2; // gravity
        this.life -= 0.01;
    }
    draw() {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        if (this.type === 'heart') {
            const s = this.size / 2;
            ctx.fillRect(this.x, this.y, s, s);
            ctx.fillRect(this.x - s, this.y - s, s, s);
            ctx.fillRect(this.x + s, this.y - s, s, s);
        } else {
            ctx.fillRect(this.x, this.y, this.size, this.size);
        }
    }
}

// --- GAME LOOP ---
function loop() {
    ctx.clearRect(0, 0, width, height);
    
    if (gameState === 'playing' && bossHP > 0) {
        const dx = mouse.x - noState.x;
        const dy = mouse.y - noState.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 200) {
            const angle = Math.atan2(dy, dx);
            noState.vx = -Math.cos(angle) * 25;
            noState.vy = -Math.sin(angle) * 25;
            noBtn.classList.add('shake');
        } else {
            noBtn.classList.remove('shake');
        }

        noState.vx *= 0.92; noState.vy *= 0.92;
        noState.x += noState.vx; noState.y += noState.vy;

        // Boundary Lock
        const p = 80;
        if (noState.x < p) { noState.x = p; noState.vx *= -1; }
        if (noState.x > width - p) { noState.x = width - p; noState.vx *= -1; }
        if (noState.y < p) { noState.y = p; noState.vy *= -1; }
        if (noState.y > height - p) { noState.y = height - p; noState.vy *= -1; }

        noBtn.style.left = `${noState.x}px`;
        noBtn.style.top = `${noState.y}px`;
        noBtn.style.transform = `translate(-50%, -50%)`;
    }

    particles.forEach((p, i) => {
        p.update(); p.draw();
        if (p.life <= 0) particles.splice(i, 1);
    });

    requestAnimationFrame(loop);
}

// --- EVENT HANDLERS ---
noBtn.addEventListener('click', () => {
    if (gameState !== 'playing' || bossHP <= 0) return;
    bossHP--;
    hpDisplay.innerText = "❤️".repeat(bossHP) + "🖤".repeat(3 - bossHP);
    gameState = 'paused';
    deathScreen.classList.remove('hidden');
    playOof();

    setTimeout(() => {
        if (bossHP > 0) {
            deathScreen.classList.add('hidden');
            gameState = 'playing';
            noState.x = Math.random() * (width - 200) + 100;
            noState.y = Math.random() * (height - 200) + 100;
        } else {
            deathScreen.classList.add('hidden');
            noBtn.remove();
            yesBtn.classList.add('enlarged');
            playDeath();
            document.getElementById('boss-name').innerText = "ENTITY_DELETED";
            gameState = 'playing';
        }
    }, 1000);
});

yesBtn.addEventListener('click', () => {
    gameState = 'winning';
    victoryScreen.classList.remove('hidden');
    playVictory();
    // Massive Confetti Fall
    for(let i=0; i<300; i++) {
        setTimeout(() => {
            particles.push(new Particle(Math.random() * width, -20, Math.random() > 0.3 ? 'confetti' : 'heart'));
        }, i * 5);
    }
});

init();
loop();
