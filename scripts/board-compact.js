/**
 * @file Board (compact) — renders columns, drag & drop, search, and placeholders.
 * Functions are kept short (≤14 lines) and single-purpose, with JSDoc annotations.
 */
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

/** Start the app when DOM is ready. */
document.addEventListener("DOMContentLoaded", initBoard);

/**
 * Listen for auth changes and project user initials if available.
 * @returns {void}
 */
function setupAuthListener() {
  onAuthStateChanged(auth, (user) => {
    if (window.updateUserInitials) window.updateUserInitials(user);
  });
}

/**
 * Load tasks from Firebase and render them.
 * @returns {void}
 */
function loadTasksFromFirebase() {
  const tasksRef = ref(db, "tasks");
  onValue(tasksRef, (snapshot) => {
    const tasks = snapshot.val() || {};
    renderAllColumns(tasks);
  });
}

/**
 * Return task ids sorted by their movedAt value (ascending, fallback 0).
 * @param {Record<string, any>} tasks
 * @returns {string[]}
 */
function getSortedTaskIds(tasks) {
  return Object.keys(tasks).sort((a, b) => (tasks[a].movedAt || 0) - (tasks[b].movedAt || 0));
}

function renderAllColumns(tasks) {
  clearAllColumns();
  getSortedTaskIds(tasks).forEach((taskId) => renderTask(tasks[taskId], taskId));
  Object.keys(columnMap).forEach((k) => checkAndShowPlaceholder(columnMap[k]));
}

/**
 * Clear all board columns.
 * @returns {void}
 */
function clearAllColumns() {
  for (const key in columnMap) $(columnMap[key]).innerHTML = "";
}

/**
 * Create a draggable DOM element for a task.
 * @param {any} task
 * @param {string} taskId
 * @returns {HTMLElement}
 */
function buildTaskElement(task, taskId) {
  const el = createTaskElement(task, taskId);
  if (!el.id) el.id = String(taskId);
  el.setAttribute("draggable", "true");
  el.addEventListener("dragstart", onTaskDragStart);
  return el;
}

/**
 * Render a single task into its column.
 * @param {any} task
 * @param {string} taskId
 * @returns {void}
 */
function renderTask(task, taskId) {
  const targetColumnId = columnMap[task.column] || "to-do-column";
  $(targetColumnId).appendChild(buildTaskElement(task, taskId));
}

/**
 * Placeholder texts keyed by column DOM id.
 * @type {Record<string,string>}
 */
const placeholderTexts = {
  "to-do-column": "No tasks to do",
  "in-progress-column": "No tasks in progressing",
  "await-feedback-column": "No tasks await feedback", 
  "done-column": "No tasks done",
};

/**
 * Count real task cards in a column (excluding placeholder).
 * @param {HTMLElement} column
 * @returns {number}
 */
function countTasks(column) {
  return Array.from(column.children).filter((el) => !el.classList.contains("no-tasks")).length;
}

/**
 * Append a placeholder to a column.
 * @param {HTMLElement} column
 * @param {string} columnId
 * @returns {void}
 */
function appendPlaceholder(column, columnId) {
  const ph = document.createElement("div");
  ph.classList.add("no-tasks");
  ph.textContent = placeholderTexts[columnId] || "No tasks";
  column.appendChild(ph);
}

/**
 * Check and show/hide placeholder in a column based on tasks.
 * @param {string} columnId
 * @returns {void}
 */
function checkAndShowPlaceholder(columnId) {
  const column = $(columnId);
  const existing = column.querySelector(".no-tasks");
  const count = countTasks(column);
  if (count === 0 && !existing) appendPlaceholder(column, columnId);
  else if (count > 0 && existing) existing.remove();
}

/**
 * Resolve task id and involved columns for a drop event.
 * @param {DragEvent} event
 * @returns {{taskId:string|null, taskElement:HTMLElement|null, newColumn:HTMLElement|null, oldColumn:HTMLElement|null}}
 */
function getDropContext(event) {
  const taskId = event.dataTransfer?.getData("text/plain") || event.dataTransfer?.getData("text") || null;
  const taskElement = taskId ? document.getElementById(taskId) : null;
  const newColumn = (event.currentTarget.closest?.(".task-list") || event.currentTarget);
  const oldColumn = taskElement?.parentElement || null;
  return { taskId, taskElement, newColumn, oldColumn };
}

/**
 * Move task element to the new column and update dataset column value.
 * @param {HTMLElement} taskElement
 * @param {HTMLElement} newColumn
 * @returns {void}
 */
function moveTaskDom(taskElement, newColumn) {
  newColumn.appendChild(taskElement);
  taskElement.dataset.column = DOM_TO_LOGICAL[newColumn.id] || taskElement.dataset.column;
}

/**
 * Update a task's column in Firebase and set movedAt timestamp.
 * @param {string} taskId
 * @param {string} newColumnId
 * @returns {Promise<void>}
 */
function updateTaskColumn(taskId, newColumnId) {
  const dbRef = ref(db, `tasks/${taskId}`);
  const newColumnValue = DOM_TO_LOGICAL[newColumnId] || "todo";
  return update(dbRef, { column: newColumnValue, movedAt: Date.now() }).catch(
    (err) => console.error("Fehler beim Aktualisieren der Spalte:", err)
  );
}

/**
 * Determine how many overflow contacts should be shown in the +N bubble.
 * @param {number} total
 * @param {number} maxShown
 * @returns {number}
 */
