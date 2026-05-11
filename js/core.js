// ===== GlowNest — core.js =====
// Shared state, storage, utilities, and app bootstrap

// ===== STORAGE HELPERS =====
const Store = {
  get: (k, def = null) => {
    try { const v = localStorage.getItem('gn_' + k); return v ? JSON.parse(v) : def; }
    catch { return def; }
  },
  set: (k, v) => { try { localStorage.setItem('gn_' + k, JSON.stringify(v)); } catch {} },
  del: (k) => localStorage.removeItem('gn_' + k),
};

// ===== APP STATE =====
const State = {
  currentPage: 'landing',
  theme: Store.get('theme', 'default'),
  mood: Store.get('mood', null),
  badDay: Store.get('badDay', false),
  hydration: Store.get('hydration', 0),
  lastHydDate: Store.get('lastHydDate', ''),
  score: 0,
  xp: Store.get('xp', 0),
};

// ===== DATE HELPERS =====
const today = () => new Date().toISOString().slice(0, 10);
const weekKey = () => {
  const d = new Date(); const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().slice(0, 10);
};
const dayName = (i) => ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i];
const daysFull = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const monthName = (i) => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i];

// ===== TOAST =====
function showToast(msg, dur = 2800) {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, dur);
}
// ===== MICRO DOPAMINE HELPERS =====

// Confetti burst at coordinates
function confettiBurst(x, y) {
  const colors = ['var(--accent)','var(--accent2)','var(--success)','#f0c898','#c8b4f0'];
  for (let i = 0; i < 12; i++) {
    const dot = document.createElement('div');
    dot.className = 'confetti-dot';
    const size = 5 + Math.random() * 6;
    dot.style.cssText = `width:${size}px;height:${size}px;
      left:${x + (Math.random()-0.5)*60}px;top:${y}px;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      animation-duration:${0.8 + Math.random()*0.5}s;
      animation-delay:${Math.random()*0.15}s`;
    document.body.appendChild(dot);
    setTimeout(() => dot.remove(), 1400);
  }
}

