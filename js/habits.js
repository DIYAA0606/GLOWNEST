// ===== GlowNest — habits.js =====

const DEFAULT_HABITS = [
  { id: 'h1', name: 'Drink 8 glasses water',  emoji: '💧', target: 5, category: 'health' },
  { id: 'h2', name: 'Sleep before 1am',        emoji: '😴', target: 5, category: 'sleep'  },
  { id: 'h3', name: 'Walk/stretch 10 min',     emoji: '🚶', target: 4, category: 'active' },
  { id: 'h4', name: 'Apply sunscreen',         emoji: '🌞', target: 4, category: 'skin'   },
  { id: 'h5', name: 'Eat a real meal',         emoji: '🍱', target: 5, category: 'food'   },
];

const HABIT_EMOJIS = ['✨','💧','😴','🚶','🌞','🍱','📖','🧘','🎵','💊','🪴','🧴','🏃','🥗','☕'];

// ===== LOAD OR INIT HABITS =====
function getHabits() {
  const stored = Store.get('habits', null);
  if (!stored) {
    Store.set('habits', DEFAULT_HABITS.map(h => ({ ...h, completions: {} })));
    return Store.get('habits');
  }
  return stored;
}

function saveHabits(habits) { Store.set('habits', habits); }

// ===== WEEKLY RESET CHECK =====
function checkWeeklyReset(habits) {
  const currentWk = weekKey();
  return habits.map(h => {
    if (!h.completions) h.completions = {};
    return h;
  });
}

// ===== RENDER HABITS PAGE =====
function renderHabits() {
  let habits = checkWeeklyReset(getHabits());
  const wk = weekKey();
  const list = document.getElementById('habit-list');
  if (!list) return;

  if (habits.length === 0) {
    list.innerHTML = `<div class="card card-flat text-center" style="padding:32px">
      <div style="font-size:2.5rem;margin-bottom:12px">🌱</div>
      <p class="text-muted">No habits yet. Add your first one!</p>
    </div>`;
    return;
  }

 list.innerHTML = habits.map((h, i) => {
    const done      = (h.completions[wk] || 0);
    const pct       = Math.min(Math.round((done / h.target) * 100), 100);
    const completed = done >= h.target;
    const type      = h.type || 'binary';
    const TYPE_LABEL = { binary:'☑ Binary', count:'🔢 Count', timer:'⏱ Timer', flex:'🌊 Flexible' };
    const TYPE_CLS   = { binary:'', count:'htype-count', timer:'htype-timer', flex:'htype-flex' };
    const typeLabel  = TYPE_LABEL[type] || TYPE_LABEL.binary;
    const typeCls    = TYPE_CLS[type]   || '';
    return `
<div class="habit-item${completed ? ' completed-habit' : ''}" data-id="${h.id}">
  <div class="habit-check${completed ? ' done' : ''}" onclick="toggleHabitDay('${h.id}')">
    ${completed ? '✓' : ''}
  </div>
  <div class="habit-info">
    <div class="habit-name">${h.emoji} ${h.name}</div>
    <div class="flex items-center gap-8 mt-4">
      <span class="habit-meta">${done}/${h.target} this week</span>
      <span class="htype-badge ${typeCls}">${typeLabel}</span>
      ${completed ? '<span class="badge badge-accent">✨ Done!</span>' : ''}
    </div>
    <div class="progress-wrap mt-8" style="height:6px">
      <div class="progress-bar" style="width:${pct}%"></div>
    </div>
  </div>
  <div class="habit-actions">
    <button class="btn-icon" style="width:32px;height:32px;font-size:.85rem" onclick="editHabit(${i})" title="Edit">✏️</button>
    <button class="btn-icon" style="width:32px;height:32px;font-size:.85rem" onclick="deleteHabit('${h.id}')" title="Delete">🗑️</button>
  </div>
</div>`;
  }).join('');

  // Update weekly overview
  renderHabitWeekSummary(habits, wk);
}

// ===== TOGGLE DAILY COMPLETION =====
function toggleHabitDay(id) {
  const habits = getHabits();
  const wk     = weekKey();
  const habit  = habits.find(h => h.id === id);
  if (!habit) return;
  if (!habit.completions) habit.completions = {};

  const cur  = habit.completions[wk] || 0;
  const checkEl = document.querySelector(`[data-id="${id}"] .habit-check`);

  if (cur < habit.target) {
    habit.completions[wk] = cur + 1;
    const done = habit.completions[wk];

    // Micro dopamine burst
    if (checkEl) {
      checkEl.classList.add('burst');
      setTimeout(() => checkEl.classList.remove('burst'), 400);
      const r = checkEl.getBoundingClientRect();
      if (typeof confettiBurst === 'function') confettiBurst(r.left + r.width / 2, r.top);
      if (typeof floatXP === 'function') floatXP(done === habit.target ? 25 : 5, r.left, r.top);
    }

    addXP(done === habit.target ? 25 : 5);

    if (done === habit.target) {
      showToast('🎉 ' + habit.emoji + ' ' + habit.name + ' — weekly goal done!');
    } else {
      showToast(habit.emoji + ' ' + (habit.target - done) + ' more to hit your goal!');
    }
  } else {
    habit.completions[wk] = Math.max(0, cur - 1);
    showToast('Undone — no worries 🌿');
  }

  saveHabits(habits);
  renderHabits();
}

