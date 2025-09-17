/** @file Edit overlay: switch to edit mode, populate form, sync with Firebase. */

import {
  ddmmyyyyToISO, isoToDDMMYYYY, ensureDateHandlersBound,
  resolveIsoFromRaw, applyDateUIState, computeDateStrings, applyDateInput,
  getAssignedArray, renderInitials, hideInitialsBox, initialsHtmlFromPerson, computedInitials,
  normalizeSubtasks, ensureGlobalSubtasks, overwriteGlobalSubtasks, renderSubtasksIfAny,
  getSelectedIds, toggleLiSelected
} from "./edit-overlay-helpers.js";



/**
 * Open the edit overlay and load a task.
 * @param {object|string} taskOrId Task object or task ID.
 * @returns {void}
 */
function openEditInsideOverlay(taskOrId) {
  switchToEditView();
  moveFormIntoEdit();
  ensureDateHandlersBound();
  if (typeof taskOrId === 'string') {
    loadTaskById(taskOrId).then((task) => task && proceedEditWithTask({ ...task, id: taskOrId }));
  } else if (taskOrId && typeof taskOrId === 'object') {
    proceedEditWithTask(taskOrId);
  }
}

/**
 * Continue with a loaded task.
 * @param {any} task
 * @returns {void}
 */
function proceedEditWithTask(task) {
  ensureDateHandlersBound();
  markEditingId(task);
  populateEditForm(task);
  queueMicrotask(applyInitialsCapIfAny);
  deferPopulateAndCap(task);
  syncAssignedSelectionToList();
  if (typeof window.addEditEvents === 'function') window.addEditEvents();
}

/** Apply initials cap if hook exists. */
function applyInitialsCapIfAny() {
  if (typeof window.applyAssignedInitialsCap === 'function') applyAssignedInitialsCap();
}

/** Defer another populate + initials cap to ensure UI sync. */
function deferPopulateAndCap(task) {
  setTimeout(() => {
    populateEditForm(task);
    applyInitialsCapIfAny();
  }, 0);
}

/**
 * Show edit view.
 * @returns {void}
 */
function switchToEditView() {
  const taskContent = document.getElementById("task-overlay-content");
  const editWrap = document.querySelector(".edit-addtask-wrapper");
  taskContent?.classList.add("d-none");
  editWrap?.classList.remove("d-none");
}

/**
 * Move the Add Task form into the edit container.
 * @returns {void}
 */
function moveFormIntoEdit() {
  const src =
    document.querySelector(".addtask-aside-clone .addtask-wrapper") ||
    document.querySelector(".edit-addtask .addtask-wrapper");
  const dst = document.querySelector(".edit-addtask");
  if (src && dst && src.parentElement !== dst) dst.replaceChildren(src);
}

/**
 * Store the currently editing task ID.
 * @param {any} task
 * @returns {void}
 */
function markEditingId(task) {
  const wrap = document.querySelector(".addtask-wrapper");
  if (wrap && task?.id) wrap.dataset.editingId = String(task.id);
}

/**
 * Populate form (custom hook if available, else fallback).
 * @param {any} task
 * @returns {void}
 */
function populateEditForm(task) {
  if (typeof window.enterAddTaskEditMode === "function") {
    try { window.enterAddTaskEditMode(task); return; } catch (e) { console.warn("enterAddTaskEditMode failed, using fallback", e); }
  }
  populateEditFormFallback(task);
}

/**
 * Fallback: set all fields based on task.
 * @param {any} task
 * @returns {void}
 */
function populateEditFormFallback(task) {
  if (!task) return;
  markEditingId(task);
  setTitleAndDescription(task);
  setDueDateField(task);
  setCategorySelection(task);
  setPriorityButtons(task);
  setAssignedContactsUI(task);
  setSubtasksArray(task);
}

/**
 * Set title & description.
 * @param {any} task
 * @returns {void}
 */
function setTitleAndDescription(task) {
  const titleEl = document.getElementById("addtask-title");
  const descEl = document.getElementById("addtask-textarea");
  if (titleEl) /** @type {HTMLInputElement} */ (titleEl).value = task.title || "";
  if (descEl) /** @type {HTMLTextAreaElement} */ (descEl).value = task.description || "";
}

