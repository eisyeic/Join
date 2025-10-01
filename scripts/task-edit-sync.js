/**
 * @file task-edit-sync.js
 * @description Synchronization and data processing for task editing
 */
import { 
  normalizeSubtasks, ensureGlobalSubtasks, overwriteGlobalSubtasks, 
  renderSubtasksIfAny, getSelectedIds, toggleLiSelected 
} from "./edit-overlay-helpers.js";

/**
 * Validates subtasks array
 */
function hasValidSubtasksArray(task) {
  return Array.isArray(task.subtasks);
}

/**
 * Processes subtasks data
 */
function processSubtasksData(subtasks) {
  return normalizeSubtasks(subtasks);
}

/**
 * Syncs subtasks to global state
 */
function syncSubtasksToGlobal(normalizedList) {
  ensureGlobalSubtasks();
  overwriteGlobalSubtasks(normalizedList);
}

/**
 * Renders subtasks UI
 */
function renderSubtasksUI() {
  renderSubtasksIfAny();
}

/**
 * Adds edit events for subtasks
 */
function addSubtaskEditEvents() {
  if (typeof window.addEditEvents === "function") {
    window.addEditEvents();
  }
}

/**
 * Processes subtasks safely
 */
function processSubtasksSafely(subtasks) {
  try {
    const list = processSubtasksData(subtasks);
    syncSubtasksToGlobal(list);
    renderSubtasksUI();
    addSubtaskEditEvents();
  } catch {}
}

/**
 * Sync global subtasks array and render
 */
function setSubtasksArray(task) {
  if (!hasValidSubtasksArray(task)) return;
  processSubtasksSafely(task.subtasks);
}

/**
 * Gets contact list box element
 */
function getContactListBox() {
  return document.getElementById("contact-list-box");
}

/**
 * Gets assigned select box element
 */
function getAssignedSelectBox() {
  return document.getElementById("assigned-select-box");
}

/**
 * Validates list sync elements
 */
function areListSyncElementsValid(list, selectBox) {
  return list !== null && selectBox !== null;
}

/**
 * Creates selected IDs set
 */
function createSelectedIdsSet(selectBox) {
  return new Set(getSelectedIds(selectBox));
}

/**
 * Gets all list items
 */
function getAllListItems(list) {
  return list.querySelectorAll("li");
}

/**
 * Toggles selection state for all list items
 */
function toggleAllListItemsSelection(listItems, idSet) {
  listItems.forEach((li) => toggleLiSelected(li, idSet));
}

/**
 * Mirror selected assignments into list UI
 */
function syncAssignedSelectionToList() {
  const list = getContactListBox();
  const selectBox = getAssignedSelectBox();
  
  if (!areListSyncElementsValid(list, selectBox)) return;
  
  const idSet = createSelectedIdsSet(selectBox);
  const listItems = getAllListItems(list);
  toggleAllListItemsSelection(listItems, idSet);
}

export { setSubtasksArray, syncAssignedSelectionToList };