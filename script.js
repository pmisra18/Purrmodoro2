/* -------------------------------------------------------------
   PURRMODORO - Walking Wheel Timer Engine & Sync
   ------------------------------------------------------------- */

// Medical Curriculum with no textbook requirements for OPP/OMM & CE
const MEDICAL_CURRICULUM = {
  "🦴 OPP / OMM": {
    resources: [
      "OMM Lab & Practical Review",
      "Technique Practice & Principles",
      "Diagnostic Criteria & Landmarks",
      "General OPP Review"
    ]
  },
  "🩺 CE (Clinical Education)": {
    resources: [
      "Physical Diagnosis / OSCE Prep",
      "History Taking & SOAP Notes",
      "Clinical Education Cases",
      "Standardized Patient Practice"
    ]
  },
  "👥 PBL (Problem-Based Learning)": {
    resources: [
      "PBL Weekly Case Learning Objectives",
      "PBL Differentials & Diagnostic Workup",
      "Clinical Wrap-Up & Pathophysiology"
    ]
  },
  "🫀 Pathology": {
    resources: [
      "Robbins & Cotran Pathologic Basis of Disease",
      "Pathoma Video & Text",
      "BRS Pathology"
    ]
  },
  "⚡ Physiology": {
    resources: [
      "Guyton and Hall Textbook of Medical Physiology",
      "Costanzo Physiology",
      "BRS Physiology"
    ]
  },
  "💊 Pharmacology": {
    resources: [
      "Basic & Clinical Pharmacology — Katzung",
      "Sketchy Pharm",
      "Lippincott Illustrated Reviews: Pharmacology"
    ]
  },
  "🔬 Microbiology": {
    resources: [
      "Medical Microbiology — Murray",
      "Sketchy Micro",
      "Clinical Microbiology Made Ridiculously Simple"
    ]
  },
  "🧬 Immunology": {
    resources: [
      "Basic Immunology — Abbas",
      "Cellular and Molecular Immunology"
    ]
  },
  "💀 Anatomy": {
    resources: [
      "Moore's Clinically Oriented Anatomy",
      "Netter's Atlas of Human Anatomy",
      "Rohen Color Atlas of Anatomy"
    ]
  },
  "🧪 Biochemistry & Genetics": {
    resources: [
      "Marks' Basic Medical Biochemistry",
      "Medical Genetics — Jorde"
    ]
  },
  "🧠 Anki / Spaced Repetition": {
    resources: [
      "AnKing Step 1 Comprehensive Deck",
      "Custom Subject Sub-Decks"
    ]
  },
  "📖 Board Preparation": {
    resources: [
      "First Aid for the USMLE / COMLEX Step 1",
      "COMBANK / TrueLearn Questions",
      "UWorld Question Bank"
    ]
  }
};

const WORLD_WINGS = [
  { id: 'w1', name: "Melog's Bedroom", icon: '🛏️', reqLevel: 1 },
  { id: 'w2', name: "Medical Library", icon: '📚', reqLevel: 5 },
  { id: 'w3', name: "Cozy Anatomy Café", icon: '☕', reqLevel: 10 },
  { id: 'w4', name: "Pharmacology Greenhouse", icon: '🌿', reqLevel: 20 },
  { id: 'w5', name: "The Whisker Student Clinic", icon: '🩺', reqLevel: 35 },
  { id: 'w6', name: "Simulation & Surgical Suite", icon: '🫀', reqLevel: 50 },
  { id: 'w7', name: "Rooftop Stargazer Lounge", icon: '🌙', reqLevel: 75 },
  { id: 'w8', name: "Melog Teaching Hospital", icon: '🏥', reqLevel: 100 }
];

