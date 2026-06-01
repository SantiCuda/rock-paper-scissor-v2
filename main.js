/* ══════════════════════════════
   YOUTUBE API
══════════════════════════════ */
const YT_VIDEO_ID = 'HX_chhBXuGc';
const YT_QUEEN_ID = 'skVg5FlVKS0';
let ytPlayer = null, ytQueen = null;
let ytReady  = false, queenReady = false;
let musicOn  = false, pendingPlay = false;
const musicBtn = document.getElementById('music-btn');

(function loadYTApi() {
  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(tag);
})();

window.onYouTubeIframeAPIReady = function() {
  ytPlayer = new YT.Player('yt-player', {
    videoId: YT_VIDEO_ID,
    playerVars: { autoplay:0, controls:0, loop:1, playlist:YT_VIDEO_ID, mute:0, rel:0, modestbranding:1 },
    events: {
      onReady: function(e) {
        ytReady = true;
        e.target.setVolume(70);
        if (pendingPlay) { e.target.playVideo(); musicOn = true; syncMusicBtn(); pendingPlay = false; }
      },
      onStateChange: function(e) {
        if (musicOn && e.data === YT.PlayerState.ENDED) { ytPlayer.seekTo(0); ytPlayer.playVideo(); }
      }
    }
  });

  ytQueen = new YT.Player('yt-queen', {
    videoId: YT_QUEEN_ID,
    playerVars: { autoplay:0, controls:0, loop:0, mute:0, rel:0, modestbranding:1 },
    events: {
      onReady: function(e) { queenReady = true; e.target.setVolume(90); }
    }
  });
};

function startMusic() {
  if (!ytReady) { pendingPlay = true; return; }
  ytPlayer.seekTo(0);
  ytPlayer.playVideo();
  musicOn = true;
  syncMusicBtn();
}

function toggleMusic() {
  if (!ytReady) return;
  if (musicOn) { ytPlayer.pauseVideo(); musicOn = false; }
  else         { ytPlayer.playVideo();  musicOn = true;  }
  syncMusicBtn();
}

function syncMusicBtn() {
  musicBtn.textContent = musicOn ? '🔊' : '🔇';
  musicBtn.classList.toggle('on', musicOn);
}

musicBtn.addEventListener('click', toggleMusic);

/* ══════════════════════════════
   AUDIO FX
══════════════════════════════ */
let audioUnlocked = false;

function unlockAudios() {
  if (audioUnlocked) return;
  audioUnlocked = true;
  ['kiai-audio', 'damage-audio', 'explosion-audio', 'perdiste-audio'].forEach(id => {
    const a = document.getElementById(id);
    a.play().then(() => a.pause()).catch(() => {});
  });
  if (queenReady) {
    ytQueen.playVideo();
    setTimeout(() => { ytQueen.pauseVideo(); }, 300);
  }
}

function playSfx(id) {
  const a = document.getElementById(id);
  a.volume = 1.0;
  a.currentTime = 0;
  a.play().catch(() => {});
}

/* ══════════════════════════════
   GAME LOGIC
══════════════════════════════ */
const MAX_SCORE = 5;
const emojis = { rock:'✊', paper:'✋', scissors:'✌️' };
const names  = { rock:'PIEDRA', paper:'PAPEL', scissors:'TIJERA' };
let playerScore = 0, cpuScore = 0, busy = false, selectedChar = null;

// INTRO
document.getElementById('intro-screen').addEventListener('click', () => {
  const el = document.getElementById('intro-screen');
  el.style.transition = 'opacity 1s';
  el.style.opacity = '0';
  setTimeout(() => {
    el.style.display = 'none';
    document.getElementById('char-screen').style.display = 'flex';
  }, 1000);
});

// CHAR SELECT
function selectChar(idx) {
  selectedChar = idx;
  [0, 1, 2].forEach(i => document.getElementById('card-' + i).classList.remove('selected'));
  document.getElementById('card-' + idx).classList.add('selected');
  document.getElementById('char-confirm-btn').style.display = 'inline-block';
}

function confirmChar() {
  const cs = document.getElementById('char-screen');
  cs.style.transition = 'opacity .6s';
  cs.style.opacity = '0';
  setTimeout(() => {
    cs.style.display = 'none';
    initGame();
    document.getElementById('game-screen').style.display = 'flex';
    startMusic();
  }, 600);
}

