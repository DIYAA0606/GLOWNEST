// ===== GlowNest — features.js =====
// Analytics, Rewards, Wellness tips, Theme picker

// ===== ANALYTICS =====
const WEEK_DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

function renderAnalytics() {
  renderMoodChart();
  renderHydrationChart();
  renderHabitHeatmap();
  renderConsistencyScore();
  // ADD at the end of renderAnalytics():
renderInsights();
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
function renderInsights() {
  const el = document.getElementById('analytics-insights');
  if (!el) return;
  const insights = [];
  const hydTrends = Store.get('hydTrends', {});
  const moodHistory = Store.get('moodHistory', {});
  const habits = Store.get('habits', []);

  // Insight 1: hydration vs mood
  const days = Object.keys(hydTrends).slice(-7);
  const goodHydDays = days.filter(d => hydTrends[d] >= 6);
  const goodMoodOnHyd = goodHydDays.filter(d => ['okay','productive','happy'].includes(moodHistory[d]));
  if (goodHydDays.length >= 2 && goodMoodOnHyd.length > goodHydDays.length / 2)
    insights.push({ icon:'💧', text:'You tend to feel <strong>better on days you drink more water</strong>. Your data shows it.' });

  // Insight 2: consistency mid-week
  const moodKeys = Object.keys(moodHistory).slice(-14);
  const midWeekGood = moodKeys.filter(d => {
    const day = new Date(d).getDay();
    return (day >= 2 && day <= 4) && ['okay','productive','happy'].includes(moodHistory[d]);
  });
  if (midWeekGood.length >= 3)
    insights.push({ icon:'📅', text:'<strong>Mid-week is your peak</strong>. Tue–Thu you feel most consistent.' });

  // Insight 3: habit skip on stress
  const stressDays = Object.keys(moodHistory).filter(d => moodHistory[d] === 'stressed');
  if (stressDays.length >= 2)
    insights.push({ icon:'😤', text:'On <strong>stressed days</strong>, you skip more habits. That\'s normal — not a failure.' });

  // Insight 4: hydration streak
  const hydStreak = days.filter(d => hydTrends[d] >= 4).length;
  if (hydStreak >= 4)
    insights.push({ icon:'🌟', text:`<strong>${hydStreak} of your last 7 days</strong> you hit decent hydration. That's real progress.` });

  // Insight 5: generic if not enough data
  if (insights.length === 0)
    insights.push({ icon:'🌱', text:'Keep logging for a few days and <strong>GlowNest will share personal insights</strong> based on your patterns.' });

  el.innerHTML = insights.map(i =>
    `<div class="insight-card"><div class="i-icon">${i.icon}</div><div class="i-text">${i.text}</div></div>`
  ).join('');
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
    { icon:'🥣', title:'5-Min Oats', desc:'Hot water + instant oats + banana. Filling, ₹15.', time:'5 min', budget:'₹15', effort:'😴 Easy', type:['veg'], equip:'kettle', video:'' },
    { icon:'🍞', title:'PB Banana Toast', desc:'Brown bread + peanut butter + banana. Real protein.', time:'3 min', budget:'₹20', effort:'😴 Easy', type:['veg'], equip:'no-cook', video:'' },
    { icon:'🥚', title:'Boiled Eggs Batch', desc:'Boil 5 on Sunday. Grab one daily all week.', time:'12 min', budget:'₹25', effort:'🟡 Medium', type:['nonveg'], equip:'induction', video:'https://youtube.com/results?search_query=perfect+boiled+eggs' },
    { icon:'🫙', title:'Curd + Fruits', desc:'Mess curd + banana/seasonal fruit. Probiotic glow.', time:'2 min', budget:'₹10', effort:'😴 Easy', type:['veg'], equip:'no-cook', video:'' },
    { icon:'☕', title:'Kettle Oats', desc:'Just oats + hot kettle water + salt/sugar. Zero effort.', time:'4 min', budget:'₹8', effort:'😴 Easy', type:['veg'], equip:'kettle', tags:['kettle'], video:'https://www.youtube.com/watch?v=59Oq80nSjYk' },
    { icon:'🍳', title:'Egg Bhurji', desc:'Scrambled eggs + onion + chilli. Protein packed.', time:'7 min', budget:'₹20', effort:'🟡 Medium', type:['nonveg'], equip:'induction', video:'' },
    { icon:'🧀', title:'Paneer Toast', desc:'Crumble paneer + spices on bread. Toast on tawa.', time:'8 min', budget:'₹25', effort:'🟡 Medium', type:['veg'], equip:'induction', video:'' },
  ],
  snacks: [
    { icon:'🫘', title:'Roasted Chana', desc:'High protein. Stops hunger for hours.', time:'0 min', budget:'₹10', effort:'😴 Easy', type:['veg'], equip:'no-cook', video:'' },
    { icon:'🥜', title:'Peanuts', desc:'Carry 50g in a pouch. Best emergency snack.', time:'0 min', budget:'₹8', effort:'😴 Easy', type:['veg'], equip:'no-cook', video:'' },
    { icon:'🍌', title:'Banana', desc:'Nature\'s energy bar. Available everywhere.', time:'0 min', budget:'₹5', effort:'😴 Easy', type:['veg'], equip:'no-cook', video:'' },
    { icon:'🌾', title:'Makhana', desc:'Roasted fox nuts. Light, filling, great with chai.', time:'0 min', budget:'₹15', effort:'😴 Easy', type:['veg'], equip:'no-cook', video:'' },
    { icon:'🥤', title:'Nimbu Pani', desc:'Lemon + water + salt + sugar. Better than soda.', time:'2 min', budget:'₹5', effort:'😴 Easy', type:['veg'], equip:'no-cook', video:'' },
    { icon:'🥚', title:'Hard Boiled Egg', desc:'Pre-boiled egg = instant protein snack anywhere.', time:'0 min', budget:'₹8', effort:'😴 Easy', type:['nonveg'], equip:'no-cook', video:'' },
  ],
  alternatives: [
    { icon:'🍲', title:'Dal Power', desc:'Hostel dal is actually good protein. Stop avoiding it.', time:'0 min', budget:'₹0', effort:'😴 Easy', type:['veg'], equip:'no-cook', video:'' },
    { icon:'☕', title:'Green Tea Swap', desc:'Replace one chai a day. Less sugar, more antioxidants.', time:'3 min', budget:'₹3', effort:'😴 Easy', type:['veg'], equip:'kettle', tags:['kettle'], yt:'https://www.youtube.com/watch?v=lpvKGPfubN4' },
    { icon:'🫙', title:'Curd > Ketchup', desc:'Use curd as dip instead of sauce. Probiotic win.', time:'0 min', budget:'₹5', effort:'😴 Easy', type:['veg'], equip:'no-cook', video:'' },
    { icon:'🌶️', title:'Spicy Dal Fry Hack', desc:'Add jeera + chilli to mess dal. Tastes homemade.', time:'1 min', budget:'₹2', effort:'😴 Easy', type:['veg'], equip:'no-cook', tags:['spicy'], video:'' },
    { icon:'🥗', title:'Salad Bar First', desc:'Fill half plate with salad before main meal.', time:'2 min', budget:'₹0', effort:'😴 Easy', type:['veg'], equip:'no-cook', video:'' },
    { icon:'🐟', title:'Tuna on Bread', desc:'Canned tuna + bread + chilli sauce. 2 min protein hit.', time:'2 min', budget:'₹30', effort:'😴 Easy', type:['nonveg'], equip:'no-cook', video:'' },
  ],
  prep: [
    { icon:'📦', title:'Sunday Dal-Rice', desc:'Cook once, eat 3 days. The hostel gold standard.', time:'30 min', budget:'₹60', effort:'🟡 Medium', type:['veg'], equip:'induction', tags:['batch'], video:'' },
    { icon:'🧃', title:'Water Bottle Rule', desc:'Fill before every class. No excuses.', time:'1 min', budget:'₹0', effort:'😴 Easy', type:['veg','nonveg'], equip:'no-cook', video:'' },
    { icon:'🛒', title:'₹200 Weekly Kit', desc:'Oats + peanuts + fruits = healthy week sorted.', time:'20 min', budget:'₹200', effort:'🟡 Medium', type:['veg'], equip:'no-cook', tags:['batch'], video:'' },
    { icon:'🫙', title:'Kettle Maggi Soup', desc:'Maggi + veggies in kettle. Exam week survival.', time:'7 min', budget:'₹25', effort:'😴 Easy', type:['veg'], equip:'kettle', tags:['kettle','exam'], video:'' },
    { icon:'🥚', title:'Egg Rice Batch', desc:'Leftover rice + 2 eggs + soy sauce. Fried rice hack.', time:'10 min', budget:'₹20', effort:'🟡 Medium', type:['nonveg'], equip:'induction', tags:['batch'], video:'' },
  ],
  yummy: [
    { icon:'🍝', title:'Garlic Butter Pasta', desc:'Boil pasta, toss with butter + garlic + chilli flakes. Restaurant feel.', time:'15 min', budget:'₹40', effort:'🟡 Medium', type:['veg'], equip:'induction', tags:['comfort'], video:'' },
    { icon:'🍜', title:'Chilli Garlic Noodles', desc:'Instant noodles upgraded with garlic + soy + chilli oil.', time:'10 min', budget:'₹30', effort:'😴 Easy', type:['veg'], equip:'induction', tags:['spicy','comfort'], video:'' },
    { icon:'🧀', title:'Cheesy Maggi Hack', desc:'Maggi + processed cheese + butter + pepper. Comfort overload.', time:'8 min', budget:'₹35', effort:'😴 Easy', type:['veg'], equip:'kettle', tags:['comfort','kettle'], video:'' },
    { icon:'🍛', title:'Spicy Potato Bowl', desc:'Boiled potato + peri peri powder + curd. 10 min bowl.', time:'10 min', budget:'₹20', effort:'😴 Easy', type:['veg'], equip:'induction', tags:['spicy','comfort'], video:'' },
    { icon:'🥪', title:'Loaded Sandwich', desc:'Bread + cheese + onion + tomato + chutney. Toasted or cold.', time:'5 min', budget:'₹25', effort:'😴 Easy', type:['veg'], equip:'no-cook', tags:['comfort'], video:'' },
    { icon:'🍗', title:'Korean Ramen Upgrade', desc:'Ramen + egg + soy sauce + butter. Feels like delivery.', time:'10 min', budget:'₹45', effort:'😴 Easy', type:['nonveg'], equip:'induction', tags:['comfort','spicy'], video:'' },
    { icon:'🧄', title:'Garlic Bread (Tawa)', desc:'Bread + butter + garlic paste. Toast on tawa. Life-changing.', time:'5 min', budget:'₹15', effort:'😴 Easy', type:['veg'], equip:'induction', tags:['comfort'], video:'' },
    { icon:'🍚', title:'Peri Peri Fried Rice', desc:'Leftover rice + veggies + peri peri seasoning. Zero waste.', time:'12 min', budget:'₹25', effort:'🟡 Medium', type:['veg'], equip:'induction', tags:['spicy','comfort'], video:'' },
    { icon:'🥚', title:'Egg Fried Rice', desc:'Rice + 2 eggs + soy sauce + spring onion. Hostel classic.', time:'12 min', budget:'₹20', effort:'🟡 Medium', type:['nonveg'], equip:'induction', tags:['comfort','exam'], video:'' },
    { icon:'🍕', title:'Bread Pizza', desc:'Bread + ketchup + cheese + veggies. Microwave 90 sec.', time:'5 min', budget:'₹30', effort:'😴 Easy', type:['veg'], equip:'microwave', tags:['comfort','exam'], video:'' },
  ],
};