const CATALOG_ITEMS = [
  { id: 'tea', name: 'Chamomile Study Tea', icon: '☕', cost: 20, purchased: false },
  { id: 'yarn', name: "Melog's Wool Ball", icon: '🧶', cost: 50, purchased: false },
  { id: 'plant', name: 'Calming Monstera', icon: '🪴', cost: 100, purchased: false },
  { id: 'steth', name: 'Blush Stethoscope', icon: '🩺', cost: 250, purchased: false },
  { id: 'bones', name: 'Desktop Mini Skeleton', icon: '🦴', cost: 500, purchased: false },
  { id: 'laptop', name: 'Question Bank Laptop', icon: '💻', cost: 1000, purchased: false },
  { id: 'coat', name: "Melog's Mini White Coat", icon: '🥼', cost: 2500, purchased: false }
];

let state = {
  settings: {
    studyMin: 25,
    shortMin: 5,
    longMin: 20,
    longInterval: 4,
    dailyTarget: 8,
    soundEnabled: true,
    season: 'spring',
    currentBiome: 'biome-sakura',
    supaUrl: '',
    supaKey: ''
  },
  timer: {
    mode: 'study',
    timeLeft: 25 * 60,
    totalDuration: 25 * 60,
    isRunning: false,
    intervalId: null
  },
  game: {
    xp: 0,
    level: 1,
    pawPoints: 0,
    streak: 1,
    todayPomodoros: 0,
    todayMinutes: 0,
    totalPomodoros: 0,
    lastActiveDate: getTodayDateString(),
    activeDays: {},
    sessionLogs: [],
    catalog: [...CATALOG_ITEMS]
  }
};

const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * 130; // 816.81

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  loadLocalState();
  checkDateRollover();
  initCurriculumSelectors();
  initNavigation();
  initBiomeControls();
  initTimer();
  initPlanner();
  initWorldAndCatalog();
  initAmbientCanvas();
  initSettingsAndSync();
  renderAll();
});

function getTodayDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function saveLocalState() {
  localStorage.setItem('purrmodoro_save', JSON.stringify(state));
  if (state.settings.supaUrl && state.settings.supaKey) {
    syncWithSupabase();
  }
}

function loadLocalState() {
  const raw = localStorage.getItem('purrmodoro_save');
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      state = { ...state, ...parsed };
    } catch (e) {
      console.warn('Error reading saved state, starting fresh.');
    }
  }
  state.timer.timeLeft = state.settings.studyMin * 60;
  state.timer.totalDuration = state.settings.studyMin * 60;
}

function checkDateRollover() {
  const today = getTodayDateString();
  if (state.game.lastActiveDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    if (!state.game.activeDays[yStr]) {
      state.game.streak = 1;
    }
    state.game.todayPomodoros = 0;
    state.game.todayMinutes = 0;
    state.game.lastActiveDate = today;
    saveLocalState();
  }
}

// --- BIOME SWITCHER ---
function initBiomeControls() {
  const buttons = document.querySelectorAll('.btn-biome');
  const viewport = document.getElementById('room-viewport');

  if (state.settings.currentBiome) {
    viewport.className = `room-viewport ${state.settings.currentBiome}`;
    buttons.forEach(b => {
      b.classList.toggle('active', b.dataset.biome === state.settings.currentBiome);
    });
  }

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const biomeClass = btn.dataset.biome;
      viewport.className = `room-viewport ${biomeClass}`;
      state.settings.currentBiome = biomeClass;
      saveLocalState();
    });
  });
}

// --- CURRICULUM CONTROLLER ---
function initCurriculumSelectors() {
  const subSelect = document.getElementById('sel-subject');
  const resSelect = document.getElementById('sel-resource');

  subSelect.innerHTML = '';
  Object.keys(MEDICAL_CURRICULUM).forEach(sub => {
    const opt = document.createElement('option');
    opt.value = sub;
    opt.textContent = sub;
    subSelect.appendChild(opt);
  });

  const updateResources = () => {
    const selectedSub = subSelect.value;
    resSelect.innerHTML = '';
    if (MEDICAL_CURRICULUM[selectedSub]) {
      MEDICAL_CURRICULUM[selectedSub].resources.forEach(res => {
        const opt = document.createElement('option');
        opt.value = res;
        opt.textContent = res;
        resSelect.appendChild(opt);
      });
    }
    updateTaskBanner();
  };

  subSelect.addEventListener('change', updateResources);
  resSelect.addEventListener('change', updateTaskBanner);
  document.getElementById('ipt-chapter-task').addEventListener('input', updateTaskBanner);

  updateResources();
}

