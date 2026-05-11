// ===== GlowNest — dashboard.js =====

const MOOD_CONFIG = {
  tired:       { emoji: '😴', label: 'Tired',       tip: 'Take a 20-min nap. That\'s all.' },
  stressed:    { emoji: '😤', label: 'Stressed',     tip: 'Box breathing: in 4s, hold 4s, out 4s.' },
  overwhelmed: { emoji: '😵', label: 'Overwhelmed',  tip: 'Pick ONE task. Just one. That\'s it.' },
  okay:        { emoji: '😌', label: 'Okay',         tip: 'Solid baseline. Ride it gently.' },
  productive:  { emoji: '💪', label: 'Productive',   tip: 'You\'re in flow. Make it count!' },
  happy:       { emoji: '🌟', label: 'Happy',        tip: 'Spread it around. Text someone you like.' },
};

const BAD_DAY_MOODS = ['tired', 'stressed', 'overwhelmed'];

// ===== RENDER DASHBOARD =====
function renderDashboard() {
  checkHydReset();
  const name = Store.get('name', 'friend');
  const score = calcScore();

  // Greeting & name
  document.getElementById('dash-greeting').textContent = getGreeting() + ', ' + name + ' ✨';

  // Score ring
  renderScoreRing(score);

  // Quote
  const q = getDailyQuote();
  document.getElementById('quote-text').textContent = q.text;
  document.getElementById('quote-author').textContent = '— ' + q.author;

  // Mood tip
  const m = MOOD_CONFIG[State.mood];
  const moodTip = document.getElementById('mood-tip');
  if (m && moodTip) {
    moodTip.textContent = m.tip;
    moodTip.parentElement.classList.remove('hidden');
  } else if (moodTip) {
    moodTip.parentElement.classList.add('hidden');
  }

  // Bad day mode
  updateBadDayMode();

  // Hydration
  renderHydration();

  // Mood selector highlight
  document.querySelectorAll('.mood-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.mood === State.mood);
  });

  // Weekly snapshot
  renderWeeklySnapshot();
  renderTodayStrip();
  renderDailyTip('daily-tip-exit');
}

// ===== SCORE RING =====
function renderScoreRing(score) {
  const el = document.getElementById('score-ring-fill');
  const numEl = document.getElementById('score-num');
  if (!el) return;
  const r = 44, circ = 2 * Math.PI * r;
  el.setAttribute('stroke-dasharray', circ);
  el.setAttribute('stroke-dashoffset', circ - (circ * score / 100));
  if (numEl) numEl.textContent = score;
}

// ===== HYDRATION =====
function renderHydration() {
  const grid = document.getElementById('hydration-drops');
  if (!grid) return;
  grid.innerHTML = '';
  for (let i = 1; i <= 8; i++) {
    const drop = document.createElement('span');
    drop.className = 'water-drop' + (i <= State.hydration ? ' filled' : '');
    drop.textContent = '💧';
    drop.title = i <= State.hydration ? 'Logged!' : 'Tap to log';
    drop.addEventListener('click', () => logWater(i));
    grid.appendChild(drop);
  }
  document.getElementById('hydration-count').textContent = State.hydration + '/8 glasses';
}

function logWater(target) {
  State.hydration = State.hydration >= target ? target - 1 : target;
  Store.set('hydration', State.hydration);
  renderHydration();
  if (State.hydration === 8) { showToast('💧 Fully hydrated! You\'re glowing!'); addXP(10); }
  else if (State.hydration > 0) showToast('💧 Drink noted! Keep it up.');

  // Save trend
  const trends = Store.get('hydTrends', {});
  trends[today()] = State.hydration;
  Store.set('hydTrends', trends);
}

// ===== MOOD SELECT =====
function selectMood(mood) {
  State.mood = mood;
  Store.set('mood', mood);
  State.badDay = BAD_DAY_MOODS.includes(mood);
  Store.set('badDay', State.badDay);

  // Save mood history
  const history = Store.get('moodHistory', {});
  history[today()] = mood;
  Store.set('moodHistory', history);

  // Refresh
  renderDashboard();
  showToast('Mood logged: ' + MOOD_CONFIG[mood].emoji + ' ' + MOOD_CONFIG[mood].label);
  addXP(5);
}

