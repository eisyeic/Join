/**
 * @file Board utilities: search, filtering, placeholders, and column management.
 * All functions follow Single Responsibility Principle.
 */

export { 
  checkAndShowPlaceholder, 
  setupSearchHandlers, 
  filterTasks, 
  updateAllPlaceholders,
  updatePlaceholderForColumn 
};

// Constants
const MIN_SEARCH_CHARS = 3;
let currentSearchTerm = "";

// Column mappings
const columnMap = {
  todo: "to-do-column",
  inProgress: "in-progress-column", 
  awaitFeedback: "await-feedback-column",
  done: "done-column",
};

const LOGICAL_TO_DOM = {
  todo: "to-do-column",
  inProgress: "in-progress-column",
  awaitFeedback: "await-feedback-column", 
  done: "done-column"
};

const DOM_TO_LOGICAL = {
  "to-do-column": "todo",
  "in-progress-column": "inProgress",
  "await-feedback-column": "awaitFeedback",
  "done-column": "done"
};

const placeholderTexts = {
  "to-do-column": "No tasks to do",
  "in-progress-column": "No tasks in progressing",
  "await-feedback-column": "No tasks await feedback",
  "done-column": "No tasks done",
};

/**
 * Create debounced version of a function.
 * @template {(...a:any[])=>any} F
 * @param {F} fn
 * @param {number} [wait=200]
 * @returns {F}
 */
function debounce(fn, wait = 200) {
  let t;
  return /** @type {F} */ ((...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  });
}

/**
 * Get column element by ID.
 * @param {string} columnId
 * @returns {HTMLElement}
 */
function getColumnElement(columnId) {
  return $(columnId);
}

/**
 * Count task cards in a column (excluding placeholders).
 * @param {HTMLElement} column
 * @returns {number}
 */
function countTaskCards(column) {
  return Array.from(column.children).filter(
    (el) => !el.classList.contains("no-tasks")
  ).length;
}

/**
 * Find existing placeholder in column.
 * @param {HTMLElement} column
 * @returns {Element|null}
 */
function findExistingPlaceholder(column) {
  return column.querySelector(".no-tasks");
}

/**
 * Create placeholder element.
 * @param {string} columnId
 * @returns {HTMLElement}
 */
function createPlaceholderElement(columnId) {
  const ph = document.createElement("div");
  ph.classList.add("no-tasks");
  ph.textContent = placeholderTexts[columnId] || "No tasks";
  return ph;
}

/**
 * Add placeholder to column.
 * @param {HTMLElement} column
 * @param {string} columnId
 * @returns {void}
 */