function updateTaskBanner() {
  const sub = document.getElementById('sel-subject').value;
  const task = document.getElementById('ipt-chapter-task').value || 'Focus Session';
  document.getElementById('task-active-label').textContent = `${sub} • ${task}`;
}

// --- NAVIGATION ---
function initNavigation() {
  const buttons = document.querySelectorAll('.nav-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.view-panel').forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const target = document.getElementById(btn.dataset.view);
      if (target) target.classList.add('active');

      if (btn.dataset.view === 'view-world') renderWorld();
      if (btn.dataset.view === 'view-stats') renderStats();
    });
  });

  document.getElementById('melog-walker-box').addEventListener('click', () => {
    setMelogSpeech("Purrr! Melog loves walking this study circle with you! 🐾");
    playChime(587.33, 0.3);
  });
}

// --- TIMER CORE ---
function initTimer() {
  const btnStart = document.getElementById('btn-timer-start');
  const btnPause = document.getElementById('btn-timer-pause');
  const btnReset = document.getElementById('btn-timer-reset');
  const btnSkip = document.getElementById('btn-timer-skip');

  btnStart.addEventListener('click', startTimer);
  btnPause.addEventListener('click', pauseTimer);
  btnReset.addEventListener('click', resetTimer);
  btnSkip.addEventListener('click', skipTimer);
}

function startTimer() {
  if (state.timer.isRunning) return;
  state.timer.isRunning = true;
  document.getElementById('btn-timer-start').style.display = 'none';
  document.getElementById('btn-timer-pause').style.display = 'inline-block';
  document.getElementById('melog-walker-box').classList.add('timer-running');

  setMelogSpeech("Trotting along your study wheel! Let's focus! 🐾");

  state.timer.intervalId = setInterval(() => {
    if (state.timer.timeLeft > 0) {
      state.timer.timeLeft--;
      renderTimer();
    } else {
      completeTimerBlock();
    }
  }, 1000);
}

function pauseTimer() {
  if (!state.timer.isRunning) return;
  state.timer.isRunning = false;
  clearInterval(state.timer.intervalId);
  document.getElementById('btn-timer-start').style.display = 'inline-block';
  document.getElementById('btn-timer-pause').style.display = 'none';
  document.getElementById('melog-walker-box').classList.remove('timer-running');
  setMelogSpeech("Paused! Melog is taking a rest on the track. 🐾");
}

function resetTimer() {
  clearInterval(state.timer.intervalId);
  state.timer.isRunning = false;
  document.getElementById('btn-timer-start').style.display = 'inline-block';
  document.getElementById('btn-timer-pause').style.display = 'none';
  document.getElementById('melog-walker-box').classList.remove('timer-running');

  if (state.timer.mode === 'study') {
    state.timer.totalDuration = state.settings.studyMin * 60;
  } else if (state.timer.mode === 'shortBreak') {
    state.timer.totalDuration = state.settings.shortMin * 60;
  } else {
    state.timer.totalDuration = state.settings.longMin * 60;
  }
  state.timer.timeLeft = state.timer.totalDuration;

  setMelogSpeech("Timer reset. Ready to start our loop whenever you are!");
  renderTimer();
}

function skipTimer() {
  clearInterval(state.timer.intervalId);
  state.timer.isRunning = false;
  document.getElementById('btn-timer-start').style.display = 'inline-block';
  document.getElementById('btn-timer-pause').style.display = 'none';
  document.getElementById('melog-walker-box').classList.remove('timer-running');

  if (state.timer.mode === 'study') setTimerMode('shortBreak');
  else setTimerMode('study');
}

