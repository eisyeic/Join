/**
 * @file Task Overlay & Add-Task Overlay logic (orchestrator).
 * Uses helpers for DB, rendering and subtask wiring.
 */

import { renderAssignedContacts, renderSubtasks } from "./template.modul.js";
import {
  fetchTask,
  normalizeSubtasks,
  updateSubtaskStatus, // falls außerhalb benötigt
  renderPriority,
  capitalize,
  renderSubtaskProgress,
  getLabelClass,
  attachSubtaskEvents,
  getPairsByDataIndex,
  getPairsByIdPattern,
} from "./overlay-helpers.js";
export {
  getLabelClass,
  renderSubtaskProgress,
  renderPriority,
  updateSubtaskStatus,
} from "./overlay-helpers.js";

/**
 * @typedef {Object} Subtask
 * @property {string} name
 * @property {boolean} [checked]
 */

/**
 * @typedef {Object} Task
 * @property {string} [id]
 * @property {string} [title]
 * @property {string} [description]
 * @property {string} [dueDate]
 * @property {"urgent"|"medium"|"low"} [priority]
 * @property {string} [category]
 * @property {Subtask[]} [subtasks]
 */

/** Supported board columns (unused here but kept if referenced elsewhere). */
const TASK_CATEGORIES = ["toDo", "inProgress", "awaitFeedback", "done"];

/* ===================== Public Overlay API ===================== */

/**
 * Validates if task exists
 * @param {Object|null} task
 * @returns {boolean}
 */
function isValidTask(task) {
  return task !== null && task !== undefined;
}

/**
 * Prepares task data for overlay
 * @param {string} taskId
 * @param {Task} task
 * @returns {Promise<void>}
 */
async function prepareTaskData(taskId, task) {
  await normalizeSubtasks(taskId, task);
}

/**
 * Sets up overlay UI for task
 * @param {Task} task
 * @param {string} taskId
 */
function setupOverlayForTask(task, taskId) {
  fillTaskOverlay(task);
  wireEditButton(task);
  wireDeleteButton(taskId);
  showOverlayUI();
}

/**
 * Handles task overlay error
 * @param {Error} err
 */
function handleTaskOverlayError(err) {
  console.error("Error showing task overlay:", err);
}

/**
 * Open overlay for a task id.
 * @param {string} taskId
 * @returns {Promise<void>}
 */
window.showTaskOverlay = async function (taskId) {
  try {
    const task = await fetchTask(taskId);
    if (!isValidTask(task)) return;
    
    await prepareTaskData(taskId, task);
    setupOverlayForTask(task, taskId);
  } catch (err) {
    handleTaskOverlayError(err);
  }
};

/**
 * Gets overlay background element
 * @returns {HTMLElement|null}
 */
function getOverlayBackground() {
  return $("task-overlay-bg");
}

/**
 * Gets task overlay element
 * @returns {HTMLElement|null}
 */
function getTaskOverlay() {
  return $("task-overlay");
}

/**
 * Validates overlay elements exist
 * @param {HTMLElement|null} bg
 * @param {HTMLElement|null} overlay
 * @returns {boolean}
 */
function areOverlayElementsValid(bg, overlay) {
  return bg !== null && overlay !== null;
}

/**
 * Hides edit wrapper
 */
function hideEditWrapper() {
  document.querySelector(".edit-addtask-wrapper")?.classList.add("d-none");
}

/**
 * Shows task overlay content
 */
function showTaskOverlayContent() {
  document.getElementById("task-overlay-content")?.classList.remove("d-none");
}

/**
 * Starts overlay fade-out animation
 * @param {HTMLElement} overlay
 */
function startFadeOutAnimation(overlay) {
  overlay.classList.remove("animate-in");
  overlay.classList.add("animate-out");
}

/**
 * Completes overlay hide after animation
 * @param {HTMLElement} bg
 * @param {HTMLElement} overlay
 */
function completeOverlayHide(bg, overlay) {
  bg.classList.add("d-none");
  overlay.classList.remove("animate-out");
}

/**
 * Schedules overlay hide completion
 * @param {HTMLElement} bg
 * @param {HTMLElement} overlay
 */