// ===== SHARED CARD RENDERER (reusable for all categories) =====
function renderWellnessCard(t, id, isSaved) {
  const videoUrl = t.video || t.yt || '';
  const videoBtn = videoUrl ? `<button class="wcard-btn" onclick="window.open('${videoUrl}','_blank')">▶ Watch</button>` : '';
  const saveBtn  = `<button class="wcard-btn ${isSaved ? 'wcard-saved' : ''}" id="save_${id}" onclick="toggleSaveWellness('${id}')">${isSaved ? '🔖 Saved' : '🔖 Save'}</button>`;
  const tags = (t.tags || []);
  const equipTag = t.equip && t.equip !== 'no-cook' ? `<span class="wcard-tag purple">${{kettle:'🫖 Kettle',induction:'🔥 Induction',microwave:'📡 Microwave'}[t.equip]||''}</span>` : '';
  const tagBadges = tags.map(tag => ({
    spicy:   '<span class="wcard-tag" style="background:#ffe0e0;color:#b03a3a">🌶️ Spicy</span>',
    batch:   '<span class="wcard-tag yellow">📦 Batch</span>',
    exam:    '<span class="wcard-tag purple">📚 Exam</span>',
    comfort: '<span class="wcard-tag" style="background:#fff0e0;color:#a06020">🫂 Comfort</span>',
  }[tag] || '')).join('');

  return `<div class="wcard swipe-card">
    <div class="wcard-header">
      <div class="wcard-icon">${t.icon}</div>
      <div>
        <div style="font-weight:600;font-size:.9rem;margin-bottom:4px">${t.title}</div>
        <div class="wcard-meta">
          <span class="wcard-tag">⏱ ${t.time}</span>
          <span class="wcard-tag green">₹ ${t.budget}</span>
          <span class="wcard-tag">${t.effort}</span>
          ${equipTag}${tagBadges}
        </div>
      </div>
    </div>
    <p style="font-size:.8rem;color:var(--text2);line-height:1.5">${t.desc}</p>
    <div class="wcard-actions">${videoBtn}${saveBtn}</div>
  </div>`;
}

