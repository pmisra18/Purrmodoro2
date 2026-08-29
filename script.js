/* -------------------------------------------------------------
   PURRMODORO - Master Studio Illustrated Living World Engine
   ------------------------------------------------------------- */
const MEDICAL_SUBJECTS = [
  "📖 Board Prep (COMLEX / USMLE / TrueLearn / UWorld)",
  "🦴 OPP / OMM Practical & Written",
  "🩺 CE (Clinical Education) OSCE & Notes",
  "👥 PBL (Problem-Based Learning)",
  "🫀 Robbins Pathology",
  "⚡ Guyton Physiology",
  "💊 Katzung Pharmacology",
  "🔬 Murray Microbiology",
  "🧬 Abbas Immunology",
  "💀 Moore's Anatomy",
  "🧪 Marks' Biochemistry & Genetics",
  "🧠 Anki Spaced Repetition",
  "✏️ Custom Focus Session"
];

const CATALOG_ITEMS = [
  { id: 'tea', name: 'Chamomile Tea', icon: '☕', cost: 20, purchased: false },
  { id: 'yarn', name: "Melog's Wool Ball", icon: '🧶', cost: 40, purchased: false },
  { id: 'plant', name: 'Monstera Plant', icon: '🪴', cost: 80, purchased: false },
  { id: 'books', name: 'Medical Bookshelf', icon: '📚', cost: 150, purchased: false },
  { id: 'steth', name: 'Blush Stethoscope', icon: '🩺', cost: 250, purchased: false },
  { id: 'cattree', name: 'Cozy Cat Tree', icon: '🪵', cost: 350, purchased: false },
  { id: 'bones', name: 'Desktop Skeleton', icon: '🦴', cost: 500, purchased: false },
  { id: 'fireplace', name: 'Study Fireplace', icon: '🔥', cost: 750, purchased: false },
  { id: 'coffee', name: 'Espresso Machine', icon: '☕', cost: 1000, purchased: false },
  { id: 'coat', name: "Mini White Coat", icon: '🥼', cost: 1500, purchased: false }
];

let state = {
  settings: { studyMin: 25, shortMin: 5, longMin: 20, longInterval: 4, dailyTarget: 8, soundEnabled: true, darkMode: false, currentBiome: 'forest', jsonbinKey: '', jsonbinId: '' },
  timer: { mode: 'study', timeLeft: 25 * 60, totalDuration: 25 * 60, isRunning: false, intervalId: null },
  game: { xp: 0, level: 1, pawPoints: 0, streak: 1, todayPomodoros: 0, todayMinutes: 0, totalPomodoros: 0, cycleCount: 1, lastActiveDate: getTodayDateString(), activeDays: {}, sessionLogs: [], catalog: [...CATALOG_ITEMS] }
};

const RING_CIRCUMFERENCE = 2 * Math.PI * 133;

document.addEventListener('DOMContentLoaded', async () => {
  loadState();
  initTheme();
  initTabs();
  initUI();
  initTimer();
  initPlanner();
  initCanvasEngine();
  
  if (state.settings.jsonbinKey && state.settings.jsonbinId) {
    await pullFromCloudOnStart();
  }
  
  renderAll();
});

function getTodayDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function saveState() {
  localStorage.setItem('purrmodoro_pf_master_v24', JSON.stringify(state));
  if (state.settings.jsonbinKey && state.settings.jsonbinId) {
    triggerAutoSync();
  }
}

function loadState() {
  const raw = localStorage.getItem('purrmodoro_pf_master_v24');
  if (raw) {
    try { state = { ...state, ...JSON.parse(raw) }; } catch (e) {}
  }
  state.timer.timeLeft = state.settings.studyMin * 60;
  state.timer.totalDuration = state.settings.studyMin * 60;
}

function initTheme() {
  const themeBtn = document.getElementById('btn-theme-toggle');
  document.body.classList.toggle('theme-dark', state.settings.darkMode);
  if (themeBtn) themeBtn.textContent = state.settings.darkMode ? '☀️' : '🌙';

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      state.settings.darkMode = !state.settings.darkMode;
      document.body.classList.toggle('theme-dark', state.settings.darkMode);
      themeBtn.textContent = state.settings.darkMode ? '☀️' : '🌙';
      saveState();
    });
  }
}

