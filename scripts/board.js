/**
 * @file Board – renders columns, drag & drop, search, and placeholders.
 * All functions are short (≤14 Zeilen) und haben eine Aufgabe. JSDoc überall.
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

/**
 * Initialisiert Board: Auth, DnD, Firebase-Stream, Suche
 * @returns {void}
 */
function initBoard() {
  setupAllBoardComponents();
}

/**
 * Setup all board components
 */
function setupAllBoardComponents() {
  setupAuthListener();
  initDnDListeners();
  loadTasksFromFirebase();
  setupSearchHandlers();
}

/** Startet Initialisierung, wenn DOM geladen ist. */
document.addEventListener("DOMContentLoaded", initBoard);

/**
 * Auth-Listener: setzt User-Initialen, wenn verfügbar.
 * @returns {void}
 */
function setupAuthListener() {
  onAuthStateChanged(auth, (user) => {
    if (window.updateUserInitials) window.updateUserInitials(user);
  });
}

/**
 * Lädt Tasks aus Firebase und rendert alle Spalten.
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
 * Liefert Task-IDs sortiert nach movedAt (aufsteigend, Fallback 0).
 * @param {Record<string, any>} tasks
 * @returns {string[]}
 */
function getSortedTaskIds(tasks) {
  return Object.keys(tasks).sort((a, b) => (tasks[a].movedAt || 0) - (tasks[b].movedAt || 0));
}

/**
 * Rendert alle Spalten mit Tasks
 * @param {Record<string, any>} tasks
 * @returns {void}
 */
function renderAllColumns(tasks) {
  prepareColumns();
  renderAllTasks(tasks);
  updateAllPlaceholders();
}

/**
 * Prepare columns for rendering
 */
function prepareColumns() {
  clearAllColumns();
}

/**
 * Render all tasks
 * @param {Record<string, any>} tasks
 */
function renderAllTasks(tasks) {
  getSortedTaskIds(tasks).forEach((taskId) => renderTask(tasks[taskId], taskId));
}

/**
 * Update all placeholders
 */
function updateAllPlaceholders() {
  Object.keys(columnMap).forEach((k) => checkAndShowPlaceholder(columnMap[k]));
}

/**
 * Leert alle Board-Spalten.
 * @returns {void}
 */
function clearAllColumns() {
  for (const key in columnMap) $(columnMap[key]).innerHTML = "";
}

/**
 * Baut ein draggable Task-Element
 * @param {any} task
 * @param {string} taskId
 * @returns {HTMLElement}
 */
function buildTaskElement(task, taskId) {
  const el = createTaskElement(task, taskId);
  setupTaskElement(el, taskId);
  return el;
}

/**
 * Setup task element properties
 * @param {HTMLElement} el
 * @param {string} taskId
 */
function setupTaskElement(el, taskId) {
  ensureElementId(el, taskId);
  makeDraggable(el);
  attachDragHandler(el);
}

/**
 * Ensure element has ID
 * @param {HTMLElement} el
 * @param {string} taskId
 */
function ensureElementId(el, taskId) {
  if (!el.id) el.id = String(taskId);
}

/**
 * Make element draggable
 * @param {HTMLElement} el
 */
function makeDraggable(el) {
  el.setAttribute("draggable", "true");
}

/**
 * Attach drag handler
 * @param {HTMLElement} el
 */
function attachDragHandler(el) {
  el.addEventListener("dragstart", onTaskDragStart);
}

/**
 * Rendert einen Task in die passende Spalte.
 * @param {any} task
 * @param {string} taskId
 * @returns {void}
 */
function renderTask(task, taskId) {
  const targetColumnId = columnMap[task.column] || "to-do-column";
  $(targetColumnId).appendChild(buildTaskElement(task, taskId));
}

