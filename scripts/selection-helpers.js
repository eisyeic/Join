/** 
 * @file Selection and subtask utilities for task edit overlay.
 * Contains selection handling, subtask management, and UI state updates.
 */

/* ---------- Subtasks ---------- */

/**
 * Normalize subtasks to a string array.
 * @param {Array<string|{name?:string}>} arr
 * @returns {string[]}
 */
export function normalizeSubtasks(arr) {
  return arr.map((st) => (typeof st === "string" ? st : st?.name || "")).filter(Boolean);
}

/**
 * Ensure global window.subtasks exists.
 * @returns {void}
 */
export function ensureGlobalSubtasks() {
  if (!Array.isArray(window.subtasks)) window.subtasks = [];
}

/**
 * Replace window.subtasks with a new list.
 * @param {string[]} list
 * @returns {void}
 */
export function overwriteGlobalSubtasks(list) {
  window.subtasks.length = 0;
  window.subtasks.push(...list);
}

/**
 * Render subtasks if global hook is present.
 * @returns {void}
 */
export function renderSubtasksIfAny() {
  if (typeof window.renderSubtasks === "function") window.renderSubtasks();
}

/* ---------- Selection helpers ---------- */

/**
 * Parse selected IDs from a dataset string.
 * @param {HTMLElement} selectBox
 * @returns {string[]}
 */
export function getSelectedIds(selectBox) {
  try { return JSON.parse(selectBox.dataset.selected || "[]") || []; } catch { return []; }
}

/**
 * Toggle list item selected state and its check icon
 * @param {HTMLElement} li
 * @param {Set<string>} idSet
 * @returns {void}
 */
export function toggleLiSelected(li, idSet) {
  const isSelected = determineSelectionState(li, idSet);
  updateListItemState(li, isSelected);
  updateCheckIcon(li, isSelected);
}

/**
 * Determines if item is selected
 * @param {HTMLElement} li
 * @param {Set<string>} idSet
 * @returns {boolean}
 */
function determineSelectionState(li, idSet) {
  return idSet.has(li.id);
}

/**
 * Updates list item selected state
 * @param {HTMLElement} li
 * @param {boolean} isSelected
 */
function updateListItemState(li, isSelected) {
  li.classList.toggle("selected", isSelected);
}

/**
 * Updates check icon based on selection
 * @param {HTMLElement} li
 * @param {boolean} isSelected
 */
function updateCheckIcon(li, isSelected) {
  const img = li.querySelector("img");
  if (img) {
    img.src = getCheckIconPath(isSelected);
  }
}

/**
 * Gets appropriate check icon path
 * @param {boolean} isSelected
 * @returns {string}
 */
function getCheckIconPath(isSelected) {
  return isSelected 
    ? "./assets/icons/add_task/check_white.svg" 
    : "./assets/icons/add_task/check_default.svg";
}