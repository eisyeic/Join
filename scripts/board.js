import {
  getDatabase,
  ref,
  onValue,
  update,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { app, auth } from "./firebase.js";
import { createTaskElement } from "./template.modul.js";

const db = getDatabase(app);
const columnMap = {
  todo: "to-do-column",
  inProgress: "in-progress-column", 
  awaitFeedback: "await-feedback-column",
  done: "done-column",
};

function setupAuthListener() {
  onAuthStateChanged(auth, (user) => {
    if (window.updateUserInitials) window.updateUserInitials(user);
  });
}

function loadTasksFromFirebase() {
  const tasksRef = ref(db, "tasks");
  onValue(tasksRef, (snapshot) => {
    const tasks = snapshot.val() || {};
    renderAllColumns(tasks);
  });
}

function renderAllColumns(tasks) {
  clearAllColumns();
  const sortedIds = Object.keys(tasks).sort((a, b) => (tasks[a].movedAt || 0) - (tasks[b].movedAt || 0));
  sortedIds.forEach((taskId) => renderTask(tasks[taskId], taskId));
  Object.keys(columnMap).forEach((k) => checkAndShowPlaceholder(columnMap[k]));
}

function clearAllColumns() {
  for (const key in columnMap) $(columnMap[key]).innerHTML = "";
}

function renderTask(task, taskId) {
  const targetColumnId = columnMap[task.column] || "to-do-column";
  const columnElement = $(targetColumnId);
  const taskElement = createTaskElement(task, taskId);
  if (!taskElement.id) taskElement.id = String(taskId);
  taskElement.setAttribute("draggable", "true");
  taskElement.addEventListener("dragstart", onTaskDragStart);
  columnElement.appendChild(taskElement);
}

const placeholderTexts = {
  "to-do-column": "No tasks to do",
  "in-progress-column": "No tasks in progressing",
  "await-feedback-column": "No tasks await feedback", 
  "done-column": "No tasks done",
};

function checkAndShowPlaceholder(columnId) {
  const column = $(columnId);
  const taskCards = Array.from(column.children).filter(el => !el.classList.contains("no-tasks"));
  const existing = column.querySelector(".no-tasks");
  if (taskCards.length === 0 && !existing) {
    const ph = document.createElement("div");
    ph.classList.add("no-tasks");
    ph.textContent = placeholderTexts[columnId] || "No tasks";
    column.appendChild(ph);
  } else if (taskCards.length > 0 && existing) {
    existing.remove();
  }
}

let IS_DRAGGING = false;

function onTaskDragStart(e) {
  const id = e.currentTarget?.id || e.target.id;
  if (id) {
    e.dataTransfer?.setData("text/plain", id);
    e.dataTransfer?.setData("text", id);
  }
  if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
  IS_DRAGGING = true;
  e.currentTarget?.addEventListener("dragend", () => {
    IS_DRAGGING = false;
    resetColumnBackgrounds();
  }, { once: true });
}

window.drag = onTaskDragStart;

function initDnDListeners() {
  document.querySelectorAll(".task-list").forEach((list) => {
    list.addEventListener("dragenter", (e) => {
      if (!IS_DRAGGING) return;
      e.preventDefault();
      highlightColumn(list);
    });
    list.addEventListener("dragover", (e) => {
      if (!IS_DRAGGING) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
      highlightColumn(list);
    });
    list.addEventListener("dragleave", (e) => {
      const elUnder = document.elementFromPoint(e.clientX, e.clientY);
      if (elUnder && list.contains(elUnder)) return;
      unhighlightColumn(list);
    });
  });
}

function highlightColumn(el) {
  document.querySelectorAll(".task-list").forEach(n => n.classList.remove("highlight-column"));
  el.classList.add("highlight-column");
}

function unhighlightColumn(el) {
  el.classList.remove("highlight-column");
}

function resetColumnBackgrounds() {
  document.querySelectorAll(".task-list").forEach(el => el.classList.remove("highlight-column"));
}

const DOM_TO_LOGICAL = {
  "to-do-column": "todo",
  "in-progress-column": "inProgress",
  "await-feedback-column": "awaitFeedback",
  "done-column": "done",
};

const LOGICAL_TO_DOM = {
  todo: "to-do-column",
  inProgress: "in-progress-column",
  awaitFeedback: "await-feedback-column",
  review: "await-feedback-column",
  done: "done-column",
};

window.drop = function handleDrop(event) {
  event.preventDefault();
  const taskId = event.dataTransfer?.getData("text/plain") || event.dataTransfer?.getData("text");
  if (!taskId) return;
  const taskElement = document.getElementById(taskId);
  const newColumn = event.currentTarget.closest(".task-list") || event.currentTarget;
  const oldColumn = taskElement?.parentElement;
  if (!taskElement || !newColumn || !oldColumn) return;
  newColumn.appendChild(taskElement);
  taskElement.dataset.column = DOM_TO_LOGICAL[newColumn.id] || taskElement.dataset.column;
  updateTaskColumn(taskId, newColumn.id);
  checkAndShowPlaceholder(oldColumn.id);
  checkAndShowPlaceholder(newColumn.id);
  IS_DRAGGING = false;
  resetColumnBackgrounds();
};

function updateTaskColumn(taskId, newColumnId) {
  const dbRef = ref(db, `tasks/${taskId}`);
  const newColumnValue = DOM_TO_LOGICAL[newColumnId] || "todo";
  return update(dbRef, { column: newColumnValue, movedAt: Date.now() }).catch(
    (err) => console.error("Fehler beim Aktualisieren der Spalte:", err)
  );
}

export function renderAssignedInitials(contacts = []) {
  const maxShown = 3;
  if (!Array.isArray(contacts) || contacts.length === 0) return "";
  const shown = contacts.slice(0, maxShown);
  const hasOverflow = contacts.length > maxShown;
  const overflowCount = hasOverflow ? contacts.length - (maxShown - 1) : 0;
  
  return shown.map((c, idx) => {
    const pos = ["first-initial", "second-initial", "third-initial"][idx] || "";
    if (hasOverflow && idx === maxShown - 1) {
      return `<div class="initial-circle ${pos} initial-circle--more" title="+${overflowCount}">+${overflowCount}</div>`;
    }
    const colorIdx = Number.isFinite(c?.colorIndex) ? c.colorIndex : 1;
    const initials = c?.initials || "";
    const title = c?.name || initials;
    return `<div class="initial-circle ${pos}" style="background-image: url(./assets/general_elements/icons/color${colorIdx}.svg)" title="${title}">${initials}</div>`;
  }).join("");
}

function debounce(fn, wait = 200) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

function setupSearchHandlers() {
  const searchInput = $("search-input");
  const searchButton = $("search-btn");
  if (!searchInput) return;
  const run = () => {
    const term = (searchInput.value || "").toLowerCase().trim();
    if (term.length >= 3) {
      filterTasks(term);
    } else {
      filterTasks("");
    }
  };
  const debouncedRun = debounce(run, 200);
  searchInput.addEventListener("input", debouncedRun);
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") run();
  });
  searchButton?.addEventListener("click", run);
}

