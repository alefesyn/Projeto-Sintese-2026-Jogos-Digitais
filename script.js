/* ================= SELEÇÃO DE ELEMENTOS DO DOM ================= */
const menuScreen = document.getElementById('menu-screen');
const gameScreen = document.getElementById('game-screen');
const gameoverScreen = document.getElementById('gameover-screen');
const victoryScreen = document.getElementById('victory-screen');
const startBtn = document.getElementById('start-btn');
const retryBtn = document.getElementById('retry-btn');
const menuBtn = document.getElementById('menu-btn');
const victoryRetryBtn = document.getElementById('victory-retry-btn');
const victoryMenuBtn = document.getElementById('victory-menu-btn');
const memoryBoard = document.getElementById('memory-board');
const gameHud = document.getElementById('game-hud');
const timerDisplay = document.getElementById('timer-display');
const boardBlackHole = document.getElementById('board-black-hole');

const themeSelect = document.getElementById('theme-select');
const diffSelect = document.getElementById('diff-select');
const timerSelect = document.getElementById('timer-select');

/* ================= VARIÁVEIS DE ESTADO DA PARTIDA ================= */
let currentTheme = 'theme-deepspace';
let currentDiff = 'normal';
let currentTimerMode = 'off';

let timerInterval = null;
let timeLeft = 0;
let hasFlippedCard = false;
let lockBoard = false;
let firstCard, secondCard;
let matchedPairsCount = 0;
let totalPairsNeeded = 0;

/* ================= BANCO DE ÍCONES CÓSMICOS ================= */
const cosmicIcons = ['🌍', '🔴', '🪐', '🚀', '⭐', '☄️', '🛸', '🛰️', '🌕', '🌀', '🔭', '👽', '🌞', '🌌', '⚡', '⚪', '💎', '🔥'];

/* ================= LEITURA DOS MENUS DROPDOWN ================= */
themeSelect.addEventListener('change', (e) => {
    currentTheme = e.target.value;
    document.body.className = currentTheme;
});

diffSelect.addEventListener('change', (e) => {
    currentDiff = e.target.value;
});

timerSelect.addEventListener('change', (e) => {
    currentTimerMode = e.target.value;
});

/* ================= TRANSIÇÕES DE TELA (BOTÕES DE NAVEGAÇÃO) ================= */
startBtn.addEventListener('click', () => {
    menuScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    gameoverScreen.classList.add('hidden');
    victoryScreen.classList.add('hidden');
    initGame();
});

retryBtn.addEventListener('click', () => {
    gameoverScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    boardBlackHole.classList.remove('active');
    boardBlackHole.classList.add('hidden');
    initGame();
});

victoryRetryBtn.addEventListener('click', () => {
    victoryScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    boardBlackHole.classList.remove('active');
    boardBlackHole.classList.add('hidden');
    initGame();
});

menuBtn.addEventListener('click', () => {
    gameoverScreen.classList.add('hidden');
    gameScreen.classList.add('hidden');
    boardBlackHole.classList.remove('active');
    boardBlackHole.classList.add('hidden');
    menuScreen.classList.remove('hidden');
    stopTimer();
});

victoryMenuBtn.addEventListener('click', () => {
    victoryScreen.classList.add('hidden');
    gameScreen.classList.add('hidden');
    boardBlackHole.classList.remove('active');
    boardBlackHole.classList.add('hidden');
    menuScreen.classList.remove('hidden');
    stopTimer();
});

/* ================= INICIALIZAÇÃO DA PARTIDA ================= */
function initGame() {
    memoryBoard.innerHTML = '';
    memoryBoard.className = `memory-board diff-${currentDiff}`;
    matchedPairsCount = 0;
    lockBoard = false;
    hasFlippedCard = false;
    firstCard = null;
    secondCard = null;

    let pairCount = 4;
    if (currentDiff === 'hard') pairCount = 8;
    if (currentDiff === 'veryhard') pairCount = 12;
    if (currentDiff === 'extra') pairCount = 16;
    totalPairsNeeded = pairCount;

    let selectedIcons = cosmicIcons.slice(0, pairCount);
    let cardIcons = [...selectedIcons, ...selectedIcons];

    cardIcons.forEach(icon => {
        const card = document.createElement('div');
        card.classList.add('memory-card');
        card.setAttribute('data-framework', icon);

        card.innerHTML = `
            <div class="front-face">${icon}</div>
            <div class="back-face">🌌</div>
        `;
        card.addEventListener('click', flipCard);
        memoryBoard.appendChild(card);
    });

    shuffleCards();
    setupTimer(pairCount);
}

