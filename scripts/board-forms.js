/** Import required variables and functions from board-compact.js */
let columnMap, DOM_TO_LOGICAL, LOGICAL_TO_DOM;

/**
 * Initialize column map if not available.
 * @returns {void}
 */
function initializeColumnMap() {
  if (typeof columnMap === 'undefined') {
    columnMap = {
      todo: "to-do-column",
      inProgress: "in-progress-column", 
      awaitFeedback: "await-feedback-column",
      done: "done-column",
    };
  }
}

/**
 * Initialize DOM to logical mapping if not available.
 * @returns {void}
 */
function initializeDomToLogical() {
  if (typeof DOM_TO_LOGICAL === 'undefined') {
    DOM_TO_LOGICAL = {
      "to-do-column": "todo",
      "in-progress-column": "inProgress",
      "await-feedback-column": "awaitFeedback",
      "done-column": "done",
    };
  }
}

/**
 * Initialize logical to DOM mapping if not available.
 * @returns {void}
 */
function initializeLogicalToDom() {
  if (typeof LOGICAL_TO_DOM === 'undefined') {
    LOGICAL_TO_DOM = {
      todo: "to-do-column",
      inProgress: "in-progress-column",
      awaitFeedback: "await-feedback-column",
      review: "await-feedback-column",
      done: "done-column",
    };
  }
}

initializeColumnMap();
initializeDomToLogical();
initializeLogicalToDom();

/**
 * Check if search term is valid.
 * @param {string} term
 * @returns {boolean}
 */
function isValidSearchTerm(term) {
  return term.length >= 3;
}

/**
 * Get filtered search term.
 * @param {string} term
 * @returns {string}
 */
function getFilteredTerm(term) {
  return isValidSearchTerm(term) ? term : "";
}

/**
 * Execute search filtering.
 * @param {HTMLInputElement} input
 * @returns {void}
 */
function runSearch(input) {
  const term = extractSearchTerm(input);
  const filteredTerm = getFilteredTerm(term);
  filterTasks(filteredTerm);
}

/**
 * Add input event listener.
 * @param {HTMLInputElement} input
 * @param {Function} handler
 * @returns {void}
 */
function addInputListener(input, handler) {
  input.addEventListener("input", handler);
}

/**
 * Add keypress event listener.
 * @param {HTMLInputElement} input
 * @param {Function} handler
 * @returns {void}
 */
function addKeypressListener(input, handler) {
  input.addEventListener("keypress", handler);
}

/**
 * Add click event listener.
 * @param {HTMLElement|null} btn
 * @param {Function} handler
 * @returns {void}
 */
function addClickListener(btn, handler) {
  btn?.addEventListener("click", handler);
}

/**
 * Bind all search events.
 * @param {HTMLInputElement} input
 * @param {HTMLElement|null} btn
 * @returns {void}
 */
function bindSearchEvents(input, btn) {
  const debouncedRun = debounce(() => runSearch(input), 200);
  const enterHandler = (e) => { if (e.key === "Enter") runSearch(input); };
  const clickHandler = () => runSearch(input);
  
  addInputListener(input, debouncedRun);
  addKeypressListener(input, enterHandler);
  addClickListener(btn, clickHandler);
}

/**
 * Get search input element.
 * @returns {HTMLInputElement|null}
 */
function getSearchInput() {
  return $("search-input");
}

/**
 * Get search button element.
 * @returns {HTMLElement|null}
 */
function getSearchButton() {
  return $("search-btn");
}

/**
 * Setup search handlers.
 * @returns {void}
 */
function setupSearchHandlers() {
  const searchInput = getSearchInput();
  if (!searchInput) return;
  
  const searchButton = getSearchButton();
  bindSearchEvents(searchInput, searchButton);
}

/**
 * Get all task elements.
 * @returns {NodeListOf<Element>}
 */
function getAllTasks() {
  return document.querySelectorAll(".ticket");
}

/**
 * Get task title text.
 * @param {Element} taskEl
 * @returns {string}
 */
function getTaskTitle(taskEl) {
  return taskEl.querySelector(".ticket-title")?.textContent.toLowerCase() || "";
}

/**
 * Get task description text.
 * @param {Element} taskEl
 * @returns {string}
 */
function getTaskDescription(taskEl) {
  return taskEl.querySelector(".ticket-text")?.textContent.toLowerCase() || "";
}

/**
 * Check if task matches search term.
 * @param {Element} taskEl
 * @param {string} searchTerm
 * @returns {boolean}
 */
function taskMatchesSearch(taskEl, searchTerm) {
  const title = getTaskTitle(taskEl);
  const description = getTaskDescription(taskEl);
  return title.includes(searchTerm) || description.includes(searchTerm);
}

/**
 * Set task visibility.
 * @param {Element} taskEl
 * @param {boolean} visible
 * @returns {void}
 */
function setTaskVisibility(taskEl, visible) {
  /** @type {HTMLElement} */ (taskEl).style.display = visible ? "" : "none";
}

/**
 * Filter single task visibility.
 * @param {Element} taskEl
 * @param {string} searchTerm
 * @returns {void}
 */
function filterSingleTask(taskEl, searchTerm) {
  const matches = taskMatchesSearch(taskEl, searchTerm);
  const shouldShow = matches || searchTerm === "";
  setTaskVisibility(taskEl, shouldShow);
}

/**
 * Filter all tasks by search term.
 * @param {string} searchTerm
 * @returns {void}
 */