function renderWellness() {
  const saved  = Store.get('savedWellness', []);
  const diet   = Store.get('dietPref', 'veg'); // 'veg' | 'nonveg'
  const cats   = ['breakfast','snacks','alternatives','prep','yummy'];

  cats.forEach(cat => {
    const el = document.getElementById('wellness-' + cat);
    if (!el) return;
    const filtered = WELLNESS_DATA[cat].filter(t =>
      !t.type || t.type.includes(diet) || t.type.includes('veg') && diet === 'veg' || t.type.length === 2
    );
    el.innerHTML = filtered.map((t, i) => renderWellnessCard(t, cat + '_' + i, saved.includes(cat + '_' + i))).join('');
  });
}

function toggleSaveWellness(id) {
  let saved = Store.get('savedWellness', []);
  const btn = document.getElementById('save_' + id);
  if (saved.includes(id)) {
    saved = saved.filter(s => s !== id);
    if (btn) { btn.textContent = '🔖 Save'; btn.classList.remove('wcard-saved'); }
    showToast('Removed from saved 🌿');
  } else {
    saved.push(id);
    if (btn) { btn.textContent = '🔖 Saved'; btn.classList.add('wcard-saved'); }
    showToast('Saved for later! 🔖');
  }
  Store.set('savedWellness', saved);
}
// ===== DAILY ROTATING TIPS =====
const DAILY_TIPS = [
  '🍌 Eat a banana before your next class. Brain fuel.',
  '💧 You\'re probably mildly dehydrated right now. Drink up.',
  '😴 A 20-min nap beats 2 more hours of tired studying.',
  '🧘 Roll your shoulders back 3 times. Go on, do it now.',
  '🥗 Grab the salad first at mess. You\'ll thank yourself.',
  '📵 Put your phone face-down for the next 25 minutes.',
  '🚶 Walk to the water cooler and back. That counts.',
  '🌙 Set a sleep alarm for tonight. Not a wake alarm — a sleep alarm.',
  '🫘 Grab some roasted chana instead of chips today.',
  '☀️ Step outside for 5 minutes. Vitamin D is real.',
  '📞 Call home this week if you haven\'t. It helps more than you think.',
  '🧴 Applied sunscreen today? Takes 10 seconds.',
];

