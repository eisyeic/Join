/**
 * Helper functions for board operations
 */

/**
 * Get movedAt timestamp for task.
 * @param {any} task
 * @returns {number}
 */
function getTaskMovedAt(task) {
  return task.movedAt || 0;
}

/**
 * Sort task IDs by movedAt timestamp.
 * @param {Record<string, any>} tasks
 * @returns {string[]}
 */
function getSortedTaskIds(tasks) {
  return Object.keys(tasks).sort((a, b) => 
    getTaskMovedAt(tasks[a]) - getTaskMovedAt(tasks[b])
  );
}

/**
 * Set element ID if not present.
 * @param {HTMLElement} el
 * @param {string} taskId
 * @returns {void}
 */
function ensureElementId(el, taskId) {
  if (!el.id) {
    el.id = String(taskId);
  }
}

/**
 * Make element draggable.
 * @param {HTMLElement} el
 * @returns {void}
 */
function makeDraggable(el) {
  el.setAttribute("draggable", "true");
}

/**
 * Add drag start listener.
 * @param {HTMLElement} el
 * @returns {void}
 */
function addDragStartListener(el) {
  el.addEventListener("dragstart", onTaskDragStart);
}

/**
 * Check if element is not a placeholder.
 * @param {Element} el
 * @returns {boolean}
 */
function isNotPlaceholder(el) {
  return !el.classList.contains("no-tasks");
}

/**
 * Count real task cards in column.
 * @param {HTMLElement} column
 * @returns {number}
 */
function countTasks(column) {
  return Array.from(column.children).filter(isNotPlaceholder).length;
}

/**
 * Get placeholder text for column.
 * @param {string} columnId
 * @returns {string}
 */
function getPlaceholderText(columnId) {
  const placeholderTexts = {
    "to-do-column": "No tasks to do",
    "in-progress-column": "No tasks in progressing",
    "await-feedback-column": "No tasks await feedback", 
    "done-column": "No tasks done",
  };
  return placeholderTexts[columnId] || "No tasks";
}

/**
 * Create placeholder element.
 * @param {string} columnId
 * @returns {HTMLElement}
 */
function createPlaceholder(columnId) {
  const ph = document.createElement("div");
  ph.classList.add("no-tasks");
  ph.textContent = getPlaceholderText(columnId);
  return ph;
}

/**
 * Find existing placeholder in column.
 * @param {HTMLElement} column
 * @returns {Element|null}
 */
function findPlaceholder(column) {
  return column.querySelector(".no-tasks");
}

/**
 * Remove placeholder from column.
 * @param {Element} placeholder
 * @returns {void}
 */
function removePlaceholder(placeholder) {
  placeholder.remove();
}

/**
 * Add placeholder to column.
 * @param {HTMLElement} column
 * @param {string} columnId
 * @returns {void}
 */
function appendPlaceholder(column, columnId) {
  const placeholder = createPlaceholder(columnId);
  column.appendChild(placeholder);
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
function getTaskElement(taskId) {
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
 * Move task element to new column.
 * @param {HTMLElement} taskElement
 * @param {HTMLElement} newColumn
 * @returns {void}
 */
function moveTaskToColumn(taskElement, newColumn) {
  newColumn.appendChild(taskElement);
}