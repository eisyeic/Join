/**
 * @file Board drag & drop utilities for task cards.
 * All functions follow Single Responsibility Principle.
 */

/** make global */
window.drag = onTaskDragStart;

export { 
  onTaskDragStart, 
  initDnDListeners, 
  highlightColumn, 
  unhighlightColumn, 
  resetColumnBackgrounds,
  DOM_TO_LOGICAL 
};

/** Tracks whether a drag operation is in progress. */
let IS_DRAGGING = false;

/**
 * Map DOM column ids to logical column keys used in data model.
 * @type {Record<string,string>}
 */
const DOM_TO_LOGICAL = {
  "to-do-column": "todo",
  "in-progress-column": "inProgress",
  "await-feedback-column": "awaitFeedback",
  "done-column": "done",
};

/**
 * Set dragging state to false.
 * @returns {void}
 */
function clearDragState() {
  IS_DRAGGING = false;
}

/**
 * Finalize drag end operation.
 * @param {Event} _
 * @returns {void}
 */
function onDragEndFinalize(_) {
  clearDragState();
  resetColumnBackgrounds();
}

/**
 * Get element ID from drag event.
 * @param {DragEvent} e
 * @returns {string}
 */
function getElementId(e) {
  return e.currentTarget?.id || e.target.id;
}

/**
 * Set drag data on DataTransfer object.
 * @param {DataTransfer} dataTransfer
 * @param {string} id
 * @returns {void}
 */
function setDragData(dataTransfer, id) {
  dataTransfer.setData("text/plain", id);
  dataTransfer.setData("text", id);
}

/**
 * Set drag effect to move.
 * @param {DataTransfer} dataTransfer
 * @returns {void}
 */
function setMoveEffect(dataTransfer) {
  dataTransfer.effectAllowed = "move";
}

/**
 * Set dragging state to true.
 * @returns {void}
 */
function setDragState() {
  IS_DRAGGING = true;
}

/**
 * Add dragend listener to element.
 * @param {EventTarget} element
 * @returns {void}
 */
function addDragEndListener(element) {
  element?.addEventListener("dragend", onDragEndFinalize, { once: true });
}

/**
 * Initialize drag operation with data transfer setup.
 * @param {DragEvent} e
 * @returns {void}
 */
function onTaskDragStart(e) {
  const id = getElementId(e);
  
  if (id && e.dataTransfer) {
    setDragData(e.dataTransfer, id);
  }
  
  if (e.dataTransfer) {
    setMoveEffect(e.dataTransfer);
  }
  
  setDragState();
  addDragEndListener(e.currentTarget);
}

/**
 * Check if drag operation is active.
 * @returns {boolean}
 */
function isDragActive() {
  return IS_DRAGGING;
}

/**
 * Handle dragenter event.
 * @param {DragEvent} e
 * @param {HTMLElement} list
 * @returns {void}
 */
function handleDragEnter(e, list) {
  if (!isDragActive()) return;
  e.preventDefault();
  highlightColumn(list);
}

/**
 * Set drop effect to move.
 * @param {DataTransfer} dataTransfer
 * @returns {void}
 */
function setDropEffect(dataTransfer) {
  dataTransfer.dropEffect = "move";
}

/**
 * Handle dragover event.
 * @param {DragEvent} e
 * @param {HTMLElement} list
 * @returns {void}
 */
function handleDragOver(e, list) {
  if (!isDragActive()) return;
  e.preventDefault();
  
  if (e.dataTransfer) {
    setDropEffect(e.dataTransfer);
  }
  
  highlightColumn(list);
}

/**
 * Get element at coordinates.
 * @param {number} x
 * @param {number} y
 * @returns {Element|null}
 */
function getElementAtPoint(x, y) {
  return document.elementFromPoint(x, y);
}

/**
 * Check if element is still within container.
 * @param {DragEvent} e
 * @param {HTMLElement} list
 * @returns {boolean}
 */
function isStillInContainer(e, list) {
  const elUnder = getElementAtPoint(e.clientX, e.clientY);
  return elUnder && list.contains(elUnder);
}

/**
 * Handle dragleave event.
 * @param {DragEvent} e
 * @param {HTMLElement} list
 * @returns {void}
 */
function handleDragLeave(e, list) {
  if (isStillInContainer(e, list)) return;
  unhighlightColumn(list);
}

/**
 * Add dragenter listener.
 * @param {HTMLElement} list
 * @returns {void}
 */
function addDragEnterListener(list) {
  list.addEventListener("dragenter", (e) => handleDragEnter(e, list));
}

/**
 * Add dragover listener.
 * @param {HTMLElement} list
 * @returns {void}
 */
function addDragOverListener(list) {
  list.addEventListener("dragover", (e) => handleDragOver(e, list));
}

/**
 * Add dragleave listener.
 * @param {HTMLElement} list
 * @returns {void}
 */
function addDragLeaveListener(list) {
  list.addEventListener("dragleave", (e) => handleDragLeave(e, list));
}

/**
 * Attach all DnD listeners to a single column list.
 * @param {HTMLElement} list
 * @returns {void}
 */
function attachDnDToList(list) {
  addDragEnterListener(list);
  addDragOverListener(list);
  addDragLeaveListener(list);
}

/**
 * Get all task list elements.
 * @returns {NodeListOf<Element>}
 */
function getAllTaskLists() {
  return document.querySelectorAll(".task-list");
}

/**
 * Initialize drag & drop listeners for all columns.
 * @returns {void}
 */
function initDnDListeners() {
  const taskLists = getAllTaskLists();
  taskLists.forEach((list) => attachDnDToList(list));
}

/**
 * Remove highlight class from element.
 * @param {Element} element
 * @returns {void}
 */
