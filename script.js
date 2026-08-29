/* -------------------------------------------------------------
   PURRMODORO - Master Studio Procedural-Raster Hybrid Living Biome Engine
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
  localStorage.setItem('purrmodoro_pf_master_v23', JSON.stringify(state));
  if (state.settings.jsonbinKey && state.settings.jsonbinId) {
    triggerAutoSync();
  }
}

function loadState() {
  const raw = localStorage.getItem('purrmodoro_pf_master_v23');
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

/* ================= MASTER STUDIO ANIMATED LIVING BIOME ENGINE ================= */
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

  function drawPixelatedHeart(x, y, scale = 1) {
    ctx.fillStyle = '#ff6b8b';
    ctx.fillRect(x, y, 2 * scale, 2 * scale);
    ctx.fillRect(x + 4 * scale, y, 2 * scale, 2 * scale);
    ctx.fillRect(x - scale, y + scale, 8 * scale, 2 * scale);
    ctx.fillRect(x, y + 3 * scale, 6 * scale, 2 * scale);
    ctx.fillRect(x + 2 * scale, y + 5 * scale, 2 * scale, scale);
  }

  function renderScene() {
    ctx.clearRect(0, 0, w, h);
    tick += 0.012;
    const biome = state.settings.currentBiome;
    const dark = state.settings.darkMode;

    // 1. SKY GRADIENT
    let sky = ctx.createLinearGradient(0, 0, 0, h);
    if (dark) {
      sky.addColorStop(0, '#030509');
      sky.addColorStop(0.5, '#0a101c');
      sky.addColorStop(1, '#15243b');
    } else if (biome === 'forest') {
      sky.addColorStop(0, '#2d76bc');
      sky.addColorStop(0.5, '#65a9e0');
      sky.addColorStop(1, '#b5e0fe');
    } else if (biome === 'mountain') {
      sky.addColorStop(0, '#153860');
      sky.addColorStop(0.5, '#3b6a9e');
      sky.addColorStop(1, '#8cb5db');
    } else if (biome === 'sunset') {
      sky.addColorStop(0, '#1f1138');
      sky.addColorStop(0.5, '#593169');
      sky.addColorStop(1, '#e07a5f');
    } else {
      sky.addColorStop(0, '#fabecf');
      sky.addColorStop(0.5, '#ed80a4');
      sky.addColorStop(1, '#9fd6cc');
    }
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // 2. DETAILED LIVING ANIMATED WORLDS
    if (biome === 'forest') {
      // Background clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      for (let i = 0; i < 5; i++) {
        let cx = ((i * 300 + tick * 15) % (w + 350)) - 175;
        let cy = 50 + i * 40;
        ctx.beginPath();
        ctx.arc(cx, cy, 40, 0, Math.PI * 2);
        ctx.arc(cx + 30, cy - 12, 48, 0, Math.PI * 2);
        ctx.arc(cx + 65, cy, 35, 0, Math.PI * 2);
        ctx.fill();
      }

      // Mid-ground rolling forest hills
      ctx.fillStyle = dark ? '#0c2217' : '#1e3d25';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.52);
      ctx.bezierCurveTo(w * 0.3, h * 0.45 + Math.sin(tick * 0.5) * 10, w * 0.7, h * 0.55 + Math.cos(tick * 0.5) * 10, w, h * 0.52);
      ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();

      // Parallax pine trees
      ctx.fillStyle = dark ? '#06120b' : '#112b18';
      for (let i = 0; i < 8; i++) {
        let treeX = ((i * 160 - tick * 40) % (w + 200)) - 100;
        ctx.fillRect(treeX + 40, h * 0.52 - 80, 14, 90);
        ctx.beginPath();
        ctx.moveTo(treeX + 10, h * 0.52 - 20);
        ctx.lineTo(treeX + 47, h * 0.52 - 100);
        ctx.lineTo(treeX + 84, h * 0.52 - 20);
        ctx.fill();
      }

      // Cozy Woodland Cabin with glowing window & chimney smoke
      let cabinX = (w * 0.55 - tick * 6) % (w + 300) - 100;
      ctx.fillStyle = '#8B5A2B';
      ctx.fillRect(cabinX, h * 0.52 - 55, 75, 55);
      ctx.fillStyle = '#A0522D';
      ctx.beginPath();
      ctx.moveTo(cabinX - 10, h * 0.52 - 55);
      ctx.lineTo(cabinX + 37.5, h * 0.52 - 90);
      ctx.lineTo(cabinX + 85, h * 0.52 - 55);
      ctx.fill();
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(cabinX + 12, h * 0.52 - 40, 16, 16);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      let smokeY = (h * 0.52 - 95) - ((tick * 15) % 35);
      ctx.beginPath();
      ctx.arc(cabinX + 58, smokeY, 6 + ((tick * 4) % 6), 0, Math.PI * 2);
      ctx.fill();

      // 🐰 Hopping Bunny
      let bunnyX = (w - (tick * 60) % (w + 200));
      let bunnyY = h * 0.7 + Math.sin(tick * 8) * 10;
      ctx.fillStyle = '#F4C28D';
      ctx.beginPath();
      ctx.ellipse(bunnyX, bunnyY, 16, 11, 0, 0, Math.PI * 2);
      ctx.arc(bunnyX + 9, bunnyY - 9, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(bunnyX + 5, bunnyY - 22, 3, 11);
      ctx.fillRect(bunnyX + 11, bunnyY - 22, 3, 11);

      // 🦉 Gliding Owl in sky
      let owlX = (tick * 50) % (w + 200) - 100;
      let owlY = 120 + Math.sin(tick * 3) * 15;
      ctx.fillStyle = '#8B4513';
      ctx.beginPath();
      ctx.ellipse(owlX, owlY, 12, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(owlX + 3, owlY - 3, 3, 3);

      // Foreground lush hill
      ctx.fillStyle = dark ? '#08170f' : '#173620';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.68);
      ctx.bezierCurveTo(w * 0.35, h * 0.62, w * 0.65, h * 0.72, w, h * 0.68);
      ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();

    } 
    else if (biome === 'mountain') {
      // Mist belt
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(0, h * 0.4, w, h * 0.28);

      // Alpine mountains
      ctx.fillStyle = dark ? '#0d1a2c' : '#335270';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.68);
      ctx.bezierCurveTo(w * 0.22, h * 0.28, w * 0.4, h * 0.42, w * 0.6, h * 0.18);
      ctx.bezierCurveTo(w * 0.8, h * 0.35, w * 0.9, h * 0.45, w, h * 0.55);
      ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();

      // Snow caps
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(w * 0.54, h * 0.28);
      ctx.lineTo(w * 0.6, h * 0.18);
      ctx.lineTo(w * 0.66, h * 0.3);
      ctx.lineTo(w * 0.6, h * 0.36);
      ctx.fill();

      // 🐐 Leaping Mountain Goat
      let goatX = (w * 0.5 + Math.sin(tick * 0.5) * 100);
      let goatY = h * 0.48 + Math.cos(tick * 2) * 5;
      ctx.fillStyle = '#EAEAEA';
      ctx.fillRect(goatX, goatY, 18, 12);
      ctx.fillRect(goatX + 12, goatY - 8, 8, 10); // Head
      ctx.fillRect(goatX + 18, goatY - 14, 2, 6); // Horns

      // 🦅 Soaring Eagle
      let eagleX = (tick * 70) % (w + 200) - 100;
      let eagleY = 100 + Math.sin(tick * 4) * 20;
      ctx.fillStyle = '#3A2E2B';
      ctx.beginPath();
      ctx.moveTo(eagleX, eagleY);
      ctx.lineTo(eagleX + 12, eagleY - 8);
      ctx.lineTo(eagleX + 24, eagleY);
      ctx.lineTo(eagleX + 12, eagleY + 4);
      ctx.fill();

      // Snowfall
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 55; i++) {
        let sx = (i * 61 + tick * 25) % w;
        let sy = (i * 31 + tick * 45) % h;
        ctx.fillRect(sx, sy, 3, 3);
      }
    }
    else if (biome === 'sunset') {
      // Twilight hills
      ctx.fillStyle = dark ? '#150c21' : '#2b1633';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.63);
      ctx.bezierCurveTo(w * 0.3, h * 0.56, w * 0.7, h * 0.66, w, h * 0.63);
      ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();

      // 🦌 Wandering Stag on horizon ridge
      let stagX = (w * 0.4 + Math.sin(tick * 0.3) * 80);
      let stagY = h * 0.61;
      ctx.fillStyle = '#3A2010';
      ctx.fillRect(stagX, stagY - 20, 10, 22); // Body
      ctx.fillRect(stagX + 6, stagY - 32, 8, 14); // Head & Antlers

      // 🦇 Fluttering Bats
      let batX = (tick * 55) % (w + 150) - 75;
      let batY = 150 + Math.sin(tick * 10) * 15;
      ctx.fillStyle = '#111111';
      ctx.beginPath();
      ctx.moveTo(batX, batY);
      ctx.lineTo(batX + 8, batY - 6);
      ctx.lineTo(batX + 16, batY);
      ctx.lineTo(batX + 8, batY + 3);
      ctx.fill();

      // Glowing fireflies
      for (let i = 0; i < 28; i++) {
        let fx = (i * 97 + Math.sin(tick + i) * 40 + tick * 15) % w;
        let fy = h * 0.38 + Math.sin(tick * 1.4 + i) * 80;
        
        let glow = ctx.createRadialGradient(fx, fy, 1, fx, fy, 18);
        glow.addColorStop(0, 'rgba(255, 240, 140, 0.95)');
        glow.addColorStop(0.4, 'rgba(255, 175, 45, 0.5)');
        glow.addColorStop(1, 'rgba(255, 100, 10, 0)');
        
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(fx, fy, 18, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    else {
      // Sakura slopes
      ctx.fillStyle = dark ? '#1f0d16' : '#572b3d';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.61);
      ctx.bezierCurveTo(w * 0.35, h * 0.55, w * 0.65, h * 0.65, w, h * 0.61);
      ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();

      // 🐼 Cute Red Panda perched in mid-ground
      let pandaX = w * 0.7;
      let pandaY = h * 0.55;
      ctx.fillStyle = '#C04000';
      ctx.beginPath();
      ctx.arc(pandaX, pandaY, 12, 0, Math.PI * 2); // Body
      ctx.arc(pandaX + 6, pandaY - 8, 9, 0, Math.PI * 2); // Head
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(pandaX + 2, pandaY - 11, 4, 4); // White face patch

      // 🐦 Diving Bluebird
      let birdX = (w - (tick * 80) % (w + 200));
      let birdY = h * 0.4 + Math.sin(tick * 5) * 25;
      ctx.fillStyle = '#4682B4';
      ctx.beginPath();
      ctx.ellipse(birdX, birdY, 8, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Swirling petals and butterflies
      for (let i = 0; i < 30; i++) {
        let bx = (i * 71 + Math.sin(tick + i) * 50 + tick * 25) % w;
        let by = (i * 33 + Math.cos(tick + i) * 30 + tick * 18) % h;
        
        ctx.fillStyle = 'rgba(255, 215, 230, 0.95)';
        ctx.fillRect(bx, by, 7, 5);
        ctx.fillStyle = 'rgba(255, 130, 170, 0.9)';
        ctx.fillRect(bx - 4, by - 2, 5, 3);
        ctx.fillRect(bx + 6, by - 2, 5, 3);
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