function scheduleOverlayHideCompletion(bg, overlay) {
  setTimeout(() => {
    completeOverlayHide(bg, overlay);
  }, 300);
}

/**
 * Hide overlay with fade-out animation.
 * @returns {void}
 */
window.hideOverlay = function () {
  const bg = getOverlayBackground();
  const overlay = getTaskOverlay();
  
  if (!areOverlayElementsValid(bg, overlay)) return;
  
  hideEditWrapper();
  showTaskOverlayContent();
  startFadeOutAnimation(overlay);
  scheduleOverlayHideCompletion(bg, overlay);
};

/* ===================== Render / Wire UI ===================== */

/**
 * Renders task content sections
 * @param {Task} task
 */
function renderTaskContent(task) {
  renderCategory(task.category);
  renderTitleDescDate(task);
  renderPriority(task.priority);
}

/**
 * Renders task relationships
 * @param {Task} task
 */
function renderTaskRelationships(task) {
  renderAssignedContacts(task);
  renderSubtasks(task);
}

/**
 * Render all overlay sections for a task.
 * @param {Task} task
 * @returns {void}
 */
function fillTaskOverlay(task) {
  renderTaskContent(task);
  renderTaskRelationships(task);
  setupSubtaskListeners(task);
}

/**
 * Gets category element
 * @returns {HTMLElement}
 */
function getCategoryElement() {
  return $("overlay-user-story");
}

/**
 * Sets category text content
 * @param {HTMLElement} element
 * @param {string} [category]
 */
function setCategoryText(element, category) {
  element.textContent = category || "";
}

/**
 * Clears element classes
 * @param {HTMLElement} element
 */
function clearElementClasses(element) {
  element.className = "";
}

/**
 * Adds category class to element
 * @param {HTMLElement} element
 * @param {string} [category]
 */
function addCategoryClass(element, category) {
  element.classList.add(getLabelClass(category));
}

/**
 * Render category label.
 * @param {string} [category]
 * @returns {void}
 */
function renderCategory(category) {
  const el = getCategoryElement();
  setCategoryText(el, category);
  clearElementClasses(el);
  addCategoryClass(el, category);
}

/**
 * Renders task title
 * @param {Task} task
 */
function renderTaskTitle(task) {
  $("overlay-title").innerHTML = task.title || "";
}

/**
 * Renders task description
 * @param {Task} task
 */
function renderTaskDescription(task) {
  $("overlay-description").textContent = task.description || "";
}

/**
 * Renders task due date
 * @param {Task} task
 */
function renderTaskDueDate(task) {
  $("overlay-due-date").textContent = task.dueDate || "";
}

/**
 * Render title/description/due date.
 * @param {Task} task
 * @returns {void}
 */
function renderTitleDescDate(task) {
  renderTaskTitle(task);
  renderTaskDescription(task);
  renderTaskDueDate(task);
}

/**
 * Gets subtask element pairs
 * @returns {Array}
 */
function getSubtaskPairs() {
  return getPairsByDataIndex() || getPairsByIdPattern() || /** @type {any[]} */ ([]);
}

/**
 * Validates subtask pair elements
 * @param {Object} pair
 * @returns {boolean}
 */
function isValidSubtaskPair(pair) {
  return pair.checkbox && pair.label;
}

/**
 * Attaches events to single subtask pair
 * @param {Object} pair
 * @param {string} taskId
 */
function attachSubtaskPairEvents(pair, taskId) {
  const { checkbox, label, img, idx } = pair;
  attachSubtaskEvents(checkbox, label, img, taskId, idx);
}

/**
 * Wire checkbox/labels for subtasks.
 * @param {Task} task
 * @returns {void}
 */
function setupSubtaskListeners(task) {
  const pairs = getSubtaskPairs();
  pairs.forEach((pair) => {
    if (isValidSubtaskPair(pair)) {
      attachSubtaskPairEvents(pair, /** @type {string} */(task.id));
    }
  });
}

/**
 * Gets edit button element
 * @returns {HTMLElement|null}
 */
function getEditButton() {
  return $("edit-task-btn");
}

/**
 * Gets delete button element
 * @returns {HTMLElement|null}
 */
function getDeleteButton() {
  return $("delete-task-btn");
}

