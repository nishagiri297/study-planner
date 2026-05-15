let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let currentFilter = "all";

const taskForm = document.getElementById("taskForm");
const taskTitle = document.getElementById("taskTitle");
const taskDesc = document.getElementById("taskDesc");
const taskDate = document.getElementById("taskDate");
const taskPriority = document.getElementById("taskPriority");
const taskList = document.getElementById("taskList");
const searchInput = document.getElementById("searchInput");
const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");
const countdownText = document.getElementById("countdownText");
const themeToggle = document.getElementById("themeToggle");

const totalTasks = document.getElementById("totalTasks");
const completedTasks = document.getElementById("completedTasks");
const pendingTasks = document.getElementById("pendingTasks");
const nearestDeadline = document.getElementById("nearestDeadline");
const resetTasksBtn = document.getElementById("resetTasksBtn");

if (taskForm) {
  taskForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const newTask = {
      id: Date.now(),
      title: taskTitle.value.trim(),
      description: taskDesc.value.trim(),
      date: taskDate.value,
      priority: taskPriority.value,
      completed: true
    };
    const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskDate = document.getElementById("taskDate");
const taskList = document.getElementById("taskList");

let tasks = [];

taskForm.addEventListener("submit", function(e){

e.preventDefault();

const task = {
text: taskInput.value,
date: taskDate.value,
done:false
};

tasks.push(task);

renderTasks();

taskInput.value="";
taskDate.value="";
 
});

function renderTasks(){

taskList.innerHTML="";

tasks.forEach((task,index)=>{

const li = document.createElement("li");

li.classList.add("task-item");

if(task.done){
li.classList.add("task-done");
}

li.innerHTML = `
<span>${task.text} - ${task.date}</span>

<div>
<button class="done-btn" onclick="toggleDone(${index})">Done</button>

<button class="delete-btn" onclick="deleteTask(${index})">Delete</button>
</div>
`;

taskList.appendChild(li);

});

}

function toggleDone(index){

tasks[index].done = !tasks[index].done;

renderTasks();

}

function deleteTask(index){

tasks.splice(index,1);

renderTasks();

}

    tasks.push(newTask);
    saveTasks();
    renderTasks();
    taskForm.reset();
  });
}

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function renderTasks() {
  if (!taskList) return;

  taskList.innerHTML = "";

  let filteredTasks = tasks.filter((task) => {
    if (currentFilter === "completed") return task.completed;
    if (currentFilter === "pending") return !task.completed;
    return true;
  });

  const searchValue = searchInput ? searchInput.value.toLowerCase() : "";

  filteredTasks = filteredTasks.filter((task) => {
    return (
      task.title.toLowerCase().includes(searchValue) ||
      task.description.toLowerCase().includes(searchValue)
    );
  });

  if (filteredTasks.length === 0) {
    taskList.innerHTML = "<p>No tasks found.</p>";
  }

  filteredTasks.forEach((task) => {
    const taskCard = document.createElement("div");
    taskCard.className = `task-card ${task.priority.toLowerCase()} ${task.completed ? "completed" : ""}`;

    taskCard.innerHTML = `
      <h4>${task.title}</h4>
      <p>${task.description || "No description added."}</p>

      <div class="badges">
        <span class="badge priority">${task.priority} Priority</span>
        <span class="badge status ${task.completed ? "" : "pending"}">
          ${task.completed ? "Completed" : "Pending"}
        </span>
      </div>

      <p><strong>Deadline:</strong> ${formatDate(task.date)}</p>

      <div class="task-actions">
        <button class="complete-btn" onclick="toggleComplete(${task.id})">
          ${task.completed ? "Undo" : "Complete"}
        </button>
        <button class="edit-btn" onclick="editTask(${task.id})">Edit</button>
        <button class="delete-btn" onclick="deleteTask(${task.id})">Delete</button>
      </div>
    `;

    taskList.appendChild(taskCard);
  });

  updateProgress();
  updateCountdown();
  updateStats();
}

function toggleComplete(id) {
  tasks = tasks.map((task) =>
    task.id === id ? { ...task, completed: !task.completed } : task
  );
  saveTasks();
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  saveTasks();
  renderTasks();
}

function editTask(id) {
  if (!taskTitle || !taskDesc || !taskDate || !taskPriority) return;

  const task = tasks.find((item) => item.id === id);
  if (!task) return;

  taskTitle.value = task.title;
  taskDesc.value = task.description;
  taskDate.value = task.date;
  taskPriority.value = task.priority;

  tasks = tasks.filter((item) => item.id !== id);
  saveTasks();
  renderTasks();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function updateProgress() {
  if (!progressFill || !progressText) return;

  const completed = tasks.filter((task) => task.completed).length;
  const total = tasks.length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  progressFill.style.width = percent + "%";
  progressText.textContent = `${percent}% Completed`;
}

function updateCountdown() {
  if (!countdownText) return;

  const pending = tasks
    .filter((task) => !task.completed)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (pending.length === 0) {
    countdownText.textContent = "No upcoming deadlines";
    if (nearestDeadline) nearestDeadline.textContent = "No Task";
    return;
  }

  const nearest = pending[0];
  const today = new Date();
  const dueDate = new Date(nearest.date);
  const timeDiff = dueDate - today;
  const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

  if (daysLeft > 0) {
    countdownText.textContent = `${nearest.title} is due in ${daysLeft} day(s)`;
  } else if (daysLeft === 0) {
    countdownText.textContent = `${nearest.title} is due today`;
  } else {
    countdownText.textContent = `${nearest.title} deadline has passed`;
  }

  if (nearestDeadline) nearestDeadline.textContent = nearest.title;
}

function updateStats() {
  if (!totalTasks || !completedTasks || !pendingTasks) return;
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const pending = total - completed;

  totalTasks.textContent = total;
  completedTasks.textContent = completed;
  pendingTasks.textContent = pending;
}

function formatDate(dateString) {
  if (!dateString) return "No date";
  const options = { year: "numeric", month: "short", day: "numeric" };
  return new Date(dateString).toLocaleDateString("en-US", options);
}

if (searchInput) {
  searchInput.addEventListener("input", renderTasks);
}

document.querySelectorAll(".filterBtn").forEach((button) => {
  button.addEventListener("click", function () {
    document.querySelectorAll(".filterBtn").forEach((btn) => btn.classList.remove("active"));
    this.classList.add("active");
    currentFilter = this.dataset.filter;
    renderTasks();
  });
});
               
if (themeToggle) {
  themeToggle.addEventListener("click", function () {
    document.body.classList.toggle("dark");
    const icon = themeToggle.querySelector("i");

    if (document.body.classList.contains("dark")) {
      localStorage.setItem("theme", "dark");
      if (icon) icon.className = "fa-solid fa-sun";
    } else {
      localStorage.setItem("theme", "light");
      if (icon) icon.className = "fa-solid fa-moon";
    }
  });
}

function loadTheme() {
  const savedTheme = localStorage.getItem("theme");
  if (!themeToggle) return;

  const icon = themeToggle.querySelector("i");

  if (savedTheme === "dark") {
    
    document.body.classList.add("dark");
    if (icon) icon.className = "fa-solid fa-sun";
  } else {
    if (icon) icon.className = "fa-solid fa-moon";
  }
} 

if (resetTasksBtn) {
  resetTasksBtn.addEventListener("click", function () {
    const confirmReset = confirm("Do you want to delete all saved tasks?");
    if (confirmReset) {
      tasks = [];
      saveTasks();
      alert("All tasks deleted successfully.");
      window.location.href = "planner.html";
    }
  });
}
loadTheme();
renderTasks();2
