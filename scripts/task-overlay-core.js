/**
 * @file Task Overlay Core - Main task overlay functionality
 */

import { renderAssignedContacts, renderSubtasks } from "./template.modul.js";
import {
  fetchTask,
  normalizeSubtasks,
  updateSubtaskStatus,
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

const TASK_CATEGORIES = ["toDo", "inProgress", "awaitFeedback", "done"];

function isValidTask(task) {
  return task !== null && task !== undefined;
}

async function prepareTaskData(taskId, task) {
  await normalizeSubtasks(taskId, task);
}

function setupOverlayForTask(task, taskId) {
  fillTaskOverlay(task);
  wireEditButton(task);
  wireDeleteButton(taskId);
  showOverlayUI();
}

function handleTaskOverlayError(err) {
  console.error("Error showing task overlay:", err);
}

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

function getOverlayBackground() {
  return document.getElementById("task-overlay-bg");
}

function getTaskOverlay() {
  return document.getElementById("task-overlay");
}

function areOverlayElementsValid(bg, overlay) {
  return bg !== null && overlay !== null;
}

function hideEditWrapper() {
  document.querySelector(".edit-addtask-wrapper")?.classList.add("d-none");
}

function showTaskOverlayContent() {
  document.getElementById("task-overlay-content")?.classList.remove("d-none");
}

function startFadeOutAnimation(overlay) {
  overlay.classList.remove("animate-in");
  overlay.classList.add("animate-out");
}

function completeOverlayHide(bg, overlay) {
  bg.classList.add("d-none");
  overlay.classList.remove("animate-out");
}

function scheduleOverlayHideCompletion(bg, overlay) {
  setTimeout(() => {
    completeOverlayHide(bg, overlay);
  }, 300);
}

window.hideOverlay = function () {
  const bg = getOverlayBackground();
  const overlay = getTaskOverlay();
  
  if (!areOverlayElementsValid(bg, overlay)) return;
  
  hideEditWrapper();
  showTaskOverlayContent();
  startFadeOutAnimation(overlay);
  scheduleOverlayHideCompletion(bg, overlay);
};

function renderTaskContent(task) {
  renderCategory(task.category);
  renderTitleDescDate(task);
  renderPriority(task.priority);
}

function renderTaskRelationships(task) {
  renderAssignedContacts(task);
  renderSubtasks(task);
}

function fillTaskOverlay(task) {
  renderTaskContent(task);
  renderTaskRelationships(task);
  setupSubtaskListeners(task);
}

function getCategoryElement() {
  return document.getElementById("overlay-user-story");
}

function setCategoryText(element, category) {
  element.textContent = category || "";
}

function clearElementClasses(element) {
  element.className = "";
}

function addCategoryClass(element, category) {
  element.classList.add(getLabelClass(category));
}

function renderCategory(category) {
  const el = getCategoryElement();
  setCategoryText(el, category);
  clearElementClasses(el);
  addCategoryClass(el, category);
}

function renderTaskTitle(task) {
  document.getElementById("overlay-title").innerHTML = task.title || "";
}

function renderTaskDescription(task) {
  document.getElementById("overlay-description").textContent = task.description || "";
}

function renderTaskDueDate(task) {
  document.getElementById("overlay-due-date").textContent = task.dueDate || "";
}

function renderTitleDescDate(task) {
  renderTaskTitle(task);
  renderTaskDescription(task);
  renderTaskDueDate(task);
}

function getSubtaskPairs() {
  return getPairsByDataIndex() || getPairsByIdPattern() || [];
}

function isValidSubtaskPair(pair) {
  return pair.checkbox && pair.label;
}

function attachSubtaskPairEvents(pair, taskId) {
  const { checkbox, label, img, idx } = pair;
  attachSubtaskEvents(checkbox, label, img, taskId, idx);
}

function setupSubtaskListeners(task) {
  const pairs = getSubtaskPairs();
  pairs.forEach((pair) => {
    if (isValidSubtaskPair(pair)) {
      attachSubtaskPairEvents(pair, task.id);
    }
  });
}

function getEditButton() {
  return document.getElementById("edit-task-btn");
}

function getDeleteButton() {
  return document.getElementById("delete-task-btn");
}

function createEditClickHandler(task) {
  return () => openEditInsideOverlay(task);
}

function handleDeleteTaskError(e) {
  console.error("Error deleting task:", e);
}

async function performTaskDeletion(taskId) {
  await deleteTaskFromDatabase(taskId);
  window.hideOverlay();
}

function createDeleteClickHandler(taskId) {
  return async () => {
    try {
      await performTaskDeletion(taskId);
    } catch (e) {
      handleDeleteTaskError(e);
    }
  };
}

function wireEditButton(task) {
  const btn = getEditButton();
  if (!btn) return;
  btn.onclick = createEditClickHandler(task);
}

function wireDeleteButton(taskId) {
  const btn = getDeleteButton();
  if (!btn) return;
  btn.onclick = createDeleteClickHandler(taskId);
}

function showOverlayUI() {
  const bg = document.getElementById("task-overlay-bg");
  const overlay = document.getElementById("task-overlay");
  if (!bg || !overlay) return;
  bg.classList.remove("d-none");
  overlay.classList.remove("animate-out");
  overlay.classList.add("animate-in");
}

function toggleTaskOverlayContent() {
  document.getElementById("task-overlay-content").classList.toggle("d-none");
}

function toggleEditWrapper() {
  document.querySelector(".edit-addtask-wrapper").classList.toggle("d-none");
}

function getEditFormSource() {
  return document.querySelector(".addtask-aside-clone .addtask-wrapper");
}

function getEditFormDestination() {
  return document.querySelector(".edit-addtask");
}

function areFormMoveElementsValid(src, dst) {
  return src !== null && dst !== null;
}

function moveFormElement(src, dst) {
  dst.replaceChildren(src);
}

function moveFormToEditArea() {
  const src = getEditFormSource();
  const dst = getEditFormDestination();
  
  if (areFormMoveElementsValid(src, dst)) {
    moveFormElement(src, dst);
  }
}

function onEditTaskBtnClick() {
  toggleTaskOverlayContent();
  toggleEditWrapper();
  moveFormToEditArea();
}

function setupEditTaskButton() {
  const editBtn = document.getElementById("edit-task-btn");
  if (editBtn) {
    editBtn.addEventListener("click", onEditTaskBtnClick);
  }
}

(function initTaskOverlayCore() {
  setupEditTaskButton();
}());