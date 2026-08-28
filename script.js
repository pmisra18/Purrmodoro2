/* -------------------------------------------------------------
   PURRMODORO - PomoFox Engine & Running Melog Logic
   ------------------------------------------------------------- */

const MEDICAL_SUBJECTS = [
  "📖 Board Prep (COMLEX / USMLE / TrueLearn / UWorld)",
  "🦴 OPP / OMM",
  "🩺 CE (Clinical Education)",
  "👥 PBL (Problem-Based Learning)",
  "🫀 Robbins Pathology",
  "⚡ Guyton Physiology",
  "💊 Katzung Pharmacology",
  "🔬 Murray Microbiology",
  "🧬 Abbas Immunology",
  "💀 Moore's Anatomy",
  "🧪 Marks' Biochemistry & Genetics",
  "🧠 Anki / Spaced Repetition",
  "✏️ Other Custom Subject"
];

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
    supaUrl: '',
    supaKey: ''
  },
  timer: {
    mode: 'study', // 'study', 'shortBreak', 'longBreak'
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

const RING_CIRCUMFERENCE = 2 * Math.PI * 135; // 848.23

document.addEventListener('DOMContentLoaded', () => {
  loadLocalState();
  checkDateRollover();
  initCurriculumSelectors();
  initPomoFoxControls();
  initModals();
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
  if (state.settings.supaUrl && state.settings.supaKey) syncWithSupabase();
}

function loadLocalState() {
  const raw = localStorage.getItem('purrmodoro_save');
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      state = { ...state, ...parsed };
    } catch (e) {}
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

    if (!state.game.activeDays[yStr]) state.game.streak = 1;
    state.game.todayPomodoros = 0;
    state.game.todayMinutes = 0;
    state.game.lastActiveDate = today;
    saveLocalState();
  }
}

// --- POMOFOX TIMER CONTROLLER ---
function initPomoFoxControls() {
  const btnStart = document.getElementById('btn-timer-start');
  const btnPause = document.getElementById('btn-timer-pause');
  const btnSkip = document.getElementById('btn-timer-skip');
  const btnReset = document.getElementById('btn-timer-reset');
  const btnSound = document.getElementById('btn-sound-toggle');

  // Mode Pills
  const modeButtons = document.querySelectorAll('.mode-btn');
  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      modeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setTimerMode(btn.dataset.mode);
    });
  });

  if (btnStart) btnStart.addEventListener('click', startTimer);
  if (btnPause) btnPause.addEventListener('click', pauseTimer);
  if (btnSkip) btnSkip.addEventListener('click', skipTimer);
  if (btnReset) btnReset.addEventListener('click', resetTimer);
  if (btnSound) {
    btnSound.addEventListener('click', () => {
      state.settings.soundEnabled = !state.settings.soundEnabled;
      btnSound.textContent = state.settings.soundEnabled ? '🔔' : '🔕';
      saveLocalState();
    });
  }

  // Melog interactive click
  const melogStage = document.getElementById('running-cat-stage');
  if (melogStage) {
    melogStage.addEventListener('click', () => {
      setMelogSpeech("Purrr! Melog is energized and ready to study! 🐾");
      playChime(587.33, 0.3);
    });
  }
}

function startTimer() {
  if (state.timer.isRunning) return;
  state.timer.isRunning = true;
  document.getElementById('btn-timer-start').style.display = 'none';
  document.getElementById('btn-timer-pause').style.display = 'inline-flex';
  
  const spriteStage = document.getElementById('running-cat-stage');
  if (spriteStage) spriteStage.classList.add('timer-running');

  setMelogSpeech("Melog is running! Let's conquer this block! 🐾");

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
  document.getElementById('btn-timer-start').style.display = 'inline-flex';
  document.getElementById('btn-timer-pause').style.display = 'none';

  const spriteStage = document.getElementById('running-cat-stage');
  if (spriteStage) spriteStage.classList.remove('timer-running');
  setMelogSpeech("Paused! Melog is taking a rest with you. 🐾");
}

function resetTimer() {
  clearInterval(state.timer.intervalId);
  state.timer.isRunning = false;
  document.getElementById('btn-timer-start').style.display = 'inline-flex';
  document.getElementById('btn-timer-pause').style.display = 'none';

  const spriteStage = document.getElementById('running-cat-stage');
  if (spriteStage) spriteStage.classList.remove('timer-running');

  if (state.timer.mode === 'study') {
    state.timer.totalDuration = state.settings.studyMin * 60;
  } else if (state.timer.mode === 'shortBreak') {
    state.timer.totalDuration = state.settings.shortMin * 60;
  } else {
    state.timer.totalDuration = state.settings.longMin * 60;
  }
  state.timer.timeLeft = state.timer.totalDuration;
  setMelogSpeech("Timer reset. Ready whenever you are!");
  renderTimer();
}

