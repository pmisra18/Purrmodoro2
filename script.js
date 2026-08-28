/* -------------------------------------------------------------
   PURRMODORO - Bulletproof Navigation, Timer & Real-time Canvas
   ------------------------------------------------------------- */

// Medical Subjects list
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
    currentBiome: 'sakura',
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

const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * 140; // 879.64

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  loadLocalState();
  checkDateRollover();
  initNavigation();
  initBiomeControls();
  initCurriculumSelectors();
  initTimer();
  initPlanner();
  initWorldAndCatalog();
  initAnimatedBackground();
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
      console.warn('Error reading saved state.');
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

// --- NAVIGATION ---
function initNavigation() {
  const buttons = document.querySelectorAll('.tab-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.content-panel').forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const target = document.getElementById(btn.dataset.view);
      if (target) target.classList.add('active');

      if (btn.dataset.view === 'view-world') renderWorld();
      if (btn.dataset.view === 'view-stats') renderStats();
    });
  });

  const melogSprite = document.getElementById('melog-walker');
  if (melogSprite) {
    melogSprite.addEventListener('click', () => {
      setMelogSpeech("Purrr! Melog is energized and studying with you! 🐾");
      playChime(587.33, 0.3);
    });
  }
}

// --- BIOME SELECTOR ---
function initBiomeControls() {
  const buttons = document.querySelectorAll('.biome-btn');
  buttons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.biome === state.settings.currentBiome);
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.settings.currentBiome = btn.dataset.biome;
      saveLocalState();
    });
  });
}

// --- 60 FPS ANIMATED CANVAS ---
function initAnimatedBackground() {
  const canvas = document.getElementById('animated-bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width, height;

  const resize = () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  };
  window.addEventListener('resize', resize);
  resize();

  let stars = [];
  for (let i = 0; i < 50; i++) {
    stars.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight * 0.7,
      size: Math.random() * 2 + 1,
      alpha: Math.random() * 0.8 + 0.2,
      twinkle: Math.random() * 0.02 + 0.01
    });
  }

  let particles = [];
  for (let i = 0; i < 35; i++) {
    particles.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 3 + 2,
      vx: (Math.random() - 0.5) * 0.5,
      vy: Math.random() * 0.5 + 0.2,
      pulse: Math.random() * Math.PI
    });
  }

  let auroraTime = 0;

  function renderLoop() {
    ctx.clearRect(0, 0, width, height);
    const biome = state.settings.currentBiome;

    let sky = ctx.createLinearGradient(0, 0, 0, height);
    if (biome === 'sakura') {
      sky.addColorStop(0, '#150E1F');
      sky.addColorStop(0.65, '#2A172B');
      sky.addColorStop(1, '#4A2336');
    } else if (biome === 'taiga') {
      sky.addColorStop(0, '#0C1717');
      sky.addColorStop(0.65, '#122621');
      sky.addColorStop(1, '#1A3B2E');
    } else if (biome === 'aurora') {
      sky.addColorStop(0, '#0A111E');
      sky.addColorStop(0.65, '#101E30');
      sky.addColorStop(1, '#162C40');
    } else {
      sky.addColorStop(0, '#190F24');
      sky.addColorStop(0.55, '#351B33');
      sky.addColorStop(1, '#572736');
    }
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    stars.forEach(s => {
      s.alpha += s.twinkle;
      if (s.alpha > 1 || s.alpha < 0.2) s.twinkle *= -1;
      ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    });

    if (biome === 'aurora') {
      auroraTime += 0.015;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      for (let j = 0; j < 3; j++) {
        ctx.beginPath();
        ctx.moveTo(0, height * 0.35);
        for (let x = 0; x <= width; x += 30) {
          let y = height * (0.3 + j * 0.06) + Math.sin(x * 0.005 + auroraTime + j) * 45 + Math.cos(x * 0.003 - auroraTime) * 30;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width, 0);
        ctx.lineTo(0, 0);
        ctx.fillStyle = j === 0 ? 'rgba(78, 220, 160, 0.2)' : j === 1 ? 'rgba(140, 100, 240, 0.16)' : 'rgba(232, 93, 117, 0.14)';
        ctx.fill();
      }
      ctx.restore();
    }

    ctx.fillStyle = biome === 'taiga' ? '#091612' : biome === 'aurora' ? '#08111A' : '#140A18';
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let x = 0; x <= width; x += 60) {
      let mY = height * 0.65 - ((x % 180 === 0) ? 65 : (x % 120 === 0) ? 35 : 10);
      ctx.lineTo(x, mY);
      ctx.lineTo(x + 60, mY);
    }
    ctx.lineTo(width, height);
    ctx.fill();

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.pulse += 0.04;

      if (p.y > height) { p.y = -10; p.x = Math.random() * width; }
      if (p.x > width) p.x = 0;
      if (p.x < 0) p.x = width;

      ctx.beginPath();
      if (biome === 'sakura') {
        ctx.fillStyle = `rgba(255, 165, 185, ${0.55 + Math.sin(p.pulse) * 0.3})`;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      } else if (biome === 'taiga') {
        ctx.fillStyle = `rgba(160, 245, 180, ${0.45 + Math.sin(p.pulse) * 0.4})`;
        ctx.arc(p.x, p.y, p.size * 1.3, 0, Math.PI * 2);
      } else if (biome === 'aurora') {
        ctx.fillStyle = `rgba(230, 245, 255, ${0.65 + Math.sin(p.pulse) * 0.25})`;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      } else {
        ctx.fillStyle = `rgba(255, 160, 120, ${0.55 + Math.sin(p.pulse) * 0.35})`;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      }
      ctx.fill();
    });

    requestAnimationFrame(renderLoop);
  }
  renderLoop();
}

