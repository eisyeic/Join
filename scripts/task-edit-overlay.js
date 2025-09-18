/** @file Edit overlay: switch to edit mode, populate form, sync with Firebase. */

import {
  ddmmyyyyToISO, isoToDDMMYYYY, ensureDateHandlersBound,
  resolveIsoFromRaw, applyDateUIState, computeDateStrings, applyDateInput,
  getAssignedArray, renderInitials, hideInitialsBox, initialsHtmlFromPerson, computedInitials,
  normalizeSubtasks, ensureGlobalSubtasks, overwriteGlobalSubtasks, renderSubtasksIfAny,
  getSelectedIds, toggleLiSelected
} from "./edit-overlay-helpers.js";



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
 * @param {object|string} taskOrId
 * @returns {boolean}
 */
function isTaskId(taskOrId) {
  return typeof taskOrId === 'string';
}

/**
 * Checks if input is a task object
 * @param {object|string} taskOrId
 * @returns {boolean}
 */
function isTaskObject(taskOrId) {
  return taskOrId && typeof taskOrId === 'object';
}

/**
 * Handles task loading by ID
 * @param {string} taskId
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
 * @param {object} task
 */
function handleTaskObjectInput(task) {
  proceedEditWithTask(task);
}

/**
 * Routes task input to appropriate handler
 * @param {object|string} taskOrId
 */
function routeTaskInput(taskOrId) {
  if (isTaskId(taskOrId)) {
    handleTaskIdInput(taskOrId);
  } else if (isTaskObject(taskOrId)) {
    handleTaskObjectInput(taskOrId);
  }
}

/**
 * Open the edit overlay and load a task.
 * @param {object|string} taskOrId Task object or task ID.
 * @returns {void}
 */
function openEditInsideOverlay(taskOrId) {
  prepareEditOverlay();
  routeTaskInput(taskOrId);
}

/**
 * Sets up task for editing
 * @param {any} task
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
 * Continue with a loaded task.
 * @param {any} task
 * @returns {void}
 */