// Returns a tip that rotates daily (not randomly)
function getDailyTip() {
  return DAILY_TIPS[new Date().getDate() % DAILY_TIPS.length];
}

// Render into any element by id
function renderDailyTip(elId) {
  const el = document.getElementById(elId);
  if (el) el.textContent = getDailyTip();
}

// Diet toggle — call from UI
function setDietPref(pref) {
  Store.set('dietPref', pref);
  document.querySelectorAll('.diet-toggle-btn').forEach(b =>
    b.classList.toggle('btn-primary', b.dataset.diet === pref)
  );
  renderWellness();
}

function toggleSaveWellness(id) {
  let saved = Store.get('savedWellness', []);
  const btn = document.getElementById('save_' + id);
  if (saved.includes(id)) {
    saved = saved.filter(s => s !== id);
    if (btn) { btn.textContent = '🔖 Save'; btn.classList.remove('wcard-saved'); }
    showToast('Removed from saved 🌿');
  } else {
    saved.push(id);
    if (btn) { btn.textContent = '🔖 Saved'; btn.classList.add('wcard-saved'); }
    showToast('Saved for later! 🔖');
  }
  Store.set('savedWellness', saved);
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
// ===== EMERGENCY MODES =====
const EMERGENCIES = [
  { id:'exam',   icon:'📚', title:'Exam Stress',
    steps:[
      {i:'💧',t:'Drink a full glass of water right now.'},
      {i:'📝',t:'Write down only 3 things to study today. Just 3.'},
      {i:'🧘',t:'Box breathing: in 4s → hold 4s → out 4s. Do it twice.'},
      {i:'🍌',t:'Eat something. Even a banana. Brain needs fuel.'},
      {i:'⏱️',t:'25-min focus, 5-min walk. Pomodoro is real.'},
    ]},
  { id:'homesick', icon:'🏠', title:'Homesick',
    steps:[
      {i:'📞',t:'Call home right now. Even 5 minutes helps.'},
      {i:'🎵',t:'Play a song that feels like home.'},
      {i:'🍲',t:'Order or make something familiar. Dal counts.'},
      {i:'🛏️',t:'It\'s okay to just rest today. You don\'t have to be okay.'},
    ]},
  { id:'nosleep', icon:'😵', title:'No Sleep',
    steps:[
      {i:'☕',t:'One cup of chai or coffee only. Then stop.'},
      {i:'💧',t:'Hydrate before you caffeinate.'},
      {i:'😴',t:'Even a 20-min nap is better than nothing.'},
      {i:'🌙',t:'Tonight: phone off by 11pm. Sleep debt is real.'},
    ]},
  { id:'junkweek', icon:'🍔', title:'Ate Junk All Week',
    steps:[
      {i:'💧',t:'Start now: 2 glasses of water. No judgment.'},
      {i:'🍌',t:'Grab a fruit next time you\'re hungry, not chips.'},
      {i:'🥗',t:'One good meal today is enough to start a reset.'},
      {i:'🙏',t:'One week of junk doesn\'t erase months of effort. Truly.'},
    ]},
  { id:'period', icon:'🌸', title:'Period Fatigue',
    steps:[
      {i:'🛏️',t:'Rest is not lazy. Rest is medicine today.'},
      {i:'💧',t:'Warm water or herbal tea. Reduces cramps.'},
      {i:'🍫',t:'Dark chocolate is genuinely okay. Magnesium.'},
      {i:'🧘',t:'Child\'s pose stretch for 3 minutes.'},
      {i:'💊',t:'Take pain relief if you have it. Don\'t suffer unnecessarily.'},
    ]},
  { id:'burnout', icon:'🔥', title:'Burnout Day',
    steps:[
      {i:'✋',t:'Stop. You are allowed to do nothing today.'},
      {i:'💧',t:'Drink water. Wash your face. That\'s it.'},
      {i:'🎵',t:'Put on something calming. Lie down.'},
      {i:'📵',t:'Mute notifications. The world will wait.'},
      {i:'🌱',t:'Tomorrow will be a little easier. I promise.'},
    ]},
];

function renderEmergencyGrid() {
  const el = document.getElementById('emergency-grid');
  if (!el) return;
  el.innerHTML = EMERGENCIES.map(e =>
    `<div class="emergency-card" onclick="showEmergencyPanel('${e.id}')">
      <div class="e-icon">${e.icon}</div>
      <div class="e-title">${e.title}</div>
    </div>`).join('');
}

function showEmergencyPanel(id) {
  const em = EMERGENCIES.find(e => e.id === id);
  const panel = document.getElementById('emergency-panel');
  if (!em || !panel) return;
  panel.classList.remove('hidden');
  panel.innerHTML = `
    <div class="emergency-panel">
      <div class="flex items-center justify-between mb-12">
        <div style="font-size:1.1rem;font-weight:600">${em.icon} ${em.title}</div>
        <button class="btn-icon" onclick="document.getElementById('emergency-panel').classList.add('hidden')" style="width:28px;height:28px;font-size:.8rem">✕</button>
      </div>
      <p class="text-sm text-muted mb-12 italic">You don't have to fix everything. Just do the next small thing.</p>
      ${em.steps.map(s => `<div class="emergency-step"><div class="e-step-icon">${s.i}</div><div>${s.t}</div></div>`).join('')}
    </div>`;
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

window.addEventListener('pagechange', e => {
  if (e.detail === 'dashboard') renderEmergencyGrid();
});
// ===== FITNESS DATA =====
const FITNESS_DATA = [
  { id:'f1',  icon:'🧘', title:'Morning Posture Reset', desc:'Shoulder rolls, neck tilts, spine twist. Undoes 8 hours of slouching.', duration:'5 min', energy:'low', tags:['stretch','exam'], equip:'no-equip', video:'' },
  { id:'f2',  icon:'🚶', title:'10-Min Room Walk', desc:'Walk in place or corridor loops. Puts your body in motion without effort.', duration:'10 min', energy:'low', tags:['low','exam'], equip:'no-equip', video:'' },
  { id:'f3',  icon:'💪', title:'Beginner Room Workout', desc:'10 squats + 10 push-ups + 20 jumping jacks. Repeat 2x. Done.', duration:'12 min', energy:'medium', tags:['medium'], equip:'no-equip', video:'' },
  { id:'f4',  icon:'🧘', title:'Desk Stretch Routine', desc:'Seated forward fold, wrist rolls, chest opener. Do between study sessions.', duration:'5 min', energy:'low', tags:['stretch','exam'], equip:'no-equip', video:'' },
  { id:'f5',  icon:'🏃', title:'Staircase Cardio', desc:'Go up/down stairs 5 times. Simple, effective, zero equipment.', duration:'8 min', energy:'medium', tags:['medium'], equip:'no-equip', video:'' },
  { id:'f6',  icon:'😴', title:'Lazy Day Stretch', desc:'Lying down: knee hugs, leg lifts, spinal twist. Do it from your bed.', duration:'5 min', energy:'low', tags:['low','stretch'], equip:'no-equip', video:'' },
  { id:'f7',  icon:'🌸', title:'Period-Friendly Movement', desc:'Child\'s pose, butterfly stretch, gentle walking. Reduces cramps naturally.', duration:'8 min', energy:'low', tags:['low','stretch'], equip:'no-equip', video:'' },
  { id:'f8',  icon:'📚', title:'Exam Week Micro-Movement', desc:'Every 45 min: stand up, 10 jumping jacks, sit back. Keeps brain alert.', duration:'2 min', energy:'low', tags:['low','exam'], equip:'no-equip', video:'' },
  { id:'f9',  icon:'💪', title:'No-Motivation Workout', desc:'5 push-ups. Just 5. If you stop there, that\'s still a win.', duration:'3 min', energy:'low', tags:['low'], equip:'no-equip', video:'' },
  { id:'f10', icon:'🧘', title:'Evening Wind-Down Stretch', desc:'Forward fold, seated twist, child\'s pose. Sleep better tonight.', duration:'8 min', energy:'low', tags:['stretch'], equip:'no-equip', video:'' },
  { id:'f11', icon:'🏃', title:'20-Min Room Routine', desc:'Warm up → squats → lunges → push-ups → plank → cool down.', duration:'20 min', energy:'medium', tags:['medium'], equip:'no-equip', video:'' },
  { id:'f12', icon:'🚶', title:'Post-Meal Walk', desc:'10-min walk after lunch or dinner. Best thing for digestion + energy.', duration:'10 min', energy:'low', tags:['low','exam'], equip:'no-equip', video:'' },
];

let currentFitnessFilter = 'all';

function renderFitness() {
  const saved = Store.get('savedFitness', []);
  const list = document.getElementById('fitness-list');
  if (!list) return;
  const filtered = currentFitnessFilter === 'all'
    ? FITNESS_DATA
    : FITNESS_DATA.filter(f => f.tags.includes(currentFitnessFilter));

  list.innerHTML = filtered.map(f => {
    const videoUrl = f.video || '';
    const videoBtn = videoUrl ? `<button class="wcard-btn" onclick="window.open('${videoUrl}','_blank')">▶ Watch</button>` : '';
    const isSaved = saved.includes(f.id);
    const saveBtn = `<button class="wcard-btn ${isSaved ? 'wcard-saved':''}" id="fsave_${f.id}" onclick="toggleSaveFitness('${f.id}')">${isSaved ? '🔖 Saved':'🔖 Save'}</button>`;
    const energyColor = { low:'#d4edda', medium:'#fff3cd' }[f.energy] || 'var(--bg2)';
    const energyText  = { low:'😴 Low energy', medium:'🟡 Medium' }[f.energy] || f.energy;
    return `<div class="habit-item" style="align-items:flex-start;gap:14px">
      <div style="font-size:1.8rem;flex-shrink:0;padding-top:2px">${f.icon}</div>
      <div style="flex:1;min-width:0">
        <div style="font-weight:600;font-size:.95rem;margin-bottom:4px">${f.title}</div>
        <div class="wcard-meta mb-8">
          <span class="wcard-tag">⏱ ${f.duration}</span>
          <span class="wcard-tag" style="background:${energyColor};color:#555">${energyText}</span>
        </div>
        <p style="font-size:.82rem;color:var(--text2);line-height:1.5;margin-bottom:10px">${f.desc}</p>
        <div class="wcard-actions">${videoBtn}${saveBtn}</div>
      </div>
    </div>`;
  }).join('');

  if (filtered.length === 0) {
    list.innerHTML = '<p class="text-muted text-sm text-center" style="padding:24px">No workouts in this filter yet ✨</p>';
  }
}

function filterFitness(filter) {
  currentFitnessFilter = filter;
  document.querySelectorAll('.fit-filter-btn').forEach(b =>
    b.classList.toggle('btn-primary', b.dataset.filter === filter)
  );
  renderFitness();
}

function toggleSaveFitness(id) {
  let saved = Store.get('savedFitness', []);
  const btn = document.getElementById('fsave_' + id);
  if (saved.includes(id)) {
    saved = saved.filter(s => s !== id);
    if (btn) { btn.textContent = '🔖 Save'; btn.classList.remove('wcard-saved'); }
  } else {
    saved.push(id);
    if (btn) { btn.textContent = '🔖 Saved'; btn.classList.add('wcard-saved'); }
    showToast('Saved! 🔖');
  }
  Store.set('savedFitness', saved);
}

// ===== SCHEDULE GENERATOR =====
function generateSchedule() {
  const wake        = document.getElementById('sch-wake').value || '07:00';
  const sleep       = document.getElementById('sch-sleep').value || '23:00';
  const classStart  = document.getElementById('sch-class-start').value || '09:00';
  const classEnd    = document.getElementById('sch-class-end').value || '17:00';
  const study       = document.getElementById('sch-study').value;
  const workout     = document.getElementById('sch-workout').value;
  const skin        = document.querySelector('input[name="sch-skin"]:checked')?.value === 'yes';

  // Build time blocks
  const blocks = [];
  const add = (time, icon, title, desc, color) => blocks.push({ time, icon, title, desc, color });

  add(wake,                    '⏰', 'Wake Up',          'Get up slowly. You don\'t have to rush.', '#fff3cd');
  add(addMins(wake, 5),        '💧', 'Drink Water',      'One full glass before anything else.', '#d4edda');
  if (skin) add(addMins(wake, 10), '🧴', 'Morning Skincare', 'Cleanser + moisturiser + sunscreen. 5 minutes.', '#f3e5f5');
  if (workout === 'morning') add(addMins(wake, 20), '🏃', 'Morning Movement', '10–15 min stretch or quick workout.', '#e8f5e9');
  add(addMins(wake, 35),       '🍳', 'Breakfast',        'Something real. Even oats counts.', '#fff8e1');
  add(classStart,              '📚', 'Classes Begin',    'Focus mode on.', '#e3f2fd');
  add(addMins(classStart, Math.round((toMins(classEnd) - toMins(classStart)) / 2)), '🍱', 'Lunch Break', 'Eat a proper meal. Step outside briefly.', '#fff8e1');
  add(classEnd,                '📚', 'Classes Done',     'Take 15 min to decompress.', '#e8f5e9');
  if (workout === 'evening') add(addMins(classEnd, 30), '🏃', 'Evening Workout', '15–20 min movement. Shake off the day.', '#e8f5e9');

  const studyTime = study === 'morning' ? addMins(wake, 45)
    : study === 'evening' ? addMins(classEnd, 45)
    : addMins(toTime(21, 0), 0);
  add(studyTime, '📖', 'Study Block', 'One focused session. 45 min on, 10 min off.', '#e3f2fd');
  add(addMins(studyTime, 55), '🍲', 'Dinner',        'Don\'t skip. Mess food counts.', '#fff8e1');
  if (skin) add(addMins(toTime(21, 0), 0), '🌙', 'Evening Skincare', 'Cleanser + moisturiser. Wind down ritual.', '#f3e5f5');
  add(addMins(sleep, -30),     '📵', 'Phone Down',       'Screen off 30 min before sleep.', '#ede7f6');
  add(sleep,                   '😴', 'Sleep',            'You did enough today. Rest now.', '#e8eaf6');

  // Sort by time
  blocks.sort((a, b) => a.time.localeCompare(b.time));

  // Render
  const out = document.getElementById('schedule-output');
  const cards = document.getElementById('schedule-cards');
  document.getElementById('schedule-builder').classList.add('hidden');
  out.classList.remove('hidden');

  cards.innerHTML = blocks.map(b => `
    <div style="display:flex;gap:12px;align-items:flex-start">
      <div style="min-width:52px;font-size:.78rem;font-weight:600;color:var(--text2);padding-top:14px">${b.time}</div>
      <div style="flex:1;background:${b.color};border-radius:var(--r-md);padding:12px 14px;border:1.5px solid rgba(0,0,0,0.06)">
        <div style="font-weight:600;font-size:.9rem">${b.icon} ${b.title}</div>
        <div style="font-size:.78rem;color:#555;margin-top:3px">${b.desc}</div>
      </div>
    </div>`).join('');

  Store.set('lastSchedule', blocks);
  showToast('Your blueprint is ready 🗓️✨');
}

// Time helpers for schedule
function toMins(t) { const [h,m] = t.split(':').map(Number); return h*60+m; }
function toTime(h, m) { return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0'); }
function addMins(t, mins) {
  let total = toMins(t) + mins;
  total = ((total % 1440) + 1440) % 1440;
  return toTime(Math.floor(total/60), total%60);
}

function printSchedule() {
  const name = Store.get('name', 'My');
  const printWin = window.open('', '_blank');
  const blocks = Store.get('lastSchedule', []);
  printWin.document.write(`
    <html><head><title>${name}'s Daily Blueprint — GlowNest</title>
    <style>
      body{font-family:system-ui,sans-serif;max-width:600px;margin:40px auto;color:#3d2e22;background:#faf7f2}
      h1{font-size:1.4rem;margin-bottom:4px;color:#c8956c}
      .sub{color:#7a6355;font-size:.85rem;margin-bottom:28px}
      .block{display:flex;gap:14px;margin-bottom:10px;align-items:flex-start}
      .time{min-width:52px;font-size:.75rem;font-weight:700;color:#7a6355;padding-top:12px}
      .card{flex:1;border-radius:10px;padding:10px 14px;border:1px solid rgba(0,0,0,0.08)}
      .title{font-weight:600;font-size:.88rem}
      .desc{font-size:.75rem;color:#555;margin-top:2px}
      .footer{margin-top:28px;text-align:center;font-size:.75rem;color:#b09080}
      @media print{body{margin:20px}}
    </style></head><body>
    <h1>🌿 ${name}'s Daily Blueprint</h1>
    <div class="sub">Generated by GlowNest — your hostel survival companion</div>
    ${blocks.map(b=>`<div class="block">
      <div class="time">${b.time}</div>
      <div class="card" style="background:${b.color}">
        <div class="title">${b.icon} ${b.title}</div>
        <div class="desc">${b.desc}</div>
      </div></div>`).join('')}
    <div class="footer">GlowNest — Glow Up Without Burnout 🌿</div>
    </body></html>`);
  printWin.document.close();
  printWin.print();
}

// Register page listeners
window.addEventListener('pagechange', e => {
  if (e.detail === 'fitness') renderFitness();
});