function initTabs() {
  const dockBtns = document.querySelectorAll('.pf-dock-btn');
  dockBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      dockBtns.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.view-panel').forEach(v => v.classList.remove('active'));

      btn.classList.add('active');
      const target = document.getElementById(btn.dataset.tab);
      if (target) {
        target.classList.add('active');
        if (btn.dataset.tab === 'tab-world') renderWorld();
        if (btn.dataset.tab === 'tab-stats') renderStats();
      }
    });
  });
}

function initUI() {
  const subSelect = document.getElementById('sel-subject');
  if (subSelect) {
    subSelect.innerHTML = '';
    MEDICAL_SUBJECTS.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = s;
      subSelect.appendChild(opt);
    });
  }

  document.querySelectorAll('.biome-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.biome === state.settings.currentBiome);
    btn.addEventListener('click', () => {
      document.querySelectorAll('.biome-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.settings.currentBiome = btn.dataset.biome;
      saveState();
    });
  });

  const soundBtn = document.getElementById('btn-sound-toggle');
  if (soundBtn) {
    soundBtn.textContent = state.settings.soundEnabled ? '🔊' : '🔇';
    soundBtn.addEventListener('click', () => {
      state.settings.soundEnabled = !state.settings.soundEnabled;
      soundBtn.textContent = state.settings.soundEnabled ? '🔊' : '🔇';
      saveState();
    });
  }

  const melogSprite = document.getElementById('melog-sprite');
  if (melogSprite) {
    melogSprite.addEventListener('click', () => {
      playTone(587.33, 0.3);
    });
  }

  const btnSaveCloud = document.getElementById('btn-save-cloud');
  const jsonbinKeyInput = document.getElementById('cfg-jsonbin-key');
  const jsonbinIdInput = document.getElementById('cfg-jsonbin-id');
  if (jsonbinKeyInput) jsonbinKeyInput.value = state.settings.jsonbinKey || '';
  if (jsonbinIdInput) jsonbinIdInput.value = state.settings.jsonbinId || '';

  if (btnSaveCloud) {
    btnSaveCloud.addEventListener('click', async () => {
      state.settings.jsonbinKey = jsonbinKeyInput.value.trim();
      state.settings.jsonbinId = jsonbinIdInput.value.trim();
      saveState();
      await triggerAutoSync();
      alert('Cloud connection tested & saved successfully! ☁️');
    });
  }
}

function initTimer() {
  const toggleBtn = document.getElementById('btn-timer-toggle');
  const resetBtn = document.getElementById('btn-timer-reset');

  if (toggleBtn) toggleBtn.addEventListener('click', toggleTimer);
  if (resetBtn) resetBtn.addEventListener('click', resetTimer);
}

function toggleTimer() {
  if (state.timer.isRunning) {
    pauseTimer();
  } else {
    startTimer();
  }
}

function startTimer() {
  state.timer.isRunning = true;
  document.getElementById('btn-timer-toggle').textContent = '⏸';
  
  const sprite = document.getElementById('melog-sprite');
  if (sprite) sprite.classList.add('timer-running');

  state.timer.intervalId = setInterval(() => {
    if (state.timer.timeLeft > 0) {
      state.timer.timeLeft--;
      renderTimer();
    } else {
      completeBlock();
    }
  }, 1000);
}

function pauseTimer() {
  state.timer.isRunning = false;
  clearInterval(state.timer.intervalId);
  document.getElementById('btn-timer-toggle').textContent = '▶';

  const sprite = document.getElementById('melog-sprite');
  if (sprite) sprite.classList.remove('timer-running');
}

function resetTimer() {
  clearInterval(state.timer.intervalId);
  state.timer.isRunning = false;
  document.getElementById('btn-timer-toggle').textContent = '▶';

  const sprite = document.getElementById('melog-sprite');
  if (sprite) sprite.classList.remove('timer-running');

  state.timer.totalDuration = (state.timer.mode === 'study' ? state.settings.studyMin : state.settings.shortMin) * 60;
  state.timer.timeLeft = state.timer.totalDuration;
  renderTimer();
}

