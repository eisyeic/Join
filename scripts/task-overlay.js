/**
 * @file Task Overlay & Add-Task Overlay logic.
 * Opens/hides the task overlay, renders content, wires edit/delete actions,
 * normalizes subtasks, and controls the Add-Task overlay.
 *
 * Assumptions:
 * - Global helper function `$` (getElementById).
 * - The HTML structure contains the IDs/classes referenced here.
 */

import {
  getDatabase,
  update,
  ref,
  get,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { renderAssignedContacts, renderSubtasks } from "./template.modul.js";

/**
 * Subtask shape.
 * @typedef {Object} Subtask
 * @property {string} name
 * @property {boolean} [checked]
 */

/**
 * Minimal Task shape used here.
 * @typedef {Object} Task
 * @property {string} [id]
 * @property {string} [title]
 * @property {string} [description]
 * @property {string} [dueDate]           - Expected "DD/MM/YYYY".
 * @property {"urgent"|"medium"|"low"} [priority]
 * @property {string} [category]
 * @property {Subtask[]} [subtasks]
 */

/** Firebase Realtime Database instance */
const db = getDatabase();

/** Supported board columns. */
const TASK_CATEGORIES = ["toDo", "inProgress", "awaitFeedback", "done"];

/**
 * Opens the task overlay for a given task ID.
 * Loads the task, normalizes subtasks, renders UI, wires buttons, and shows the overlay.
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
 * Hides the task overlay with a fade-out animation.
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

/**
 * Fetches a task by ID from RTDB and attaches the ID to the object.
 * @param {string} taskId
 * @returns {Promise<Task|null>}
 */
async function fetchTask(taskId) {
  const snap = await get(ref(db, `tasks/${taskId}`));
  if (!snap.exists()) return null;
  const task = /** @type {Task} */ (snap.val());
  task.id = taskId;
  return task;
}

/**
 * Renders all overlay sections for a task.
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
 * Renders the category label text and CSS class.
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
 * Renders title, description, and due date.
 * @param {Task} task
 * @returns {void}
 */
function renderTitleDescDate(task) {
  $("overlay-title").innerHTML = task.title || "";
  $("overlay-description").textContent = task.description || "";
  $("overlay-due-date").textContent = task.dueDate || "";
}

/**
 * Renders priority text and icon.
 * @param {"urgent"|"medium"|"low"} [priority]
 * @returns {void}
 */
export function renderPriority(priority) {
  const icons = {
    urgent: "./assets/icons/board/Urgent.svg",
    medium: "./assets/icons/board/Medium.svg",
    low: "./assets/icons/board/Low.svg",
  };
  $("overlay-priority-text").textContent = capitalize(priority);
  $("overlay-priority-icon").src = icons[priority] || "";
}

/**
 * Capitalizes the first character of a string.
 * @param {string} [str]
 * @returns {string}
 */
function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
}

/**
 * Wires subtask checkbox/label pairs (UI + status updates).
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
 * Finds checkbox/label/img pairs via data-subtask-index attribute.
 * @returns {{checkbox: HTMLInputElement, label: HTMLLabelElement|null, img: HTMLImageElement|null, idx: number}[]|null}
 */
function getPairsByDataIndex() {
  const nodes = document.querySelectorAll("[data-subtask-index]");
  if (!nodes.length) return null;
  /** @type {{checkbox: HTMLInputElement, label: HTMLLabelElement|null, img: HTMLImageElement|null, idx: number}[]} */
  const out = [];
  nodes.forEach((el) => {
    const idx = parseInt(el.getAttribute("data-subtask-index") || "", 10);
    const checkbox =
      el.matches('input[type="checkbox"]') ? /** @type {HTMLInputElement} */ (el) : el.querySelector('input[type="checkbox"]');
    if (!checkbox || Number.isNaN(idx)) return;
    const label =
      document.querySelector(`label[for="${checkbox.id}"]`) ||
      /** @type {HTMLLabelElement} */ (checkbox.nextElementSibling);
    const img = label ? /** @type {HTMLImageElement|null} */ (label.querySelector("img")) : null;
    out.push({ checkbox, label, img, idx });
  });
  return out;
}

/**
 * Finds checkbox/label/img pairs via ID pattern "subtaskN".
 * @returns {{checkbox: HTMLInputElement, label: HTMLLabelElement|null, img: HTMLImageElement|null, idx: number}[]|null}
 */
function getPairsByIdPattern() {
  const boxes = document.querySelectorAll('input[type="checkbox"][id^="subtask"]');
  if (!boxes.length) return null;
  /** @type {{checkbox: HTMLInputElement, label: HTMLLabelElement|null, img: HTMLImageElement|null, idx: number}[]} */
  const out = [];
  boxes.forEach((checkbox) => {
    const m = (checkbox.id || "").match(/(\d+)$/);
    if (!m) return;
    const idx = parseInt(m[1], 10);
    const label =
      document.querySelector(`label[for="${checkbox.id}"]`) ||
      /** @type {HTMLLabelElement} */ (checkbox.nextElementSibling);
    const img = label ? /** @type {HTMLImageElement|null} */ (label.querySelector("img")) : null;
    out.push({ checkbox: /** @type {HTMLInputElement} */ (checkbox), label, img, idx });
  });
  return out;
}

/**
 * Wires the edit button inside the overlay.
 * @param {Task} task
 * @returns {void}
 */