// --- CURRICULUM SELECTORS ---
function initCurriculumSelectors() {
  const subSelect = document.getElementById('sel-subject');
  const taskInput = document.getElementById('ipt-chapter-task');
  if (!subSelect) return;

  subSelect.innerHTML = '';
  MEDICAL_SUBJECTS.forEach(sub => {
    const opt = document.createElement('option');
    opt.value = sub;
    opt.textContent = sub;
    subSelect.appendChild(opt);
  });

  subSelect.addEventListener('change', updateTaskBanner);
  if (taskInput) taskInput.addEventListener('input', updateTaskBanner);

  updateTaskBanner();
}

function updateTaskBanner() {
  const subSelect = document.getElementById('sel-subject');
  const taskInput = document.getElementById('ipt-chapter-task');
  const taskLabel = document.getElementById('task-active-label');
  if (!subSelect || !taskLabel) return;
  const sub = subSelect.value;
  const task = (taskInput && taskInput.value) ? taskInput.value : 'Focus Session';
  taskLabel.textContent = `${sub} • ${task}`;
}

// --- TIMER CONTROLS ---
function initTimer() {
  const btnStart = document.getElementById('btn-timer-start');
  const btnPause = document.getElementById('btn-timer-pause');
  const btnReset = document.getElementById('btn-timer-reset');
  const btnSkip = document.getElementById('btn-timer-skip');

  if (btnStart) btnStart.addEventListener('click', startTimer);
  if (btnPause) btnPause.addEventListener('click', pauseTimer);
  if (btnReset) btnReset.addEventListener('click', resetTimer);
  if (btnSkip) btnSkip.addEventListener('click', skipTimer);
}

function startTimer() {
  if (state.timer.isRunning) return;
  state.timer.isRunning = true;
  document.getElementById('btn-timer-start').style.display = 'none';
  document.getElementById('btn-timer-pause').style.display = 'inline-block';
  
  const sprite = document.getElementById('melog-walker');
  if (sprite) sprite.classList.add('timer-running');

  setMelogSpeech("Galloping on your study wheel! Let's focus! 🐾");

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

  const sprite = document.getElementById('melog-walker');
  if (sprite) sprite.classList.remove('timer-running');
  setMelogSpeech("Paused! Melog is taking a rest on the track. 🐾");
}

function resetTimer() {
  clearInterval(state.timer.intervalId);
  state.timer.isRunning = false;
  document.getElementById('btn-timer-start').style.display = 'inline-block';
  document.getElementById('btn-timer-pause').style.display = 'none';

  const sprite = document.getElementById('melog-walker');
  if (sprite) sprite.classList.remove('timer-running');

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
  document.getElementById('btn-timer-start').style.display = 'inline-block';
  document.getElementById('btn-timer-pause').style.display = 'none';

  const sprite = document.getElementById('melog-walker');
  if (sprite) sprite.classList.remove('timer-running');

  if (state.timer.mode === 'study') setTimerMode('shortBreak');
  else setTimerMode('study');
}