function skipTimer() {
  clearInterval(state.timer.intervalId);
  state.timer.isRunning = false;
  document.getElementById('btn-timer-start').style.display = 'inline-flex';
  document.getElementById('btn-timer-pause').style.display = 'none';

  const spriteStage = document.getElementById('running-cat-stage');
  if (spriteStage) spriteStage.classList.remove('timer-running');

  if (state.timer.mode === 'study') setTimerMode('shortBreak');
  else setTimerMode('study');
}

function completeTimerBlock() {
  clearInterval(state.timer.intervalId);
  state.timer.isRunning = false;
  document.getElementById('btn-timer-start').style.display = 'inline-flex';
  document.getElementById('btn-timer-pause').style.display = 'none';

  const spriteStage = document.getElementById('running-cat-stage');
  if (spriteStage) spriteStage.classList.remove('timer-running');

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

    const subSelect = document.getElementById('sel-subject');
    const taskInput = document.getElementById('ipt-chapter-task');
    const sub = subSelect ? subSelect.value : 'Study';
    const task = (taskInput && taskInput.value) ? taskInput.value : 'Focus Session';

    state.game.sessionLogs.unshift({
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      subject: sub,
      task: task,
      minutes: state.settings.studyMin
    });

    saveLocalState();
    playCompletionFanfare();
    setMelogSpeech("🎉 Completed! Great job! +10 🐾 Paw Points earned!");

    if (state.game.todayPomodoros % state.settings.longInterval === 0) {
      setTimeout(() => setTimerMode('longBreak'), 2500);
    } else {
      setTimeout(() => setTimerMode('shortBreak'), 2500);
    }
  } else {
    playChime(880, 0.4);
    setMelogSpeech("Break over! Ready for another study round? 🩺");
    setTimerMode('study');
  }

  renderAll();
}

function setTimerMode(mode) {
  state.timer.mode = mode;
  
  // Update Pills
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });

  if (mode === 'study') {
    state.timer.totalDuration = state.settings.studyMin * 60;
    setMelogSpeech("Ready to study with Melog! 🐾");
  } else if (mode === 'shortBreak') {
    state.timer.totalDuration = state.settings.shortMin * 60;
    setMelogSpeech("Short break! Have a sip of water. ☕");
  } else {
    state.timer.totalDuration = state.settings.longMin * 60;
    setMelogSpeech("Long recovery break! Great studying! 🌷");
  }

  state.timer.timeLeft = state.timer.totalDuration;
  renderTimer();
}

function setMelogSpeech(msg) {
  const el = document.getElementById('melog-speech');
  if (el) el.textContent = msg;
}

function renderTimer() {
  const m = Math.floor(state.timer.timeLeft / 60);
  const s = state.timer.timeLeft % 60;
  const str = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  
  const readout = document.getElementById('timer-readout');
  if (readout) readout.textContent = str;
  document.title = `${str} 🐾 Purrmodoro`;

  const elapsed = state.timer.totalDuration - state.timer.timeLeft;
  const progressFraction = state.timer.totalDuration > 0 ? (elapsed / state.timer.totalDuration) : 0;

  const ringFill = document.getElementById('ring-fill');
  if (ringFill) {
    const offset = RING_CIRCUMFERENCE * (1 - progressFraction);
    ringFill.style.strokeDashoffset = offset;
  }
}

// --- CURRICULUM SELECTORS ---
function initCurriculumSelectors() {
  const subSelect = document.getElementById('sel-subject');
  if (!subSelect) return;

  subSelect.innerHTML = '';
  MEDICAL_SUBJECTS.forEach(sub => {
    const opt = document.createElement('option');
    opt.value = sub;
    opt.textContent = sub;
    subSelect.appendChild(opt);
  });
}

// --- MODALS & TOOLS DOCK ---
function initModals() {
  const dockBtns = document.querySelectorAll('.dock-btn');
  dockBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = document.getElementById(btn.dataset.modal);
      if (modal) {
        modal.classList.add('active');
        if (btn.dataset.modal === 'modal-world') renderWorld();
        if (btn.dataset.modal === 'modal-stats') renderStats();
      }
    });
  });

  const closeBtns = document.querySelectorAll('.modal-close');
  closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.fox-modal').forEach(m => m.classList.remove('active'));
    });
  });

  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('fox-modal')) {
      e.target.classList.remove('active');
    }
  });
}