/** @type {Record<string,string>} Platzhalter-Texte pro Spalte */
const placeholderTexts = {
  "to-do-column": "No tasks to do",
  "in-progress-column": "No tasks in progressing",
  "await-feedback-column": "No tasks await feedback", 
  "done-column": "No tasks done",
};

/**
 * Anzahl realer Task-Karten in einer Spalte (ohne Placeholder).
 * @param {HTMLElement} column
 * @returns {number}
 */
function countTasks(column) {
  return Array.from(column.children).filter((el) => !el.classList.contains("no-tasks")).length;
}

/**
 * Fügt einen Placeholder in die Spalte ein.
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
 * Stellt sicher, dass bei leerer Spalte ein Placeholder gezeigt wird
 * @param {string} columnId
 * @returns {void}
 */
function checkAndShowPlaceholder(columnId) {
  const column = $(columnId);
  const placeholderState = getPlaceholderState(column);
  updatePlaceholderVisibility(column, columnId, placeholderState);
}

/**
 * Get placeholder state
 * @param {HTMLElement} column
 * @returns {Object}
 */
function getPlaceholderState(column) {
  return {
    existing: column.querySelector(".no-tasks"),
    count: countTasks(column)
  };
}

/**
 * Update placeholder visibility
 * @param {HTMLElement} column
 * @param {string} columnId
 * @param {Object} state
 */
function updatePlaceholderVisibility(column, columnId, state) {
  if (shouldShowPlaceholder(state)) {
    appendPlaceholder(column, columnId);
  } else if (shouldHidePlaceholder(state)) {
    state.existing.remove();
  }
}

/**
 * Check if placeholder should be shown
 * @param {Object} state
 * @returns {boolean}
 */
function shouldShowPlaceholder(state) {
  return state.count === 0 && !state.existing;
}

/**
 * Check if placeholder should be hidden
 * @param {Object} state
 * @returns {boolean}
 */
function shouldHidePlaceholder(state) {
  return state.count > 0 && state.existing;
}

let IS_DRAGGING = false;

/**
 * Drag-End: Status zurücksetzen und Highlights entfernen.
 * @param {Event} _
 * @returns {void}
 */
function onDragEndFinalize(_) {
  IS_DRAGGING = false;
  resetColumnBackgrounds();
}

/**
 * Drag-Start: ID setzen und Move-Effekt erlauben
 * @param {DragEvent} e
 * @returns {void}
 */
function onTaskDragStart(e) {
  const id = getElementId(e);
  setupDragTransfer(e, id);
  initializeDragState(e);
}

/**
 * Get element ID from event
 * @param {DragEvent} e
 * @returns {string}
 */
function getElementId(e) {
  return e.currentTarget?.id || e.target.id;
}

/**
 * Setup drag transfer data
 * @param {DragEvent} e
 * @param {string} id
 */
function setupDragTransfer(e, id) {
  if (!id || !e.dataTransfer) return;
  
  e.dataTransfer.setData("text/plain", id);
  e.dataTransfer.setData("text", id);
  e.dataTransfer.effectAllowed = "move";
}

/**
 * Initialize drag state
 * @param {DragEvent} e
 */
function initializeDragState(e) {
  IS_DRAGGING = true;
  e.currentTarget?.addEventListener("dragend", onDragEndFinalize, { once: true });
}

window.drag = onTaskDragStart;

/**
 * DnD-Events für eine Spalte.
 * @param {HTMLElement} list
 * @returns {void}
 */
function attachDnDToList(list) {
  list.addEventListener("dragenter", (e) => {
    if (!IS_DRAGGING) return; e.preventDefault(); highlightColumn(list);
  });
  list.addEventListener("dragover", (e) => {
    if (!IS_DRAGGING) return; e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = "move"; highlightColumn(list);
  });
  list.addEventListener("dragleave", (e) => {
    const elUnder = document.elementFromPoint(e.clientX, e.clientY);
    if (elUnder && list.contains(elUnder)) return; unhighlightColumn(list);
  });
}

