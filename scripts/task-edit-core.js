/**
 * @file task-edit-core.js
 * @description Core functionality for task edit overlay
 */
import { ensureDateHandlersBound } from "./edit-overlay-helpers.js";
import { populateEditForm } from "./task-edit-form.js";
import { loadTaskById } from "./task-edit-firebase.js";
import { syncAssignedSelectionToList } from "./task-edit-sync.js";

/**
 * Prepares edit overlay UI
 */
function prepareEditOverlay() {
  switchToEditView();
  moveFormIntoEdit();
  ensureDateHandlersBound();
}

/**
 * Checks if input is a string (task ID)
 */
function isTaskId(taskOrId) {
  return typeof taskOrId === 'string';
}

/**
 * Checks if input is a task object
 */
function isTaskObject(taskOrId) {
  return taskOrId && typeof taskOrId === 'object';
}

/**
 * Handles task loading by ID
 */
function handleTaskIdInput(taskId) {
  loadTaskById(taskId).then((task) => {
    if (task) {
      proceedEditWithTask({ ...task, id: taskId });
    }
  });
}

/**
 * Handles direct task object input
 */
function handleTaskObjectInput(task) {
  proceedEditWithTask(task);
}

/**
 * Routes task input to appropriate handler
 */
function routeTaskInput(taskOrId) {
  if (isTaskId(taskOrId)) {
    handleTaskIdInput(taskOrId);
  } else if (isTaskObject(taskOrId)) {
    handleTaskObjectInput(taskOrId);
  }
}

/**
 * Open the edit overlay and load a task
 */
function openEditInsideOverlay(taskOrId) {
  prepareEditOverlay();
  routeTaskInput(taskOrId);
}

/**
 * Sets up task for editing
 */
function setupTaskForEditing(task) {
  ensureDateHandlersBound();
  markEditingId(task);
  populateEditForm(task);
}

/**
 * Applies UI enhancements
 */
function applyUIEnhancements() {
  queueMicrotask(applyInitialsCapIfAny);
  syncAssignedSelectionToList();
}

/**
 * Adds edit events if available
 */
function addEditEventsIfAvailable() {
  if (typeof window.addEditEvents === 'function') {
    window.addEditEvents();
  }
}

/**
 * Continue with a loaded task
 */
function proceedEditWithTask(task) {
  setupTaskForEditing(task);
  applyUIEnhancements();
  deferPopulateAndCap(task);
  addEditEventsIfAvailable();
}

/**
 * Apply initials cap if hook exists
 */
function applyInitialsCapIfAny() {
  if (typeof window.applyAssignedInitialsCap === 'function') applyAssignedInitialsCap();
}

/**
 * Defer another populate + initials cap to ensure UI sync
 */
function deferPopulateAndCap(task) {
  setTimeout(() => {
    populateEditForm(task);
    applyInitialsCapIfAny();
  }, 0);
}

/**
 * Gets task overlay content element
 */
function getTaskOverlayContent() {
  return document.getElementById("task-overlay-content");
}

/**
 * Gets edit wrapper element
 */
function getEditWrapper() {
  return document.querySelector(".edit-addtask-wrapper");
}

/**
 * Hides task overlay content
 */
function hideTaskContent(element) {
  element?.classList.add("d-none");
}

/**
 * Shows edit wrapper
 */
function showEditWrapper(element) {
  element?.classList.remove("d-none");
}

/**
 * Show edit view
 */
function switchToEditView() {
  const taskContent = getTaskOverlayContent();
  const editWrap = getEditWrapper();
  hideTaskContent(taskContent);
  showEditWrapper(editWrap);
}

/**
 * Finds form source element
 */
function findFormSource() {
  return document.querySelector(".addtask-aside-clone .addtask-wrapper") ||
         document.querySelector(".edit-addtask .addtask-wrapper");
}

/**
 * Finds form destination element
 */
function findFormDestination() {
  return document.querySelector(".edit-addtask");
}

/**
 * Checks if form needs to be moved
 */
function shouldMoveForm(src, dst) {
  return src && dst && src.parentElement !== dst;
}

/**
 * Moves form to destination
 */
function moveFormToDestination(src, dst) {
  dst.replaceChildren(src);
}

/**
 * Move the Add Task form into the edit container
 */
function moveFormIntoEdit() {
  const src = findFormSource();
  const dst = findFormDestination();
  
  if (shouldMoveForm(src, dst)) {
    moveFormToDestination(src, dst);
  }
}

/**
 * Gets addtask wrapper element
 */
function getAddtaskWrapper() {
  return document.querySelector(".addtask-wrapper");
}

/**
 * Checks if task has valid ID
 */
function hasValidTaskId(task) {
  return task?.id !== undefined && task?.id !== null;
}

/**
 * Sets editing ID on wrapper
 */
function setEditingIdOnWrapper(wrapper, taskId) {
  wrapper.dataset.editingId = String(taskId);
}

/**
 * Store the currently editing task ID
 */
function markEditingId(task) {
  const wrap = getAddtaskWrapper();
  
  if (wrap && hasValidTaskId(task)) {
    setEditingIdOnWrapper(wrap, task.id);
  }
}

/** Ensure global access to openEditInsideOverlay */
(function ensureGlobalOpenEdit() {
  if (typeof window.openEditInsideOverlay !== 'function' && typeof openEditInsideOverlay === 'function') {
    window.openEditInsideOverlay = openEditInsideOverlay;
  }
})();

export { openEditInsideOverlay, markEditingId };