function completeTimerBlock() {
  clearInterval(state.timer.intervalId);
  state.timer.isRunning = false;
  document.getElementById('btn-timer-start').style.display = 'inline-block';
  document.getElementById('btn-timer-pause').style.display = 'none';

  const sprite = document.getElementById('melog-walker');
  if (sprite) sprite.classList.remove('timer-running');

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
    if (tag) {
      tag.textContent = 'STUDY BLOCK';
      tag.style.background = 'rgba(232, 93, 117, 0.18)';
      tag.style.color = 'var(--blush-glow)';
    }
    setMelogSpeech("Ready to walk another high-yield study block!");
  } else if (mode === 'shortBreak') {
    state.timer.totalDuration = state.settings.shortMin * 60;
    if (tag) {
      tag.textContent = 'SHORT BREAK';
      tag.style.background = 'rgba(139, 212, 161, 0.2)';
      tag.style.color = 'var(--sage-glow)';
    }
    setMelogSpeech("Break time! Hydrate and relax with Melog. ☕");
  } else {
    state.timer.totalDuration = state.settings.longMin * 60;
    if (tag) {
      tag.textContent = 'LONG RECOVERY BREAK';
      tag.style.background = 'rgba(180, 140, 240, 0.2)';
      tag.style.color = '#D2B0FA';
    }
    setMelogSpeech("Great rounds! Enjoy your well-earned recovery rest. 🌷");
  }

  state.timer.timeLeft = state.timer.totalDuration;
  renderTimer();
}

function setMelogSpeech(msg) {
  const el = document.getElementById('melog-speech');
  if (el) el.textContent = msg;
}

// --- RENDER CLOCK & WHEEL PROGRESS ---
function renderTimer() {
  const m = Math.floor(state.timer.timeLeft / 60);
  const s = state.timer.timeLeft % 60;
  const str = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  
  const readout = document.getElementById('timer-readout');
  if (readout) readout.textContent = str;
  document.title = `${str} 🩺 Purrmodoro`;

  const elapsed = state.timer.totalDuration - state.timer.timeLeft;
  const progressFraction = state.timer.totalDuration > 0 ? (elapsed / state.timer.totalDuration) : 0;

  const bar = document.getElementById('wheel-progress-bar');
  if (bar) {
    const offset = CIRCLE_CIRCUMFERENCE * (1 - progressFraction);
    bar.style.strokeDashoffset = offset;
  }

  const carriage = document.getElementById('orbit-carriage');
  if (carriage) {
    const angleDeg = progressFraction * 360;
    carriage.style.transform = `rotate(${angleDeg}deg)`;
  }
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
          <p>📚 <strong>Remaining Material:</strong> ${amount} ${unit}</p>
          <p>🗓️ <strong>Study Timeline:</strong> ${studyDays} active study days (${buffer} review/buffer days)</p>
          <p>🎀 <strong>Prescribed Daily Quota:</strong> Approx. <strong>${dailyUnits} ${unit}/day</strong></p>
          <p>🐱 <strong>Prescribed Focus Blocks:</strong> <strong>${dailyPomos} Pomodoros/day</strong> (at ${pace} ${unit}/session)</p>
        `;
      }

      document.getElementById('rx-finish-date').textContent = `Target: ${studyDays} days`;
      document.getElementById('rx-card').style.display = 'block';
      if (btnApply) btnApply.dataset.targetPomos = dailyPomos;
    });
  }

  if (btnApply) {
    btnApply.addEventListener('click', () => {
      const target = parseInt(btnApply.dataset.targetPomos, 10);
      if (target) {
        state.settings.dailyTarget = target;
        const cfgInterval = document.getElementById('cfg-interval');
        if (cfgInterval) cfgInterval.value = target;
        saveLocalState();
        renderProgressBar();
        alert(`Daily goal updated to ${target} Pomodoros! Melog is ready. 🌸`);
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
      <div class="wing-icon">${w.icon}</div>
      <div class="wing-title">${w.name}</div>
      <div class="wing-req">${unlocked ? '✨ Unlocked' : `Req. Level ${w.reqLevel}`}</div>
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
      <div class="catalog-icon">${item.icon}</div>
      <div class="catalog-title">${item.name}</div>
      <div class="catalog-price">${item.purchased ? 'Owned 🎀' : `${item.cost} 🐾`}</div>
      ${!item.purchased ? `<button type="button" class="btn btn-primary btn-buy" style="font-size:0.75rem; padding:0.3rem 0.8rem; margin-top:0.3rem;">Adopt</button>` : ''}
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
  const streakHeader = document.getElementById('txt-stats-streak');
  if (streakHeader) streakHeader.textContent = `${state.game.streak} Day Study Streak`;

  const row = document.getElementById('weekly-tracker-row');
  if (row) {
    row.innerHTML = '';
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const done = (state.game.activeDays[dStr] || 0) > 0;

      const cell = document.createElement('div');
      cell.className = 'week-cell';
      cell.innerHTML = `
        <span>${days[d.getDay()]}</span>
        <div class="week-circle ${done ? 'done' : ''}">${done ? '✓' : ''}</div>
      `;
      row.appendChild(cell);
    }
  }

  const list = document.getElementById('session-log-list');
  if (list) {
    list.innerHTML = '';
    if (state.game.sessionLogs.length === 0) {
      list.innerHTML = `<div style="text-align:center; padding:1rem; color:var(--text-secondary); font-size:0.85rem;">No study sessions logged today yet.</div>`;
    } else {
      state.game.sessionLogs.slice(0, 10).forEach(log => {
        const item = document.createElement('div');
        item.className = 'log-row';
        item.innerHTML = `
          <div><strong>${escapeHTML(log.subject)}</strong> &mdash; ${escapeHTML(log.task)}</div>
          <div style="color:var(--text-secondary);">${log.time} (${log.minutes}m)</div>
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
  const xpEl = document.getElementById('val-xp-count');
  const streakEl = document.getElementById('val-streak-count');
  const lvlEl = document.getElementById('user-level-badge');

  if (pawEl) pawEl.textContent = state.game.pawPoints;
  if (xpEl) xpEl.textContent = `${state.game.xp} XP`;
  if (streakEl) streakEl.textContent = `${state.game.streak} Day${state.game.streak > 1 ? 's' : ''}`;
  if (lvlEl) lvlEl.textContent = `Lvl ${state.game.level} • Medical Scholar`;
}