/** Initialisiert Drag&Drop-Listener für alle Spalten. */
function initDnDListeners() {
  document.querySelectorAll(".task-list").forEach((list) => attachDnDToList(list));
}

/** Markiert eine Spalte visuell als Drop-Ziel. */
function highlightColumn(el) {
  document.querySelectorAll(".task-list").forEach(n => n.classList.remove("highlight-column"));
  el.classList.add("highlight-column");
}

/** Entfernt die Hervorhebung von einer Spalte. */
function unhighlightColumn(el) {
  el.classList.remove("highlight-column");
}

/** Entfernt Hervorhebung von allen Spalten. */
function resetColumnBackgrounds() {
  document.querySelectorAll(".task-list").forEach(el => el.classList.remove("highlight-column"));
}

/** Map DOM-IDs → logische Spaltennamen. */
const DOM_TO_LOGICAL = {
  "to-do-column": "todo",
  "in-progress-column": "inProgress",
  "await-feedback-column": "awaitFeedback",
  "done-column": "done",
};

/** Map logische Spaltennamen → DOM-IDs. */
const LOGICAL_TO_DOM = {
  todo: "to-do-column",
  inProgress: "in-progress-column",
  awaitFeedback: "await-feedback-column",
  review: "await-feedback-column",
  done: "done-column",
};

/**
 * Ermittelt Kontext eines Drop-Events.
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
 * Verschiebt Task-Element ins Ziel und aktualisiert dataset.column.
 * @param {HTMLElement} taskElement
 * @param {HTMLElement} newColumn
 * @returns {void}
 */
function moveTaskDom(taskElement, newColumn) {
  newColumn.appendChild(taskElement);
  taskElement.dataset.column = DOM_TO_LOGICAL[newColumn.id] || taskElement.dataset.column;
}

/**
 * Finalisiert Drop: DB-Update, Placeholder & Visuals aktualisieren
 * @param {string} taskId
 * @param {HTMLElement} oldColumn
 * @param {HTMLElement} newColumn
 * @returns {void}
 */
function finalizeDrop(taskId, oldColumn, newColumn) {
  updateDatabase(taskId, newColumn.id);
  updatePlaceholders(oldColumn.id, newColumn.id);
  resetDragState();
}

/**
 * Update database
 * @param {string} taskId
 * @param {string} newColumnId
 */
function updateDatabase(taskId, newColumnId) {
  updateTaskColumn(taskId, newColumnId);
}

/**
 * Update placeholders for both columns
 * @param {string} oldColumnId
 * @param {string} newColumnId
 */
function updatePlaceholders(oldColumnId, newColumnId) {
  checkAndShowPlaceholder(oldColumnId);
  checkAndShowPlaceholder(newColumnId);
}

/**
 * Reset drag state
 */
function resetDragState() {
  IS_DRAGGING = false;
  resetColumnBackgrounds();
}

window.drop = function handleDrop(event) {
  event.preventDefault();
  const { taskId, taskElement, newColumn, oldColumn } = getDropContext(event);
  if (!(taskId && taskElement && newColumn && oldColumn)) return;
  moveTaskDom(taskElement, newColumn);
  finalizeDrop(String(taskId), oldColumn, newColumn);
};

/**
 * Aktualisiert die Spalte eines Tasks in Firebase und setzt movedAt.
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
 * Ermittelt Overflow-Anzahl für +N-Badge.
 * @param {number} total
 * @param {number} maxShown
 * @returns {number}
 */
function computeOverflow(total, maxShown) {
  return total > maxShown ? total - (maxShown - 1) : 0;
}

/**
 * Baut HTML für ein +N-Kreissymbol.
 * @param {number} n
 * @param {string} posClass
 * @returns {string}
 */
function buildMoreCircle(n, posClass) {
  return `<div class="initial-circle ${posClass} initial-circle--more" title="+${n}">+${n}</div>`;
}

