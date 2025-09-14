/**
 * @file Board utilities: search, filtering, placeholders, and column management.
 * All functions are short (≤14 lines) and single-purpose.
 */

export { 
  checkAndShowPlaceholder, 
  setupSearchHandlers, 
  filterTasks, 
  updateAllPlaceholders,
  updatePlaceholderForColumn 
};

// Minimum characters required to trigger search filtering
const MIN_SEARCH_CHARS = 3;
// Current search term used to filter tasks
let currentSearchTerm = "";

/**
 * Debounce a function by waiting `wait` ms after the last call.
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

// Placeholder text per column DOM id
const placeholderTexts = {
  "to-do-column": "No tasks to do",
  "in-progress-column": "No tasks in progressing",
  "await-feedback-column": "No tasks await feedback",
  "done-column": "No tasks done",
};

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
 * Append a placeholder element to a column.
 * @param {HTMLElement} column
 * @param {string} columnId
 * @returns {void}
 */
function appendPlaceholder(column, columnId) {
  const ph = document.createElement("div");
  ph.classList.add("no-tasks");
  ph.textContent = placeholderTexts[columnId] || "No tasks";
  column.appendChild(ph);
}

/**
 * Ensure placeholder presence depending on task count in column.
 * @param {string} columnId
 * @returns {void}
 */
function checkAndShowPlaceholder(columnId) {
  const column = $(columnId);
  const count = countTaskCards(column);
  const existing = column.querySelector(".no-tasks");
  if (count === 0 && !existing) appendPlaceholder(column, columnId);
  else if (count > 0 && existing) existing.remove();
}

/**
 * Run search filtering from input value.
 * @param {HTMLInputElement} input
 * @returns {void}
 */
function runSearch(input) {
  const term = (input.value || "").toLowerCase().trim();
  if (term.length >= MIN_SEARCH_CHARS) {
    currentSearchTerm = term;
    filterTasks(term);
  } else {
    currentSearchTerm = "";
    filterTasks("");
  }
}

/**
 * Bind input and button events for search.
 * @param {HTMLInputElement} input
 * @param {HTMLElement|null} button
 * @returns {void}
 */
function bindSearchEvents(input, button) {
  const debounced = debounce(() => runSearch(input), 200);
  input.addEventListener("input", debounced);
  input.addEventListener("keypress", (e) => { if (e.key === "Enter") runSearch(input); });
  button?.addEventListener("click", () => runSearch(input));
}

/**
 * Setup search box handlers with debounce and Enter support.
 * @returns {void}
 */
function setupSearchHandlers() {
  const input = $("search-input");
  if (!input) return;
  bindSearchEvents(input, $("search-btn"));
}

/**
 * Filter tasks globally by search term.
 * @param {string} searchTerm
 * @returns {void}
 */
function filterTasks(searchTerm) {
  const allTasks = document.querySelectorAll(".ticket");
  filterTaskVisibility(allTasks, searchTerm);
  updateAllPlaceholders();
}

/**
 * Apply visibility filter to tasks based on term.
 * @param {NodeListOf<Element>} tasks
 * @param {string} searchTerm
 * @returns {void}
 */
function filterTaskVisibility(tasks, searchTerm) {
  tasks.forEach((taskEl) => {
    const title =
      taskEl.querySelector(".ticket-title")?.textContent.toLowerCase() || "";
    const description =
      taskEl.querySelector(".ticket-text")?.textContent.toLowerCase() || "";
    const matches = title.includes(searchTerm) || description.includes(searchTerm);
    /** @type {HTMLElement} */ (taskEl).style.display =
      matches || searchTerm === "" ? "" : "none";
  });
}

/**
 * Update placeholders for all known board columns.
 * @returns {void}
 */
function updateAllPlaceholders() {
  const columnMap = {
    todo: "to-do-column",
    inProgress: "in-progress-column", 
    awaitFeedback: "await-feedback-column",
    done: "done-column",
  };
  for (const key in columnMap) updatePlaceholderForColumn(columnMap[key]);
}

/**
 * Count visible tasks in a column (style.display not 'none').
 * @param {HTMLElement} column
 * @returns {number}
 */