function filterTasks(searchTerm) {
  const allTasks = document.querySelectorAll(".ticket");
  allTasks.forEach((taskEl) => {
    const title = taskEl.querySelector(".ticket-title")?.textContent.toLowerCase() || "";
    const description = taskEl.querySelector(".ticket-text")?.textContent.toLowerCase() || "";
    const matches = title.includes(searchTerm) || description.includes(searchTerm);
    taskEl.style.display = matches || searchTerm === "" ? "" : "none";
  });
  updateAllPlaceholders();
}

function updateAllPlaceholders() {
  for (const key in columnMap) updatePlaceholderForColumn(columnMap[key]);
}

function updatePlaceholderForColumn(columnId) {
  const column = document.getElementById(columnId);
  const visibleTasks = Array.from(column.querySelectorAll(".ticket")).filter(
    (el) => el.style.display !== "none"
  );
  const placeholder = column.querySelector(".no-tasks");
  if (visibleTasks.length === 0 && !placeholder) {
    const ph = document.createElement("div");
    ph.classList.add("no-tasks");
    ph.textContent = placeholderTexts[columnId] || "No tasks";
    column.appendChild(ph);
  } else if (visibleTasks.length > 0 && placeholder) {
    placeholder.remove();
  }
}

window.onTaskColumnChanged = function (taskId, targetLogical) {
  const taskEl = document.getElementById(String(taskId));
  if (!taskEl) return;
  const oldColumnEl = taskEl.closest(".task-list") || taskEl.parentElement;
  const newDomId = LOGICAL_TO_DOM[targetLogical] || targetLogical;
  const newColumnEl = document.getElementById(newDomId);
  if (!newColumnEl || !oldColumnEl) return;
  newColumnEl.appendChild(taskEl);
  taskEl.dataset.column = DOM_TO_LOGICAL[newColumnEl.id] || taskEl.dataset.column;
  updateTaskColumn(String(taskId), newColumnEl.id);
  checkAndShowPlaceholder(oldColumnEl.id);
  checkAndShowPlaceholder(newColumnEl.id);
  resetColumnBackgrounds();
};

function initBoard() {
  setupAuthListener();
  initDnDListeners();
  loadTasksFromFirebase();
  setupSearchHandlers();
}

document.addEventListener("DOMContentLoaded", initBoard);