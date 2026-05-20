/* ─────────────────────────────────────────────────────────────
   StudyPlanner · script.js
   Particle Network + Waving Motivation Graph + Task Logic
───────────────────────────────────────────────────────────── */

// ── PARTICLE NETWORK ───────────────────────────────────────────
(function initParticles() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];
  const COUNT    = 80;
  const MAX_DIST = 150;
  const COLOR    = '0,180,216';

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function Particle() {
    this.x  = Math.random() * W;
    this.y  = Math.random() * H;
    this.vx = (Math.random() - 0.5) * 0.6;
    this.vy = (Math.random() - 0.5) * 0.6;
    this.r  = Math.random() * 2 + 1;
  }

  Particle.prototype.update = function() {
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < 0 || this.x > W) this.vx *= -1;
    if (this.y < 0 || this.y > H) this.vy *= -1;
  };

  function init() {
    resize();
    particles = [];
    for (let i = 0; i < COUNT; i++) particles.push(new Particle());
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => p.update());

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx   = particles[i].x - particles[j].x;
        const dy   = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MAX_DIST) {
          const alpha = (1 - dist / MAX_DIST) * 0.5;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${COLOR},${alpha})`;
          ctx.lineWidth   = 0.8;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle  = `rgba(${COLOR},0.85)`;
      ctx.shadowColor = `rgba(${COLOR},0.8)`;
      ctx.shadowBlur  = 6;
      ctx.fill();
      ctx.shadowBlur  = 0;
    });

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  init();
  draw();
})();

// ── WAVING MOTIVATION GRAPH ────────────────────────────────────
(function initWavingGraph() {
  const canvas = document.getElementById('motivationCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let time = 0;

  // Base wave shape — multiple sine waves layered
  function getWaveY(x, W, H, PAD, t) {
    const normalX = x / W;

    // Main wave
    const wave1 = Math.sin(normalX * Math.PI * 3 + t) * 0.12;
    // Secondary wave
    const wave2 = Math.sin(normalX * Math.PI * 5 + t * 1.3) * 0.07;
    // Tertiary small ripple
    const wave3 = Math.sin(normalX * Math.PI * 8 + t * 0.8) * 0.04;

    // Base curve shape (rises then gently drops)
    const base = 0.35
      + Math.sin(normalX * Math.PI) * 0.28
      - normalX * 0.08;

    const y = base + wave1 + wave2 + wave3;

    // Clamp between 0.05 and 0.92
    const clamped = Math.max(0.05, Math.min(0.92, y));
    return PAD.t + clamped * (H - PAD.t - PAD.b);
  }

  function draw() {
    const W   = canvas.width  = canvas.offsetWidth;
    const H   = canvas.height = canvas.offsetHeight;
    const PAD = { t: 16, r: 16, b: 28, l: 36 };
    const gW  = W - PAD.l - PAD.r;

    ctx.clearRect(0, 0, W, H);

    // Grid dots
    ctx.fillStyle = 'rgba(0,180,216,0.10)';
    for (let gx = 0; gx <= 10; gx++) {
      for (let gy = 0; gy <= 5; gy++) {
        ctx.beginPath();
        ctx.arc(
          PAD.l + (gx / 10) * gW,
          PAD.t + (gy / 5) * (H - PAD.t - PAD.b),
          1.2, 0, Math.PI * 2
        );
        ctx.fill();
      }
    }

    // Axes
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(PAD.l, PAD.t);
    ctx.lineTo(PAD.l, H - PAD.b);
    ctx.lineTo(W - PAD.r, H - PAD.b);
    ctx.stroke();

    // Y axis label
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font      = '9px DM Sans, sans-serif';
    ctx.textAlign = 'center';
    ctx.translate(10, PAD.t + (H - PAD.t - PAD.b) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('MOTIVATION', 0, 0);
    ctx.restore();

    // X axis label
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font      = '9px DM Sans, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TIME', PAD.l + gW / 2, H - 2);

    // Build wave points
    const STEPS = 120;
    const points = [];
    for (let i = 0; i <= STEPS; i++) {
      const x = PAD.l + (i / STEPS) * gW;
      const y = getWaveY(i / STEPS * gW, gW, H, PAD, time);
      points.push({ x, y });
    }

    // Gradient fill under wave
    const grad = ctx.createLinearGradient(0, PAD.t, 0, H - PAD.b);
    grad.addColorStop(0,   'rgba(0,180,216,0.22)');
    grad.addColorStop(0.6, 'rgba(0,180,216,0.08)');
    grad.addColorStop(1,   'rgba(0,180,216,0.01)');

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx  = (prev.x + curr.x) / 2;
      ctx.quadraticCurveTo(prev.x, prev.y, cpx, (prev.y + curr.y) / 2);
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.lineTo(W - PAD.r, H - PAD.b);
    ctx.lineTo(PAD.l, H - PAD.b);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Wave line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx  = (prev.x + curr.x) / 2;
      ctx.quadraticCurveTo(prev.x, prev.y, cpx, (prev.y + curr.y) / 2);
    }
    ctx.strokeStyle = '#00b4d8';
    ctx.lineWidth   = 2.2;
    ctx.shadowColor = 'rgba(0,180,216,0.7)';
    ctx.shadowBlur  = 10;
    ctx.stroke();
    ctx.shadowBlur  = 0;

    // Glowing dot at end of wave
    const last = points[points.length - 1];
    ctx.beginPath();
    ctx.arc(last.x, last.y, 4.5, 0, Math.PI * 2);
    ctx.fillStyle   = '#00b4d8';
    ctx.shadowColor = 'rgba(0,180,216,1)';
    ctx.shadowBlur  = 16;
    ctx.fill();
    ctx.shadowBlur  = 0;

    // Pulse ring around dot
    const pulse = (Math.sin(time * 3) + 1) / 2;
    ctx.beginPath();
    ctx.arc(last.x, last.y, 4.5 + pulse * 6, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(0,180,216,${0.4 - pulse * 0.35})`;
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    time += 0.025;
    requestAnimationFrame(draw);
  }

  // Wait for layout to settle
  setTimeout(() => {
    draw();
    window.addEventListener('resize', () => {
      cancelAnimationFrame(draw);
    });
  }, 100);
})();