/**
 * Creates edit button click handler
 * @param {Task} task
 * @returns {Function}
 */
function createEditClickHandler(task) {
  return () => openEditInsideOverlay(task);
}

/**
 * Handles delete task error
 * @param {Error} e
 */
function handleDeleteTaskError(e) {
  console.error("Error deleting task:", e);
}

/**
 * Performs task deletion
 * @param {string} taskId
 * @returns {Promise<void>}
 */
async function performTaskDeletion(taskId) {
  await deleteTaskFromDatabase(taskId);
  window.hideOverlay();
}

/**
 * Creates delete button click handler
 * @param {string} taskId
 * @returns {Function}
 */
function createDeleteClickHandler(taskId) {
  return async () => {
    try {
      await performTaskDeletion(taskId);
    } catch (e) {
      handleDeleteTaskError(e);
    }
  };
}

/**
 * Wire Edit button.
 * @param {Task} task
 * @returns {void}
 */
function wireEditButton(task) {
  const btn = getEditButton();
  if (!btn) return;
  btn.onclick = createEditClickHandler(task);
}

/**
 * Wire Delete button.
 * @param {string} taskId
 * @returns {void}
 */
function wireDeleteButton(taskId) {
  const btn = getDeleteButton();
  if (!btn) return;
  btn.onclick = createDeleteClickHandler(taskId);
}

/**
 * Show overlay UI.
 * @returns {void}
 */
function showOverlayUI() {
  const bg = $("task-overlay-bg");
  const overlay = $("task-overlay");
  if (!bg || !overlay) return;
  bg.classList.remove("d-none");
  overlay.classList.remove("animate-out");
  overlay.classList.add("animate-in");
}

/* ===================== Add-Task overlay ===================== */

/** Root + content */
const overlay = $("overlay-add-task");
const overlayContent = document.querySelector(".add-task-overlay-content");

/**
 * Shows overlay element
 */
function showOverlayElement() {
  overlay.classList.remove("d-none");
}

/**
 * Starts slide-in animation
 */
function startSlideInAnimation() {
  overlayContent.classList.remove("slide-out");
  overlayContent.classList.add("slide-in");
}

/**
 * Gets cancel button element
 * @returns {HTMLElement|null}
 */
function getCancelButton() {
  return $("cancel-button");
}

/**
 * Clicks cancel button if available
 */
function clickCancelButton() {
  const cancelBtn = getCancelButton();
  if (cancelBtn) {
    cancelBtn.click();
  }
}

/**
 * Adds template ready listener for cancel button
 */
function addTemplateReadyListener() {
  document.addEventListener(
    "addtask:template-ready",
    () => getCancelButton()?.click(),
    { once: true }
  );
}

/**
 * Resets form by clicking cancel button
 */
function resetForm() {
  const cancelBtn = getCancelButton();
  if (cancelBtn) {
    clickCancelButton();
  } else {
    addTemplateReadyListener();
  }
}

/**
 * Starts slide-out animation
 */
function startSlideOutAnimation() {
  overlayContent.classList.remove("slide-in");
  overlayContent.classList.add("slide-out");
}

/**
 * Completes overlay close after animation
 */
function completeOverlayClose() {
  overlay.classList.add("d-none");
  overlayContent.classList.remove("slide-out");
}

/**
 * Creates animation end handler
 * @returns {Function}
 */
function createAnimationEndHandler() {
  return function handler() {
    completeOverlayClose();
    overlayContent.removeEventListener("animationend", handler);
  };
}

/**
 * Adds animation end listener
 */
function addAnimationEndListener() {
  const handler = createAnimationEndHandler();
  overlayContent.addEventListener("animationend", handler);
}

/**
 * Open Add-Task overlay and reset form.
 * @returns {void}
 */
function openOverlay() {
  showOverlayElement();
  startSlideInAnimation();
  resetForm();
}

/**
 * Close Add-Task overlay with animation.
 * @returns {void}
 */
function closeOverlay() {
  startSlideOutAnimation();
  addAnimationEndListener();
}

/**
 * Checks if overlay is hidden
 * @returns {boolean}
 */
function isOverlayHidden() {
  return overlay.classList.contains("d-none");
}

/**
 * Toggles overlay visibility
 */