function countVisibleTasks(column) {
  return Array.from(column.querySelectorAll(".ticket")).filter(
    (el) => /** @type {HTMLElement} */ (el).style.display !== "none"
  ).length;
}

/**
 * Ensure placeholder based on visible tasks in one column.
 * @param {string} columnId
 * @returns {void}
 */
function updatePlaceholderForColumn(columnId) {
  const column = document.getElementById(columnId);
  const count = countVisibleTasks(column);
  const ph = column.querySelector(".no-tasks");
  if (count === 0 && !ph) appendPlaceholder(column, columnId);
  else if (count > 0 && ph) ph.remove();
}

/** Filtert Tasks anhand Suchbegriff und aktualisiert Platzhalter. */
function filterTasks(searchTerm) {
  const allTasks = document.querySelectorAll(".ticket");
  allTasks.forEach((taskEl) => {
    const title = taskEl.querySelector(".ticket-title")?.textContent.toLowerCase() || "";
    const description = taskEl.querySelector(".ticket-text")?.textContent.toLowerCase() || "";
    const matches = title.includes(searchTerm) || description.includes(searchTerm);
    taskEl.style.display = matches || searchTerm === "" ? "" : "none";
  });
  updateAllPlaceholders();
}

/** Aktualisiert Platzhalter in allen Spalten. */
function updateAllPlaceholders() {
  for (const key in columnMap) updatePlaceholderForColumn(columnMap[key]);
}

/**
 * Zählt sichtbare Tasks in einer Spalte (display != none).
 * @param {HTMLElement} column
 * @returns {number}
 */
function countVisibleTasks(column) {
  return Array.from(column.querySelectorAll('.ticket')).filter(
    (el) => /** @type {HTMLElement} */ (el).style.display !== 'none'
  ).length;
}

/** Aktualisiert Platzhalter für eine Spalte anhand sichtbarer Tasks. */
function updatePlaceholderForColumn(columnId) {
  const column = document.getElementById(columnId);
  const visible = countVisibleTasks(column);
  const placeholder = column.querySelector('.no-tasks');
  if (visible === 0 && !placeholder) appendPlaceholder(column, columnId);
  else if (visible > 0 && placeholder) placeholder.remove();
}

/**
 * Verschiebt eine Task-Karte in die Zielspalte (logisch).
 * @param {string} taskId
 * @param {string} targetLogical
 * @returns {{taskEl:HTMLElement|null, oldColumnEl:HTMLElement|null, newColumnEl:HTMLElement|null}}
 */
function moveTaskDomByLogical(taskId, targetLogical) {
  const taskEl = document.getElementById(String(taskId));
  const oldColumnEl = taskEl?.closest('.task-list') || taskEl?.parentElement || null;
  const newDomId = LOGICAL_TO_DOM[targetLogical] || targetLogical;
  const newColumnEl = document.getElementById(newDomId);
  if (taskEl && newColumnEl) newColumnEl.appendChild(taskEl);
  return { taskEl, oldColumnEl, newColumnEl };
}

/**
 * Sync: Attribute, DB und Platzhalter nach Move.
 * @param {string} taskId
 * @param {HTMLElement|null} oldColumnEl
 * @param {HTMLElement|null} newColumnEl
 * @returns {void}
 */
function syncAfterMove(taskId, oldColumnEl, newColumnEl) {
  if (!(oldColumnEl && newColumnEl)) return;
  const el = document.getElementById(String(taskId));
  if (el) el.dataset.column = DOM_TO_LOGICAL[newColumnEl.id] || el.dataset.column;
  updateTaskColumn(String(taskId), newColumnEl.id);
  checkAndShowPlaceholder(oldColumnEl.id);
  checkAndShowPlaceholder(newColumnEl.id);
  resetColumnBackgrounds();
}

/**
 * Public API: Task in neue logische Spalte verschieben & persistieren.
 * @param {string|number} taskId
 * @param {string} targetLogical
 * @returns {void}
 */
window.onTaskColumnChanged = function (taskId, targetLogical) {
  const { oldColumnEl, newColumnEl } = moveTaskDomByLogical(String(taskId), targetLogical);
  syncAfterMove(String(taskId), oldColumnEl, newColumnEl);
};