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


