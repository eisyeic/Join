// Board utility functions: search, filtering, placeholders, and column management

// Minimum characters required to trigger search filtering
const MIN_SEARCH_CHARS = 3;
// Current search term used to filter tasks
let currentSearchTerm = "";

// Debounce helper - executes fn after no calls have been made for wait ms
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

// Ensures a placeholder exists if a column has no tasks
function checkAndShowPlaceholder(columnId) {
  const column = $(columnId);
  const taskCards = Array.from(column.children).filter(
    (el) => !el.classList.contains("no-tasks")
  );
  const existing = column.querySelector(".no-tasks");
  if (taskCards.length === 0 && !existing) {
    const ph = document.createElement("div");
    ph.classList.add("no-tasks");
    ph.textContent = placeholderTexts[columnId] || "No tasks";
    column.appendChild(ph);
  } else if (taskCards.length > 0 && existing) {
    existing.remove();
  }
}

// Sets up search input/button handlers with debounce
function setupSearchHandlers() {
  const searchInput = $("search-input");
  const searchButton = $("search-btn");
  if (!searchInput) return;
  const run = () => {
    const term = (searchInput.value || "").toLowerCase().trim();
    if (term.length >= MIN_SEARCH_CHARS) {
      currentSearchTerm = term;
      filterTasks(term);
    } else {
      currentSearchTerm = "";
      filterTasks(currentSearchTerm);
    }
  };
  const debouncedRun = debounce(run, 200);
  searchInput.addEventListener("input", debouncedRun);
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") run();
  });
  searchButton?.addEventListener("click", run);
}

// Filters visible tasks across all columns by a search term
function filterTasks(searchTerm) {
  const allTasks = document.querySelectorAll(".ticket");
  filterTaskVisibility(allTasks, searchTerm);
  updateAllPlaceholders();
}

// Applies filter display logic to a set of task elements
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

// Updates placeholders for all columns after filtering
function updateAllPlaceholders() {
  const columnMap = {
    todo: "to-do-column",
    inProgress: "in-progress-column", 
    awaitFeedback: "await-feedback-column",
    done: "done-column",
  };
  for (const key in columnMap) updatePlaceholderForColumn(columnMap[key]);
}

// Ensures a single column shows/hides its placeholder based on visible tasks
function updatePlaceholderForColumn(columnId) {
  const column = document.getElementById(columnId);
  const visibleTasks = Array.from(column.querySelectorAll(".ticket")).filter(
    (el) => /** @type {HTMLElement} */ (el).style.display !== "none"
  );
  const placeholder = column.querySelector(".no-tasks");
  if (visibleTasks.length === 0 && !placeholder) {
    const ph = document.createElement("div");
    ph.classList.add("no-tasks");
    ph.textContent = placeholderTexts[columnId] || "No tasks";
    column.appendChild(ph);
  } else if (visibleTasks.length > 0 && placeholder) {
    placeholder.remove();
  }
}

export { 
  checkAndShowPlaceholder, 
  setupSearchHandlers, 
  filterTasks, 
  updateAllPlaceholders,
  updatePlaceholderForColumn 
};