function wireEditButton(task) {
  const btn = $("edit-task-btn");
  if (!btn) return;
  btn.onclick = () => openEditInsideOverlay(task);
}

/**
 * Wires the delete button inside the overlay.
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
 * Shows the overlay background and plays the animate-in transition.
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

/**
 * Attaches subtask checkbox listeners for UI/hover icon + backend status.
 * @param {HTMLInputElement} checkbox
 * @param {HTMLLabelElement} label
 * @param {HTMLImageElement|null} img
 * @param {string} taskId
 * @param {number} index
 * @returns {void}
 */
function attachSubtaskEvents(checkbox, label, img, taskId, index) {
  const updateImage = () => {
    if (!img) return;
    const hover = label.matches(":hover");
    const p = "./assets/icons/add_task/";
    img.src = checkbox.checked
      ? p + (hover ? "checked_hover.svg" : "check_checked.svg")
      : p + (hover ? "check_default_hover.svg" : "check_default.svg");
  };
  checkbox.addEventListener("change", () => {
    label.classList.toggle("checked", checkbox.checked);
    updateImage();
    updateSubtaskStatus(taskId, index, checkbox.checked);
  });
  label.addEventListener("mouseenter", updateImage);
  label.addEventListener("mouseleave", updateImage);
}

/**
 * Normalizes subtasks to the shape { name, checked }.
 * @param {string} taskId
 * @param {Task} task
 * @returns {Promise<void>}
 */
async function normalizeSubtasks(taskId, task) {
  if (!Array.isArray(task.subtasks)) return;
  const normalized = task.subtasks.map((st) =>
    typeof st === "string" ? { name: st, checked: false } : st
  );
  await update(ref(db, `tasks/${taskId}`), { subtasks: normalized });
  task.subtasks = normalized;
}

/**
 * Updates a single subtask "checked" state in RTDB.
 * @param {string} taskId
 * @param {number} subtaskIndex
 * @param {boolean} isChecked
 * @returns {Promise<void>}
 */
export async function updateSubtaskStatus(taskId, subtaskIndex, isChecked) {
  const taskRef = ref(db, `tasks/${taskId}`);
  const snap = await get(taskRef);
  const task = /** @type {Task} */ (snap.val());
  if (!task?.subtasks?.[subtaskIndex]) return;
  const updated = task.subtasks.map((st, i) =>
    i === subtaskIndex
      ? { ...(typeof st === "string" ? { name: st } : st), checked: isChecked }
      : st
  );
  await update(taskRef, { subtasks: updated });
}

/**
 * Opens the Add Task overlay and resets the form.
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
 * Closes the Add Task overlay with a slide-out animation.
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
 * Toggles the Add Task overlay (open/close) and moves the form back to the aside.
 * @returns {void}
 */
window.toggleAddTaskBoard = function () {
  if (overlay.classList.contains("d-none")) openOverlay();
  else closeOverlay();
  moveFormBackToAside();
};

/**
 * Moves the Add Task form back to the aside placeholder.
 * @returns {void}
 */
function moveFormBackToAside() {
  const src = document.querySelector(".edit-addtask .addtask-wrapper");
  const dst = document.querySelector(".addtask-aside-clone");
  if (src && dst) dst.replaceChildren(src);
}

/**
 * Wires the edit button inside the Add-Task overlay.
 * @returns {void}
 */
function setupEditTaskButton() {
  const editBtn = $("edit-task-btn");
  if (editBtn) {
    editBtn.addEventListener("click", onEditTaskBtnClick);
  }
}

/**
 * Handler for the edit button in the Add-Task overlay.
 * @returns {void}
 */
function onEditTaskBtnClick() {
  $("task-overlay-content").classList.toggle("d-none");
  document.querySelector(".edit-addtask-wrapper").classList.toggle("d-none");
  const src = document.querySelector(".addtask-aside-clone .addtask-wrapper");
  const dst = document.querySelector(".edit-addtask");
  if (src && dst) dst.replaceChildren(src);
}

/** Overlay root element */
const overlay = $("overlay-add-task");
/** Overlay content element */
const overlayContent = document.querySelector(".add-task-overlay-content");

/**
 * Wires a click listener on the overlay backdrop to close it.
 * @returns {void}
 */
function setupOverlayListener() {
  overlay?.addEventListener("click", onOverlayBackdropClick);
}

/**
 * Initializes the task overlay (buttons & listeners).
 * @returns {void}
 */
(function initTaskOverlay() {
  setupEditTaskButton();
  setupOverlayListener();
}());

/**
 * Closes the Add-Task overlay when the backdrop is clicked.
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
 * Renders the subtask progress bar + label.
 * @param {Subtask[]} subtasks
 * @returns {string} HTML string
 */
export function renderSubtaskProgress(subtasks) {
  const total = subtasks.length;
  const done = subtasks.filter((st) => st.checked).length;
  const percentage = total ? Math.round((done / total) * 100) : 0;
  return `
    <div class="subtasks-box">
      <div class="progressbar">
        <div class="progressbar-inlay" style="width: ${percentage}%"></div>
      </div>
      ${done}/${total} Subtasks
    </div>
  `;
}

/**
 * Maps a task category to a CSS label class.
 * @param {string} [category]
 * @returns {string}
 */
export function getLabelClass(category) {
  return (
    {
      "User Story": "user-story",
      "Technical task": "technical-task",
    }[category] || ""
  );
}