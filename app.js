const habits = [
  { id: 'pause', title: 'Two-minute pause', desc: 'Before eating anything unplanned, pause and name the trigger.' },
  { id: 'proteinveg', title: 'Protein or vegetables first', desc: 'Start meals with protein or vegetables before anything else.' },
  { id: 'move', title: 'Move before munch', desc: 'When bored or stressed, walk or reset before snacking.' }
];

const todayKey = () => new Date().toISOString().slice(0,10);
const storageKey = 'heroHabits.v1';
const reviewKey = 'heroHabits.review.v1';
let data = JSON.parse(localStorage.getItem(storageKey) || '{}');
let timerInterval = null;
let remaining = 120;

function save() { localStorage.setItem(storageKey, JSON.stringify(data)); }
function todayData() { const k = todayKey(); data[k] ||= {}; return data[k]; }
function formatDate(d) { return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }); }
function setTodayLabel() { document.getElementById('todayLabel').textContent = formatDate(new Date()); }

function renderHabits() {
  const box = document.getElementById('habits');
  const day = todayData();
  box.innerHTML = '';
  habits.forEach(h => {
    const item = document.createElement('div');
    item.className = 'habit';
    item.innerHTML = `<div><p class="habit-title">${h.title}</p><p class="habit-desc">${h.desc}</p></div><button aria-label="Toggle ${h.title}" class="toggle ${day[h.id] ? 'on' : ''}"></button>`;
    item.querySelector('button').addEventListener('click', () => {
      day[h.id] = !day[h.id];
      save(); render();
    });
    box.appendChild(item);
  });
}

function scoreFor(dateKey) { const d = data[dateKey] || {}; return habits.reduce((s,h) => s + (d[h.id] ? 1 : 0), 0); }
function updateScore() { document.getElementById('scoreValue').textContent = `${scoreFor(todayKey())}/3`; }

function renderWeek() {
  const grid = document.getElementById('weekGrid'); grid.innerHTML = '';
  for (let i=6; i>=0; i--) {
    const d = new Date(); d.setDate(d.getDate()-i);
    const key = d.toISOString().slice(0,10);
    const cell = document.createElement('div');
    cell.className = 'day';
    cell.innerHTML = `<strong>${d.toLocaleDateString('en-GB', { weekday: 'short' })}</strong><span>${scoreFor(key)}/3</span>`;
    grid.appendChild(cell);
  }
}

function renderReview() {
  document.getElementById('review').value = localStorage.getItem(reviewKey) || '';
}

function render() { setTodayLabel(); renderHabits(); updateScore(); renderWeek(); }

function startTimer() {
  clearInterval(timerInterval); remaining = 120; updateTimer();
  timerInterval = setInterval(() => {
    remaining--; updateTimer();
    if (remaining <= 0) { clearInterval(timerInterval); navigator.vibrate?.(120); }
  }, 1000);
}
function updateTimer() {
  const m = String(Math.floor(remaining/60)).padStart(2,'0');
  const s = String(remaining%60).padStart(2,'0');
  document.getElementById('timer').textContent = `${m}:${s}`;
}

function exportCsv() {
  const rows = [['date','pause','protein_or_veg_first','move_before_munch','score']];
  Object.keys(data).sort().forEach(k => {
    const d = data[k]; rows.push([k, d.pause?1:0, d.proteinveg?1:0, d.move?1:0, scoreFor(k)]);
  });
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'hero-habits.csv'; a.click(); URL.revokeObjectURL(url);
}

document.getElementById('startTimer').addEventListener('click', startTimer);
document.getElementById('logUrge').addEventListener('click', () => { todayData().move = true; save(); render(); });
document.getElementById('exportCsv').addEventListener('click', exportCsv);
document.getElementById('saveReview').addEventListener('click', () => {
  localStorage.setItem(reviewKey, document.getElementById('review').value);
  document.getElementById('savedNote').textContent = 'Saved.';
  setTimeout(() => document.getElementById('savedNote').textContent = '', 1600);
});

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
renderReview(); render(); updateTimer();
