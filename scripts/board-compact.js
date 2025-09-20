/**
 * @file Board (compact) — renders columns, drag & drop, search, and placeholders.
 * All functions follow Single Responsibility Principle.
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

/** Start the app when DOM is ready. */
document.addEventListener("DOMContentLoaded", initBoard);

/**
 * Handle auth state change.
 * @param {any} user
 * @returns {void}
 */
function handleAuthChange(user) {
  if (window.updateUserInitials) {
    window.updateUserInitials(user);
  }
}

/**
 * Setup authentication state listener.
 * @returns {void}
 */
function setupAuthListener() {
  onAuthStateChanged(auth, handleAuthChange);
}

/**
 * Get tasks reference from Firebase.
 * @returns {any}
 */
function getTasksRef() {
  return ref(db, "tasks");
}

/**
 * Handle Firebase data snapshot.
 * @param {any} snapshot
 * @returns {void}
 */
function handleTasksSnapshot(snapshot) {
  const tasks = snapshot.val() || {};
  renderAllColumns(tasks);
}

/**
 * Load tasks from Firebase and render them.
 * @returns {void}
 */
function loadTasksFromFirebase() {
  const tasksRef = getTasksRef();
  onValue(tasksRef, handleTasksSnapshot);
}

/**
 * Get movedAt timestamp for task.
 * @param {any} task
 * @returns {number}
 */
function getTaskMovedAt(task) {
  return task.movedAt || 0;
}

/**
 * Sort task IDs by movedAt timestamp.
 * @param {Record<string, any>} tasks
 * @returns {string[]}
 */
function getSortedTaskIds(tasks) {
  return Object.keys(tasks).sort((a, b) => 
    getTaskMovedAt(tasks[a]) - getTaskMovedAt(tasks[b])
  );
}

/**
 * Render all tasks in sorted order.
 * @param {Record<string, any>} tasks
 * @param {string[]} taskIds
 * @returns {void}
 */
function renderSortedTasks(tasks, taskIds) {
  taskIds.forEach((taskId) => renderTask(tasks[taskId], taskId));
}

/**
 * Update placeholders for all columns.
 * @returns {void}
 */
function updateAllColumnPlaceholders() {
  Object.keys(columnMap).forEach((k) => checkAndShowPlaceholder(columnMap[k]));
}

/**
 * Render all columns with tasks and placeholders.
 * @param {Record<string, any>} tasks
 * @returns {void}
 */
function renderAllColumns(tasks) {
  clearAllColumns();
  const sortedIds = getSortedTaskIds(tasks);
  renderSortedTasks(tasks, sortedIds);
  updateAllColumnPlaceholders();
}

/**
 * Clear single column content.
 * @param {string} columnId
 * @returns {void}
 */
function clearColumn(columnId) {
  $(columnId).innerHTML = "";
}

/**
 * Clear all board columns.
 * @returns {void}
 */
function clearAllColumns() {
  for (const key in columnMap) {
    clearColumn(columnMap[key]);
  }
}

/**
 * Set element ID if not present.
 * @param {HTMLElement} el
 * @param {string} taskId
 * @returns {void}
 */
function ensureElementId(el, taskId) {
  if (!el.id) {
    el.id = String(taskId);
  }
}

/**
 * Make element draggable.
 * @param {HTMLElement} el
 * @returns {void}
 */
function makeDraggable(el) {
  el.setAttribute("draggable", "true");
}

/**
 * Add drag start listener.
 * @param {HTMLElement} el
 * @returns {void}
 */
function addDragStartListener(el) {
  el.addEventListener("dragstart", onTaskDragStart);
}

/**
 * Create draggable DOM element for task.
 * @param {any} task
 * @param {string} taskId
 * @returns {HTMLElement}
 */
function buildTaskElement(task, taskId) {
  const el = createTaskElement(task, taskId);
  ensureElementId(el, taskId);
  makeDraggable(el);
  addDragStartListener(el);
  return el;
}