// ── PROFILE PHOTO UPLOAD ───────────────────────────────────────
(function initProfilePhoto() {
  const fileInput = document.getElementById('profileFileInput');
  const imgEl     = document.getElementById('profileImg');
  const addText   = document.getElementById('addPhotoText');
  if (!fileInput || !imgEl) return;

  const saved = localStorage.getItem('sp_profilePhoto');
  if (saved) {
    imgEl.src           = saved;
    imgEl.style.display = 'block';
    if (addText) addText.style.display = 'none';
  }

  fileInput.addEventListener('change', function() {
    const file = this.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
      imgEl.src           = e.target.result;
      imgEl.style.display = 'block';
      if (addText) addText.style.display = 'none';
      localStorage.setItem('sp_profilePhoto', e.target.result);
    };
    reader.readAsDataURL(file);
  });
})();

// ── STATE ──────────────────────────────────────────────────────
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';

const PRIORITY_SYMBOL = {
  High:   '◆',
  Medium: '◇',
  Low:    '○'
};

// ── DOM REFERENCES ─────────────────────────────────────────────
const taskForm           = document.getElementById('taskForm');
const taskTitle          = document.getElementById('taskTitle');
const taskDate           = document.getElementById('taskDate');
const taskPrioritySelect = document.getElementById('taskPrioritySelect');
const taskList           = document.getElementById('taskList');
const searchInput        = document.getElementById('searchInput');
const progressFill       = document.getElementById('progressFill');
const progressText       = document.getElementById('progressText');
const countdownText      = document.getElementById('countdownText');
const themeToggle        = document.getElementById('themeToggle');
const totalTasksEl       = document.getElementById('totalTasks');
const completedEl        = document.getElementById('completedTasks');
const pendingEl          = document.getElementById('pendingTasks');
const nearestDeadEl      = document.getElementById('nearestDeadline');
const resetTasksBtn      = document.getElementById('resetTasksBtn');