// ===== BAD DAY MODE =====
function updateBadDayMode() {
  const banner = document.getElementById('bad-day-banner');
  const body = document.body;
  if (State.badDay) {
    body.classList.add('bad-day-mode');
    if (banner) banner.classList.remove('hidden');
  } else {
    body.classList.remove('bad-day-mode');
    if (banner) banner.classList.add('hidden');
  }
}

// ===== WEEKLY SNAPSHOT =====
function renderWeeklySnapshot() {
  const habits = Store.get('habits', []);
  const wk = weekKey();
  const el = document.getElementById('weekly-snapshot');
  if (!el) return;
  if (habits.length === 0) {
    el.innerHTML = '<p class="text-muted text-sm text-center" style="padding:20px">Add habits to see your weekly snapshot ✨</p>';
    return;
  }
  el.innerHTML = habits.slice(0, 3).map(h => {
    const done = (h.completions || {})[wk] || 0;
    const pct = Math.min(Math.round((done / h.target) * 100), 100);
    return `<div class="mb-12">
      <div class="flex justify-between items-center mb-4">
        <span class="text-sm" style="font-weight:500">${h.emoji || '✨'} ${h.name}</span>
        <span class="text-xs text-muted">${done}/${h.target}</span>
      </div>
      <div class="progress-wrap"><div class="progress-bar" style="width:${pct}%"></div></div>
    </div>`;
  }).join('');
}

// ===== QUICK ACTIONS =====
function initQuickActions() {
  document.querySelectorAll('[data-quick]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.quick;
      if (action === 'water') { logWater(State.hydration + 1); }
      else if (action === 'mood') { openModal('modal-mood'); }
      else if (action === 'habit') { navigate('habits'); }
      else if (action === 'wellness') { navigate('wellness'); }
    });
  });
}

// ===== ONBOARDING NAME =====
function saveName() {
  const inp = document.getElementById('name-input');
  if (inp && inp.value.trim()) {
    Store.set('name', inp.value.trim());
    Store.set('returning', true);
    closeModal('modal-onboard');
    navigate('dashboard');
    renderDashboard();
    showToast('Welcome to GlowNest, ' + inp.value.trim() + '! 🌿');
  }
}

// ===== MOOD MODAL INIT =====
function initMoodModal() {
  document.querySelectorAll('.mood-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectMood(btn.dataset.mood);
      closeModal('modal-mood');
    });
  });
}
// Today strip encouragement
function renderTodayStrip() {
  const msgs = [
    'One thing at a time. You\'ve got this 🌿',
    'Start with water. Everything else can wait.',
    'Low energy days are valid days too.',
    'You showed up. That already counts.',
    'Progress over perfection, always.',
  ];
  const el = document.getElementById('today-encouragement');
  if (el) el.textContent = msgs[new Date().getDate() % msgs.length];

  // Quick wins
  const wins = document.getElementById('today-wins');
  if (wins) {
    const h = State.hydration;
    const moodDone = !!State.mood;
    wins.innerHTML = [
      h >= 4 ? '<span class="badge badge-accent">💧 Hydrated</span>' : '',
      moodDone ? '<span class="badge badge-accent">😌 Mood logged</span>' : '',
    ].join('');
  }
}

function resetTodayFocus() {
  const btn = document.getElementById('today-water');
  if (btn) { btn.classList.remove('done'); btn.innerHTML = '💧 Log Water'; }
  showToast('Fresh start ✨ You\'ve got this.');
}

// ===== LISTEN FOR PAGE CHANGE =====
window.addEventListener('pagechange', e => {
  if (e.detail === 'dashboard') renderDashboard();
});

document.addEventListener('DOMContentLoaded', () => {
  initQuickActions();
  initMoodModal();

  // Start onboarding if new user
  if (!Store.get('returning')) {
    setTimeout(() => openModal('modal-onboard'), 600);
  }

  // Name save button
  const nameBtn = document.getElementById('save-name-btn');
  if (nameBtn) nameBtn.addEventListener('click', saveName);
  document.getElementById('name-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') saveName();
  });

  // Landing CTA
  document.getElementById('hero-cta')?.addEventListener('click', () => {
    if (Store.get('returning')) navigate('dashboard');
    else openModal('modal-onboard');
  });
  document.getElementById('landing-start')?.addEventListener('click', () => {
    if (Store.get('returning')) navigate('dashboard');
    else openModal('modal-onboard');
  });
});