/**
 * Get target column ID for task.
 * @param {any} task
 * @returns {string}
 */
function getTargetColumnId(task) {
  return columnMap[task.column] || "to-do-column";
}

/**
 * Append task element to column.
 * @param {string} columnId
 * @param {HTMLElement} taskElement
 * @returns {void}
 */
function appendTaskToColumn(columnId, taskElement) {
  $(columnId).appendChild(taskElement);
}

/**
 * Render single task into its column.
 * @param {any} task
 * @param {string} taskId
 * @returns {void}
 */
function renderTask(task, taskId) {
  const targetColumnId = getTargetColumnId(task);
  const taskElement = buildTaskElement(task, taskId);
  appendTaskToColumn(targetColumnId, taskElement);
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
 * Check if element is not a placeholder.
 * @param {Element} el
 * @returns {boolean}
 */
function isNotPlaceholder(el) {
  return !el.classList.contains("no-tasks");
}

/**
 * Count real task cards in column.
 * @param {HTMLElement} column
 * @returns {number}
 */
function countTasks(column) {
  return Array.from(column.children).filter(isNotPlaceholder).length;
}

/**
 * Get placeholder text for column.
 * @param {string} columnId
 * @returns {string}
 */
function getPlaceholderText(columnId) {
  return placeholderTexts[columnId] || "No tasks";
}

/**
 * Create placeholder element.
 * @param {string} columnId
 * @returns {HTMLElement}
 */
function createPlaceholder(columnId) {
  const ph = document.createElement("div");
  ph.classList.add("no-tasks");
  ph.textContent = getPlaceholderText(columnId);
  return ph;
}

/**
 * Add placeholder to column.
 * @param {HTMLElement} column
 * @param {string} columnId
 * @returns {void}
 */
function appendPlaceholder(column, columnId) {
  const placeholder = createPlaceholder(columnId);
  column.appendChild(placeholder);
}

/**
 * Find existing placeholder in column.
 * @param {HTMLElement} column
 * @returns {Element|null}
 */
function findPlaceholder(column) {
  return column.querySelector(".no-tasks");
}

/**
 * Remove placeholder from column.
 * @param {Element} placeholder
 * @returns {void}
 */
function removePlaceholder(placeholder) {
  placeholder.remove();
}

/**
 * Check and show/hide placeholder based on task count.
 * @param {string} columnId
 * @returns {void}
 */
function checkAndShowPlaceholder(columnId) {
  const column = $(columnId);
  const existing = findPlaceholder(column);
  const count = countTasks(column);
  
  if (count === 0 && !existing) {
    appendPlaceholder(column, columnId);
  } else if (count > 0 && existing) {
    removePlaceholder(existing);
  }
}

/**
 * Extract task ID from drag event.
 * @param {DragEvent} event
 * @returns {string|null}
 */
function extractTaskId(event) {
  return event.dataTransfer?.getData("text/plain") || event.dataTransfer?.getData("text") || null;
}

/**
 * Get task element by ID.
 * @param {string|null} taskId
 * @returns {HTMLElement|null}
 */
function getTaskElement(taskId) {
  return taskId ? document.getElementById(taskId) : null;
}

/**
 * Get new column from event target.
 * @param {DragEvent} event
 * @returns {HTMLElement}
 */
function getNewColumn(event) {
  return event.currentTarget.closest?.(".task-list") || event.currentTarget;
}

/**
 * Get old column from task element.
 * @param {HTMLElement|null} taskElement
 * @returns {HTMLElement|null}
 */
function getOldColumn(taskElement) {
  return taskElement?.parentElement || null;
}

/**
 * Resolve drop context from event.
 * @param {DragEvent} event
 * @returns {{taskId:string|null, taskElement:HTMLElement|null, newColumn:HTMLElement|null, oldColumn:HTMLElement|null}}
 */
function getDropContext(event) {
  const taskId = extractTaskId(event);
  const taskElement = getTaskElement(taskId);
  const newColumn = getNewColumn(event);
  const oldColumn = getOldColumn(taskElement);
  
  return { taskId, taskElement, newColumn, oldColumn };
}

/**
 * Move task element to new column.
 * @param {HTMLElement} taskElement
 * @param {HTMLElement} newColumn
 * @returns {void}
 */
function moveTaskToColumn(taskElement, newColumn) {
  newColumn.appendChild(taskElement);
}

/**
 * Update task column attribute.
 * @param {HTMLElement} taskElement
 * @param {HTMLElement} newColumn
 * @returns {void}
 */
function updateTaskAttribute(taskElement, newColumn) {
  taskElement.dataset.column = DOM_TO_LOGICAL[newColumn.id] || taskElement.dataset.column;
}

/**
 * Move task DOM and update attributes.
 * @param {HTMLElement} taskElement
 * @param {HTMLElement} newColumn
 * @returns {void}
 */
function moveTaskDom(taskElement, newColumn) {
  moveTaskToColumn(taskElement, newColumn);
  updateTaskAttribute(taskElement, newColumn);
}

/**
 * Get Firebase reference for task.
 * @param {string} taskId
 * @returns {any}
 */
function getTaskRef(taskId) {
  return ref(db, `tasks/${taskId}`);
}

/**
 * Get logical column value from DOM ID.
 * @param {string} newColumnId
 * @returns {string}
 */
function getLogicalColumn(newColumnId) {
  return DOM_TO_LOGICAL[newColumnId] || "todo";
}

/**
 * Create update data for task.
 * @param {string} newColumnValue
 * @returns {object}
 */
function createUpdateData(newColumnValue) {
  return { column: newColumnValue, movedAt: Date.now() };
}

/**
 * Handle update error.
 * @param {Error} err
 * @returns {void}
 */
function handleUpdateError(err) {
  console.error("Fehler beim Aktualisieren der Spalte:", err);
}

/**
 * Update task column in Firebase.
 * @param {string} taskId
 * @param {string} newColumnId
 * @returns {Promise<void>}
 */
function updateTaskColumn(taskId, newColumnId) {
  const dbRef = getTaskRef(taskId);
  const newColumnValue = getLogicalColumn(newColumnId);
  const updateData = createUpdateData(newColumnValue);
  
  return update(dbRef, updateData).catch(handleUpdateError);
}

/**
 * Check if overflow should be shown.
 * @param {number} total
 * @param {number} maxShown
 * @returns {boolean}
 */
function shouldShowOverflow(total, maxShown) {
  return total > maxShown;
}

/**
 * Calculate overflow count.
 * @param {number} total
 * @param {number} maxShown
 * @returns {number}
 */
function computeOverflow(total, maxShown) {
  return shouldShowOverflow(total, maxShown) ? total - (maxShown - 1) : 0;
}

/**
 * Build overflow circle HTML.
 * @param {number} n
 * @param {string} posClass
 * @returns {string}
 */
function buildMoreCircle(n, posClass) {
  return `<div class="initial-circle ${posClass} initial-circle--more" title="+${n}">+${n}</div>`;
}

/**
 * Get contact color index.
 * @param {object} contact
 * @returns {number}
 */
function getContactColorIndex(contact) {
  return Number.isFinite(contact?.colorIndex) ? contact.colorIndex : 0;
}

/**
 * Get contact initials.
 * @param {object} contact
 * @returns {string}
 */
function getContactInitials(contact) {
  return contact?.initials || "";
}

/**
 * Get contact title.
 * @param {object} contact
 * @returns {string}
 */
function getContactTitle(contact) {
  const initials = getContactInitials(contact);
  return contact?.name || initials;
}

/**
 * Build initials circle HTML.
 * @param {object} c
 * @param {string} posClass
 * @returns {string}
 */
function buildInitialsCircle(c, posClass) {
  const colorIdx = getContactColorIndex(c);
  const initials = getContactInitials(c);
  const title = getContactTitle(c);
  
  return `<div class="initial-circle ${posClass}" style="background-image: url(../assets/icons/contact/color${colorIdx}.svg)" title="${title}">${initials}</div>`;
}

/**
 * Check if contacts array is valid.
 * @param {any} contacts
 * @returns {boolean}
 */
function isValidContactsArray(contacts) {
  return Array.isArray(contacts) && contacts.length > 0;
}

/**
 * Get contacts to show.
 * @param {any[]} contacts
 * @param {number} maxShown
 * @returns {any[]}
 */
function getContactsToShow(contacts, maxShown) {
  return contacts.slice(0, maxShown);
}

/**
 * Get position class for contact.
 * @param {number} idx
 * @returns {string}
 */
function getPositionClass(idx) {
  const positions = ["first-initial", "second-initial", "third-initial"];
  return positions[idx] || "";
}

/**
 * Check if should show overflow at index.
 * @param {boolean} hasOverflow
 * @param {number} idx
 * @param {number} maxShown
 * @returns {boolean}
 */
function shouldShowOverflowAtIndex(hasOverflow, idx, maxShown) {
  return hasOverflow && idx === maxShown - 1;
}

/**
 * Render single contact or overflow.
 * @param {object} contact
 * @param {number} idx
 * @param {boolean} hasOverflow
 * @param {number} overflowCount
 * @param {number} maxShown
 * @returns {string}
 */
function renderSingleContact(contact, idx, hasOverflow, overflowCount, maxShown) {
  const pos = getPositionClass(idx);
  
  if (shouldShowOverflowAtIndex(hasOverflow, idx, maxShown)) {
    return buildMoreCircle(overflowCount, pos);
  }
  
  return buildInitialsCircle(contact, pos);
}

/**
 * Render assigned initials for contacts.
 * @param {any[]} contacts
 * @returns {string}
 */
export function renderAssignedInitials(contacts = []) {
  const maxShown = 3;
  
  if (!isValidContactsArray(contacts)) {
    return "";
  }
  
  const shown = getContactsToShow(contacts, maxShown);
  const hasOverflow = shouldShowOverflow(contacts.length, maxShown);
  const overflowCount = computeOverflow(contacts.length, maxShown);
  
  return shown.map((c, idx) => 
    renderSingleContact(c, idx, hasOverflow, overflowCount, maxShown)
  ).join("");
}

/**
 * Create debounced function.
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
 * Extract search term from input.
 * @param {HTMLInputElement} input
 * @returns {string}
 */
function extractSearchTerm(input) {
  return (input.value || "").toLowerCase().trim();
}

/**
 * Check if search term is valid.
 * @param {string} term
 * @returns {boolean}
 */
function isValidSearchTerm(term) {
  return term.length >= 3;
}

/**
 * Get filtered search term.
 * @param {string} term
 * @returns {string}
 */
function getFilteredTerm(term) {
  return isValidSearchTerm(term) ? term : "";
}

/**
 * Execute search filtering.
 * @param {HTMLInputElement} input
 * @returns {void}
 */
function runSearch(input) {
  const term = extractSearchTerm(input);
  const filteredTerm = getFilteredTerm(term);
  filterTasks(filteredTerm);
}

/**
 * Add input event listener.
 * @param {HTMLInputElement} input
 * @param {Function} handler
 * @returns {void}
 */
function addInputListener(input, handler) {
  input.addEventListener("input", handler);
}

/**
 * Add keypress event listener.
 * @param {HTMLInputElement} input
 * @param {Function} handler
 * @returns {void}
 */
function addKeypressListener(input, handler) {
  input.addEventListener("keypress", handler);
}

/**
 * Add click event listener.
 * @param {HTMLElement|null} btn
 * @param {Function} handler
 * @returns {void}
 */
function addClickListener(btn, handler) {
  btn?.addEventListener("click", handler);
}

/**
 * Bind all search events.
 * @param {HTMLInputElement} input
 * @param {HTMLElement|null} btn
 * @returns {void}
 */
function bindSearchEvents(input, btn) {
  const debouncedRun = debounce(() => runSearch(input), 200);
  const enterHandler = (e) => { if (e.key === "Enter") runSearch(input); };
  const clickHandler = () => runSearch(input);
  
  addInputListener(input, debouncedRun);
  addKeypressListener(input, enterHandler);
  addClickListener(btn, clickHandler);
}

/**
 * Get search input element.
 * @returns {HTMLInputElement|null}
 */
function getSearchInput() {
  return $("search-input");
}

/**
 * Get search button element.
 * @returns {HTMLElement|null}
 */
function getSearchButton() {
  return $("search-btn");
}

/**
 * Setup search handlers.
 * @returns {void}
 */
function setupSearchHandlers() {
  const searchInput = getSearchInput();
  if (!searchInput) return;
  
  const searchButton = getSearchButton();
  bindSearchEvents(searchInput, searchButton);
}

/**
 * Get all task elements.
 * @returns {NodeListOf<Element>}
 */
function getAllTasks() {
  return document.querySelectorAll(".ticket");
}

/**
 * Get task title text.
 * @param {Element} taskEl
 * @returns {string}
 */
function getTaskTitle(taskEl) {
  return taskEl.querySelector(".ticket-title")?.textContent.toLowerCase() || "";
}

/**
 * Get task description text.
 * @param {Element} taskEl
 * @returns {string}
 */
function getTaskDescription(taskEl) {
  return taskEl.querySelector(".ticket-text")?.textContent.toLowerCase() || "";
}

/**
 * Check if task matches search term.
 * @param {Element} taskEl
 * @param {string} searchTerm
 * @returns {boolean}
 */
function taskMatchesSearch(taskEl, searchTerm) {
  const title = getTaskTitle(taskEl);
  const description = getTaskDescription(taskEl);
  return title.includes(searchTerm) || description.includes(searchTerm);
}

/**
 * Set task visibility.
 * @param {Element} taskEl
 * @param {boolean} visible
 * @returns {void}
 */
function setTaskVisibility(taskEl, visible) {
  /** @type {HTMLElement} */ (taskEl).style.display = visible ? "" : "none";
}

/**
 * Filter single task visibility.
 * @param {Element} taskEl
 * @param {string} searchTerm
 * @returns {void}
 */
function filterSingleTask(taskEl, searchTerm) {
  const matches = taskMatchesSearch(taskEl, searchTerm);
  const shouldShow = matches || searchTerm === "";
  setTaskVisibility(taskEl, shouldShow);
}

/**
 * Filter all tasks by search term.
 * @param {string} searchTerm
 * @returns {void}
 */
function filterTasks(searchTerm) {
  const allTasks = getAllTasks();
  allTasks.forEach((taskEl) => filterSingleTask(taskEl, searchTerm));
  updateAllPlaceholders();
}

/**
 * Update placeholders in all columns.
 * @returns {void}
 */
function updateAllPlaceholders() {
  for (const key in columnMap) {
    updatePlaceholderForColumn(columnMap[key]);
  }
}

/**
 * Get column element by ID.
 * @param {string} columnId
 * @returns {HTMLElement|null}
 */
function getColumnElement(columnId) {
  return document.getElementById(columnId);
}

/**
 * Get visible tasks in column.
 * @param {HTMLElement} column
 * @returns {Element[]}
 */
function getVisibleTasks(column) {
  return Array.from(column.querySelectorAll(".ticket")).filter(
    (el) => /** @type {HTMLElement} */ (el).style.display !== "none"
  );
}

/**
 * Update placeholder for single column.
 * @param {string} columnId
 * @returns {void}
 */
function updatePlaceholderForColumn(columnId) {
  const column = getColumnElement(columnId);
  if (!column) return;
  
  const visibleTasks = getVisibleTasks(column);
  const placeholder = findPlaceholder(column);
  
  if (visibleTasks.length === 0 && !placeholder) {
    appendPlaceholder(column, columnId);
  } else if (visibleTasks.length > 0 && placeholder) {
    removePlaceholder(placeholder);
  }
}

/**
 * Get task element by string ID.
 * @param {string} taskId
 * @returns {HTMLElement|null}
 */
function getTaskElementById(taskId) {
  return document.getElementById(String(taskId));
}

/**
 * Find task parent column.
 * @param {HTMLElement} taskEl
 * @returns {HTMLElement|null}
 */
function findTaskParentColumn(taskEl) {
  return taskEl?.closest(".task-list") || taskEl?.parentElement || null;
}

/**
 * Get DOM ID from logical column.
 * @param {string} targetLogical
 * @returns {string}
 */
function getDomIdFromLogical(targetLogical) {
  return LOGICAL_TO_DOM[targetLogical] || targetLogical;
}

/**
 * Get new column element.
 * @param {string} newDomId
 * @returns {HTMLElement|null}
 */
function getNewColumnElement(newDomId) {
  return document.getElementById(newDomId);
}

/**
 * Move task to new column.
 * @param {HTMLElement} taskEl
 * @param {HTMLElement} newColumnEl
 * @returns {void}
 */
function moveTaskToNewColumn(taskEl, newColumnEl) {
  newColumnEl.appendChild(taskEl);
}

/**
 * Move task DOM by logical column.
 * @param {string} taskId
 * @param {string} targetLogical
 * @returns {{taskEl:HTMLElement|null, oldColumnEl:HTMLElement|null, newColumnEl:HTMLElement|null}}
 */
function moveTaskDomByLogical(taskId, targetLogical) {
  const taskEl = getTaskElementById(taskId);
  const oldColumnEl = taskEl ? findTaskParentColumn(taskEl) : null;
  const newDomId = getDomIdFromLogical(targetLogical);
  const newColumnEl = getNewColumnElement(newDomId);
  
  if (taskEl && newColumnEl) {
    moveTaskToNewColumn(taskEl, newColumnEl);
  }
  
  return { taskEl, oldColumnEl, newColumnEl };
}

/**
 * Update task dataset attribute.
 * @param {string} taskId
 * @param {string} logical
 * @returns {void}
 */
function updateTaskDataset(taskId, logical) {
  const el = getTaskElementById(taskId);
  if (el && logical) {
    el.dataset.column = logical;
  }
}

/**
 * Update placeholders for both columns.
 * @param {string} oldColumnId
 * @param {string} newColumnId
 * @returns {void}
 */
function updateBothPlaceholders(oldColumnId, newColumnId) {
  checkAndShowPlaceholder(oldColumnId);
  checkAndShowPlaceholder(newColumnId);
}

/**
 * Sync after task move.
 * @param {string} taskId
 * @param {HTMLElement|null} oldColumnEl
 * @param {HTMLElement|null} newColumnEl
 * @returns {void}
 */
function syncAfterMove(taskId, oldColumnEl, newColumnEl) {
  if (!(oldColumnEl && newColumnEl)) return;
  
  const domId = newColumnEl.id;
  const logical = DOM_TO_LOGICAL[domId];
  
  updateTaskDataset(taskId, logical);
  updateTaskColumn(String(taskId), domId);
  updateBothPlaceholders(oldColumnEl.id, newColumnEl.id);
  resetColumnBackgrounds();
}

/**
 * Public API: move task to new logical column.
 * @param {string|number} taskId
 * @param {string} targetLogical
 * @returns {void}
 */
window.onTaskColumnChanged = function (taskId, targetLogical) {
  const { oldColumnEl, newColumnEl } = moveTaskDomByLogical(String(taskId), targetLogical);
  syncAfterMove(String(taskId), oldColumnEl, newColumnEl);
};

/**
 * Initialize board with all components.
 * @returns {void}
 */
function initBoard() {
  setupAuthListener();
  initDnDListeners();
  loadTasksFromFirebase();
  setupSearchHandlers();
}