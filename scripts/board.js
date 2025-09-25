import {
  getDatabase,
  ref,
  onValue,
  update,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { app, auth } from "./firebase.js";
import { createTaskElement } from "./template.module.js";

const MIN_SEARCH_CHARS = 3;
let currentSearchTerm = "";
const db = getDatabase(app);

function debounce(fn, wait = 200) {
  let t;
  return /** @type {F} */ ((...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  });
}

const columnMap = {
  todo: "to-do-column",
  inProgress: "in-progress-column",
  awaitFeedback: "await-feedback-column",
  done: "done-column",
};

onAuthStateChanged(auth, handleAuthChange);

function handleAuthChange(user) {
  if (window.updateUserInitials) window.updateUserInitials(user);
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
  const sortedIds = getSortedTaskIds(tasks);
  sortedIds.forEach((taskId) => renderTask(tasks[taskId], taskId));
  Object.keys(columnMap).forEach((k) => checkAndShowPlaceholder(columnMap[k]));
}

function clearAllColumns() {
  for (const key in columnMap) $(columnMap[key]).innerHTML = "";
}

function getSortedTaskIds(tasks) {
  return Object.keys(tasks).sort(
    (a, b) => (tasks[a].movedAt || 0) - (tasks[b].movedAt || 0)
  );
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
  const taskCards = Array.from(column.children).filter(
    (el) => !el.classList.contains("no-tasks")
  );
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
  const id = e.currentTarget?.id || /** @type {HTMLElement} */(e.target).id;
  if (id) {
    e.dataTransfer?.setData("text/plain", id);
    e.dataTransfer?.setData("text", id);
  }
  if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
  IS_DRAGGING = true;
  e.currentTarget?.addEventListener(
    "dragend",
    () => {
      IS_DRAGGING = false;
      resetColumnBackgrounds();
    },
    { once: true }
  );
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
  document
    .querySelectorAll(".task-list")
    .forEach((n) => n.classList.remove("highlight-column"));
  el.classList.add("highlight-column");
}

function unhighlightColumn(el) {
  el.classList.remove("highlight-column");
}

function resetColumnBackgrounds() {
  document
    .querySelectorAll(".task-list")
    .forEach((el) => el.classList.remove("highlight-column"));
}

const LOGICAL_TO_DOM = {
  todo: "to-do-column",
  inProgress: "in-progress-column",
  awaitFeedback: "await-feedback-column",
  review: "await-feedback-column",
  done: "done-column",
};

const DOM_TO_LOGICAL = {
  "to-do-column": "todo",
  "in-progress-column": "inProgress",
  "await-feedback-column": "awaitFeedback",
  "done-column": "done",
};

window.drop = function handleDrop(event) {
  event.preventDefault();
  const taskId =
    event.dataTransfer?.getData("text/plain") ||
    event.dataTransfer?.getData("text");
  if (!taskId) return;
  const taskElement = document.getElementById(taskId);
  const newColumn = (event.currentTarget).closest(".task-list") || (event.currentTarget);
  const oldColumn = taskElement?.parentElement;
  if (!taskElement || !newColumn || !oldColumn) return;
  newColumn.appendChild(taskElement);
  taskElement.dataset.column =
    DOM_TO_LOGICAL[newColumn.id] || taskElement.dataset.column;
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
  if (!isValidContacts(contacts)) return "";
  const shown = contacts.slice(0, maxShown);
  const hasOverflow = contacts.length > maxShown;
  const overflowCount = calcOverflow(contacts.length, maxShown);
  const ctx = { hasOverflow, overflowCount, maxShown };
  return shown.map((c, idx) => renderChip(c, idx, ctx)).join("");
}

function isValidContacts(contacts) {
  return Array.isArray(contacts) && contacts.length > 0;
}

function calcOverflow(len, maxShown) {
  return len > maxShown ? len - (maxShown - 1) : 0;
}

function getPositionClass(idx) {
  return ["first-initial", "second-initial", "third-initial"][idx] || "";
}

function renderOverflowBadge(count, positionClass) {
  return `
    <div class="initial-circle ${positionClass} initial-circle--more" title="+${count}">
      +${count}
    </div>
  `;
}

function renderInitialCircle(c, positionClass) {
  const colorIdx = Number.isFinite(c?.colorIndex) ? c.colorIndex : 0;
  const initials = c?.initials || "";
  const title = c?.name || initials;
  return `
    <div class="initial-circle ${positionClass}"
         style="background-image: url(../assets/icons/contact/color${colorIdx}.svg)"
         title="${title}">
      ${initials}
    </div>
  `;
}

function renderChip(c, idx, ctx) {
  const pos = getPositionClass(idx);
  if (ctx.hasOverflow && idx === ctx.maxShown - 1) {
    return renderOverflowBadge(ctx.overflowCount, pos);
  }
  return renderInitialCircle(c, pos);
}

document.addEventListener("DOMContentLoaded", onBoardDomContentLoaded);
function onBoardDomContentLoaded() {
  initDnDListeners();
  loadTasksFromFirebase();
  setupSearchHandlers();
}

function setupSearchHandlers() {
  const searchInput = $("search-input");
  const searchButton = $("search-btn");
  if (!searchInput) return;
  const run = () => {
    const term = (searchInput.value || "").toLowerCase().trim();
    if (term.length >= MIN_SEARCH_CHARS) {
      currentSearchTerm = term;
      filterTasks(term);
    } else {
      currentSearchTerm = "";
      filterTasks(currentSearchTerm);
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
  filterTaskVisibility(allTasks, searchTerm);
  updateAllPlaceholders();
}

function filterTaskVisibility(tasks, searchTerm) {
  tasks.forEach((taskEl) => {
    const title =
      taskEl.querySelector(".ticket-title")?.textContent.toLowerCase() || "";
    const description =
      taskEl.querySelector(".ticket-text")?.textContent.toLowerCase() || "";
    const matches = title.includes(searchTerm) || description.includes(searchTerm);
    (taskEl).style.display =
      matches || searchTerm === "" ? "" : "none";
  });
}

function updateAllPlaceholders() {
  for (const key in columnMap) updatePlaceholderForColumn(columnMap[key]);
}

function updatePlaceholderForColumn(columnId) {
  const column = document.getElementById(columnId);
  const visibleTasks = Array.from(column.querySelectorAll(".ticket")).filter(
    (el) => (el).style.display !== "none"
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
  taskEl.dataset.column =
    DOM_TO_LOGICAL[newColumnEl.id] || taskEl.dataset.column;
  updateTaskColumn(String(taskId), newColumnEl.id);
  checkAndShowPlaceholder(oldColumnEl.id);
  checkAndShowPlaceholder(newColumnEl.id);
  resetColumnBackgrounds();
};

