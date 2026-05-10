// ===== GlowNest — features.js =====
// Analytics, Rewards, Wellness tips, Theme picker

// ===== ANALYTICS =====
const WEEK_DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

function renderAnalytics() {
  renderMoodChart();
  renderHydrationChart();
  renderHabitHeatmap();
  renderConsistencyScore();
}

function renderMoodChart() {
  const el = document.getElementById('mood-chart');
  if (!el) return;
  const history = Store.get('moodHistory', {});
  const moodOrder = ['overwhelmed','tired','stressed','okay','productive','happy'];
  const moodEmoji = { tired:'😴', stressed:'😤', overwhelmed:'😵', okay:'😌', productive:'💪', happy:'🌟' };
  const moodColor = { tired:'#b09080', stressed:'#c8956c', overwhelmed:'#9b7eb8', okay:'#7dab8a', productive:'#7ba7c7', happy:'#e8c4a0' };

  // Get last 7 days
  const days = Array.from({length:7}, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6-i));
    return d.toISOString().slice(0,10);
  });

  el.innerHTML = `
    <div style="display:flex;gap:6px;align-items:flex-end;height:100px;padding:0 4px">
      ${days.map(d => {
        const mood = history[d];
        const level = mood ? (moodOrder.indexOf(mood) + 1) : 0;
        const h = level ? Math.round((level/6)*80) + 20 : 8;
        const lbl = d.slice(5).replace('-','/');
        return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
          <div style="width:100%;background:${mood ? moodColor[mood] : 'var(--bg2)'};
            border-radius:6px 6px 0 0;height:${h}px;transition:height .5s;
            display:flex;align-items:flex-start;justify-content:center;padding-top:4px;
            font-size:${mood ? '.9rem' : '.6rem'}">
            ${mood ? moodEmoji[mood] : ''}
          </div>
          <span style="font-size:.6rem;color:var(--text3)">${lbl}</span>
        </div>`;
      }).join('')}
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:12px">
      ${Object.entries(moodEmoji).map(([k,v]) => `
        <span class="badge" style="background:${moodColor[k]}22;color:var(--text2)">
          ${v} ${k}
        </span>`).join('')}
    </div>`;
}

function renderHydrationChart() {
  const el = document.getElementById('hydration-chart');
  if (!el) return;
  const trends = Store.get('hydTrends', {});
  const days = Array.from({length:7}, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6-i));
    return d.toISOString().slice(0,10);
  });

  el.innerHTML = `
    <div style="display:flex;gap:6px;align-items:flex-end;height:80px">
      ${days.map(d => {
        const val = trends[d] || 0;
        const h = Math.round((val/8)*70);
        const lbl = d.slice(8);
        return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
          <div style="width:100%;background:linear-gradient(180deg,var(--accent2),var(--accent));
            border-radius:4px 4px 0 0;height:${Math.max(h,4)}px;opacity:${val ? 1 : 0.2};transition:height .5s"></div>
          <span style="font-size:.6rem;color:var(--text3)">${lbl}</span>
        </div>`;
      }).join('')}
    </div>
    <div class="flex items-center justify-between mt-8">
      <span class="text-xs text-muted">Daily glasses (goal: 8)</span>
      <span class="text-xs text-muted">💧 Today: ${Store.get('hydration',0)}/8</span>
    </div>`;
}

function renderHabitHeatmap() {
  const el = document.getElementById('habit-heatmap');
  if (!el) return;
  const habits = Store.get('habits', []);
  if (habits.length === 0) {
    el.innerHTML = '<p class="text-muted text-sm text-center" style="padding:20px">Add habits to see your heatmap</p>';
    return;
  }

  // Build last 4 weeks × 7 days grid per habit
  const weeks = 4;
  el.innerHTML = habits.slice(0,4).map(h => {
    const cells = Array.from({length: weeks * 7}, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (weeks*7 - i - 1));
      const wk = (() => {
        const dd = new Date(d); const day = dd.getDay();
        const diff = dd.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(dd.setDate(diff)).toISOString().slice(0,10);
      })();
      const done = (h.completions || {})[wk] || 0;
      const level = done === 0 ? '' : done >= h.target ? 'l3' : done >= h.target/2 ? 'l2' : 'l1';
      return `<div class="heatmap-cell ${level}" title="${d.toISOString().slice(0,10)}"></div>`;
    }).join('');
    return `<div class="mb-12">
      <div class="text-sm mb-8" style="font-weight:500">${h.emoji} ${h.name}</div>
      <div style="display:grid;grid-template-columns:repeat(${weeks*7},1fr);gap:3px">${cells}</div>
    </div>`;
  }).join('');
}