function completeTimerBlock() {
  clearInterval(state.timer.intervalId);
  state.timer.isRunning = false;
  document.getElementById('btn-timer-start').style.display = 'inline-block';
  document.getElementById('btn-timer-pause').style.display = 'none';
  document.getElementById('melog-walker-box').classList.remove('timer-running');

  if (state.timer.mode === 'study') {
    state.game.todayPomodoros++;
    state.game.totalPomodoros++;
    state.game.todayMinutes += state.settings.studyMin;
    state.game.pawPoints += 10;
    state.game.xp += 25;

    const newLevel = Math.floor(state.game.xp / 100) + 1;
    if (newLevel > state.game.level) {
      state.game.level = newLevel;
      setMelogSpeech(`⭐ Level Up! You reached Level ${newLevel}!`);
    }

    const today = getTodayDateString();
    state.game.activeDays[today] = (state.game.activeDays[today] || 0) + 1;
    if (state.game.activeDays[today] === 1) state.game.streak++;

    const sub = document.getElementById('sel-subject').value;
    const task = document.getElementById('ipt-chapter-task').value || 'Board Prep Focus';
    state.game.sessionLogs.unshift({
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      subject: sub,
      task: task,
      minutes: state.settings.studyMin
    });

    saveLocalState();
    playCompletionFanfare();
    setMelogSpeech("🎉 Loop finished! Great job studying! +10 🐾 Paw Points earned!");

    if (state.game.todayPomodoros % state.settings.longInterval === 0) {
      setTimeout(() => setTimerMode('longBreak'), 2500);
    } else {
      setTimeout(() => setTimerMode('shortBreak'), 2500);
    }
  } else {
    playChime(880, 0.4);
    setMelogSpeech("Break over! Ready to walk the next study circle? 🩺");
    setTimerMode('study');
  }

  renderAll();
}

function setTimerMode(mode) {
  state.timer.mode = mode;
  const tag = document.getElementById('timer-mode-tag');

  if (mode === 'study') {
    state.timer.totalDuration = state.settings.studyMin * 60;
    tag.textContent = 'STUDY BLOCK';
    tag.style.background = 'var(--blush-200)';
    tag.style.color = 'var(--blush-dark)';
    setMelogSpeech("Ready to walk another high-yield study block!");
  } else if (mode === 'shortBreak') {
    state.timer.totalDuration = state.settings.shortMin * 60;
    tag.textContent = 'SHORT BREAK';
    tag.style.background = '#DCF2DB';
    tag.style.color = '#2F612E';
    setMelogSpeech("Break time! Hydrate and relax with Melog. ☕");
  } else {
    state.timer.totalDuration = state.settings.longMin * 60;
    tag.textContent = 'LONG RECOVERY BREAK';
    tag.style.background = '#EFE1F5';
    tag.style.color = '#5C386E';
    setMelogSpeech("Great rounds! Enjoy your well-earned recovery rest. 🌷");
  }

  state.timer.timeLeft = state.timer.totalDuration;
  renderTimer();
}

function setMelogSpeech(msg) {
  document.getElementById('melog-speech').textContent = msg;
}

// --- RENDER CLOCK & WHEEL ORBIT ---
function renderTimer() {
  const m = Math.floor(state.timer.timeLeft / 60);
  const s = state.timer.timeLeft % 60;
  const str = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  document.getElementById('timer-readout').textContent = str;
  document.title = `${str} 🩺 Purrmodoro`;

  // Calculate Fraction Complete (0 to 1)
  const elapsed = state.timer.totalDuration - state.timer.timeLeft;
  const progressFraction = state.timer.totalDuration > 0 ? (elapsed / state.timer.totalDuration) : 0;

  // 1. Update SVG Wheel Progress Bar
  const offset = CIRCLE_CIRCUMFERENCE * (1 - progressFraction);
  document.getElementById('wheel-progress-bar').style.strokeDashoffset = offset;

  // 2. Rotate Orbit Arm so Melog Walks Along the Ring (0deg to 360deg)
  const angleDeg = progressFraction * 360;
  document.getElementById('wheel-orbit-arm').style.transform = `rotate(${angleDeg}deg)`;
}