function completeBlock() {
  clearInterval(state.timer.intervalId);
  state.timer.isRunning = false;
  document.getElementById('btn-timer-toggle').textContent = '▶';

  const sprite = document.getElementById('melog-sprite');
  if (sprite) sprite.classList.remove('timer-running');

  playFanfare();

  if (state.timer.mode === 'study') {
    state.timer.mode = 'shortBreak';
    state.timer.totalDuration = state.settings.shortMin * 60;
    state.timer.timeLeft = state.timer.totalDuration;
    
    state.game.todayPomodoros++;
    state.game.totalPomodoros++;
    state.game.todayMinutes += state.settings.studyMin;
    state.game.pawPoints += 15;
    state.game.xp += 30;
    state.game.cycleCount++;

    const newLevel = Math.floor(state.game.xp / 100) + 1;
    if (newLevel > state.game.level) {
      state.game.level = newLevel;
    }

    const today = getTodayDateString();
    state.game.activeDays[today] = (state.game.activeDays[today] || 0) + 1;

    const sub = document.getElementById('sel-subject').value;
    const task = document.getElementById('ipt-chapter-task').value || 'Focus Session';
    state.game.sessionLogs.unshift({
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      subject: sub,
      task: task,
      minutes: state.settings.studyMin
    });
  } else {
    state.timer.mode = 'study';
    state.timer.totalDuration = state.settings.studyMin * 60;
    state.timer.timeLeft = state.timer.totalDuration;
  }
  saveState();
  renderAll();
}

function renderTimer() {
  const m = Math.floor(state.timer.timeLeft / 60);
  const s = state.timer.timeLeft % 60;
  const str = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  
  const readout = document.getElementById('timer-readout');
  if (readout) readout.textContent = str;
  document.title = `${str} 🐾 Purrmodoro`;

  const progress = (state.timer.totalDuration - state.timer.timeLeft) / state.timer.totalDuration;
  const ringFill = document.getElementById('circle-progress-ring');
  if (ringFill) {
    ringFill.style.strokeDashoffset = RING_CIRCUMFERENCE * (1 - progress);
  }

  const orbitArm = document.getElementById('orbit-arm');
  if (orbitArm) {
    orbitArm.style.transform = `rotate(${progress * 360}deg)`;
  }
}

function renderAll() {
  renderTimer();
  
  const lvlElem = document.getElementById('val-level');
  const pawsElem = document.getElementById('val-paws');
  const xpFill = document.getElementById('mini-xp-fill');
  if (lvlElem) lvlElem.textContent = state.game.level;
  if (pawsElem) pawsElem.textContent = state.game.pawPoints;
  if (xpFill) {
    const currentXpInLevel = state.game.xp % 100;
    xpFill.style.width = `${currentXpInLevel}%`;
  }

  const activeDot = (state.game.cycleCount - 1) % 4;
  for (let i = 1; i <= 4; i++) {
    const dot = document.getElementById(`dot-${i}`);
    if (dot) dot.classList.toggle('active', i - 1 <= activeDot);
  }
}

function renderWorld() {
  const placedContainer = document.getElementById('sanctuary-placed-items');
  if (placedContainer) {
    placedContainer.innerHTML = '';
    state.game.catalog.forEach(item => {
      if (item.purchased) {
        const span = document.createElement('span');
        span.className = 'placed-item-icon';
        span.textContent = item.icon;
        span.title = item.name;
        placedContainer.appendChild(span);
      }
    });
  }

  const cat = document.getElementById('furniture-catalog-grid');
  if (cat) {
    cat.innerHTML = '';
    state.game.catalog.forEach(item => {
      const div = document.createElement('div');
      div.className = `pf-item-box ${item.purchased ? '' : 'locked'}`;
      div.innerHTML = `<div style="font-size:1.6rem;">${item.icon}</div><div style="font-weight:700; font-size:0.75rem;">${item.name}</div><div style="font-size:0.75rem; font-weight:800; color:var(--btn-orange);">${item.purchased ? 'Placed 🎀' : `${item.cost} 🐾`}</div>${!item.purchased ? `<button type="button" class="btn-adopt">Adopt</button>` : ''}`;
      if (!item.purchased) {
        div.querySelector('button').addEventListener('click', () => {
          if (state.game.pawPoints >= item.cost) {
            state.game.pawPoints -= item.cost;
            item.purchased = true;
            saveState();
            renderWorld();
            renderAll();
          } else alert(`Need ${item.cost - state.game.pawPoints} more 🐾 Paw Points!`);
        });
      }
      cat.appendChild(div);
    });
  }
}