function renderProgressBar() {
  const target = state.settings.dailyTarget || 8;
  const count = state.game.todayPomodoros;
  const pct = Math.min(Math.round((count / target) * 100), 100);

  const txt = document.getElementById('txt-daily-progress');
  const bar = document.getElementById('bar-daily-progress');
  if (txt) txt.textContent = `${count} / ${target} Pomodoros (${pct}%)`;
  if (bar) bar.style.width = `${pct}%`;
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

function initSettingsAndSync() {
  const form = document.getElementById('settings-form');
  const btnCloud = document.getElementById('btn-save-cloud');
  const btnSyncNow = document.getElementById('btn-force-sync');
  const btnClear = document.getElementById('btn-clear-local');

  const setStudy = document.getElementById('cfg-study-min');
  const setShort = document.getElementById('cfg-short-min');
  const setLong = document.getElementById('cfg-long-min');
  const setIntervalEl = document.getElementById('cfg-interval');
  const setSound = document.getElementById('cfg-sound');
  const setSupaUrl = document.getElementById('cfg-supa-url');
  const setSupaKey = document.getElementById('cfg-supa-key');

  if (setStudy) setStudy.value = state.settings.studyMin;
  if (setShort) setShort.value = state.settings.shortMin;
  if (setLong) setLong.value = state.settings.longMin;
  if (setIntervalEl) setIntervalEl.value = state.settings.longInterval;
  if (setSound) setSound.value = String(state.settings.soundEnabled);
  if (setSupaUrl) setSupaUrl.value = state.settings.supaUrl || '';
  if (setSupaKey) setSupaKey.value = state.settings.supaKey || '';

  if (state.settings.supaUrl) {
    const badge = document.getElementById('sync-status-badge');
    if (badge) {
      badge.textContent = 'Cloud Active';
      badge.classList.add('connected');
    }
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      state.settings.studyMin = parseInt(document.getElementById('cfg-study-min').value, 10);
      state.settings.shortMin = parseInt(document.getElementById('cfg-short-min').value, 10);
      state.settings.longMin = parseInt(document.getElementById('cfg-long-min').value, 10);
      state.settings.longInterval = parseInt(document.getElementById('cfg-interval').value, 10);
      state.settings.soundEnabled = document.getElementById('cfg-sound').value === 'true';

      if (!state.timer.isRunning && state.timer.mode === 'study') {
        state.timer.totalDuration = state.settings.studyMin * 60;
        state.timer.timeLeft = state.timer.totalDuration;
      }

      saveLocalState();
      renderAll();
      alert('Preferences saved! 🩺');
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

  if (btnClear) {
    btnClear.addEventListener('click', () => {
      if (confirm('Reset local study data and streak?')) {
        localStorage.removeItem('purrmodoro_save');
        location.reload();
      }
    });
  }
}

async function syncWithSupabase() {
  const { supaUrl, supaKey } = state.settings;
  if (!supaUrl || !supaKey) {
    alert('Please enter your Supabase Project URL and Anon Key first.');
    return;
  }

  const badge = document.getElementById('sync-status-badge');
  if (badge) badge.textContent = 'Syncing...';

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

      if (badge) {
        badge.textContent = 'Cloud Active';
        badge.classList.add('connected');
      }
      saveLocalState();
      renderAll();
    } else {
      if (badge) badge.textContent = 'Auth Error';
    }
  } catch (err) {
    if (badge) badge.textContent = 'Offline';
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
