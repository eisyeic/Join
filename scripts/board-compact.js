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

/**
 * Initialize board application.
 * @returns {void}
 */
function initBoard() {
  setupAuthListener();
  loadTasksFromFirebase();
  initDnDListeners();
}

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
 * Move task DOM and update attributes.
 * @param {HTMLElement} taskElement
 * @param {HTMLElement} newColumn
 * @returns {void}
 */
function moveTaskDom(taskElement, newColumn) {
  moveTaskToColumn(taskElement, newColumn);
  taskElement.dataset.column = DOM_TO_LOGICAL[newColumn.id] || taskElement.dataset.column;
}

/**
 * Store dragged task ID.
 * @param {DragEvent} event
 * @returns {void}
 */
function onTaskDragStart(event) {
  const taskId = event.target.id;
  event.dataTransfer.setData("text/plain", taskId);
}

/**
 * Allow drop on valid targets.
 * @param {DragEvent} event
 * @returns {void}
 */
function allowDrop(event) {
  event.preventDefault();
}

/**
 * Handle task drop.
 * @param {DragEvent} event
 * @returns {void}
 */
function drop(event) {
  event.preventDefault();
  const { taskId, taskElement, newColumn, oldColumn } = getDropContext(event);
  
  if (!(taskId && taskElement && newColumn)) return;
  if (oldColumn === newColumn) return;
  
  moveTaskDom(taskElement, newColumn);
  
  if (oldColumn) {
    checkAndShowPlaceholder(oldColumn.id);
  }
  checkAndShowPlaceholder(newColumn.id);
  
  if (typeof updateTaskColumn === 'function') {
    updateTaskColumn(taskId, newColumn.id);
  }
}

/**
 * Initialize drag and drop listeners.
 * @returns {void}
 */
function initDnDListeners() {
  const columns = document.querySelectorAll('.task-list');
  columns.forEach(column => {
    column.addEventListener('dragover', allowDrop);
    column.addEventListener('drop', drop);
  });
}

// Global exports
window.drop = drop;
window.moveTaskToColumn = moveTaskToColumn;
window.checkAndShowPlaceholder = checkAndShowPlaceholder;
window.columnMap = columnMap;
window.DOM_TO_LOGICAL = DOM_TO_LOGICAL;
window.LOGICAL_TO_DOM = LOGICAL_TO_DOM;
window.initDnDListeners = initDnDListeners;