function renderConsistencyScore() {
  const el = document.getElementById('consistency-score');
  if (!el) return;
  const habits = Store.get('habits', []);
  const wk = weekKey();
  if (habits.length === 0) { el.innerHTML = '—'; return; }
  const avg = habits.reduce((s,h) => s + Math.min((h.completions[wk]||0)/h.target, 1), 0) / habits.length;
  const pct = Math.round(avg * 100);
  const msg = pct >= 80 ? '🌟 Glowing!' : pct >= 50 ? '🌿 Growing!' : pct > 0 ? '🌱 Sprouting!' : '💤 Rest up';
  el.innerHTML = `<div class="text-center">
    <div style="font-family:var(--font-display);font-size:3rem;font-weight:600;color:var(--accent)">${pct}%</div>
    <div class="text-muted text-sm">${msg}</div>
    <div class="progress-wrap mt-12" style="max-width:160px;margin:12px auto 0">
      <div class="progress-bar" style="width:${pct}%"></div>
    </div>
  </div>`;
}

// ===== REWARDS =====
const REWARDS = [
  { id:'plant1',  emoji:'🌱', name:'Tiny Sprout',      xp:0,    desc:'Always yours' },
  { id:'plant2',  emoji:'🪴', name:'Growing Plant',     xp:50,   desc:'50 XP' },
  { id:'plant3',  emoji:'🌿', name:'Lush Vine',         xp:150,  desc:'150 XP' },
  { id:'room1',   emoji:'🛏️', name:'Cozy Bed',          xp:100,  desc:'100 XP' },
  { id:'room2',   emoji:'🪟', name:'Fairy Lights',      xp:300,  desc:'300 XP' },
  { id:'room3',   emoji:'🏡', name:'Dream Hostel',      xp:600,  desc:'600 XP' },
  { id:'pet1',    emoji:'🐱', name:'Pixel Cat',         xp:200,  desc:'200 XP' },
  { id:'pet2',    emoji:'🐶', name:'Pixel Pup',         xp:400,  desc:'400 XP' },
  { id:'star1',   emoji:'⭐', name:'Glow Star',         xp:80,   desc:'80 XP' },
  { id:'sun1',    emoji:'🌸', name:'Blossom',           xp:250,  desc:'250 XP' },
  { id:'moon1',   emoji:'🌙', name:'Night Calm',        xp:450,  desc:'450 XP' },
  { id:'crystal', emoji:'💎', name:'Crystal Clear',     xp:800,  desc:'800 XP' },
];

function renderRewards() {
  const el = document.getElementById('rewards-grid');
  const xpEl = document.getElementById('xp-display');
  if (!el) return;
  const xp = State.xp;
  if (xpEl) xpEl.textContent = xp + ' XP';

  el.innerHTML = REWARDS.map(r => {
    const unlocked = xp >= r.xp;
    return `<div class="reward-item ${unlocked ? 'unlocked' : 'locked'}">
      <div class="reward-emoji">${r.emoji}</div>
      <div style="font-weight:600;font-size:.78rem">${r.name}</div>
      <div style="font-size:.65rem;color:var(--text3)">${unlocked ? '✨ Unlocked' : r.desc}</div>
    </div>`;
  }).join('');

  // Themes
  renderThemePicker();
}

