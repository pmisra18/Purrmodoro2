/* -------------------------------------------------------------
   PURRMODORO - High-End 16-Bit Pixel Engine & Parallax Backgrounds
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

const WORLD_WINGS = [
  { name: "Melog's Bedroom", icon: '🛏️', reqLevel: 1 },
  { name: "Medical Library", icon: '📚', reqLevel: 5 },
  { name: "Cozy Anatomy Café", icon: '☕', reqLevel: 10 },
  { name: "Pharmacology Green", icon: '🌿', reqLevel: 20 },
  { name: "The Whisker Clinic", icon: '🩺', reqLevel: 35 },
  { name: "Simulation Suite", icon: '🫀', reqLevel: 50 },
  { name: "Stargazer Lounge", icon: '🌙', reqLevel: 75 },
  { name: "Teaching Hospital", icon: '🏥', reqLevel: 100 }
];

const CATALOG_ITEMS = [
  { id: 'tea', name: 'Chamomile Tea', icon: '☕', cost: 20, purchased: false },
  { id: 'yarn', name: "Melog's Wool Ball", icon: '🧶', cost: 50, purchased: false },
  { id: 'plant', name: 'Monstera Plant', icon: '🪴', cost: 100, purchased: false },
  { id: 'steth', name: 'Blush Stethoscope', icon: '🩺', cost: 250, purchased: false },
  { id: 'bones', name: 'Desktop Skeleton', icon: '🦴', cost: 500, purchased: false },
  { id: 'coat', name: "Mini White Coat", icon: '🥼', cost: 1000, purchased: false }
];

let state = {
  settings: { studyMin: 25, shortMin: 5, longMin: 20, longInterval: 4, dailyTarget: 8, soundEnabled: true, darkMode: false, currentBiome: 'forest', supaUrl: '', supaKey: '' },
  timer: { mode: 'study', timeLeft: 25 * 60, totalDuration: 25 * 60, isRunning: false, intervalId: null },
  game: { xp: 0, level: 1, pawPoints: 0, streak: 1, todayPomodoros: 0, todayMinutes: 0, totalPomodoros: 0, cycleCount: 1, lastActiveDate: getTodayDateString(), activeDays: {}, sessionLogs: [], catalog: [...CATALOG_ITEMS] }
};

const RING_CIRCUMFERENCE = 2 * Math.PI * 133;

document.addEventListener('DOMContentLoaded', () => {
  loadState();
  initTheme();
  initTabs();
  initUI();
  initTimer();
  initPlanner();
  initCanvas();
  renderAll();
});

function getTodayDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function saveState() {
  localStorage.setItem('purrmodoro_pf_master_v9', JSON.stringify(state));
  if (state.settings.supaUrl && state.settings.supaKey) {
    syncWithSupabase();
  }
}

function loadState() {
  const raw = localStorage.getItem('purrmodoro_pf_master_v9');
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
  const supaUrlInput = document.getElementById('cfg-supa-url');
  const supaKeyInput = document.getElementById('cfg-supa-key');
  if (supaUrlInput) supaUrlInput.value = state.settings.supaUrl || '';
  if (supaKeyInput) supaKeyInput.value = state.settings.supaKey || '';

  if (btnSaveCloud) {
    btnSaveCloud.addEventListener('click', () => {
      state.settings.supaUrl = supaUrlInput.value.trim();
      state.settings.supaKey = supaKeyInput.value.trim();
      saveState();
      syncWithSupabase();
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
    state.game.pawPoints += 10;
    state.game.xp += 25;
    state.game.cycleCount++;

    const newLevel = Math.floor(state.game.xp / 100) + 1;
    if (newLevel > state.game.level) state.game.level = newLevel;

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
  
  const activeDot = (state.game.cycleCount - 1) % 4;
  for (let i = 1; i <= 4; i++) {
    const dot = document.getElementById(`dot-${i}`);
    if (dot) dot.classList.toggle('active', i - 1 <= activeDot);
  }
}

function renderWorld() {
  const map = document.getElementById('world-map-grid');
  if (map) {
    map.innerHTML = '';
    WORLD_WINGS.forEach(w => {
      const unlocked = state.game.level >= w.reqLevel;
      const div = document.createElement('div');
      div.className = `pf-item-box ${unlocked ? '' : 'locked'}`;
      div.innerHTML = `<div style="font-size:1.6rem;">${w.icon}</div><div style="font-weight:700; font-size:0.75rem; margin-top:0.2rem;">${w.name}</div><div style="font-size:0.65rem; opacity:0.8;">${unlocked ? '✨ Unlocked' : `Req. Lvl ${w.reqLevel}`}</div>`;
      map.appendChild(div);
    });
  }

  const cat = document.getElementById('furniture-catalog-grid');
  if (cat) {
    cat.innerHTML = '';
    state.game.catalog.forEach(item => {
      const div = document.createElement('div');
      div.className = `pf-item-box ${item.purchased ? '' : 'locked'}`;
      div.innerHTML = `<div style="font-size:1.6rem;">${item.icon}</div><div style="font-weight:700; font-size:0.75rem;">${item.name}</div><div style="font-size:0.75rem; font-weight:800; color:var(--btn-orange);">${item.purchased ? 'Owned 🎀' : `${item.cost} 🐾`}</div>${!item.purchased ? `<button type="button" class="btn-adopt">Adopt</button>` : ''}`;
      if (!item.purchased) {
        div.querySelector('button').addEventListener('click', () => {
          if (state.game.pawPoints >= item.cost) {
            state.game.pawPoints -= item.cost;
            item.purchased = true;
            saveState();
            renderWorld();
            alert(`Adopted ${item.name}! Melog loves it! ✨`);
          } else alert(`Need ${item.cost - state.game.pawPoints} more 🐾 Paw Points!`);
        });
      }
      cat.appendChild(div);
    });
  }
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
      const div = document.createElement('div');
      div.style.display = 'flex';
      div.style.flexDirection = 'column';
      div.style.alignItems = 'center';
      div.style.gap = '0.25rem';
      div.innerHTML = `<span style="font-size:0.7rem; font-weight:700;">${days[d.getDay()]}</span><div class="day-square ${done ? 'done' : ''}">${done ? '✓' : ''}</div>`;
      row.appendChild(div);
    }
  }

  const list = document.getElementById('session-log-list');
  if (list) {
    list.innerHTML = '';
    if (state.game.sessionLogs.length === 0) {
      list.innerHTML = `<div style="text-align:center; padding:0.8rem; font-size:0.75rem; opacity:0.7;">No study sessions logged today yet.</div>`;
    } else {
      state.game.sessionLogs.slice(0, 8).forEach(log => {
        const item = document.createElement('div');
        item.className = 'log-item-pill';
        item.innerHTML = `<div><strong>${escapeHTML(log.subject)}</strong> &mdash; ${escapeHTML(log.task)}</div><div>${log.time} (${log.minutes}m)</div>`;
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

async function syncWithSupabase() {
  const { supaUrl, supaKey } = state.settings;
  if (!supaUrl || !supaKey) return alert('Please enter your Supabase Project URL and Anon Key first.');

  const badge = document.getElementById('sync-status-badge');
  if (badge) badge.textContent = 'Syncing...';

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

      if (badge) {
        badge.textContent = 'Cloud Active';
        badge.style.background = '#5EAA78';
      }
      saveState();
      renderAll();
      alert('Successfully synced with Supabase! ☁️');
    } else {
      if (badge) badge.textContent = 'Auth Error';
    }
  } catch (err) {
    if (badge) badge.textContent = 'Offline';
    alert('Supabase sync failed. Check your network or credentials.');
  }
}

/* 60 FPS High-Definition Pixel Art Landscape Engine matching Official PomoFox Game Scenes */
function initCanvas() {
  const canvas = document.getElementById('pixel-bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h;
  let cloudOffset = 0;

  const resize = () => {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  };
  window.addEventListener('resize', resize);
  resize();

  let particles = Array.from({ length: 35 }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    size: Math.random() * 3 + 2,
    vx: (Math.random() - 0.5) * 0.4,
    vy: Math.random() * 0.4 + 0.2
  }));

  function drawPixelForestCanopy(x, y, scale, dark) {
    ctx.fillStyle = dark ? '#0F1E16' : '#28442E';
    ctx.fillRect(x, y, 8 * scale, 50 * scale);
    
    const c1 = dark ? '#0B1710' : '#1B3422';
    const c2 = dark ? '#132C1F' : '#335C3E';
    
    for (let i = 0; i < 6; i++) {
      let tw = (36 - i * 5) * scale;
      let th = 8 * scale;
      let ty = y - i * 7 * scale - 2 * scale;
      ctx.fillStyle = c1;
      ctx.fillRect(x - tw / 2 + 4 * scale, ty, tw, th);
      ctx.fillStyle = c2;
      ctx.fillRect(x - tw / 2 + 7 * scale, ty, tw - 6 * scale, 3 * scale);
    }
  }

  function drawMajesticMountain(x, y, width, height, dark) {
    ctx.fillStyle = dark ? '#142236' : '#587D9E';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width / 2, y - height);
    ctx.lineTo(x + width, y);
    ctx.fill();

    ctx.fillStyle = dark ? '#1C3150' : '#7298B8';
    ctx.beginPath();
    ctx.moveTo(x + width * 0.32, y - height * 0.55);
    ctx.lineTo(x + width / 2, y - height);
    ctx.lineTo(x + width * 0.48, y);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(x + width * 0.36, y - height * 0.62);
    ctx.lineTo(x + width / 2, y - height);
    ctx.lineTo(x + width * 0.64, y - height * 0.62);
    ctx.lineTo(x + width * 0.5, y - height * 0.46);
    ctx.fill();
  }

  function drawVolumetricCloud(x, y, cw, ch) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(x, y, cw, ch);
    ctx.fillRect(x + 16, y - 10, cw - 32, 12);
    ctx.fillRect(x + 32, y - 20, cw - 64, 10);
  }

  function renderScenery() {
    ctx.clearRect(0, 0, w, h);
    const dark = state.settings.darkMode;
    const biome = state.settings.currentBiome;
    cloudOffset += 0.2;
    if (cloudOffset > w) cloudOffset = 0;

    let sky = ctx.createLinearGradient(0, 0, 0, h);
    if (dark) {
      sky.addColorStop(0, '#090D14');
      sky.addColorStop(0.65, '#141D2E');
      sky.addColorStop(1, '#1E2D44');
    } else if (biome === 'forest') {
      sky.addColorStop(0, '#4688B8');
      sky.addColorStop(0.55, '#7CB3D8');
      sky.addColorStop(1, '#B5DCEB');
    } else if (biome === 'mountain') {
      sky.addColorStop(0, '#295E9A');
      sky.addColorStop(0.6, '#5283B7');
      sky.addColorStop(1, '#A4CBE6');
    } else if (biome === 'sunset') {
      sky.addColorStop(0, '#322C5C');
      sky.addColorStop(0.5, '#685182');
      sky.addColorStop(1, '#C98EA7');
    } else {
      sky.addColorStop(0, '#FCDCE6');
      sky.addColorStop(0.6, '#F3B8CD');
      sky.addColorStop(1, '#CDE2DC');
    }
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    if (biome === 'forest') {
      drawVolumetricCloud((w * 0.05 + cloudOffset) % (w + 200) - 100, h * 0.12, 160, 30);
      drawVolumetricCloud((w * 0.55 + cloudOffset * 0.8) % (w + 220) - 110, h * 0.06, 200, 36);

      ctx.fillStyle = dark ? '#10221A' : '#4E7A53';
      ctx.fillRect(0, h * 0.42, w, 80);

      for (let x = -20; x < w * 0.38; x += 28) {
        drawPixelForestCanopy(x, h * 0.52 + (Math.abs(x) % 3) * 10, 1.5, dark);
      }
      for (let x = w * 0.62; x < w + 30; x += 28) {
        drawPixelForestCanopy(x, h * 0.52 + (Math.abs(x) % 3) * 10, 1.5, dark);
      }
    } 
    else if (biome === 'mountain') {
      drawMajesticMountain(w * 0.1, h * 0.64, 380, 250, dark);
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.fillRect(0, h * 0.6, w, 40);
    }
    else if (biome === 'sunset') {
      drawVolumetricCloud((w * 0.1 + cloudOffset * 0.9) % (w + 240) - 120, h * 0.22, 240, 50);
      drawVolumetricCloud((w * 0.45 + cloudOffset * 0.7) % (w + 260) - 130, h * 0.45, 280, 55);

      ctx.fillStyle = dark ? '#1E1420' : '#4A2A38';
      ctx.fillRect(0, h * 0.74, w, h * 0.3);
    }
    else {
      ctx.fillStyle = dark ? '#1A1426' : '#D49CB3';
      ctx.beginPath();
      ctx.arc(w * 0.3, h * 0.78, w * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y > h) { p.y = -10; p.x = Math.random() * w; }
      ctx.fillStyle = dark ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.8)';
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });

    requestAnimationFrame(renderScenery);
  }
  renderScenery();
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