function renderStats() {
  const totalHoursElem = document.getElementById('stat-total-hours');
  const streakDaysElem = document.getElementById('stat-streak-days');
  const totalMins = state.game.sessionLogs.reduce((acc, curr) => acc + curr.minutes, 0);
  
  if (totalHoursElem) totalHoursElem.textContent = `${(totalMins / 60).toFixed(1)}h`;
  if (streakDaysElem) streakDaysElem.textContent = `${state.game.streak} Day`;

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
      const div = document.createElement('div');
      div.style.display = 'flex';
      div.style.flexDirection = 'column';
      div.style.alignItems = 'center';
      div.style.gap = '0.25rem';
      div.innerHTML = `<span style="font-size:0.7rem; font-weight:700;">${days[d.getDay()]}</span><div class="day-square ${done ? 'done' : ''}">${done ? '✓' : ''}</div>`;
      row.appendChild(div);
    }
  }

  const subjectList = document.getElementById('subject-breakdown-list');
  if (subjectList) {
    subjectList.innerHTML = '';
    const counts = {};
    state.game.sessionLogs.forEach(log => {
      counts[log.subject] = (counts[log.subject] || 0) + log.minutes;
    });

    const entries = Object.entries(counts);
    if (entries.length === 0) {
      subjectList.innerHTML = `<div style="text-align:center; padding:0.5rem; font-size:0.7rem; opacity:0.7;">No subjects logged yet.</div>`;
    } else {
      entries.forEach(([subj, mins]) => {
        const item = document.createElement('div');
        item.className = 'log-item-pill';
        item.innerHTML = `<div><strong>${escapeHTML(subj.substring(2, 25))}...</strong></div><div>${mins} mins</div>`;
        subjectList.appendChild(item);
      });
    }
  }

  const list = document.getElementById('session-log-list');
  if (list) {
    list.innerHTML = '';
    if (state.game.sessionLogs.length === 0) {
      list.innerHTML = `<div style="text-align:center; padding:0.5rem; font-size:0.7rem; opacity:0.7;">No study sessions logged today yet.</div>`;
    } else {
      state.game.sessionLogs.slice(0, 5).forEach(log => {
        const item = document.createElement('div');
        item.className = 'log-item-pill';
        item.innerHTML = `<div><strong>${escapeHTML(log.task)}</strong></div><div>${log.time} (${log.minutes}m)</div>`;
        list.appendChild(item);
      });
    }
  }
}

function initPlanner() {
  const calc = document.getElementById('btn-calc-schedule');
  if (calc) {
    calc.addEventListener('click', () => {
      const dateVal = document.getElementById('plan-date').value;
      const buffer = parseInt(document.getElementById('plan-buffer').value, 10) || 0;
      const pagesLeft = parseFloat(document.getElementById('plan-pages-left').value) || 0;
      const ankiLeft = parseFloat(document.getElementById('plan-anki-left').value) || 0;
      const pagesPace = parseFloat(document.getElementById('plan-pace-pages').value) || 5;
      const ankiPace = parseFloat(document.getElementById('plan-pace-anki').value) || 100;

      if (!dateVal) return alert('Please enter an exam date.');

      const diffDays = Math.ceil((new Date(dateVal) - new Date()) / (1000 * 60 * 60 * 24));
      const studyDays = Math.max(diffDays - buffer, 1);
      
      const dailyPages = Math.ceil(pagesLeft / studyDays);
      const dailyAnki = Math.ceil(ankiLeft / studyDays);
      
      const pomosForPages = Math.ceil(dailyPages / pagesPace);
      const pomosForAnki = Math.ceil(dailyAnki / ankiPace);
      const totalDailyPomos = pomosForPages + pomosForAnki;

      document.getElementById('rx-content').innerHTML = `
        <p>📖 <strong>Pages Goal:</strong> ${dailyPages} pages/day (${pomosForPages} pomodoros)</p>
        <p>🧠 <strong>Anki Goal:</strong> ${dailyAnki} cards/day (${pomosForAnki} pomodoros)</p>
        <p>🗓️ <strong>Study Span:</strong> ${studyDays} days (${buffer} buffer days)</p>
        <p>🐱 <strong>Total Daily Focus:</strong> <strong>${totalDailyPomos} Pomodoros/day</strong></p>
      `;
      document.getElementById('rx-card').style.display = 'block';
    });
  }
}