// --- PLANNER ENGINE ---
function initPlanner() {
  const btnCalc = document.getElementById('btn-calc-schedule');
  const btnApply = document.getElementById('btn-apply-plan-goal');
  
  const defDate = new Date();
  defDate.setDate(defDate.getDate() + 10);
  document.getElementById('plan-date').value = defDate.toISOString().split('T')[0];

  btnCalc.addEventListener('click', () => {
    const dateVal = document.getElementById('plan-date').value;
    const buffer = parseInt(document.getElementById('plan-buffer').value, 10) || 0;
    const amount = parseFloat(document.getElementById('plan-amount').value) || 0;
    const unit = document.getElementById('plan-unit').value;
    const pace = parseFloat(document.getElementById('plan-pace').value) || 1;

    if (!dateVal) return alert('Please enter an exam date.');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exam = new Date(dateVal);
    exam.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((exam - today) / (1000 * 60 * 60 * 24));
    const studyDays = Math.max(diffDays - buffer, 1);

    const dailyUnits = Math.ceil(amount / studyDays);
    const dailyPomos = Math.ceil(dailyUnits / pace);

    const rxContent = document.getElementById('rx-content');
    rxContent.innerHTML = `
      <p>📚 <strong>Remaining Material:</strong> ${amount} ${unit}</p>
      <p>🗓️ <strong>Study Timeline:</strong> ${studyDays} active study days (${buffer} review/buffer days)</p>
      <p>🎀 <strong>Prescribed Daily Quota:</strong> Approx. <strong>${dailyUnits} ${unit}/day</strong></p>
      <p>🐱 <strong>Prescribed Focus Blocks:</strong> <strong>${dailyPomos} Pomodoros/day</strong> (at ${pace} ${unit}/session)</p>
    `;

    document.getElementById('rx-finish-date').textContent = `Target: ${studyDays} days`;
    document.getElementById('rx-card').style.display = 'block';
    btnApply.dataset.targetPomos = dailyPomos;
  });

  btnApply.addEventListener('click', () => {
    const target = parseInt(btnApply.dataset.targetPomos, 10);
    if (target) {
      state.settings.dailyTarget = target;
      document.getElementById('cfg-interval').value = target;
      saveLocalState();
      renderProgressBar();
      alert(`Daily goal updated to ${target} Pomodoros! Melog is ready. 🌸`);
    }
  });
}

// --- WORLD & CATALOG ---
function initWorldAndCatalog() {
  renderWorld();
}

function renderWorld() {
  const mapGrid = document.getElementById('world-map-grid');
  mapGrid.innerHTML = '';
  WORLD_WINGS.forEach(w => {
    const unlocked = state.game.level >= w.reqLevel;
    const cell = document.createElement('div');
    cell.className = `wing-card ${unlocked ? 'unlocked' : 'locked'}`;
    cell.innerHTML = `
      <div class="wing-icon">${w.icon}</div>
      <div class="wing-title">${w.name}</div>
      <div class="wing-req">${unlocked ? '✨ Unlocked' : `Req. Level ${w.reqLevel}`}</div>
    `;
    mapGrid.appendChild(cell);
  });

  const catalogGrid = document.getElementById('furniture-catalog-grid');
  catalogGrid.innerHTML = '';
  state.game.catalog.forEach(item => {
    const cell = document.createElement('div');
    cell.className = `catalog-item-card ${item.purchased ? 'unlocked' : ''}`;
    cell.innerHTML = `
      <div class="catalog-icon">${item.icon}</div>
      <div class="catalog-title">${item.name}</div>
      <div class="catalog-price">${item.purchased ? 'Owned 🎀' : `${item.cost} 🐾`}</div>
      ${!item.purchased ? `<button class="btn btn-primary btn-buy" style="font-size:0.75rem; padding:0.3rem 0.8rem; margin-top:0.3rem;">Adopt</button>` : ''}
    `;

    if (!item.purchased) {
      cell.querySelector('.btn-buy').addEventListener('click', () => {
        if (state.game.pawPoints >= item.cost) {
          state.game.pawPoints -= item.cost;
          item.purchased = true;
          saveLocalState();
          renderWorld();
          renderTopStats();
          setMelogSpeech(`Unlocked ${item.name}! Melog loves it! ✨`);
        } else {
          alert(`Not enough Paw Points yet! Need ${item.cost - state.game.pawPoints} more 🐾`);
        }
      });
    }
    catalogGrid.appendChild(cell);
  });
}

