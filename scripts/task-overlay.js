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
 * Open overlay for a task id.
 * @param {string} taskId
 * @returns {Promise<void>}
 */
window.showTaskOverlay = async function (taskId) {
  try {
    const task = await fetchTask(taskId);
    if (!task) return;
    await normalizeSubtasks(taskId, task);
    fillTaskOverlay(task);
    wireEditButton(task);
    wireDeleteButton(taskId);
    showOverlayUI();
  } catch (err) {
    console.error("Error showing task overlay:", err);
  }
};

/**
 * Hide overlay with fade-out animation.
 * @returns {void}
 */
window.hideOverlay = function () {
  const bg = $("task-overlay-bg");
  const overlay = $("task-overlay");
  if (!bg || !overlay) return;
  document.querySelector(".edit-addtask-wrapper")?.classList.add("d-none");
  document.getElementById("task-overlay-content")?.classList.remove("d-none");
  overlay.classList.remove("animate-in");
  overlay.classList.add("animate-out");
  setTimeout(() => {
    bg.classList.add("d-none");
    overlay.classList.remove("animate-out");
  }, 300);
};

/* ===================== Render / Wire UI ===================== */

/**
 * Render all overlay sections for a task.
 * @param {Task} task
 * @returns {void}
 */
function fillTaskOverlay(task) {
  renderCategory(task.category);
  renderTitleDescDate(task);
  renderPriority(task.priority);
  renderAssignedContacts(task);
  renderSubtasks(task);
  setupSubtaskListeners(task);
}

/**
 * Render category label.
 * @param {string} [category]
 * @returns {void}
 */
function renderCategory(category) {
  const el = $("overlay-user-story");
  el.textContent = category || "";
  el.className = "";
  el.classList.add(getLabelClass(category));
}

/**
 * Render title/description/due date.
 * @param {Task} task
 * @returns {void}
 */
function renderTitleDescDate(task) {
  $("overlay-title").innerHTML = task.title || "";
  $("overlay-description").textContent = task.description || "";
  $("overlay-due-date").textContent = task.dueDate || "";
}

/**
 * Wire checkbox/labels for subtasks.
 * @param {Task} task
 * @returns {void}
 */
function setupSubtaskListeners(task) {
  const pairs =
    getPairsByDataIndex() || getPairsByIdPattern() || /** @type {any[]} */ ([]);
  pairs.forEach(({ checkbox, label, img, idx }) => {
    if (checkbox && label) attachSubtaskEvents(checkbox, label, img, /** @type {string} */(task.id), idx);
  });
}

/**
 * Wire Edit button.
 * @param {Task} task
 * @returns {void}
 */
function wireEditButton(task) {
  const btn = $("edit-task-btn");
  if (!btn) return;
  btn.onclick = () => openEditInsideOverlay(task);
}

/**
 * Wire Delete button.
 * @param {string} taskId
 * @returns {void}
 */
function wireDeleteButton(taskId) {
  const btn = $("delete-task-btn");
  if (!btn) return;
  btn.onclick = async () => {
    try {
      await deleteTaskFromDatabase(taskId);
      hideOverlay();
    } catch (e) {
      console.error("Error deleting task:", e);
    }
  };
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
 * Open Add-Task overlay and reset form.
 * @returns {void}
 */
function openOverlay() {
  overlay.classList.remove("d-none");
  overlayContent.classList.remove("slide-out");
  overlayContent.classList.add("slide-in");
  const cancelBtn = $("cancel-button");
  if (cancelBtn) cancelBtn.click();
  else
    document.addEventListener(
      "addtask:template-ready",
      () => $("cancel-button")?.click(),
      { once: true }
    );
}

/**
 * Close Add-Task overlay with animation.
 * @returns {void}
 */
function closeOverlay() {
  overlayContent.classList.remove("slide-in");
  overlayContent.classList.add("slide-out");
  overlayContent.addEventListener("animationend", function handler() {
    overlay.classList.add("d-none");
    overlayContent.classList.remove("slide-out");
    overlayContent.removeEventListener("animationend", handler);
  });
}

/**
 * Toggle Add-Task overlay and move form back.
 * @returns {void}
 */
window.toggleAddTaskBoard = function () {
  if (overlay.classList.contains("d-none")) openOverlay();
  else closeOverlay();
  moveFormBackToAside();
};

/**
 * Move Add-Task form back to aside.
 * @returns {void}
 */
function moveFormBackToAside() {
  const src = document.querySelector(".edit-addtask .addtask-wrapper");
  const dst = document.querySelector(".addtask-aside-clone");
  if (src && dst) dst.replaceChildren(src);
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
 * Handler for edit-button toggling the edit view.
 * @returns {void}
 */
function onEditTaskBtnClick() {
  $("task-overlay-content").classList.toggle("d-none");
  document.querySelector(".edit-addtask-wrapper").classList.toggle("d-none");
  const src = document.querySelector(".addtask-aside-clone .addtask-wrapper");
  const dst = document.querySelector(".edit-addtask");
  if (src && dst) dst.replaceChildren(src);
}

/**
 * Close overlay on backdrop click.
 * @param {MouseEvent} e
 * @returns {void}
 */
function onOverlayBackdropClick(e) {
  if (e.target !== overlay || overlay.classList.contains("d-none")) return;
  document.querySelector(".edit-addtask-wrapper")?.classList.add("d-none");
  document.getElementById("task-overlay-content")?.classList.remove("d-none");
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