/**
 * Baut HTML für einen Initialen-Kreis.
 * @param {{initials?:string,name?:string,colorIndex?:number}} c
 * @param {string} posClass
 * @returns {string}
 */
function buildInitialsCircle(c, posClass) {
  const colorIdx = Number.isFinite(c?.colorIndex) ? c.colorIndex : 1;
  const initials = c?.initials || "";
  const title = c?.name || initials;
  return `<div class="initial-circle ${posClass}" style="background-image: url(./assets/general_elements/icons/color${colorIdx}.svg)" title="${title}">${initials}</div>`;
}

/**
 * Rendert bis zu 3 Initialen-Kreise (+N als dritter, wenn Overflow)
 * @param {Array<{initials?:string,name?:string,colorIndex?:number}>} contacts
 * @returns {string}
 */
export function renderAssignedInitials(contacts = []) {
  if (!isValidContactsArray(contacts)) return "";
  
  return buildInitialsHTML(contacts);
}

/**
 * Check if contacts array is valid
 * @param {any} contacts
 * @returns {boolean}
 */
function isValidContactsArray(contacts) {
  return Array.isArray(contacts) && contacts.length > 0;
}

/**
 * Build initials HTML
 * @param {Array} contacts
 * @returns {string}
 */
function buildInitialsHTML(contacts) {
  const maxShown = 3;
  const shown = contacts.slice(0, maxShown);
  const overflowCount = computeOverflow(contacts.length, maxShown);
  
  return shown.map((c, idx) => {
    const pos = getPositionClass(idx);
    return shouldShowOverflow(overflowCount, idx, maxShown) 
      ? buildMoreCircle(overflowCount, pos)
      : buildInitialsCircle(c, pos);
  }).join("");
}

/**
 * Get position class for index
 * @param {number} idx
 * @returns {string}
 */
function getPositionClass(idx) {
  return ["first-initial", "second-initial", "third-initial"][idx] || "";
}

/**
 * Check if overflow should be shown
 * @param {number} overflowCount
 * @param {number} idx
 * @param {number} maxShown
 * @returns {boolean}
 */
function shouldShowOverflow(overflowCount, idx, maxShown) {
  return overflowCount && idx === maxShown - 1;
}

/**
 * Debounce: wartet `wait` ms nach letztem Aufruf.
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
 * Führt Suche aus (ab 3 Zeichen), sonst reset.
 * @param {HTMLInputElement} input
 * @returns {void}
 */
function runSearch(input) {
  const term = (input.value || "").toLowerCase().trim();
  filterTasks(term.length >= 3 ? term : "");
}

/**
 * Bindet Input- und Button-Events für die Suche
 * @param {HTMLInputElement} input
 * @param {HTMLElement|null} btn
 * @returns {void}
 */
function bindSearchEvents(input, btn) {
  const debouncedRun = createDebouncedSearch(input);
  attachInputEvents(input, debouncedRun);
  attachButtonEvent(btn, input);
}

/**
 * Create debounced search function
 * @param {HTMLInputElement} input
 * @returns {Function}
 */
function createDebouncedSearch(input) {
  return debounce(() => runSearch(input), 200);
}

/**
 * Attach input events
 * @param {HTMLInputElement} input
 * @param {Function} debouncedRun
 */
function attachInputEvents(input, debouncedRun) {
  input.addEventListener("input", debouncedRun);
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") runSearch(input);
  });
}

/**
 * Attach button event
 * @param {HTMLElement|null} btn
 * @param {HTMLInputElement} input
 */
function attachButtonEvent(btn, input) {
  btn?.addEventListener("click", () => runSearch(input));
}

/**
 * Initialisiert die Suche (debounced + Enter-Key).
 * @returns {void}
 */
function setupSearchHandlers() {
  const searchInput = $("search-input");
  if (!searchInput) return;
  bindSearchEvents(searchInput, $("search-btn"));
}