function computeOverflow(total, maxShown) {
  return total > maxShown ? total - (maxShown - 1) : 0;
}

/**
 * Build HTML for an overflow "+N" circle.
 * @param {number} n
 * @param {string} posClass
 * @returns {string}
 */
function buildMoreCircle(n, posClass) {
  return `<div class="initial-circle ${posClass} initial-circle--more" title="+${n}">+${n}</div>`;
}

/**
 * Build HTML for a regular initials circle.
 * @param {{initials?:string,name?:string,colorIndex?:number}} c
 * @param {string} posClass
 * @returns {string}
 */
function buildInitialsCircle(c, posClass) {
  const colorIdx = Number.isFinite(c?.colorIndex) ? c.colorIndex : 0;
  const initials = c?.initials || "";
  const title = c?.name || initials;
  return `<div class="initial-circle ${posClass}" style="background-image: url(../assets/icons/contact/color${colorIdx}.svg)" title="${title}">${initials}</div>`;
}

export function renderAssignedInitials(contacts = []) {
  const maxShown = 3;
  if (!Array.isArray(contacts) || contacts.length === 0) return "";
  const shown = contacts.slice(0, maxShown);
  const hasOverflow = contacts.length > maxShown;
  const overflowCount = computeOverflow(contacts.length, maxShown);
  return shown.map((c, idx) => {
    const pos = ["first-initial", "second-initial", "third-initial"][idx] || "";
    if (hasOverflow && idx === maxShown - 1) return buildMoreCircle(overflowCount, pos);
    return buildInitialsCircle(c, pos);
  }).join("");
}

/**
 * Debounce a function by waiting `wait` ms after the last call.
 * @template {(...a:any[])=>any} F
 * @param {F} fn
 * @param {number} [wait=200]
 * @returns {F}
 */
function debounce(fn, wait = 200) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

/**
 * Run the search: filter tasks by the current search input value.
 * @param {HTMLInputElement} input
 * @returns {void}
 */
function runSearch(input) {
  const term = (input.value || "").toLowerCase().trim();
  filterTasks(term.length >= 3 ? term : "");
}

/**
 * Bind events for search input and button.
 * @param {HTMLInputElement} input
 * @param {HTMLElement|null} btn
 * @returns {void}
 */
function bindSearchEvents(input, btn) {
  const debouncedRun = debounce(() => runSearch(input), 200);
  input.addEventListener("input", debouncedRun);
  input.addEventListener("keypress", (e) => { if (e.key === "Enter") runSearch(input); });
  btn?.addEventListener("click", () => runSearch(input));
}

/**
 * Initialize search input with debounced filtering and Enter key support.
 * @returns {void}
 */
function setupSearchHandlers() {
  const searchInput = $("search-input");
  if (!searchInput) return;
  bindSearchEvents(searchInput, $("search-btn"));
}

/**
 * Show only tasks whose title or description includes the search term.
 * @param {string} searchTerm
 * @returns {void}
 */
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

/**
 * Update placeholders in all columns after a filter change.
 * @returns {void}
 */
function updateAllPlaceholders() {
  for (const key in columnMap) updatePlaceholderForColumn(columnMap[key]);
}

/**
 * Update placeholder in a single column, based on visible tasks.
 * @param {string} columnId
 * @returns {void}
 */
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

/**
 * Move a task DOM node to a target column by logical id.
 * @param {string} taskId
 * @param {string} targetLogical
 * @returns {{taskEl:HTMLElement|null, oldColumnEl:HTMLElement|null, newColumnEl:HTMLElement|null}}
 */
function moveTaskDomByLogical(taskId, targetLogical) {
  const taskEl = document.getElementById(String(taskId));
  const oldColumnEl = taskEl?.closest(".task-list") || taskEl?.parentElement || null;
  const newDomId = LOGICAL_TO_DOM[targetLogical] || targetLogical;
  const newColumnEl = document.getElementById(newDomId);
  if (taskEl && newColumnEl) newColumnEl.appendChild(taskEl);
  return { taskEl, oldColumnEl, newColumnEl };
}

/**
 * After moving a task, sync attributes, db, and placeholders.
 * @param {string} taskId
 * @param {HTMLElement|null} oldColumnEl
 * @param {HTMLElement|null} newColumnEl
 * @returns {void}
 */
function syncAfterMove(taskId, oldColumnEl, newColumnEl) {
  if (!(oldColumnEl && newColumnEl)) return;
  const domId = newColumnEl.id;
  const logical = DOM_TO_LOGICAL[domId];
  const el = document.getElementById(String(taskId));
  if (el && logical) el.dataset.column = logical;
  updateTaskColumn(String(taskId), domId);
  checkAndShowPlaceholder(oldColumnEl.id);
  checkAndShowPlaceholder(newColumnEl.id);
  resetColumnBackgrounds();
}

/**
 * Public API: move a task to a new logical column and persist it.
 * @param {string|number} taskId
 * @param {string} targetLogical
 * @returns {void}
 */
window.onTaskColumnChanged = function (taskId, targetLogical) {
  const { oldColumnEl, newColumnEl } = moveTaskDomByLogical(String(taskId), targetLogical);
  syncAfterMove(String(taskId), oldColumnEl, newColumnEl);
};

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

/**
 * Initialize the board: auth, DnD, Firebase, and search.
 * @returns {void}
 */
function initBoard() {
  setupAuthListener();
  initDnDListeners();
  loadTasksFromFirebase();
  setupSearchHandlers();
}