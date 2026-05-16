/* ─────────────────────────────────────────────────────────────
   StudyPlanner · script.js
───────────────────────────────────────────────────────────── */

// ── STATE ──────────────────────────────────────────────────────
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';

// ── DOM REFERENCES ─────────────────────────────────────────────
const taskForm       = document.getElementById('taskForm');
const taskTitle      = document.getElementById('taskTitle');
const taskDesc       = document.getElementById('taskDesc');
const taskDate       = document.getElementById('taskDate');
const taskPriority   = document.getElementById('taskPriority');
const taskList       = document.getElementById('taskList');
const searchInput    = document.getElementById('searchInput');
const progressFill   = document.getElementById('progressFill');
const progressText   = document.getElementById('progressText');
const countdownText  = document.getElementById('countdownText');
const themeToggle    = document.getElementById('themeToggle');
const totalTasksEl   = document.getElementById('totalTasks');
const completedEl    = document.getElementById('completedTasks');
const pendingEl      = document.getElementById('pendingTasks');
const nearestDeadEl  = document.getElementById('nearestDeadline');
const resetTasksBtn  = document.getElementById('resetTasksBtn');

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
  const now  = new Date();
  const due  = new Date(dateString + 'T23:59:59');
  const hrs  = (due - now) / (1000 * 60 * 60);
  if (hrs < 0)   return { label: 'Overdue',   cls: 'urgency-overdue'  };
  if (hrs < 24)  return { label: 'Due Today',  cls: 'urgency-critical' };
  if (hrs < 72)  return { label: 'Due Soon',   cls: 'urgency-warning'  };
  return             { label: 'On Track',   cls: 'urgency-safe'     };
}

function showToast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}

function escapeHtml(str) {
  return str
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
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
    updateStats();
    updateProgress();
    updateCountdown();
    return;
  }

  // Sort: pending first, then by date
  filtered.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return new Date(a.date) - new Date(b.date);
  });

  taskList.innerHTML = '';

  filtered.forEach(task => {
    const urgency = getUrgency(task.date, task.completed);
    const urgencyBadge = urgency
      ? `<span class="urgency-badge ${urgency.cls}">${urgency.label}</span>`
      : '';

    const card = document.createElement('div');
    card.className = `task-card ${task.priority.toLowerCase()} ${task.completed ? 'completed' : ''}`;
    card.innerHTML = `
      <h4>${escapeHtml(task.title)}</h4>
      ${task.description ? `<p>${escapeHtml(task.description)}</p>` : ''}
      <div class="badges">
        <span class="badge priority">${task.priority} Priority</span>
        <span class="badge status ${task.completed ? '' : 'pending'}">
          ${task.completed ? '✅ Completed' : '⏳ Pending'}
        </span>
      </div>
      <p><strong>Deadline:</strong> ${formatDate(task.date)} ${urgencyBadge}</p>
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
    const newTask = {
      id:          Date.now(),
      title:       taskTitle.value.trim(),
      description: taskDesc ? taskDesc.value.trim() : '',
      date:        taskDate.value,
      priority:    taskPriority ? taskPriority.value : 'Medium',
      completed:   false
    };
    tasks.unshift(newTask);
    saveTasks();
    renderTasks();
    taskForm.reset();
    showToast('Task added successfully!');
  });
}

// ── TOGGLE COMPLETE ────────────────────────────────────────────
function toggleComplete(id) {
  tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
  saveTasks();
  renderTasks();
  const task = tasks.find(t => t.id === id);
  showToast(task && task.completed ? '✅ Task marked complete!' : '↩ Task marked pending');
}

// ── DELETE TASK ────────────────────────────────────────────────
function deleteTask(id) {
  if (!confirm('Delete this task?')) return;
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  renderTasks();
  showToast('Task deleted.');
}

// ── EDIT TASK ──────────────────────────────────────────────────
function editTask(id) {
  if (!taskTitle || !taskDate || !taskPriority) return;
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  taskTitle.value    = task.title;
  if (taskDesc) taskDesc.value = task.description || '';
  taskDate.value     = task.date;
  taskPriority.value = task.priority;
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  renderTasks();
  taskTitle.focus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  showToast('Task loaded for editing.');
}

// ── PROGRESS BAR ───────────────────────────────────────────────
function updateProgress() {
  if (!progressFill || !progressText) return;
  const total     = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pct       = total === 0 ? 0 : Math.round((completed / total) * 100);
  progressFill.style.width = pct + '%';
  progressText.textContent = `${pct}% Completed (${completed}/${total} tasks)`;
}

// ── COUNTDOWN ──────────────────────────────────────────────────
function updateCountdown() {
  if (!countdownText) return;
  const pending = tasks
    .filter(t => !t.completed && t.date)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (pending.length === 0) {
    countdownText.textContent = "🎉 No upcoming deadlines — you're all caught up!";
    if (nearestDeadEl) nearestDeadEl.textContent = '—';
    return;
  }

  const nearest  = pending[0];
  const due      = new Date(nearest.date + 'T23:59:59');
  const daysLeft = Math.ceil((due - new Date()) / (1000 * 60 * 60 * 24));

  if (nearestDeadEl) {
    nearestDeadEl.textContent = nearest.title.length > 12
      ? nearest.title.slice(0, 12) + '…'
      : nearest.title;
  }

  if (daysLeft < 0)       countdownText.textContent = `⚠️ "${nearest.title}" deadline has passed!`;
  else if (daysLeft === 0) countdownText.textContent = `🔴 "${nearest.title}" is due today!`;
  else if (daysLeft === 1) countdownText.textContent = `🟡 "${nearest.title}" is due tomorrow`;
  else                     countdownText.textContent = `📅 "${nearest.title}" is due in ${daysLeft} days`;
}

// ── STATS ──────────────────────────────────────────────────────
function updateStats() {
  const total     = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  if (totalTasksEl) totalTasksEl.textContent = total;
  if (completedEl)  completedEl.textContent  = completed;
  if (pendingEl)    pendingEl.textContent     = total - completed;
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

// ── THEME TOGGLE ───────────────────────────────────────────────
function loadTheme() {
  if (!themeToggle) return;
  const icon  = themeToggle.querySelector('i');
  const saved = localStorage.getItem('theme');
  if (saved === 'dark') {
    document.body.classList.add('dark');
    if (icon) icon.className = 'fa-solid fa-sun';
  } else {
    if (icon) icon.className = 'fa-solid fa-moon';
  }
}

if (themeToggle) {
  themeToggle.addEventListener('click', function() {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    const icon   = themeToggle.querySelector('i');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    if (icon) icon.className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  });
}

// ── RESET TASKS ────────────────────────────────────────────────
if (resetTasksBtn) {
  resetTasksBtn.addEventListener('click', function() {
    if (!confirm('Are you sure? This will permanently delete ALL your tasks.')) return;
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