/* ================= SISTEMA DE TEMPORIZADOR ================= */
function setupTimer(pairCount) {
    if (currentTimerMode === 'off') {
        gameHud.classList.add('hidden');
        return;
    }

    gameHud.classList.remove('hidden');

    let baseSeconds = pairCount * 8;
    if (currentTimerMode === 'normal') baseSeconds = pairCount * 7;
    if (currentTimerMode === 'fast') baseSeconds = Math.max(10, pairCount * 5);

    timeLeft = Math.floor(baseSeconds);
    updateTimerDisplay();

    stopTimer();
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();

        if (timeLeft <= 0) {
            stopTimer();
            triggerBlackHoleGameOver();
        }
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function updateTimerDisplay() {
    let mins = Math.floor(timeLeft / 60);
    let secs = timeLeft % 60;
    timerDisplay.textContent = `Tempo: ${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/* ================= LÓGICA DE JOGADA: VIRAR CARTA ================= */
function flipCard() {
    if (lockBoard) return;
    if (this === firstCard) return;

    this.classList.add('flip');

    if (!hasFlippedCard) {
        hasFlippedCard = true;
        firstCard = this;
        return;
    }

    secondCard = this;
    checkForMatch();
}

/* ================= VERIFICAÇÃO DE PAR (MATCH) ================= */
function checkForMatch() {
    let isMatch = firstCard.dataset.framework === secondCard.dataset.framework;
    isMatch ? handleMatch() : unflipCards();
}

/* ================= AÇÕES AO ACERTAR UM PAR ================= */
function handleMatch() {
    firstCard.removeEventListener('click', flipCard);
    secondCard.removeEventListener('click', flipCard);

    firstCard.classList.add('match-effect');
    secondCard.classList.add('match-effect');

    createCometCascade(firstCard);
    createCometCascade(secondCard);

    matchedPairsCount++;
    resetBoard();

    if (matchedPairsCount === totalPairsNeeded) {
        stopTimer();
        setTimeout(() => {
            gameScreen.classList.add('hidden');
            victoryScreen.classList.remove('hidden');
        }, 800);
    }
}

function unflipCards() {
    lockBoard = true;
    setTimeout(() => {
        firstCard.classList.remove('flip');
        secondCard.classList.remove('flip');
        resetBoard();
    }, 700);
}

function resetBoard() {
    [hasFlippedCard, lockBoard] = [false, false];
    [firstCard, secondCard] = [null, null];
}

function shuffleCards() {
    const cards = document.querySelectorAll('.memory-card');
    cards.forEach(card => {
        let randomPos = Math.floor(Math.random() * cards.length);
        card.style.order = randomPos;
    });
}

/* ================= EFEITO VISUAL: CASCATA DE COMETAS ================= */
function createCometCascade(cardElement) {
    const rect = cardElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    for (let i = 0; i < 12; i++) {
        const particle = document.createElement('div');
        particle.classList.add('comet-particle');
        particle.style.left = `${centerX}px`;
        particle.style.top = `${centerY}px`;

        const angle = Math.random() * Math.PI * 2;
        const distance = 60 + Math.random() * 100;
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance;

        particle.style.setProperty('--dx', `${dx}px`);
        particle.style.setProperty('--dy', `${dy}px`);

        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 700);
    }
}

/* ================= GAME OVER: BURACO NEGRO CONTÍNUO ================= */
function triggerBlackHoleGameOver() {
    lockBoard = true;
    const cards = document.querySelectorAll('.memory-card');

    boardBlackHole.style.top = '50vh';
    boardBlackHole.style.left = '50vw';
    boardBlackHole.style.transform = 'translate(-50%, -50%) scale(1)';
    boardBlackHole.classList.remove('hidden');
    boardBlackHole.classList.add('active');

    cards.forEach((card, index) => {
        const rect = card.getBoundingClientRect();
        const screenCenterX = window.innerWidth / 2;
        const screenCenterY = window.innerHeight / 2;
        
        const dx = screenCenterX - (rect.left + rect.width / 2);
        const dy = screenCenterY - (rect.top + rect.height / 2);

        card.style.setProperty('--suck-x', `${dx}px`);
        card.style.setProperty('--suck-y', `${dy}px`);

        setTimeout(() => {
            card.classList.add('black-hole-suck');
        }, index * 60);
    });

    const suckDuration = cards.length * 60 + 800;
    setTimeout(() => {
        gameoverScreen.style.visibility = 'hidden';
        gameoverScreen.classList.remove('hidden');
        
        const modalBox = gameoverScreen.querySelector('.gameover-content');
        const modalRect = modalBox.getBoundingClientRect();
        // Ajustado para pousar perfeitamente acima do título do modal, sem cobrir o texto
        const targetY = modalRect.top - 45;

        gameoverScreen.classList.add('hidden');
        gameoverScreen.style.visibility = '';

        boardBlackHole.style.top = `${targetY}px`;
        boardBlackHole.style.left = '50vw';
        boardBlackHole.style.transform = 'translate(-50%, -50%) scale(1.05)';
        
        gameoverScreen.classList.remove('hidden');
        gameScreen.classList.add('hidden');
    }, suckDuration);
}