async function pullFromCloudOnStart() {
  const { jsonbinKey, jsonbinId } = state.settings;
  const badge = document.getElementById('sync-status-badge');
  if (!jsonbinKey || !jsonbinId) return;

  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${jsonbinId}/latest`, {
      headers: { 'X-Master-Key': jsonbinKey }
    });

    if (res.ok) {
      const json = await res.json();
      if (json && json.record && json.record.game) {
        if (json.record.game.totalPomodoros >= state.game.totalPomodoros) {
          state.game = json.record.game;
        }
      }
      if (badge) {
        badge.textContent = 'Cloud Active';
        badge.style.background = '#5EAA78';
      }
      renderAll();
    }
  } catch (err) {
    if (badge) badge.textContent = 'Offline Mode';
  }
}

let syncDebounceTimer = null;
function triggerAutoSync() {
  const { jsonbinKey, jsonbinId } = state.settings;
  if (!jsonbinKey || !jsonbinId) return;

  const badge = document.getElementById('sync-status-badge');
  if (badge) badge.textContent = 'Syncing...';

  clearTimeout(syncDebounceTimer);
  syncDebounceTimer = setTimeout(async () => {
    try {
      await fetch(`https://api.jsonbin.io/v3/b/${jsonbinId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': jsonbinKey
        },
        body: JSON.stringify({ game: state.game })
      });

      if (badge) {
        badge.textContent = 'Cloud Active';
        badge.style.background = '#5EAA78';
      }
    } catch (err) {
      if (badge) badge.textContent = 'Sync Error';
    }
  }, 1000);
}

