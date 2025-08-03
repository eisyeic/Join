import {
  getDatabase,
  update,
  ref,
  get,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { renderAssignedContacts, renderSubtasks } from "./template.modul.js";
import { getLabelClass } from "./board.js";

// show task overlay animated
window.showTaskOverlay = async function (taskId) {
  const db = getDatabase();
  const taskRef = ref(db, `tasks/${taskId}`);
  const snapshot = await get(taskRef);
  const task = snapshot.val();
  if (!task) return;

  task.id = taskId; // für später
  await normalizeSubtasks(taskId, task); // neu!
  fillTaskOverlay(task);
  
  const bg = document.getElementById("task-overlay-bg");
  const overlay = document.getElementById("task-overlay");
  if (!bg || !overlay) return;
  bg.classList.remove("d-none");
  overlay.classList.remove("animate-out");
  overlay.classList.add("animate-in");
};

// hide task overlay animated
window.hideOverlay = function () {
  const bg = document.getElementById("task-overlay-bg");
  const overlay = document.getElementById("task-overlay");
  if (!bg || !overlay) return;
  overlay.classList.remove("animate-in");
  overlay.classList.add("animate-out");
  setTimeout(() => {
    bg.classList.add("d-none");
    overlay.classList.remove("animate-out");
  }, 300);
};

// fill task
function fillTaskOverlay(task) {
  renderCategory(task.category);
  renderTitleDescDate(task);
  renderPriority(task.priority);
  renderAssignedContacts(task);
  renderSubtasks(task);
  setupSubtaskListeners(task);
}

// render category of task
function renderCategory(category) {
  let el = $("overlay-user-story");
  el.textContent = category || "";
  el.className = "";
  el.classList.add(getLabelClass(category));
}

// render all task data
function renderTitleDescDate(task) {
  $("overlay-title").innerHTML = task.title || "";
  $("overlay-description").textContent = task.description || "";
  $("overlay-due-date").textContent = task.dueDate || "";
}

// render priority in task overlay
export function renderPriority(priority) {
  let icons = {
    urgent: "./assets/icons/board/Urgent.svg",
    medium: "./assets/icons/board/Medium.svg",
    low: "./assets/icons/board/Low.svg",
  };
  $("overlay-priority-text").textContent = capitalize(priority);
  $("overlay-priority-icon").src = icons[priority] || "";
}

// capitalize first letter function
function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function setupSubtaskListeners(task) {
  task.subtasks?.forEach((_, i) => {
    const checkbox = $(`subtask${i}`);
    const label = checkbox?.nextElementSibling;
    const img = label?.querySelector("img");
    if (!checkbox || !label || !img) return;
    attachSubtaskEvents(checkbox, label, img, task.id, i);
  });
}

function attachSubtaskEvents(checkbox, label, img, taskId, i) {
  const updateImage = () => {
    const hover = label.matches(":hover");
    if (checkbox.checked && hover) img.src = "./assets/icons/add_task/checked_hover.svg";
    else if (checkbox.checked) img.src = "./assets/icons/add_task/check_checked.svg";
    else if (hover) img.src = "./assets/icons/add_task/check_default_hover.svg";
    else img.src = "./assets/icons/add_task/check_default.svg";
  };

  checkbox.addEventListener("change", () => {
    label.classList.toggle("checked", checkbox.checked);
    updateImage();
    if (typeof updateSubtaskStatus === "function") {
      updateSubtaskStatus(taskId, i, checkbox.checked);
    }
  });

  label.addEventListener("mouseenter", updateImage);
  label.addEventListener("mouseleave", updateImage);
}


async function normalizeSubtasks(taskId, task) {
  if (!Array.isArray(task.subtasks)) return;
  let normalized = task.subtasks.map((st) =>
    typeof st === "string" ? { name: st, checked: false } : st
  );
  let db = getDatabase();
  let taskRef = ref(db, `tasks/${taskId}`);
  await update(taskRef, { subtasks: normalized });
  task.subtasks = normalized;
}

export async function updateSubtaskStatus(taskId, subtaskIndex, isChecked) {
  let db = getDatabase();
  let taskRef = ref(db, `tasks/${taskId}`);
  let snapshot = await get(taskRef);
  let task = snapshot.val();
  if (!task || !task.subtasks || !task.subtasks[subtaskIndex]) return;
  let normalized = task.subtasks.map((st) =>
    typeof st === "string" ? { name: st, checked: false } : st
  );
  normalized[subtaskIndex].checked = isChecked;
  await update(taskRef, { subtasks: normalized });
}