function renderStats() {
  document.getElementById('txt-stats-streak').textContent = `${state.game.streak} Day Study Streak`;

  const row = document.getElementById('weekly-tracker-row');
  row.innerHTML = '';
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const done = (state.game.activeDays[dStr] || 0) > 0;

    const cell = document.createElement('div');
    cell.className = 'week-day-cell';
    cell.innerHTML = `
      <span>${days[d.getDay()]}</span>
      <div class="week-day-dot ${done ? 'done' : ''}">${done ? '✓' : ''}</div>
    `;
    row.appendChild(cell);
  }

  const list = document.getElementById('session-log-list');
  list.innerHTML = '';
  if (state.game.sessionLogs.length === 0) {
    list.innerHTML = `<div style="text-align:center; padding:1rem; color:var(--text-muted); font-size:0.85rem;">No study sessions logged today yet.</div>`;
  } else {
    state.game.sessionLogs.slice(0, 10).forEach(log => {
      const item = document.createElement('div');
      item.className = 'log-item';
      item.innerHTML = `
        <div><strong>${escapeHTML(log.subject)}</strong> &mdash; ${escapeHTML(log.task)}</div>
        <div style="color:var(--text-muted);">${log.time} (${log.minutes}m)</div>
      `;
      list.appendChild(item);
    });
  }
}

function renderAll() {
  renderTimer();
  renderTopStats();
  renderProgressBar();
}

function renderTopStats() {
  document.getElementById('val-paw-points').textContent = state.game.pawPoints;
  document.getElementById('val-xp-count').textContent = `${state.game.xp} XP`;
  document.getElementById('val-streak-count').textContent = `${state.game.streak} Day${state.game.streak > 1 ? 's' : ''}`;
  document.getElementById('user-level-badge').textContent = `Lvl ${state.game.level} • Medical Scholar`;
}

function renderProgressBar() {
  const target = state.settings.dailyTarget || 8;
  const count = state.game.todayPomodoros;
  const pct = Math.min(Math.round((count / target) * 100), 100);
  document.getElementById('txt-daily-progress').textContent = `${count} / ${target} Pomodoros (${pct}%)`;
  document.getElementById('bar-daily-progress').style.width = `${pct}%`;
}

function playChime(freq, dur) {
  if (!state.settings.soundEnabled) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  } catch (e) {}
}

function playCompletionFanfare() {
  if (!state.settings.soundEnabled) return;
  playChime(659.25, 0.4);
  setTimeout(() => playChime(783.99, 0.4), 150);
  setTimeout(() => playChime(1046.50, 0.8), 300);
}

function initAmbientCanvas() {
  const canvas = document.getElementById('ambient-canvas');
  const ctx = canvas.getContext('2d');
  let particles = [];

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  window.addEventListener('resize', resize);
  resize();

  for (let i = 0; i < 24; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 3.5 + 2,
      speedX: Math.random() * 0.8 - 0.2,
      speedY: Math.random() * 0.7 + 0.3,
      angle: Math.random() * Math.PI * 2
    });
  }

  function renderParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const season = state.settings.season;

    if (season !== 'off') {
      particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.y > canvas.height) p.y = -10;
        if (p.x > canvas.width) p.x = 0;

        ctx.beginPath();
        if (season === 'spring') ctx.fillStyle = 'rgba(252, 182, 196, 0.5)';
        else if (season === 'fall') ctx.fillStyle = 'rgba(235, 168, 122, 0.45)';
        else ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';

        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    requestAnimationFrame(renderParticles);
  }
  renderParticles();
}