// GAME INIT
function initGame() {
  playerScore = 0; cpuScore = 0; busy = false;
  audioUnlocked = false;
  buildPips('player-pips', MAX_SCORE, false);
  buildPips('cpu-pips',    MAX_SCORE, true);
  updateScoreNums();
  document.getElementById('status-msg').textContent = 'Elige tu arma...';
  document.getElementById('status-msg').style.color = '#2a2a2a';
  document.getElementById('player-choice-box').classList.remove('visible');
  document.getElementById('cpu-choice-box').classList.remove('visible');
}

function buildPips(id, count, isCpu) {
  const el = document.getElementById(id);
  el.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const pip = document.createElement('div');
    pip.className = 'pip';
    pip.id = (isCpu ? 'cpu-pip-' : 'player-pip-') + i;
    el.appendChild(pip);
  }
}

function fillPip(isCpu, index) {
  const pip = document.getElementById((isCpu ? 'cpu-pip-' : 'player-pip-') + index);
  if (!pip) return;
  pip.classList.add(isCpu ? 'cpu-filled' : 'player-filled', 'pip-new');
  setTimeout(() => pip.classList.remove('pip-new'), 400);
}

function updateScoreNums() {
  document.getElementById('score-player-num').textContent = playerScore;
  document.getElementById('score-cpu-num').textContent    = cpuScore;
}

function popNum(id) {
  const el = document.getElementById(id);
  el.classList.remove('num-pop');
  void el.offsetWidth;
  el.classList.add('num-pop');
  setTimeout(() => el.classList.remove('num-pop'), 350);
}

function getWinner(p, c) {
  if (p === c) return 'tie';
  if ((p==='rock'&&c==='scissors') || (p==='paper'&&c==='rock') || (p==='scissors'&&c==='paper')) return 'win';
  return 'lose';
}

function play(playerChoice) {
  if (busy) return;
  busy = true;
  unlockAudios();
  showLaugh();

  setTimeout(() => {
    const choices = ['rock', 'paper', 'scissors'];
    const cpuChoice = choices[Math.floor(Math.random() * 3)];
    const result = getWinner(playerChoice, cpuChoice);
    hideLaugh();
    revealChoices(playerChoice, cpuChoice);
    setTimeout(() => { applyResult(result, playerChoice, cpuChoice); busy = false; }, 450);
  }, 800);
}

function revealChoices(p, c) {
  const pb = document.getElementById('player-choice-box');
  const cb = document.getElementById('cpu-choice-box');
  pb.classList.remove('visible');
  cb.classList.remove('visible');
  document.getElementById('player-emoji').textContent = emojis[p];
  document.getElementById('cpu-emoji').textContent    = emojis[c];
  requestAnimationFrame(() => requestAnimationFrame(() => {
    pb.classList.add('visible');
    cb.classList.add('visible');
  }));
}

function applyResult(result, pChoice, cChoice) {
  const statusEl = document.getElementById('status-msg');

  if (result === 'win') {
    fillPip(false, playerScore); playerScore++;
    updateScoreNums(); popNum('score-player-num');
    statusEl.style.color = '#00f5ff';
    statusEl.textContent = `¡GOLPE DIRECTO! ${names[pChoice]} venció a ${names[cChoice]}`;
    const cpu = document.getElementById('cpu-enemy');
    cpu.classList.remove('cpu-idle');
    cpu.classList.add('cpu-hit-anim');
    setTimeout(() => { cpu.classList.remove('cpu-hit-anim'); cpu.classList.add('cpu-idle'); }, 700);
    playSfx('kiai-audio');
    showResult('¡IMPACTO!', 'result-win');

  } else if (result === 'lose') {
    fillPip(true, cpuScore); cpuScore++;
    updateScoreNums(); popNum('score-cpu-num');
    statusEl.style.color = '#ff3333';
    statusEl.textContent = `¡TE APLASTÓ! ${names[cChoice]} venció a ${names[pChoice]}`;
    const flash = document.getElementById('hit-flash');
    flash.classList.remove('flash-active');
    void flash.offsetWidth;
    flash.classList.add('flash-active');
    const playerEl = document.getElementById('player-char');
    playerEl.classList.add('player-hit-anim');
    setTimeout(() => playerEl.classList.remove('player-hit-anim'), 500);
    playSfx('damage-audio');
    showResult('¡FALLASTE!', 'result-lose');

  } else {
    statusEl.style.color = '#444';
    statusEl.textContent = `EMPATE — ${names[pChoice]} vs ${names[cChoice]}`;
    showResult('EMPATE', 'result-tie');
  }

  if (playerScore >= MAX_SCORE || cpuScore >= MAX_SCORE) {
    setTimeout(triggerGameOver, 1300);
  } else {
    setTimeout(() => {
      if (playerScore < MAX_SCORE && cpuScore < MAX_SCORE) {
        statusEl.textContent = 'Elige tu arma...';
        statusEl.style.color = '#2a2a2a';
      }
    }, 2500);
  }
}