// --- PLANNER ---
function initPlanner() {
  const btnCalc = document.getElementById('btn-calc-schedule');
  const btnApply = document.getElementById('btn-apply-plan-goal');
  
  const defDate = new Date();
  defDate.setDate(defDate.getDate() + 10);
  const dateInput = document.getElementById('plan-date');
  if (dateInput) dateInput.value = defDate.toISOString().split('T')[0];

  if (btnCalc) {
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
      if (rxContent) {
        rxContent.innerHTML = `
          <p>📚 <strong>Remaining:</strong> ${amount} ${unit}</p>
          <p>🗓️ <strong>Study Days:</strong> ${studyDays} days (${buffer} buffer days)</p>
          <p>🎀 <strong>Daily Target:</strong> <strong>${dailyUnits} ${unit}/day</strong></p>
          <p>🐱 <strong>Focus Blocks:</strong> <strong>${dailyPomos} Pomodoros/day</strong></p>
        `;
      }
      document.getElementById('rx-finish-date').textContent = `${studyDays} study days left`;
      document.getElementById('rx-card').style.display = 'block';
      if (btnApply) btnApply.dataset.targetPomos = dailyPomos;
    });
  }

  if (btnApply) {
    btnApply.addEventListener('click', () => {
      const target = parseInt(btnApply.dataset.targetPomos, 10);
      if (target) {
        state.settings.dailyTarget = target;
        saveLocalState();
        renderProgressBar();
        alert(`Daily goal updated to ${target} Pomodoros! Melog is ready. 🌸`);
        document.getElementById('modal-planner').classList.remove('active');
      }
    });
  }
}

// --- WORLD & CATALOG ---
function initWorldAndCatalog() {
  renderWorld();
}

function renderWorld() {
  const mapGrid = document.getElementById('world-map-grid');
  if (!mapGrid) return;
  mapGrid.innerHTML = '';
  WORLD_WINGS.forEach(w => {
    const unlocked = state.game.level >= w.reqLevel;
    const cell = document.createElement('div');
    cell.className = `wing-card ${unlocked ? 'unlocked' : 'locked'}`;
    cell.innerHTML = `
      <div style="font-size:1.8rem;">${w.icon}</div>
      <div style="font-weight:700; font-size:0.85rem;">${w.name}</div>
      <div style="font-size:0.75rem; color:#8F725D;">${unlocked ? '✨ Unlocked' : `Req. Lvl ${w.reqLevel}`}</div>
    `;
    mapGrid.appendChild(cell);
  });

  const catalogGrid = document.getElementById('furniture-catalog-grid');
  if (!catalogGrid) return;
  catalogGrid.innerHTML = '';
  state.game.catalog.forEach(item => {
    const cell = document.createElement('div');
    cell.className = `catalog-item-card ${item.purchased ? 'unlocked' : ''}`;
    cell.innerHTML = `
      <div style="font-size:1.8rem;">${item.icon}</div>
      <div style="font-weight:700; font-size:0.85rem;">${item.name}</div>
      <div style="font-size:0.78rem; font-weight:800; color:#F28C63;">${item.purchased ? 'Owned 🎀' : `${item.cost} 🐾`}</div>
      ${!item.purchased ? `<button type="button" class="fox-btn btn-main-start" style="font-size:0.75rem; padding:0.3rem 0.8rem; margin-top:0.4rem;">Adopt</button>` : ''}
    `;

    if (!item.purchased) {
      cell.querySelector('button').addEventListener('click', () => {
        if (state.game.pawPoints >= item.cost) {
          state.game.pawPoints -= item.cost;
          item.purchased = true;
          saveLocalState();
          renderWorld();
          renderTopStats();
          setMelogSpeech(`Adopted ${item.name}! Melog loves it! ✨`);
        } else {
          alert(`Need ${item.cost - state.game.pawPoints} more 🐾 Paw Points!`);
        }
      });
    }
    catalogGrid.appendChild(cell);
  });
}

function renderStats() {
  const streakHeader = document.getElementById('txt-stats-streak');
  if (streakHeader) streakHeader.textContent = `${state.game.streak} Day Streak`;

  const row = document.getElementById('weekly-tracker-row');
  if (row) {
    row.innerHTML = '';
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const done = (state.game.activeDays[dStr] || 0) > 0;

      const cell = document.createElement('div');
      cell.style.display = 'flex';
      cell.style.flexDirection = 'column';
      cell.style.alignItems = 'center';
      cell.style.gap = '0.3rem';
      cell.innerHTML = `
        <span style="font-size:0.72rem; font-weight:800;">${days[d.getDay()]}</span>
        <div class="week-circle ${done ? 'done' : ''}">${done ? '✓' : ''}</div>
      `;
      row.appendChild(cell);
    }
  }

  const list = document.getElementById('session-log-list');
  if (list) {
    list.innerHTML = '';
    if (state.game.sessionLogs.length === 0) {
      list.innerHTML = `<div style="text-align:center; padding:1rem; color:#8F725D; font-size:0.85rem;">No study sessions logged today yet.</div>`;
    } else {
      state.game.sessionLogs.slice(0, 10).forEach(log => {
        const item = document.createElement('div');
        item.className = 'log-row';
        item.innerHTML = `
          <div><strong>${escapeHTML(log.subject)}</strong> &mdash; ${escapeHTML(log.task)}</div>
          <div style="color:#8F725D;">${log.time} (${log.minutes}m)</div>
        `;
        list.appendChild(item);
      });
    }
  }
}