function proceedEditWithTask(task) {
  setupTaskForEditing(task);
  applyUIEnhancements();
  deferPopulateAndCap(task);
  addEditEventsIfAvailable();
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
 * Gets task overlay content element
 * @returns {HTMLElement|null}
 */
function getTaskOverlayContent() {
  return document.getElementById("task-overlay-content");
}

/**
 * Gets edit wrapper element
 * @returns {HTMLElement|null}
 */
function getEditWrapper() {
  return document.querySelector(".edit-addtask-wrapper");
}

/**
 * Hides task overlay content
 * @param {HTMLElement} element
 */
function hideTaskContent(element) {
  element?.classList.add("d-none");
}

/**
 * Shows edit wrapper
 * @param {HTMLElement} element
 */
function showEditWrapper(element) {
  element?.classList.remove("d-none");
}

/**
 * Show edit view.
 * @returns {void}
 */
function switchToEditView() {
  const taskContent = getTaskOverlayContent();
  const editWrap = getEditWrapper();
  hideTaskContent(taskContent);
  showEditWrapper(editWrap);
}

/**
 * Finds form source element
 * @returns {HTMLElement|null}
 */
function findFormSource() {
  return document.querySelector(".addtask-aside-clone .addtask-wrapper") ||
         document.querySelector(".edit-addtask .addtask-wrapper");
}

/**
 * Finds form destination element
 * @returns {HTMLElement|null}
 */
function findFormDestination() {
  return document.querySelector(".edit-addtask");
}

/**
 * Checks if form needs to be moved
 * @param {HTMLElement} src
 * @param {HTMLElement} dst
 * @returns {boolean}
 */
function shouldMoveForm(src, dst) {
  return src && dst && src.parentElement !== dst;
}

/**
 * Moves form to destination
 * @param {HTMLElement} src
 * @param {HTMLElement} dst
 */
function moveFormToDestination(src, dst) {
  dst.replaceChildren(src);
}

/**
 * Move the Add Task form into the edit container.
 * @returns {void}
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
 * @returns {HTMLElement|null}
 */
function getAddtaskWrapper() {
  return document.querySelector(".addtask-wrapper");
}

/**
 * Checks if task has valid ID
 * @param {any} task
 * @returns {boolean}
 */
function hasValidTaskId(task) {
  return task?.id !== undefined && task?.id !== null;
}

/**
 * Sets editing ID on wrapper
 * @param {HTMLElement} wrapper
 * @param {string} taskId
 */
function setEditingIdOnWrapper(wrapper, taskId) {
  wrapper.dataset.editingId = String(taskId);
}

/**
 * Store the currently editing task ID.
 * @param {any} task
 * @returns {void}
 */
function markEditingId(task) {
  const wrap = getAddtaskWrapper();
  
  if (wrap && hasValidTaskId(task)) {
    setEditingIdOnWrapper(wrap, task.id);
  }
}

/**
 * Checks if custom edit mode function exists
 * @returns {boolean}
 */
function hasCustomEditMode() {
  return typeof window.enterAddTaskEditMode === "function";
}

/**
 * Tries to use custom edit mode
 * @param {any} task
 * @returns {boolean} Success status
 */
function tryCustomEditMode(task) {
  try {
    window.enterAddTaskEditMode(task);
    return true;
  } catch (e) {
    console.warn("enterAddTaskEditMode failed, using fallback", e);
    return false;
  }
}

/**
 * Uses custom edit mode if available
 * @param {any} task
 * @returns {boolean} Whether custom mode was used
 */
function useCustomEditModeIfAvailable(task) {
  if (hasCustomEditMode()) {
    return tryCustomEditMode(task);
  }
  return false;
}

/**
 * Populate form (custom hook if available, else fallback).
 * @param {any} task
 * @returns {void}
 */
function populateEditForm(task) {
  if (!useCustomEditModeIfAvailable(task)) {
    populateEditFormFallback(task);
  }
}

/**
 * Validates task for form population
 * @param {any} task
 * @returns {boolean}
 */
function isValidTaskForPopulation(task) {
  return task !== null && task !== undefined;
}

/**
 * Populates basic form fields
 * @param {any} task
 */
function populateBasicFields(task) {
  setTitleAndDescription(task);
  setDueDateField(task);
  setCategorySelection(task);
  setPriorityButtons(task);
}

/**
 * Populates relationship fields
 * @param {any} task
 */
function populateRelationshipFields(task) {
  setAssignedContactsUI(task);
  setSubtasksArray(task);
}

/**
 * Fallback: set all fields based on task.
 * @param {any} task
 * @returns {void}
 */
function populateEditFormFallback(task) {
  if (!isValidTaskForPopulation(task)) return;
  
  markEditingId(task);
  populateBasicFields(task);
  populateRelationshipFields(task);
}

/**
 * Gets title input element
 * @returns {HTMLInputElement|null}
 */
function getTitleElement() {
  return /** @type {HTMLInputElement|null} */ (document.getElementById("addtask-title"));
}

/**
 * Gets description textarea element
 * @returns {HTMLTextAreaElement|null}
 */
function getDescriptionElement() {
  return /** @type {HTMLTextAreaElement|null} */ (document.getElementById("addtask-textarea"));
}

/**
 * Sets title value
 * @param {HTMLInputElement} element
 * @param {any} task
 */
function setTitleValue(element, task) {
  element.value = task.title || "";
}

/**
 * Sets description value
 * @param {HTMLTextAreaElement} element
 * @param {any} task
 */
function setDescriptionValue(element, task) {
  element.value = task.description || "";
}

/**
 * Set title & description.
 * @param {any} task
 * @returns {void}
 */
function setTitleAndDescription(task) {
  const titleEl = getTitleElement();
  const descEl = getDescriptionElement();
  
  if (titleEl) setTitleValue(titleEl, task);
  if (descEl) setDescriptionValue(descEl, task);
}

/**
 * Gets datepicker element
 * @returns {HTMLInputElement|null}
 */
function getDatepickerElement() {
  return /** @type {HTMLInputElement|null} */(document.getElementById('datepicker'));
}

/**
 * Gets date wrapper elements
 * @returns {Object}
 */
function getDateWrapperElements() {
  return {
    wrapper: document.getElementById('datepicker-wrapper'),
    display: document.getElementById('date-display'),
    placeholder: document.getElementById('date-placeholder')
  };
}

/**
 * Applies date input value
 * @param {HTMLInputElement} dateEl
 * @param {string} iso
 */
function applyDateInputValue(dateEl, iso) {
  applyDateInput(dateEl, iso);
}

/**
 * Applies date UI state to elements
 * @param {Object} elements
 * @param {string} ddmmyyyy
 */
function applyDateUIToElements(elements, ddmmyyyy) {
  applyDateUIState(
    elements.wrapper,
    elements.display,
    elements.placeholder,
    ddmmyyyy
  );
}

/**
 * Set due date.
 * @param {any} task
 * @returns {void}
 */
function setDueDateField(task) {
  const dateEl = getDatepickerElement();
  if (!dateEl) return;
  
  const { iso, ddmmyyyy } = computeDateStrings(task?.dueDate);
  const elements = getDateWrapperElements();
  
  applyDateInputValue(dateEl, iso);
  applyDateUIToElements(elements, ddmmyyyy);
}

/**
 * Gets category select element
 * @returns {HTMLElement|null}
 */
function getCategorySelectElement() {
  return document.getElementById("category-select");
}

/**
 * Gets category span element
 * @param {HTMLElement} selectElement
 * @returns {HTMLElement|null}
 */
function getCategorySpan(selectElement) {
  return selectElement ? selectElement.querySelector("span") : null;
}

/**
 * Gets category text or default
 * @param {any} task
 * @returns {string}
 */
function getCategoryText(task) {
  return task.category || "Select task category";
}

/**
 * Gets category value or empty string
 * @param {any} task
 * @returns {string}
 */
function getCategoryValue(task) {
  return task.category || "";
}

/**
 * Sets category span text
 * @param {HTMLElement} span
 * @param {string} text
 */
function setCategorySpanText(span, text) {
  span.textContent = text;
}

/**
 * Sets category select value
 * @param {HTMLElement} select
 * @param {string} value
 */
function setCategorySelectValue(select, value) {
  select.dataset.value = value;
}

/**
 * Set category selection.
 * @param {any} task
 * @returns {void}
 */
function setCategorySelection(task) {
  const sel = getCategorySelectElement();
  const span = getCategorySpan(sel);
  
  if (span) setCategorySpanText(span, getCategoryText(task));
  if (sel) setCategorySelectValue(sel, getCategoryValue(task));
}

/**
 * Gets all priority buttons
 * @returns {NodeListOf<Element>}
 */
function getAllPriorityButtons() {
  return document.querySelectorAll(".prio-buttons .priority-button");
}

/**
 * Clears active state from all priority buttons
 */
function clearActivePriorityButtons() {
  getAllPriorityButtons().forEach((b) => b.classList.remove("active"));
}

/**
 * Gets priority button selector map
 * @returns {Object}
 */
function getPriorityButtonMap() {
  return { urgent: ".urgent-button", medium: ".medium-button", low: ".low-button" };
}

/**
 * Gets normalized priority key
 * @param {any} task
 * @returns {string}
 */
function getNormalizedPriorityKey(task) {
  return (task.priority || "medium").toLowerCase();
}

/**
 * Gets priority button selector
 * @param {string} key
 * @returns {string}
 */
function getPriorityButtonSelector(key) {
  const map = getPriorityButtonMap();
  return map[key] || ".medium-button";
}

/**
 * Activates priority button
 * @param {string} selector
 */
function activatePriorityButton(selector) {
  document.querySelector(selector)?.classList.add("active");
}

/**
 * Activate priority button.
 * @param {any} task
 * @returns {void}
 */
function setPriorityButtons(task) {
  clearActivePriorityButtons();
  const key = getNormalizedPriorityKey(task);
  const selector = getPriorityButtonSelector(key);
  activatePriorityButton(selector);
}

/**
 * Gets contact initials box element
 * @returns {HTMLElement|null}
 */
function getContactInitialsBox() {
  return document.getElementById("contact-initials");
}

/**
 * Gets assigned select box element
 * @returns {HTMLElement|null}
 */
function getAssignedSelectBox() {
  return document.getElementById("assigned-select-box");
}

/**
 * Renders initials in box
 * @param {HTMLElement} initialsBox
 * @param {Array} assigned
 */
function renderInitialsInBox(initialsBox, assigned) {
  renderInitials(initialsBox, assigned);
}

/**
 * Extracts contact IDs from assigned array
 * @param {Array} assigned
 * @returns {Array}
 */
function extractContactIds(assigned) {
  return assigned.map((p) => p.id).filter(Boolean);
}

/**
 * Sets selected data on select box
 * @param {HTMLElement} selectBox
 * @param {Array} contactIds
 */
function setSelectedData(selectBox, contactIds) {
  selectBox.dataset.selected = JSON.stringify(contactIds);
}

/**
 * Render assigned contacts & persist selection.
 * @param {any} task
 * @returns {void}
 */
function setAssignedContactsUI(task) {
  const assigned = getAssignedArray(task);
  const initialsBox = getContactInitialsBox();
  const selectBox = getAssignedSelectBox();
  
  if (initialsBox) renderInitialsInBox(initialsBox, assigned);
  if (selectBox) {
    const contactIds = extractContactIds(assigned);
    setSelectedData(selectBox, contactIds);
  }
}

/**
 * Validates subtasks array
 * @param {any} task
 * @returns {boolean}
 */
function hasValidSubtasksArray(task) {
  return Array.isArray(task.subtasks);
}

/**
 * Processes subtasks data
 * @param {Array} subtasks
 * @returns {Array}
 */
function processSubtasksData(subtasks) {
  return normalizeSubtasks(subtasks);
}

/**
 * Syncs subtasks to global state
 * @param {Array} normalizedList
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
 * @param {Array} subtasks
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
 * Sync global subtasks array and render.
 * @param {any} task
 * @returns {void}
 */
function setSubtasksArray(task) {
  if (!hasValidSubtasksArray(task)) return;
  processSubtasksSafely(task.subtasks);
}

/**
 * Gets contact list box element
 * @returns {HTMLElement|null}
 */
function getContactListBox() {
  return document.getElementById("contact-list-box");
}

/**
 * Validates list sync elements
 * @param {HTMLElement|null} list
 * @param {HTMLElement|null} selectBox
 * @returns {boolean}
 */
function areListSyncElementsValid(list, selectBox) {
  return list !== null && selectBox !== null;
}

/**
 * Creates selected IDs set
 * @param {HTMLElement} selectBox
 * @returns {Set}
 */
function createSelectedIdsSet(selectBox) {
  return new Set(getSelectedIds(selectBox));
}

/**
 * Gets all list items
 * @param {HTMLElement} list
 * @returns {NodeListOf<Element>}
 */
function getAllListItems(list) {
  return list.querySelectorAll("li");
}

/**
 * Toggles selection state for all list items
 * @param {NodeListOf<Element>} listItems
 * @param {Set} idSet
 */
function toggleAllListItemsSelection(listItems, idSet) {
  listItems.forEach((li) => toggleLiSelected(li, idSet));
}

/**
 * Mirror selected assignments into list UI.
 * @returns {void}
 */
function syncAssignedSelectionToList() {
  const list = getContactListBox();
  const selectBox = getAssignedSelectBox();
  
  if (!areListSyncElementsValid(list, selectBox)) return;
  
  const idSet = createSelectedIdsSet(selectBox);
  const listItems = getAllListItems(list);
  toggleAllListItemsSelection(listItems, idSet);
}

/**
 * Imports Firebase RTDB module
 * @returns {Promise<Object>}
 */
async function importFirebaseRTDB() {
  return await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js');
}

/**
 * Imports Firebase app
 * @returns {Promise<Object>}
 */
async function importFirebaseApp() {
  return await import('./firebase.js');
}

/**
 * Gets Firebase database instance
 * @param {Object} RTDB
 * @param {Object} app
 * @returns {Object}
 */
function getFirebaseDatabase(RTDB, app) {
  return RTDB.getDatabase(app);
}

/**
 * Creates task reference
 * @param {Object} RTDB
 * @param {Object} db
 * @param {string} taskId
 * @returns {Object}
 */
function createTaskReference(RTDB, db, taskId) {
  return RTDB.ref(db, `tasks/${taskId}`);
}

/**
 * Fetches task snapshot
 * @param {Object} RTDB
 * @param {Object} taskRef
 * @returns {Promise<Object>}
 */
async function fetchTaskSnapshot(RTDB, taskRef) {
  return await RTDB.get(taskRef);
}

/**
 * Extracts task data from snapshot
 * @param {Object} snapshot
 * @returns {any|null}
 */
function extractTaskData(snapshot) {
  return snapshot.exists() ? snapshot.val() : null;
}

/**
 * Handles task loading error
 * @param {Error} e
 * @returns {null}
 */
function handleTaskLoadError(e) {
  console.error('Failed to load task', e);
  return null;
}

/**
 * Loads task data from Firebase
 * @param {string} taskId
 * @returns {Promise<any|null>}
 */
async function loadTaskFromFirebase(taskId) {
  const RTDB = await importFirebaseRTDB();
  const { app } = await importFirebaseApp();
  const db = getFirebaseDatabase(RTDB, app);
  const taskRef = createTaskReference(RTDB, db, taskId);
  const snapshot = await fetchTaskSnapshot(RTDB, taskRef);
  return extractTaskData(snapshot);
}

/**
 * Load a task by ID from Firebase RTDB.
 * @param {string} taskId
 * @returns {Promise<any|null>}
 */
async function loadTaskById(taskId) {
  try {
    return await loadTaskFromFirebase(taskId);
  } catch (e) {
    return handleTaskLoadError(e);
  }
}

/**
 * Validates task ID for deletion
 * @param {string} taskId
 * @throws {Error} If taskId is missing
 */
function validateTaskIdForDeletion(taskId) {
  if (!taskId) throw new Error("Missing taskId");
}

/**
 * Removes task from Firebase
 * @param {Object} RTDB
 * @param {Object} db
 * @param {string} taskId
 * @returns {Promise<void>}
 */
async function removeTaskFromFirebase(RTDB, db, taskId) {
  const taskRef = createTaskReference(RTDB, db, taskId);
  await RTDB.remove(taskRef);
}

/**
 * Performs task deletion from Firebase
 * @param {string} taskId
 * @returns {Promise<void>}
 */
async function performTaskDeletionFromFirebase(taskId) {
  const RTDB = await importFirebaseRTDB();
  const { app } = await importFirebaseApp();
  const db = getFirebaseDatabase(RTDB, app);
  await removeTaskFromFirebase(RTDB, db, taskId);
}

/**
 * Delete a task from Firebase RTDB.
 * @param {string} taskId
 * @returns {Promise<void>}
 */
window.deleteTaskFromDatabase = async function(taskId) {
  validateTaskIdForDeletion(taskId);
  await performTaskDeletionFromFirebase(taskId);
};

/** Ensure global access to openEditInsideOverlay. */
(function ensureGlobalOpenEdit() {
  if (typeof window.openEditInsideOverlay !== 'function' && typeof openEditInsideOverlay === 'function') {
    window.openEditInsideOverlay = openEditInsideOverlay;
  }
})();