function removeHighlight(element) {
  element.classList.remove("highlight-column");
}

/**
 * Add highlight class to element.
 * @param {HTMLElement} element
 * @returns {void}
 */
function addHighlight(element) {
  element.classList.add("highlight-column");
}

/**
 * Clear highlights from all task lists.
 * @returns {void}
 */
function clearAllHighlights() {
  const taskLists = getAllTaskLists();
  taskLists.forEach(removeHighlight);
}

/**
 * Apply highlight to target and clear others.
 * @param {HTMLElement} el
 * @returns {void}
 */
function highlightColumn(el) {
  clearAllHighlights();
  addHighlight(el);
}

/**
 * Remove highlight from single drop target.
 * @param {HTMLElement} el
 * @returns {void}
 */
function unhighlightColumn(el) {
  removeHighlight(el);
}

/**
 * Clear highlight from all drop targets.
 * @returns {void}
 */
function resetColumnBackgrounds() {
  clearAllHighlights();
}

/**
 * Extract task ID from drag event.
 * @param {DragEvent} event
 * @returns {string|null}
 */
function extractTaskId(event) {
  return event.dataTransfer?.getData("text/plain") || event.dataTransfer?.getData("text") || null;
}

/**
 * Get task element by ID.
 * @param {string|null} taskId
 * @returns {HTMLElement|null}
 */
function getTaskElementById(taskId) {
  return taskId ? document.getElementById(taskId) : null;
}

/**
 * Get new column from event target.
 * @param {DragEvent} event
 * @returns {HTMLElement}
 */
function getNewColumn(event) {
  return event.currentTarget.closest?.(".task-list") || event.currentTarget;
}

/**
 * Get old column from task element.
 * @param {HTMLElement|null} taskElement
 * @returns {HTMLElement|null}
 */
function getOldColumn(taskElement) {
  return taskElement?.parentElement || null;
}

/**
 * Resolve all context from drop event.
 * @param {DragEvent} event
 * @returns {{taskId:string|null, taskElement:HTMLElement|null, newColumn:HTMLElement|null, oldColumn:HTMLElement|null}}
 */
function getDropContext(event) {
  const taskId = extractTaskId(event);
  const taskElement = getTaskElementById(taskId);
  const newColumn = getNewColumn(event);
  const oldColumn = getOldColumn(taskElement);
  
  return { taskId, taskElement, newColumn, oldColumn };
}

/**
 * Move task element to new column.
 * @param {HTMLElement} taskElement
 * @param {HTMLElement} newColumn
 * @returns {void}
 */
function moveTaskToNewColumn(taskElement, newColumn) {
  newColumn.appendChild(taskElement);
}

/**
 * Update task column attribute.
 * @param {HTMLElement} taskElement
 * @param {HTMLElement} newColumn
 * @returns {void}
 */
function updateTaskColumnAttribute(taskElement, newColumn) {
  taskElement.dataset.column = DOM_TO_LOGICAL[newColumn.id] || taskElement.dataset.column;
}

/**
 * Move task in DOM and update attributes.
 * @param {HTMLElement} taskElement
 * @param {HTMLElement} newColumn
 * @returns {void}
 */
function moveTaskDom(taskElement, newColumn) {
  moveTaskToNewColumn(taskElement, newColumn);
  updateTaskColumnAttribute(taskElement, newColumn);
}

/**
 * Update task column in database.
 * @param {string} taskId
 * @param {string} columnId
 * @returns {void}
 */
function updateTaskInDatabase(taskId, columnId) {
  if (typeof window.updateTaskColumn === 'function') {
    window.updateTaskColumn(taskId, columnId);
  }
}

/**
 * Update placeholders for both columns.
 * @param {string} oldColumnId
 * @param {string} newColumnId
 * @returns {void}
 */
function updateColumnPlaceholders(oldColumnId, newColumnId) {
  if (typeof window.checkAndShowPlaceholder === 'function') {
    window.checkAndShowPlaceholder(oldColumnId);
    window.checkAndShowPlaceholder(newColumnId);
  }
}

/**
 * Clean up after drop operation.
 * @returns {void}
 */
function cleanupAfterDrop() {
  clearDragState();
  resetColumnBackgrounds();
}

/**
 * Finalize drop operation with all updates.
 * @param {string} taskId
 * @param {HTMLElement} oldColumn
 * @param {HTMLElement} newColumn
 * @returns {void}
 */
function finalizeDrop(taskId, oldColumn, newColumn) {
  updateTaskInDatabase(taskId, newColumn.id);
  updateColumnPlaceholders(oldColumn.id, newColumn.id);
  cleanupAfterDrop();
}

/**
 * Validate drop context has all required elements.
 * @param {string|null} taskId
 * @param {HTMLElement|null} taskElement
 * @param {HTMLElement|null} newColumn
 * @param {HTMLElement|null} oldColumn
 * @returns {boolean}
 */
function isValidDropContext(taskId, taskElement, newColumn, oldColumn) {
  return !!(taskId && taskElement && newColumn && oldColumn);
}

/**
 * Handle drop event with full processing.
 * @param {DragEvent} event
 * @returns {void}
 */
function handleDrop(event) {
  event.preventDefault();
  
  const { taskId, taskElement, newColumn, oldColumn } = getDropContext(event);
  
  if (!isValidDropContext(taskId, taskElement, newColumn, oldColumn)) {
    return;
  }
  
  moveTaskDom(taskElement, newColumn);
  finalizeDrop(String(taskId), oldColumn, newColumn);
}

/**
 * Drop handler - moves the card in the DOM, updates Firebase, and maintains placeholders.
 */
window.drop = handleDrop;
