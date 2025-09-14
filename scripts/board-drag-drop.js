/**
 * @file Board drag & drop utilities for task cards.
 * Provides drag start, drop handling, highlighting, and listener setup.
 * Functions are short (≤14 lines) and single-purpose.
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
 * Finalize drag end: clear state and remove highlights.
 * @param {Event} _
 * @returns {void}
 */
function onDragEndFinalize(_) {
  IS_DRAGGING = false;
  resetColumnBackgrounds();
}

/**
 * Initialize drag: put id on DataTransfer and set move effect.
 * @param {DragEvent} e
 * @returns {void}
 */
function onTaskDragStart(e) {
  const id = e.currentTarget?.id || e.target.id;
  if (id) {
    e.dataTransfer?.setData("text/plain", id);
    e.dataTransfer?.setData("text", id);
  }
  if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
  IS_DRAGGING = true;
  e.currentTarget?.addEventListener("dragend", onDragEndFinalize, { once: true });
}

/**
 * Attach DnD listeners to a single column list.
 * @param {HTMLElement} list
 * @returns {void}
 */
function attachDnDToList(list) {
  list.addEventListener("dragenter", (e) => {
    if (!IS_DRAGGING) return;
    e.preventDefault();
    highlightColumn(list);
  });
  list.addEventListener("dragover", (e) => {
    if (!IS_DRAGGING) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
    highlightColumn(list);
  });
  list.addEventListener("dragleave", (e) => {
    const elUnder = document.elementFromPoint(e.clientX, e.clientY);
    if (elUnder && list.contains(elUnder)) return;
    unhighlightColumn(list);
  });
}

/**
 * Initialize drag & drop listeners for all columns.
 * @returns {void}
 */
function initDnDListeners() {
  document.querySelectorAll(".task-list").forEach((list) => attachDnDToList(list));
}

/**
 * Applies highlight to the given drop target and clears it on others
 * @param {HTMLElement} el
 * @returns {void}
 */
function highlightColumn(el) {
  document.querySelectorAll(".task-list").forEach(n => n.classList.remove("highlight-column"));
  el.classList.add("highlight-column");
}

/**
 * Removes highlight from a single drop target
 * @param {HTMLElement} el
 * @returns {void}
 */
function unhighlightColumn(el) {
  el.classList.remove("highlight-column");
}

/**
 * Clears highlight from all drop targets
 * @returns {void}
 */
function resetColumnBackgrounds() {
  document.querySelectorAll(".task-list").forEach(el => el.classList.remove("highlight-column"));
}

/**
 * Resolve context from a drop event.
 * @param {DragEvent} event
 * @returns {{taskId:string|null, taskElement:HTMLElement|null, newColumn:HTMLElement|null, oldColumn:HTMLElement|null}}
 */
function getDropContext(event) {
  const taskId = event.dataTransfer?.getData("text/plain") || event.dataTransfer?.getData("text") || null;
  const taskElement = taskId ? document.getElementById(taskId) : null;
  const newColumn = (event.currentTarget.closest?.(".task-list") || event.currentTarget);
  const oldColumn = taskElement?.parentElement || null;
  return { taskId, taskElement, newColumn, oldColumn };
}

/**
 * Move a task element in the DOM to a new column and update its dataset column value.
 * @param {HTMLElement} taskElement
 * @param {HTMLElement} newColumn
 * @returns {void}
 */
function moveTaskDom(taskElement, newColumn) {
  newColumn.appendChild(taskElement);
  taskElement.dataset.column = DOM_TO_LOGICAL[newColumn.id] || taskElement.dataset.column;
}

/**
 * Finalize a drop: update db, placeholders, and visuals.
 * @param {string} taskId
 * @param {HTMLElement} oldColumn
 * @param {HTMLElement} newColumn
 * @returns {void}
 */
function finalizeDrop(taskId, oldColumn, newColumn) {
  if (typeof window.updateTaskColumn === 'function') {
    window.updateTaskColumn(taskId, newColumn.id);
  }
  if (typeof window.checkAndShowPlaceholder === 'function') {
    window.checkAndShowPlaceholder(oldColumn.id);
    window.checkAndShowPlaceholder(newColumn.id);
  }
  IS_DRAGGING = false;
  resetColumnBackgrounds();
}

/**
 * Drop handler - moves the card in the DOM, updates Firebase, and maintains placeholders.
 */
window.drop = function handleDrop(event) {
  event.preventDefault();
  const { taskId, taskElement, newColumn, oldColumn } = getDropContext(event);
  if (!(taskId && taskElement && newColumn && oldColumn)) return;
  moveTaskDom(taskElement, newColumn);
  finalizeDrop(String(taskId), oldColumn, newColumn);
};