/**
 * Set due date.
 * @param {any} task
 * @returns {void}
 */
function setDueDateField(task) {
  const dateEl = /** @type {HTMLInputElement|null} */(document.getElementById('datepicker'));
  if (!dateEl) return;
  const { iso, ddmmyyyy } = computeDateStrings(task?.dueDate);
  applyDateInput(dateEl, iso);
  applyDateUIState(
    document.getElementById('datepicker-wrapper'),
    document.getElementById('date-display'),
    document.getElementById('date-placeholder'),
    ddmmyyyy
  );
}

/**
 * Set category selection.
 * @param {any} task
 * @returns {void}
 */
function setCategorySelection(task) {
  const sel = document.getElementById("category-select");
  const span = sel ? sel.querySelector("span") : null;
  if (span) span.textContent = task.category || "Select task category";
  if (sel) sel.dataset.value = task.category || "";
}

/**
 * Activate priority button.
 * @param {any} task
 * @returns {void}
 */
function setPriorityButtons(task) {
  document.querySelectorAll(".prio-buttons .priority-button")
    .forEach((b) => b.classList.remove("active"));
  const map = { urgent: ".urgent-button", medium: ".medium-button", low: ".low-button" };
  const key = (task.priority || "medium").toLowerCase();
  document.querySelector(map[key] || ".medium-button")?.classList.add("active");
}

/**
 * Render assigned contacts & persist selection.
 * @param {any} task
 * @returns {void}
 */
function setAssignedContactsUI(task) {
  const assigned = getAssignedArray(task);
  const initialsBox = document.getElementById("contact-initials");
  const selectBox = document.getElementById("assigned-select-box");
  if (initialsBox) renderInitials(initialsBox, assigned);
  if (selectBox) selectBox.dataset.selected = JSON.stringify(assigned.map((p) => p.id).filter(Boolean));
}

/**
 * Sync global subtasks array and render.
 * @param {any} task
 * @returns {void}
 */
function setSubtasksArray(task) {
  if (!Array.isArray(task.subtasks)) return;
  try {
    const list = normalizeSubtasks(task.subtasks);
    ensureGlobalSubtasks();
    overwriteGlobalSubtasks(list);
    renderSubtasksIfAny();
    if (typeof window.addEditEvents === "function") window.addEditEvents();
  } catch {}
}

/**
 * Mirror selected assignments into list UI.
 * @returns {void}
 */
function syncAssignedSelectionToList() {
  const list = document.getElementById("contact-list-box");
  const selectBox = document.getElementById("assigned-select-box");
  if (!list || !selectBox) return;
  const idSet = new Set(getSelectedIds(selectBox));
  list.querySelectorAll("li").forEach((li) => toggleLiSelected(li, idSet));
}

/**
 * Load a task by ID from Firebase RTDB.
 * @param {string} taskId
 * @returns {Promise<any|null>}
 */
async function loadTaskById(taskId) {
  try {
    const RTDB = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js');
    const { app } = await import('./firebase.js');
    const db = RTDB.getDatabase(app);
    const snap = await RTDB.get(RTDB.ref(db, `tasks/${taskId}`));
    return snap.exists() ? snap.val() : null;
  } catch (e) {
    console.error('Failed to load task', e);
    return null;
  }
}

/**
 * Delete a task from Firebase RTDB.
 * @param {string} taskId
 * @returns {Promise<void>}
 */
window.deleteTaskFromDatabase = async function(taskId) {
  if (!taskId) throw new Error("Missing taskId");
  const RTDB = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js");
  const { app } = await import("./firebase.js");
  const db = RTDB.getDatabase(app);
  await RTDB.remove(RTDB.ref(db, `tasks/${taskId}`));
};

/** Ensure global access to openEditInsideOverlay. */
(function ensureGlobalOpenEdit() {
  if (typeof window.openEditInsideOverlay !== 'function' && typeof openEditInsideOverlay === 'function') {
    window.openEditInsideOverlay = openEditInsideOverlay;
  }
})();