function initSettingsAndSync() {
  const form = document.getElementById('settings-form');
  const btnCloud = document.getElementById('btn-save-cloud');
  const btnSyncNow = document.getElementById('btn-force-sync');

  document.getElementById('cfg-study-min').value = state.settings.studyMin;
  document.getElementById('cfg-short-min').value = state.settings.shortMin;
  document.getElementById('cfg-long-min').value = state.settings.longMin;
  document.getElementById('cfg-interval').value = state.settings.longInterval;
  document.getElementById('cfg-season').value = state.settings.season;
  document.getElementById('cfg-sound').value = String(state.settings.soundEnabled);
  document.getElementById('cfg-supa-url').value = state.settings.supaUrl || '';
  document.getElementById('cfg-supa-key').value = state.settings.supaKey || '';

  if (state.settings.supaUrl) {
    document.getElementById('sync-status-badge').textContent = 'Cloud Active';
    document.getElementById('sync-status-badge').classList.add('connected');
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    state.settings.studyMin = parseInt(document.getElementById('cfg-study-min').value, 10);
    state.settings.shortMin = parseInt(document.getElementById('cfg-short-min').value, 10);
    state.settings.longMin = parseInt(document.getElementById('cfg-long-min').value, 10);
    state.settings.longInterval = parseInt(document.getElementById('cfg-interval').value, 10);
    state.settings.season = document.getElementById('cfg-season').value;
    state.settings.soundEnabled = document.getElementById('cfg-sound').value === 'true';

    if (!state.timer.isRunning && state.timer.mode === 'study') {
      state.timer.totalDuration = state.settings.studyMin * 60;
      state.timer.timeLeft = state.timer.totalDuration;
    }

    saveLocalState();
    renderAll();
    alert('Preferences saved! 🩺');
  });

  btnCloud.addEventListener('click', () => {
    state.settings.supaUrl = document.getElementById('cfg-supa-url').value.trim();
    state.settings.supaKey = document.getElementById('cfg-supa-key').value.trim();
    saveLocalState();
    syncWithSupabase();
  });

  btnSyncNow.addEventListener('click', syncWithSupabase);

  document.getElementById('btn-clear-local').addEventListener('click', () => {
    if (confirm('Reset local study data and streak?')) {
      localStorage.removeItem('purrmodoro_save');
      location.reload();
    }
  });
}

async function syncWithSupabase() {
  const { supaUrl, supaKey } = state.settings;
  if (!supaUrl || !supaKey) {
    alert('Please enter your Supabase Project URL and Anon Key first.');
    return;
  }

  const badge = document.getElementById('sync-status-badge');
  badge.textContent = 'Syncing...';

  try {
    const res = await fetch(`${supaUrl}/rest/v1/purrmodoro_sync?id=eq.melog_user`, {
      headers: {
        'apikey': supaKey,
        'Authorization': `Bearer ${supaKey}`
      }
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) {
        const cloudData = data[0].state_payload;
        if (cloudData.game && cloudData.game.totalPomodoros > state.game.totalPomodoros) {
          state.game = cloudData.game;
        }
      }

      await fetch(`${supaUrl}/rest/v1/purrmodoro_sync`, {
        method: 'POST',
        headers: {
          'apikey': supaKey,
          'Authorization': `Bearer ${supaKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          id: 'melog_user',
          state_payload: { game: state.game },
          updated_at: new Date().toISOString()
        })
      });

      badge.textContent = 'Cloud Active';
      badge.classList.add('connected');
      saveLocalState();
      renderAll();
    } else {
      badge.textContent = 'Auth Error';
    }
  } catch (err) {
    badge.textContent = 'Offline';
  }
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, t => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[t] || t));
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