function toggleOverlayVisibility() {
  if (isOverlayHidden()) {
    openOverlay();
  } else {
    closeOverlay();
  }
}

/**
 * Toggle Add-Task overlay and move form back.
 * @returns {void}
 */
window.toggleAddTaskBoard = function () {
  toggleOverlayVisibility();
  moveFormBackToAside();
};

/**
 * Gets form source element
 * @returns {HTMLElement|null}
 */
function getFormSource() {
  return document.querySelector(".edit-addtask .addtask-wrapper");
}

/**
 * Gets form destination element
 * @returns {HTMLElement|null}
 */
function getFormDestination() {
  return document.querySelector(".addtask-aside-clone");
}

/**
 * Validates form move elements
 * @param {HTMLElement|null} src
 * @param {HTMLElement|null} dst
 * @returns {boolean}
 */
function areFormMoveElementsValid(src, dst) {
  return src !== null && dst !== null;
}

/**
 * Moves form element to destination
 * @param {HTMLElement} src
 * @param {HTMLElement} dst
 */
function moveFormElement(src, dst) {
  dst.replaceChildren(src);
}

/**
 * Move Add-Task form back to aside.
 * @returns {void}
 */
function moveFormBackToAside() {
  const src = getFormSource();
  const dst = getFormDestination();
  
  if (areFormMoveElementsValid(src, dst)) {
    moveFormElement(src, dst);
  }
}

/**
 * Wire edit button inside Add-Task overlay.
 * @returns {void}
 */
function setupEditTaskButton() {
  const editBtn = $("edit-task-btn");
  if (editBtn) {
    editBtn.addEventListener("click", onEditTaskBtnClick);
  }
}

/**
 * Toggles task overlay content visibility
 */
function toggleTaskOverlayContent() {
  $("task-overlay-content").classList.toggle("d-none");
}

/**
 * Toggles edit wrapper visibility
 */
function toggleEditWrapper() {
  document.querySelector(".edit-addtask-wrapper").classList.toggle("d-none");
}

/**
 * Gets edit form source element
 * @returns {HTMLElement|null}
 */
function getEditFormSource() {
  return document.querySelector(".addtask-aside-clone .addtask-wrapper");
}

/**
 * Gets edit form destination element
 * @returns {HTMLElement|null}
 */
function getEditFormDestination() {
  return document.querySelector(".edit-addtask");
}

/**
 * Moves form to edit area
 */
function moveFormToEditArea() {
  const src = getEditFormSource();
  const dst = getEditFormDestination();
  
  if (areFormMoveElementsValid(src, dst)) {
    moveFormElement(src, dst);
  }
}

/**
 * Handler for edit-button toggling the edit view.
 * @returns {void}
 */
function onEditTaskBtnClick() {
  toggleTaskOverlayContent();
  toggleEditWrapper();
  moveFormToEditArea();
}

/**
 * Checks if click is on backdrop
 * @param {MouseEvent} e
 * @returns {boolean}
 */
function isBackdropClick(e) {
  return e.target === overlay;
}

/**
 * Checks if overlay is currently visible
 * @returns {boolean}
 */
function isOverlayVisible() {
  return !overlay.classList.contains("d-none");
}

/**
 * Validates backdrop click conditions
 * @param {MouseEvent} e
 * @returns {boolean}
 */
function shouldHandleBackdropClick(e) {
  return isBackdropClick(e) && isOverlayVisible();
}

/**
 * Resets overlay to default state
 */
function resetOverlayToDefault() {
  hideEditWrapper();
  showTaskOverlayContent();
}

/**
 * Close overlay on backdrop click.
 * @param {MouseEvent} e
 * @returns {void}
 */
function onOverlayBackdropClick(e) {
  if (!shouldHandleBackdropClick(e)) return;
  
  resetOverlayToDefault();
  window.toggleAddTaskBoard();
}

/**
 * Wire backdrop listener.
 * @returns {void}
 */
function setupOverlayListener() {
  overlay?.addEventListener("click", onOverlayBackdropClick);
}

/**
 * Init.
 * @returns {void}
 */
(function initTaskOverlay() {
  setupEditTaskButton();
  setupOverlayListener();
}());