// ===== WEEKLY SUMMARY MINI CHART =====
function renderHabitWeekSummary(habits, wk) {
  const el = document.getElementById('habit-week-summary');
  if (!el) return;
  const total = habits.length;
  const done = habits.filter(h => (h.completions[wk] || 0) >= h.target).length;
  el.innerHTML = `
    <div class="flex items-center gap-12">
      <div class="score-display">
        <svg width="80" height="80" class="ring-svg">
          <circle class="ring-track" cx="40" cy="40" r="32" stroke-width="7"/>
          <circle class="ring-fill" cx="40" cy="40" r="32" stroke-width="7"
            stroke-dasharray="${2*Math.PI*32}"
            stroke-dashoffset="${2*Math.PI*32 - (2*Math.PI*32 * (total ? done/total : 0))}"/>
        </svg>
        <div class="score-inner">
          <div class="score-num" style="font-size:1.3rem">${done}</div>
          <div class="score-lbl">/ ${total}</div>
        </div>
      </div>
      <div>
        <div style="font-weight:600;font-size:.95rem">${done === total && total > 0 ? '🎉 All done this week!' : done + ' of ' + total + ' habits completed'}</div>
        <div class="text-muted text-sm mt-4">${total === 0 ? 'Add habits to track' : done === 0 ? 'Start with just one today ✨' : 'Keep the momentum going!'}</div>
      </div>
    </div>`;
}

// ===== ADD HABIT MODAL =====
let editingIdx = null;

function openAddHabit() {
  editingIdx = null;
  document.getElementById('habit-form-title').textContent = 'New Habit';
  document.getElementById('habit-name-inp').value = '';
  document.getElementById('habit-target-inp').value = 4;
  document.getElementById('habit-emoji-sel').value = '✨';
  document.getElementById('habit-type-inp').value = 'binary'; // ← add this
  openModal('modal-habit');
}

function editHabit(idx) {
  const habits = getHabits();
  const h = habits[idx];
  editingIdx = idx;
  document.getElementById('habit-form-title').textContent = 'Edit Habit';
  document.getElementById('habit-name-inp').value = h.name;
  document.getElementById('habit-target-inp').value = h.target;
  document.getElementById('habit-emoji-sel').value = h.emoji || '✨';
  document.getElementById('habit-type-inp').value = h.type || 'binary';
  openModal('modal-habit');
}

function saveHabitForm() {
  const name   = document.getElementById('habit-name-inp').value.trim();
  const target = parseInt(document.getElementById('habit-target-inp').value) || 4;
  const emoji  = document.getElementById('habit-emoji-sel').value;
  const type   = document.getElementById('habit-type-inp')?.value || 'binary';

  if (!name) { showToast('Give your habit a name 🌿'); return; }

  const habits = getHabits();
  if (editingIdx !== null) {
    habits[editingIdx].name   = name;
    habits[editingIdx].target = Math.min(Math.max(target, 1), 7);
    habits[editingIdx].emoji  = emoji;
    habits[editingIdx].type   = type;
  } else {
    habits.push({
      id: 'h' + Date.now(),
      name, emoji, type,
      target: Math.min(Math.max(target, 1), 7),
      completions: {},
    });
    addXP(10);
    showToast('✨ New habit added! Small steps, big glow-up.');
  }
  saveHabits(habits);
  closeModal('modal-habit');
  renderHabits();
}

function deleteHabit(id) {
  const habits = getHabits().filter(h => h.id !== id);
  saveHabits(habits);
  renderHabits();
  showToast('Habit removed. It\'s okay to let go 🌿');
}

// ===== EMOJI PICKER =====
function renderEmojiPicker() {
  const sel = document.getElementById('habit-emoji-sel');
  if (!sel) return;
  sel.innerHTML = HABIT_EMOJIS.map(e => `<option value="${e}">${e}</option>`).join('');
}

// ===== INIT =====
window.addEventListener('pagechange', e => {
  if (e.detail === 'habits') renderHabits();
});

document.addEventListener('DOMContentLoaded', () => {
  renderEmojiPicker();
  document.getElementById('add-habit-btn')?.addEventListener('click', openAddHabit);
  document.getElementById('save-habit-btn')?.addEventListener('click', saveHabitForm);
});

// CSS for completed habit
const style = document.createElement('style');
style.textContent = `.completed-habit { border-color: var(--success) !important; }
.completed-habit .habit-check.done { background: var(--success) !important; border-color: var(--success) !important; }`;
document.head.appendChild(style);