// Float XP number
function floatXP(amt, x, y) {
  const el = document.createElement('div');
  el.className = 'xp-float';
  el.textContent = '+' + amt + ' XP';
  el.style.cssText = `left:${x}px;top:${y}px`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

// Wrap addXP to show float
const _addXP = addXP;
// Override in dashboard/habit context with coords
function addXPAt(amt, el) {
  _addXP(amt);
  if (el) {
    const r = el.getBoundingClientRect();
    floatXP(amt, r.left + r.width/2, r.top);
  } else { _addXP(0); } // already added
}

// ===== NAVIGATE =====
function navigate(page, pushHistory = true) {
  document.querySelectorAll('.page, .landing').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + page);
  if (target) {
    target.classList.add('active');
    State.currentPage = page;
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(n => {
      n.classList.toggle('active', n.dataset.page === page);
    });
    // Push to browser history so back button works within the app
    if (pushHistory) {
      history.pushState({ page }, '', '#' + page);
    }
    // Trigger page render
    window.dispatchEvent(new CustomEvent('pagechange', { detail: page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    closeMobileMenu();
  }
}

// ===== BACK BUTTON HANDLER =====
// Intercepts browser back/forward so it navigates within the app instead of leaving
window.addEventListener('popstate', (e) => {
  const page = e.state?.page || 'landing';
  navigate(page, false); // false = don't push again, we're already moving through history
});
// ===== MOBILE MENU =====
function toggleMobileMenu() {
  document.getElementById('mobile-sidebar')?.classList.toggle('open');
  document.getElementById('mobile-overlay')?.classList.toggle('show');
}

function closeMobileMenu() {
  document.getElementById('mobile-sidebar')?.classList.remove('open');
  document.getElementById('mobile-overlay')?.classList.remove('show');
}

// ===== MODAL =====
function openModal(id) {
  const m = document.getElementById(id);
  if (m) { m.classList.add('open'); document.body.style.overflow = 'hidden'; }
}
function closeModal(id) {
  const m = document.getElementById(id);
  if (m) { m.classList.remove('open'); document.body.style.overflow = ''; }
}

// ===== THEME =====
const THEMES = {
  default:   { name: 'Cozy Hostel',     emoji: '🏠', xp: 0,   colors: ['#c8956c','#f3ede3','#faf7f2'] },
  rainy:     { name: 'Rainy Evening',   emoji: '🌧️', xp: 200, colors: ['#7ba7c7','#252c3e','#1e2433'] },
  matcha:    { name: 'Matcha Morning',  emoji: '🍵', xp: 350, colors: ['#7a9e5f','#e8edde','#f2f5ee'] },
  study:     { name: 'Study Mode',      emoji: '📚', xp: 500, colors: ['#9b7fd4','#eeeaf8','#f8f6ff'] },
  latenight: { name: 'Late Night Healing', emoji: '🌙', xp: 700, colors: ['#e8a06a','#1a1612','#12100e'] },
};

function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t === 'default' ? '' : t);
  State.theme = t;
  Store.set('theme', t);
}

// ===== SCORE CALC =====
function calcScore() {
  const habits = Store.get('habits', []);
  const wk = weekKey();
  let pts = 0;
  habits.forEach(h => {
    const done = (h.completions || {})[wk] || 0;
    pts += Math.min(done / h.target, 1) * 20;
  });
  // Hydration
  if (State.lastHydDate === today()) pts += (State.hydration / 8) * 20;
  // Mood bonus
  if (['productive','happy','okay'].includes(State.mood)) pts += 10;
  State.score = Math.min(Math.round(pts), 100);
  return State.score;
}

// ===== QUOTES =====
const QUOTES = [
  { text: "You don't have to be perfect. You just have to keep showing up.", author: "GlowNest" },
  { text: "Small wins count. A glass of water is a win.", author: "GlowNest" },
  { text: "Rest is productive. Your body is not a machine.", author: "GlowNest" },
  { text: "Progress, not perfection. Always.", author: "GlowNest" },
  { text: "Today, do one kind thing for your body.", author: "GlowNest" },
  { text: "You're doing better than you think.", author: "GlowNest" },
  { text: "Consistency is the slow magic that changes everything.", author: "GlowNest" },
  { text: "Drink water. Touch grass. You'll feel 40% better.", author: "Hostel Wisdom" },
  { text: "A tired person deserves rest, not guilt.", author: "GlowNest" },
  { text: "One good habit today is enough.", author: "GlowNest" },
];
const getDailyQuote = () => QUOTES[new Date().getDate() % QUOTES.length];

// ===== GREETINGS =====
function getGreeting() {
  const h = new Date().getHours();
  if (h < 6)  return '🌙 Still up?';
  if (h < 12) return '☀️ Good morning';
  if (h < 17) return '🌤️ Good afternoon';
  if (h < 21) return '🌇 Good evening';
  return '🌙 Good night';
}

// ===== XP & UNLOCK SYSTEM =====
function addXP(amt) {
  State.xp += amt;
  Store.set('xp', State.xp);
}

function isUnlocked(themeKey) {
  return State.xp >= THEMES[themeKey].xp;
}

// ===== HYDRATION RESET DAILY =====
function checkHydReset() {
  if (State.lastHydDate !== today()) {
    State.hydration = 0;
    State.lastHydDate = today();
    Store.set('hydration', 0);
    Store.set('lastHydDate', today());
  }
}

// ===== INIT APP =====
function initApp() {
  checkHydReset();
  applyTheme(State.theme);

  // Nav click handlers
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.page));
  });
  // FAB toggle
window.toggleFab = function() {
  const actions = document.getElementById('fab-actions');
  const btn = document.getElementById('fab-btn');
  if (!actions) return;
  const open = actions.classList.toggle('open');
  if (btn) btn.textContent = open ? '✕' : '＋';
};
window.closeFab = function() {
  const actions = document.getElementById('fab-actions');
  const btn = document.getElementById('fab-btn');
  if (actions) actions.classList.remove('open');
  if (btn) btn.textContent = '＋';
};
  const validPages = ['landing','dashboard','habits','wellness','fitness','schedule','analytics','rewards'];
  // Modal close on backdrop click
  document.querySelectorAll('.modal-backdrop').forEach(m => {
    m.addEventListener('click', e => {
      if (e.target === m) closeModal(m.id);
    });
  });

  // Scroll reveal for landing
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }});
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  // Start on the correct page:
  // 1. If URL has a #hash (e.g. refresh or back button), honour it
  // 2. Else returning users → dashboard, new users → landing
  const hashPage = window.location.hash.replace('#', '');
  const returning = Store.get('returning', false);
  

  if (hashPage && validPages.includes(hashPage)) {
    navigate(hashPage, false); // already in history, don't push again
  } else if (returning) {
    navigate('dashboard');
  } else {
    navigate('landing');
  }
}

document.addEventListener('DOMContentLoaded', initApp);