function showResult(text, cls) {
  const el = document.getElementById('round-result');
  el.textContent = text;
  el.className = cls + ' result-show';
  setTimeout(() => { el.className = ''; el.textContent = ''; }, 950);
}

function showLaugh() {
  const b = document.getElementById('laugh-bubble');
  const msgs = ['HA HA HA!', 'MUERE!', '∅ RESISTENCIA', 'PREDECIBLE', 'DATOS=PODER', 'PROCESANDO...'];
  b.textContent = msgs[Math.floor(Math.random() * msgs.length)];
  b.className = '';
  void b.offsetWidth;
  b.className = 'laugh-show';
}

function hideLaugh() {
  const b = document.getElementById('laugh-bubble');
  b.style.transition = 'opacity .2s';
  b.style.opacity = '0';
  setTimeout(() => { b.style.transition = ''; b.style.opacity = ''; b.className = ''; }, 220);
}

function triggerGameOver() {
  if (playerScore >= MAX_SCORE) triggerVictory();
  else                          triggerDefeat();
}

function triggerVictory() {
  if (ytReady)    ytPlayer.pauseVideo();
  if (queenReady) ytQueen.playVideo();
  musicOn = false; syncMusicBtn();
  playSfx('explosion-audio');
  document.getElementById('victory-score').innerHTML =
    `<span style="color:var(--cyan)">${playerScore}</span> <span style="color:#222">—</span> <span style="color:var(--red)">${cpuScore}</span>`;
  document.getElementById('victory-screen').style.display = 'flex';
}

function triggerDefeat() {
  if (ytReady) ytPlayer.pauseVideo();
  musicOn = false; syncMusicBtn();
  playSfx('perdiste-audio');
  document.getElementById('game-over-title').textContent = 'DERROTA';
  document.getElementById('game-over-title').style.color = '#ff1a1a';
  document.getElementById('game-over-title').style.textShadow = '0 0 30px #f00,0 0 60px #f00';
  document.getElementById('game-over-sub').textContent = 'El CPU te aplastó. Las máquinas siguen dominando...';
  document.getElementById('game-over-score').innerHTML =
    `<span style="color:var(--cyan)">${playerScore}</span> <span style="color:#222">—</span> <span style="color:var(--red)">${cpuScore}</span>`;
  document.getElementById('game-over-overlay').style.display = 'flex';
}

function restartFromVictory() {
  document.getElementById('victory-screen').style.display = 'none';
  if (queenReady) ytQueen.stopVideo();
  initGame(); startMusic();
}

function goToCharSelectFromVictory() {
  document.getElementById('victory-screen').style.display = 'none';
  document.getElementById('game-screen').style.display = 'none';
  if (queenReady) ytQueen.stopVideo();
  showCharScreen();
}

function restartGame() {
  document.getElementById('game-over-overlay').style.display = 'none';
  initGame(); startMusic();
}

function goToCharSelect() {
  document.getElementById('game-over-overlay').style.display = 'none';
  document.getElementById('game-screen').style.display = 'none';
  if (queenReady) ytQueen.stopVideo();
  showCharScreen();
}

function showCharScreen() {
  const cs = document.getElementById('char-screen');
  cs.style.opacity = '0';
  cs.style.display = 'flex';
  setTimeout(() => { cs.style.transition = 'opacity .5s'; cs.style.opacity = '1'; }, 50);
}