// ── HELPERS ────────────────────────────────────────────────────
function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function formatDate(dateString) {
  if (!dateString) return 'No date';
  return new Date(dateString + 'T00:00:00').toLocaleDateString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

function getUrgency(dateString, completed) {
  if (completed || !dateString) return null;
  const hrs = (new Date(dateString + 'T23:59:59') - new Date()) / (1000 * 60 * 60);
  if (hrs < 0)  return { label: 'Overdue',   cls: 'urgency-overdue'  };
  if (hrs < 24) return { label: 'Due Today',  cls: 'urgency-critical' };
  if (hrs < 72) return { label: 'Due Soon',   cls: 'urgency-warning'  };
  return              { label: 'On Track',   cls: 'urgency-safe'     };
}

function showToast(msg) {
  const t = document.createElement('div');
  t.className   = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── RENDER TASKS ───────────────────────────────────────────────
function renderTasks() {
  if (!taskList) return;
  const search = searchInput ? searchInput.value.toLowerCase().trim() : '';

  let filtered = tasks.filter(task => {
    const matchFilter =
      currentFilter === 'all'       ? true :
      currentFilter === 'completed' ? task.completed :
      currentFilter === 'pending'   ? !task.completed :
      task.priority === currentFilter;
    const matchSearch =
      task.title.toLowerCase().includes(search) ||
      (task.description || '').toLowerCase().includes(search);
    return matchFilter && matchSearch;
  });

  if (filtered.length === 0) {
    taskList.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-inbox"></i>
        <p>${search ? 'No tasks match your search.' : 'No tasks yet. Add your first task above!'}</p>
      </div>`;
    updateStats(); updateProgress(); updateCountdown();
    return;
  }

  filtered.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return new Date(a.date) - new Date(b.date);
  });

  taskList.innerHTML = '';
  filtered.forEach(task => {
    const urgency      = getUrgency(task.date, task.completed);
    const urgencyBadge = urgency
      ? `<span class="urgency-badge ${urgency.cls}">${urgency.label}</span>` : '';
    const sym = PRIORITY_SYMBOL[task.priority] || '○';

    const card = document.createElement('div');
    card.className = `task-card ${task.priority.toLowerCase()} ${task.completed ? 'completed' : ''}`;
    card.innerHTML = `
      <h4>${escapeHtml(task.title)}</h4>
      <div class="badges">
        <span class="priority-symbol">${sym} ${task.priority}</span>
        <span class="badge status ${task.completed ? '' : 'pending'}">
          ${task.completed ? '✅ Completed' : '⏳ Pending'}
        </span>
        ${urgencyBadge}
      </div>
      <p style="margin-top:4px;">
        <i class="fa-regular fa-calendar" style="margin-right:5px;opacity:0.5;"></i>
        ${formatDate(task.date)}
      </p>
      <div class="task-actions">
        <button class="complete-btn" onclick="toggleComplete(${task.id})">
          ${task.completed ? '↩ Undo' : '✓ Complete'}
        </button>
        <button class="edit-btn" onclick="editTask(${task.id})">✏ Edit</button>
        <button class="delete-btn" onclick="deleteTask(${task.id})">🗑 Delete</button>
      </div>`;
    taskList.appendChild(card);
  });

  updateStats();
  updateProgress();
  updateCountdown();
}

// ── ADD TASK ───────────────────────────────────────────────────
if (taskForm) {
  if (taskDate) {
    taskDate.setAttribute('min', new Date().toISOString().split('T')[0]);
  }
  taskForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const priority = taskPrioritySelect ? taskPrioritySelect.value : 'Medium';
    const newTask  = {
      id:          Date.now(),
      title:       taskTitle.value.trim(),
      description: '',
      date:        taskDate.value,
      priority:    priority,
      completed:   false
    };
    tasks.unshift(newTask);
    saveTasks();
    renderTasks();
    taskForm.reset();
    showToast('Task added! ' + PRIORITY_SYMBOL[priority] + ' ' + priority);
  });
}

// ── TOGGLE COMPLETE ────────────────────────────────────────────
function toggleComplete(id) {
  tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
  saveTasks();
  renderTasks();
  const task = tasks.find(t => t.id === id);
  showToast(task && task.completed ? '✅ Marked complete!' : '↩ Marked pending');
}

// ── DELETE ─────────────────────────────────────────────────────
function deleteTask(id) {
  if (!confirm('Delete this task?')) return;
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  renderTasks();
  showToast('Task deleted.');
}

// ── EDIT ───────────────────────────────────────────────────────
function editTask(id) {
  if (!taskTitle || !taskDate) return;
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  taskTitle.value = task.title;
  taskDate.value  = task.date;
  if (taskPrioritySelect) taskPrioritySelect.value = task.priority;
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  renderTasks();
  taskTitle.focus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  showToast('Task loaded for editing.');
}

// ── PROGRESS ───────────────────────────────────────────────────
function updateProgress() {
  if (!progressFill || !progressText) return;
  const total = tasks.length;
  const done  = tasks.filter(t => t.completed).length;
  const pct   = total === 0 ? 0 : Math.round((done / total) * 100);
  progressFill.style.width = pct + '%';
  progressText.textContent = `${pct}% Completed (${done}/${total} tasks)`;
}

// ── COUNTDOWN ──────────────────────────────────────────────────
function updateCountdown() {
  if (!countdownText) return;
  const pending = tasks
    .filter(t => !t.completed && t.date)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (pending.length === 0) {
    countdownText.textContent = "🎉 All caught up — no upcoming deadlines!";
    if (nearestDeadEl) nearestDeadEl.textContent = '—';
    return;
  }

  const nearest  = pending[0];
  const daysLeft = Math.ceil(
    (new Date(nearest.date + 'T23:59:59') - new Date()) / (1000 * 60 * 60 * 24)
  );

  if (nearestDeadEl) {
    nearestDeadEl.textContent = nearest.title.length > 14
      ? nearest.title.slice(0, 14) + '…'
      : nearest.title;
  }

  if (daysLeft < 0)        countdownText.textContent = `⚠️ "${nearest.title}" is overdue!`;
  else if (daysLeft === 0) countdownText.textContent = `🔴 "${nearest.title}" is due today!`;
  else if (daysLeft === 1) countdownText.textContent = `🟡 "${nearest.title}" is due tomorrow`;
  else                     countdownText.textContent = `📅 "${nearest.title}" — ${daysLeft} days left`;
}

// ── STATS ──────────────────────────────────────────────────────
function updateStats() {
  const total = tasks.length;
  const done  = tasks.filter(t => t.completed).length;
  if (totalTasksEl) totalTasksEl.textContent = total;
  if (completedEl)  completedEl.textContent  = done;
  if (pendingEl)    pendingEl.textContent     = total - done;
}

// ── SEARCH ─────────────────────────────────────────────────────
if (searchInput) {
  searchInput.addEventListener('input', renderTasks);
}

// ── FILTER BUTTONS ─────────────────────────────────────────────
document.querySelectorAll('.filterBtn').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.filterBtn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    currentFilter = this.dataset.filter;
    renderTasks();
  });
});

// ── THEME ──────────────────────────────────────────────────────
function loadTheme() {
  if (!themeToggle) return;
  const icon  = themeToggle.querySelector('i');
  const saved = localStorage.getItem('theme');
  if (saved === 'light') {
    document.body.classList.add('light-mode');
    if (icon) icon.className = 'fa-solid fa-moon';
  } else {
    if (icon) icon.className = 'fa-solid fa-sun';
  }
}

if (themeToggle) {
  themeToggle.addEventListener('click', function() {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    const icon    = themeToggle.querySelector('i');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    if (icon) icon.className = isLight ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
  });
}

// ── RESET TASKS ────────────────────────────────────────────────
if (resetTasksBtn) {
  resetTasksBtn.addEventListener('click', function() {
    if (!confirm('Delete ALL tasks permanently?')) return;
    tasks = [];
    saveTasks();
    showToast('All tasks deleted.');
    if (taskList) renderTasks();
    setTimeout(() => { window.location.href = 'planner.html'; }, 1000);
  });
}

// ── INIT ───────────────────────────────────────────────────────
loadTheme();
renderTasks();