function addPlaceholder(column, columnId) {
  const placeholder = createPlaceholderElement(columnId);
  column.appendChild(placeholder);
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
 * Ensure placeholder presence depending on task count in column.
 * @param {string} columnId
 * @returns {void}
 */
function checkAndShowPlaceholder(columnId) {
  const column = getColumnElement(columnId);
  const count = countTaskCards(column);
  const existing = findExistingPlaceholder(column);
  
  if (count === 0 && !existing) {
    addPlaceholder(column, columnId);
  } else if (count > 0 && existing) {
    removePlaceholder(existing);
  }
}

/**
 * Extract and normalize search term from input.
 * @param {HTMLInputElement} input
 * @returns {string}
 */
function extractSearchTerm(input) {
  return (input.value || "").toLowerCase().trim();
}

/**
 * Check if search term meets minimum length requirement.
 * @param {string} term
 * @returns {boolean}
 */
function isValidSearchTerm(term) {
  return term.length >= MIN_SEARCH_CHARS;
}

/**
 * Update current search term.
 * @param {string} term
 * @returns {void}
 */
function updateCurrentSearchTerm(term) {
  currentSearchTerm = term;
}

/**
 * Execute search filtering from input value.
 * @param {HTMLInputElement} input
 * @returns {void}
 */
function runSearch(input) {
  const term = extractSearchTerm(input);
  
  if (isValidSearchTerm(term)) {
    updateCurrentSearchTerm(term);
    filterTasks(term);
  } else {
    updateCurrentSearchTerm("");
    filterTasks("");
  }
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
 * Add click event listener to button.
 * @param {HTMLElement|null} button
 * @param {Function} handler
 * @returns {void}
 */
function addClickListener(button, handler) {
  button?.addEventListener("click", handler);
}

/**
 * Bind all search events to input and button.
 * @param {HTMLInputElement} input
 * @param {HTMLElement|null} button
 * @returns {void}
 */
function bindSearchEvents(input, button) {
  const debounced = debounce(() => runSearch(input), 200);
  const enterHandler = (e) => { if (e.key === "Enter") runSearch(input); };
  const clickHandler = () => runSearch(input);
  
  addInputListener(input, debounced);
  addKeypressListener(input, enterHandler);
  addClickListener(button, clickHandler);
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
 * Setup search box handlers with debounce and Enter support.
 * @returns {void}
 */
function setupSearchHandlers() {
  const input = getSearchInput();
  if (!input) return;
  
  const button = getSearchButton();
  bindSearchEvents(input, button);
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
 * Apply visibility filter to single task.
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
 * Apply visibility filter to all tasks.
 * @param {NodeListOf<Element>} tasks
 * @param {string} searchTerm
 * @returns {void}
 */
function filterTaskVisibility(tasks, searchTerm) {
  tasks.forEach((taskEl) => filterSingleTask(taskEl, searchTerm));
}

/**
 * Filter tasks globally by search term.
 * @param {string} searchTerm
 * @returns {void}
 */
function filterTasks(searchTerm) {
  const allTasks = getAllTasks();
  filterTaskVisibility(allTasks, searchTerm);
  updateAllPlaceholders();
}

/**
 * Get all column IDs from column map.
 * @returns {string[]}
 */
function getAllColumnIds() {
  return Object.values(columnMap);
}

/**
 * Update placeholders for all known board columns.
 * @returns {void}
 */
function updateAllPlaceholders() {
  const columnIds = getAllColumnIds();
  columnIds.forEach(columnId => updatePlaceholderForColumn(columnId));
}

/**
 * Get all ticket elements in column.
 * @param {HTMLElement} column
 * @returns {Element[]}
 */
function getColumnTickets(column) {
  return Array.from(column.querySelectorAll(".ticket"));
}

/**
 * Check if element is visible.
 * @param {Element} el
 * @returns {boolean}
 */
function isElementVisible(el) {
  return /** @type {HTMLElement} */ (el).style.display !== "none";
}

/**
 * Count visible tasks in a column.
 * @param {HTMLElement} column
 * @returns {number}
 */
function countVisibleTasks(column) {
  const tickets = getColumnTickets(column);
  return tickets.filter(isElementVisible).length;
}

/**
 * Get column element by ID.
 * @param {string} columnId
 * @returns {HTMLElement|null}
 */
function getColumnById(columnId) {
  return document.getElementById(columnId);
}

/**
 * Update placeholder for single column based on visible tasks.
 * @param {string} columnId
 * @returns {void}
 */
function updatePlaceholderForColumn(columnId) {
  const column = getColumnById(columnId);
  if (!column) return;
  
  const count = countVisibleTasks(column);
  const ph = findExistingPlaceholder(column);
  
  if (count === 0 && !ph) {
    addPlaceholder(column, columnId);
  } else if (count > 0 && ph) {
    removePlaceholder(ph);
  }
}



/**
 * Get task element by ID.
 * @param {string} taskId
 * @returns {HTMLElement|null}
 */
function getTaskElement(taskId) {
  return document.getElementById(String(taskId));
}

/**
 * Find parent column of task element.
 * @param {HTMLElement} taskEl
 * @returns {HTMLElement|null}
 */
function findTaskParentColumn(taskEl) {
  return taskEl?.closest('.task-list') || taskEl?.parentElement || null;
}

/**
 * Convert logical column name to DOM ID.
 * @param {string} targetLogical
 * @returns {string}
 */
function getTargetDomId(targetLogical) {
  return LOGICAL_TO_DOM[targetLogical] || targetLogical;
}

/**
 * Get target column element.
 * @param {string} domId
 * @returns {HTMLElement|null}
 */
function getTargetColumn(domId) {
  return document.getElementById(domId);
}

/**
 * Move task element to new column.
 * @param {HTMLElement} taskEl
 * @param {HTMLElement} newColumnEl
 * @returns {void}
 */
function moveTaskToColumn(taskEl, newColumnEl) {
  newColumnEl.appendChild(taskEl);
}

/**
 * Move task DOM element to target logical column.
 * @param {string} taskId
 * @param {string} targetLogical
 * @returns {{taskEl:HTMLElement|null, oldColumnEl:HTMLElement|null, newColumnEl:HTMLElement|null}}
 */
function moveTaskDomByLogical(taskId, targetLogical) {
  const taskEl = getTaskElement(taskId);
  const oldColumnEl = taskEl ? findTaskParentColumn(taskEl) : null;
  const newDomId = getTargetDomId(targetLogical);
  const newColumnEl = getTargetColumn(newDomId);
  
  if (taskEl && newColumnEl) {
    moveTaskToColumn(taskEl, newColumnEl);
  }
  
  return { taskEl, oldColumnEl, newColumnEl };
}

/**
 * Update task element's column attribute.
 * @param {string} taskId
 * @param {string} newColumnId
 * @returns {void}
 */
function updateTaskAttribute(taskId, newColumnId) {
  const el = getTaskElement(taskId);
  if (el) {
    el.dataset.column = DOM_TO_LOGICAL[newColumnId] || el.dataset.column;
  }
}

/**
 * Update placeholders for both columns.
 * @param {HTMLElement} oldColumnEl
 * @param {HTMLElement} newColumnEl
 * @returns {void}
 */
function updateBothColumnPlaceholders(oldColumnEl, newColumnEl) {
  checkAndShowPlaceholder(oldColumnEl.id);
  checkAndShowPlaceholder(newColumnEl.id);
}

/**
 * Synchronize after task move operation.
 * @param {string} taskId
 * @param {HTMLElement|null} oldColumnEl
 * @param {HTMLElement|null} newColumnEl
 * @returns {void}
 */
function syncAfterMove(taskId, oldColumnEl, newColumnEl) {
  if (!(oldColumnEl && newColumnEl)) return;
  
  updateTaskAttribute(taskId, newColumnEl.id);
  updateTaskColumn(String(taskId), newColumnEl.id);
  updateBothColumnPlaceholders(oldColumnEl, newColumnEl);
  resetColumnBackgrounds();
}

/**
 * Public API: Move task to new logical column and persist.
 * @param {string|number} taskId
 * @param {string} targetLogical
 * @returns {void}
 */
window.onTaskColumnChanged = function (taskId, targetLogical) {
  const { oldColumnEl, newColumnEl } = moveTaskDomByLogical(String(taskId), targetLogical);
  syncAfterMove(String(taskId), oldColumnEl, newColumnEl);
};