function renderAll() {
  renderTimer();
  renderTopStats();
  renderProgressBar();
}

function renderTopStats() {
  const pawEl = document.getElementById('val-paw-points');
  const streakEl = document.getElementById('val-streak-count');
  const lvlEl = document.getElementById('level-badge');

  if (pawEl) pawEl.textContent = state.game.pawPoints;
  if (streakEl) streakEl.textContent = state.game.streak;
  if (lvlEl) lvlEl.textContent = `⭐ Lvl ${state.game.level}`;
}

function renderProgressBar() {
  const target = state.settings.dailyTarget || 8;
  const count = state.game.todayPomodoros;
  const pct = Math.min(Math.round((count / target) * 100), 100);

  const txt = document.getElementById('txt-daily-progress');
  const bar = document.getElementById('bar-daily-progress');
  if (txt) txt.textContent = `${count} / ${target} Pomodoros`;
  if (bar) bar.style.width = `${pct}%`;
}

// --- AMBIENT CANVAS (Subtle Petals) ---
function initAmbientCanvas() {
  const canvas = document.getElementById('ambient-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width, height;

  const resize = () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  };
  window.addEventListener('resize', resize);
  resize();

  let petals = [];
  for (let i = 0; i < 20; i++) {
    petals.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 4 + 2,
      vx: (Math.random() - 0.5) * 0.4,
      vy: Math.random() * 0.4 + 0.2
    });
  }

  function loop() {
    ctx.clearRect(0, 0, width, height);
    petals.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y > height) { p.y = -10; p.x = Math.random() * width; }
      ctx.beginPath();
      ctx.fillStyle = 'rgba(255, 169, 135, 0.25)';
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(loop);
  }
  loop();
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

// --- SETTINGS & SYNC ---
function initSettingsAndSync() {
  const form = document.getElementById('settings-form');
  const btnCloud = document.getElementById('btn-save-cloud');
  const btnSyncNow = document.getElementById('btn-force-sync');

  const setStudy = document.getElementById('cfg-study-min');
  const setShort = document.getElementById('cfg-short-min');
  const setLong = document.getElementById('cfg-long-min');
  const setIntervalEl = document.getElementById('cfg-interval');
  const setSupaUrl = document.getElementById('cfg-supa-url');
  const setSupaKey = document.getElementById('cfg-supa-key');

  if (setStudy) setStudy.value = state.settings.studyMin;
  if (setShort) setShort.value = state.settings.shortMin;
  if (setLong) setLong.value = state.settings.longMin;
  if (setIntervalEl) setIntervalEl.value = state.settings.longInterval;
  if (setSupaUrl) setSupaUrl.value = state.settings.supaUrl || '';
  if (setSupaKey) setSupaKey.value = state.settings.supaKey || '';

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      state.settings.studyMin = parseInt(document.getElementById('cfg-study-min').value, 10);
      state.settings.shortMin = parseInt(document.getElementById('cfg-short-min').value, 10);
      state.settings.longMin = parseInt(document.getElementById('cfg-long-min').value, 10);
      state.settings.longInterval = parseInt(document.getElementById('cfg-interval').value, 10);

      if (!state.timer.isRunning && state.timer.mode === 'study') {
        state.timer.totalDuration = state.settings.studyMin * 60;
        state.timer.timeLeft = state.timer.totalDuration;
      }
      saveLocalState();
      renderAll();
      alert('Preferences saved! 🩺');
      document.getElementById('modal-settings').classList.remove('active');
    });
  }

  if (btnCloud) {
    btnCloud.addEventListener('click', () => {
      state.settings.supaUrl = document.getElementById('cfg-supa-url').value.trim();
      state.settings.supaKey = document.getElementById('cfg-supa-key').value.trim();
      saveLocalState();
      syncWithSupabase();
    });
  }

  if (btnSyncNow) btnSyncNow.addEventListener('click', syncWithSupabase);
}

async function syncWithSupabase() {
  const { supaUrl, supaKey } = state.settings;
  if (!supaUrl || !supaKey) return alert('Enter Supabase URL & Key first!');

  try {
    const res = await fetch(`${supaUrl}/rest/v1/purrmodoro_sync?id=eq.melog_user`, {
      headers: { 'apikey': supaKey, 'Authorization': `Bearer ${supaKey}` }
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

      saveLocalState();
      renderAll();
      alert('Synced with cloud! ☁️');
    }
  } catch (err) {
    alert('Cloud sync failed. Working offline.');
  }
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, t => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[t] || t));
}
