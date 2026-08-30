/* -------------------------------------------------------------
   PURRMODORO - Immersive Organic Fluid Wave & Gradient Engine
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
  planner: { isActive: false, examDate: '', dailyMinutesGoal: 0, pagesGoal: 0, ankiGoal: 0 },
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
  initFluidWaveEngine();
  
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
  localStorage.setItem('purrmodoro_pf_master_v30', JSON.stringify(state));
  if (state.settings.jsonbinKey && state.settings.jsonbinId) {
    triggerAutoSync();
  }
}

function loadState() {
  const raw = localStorage.getItem('purrmodoro_pf_master_v30');
  if (raw) {
    try { state = { ...state, ...JSON.parse(raw) }; } catch (e) {}
  }
  
  if (!state.planner) state.planner = { isActive: false, examDate: '', dailyMinutesGoal: 0, pagesGoal: 0, ankiGoal: 0 };

  if (!state.timer.isRunning) {
    state.timer.totalDuration = (state.timer.mode === 'study' ? state.settings.studyMin : state.settings.shortMin) * 60;
    state.timer.timeLeft = state.timer.totalDuration;
  }
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
        if (btn.dataset.tab === 'tab-planner') renderPlanner();
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

  document.getElementById('cfg-study-min').value = state.settings.studyMin;
  document.getElementById('cfg-short-min').value = state.settings.shortMin;
  document.getElementById('cfg-long-min').value = state.settings.longMin;

  const forceSaveBtn = document.getElementById('btn-force-save');
  if (forceSaveBtn) {
    forceSaveBtn.addEventListener('click', () => {
      state.settings.studyMin = parseInt(document.getElementById('cfg-study-min').value, 10) || 25;
      state.settings.shortMin = parseInt(document.getElementById('cfg-short-min').value, 10) || 5;
      state.settings.longMin = parseInt(document.getElementById('cfg-long-min').value, 10) || 20;
      saveState();

      if (!state.timer.isRunning) {
        state.timer.totalDuration = (state.timer.mode === 'study' ? state.settings.studyMin : state.settings.shortMin) * 60;
        state.timer.timeLeft = state.timer.totalDuration;
        renderTimer();
      }
      alert('Settings Saved Successfully! 🐾');
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
  const skipBtn = document.getElementById('btn-timer-skip'); 
  const studyBtn = document.getElementById('btn-mode-study');
  const breakBtn = document.getElementById('btn-mode-break');

  if (toggleBtn) toggleBtn.addEventListener('click', toggleTimer);
  if (resetBtn) resetBtn.addEventListener('click', resetTimer);
  
  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      if (state.timer.isRunning) pauseTimer();
      completeBlock();
    });
  }

  if (studyBtn) studyBtn.addEventListener('click', () => setMode('study'));
  if (breakBtn) breakBtn.addEventListener('click', () => setMode('shortBreak'));

  updateModeUI();
}

function setMode(newMode) {
  if (state.timer.isRunning) pauseTimer();
  state.timer.mode = newMode;
  state.timer.totalDuration = (newMode === 'study' ? state.settings.studyMin : state.settings.shortMin) * 60;
  state.timer.timeLeft = state.timer.totalDuration;
  updateModeUI();
  renderTimer();
}

function updateModeUI() {
  const isStudy = state.timer.mode === 'study';
  document.body.classList.toggle('mode-break', !isStudy);
  
  const sBtn = document.getElementById('btn-mode-study');
  const bBtn = document.getElementById('btn-mode-break');
  if (sBtn) sBtn.classList.toggle('active', isStudy);
  if (bBtn) bBtn.classList.toggle('active', !isStudy);
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
  document.body.classList.add('timer-running');

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
  document.body.classList.remove('timer-running');
}

function resetTimer() {
  clearInterval(state.timer.intervalId);
  state.timer.isRunning = false;
  document.getElementById('btn-timer-toggle').textContent = '▶';
  document.body.classList.remove('timer-running');

  state.timer.totalDuration = (state.timer.mode === 'study' ? state.settings.studyMin : state.settings.shortMin) * 60;
  state.timer.timeLeft = state.timer.totalDuration;
  renderTimer();
}

function completeBlock() {
  clearInterval(state.timer.intervalId);
  state.timer.isRunning = false;
  document.getElementById('btn-timer-toggle').textContent = '▶';
  document.body.classList.remove('timer-running');

  playFanfare();

  const today = getTodayDateString();
  if (state.game.lastActiveDate !== today) {
    state.game.todayMinutes = 0;
    state.game.todayPomodoros = 0;
    state.game.lastActiveDate = today;
  }

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
  
  updateModeUI();
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
  renderPlanner();
  
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
        span.className = 'placed-item-emoji';
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
      
      div.innerHTML = `
        <div style="font-size: 2rem; margin-bottom: 5px;">${item.icon}</div>
        <div style="font-weight:700; font-size:0.75rem;">${item.name}</div>
        <div style="font-size:0.75rem; font-weight:800; color:var(--btn-orange);">${item.purchased ? 'Placed 🎀' : `${item.cost} 🐾`}</div>
        ${!item.purchased ? `<button type="button" class="btn-adopt">Adopt</button>` : ''}
      `;
      
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
      state.game.sessionLogs.forEach((log, index) => {
        const item = document.createElement('div');
        item.className = 'log-item-pill';
        item.innerHTML = `
          <div style="flex:1;">
              <div><strong>${escapeHTML(log.task)}</strong> <span style="font-size:0.6rem; opacity:0.7;">(${escapeHTML(log.subject.substring(0, 15))}...)</span></div>
              <div>${log.time} (${log.minutes}m)</div>
          </div>
          <div style="display:flex; gap:6px; align-items:center;">
              <button class="btn-edit-log" data-idx="${index}" style="background:none;border:none;cursor:pointer;font-size:1.1rem;" title="Edit Task & Subject">✏️</button>
              <button class="btn-del-log" data-idx="${index}" style="background:none;border:none;cursor:pointer;font-size:1.1rem;" title="Delete Log">🗑️</button>
          </div>
        `;
        list.appendChild(item);
      });

      document.querySelectorAll('.btn-edit-log').forEach(btn => {
          btn.addEventListener('click', (e) => {
              const idx = e.currentTarget.dataset.idx;
              const log = state.game.sessionLogs[idx];
              
              const subjText = MEDICAL_SUBJECTS.map((s, i) => `${i + 1}. ${s}`).join('\n');
              const subjInput = prompt(`Edit Subject (Enter the number):\n\n${subjText}`, MEDICAL_SUBJECTS.indexOf(log.subject) + 1);
              
              if (subjInput !== null) {
                  const selectedIdx = parseInt(subjInput, 10) - 1;
                  if (selectedIdx >= 0 && selectedIdx < MEDICAL_SUBJECTS.length) {
                      log.subject = MEDICAL_SUBJECTS[selectedIdx];
                  } else {
                      alert("Invalid number, subject kept as: " + log.subject);
                  }
              }

              const newTask = prompt("Edit Task Name:", log.task);
              if (newTask !== null) {
                  log.task = newTask || "Focus Session";
              }

              saveState();
              renderStats(); 
          });
      });

      document.querySelectorAll('.btn-del-log').forEach(btn => {
          btn.addEventListener('click', (e) => {
              if (confirm("Delete this session? This will remove the minutes from your total.")) {
                  const idx = e.currentTarget.dataset.idx;
                  const log = state.game.sessionLogs[idx];
                  
                  state.game.todayPomodoros = Math.max(0, state.game.todayPomodoros - 1);
                  state.game.totalPomodoros = Math.max(0, state.game.totalPomodoros - 1);
                  state.game.todayMinutes = Math.max(0, state.game.todayMinutes - log.minutes);

                  state.game.sessionLogs.splice(idx, 1);
                  saveState();
                  renderStats();
                  renderPlanner();
              }
          });
      });
    }
  }
}

function initPlanner() {
  const calc = document.getElementById('btn-calc-schedule');
  const clear = document.getElementById('btn-clear-plan');

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
      
      const hoursForPages = dailyPages / pagesPace;
      const hoursForAnki = dailyAnki / ankiPace;
      const dailyHours = hoursForPages + hoursForAnki;

      state.planner = {
        isActive: true,
        examDate: dateVal,
        dailyMinutesGoal: Math.ceil(dailyHours * 60),
        pagesGoal: dailyPages,
        ankiGoal: dailyAnki
      };

      saveState();
      renderPlanner();
    });
  }

  if (clear) {
    clear.addEventListener('click', () => {
      state.planner.isActive = false;
      saveState();
      renderPlanner();
    });
  }
}

function renderPlanner() {
  const setupView = document.getElementById('planner-setup');
  const activeView = document.getElementById('planner-active');
  if (!setupView || !activeView) return;

  if (state.planner && state.planner.isActive) {
    setupView.style.display = 'none';
    activeView.style.display = 'block';

    const diffDays = Math.ceil((new Date(state.planner.examDate) - new Date()) / (1000 * 60 * 60 * 24));
    const daysText = diffDays > 0 ? `${diffDays} Days Left` : (diffDays === 0 ? 'Exam Today! Good Luck!' : 'Exam Passed');

    document.getElementById('active-exam-countdown').textContent = daysText;
    document.getElementById('active-daily-hours').textContent = (state.planner.dailyMinutesGoal / 60).toFixed(1);
    document.getElementById('active-daily-pages').textContent = state.planner.pagesGoal;
    document.getElementById('active-daily-anki').textContent = state.planner.ankiGoal;

    const studiedHours = (state.game.todayMinutes / 60).toFixed(1);
    const targetHours = (state.planner.dailyMinutesGoal / 60).toFixed(1);
    document.getElementById('active-today-progress-text').textContent = `${studiedHours}h / ${targetHours}h`;

    let progressPct = state.planner.dailyMinutesGoal > 0 ? (state.game.todayMinutes / state.planner.dailyMinutesGoal) * 100 : 0;
    if (progressPct > 100) progressPct = 100;
    document.getElementById('active-today-progress-fill').style.width = `${progressPct}%`;

  } else {
    setupView.style.display = 'block';
    activeView.style.display = 'none';
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
      if (json && json.record) {
        // Sync Game Stats
        if (json.record.game && json.record.game.totalPomodoros >= state.game.totalPomodoros) {
          state.game = json.record.game;
        }
        // Sync Planner Status
        if (json.record.planner) {
          state.planner = json.record.planner;
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
        // Uploads both Game stats AND Planner configuration
        body: JSON.stringify({ game: state.game, planner: state.planner })
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

function initFluidWaveEngine() {
  const canvas = document.getElementById('fluid-bg-canvas');
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
    tick += 0.012;
    const biome = state.settings.currentBiome;
    const dark = state.settings.darkMode;

    let bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    if (dark) {
      bgGrad.addColorStop(0, '#060a12');
      bgGrad.addColorStop(1, '#152238');
    } else if (biome === 'forest') {
      bgGrad.addColorStop(0, '#2d5a3f');
      bgGrad.addColorStop(0.5, '#1e3d29');
      bgGrad.addColorStop(1, '#0f2015');
    } else if (biome === 'mountain') {
      bgGrad.addColorStop(0, '#314e6b');
      bgGrad.addColorStop(0.5, '#1e334a');
      bgGrad.addColorStop(1, '#0b1622');
    } else if (biome === 'sunset') {
      bgGrad.addColorStop(0, '#613348');
      bgGrad.addColorStop(0.5, '#3b1d30');
      bgGrad.addColorStop(1, '#1c0d17');
    } else {
      bgGrad.addColorStop(0, '#592e42');
      bgGrad.addColorStop(1, '#1c0915');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    const waveCount = 4;
    for (let i = 0; i < waveCount; i++) {
      ctx.beginPath();
      ctx.moveTo(0, h);

      let alpha = 0.15 + (i * 0.05);
      if (biome === 'forest') {
        ctx.fillStyle = i % 2 === 0 ? `rgba(80, 160, 100, ${alpha})` : `rgba(40, 100, 70, ${alpha})`;
      } else if (biome === 'mountain') {
        ctx.fillStyle = i % 2 === 0 ? `rgba(100, 140, 180, ${alpha})` : `rgba(50, 90, 130, ${alpha})`;
      } else if (biome === 'sunset') {
        ctx.fillStyle = i % 2 === 0 ? `rgba(220, 140, 100, ${alpha})` : `rgba(160, 70, 110, ${alpha})`;
      } else {
        ctx.fillStyle = i % 2 === 0 ? `rgba(240, 150, 180, ${alpha})` : `rgba(180, 80, 120, ${alpha})`;
      }

      let yBase = h * (0.4 + (i * 0.12));
      for (let x = 0; x <= w; x += 30) {
        let y = yBase + Math.sin(x * 0.003 + tick + (i * 0.8)) * 45 + Math.cos(x * 0.005 - tick * 0.5) * 25;
        ctx.lineTo(x, y);
      }

      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();
    }

    for (let j = 0; j < 5; j++) {
      let ox = (j * 250 + Math.sin(tick * 0.5 + j) * 100 + tick * 20) % (w + 200) - 100;
      let oy = h * 0.3 + Math.cos(tick * 0.4 + j) * 80;
      
      let orb = ctx.createRadialGradient(ox, oy, 10, ox, oy, 150);
      if (biome === 'forest') {
        orb.addColorStop(0, 'rgba(120, 220, 140, 0.25)');
        orb.addColorStop(1, 'rgba(50, 120, 80, 0)');
      } else if (biome === 'mountain') {
        orb.addColorStop(0, 'rgba(140, 200, 255, 0.25)');
        orb.addColorStop(1, 'rgba(60, 110, 170, 0)');
      } else if (biome === 'sunset') {
        orb.addColorStop(0, 'rgba(255, 180, 120, 0.3)');
        orb.addColorStop(1, 'rgba(180, 80, 120, 0)');
      } else {
        orb.addColorStop(0, 'rgba(255, 160, 200, 0.3)');
        orb.addColorStop(1, 'rgba(140, 60, 110, 0)');
      }

      ctx.fillStyle = orb;
      ctx.beginPath();
      ctx.arc(ox, oy, 150, 0, Math.PI * 2);
      ctx.fill();
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