function renderThemePicker() {
  const el = document.getElementById('theme-grid');
  if (!el) return;
  el.innerHTML = Object.entries(THEMES).map(([key, t]) => {
    const unlocked = State.xp >= t.xp;
    const active = State.theme === key;
    return `<div class="theme-swatch ${active ? 'active' : ''} ${!unlocked ? 'locked-theme' : ''}"
      onclick="${unlocked ? `applyTheme('${key}');renderRewards();showToast('Theme: ${t.name} ✨')` : `showToast('Need ${t.xp} XP to unlock 🔒')`}">
      <div class="swatch-circle" style="background:linear-gradient(135deg,${t.colors[0]},${t.colors[1]})">
        ${!unlocked ? '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:.9rem">🔒</div>' : ''}
      </div>
      <span class="swatch-name">${t.emoji} ${t.name}</span>
    </div>`;
  }).join('');
}

// ===== WELLNESS TIPS =====
const WELLNESS_DATA = {
  breakfast: [
    { icon:'🥣', title:'Oats in 5 min', desc:'Instant oats + hot water + banana. Fills you up, costs ₹15.' },
    { icon:'🍞', title:'Peanut Butter Toast', desc:'Brown bread + PB + banana slices. Easy protein breakfast.' },
    { icon:'🥚', title:'Boiled Eggs', desc:'Boil 4 on Sunday, eat all week. Ultimate hostel hack.' },
    { icon:'🥛', title:'Banana Milk Shake', desc:'2 bananas + milk + pinch of sugar. 3 minutes.' },
  ],
  snacks: [
    { icon:'🥜', title:'Mixed Nuts', desc:'A small handful. Keeps hunger away for hours.' },
    { icon:'🍌', title:'Banana', desc:'Nature\'s energy bar. Budget-friendly, filling.' },
    { icon:'🫘', title:'Roasted Chana', desc:'High protein, low cost. Perfect hostel snack.' },
    { icon:'🍎', title:'Fruit from Mess', desc:'Always grab one. Future-you will thank you.' },
  ],
  alternatives: [
    { icon:'🥤', title:'Nimbu Pani > Soda', desc:'Lemon + water + salt + sugar. Refreshing and actually hydrating.' },
    { icon:'🍲', title:'Dal > Junk', desc:'Hostel dal has protein! Eat it with pride.' },
    { icon:'☕', title:'Green Tea > Chai', desc:'One cup swap a day. Antioxidants + less sugar.' },
    { icon:'🫙', title:'Curd > Sauce', desc:'Add curd instead of ketchup. Probiotic glow-up.' },
  ],
  prep: [
    { icon:'📦', title:'Sunday Meal Prep', desc:'Cook once, eat 3 days. Dal + rice = hostel gold.' },
    { icon:'🧃', title:'Water Bottle Always', desc:'Carry your bottle. Saves money, saves energy.' },
    { icon:'🛒', title:'Weekly Grocery', desc:'Fruits, oats, eggs. ₹200–300 budget for healthy staples.' },
    { icon:'🌙', title:'Prep the Night Before', desc:'Set out tomorrow\'s basics before bed. Future-you wins.' },
  ],
};

function renderWellness() {
  ['breakfast','snacks','alternatives','prep'].forEach(cat => {
    const el = document.getElementById('wellness-' + cat);
    if (!el) return;
    el.innerHTML = WELLNESS_DATA[cat].map(t => `
      <div class="wellness-tip">
        <div class="tip-icon">${t.icon}</div>
        <div class="tip-body">
          <h5>${t.title}</h5>
          <p>${t.desc}</p>
        </div>
      </div>`).join('');
  });
}

// ===== INIT =====
window.addEventListener('pagechange', e => {
  if (e.detail === 'analytics') renderAnalytics();
  if (e.detail === 'rewards') renderRewards();
  if (e.detail === 'wellness') renderWellness();
});

document.addEventListener('DOMContentLoaded', () => {
  // Theme switcher in rewards page already handled via renderThemePicker
});