/* ================= MASTER STUDIO ILLUSTRATED LIVING WORLD ENGINE ================= */
function initCanvasEngine() {
  const canvas = document.getElementById('pixel-bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, tick = 0;

  const resize = () => {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  };
  window.addEventListener('resize', resize);
  resize();

  function renderScene() {
    ctx.clearRect(0, 0, w, h);
    tick += 0.01;
    const biome = state.settings.currentBiome;
    const dark = state.settings.darkMode;

    // 1. RICH ILLUSTRATED INDIE GAME SKY GRADIENT
    let sky = ctx.createLinearGradient(0, 0, 0, h);
    if (dark) {
      sky.addColorStop(0, '#020306');
      sky.addColorStop(0.5, '#070c15');
      sky.addColorStop(1, '#0e1728');
    } else if (biome === 'forest') {
      sky.addColorStop(0, '#2874bc');
      sky.addColorStop(0.5, '#5ea3dc');
      sky.addColorStop(1, '#aed9fc');
    } else if (biome === 'mountain') {
      sky.addColorStop(0, '#103054');
      sky.addColorStop(0.5, '#2e5d91');
      sky.addColorStop(1, '#79a8d9');
    } else if (biome === 'sunset') {
      sky.addColorStop(0, '#190e2b');
      sky.addColorStop(0.5, '#4a265e');
      sky.addColorStop(1, '#d46a53');
    } else {
      sky.addColorStop(0, '#24101e');
      sky.addColorStop(0.5, '#4a2037');
      sky.addColorStop(1, '#823854');
    }
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // 2. DETAILED POLISHED GAME ENVIRONMENTS
    if (biome === 'forest') {
      // Background sunrays filtering through canopy
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.moveTo(w * 0.2, 0); ctx.lineTo(w * 0.35, 0); ctx.lineTo(w * 0.55, h); ctx.lineTo(w * 0.35, h); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(w * 0.6, 0); ctx.lineTo(w * 0.75, 0); ctx.lineTo(w * 0.95, h); ctx.lineTo(w * 0.75, h); ctx.fill();

      // Distant rolling hills
      ctx.fillStyle = dark ? '#0a1d13' : '#1e4227';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.5);
      ctx.bezierCurveTo(w * 0.3, h * 0.44 + Math.sin(tick * 0.4) * 8, w * 0.7, h * 0.52 + Math.cos(tick * 0.4) * 8, w, h * 0.5);
      ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();

      // Illustrated tree canopy back layer
      ctx.fillStyle = dark ? '#05100a' : '#102616';
      for (let i = 0; i < 9; i++) {
        let tx = ((i * 150 - tick * 20) % (w + 200)) - 100;
        ctx.beginPath();
        ctx.arc(tx + 40, h * 0.5, 50, 0, Math.PI * 2);
        ctx.arc(tx + 70, h * 0.45, 60, 0, Math.PI * 2);
        ctx.arc(tx + 100, h * 0.5, 45, 0, Math.PI * 2);
        ctx.fill();
      }

      // Cozy Illustrated Timber Cabin with Warm Lit Window & Animated Smoke
      let cabinX = (w * 0.6 - tick * 5) % (w + 300) - 100;
      ctx.fillStyle = '#6B4226'; // Cabin base
      ctx.fillRect(cabinX, h * 0.52 - 60, 90, 60);
      ctx.fillStyle = '#4A2810'; // Roof overhang
      ctx.beginPath();
      ctx.moveTo(cabinX - 12, h * 0.52 - 60);
      ctx.lineTo(cabinX + 45, h * 0.52 - 105);
      ctx.lineTo(cabinX + 102, h * 0.52 - 60);
      ctx.fill();
      // Warm glowing window
      ctx.fillStyle = '#FFC107';
      ctx.fillRect(cabinX + 18, h * 0.52 - 45, 20, 20);
      // Stone chimney & smoke puff
      ctx.fillStyle = '#555555';
      ctx.fillRect(cabinX + 60, h * 0.52 - 95, 14, 30);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      let smokeY = (h * 0.52 - 110) - ((tick * 12) % 40);
      ctx.beginPath();
      ctx.arc(cabinX + 67, smokeY, 8 + ((tick * 3) % 8), 0, Math.PI * 2);
      ctx.fill();

      // 🐰 Cute Hopping Bunny in foreground
      let bunnyX = (w - (tick * 55) % (w + 200));
      let bunnyY = h * 0.72 + Math.sin(tick * 7) * 9;
      ctx.fillStyle = '#E8A87C';
      ctx.beginPath();
      ctx.ellipse(bunnyX, bunnyY, 18, 12, 0, 0, Math.PI * 2);
      ctx.arc(bunnyX + 10, bunnyY - 10, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(bunnyX + 6, bunnyY - 25, 4, 12);
      ctx.fillRect(bunnyX + 13, bunnyY - 25, 4, 12);

      // Foreground detailed lush grass & moss layer
      ctx.fillStyle = dark ? '#040d08' : '#0b1f11';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.65);
      ctx.bezierCurveTo(w * 0.35, h * 0.58 + Math.sin(tick) * 15, w * 0.65, h * 0.68 + Math.cos(tick) * 15, w, h * 0.65);
      ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();

    } 
    else if (biome === 'mountain') {
      // Atmospheric mountain mist valley
      ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
      ctx.fillRect(0, h * 0.45, w, h * 0.25);

      // Majestic multi-layered painted mountain ranges
      ctx.fillStyle = dark ? '#0c1a2b' : '#223d5e';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.65);
      ctx.bezierCurveTo(w * 0.25, h * 0.32, w * 0.45, h * 0.48, w * 0.65, h * 0.2);
      ctx.bezierCurveTo(w * 0.82, h * 0.38, w * 0.92, h * 0.48, w, h * 0.58);
      ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();

      // Illustrated snow crests
      ctx.fillStyle = '#f0f4f8';
      ctx.beginPath();
      ctx.moveTo(w * 0.57, h * 0.28);
      ctx.lineTo(w * 0.65, h * 0.2);
      ctx.lineTo(w * 0.72, h * 0.32);
      ctx.lineTo(w * 0.65, h * 0.38);
      ctx.fill();

      // 🐐 Leaping Mountain Goat on cliff edge
      let goatX = (w * 0.55 + Math.sin(tick * 0.4) * 80);
      let goatY = h * 0.52 + Math.cos(tick * 1.5) * 4;
      ctx.fillStyle = '#D6D6D6';
      ctx.fillRect(goatX, goatY, 20, 14);
      ctx.fillRect(goatX + 13, goatY - 9, 9, 11);
      ctx.fillRect(goatX + 19, goatY - 15, 2, 6);

      // 🦅 Soaring Golden Eagle in high altitude sky
      let eagleX = (tick * 65) % (w + 200) - 100;
      let eagleY = 90 + Math.sin(tick * 3) * 18;
      ctx.fillStyle = '#2C221E';
      ctx.beginPath();
      ctx.moveTo(eagleX, eagleY);
      ctx.lineTo(eagleX + 14, eagleY - 9);
      ctx.lineTo(eagleX + 28, eagleY);
      ctx.lineTo(eagleX + 14, eagleY + 5);
      ctx.fill();

      // Crisp drifting snowfall
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 60; i++) {
        let sx = (i * 59 + tick * 22) % w;
        let sy = (i * 29 + tick * 40) % h;
        ctx.fillRect(sx, sy, 3, 3);
      }
    }
    else if (biome === 'sunset') {
      // Golden hour rolling meadow hills
      ctx.fillStyle = dark ? '#130a1c' : '#2e1938';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.6);
      ctx.bezierCurveTo(w * 0.3, h * 0.52, w * 0.7, h * 0.62, w, h * 0.6);
      ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();

      // 🦌 Graceful Stag silhouetted against twilight horizon
      let stagX = (w * 0.45 + Math.sin(tick * 0.25) * 60);
      let stagY = h * 0.58;
      ctx.fillStyle = '#261226';
      ctx.fillRect(stagX, stagY - 24, 12, 26);
      ctx.fillRect(stagX + 8, stagY - 38, 9, 16);

      // 🦇 Fluttering evening bats
      let batX = (tick * 50) % (w + 150) - 75;
      let batY = 140 + Math.sin(tick * 8) * 15;
      ctx.fillStyle = '#111111';
      ctx.beginPath();
      ctx.moveTo(batX, batY);
      ctx.lineTo(batX + 9, batY - 7);
      ctx.lineTo(batX + 18, batY);
      ctx.lineTo(batX + 9, batY + 4);
      ctx.fill();

      // Glowing fireflies with soft radial lighting halos
      for (let i = 0; i < 32; i++) {
        let fx = (i * 89 + Math.sin(tick + i) * 35 + tick * 12) % w;
        let fy = h * 0.35 + Math.sin(tick * 1.3 + i) * 75;
        
        let glow = ctx.createRadialGradient(fx, fy, 1, fx, fy, 20);
        glow.addColorStop(0, 'rgba(255, 245, 150, 0.95)');
        glow.addColorStop(0.4, 'rgba(255, 165, 30, 0.5)');
        glow.addColorStop(1, 'rgba(255, 90, 0, 0)');
        
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(fx, fy, 20, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    else {
      // Magical Sakura night garden hills
      ctx.fillStyle = dark ? '#170b14' : '#421f2f';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.58);
      ctx.bezierCurveTo(w * 0.35, h * 0.52, w * 0.65, h * 0.62, w, h * 0.58);
      ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();

      // Illustrated Japanese Paper Lanterns glowing softly in trees
      let lanternX = w * 0.25;
      let lanternY = h * 0.45;
      ctx.fillStyle = '#E63946';
      ctx.fillRect(lanternX, lanternY, 22, 28);
      ctx.fillStyle = '#FFD166';
      let lanternGlow = ctx.createRadialGradient(lanternX + 11, lanternY + 14, 2, lanternX + 11, lanternY + 14, 35);
      lanternGlow.addColorStop(0, 'rgba(255, 209, 102, 0.9)');
      lanternGlow.addColorStop(1, 'rgba(230, 57, 70, 0)');
      ctx.fillStyle = lanternGlow;
      ctx.beginPath();
      ctx.arc(lanternX + 11, lanternY + 14, 35, 0, Math.PI * 2);
      ctx.fill();

      // 🐼 Cute Red Panda perched in branch
      let pandaX = w * 0.72;
      let pandaY = h * 0.52;
      ctx.fillStyle = '#D9531E';
      ctx.beginPath();
      ctx.arc(pandaX, pandaY, 14, 0, Math.PI * 2);
      ctx.arc(pandaX + 8, pandaY - 9, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(pandaX + 4, pandaY - 12, 5, 5);

      // Swirling cherry blossom petals & butterflies
      for (let i = 0; i < 35; i++) {
        let bx = (i * 67 + Math.sin(tick + i) * 45 + tick * 22) % w;
        let by = (i * 31 + Math.cos(tick + i) * 28 + tick * 15) % h;
        
        ctx.fillStyle = 'rgba(255, 200, 220, 0.95)';
        ctx.fillRect(bx, by, 8, 6);
        ctx.fillStyle = 'rgba(255, 120, 160, 0.9)';
        ctx.fillRect(bx - 4, by - 2, 5, 3);
        ctx.fillRect(bx + 7, by - 2, 5, 3);
      }
    }

    requestAnimationFrame(renderScene);
  }
  renderScene();
}

function playTone(freq, dur) {
  if (!state.settings.soundEnabled) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + dur);
  } catch (e) {}
}

function playFanfare() {
  if (!state.settings.soundEnabled) return;
  [587.33, 783.99, 1046.50].forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.3), i * 130);
  });
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, t => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[t] || t));
}