function filterTasks(searchTerm) {
  const allTasks = getAllTasks();
  allTasks.forEach((taskEl) => filterSingleTask(taskEl, searchTerm));
  updateAllPlaceholders();
}

/**
 * Update placeholders in all columns.
 * @returns {void}
 */
function updateAllPlaceholders() {
  if (typeof columnMap !== 'undefined') {
    for (const key in columnMap) {
      updatePlaceholderForColumn(columnMap[key]);
    }
  }
}

/**
 * Get column element by ID.
 * @param {string} columnId
 * @returns {HTMLElement|null}
 */
function getColumnElement(columnId) {
  return document.getElementById(columnId);
}

/**
 * Get visible tasks in column.
 * @param {HTMLElement} column
 * @returns {Element[]}
 */
function getVisibleTasks(column) {
  return Array.from(column.querySelectorAll(".ticket")).filter(
    (el) => /** @type {HTMLElement} */ (el).style.display !== "none"
  );
}

/**
 * Update placeholder for single column.
 * @param {string} columnId
 * @returns {void}
 */
function updatePlaceholderForColumn(columnId) {
  const column = getColumnElement(columnId);
  if (!column) return;
  
  const visibleTasks = getVisibleTasks(column);
  
  if (visibleTasks.length === 0) {
    if (typeof checkAndShowPlaceholder === 'function') {
      checkAndShowPlaceholder(columnId);
    }
  } else {
    const placeholder = column.querySelector('.no-tasks');
    if (placeholder) {
      placeholder.remove();
    }
  }
}

/**
 * Get task element by string ID.
 * @param {string} taskId
 * @returns {HTMLElement|null}
 */
function getTaskElementById(taskId) {
  return document.getElementById(String(taskId));
}

/**
 * Find task parent column.
 * @param {HTMLElement} taskEl
 * @returns {HTMLElement|null}
 */
function findTaskParentColumn(taskEl) {
  return taskEl?.closest(".task-list") || taskEl?.parentElement || null;
}

/**
 * Get DOM ID from logical column.
 * @param {string} targetLogical
 * @returns {string}
 */
function getDomIdFromLogical(targetLogical) {
  return LOGICAL_TO_DOM[targetLogical] || targetLogical;
}

/**
 * Get new column element.
 * @param {string} newDomId
 * @returns {HTMLElement|null}
 */
function getNewColumnElement(newDomId) {
  return document.getElementById(newDomId);
}



/**
 * Move task DOM by logical column.
 * @param {string} taskId
 * @param {string} targetLogical
 * @returns {{taskEl:HTMLElement|null, oldColumnEl:HTMLElement|null, newColumnEl:HTMLElement|null}}
 */
function moveTaskDomByLogical(taskId, targetLogical) {
  const taskEl = getTaskElementById(taskId);
  const oldColumnEl = taskEl ? findTaskParentColumn(taskEl) : null;
  const newDomId = getDomIdFromLogical(targetLogical);
  const newColumnEl = getNewColumnElement(newDomId);
  
  if (taskEl && newColumnEl) {
    moveTaskToColumn(taskEl, newColumnEl);
  }
  
  return { taskEl, oldColumnEl, newColumnEl };
}

/**
 * Update task dataset attribute.
 * @param {string} taskId
 * @param {string} logical
 * @returns {void}
 */
function updateTaskDataset(taskId, logical) {
  const el = getTaskElementById(taskId);
  if (el && logical) {
    el.dataset.column = logical;
  }
}

/**
 * Update placeholders for both columns.
 * @param {string} oldColumnId
 * @param {string} newColumnId
 * @returns {void}
 */
function updateBothPlaceholders(oldColumnId, newColumnId) {
  if (typeof checkAndShowPlaceholder === 'function') {
    checkAndShowPlaceholder(oldColumnId);
    checkAndShowPlaceholder(newColumnId);
  }
}

/**
 * Sync after task move.
 * @param {string} taskId
 * @param {HTMLElement|null} oldColumnEl
 * @param {HTMLElement|null} newColumnEl
 * @returns {void}
 */
function syncAfterMove(taskId, oldColumnEl, newColumnEl) {
  if (!(oldColumnEl && newColumnEl)) return;
  
  const domId = newColumnEl.id;
  const logical = DOM_TO_LOGICAL[domId];
  
  updateTaskDataset(taskId, logical);
  updateTaskColumn(String(taskId), domId);
  updateBothPlaceholders(oldColumnEl.id, newColumnEl.id);
  resetColumnBackgrounds();
}

/**
 * Move task to column (fallback if not available from board-compact.js).
 * @param {HTMLElement} taskElement
 * @param {HTMLElement} newColumn
 * @returns {void}
 */
function moveTaskToColumn(taskElement, newColumn) {
  if (newColumn && taskElement) {
    newColumn.appendChild(taskElement);
  }
}

/**
 * Reset column backgrounds (placeholder function).
 * @returns {void}
 */
function resetColumnBackgrounds() {
  // This function should be implemented based on your drag & drop styling needs
}

/**
 * Public API: move task to new logical column.
 * @param {string|number} taskId
 * @param {string} targetLogical
 * @returns {void}
 */
window.onTaskColumnChanged = function (taskId, targetLogical) {
  const { oldColumnEl, newColumnEl } = moveTaskDomByLogical(String(taskId), targetLogical);
  syncAfterMove(String(taskId), oldColumnEl, newColumnEl);
};

/**
 * Initialize board with all components.
 * @returns {void}
 */
function initBoard() {
  setupAuthListener();
  initDnDListeners();
  loadTasksFromFirebase();
  setupSearchHandlers();
}