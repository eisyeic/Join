let columnMap = {
  todo: "to-do-column",
  inProgress: "in-progress-column", 
  awaitFeedback: "await-feedback-column",
  done: "done-column",
};

let DOM_TO_LOGICAL = {
  "to-do-column": "todo",
  "in-progress-column": "inProgress",
  "await-feedback-column": "awaitFeedback",
  "done-column": "done",
};

let LOGICAL_TO_DOM = {
  todo: "to-do-column",
  inProgress: "in-progress-column",
  awaitFeedback: "await-feedback-column",
  review: "await-feedback-column",
  done: "done-column",
};

function runSearch(input) {
  const term = extractSearchTerm(input);
  filterTasks(term.length >= 3 ? term : "");
}

function setupSearchHandlers() {
  const input = $("search-input");
  const btn = $("search-btn");
  if (!input) return;
  
  const run = () => runSearch(input);
  input.addEventListener("input", debounce(run, 200));
  input.addEventListener("keypress", (e) => e.key === "Enter" && run());
  btn?.addEventListener("click", run);
}

function filterTasks(searchTerm) {
  document.querySelectorAll(".ticket").forEach(task => {
    const title = task.querySelector(".ticket-title")?.textContent.toLowerCase() || "";
    const desc = task.querySelector(".ticket-text")?.textContent.toLowerCase() || "";
    const matches = title.includes(searchTerm) || desc.includes(searchTerm);
    task.style.display = (matches || !searchTerm) ? "" : "none";
  });
  updateAllPlaceholders();
}

function updateAllPlaceholders() {
  Object.values(columnMap).forEach(updatePlaceholderForColumn);
}

function updatePlaceholderForColumn(columnId) {
  const column = document.getElementById(columnId);
  if (!column) return;
  
  const visibleTasks = Array.from(column.querySelectorAll(".ticket"))
    .filter(el => el.style.display !== "none");
  
  if (visibleTasks.length === 0) {
    typeof checkAndShowPlaceholder === 'function' && checkAndShowPlaceholder(columnId);
  } else {
    column.querySelector('.no-tasks')?.remove();
  }
}

function moveTaskDomByLogical(taskId, targetLogical) {
  const taskEl = document.getElementById(String(taskId));
  const oldColumnEl = taskEl?.closest(".task-list") || taskEl?.parentElement;
  const newColumnEl = document.getElementById(LOGICAL_TO_DOM[targetLogical] || targetLogical);
  
  if (taskEl && newColumnEl) moveTaskToColumn(taskEl, newColumnEl);
  return { taskEl, oldColumnEl, newColumnEl };
}

function syncAfterMove(taskId, oldColumnEl, newColumnEl) {
  if (!(oldColumnEl && newColumnEl)) return;
  
  const logical = DOM_TO_LOGICAL[newColumnEl.id];
  const el = document.getElementById(String(taskId));
  
  if (el && logical) el.dataset.column = logical;
  updateTaskColumn(String(taskId), newColumnEl.id);
  
  if (typeof checkAndShowPlaceholder === 'function') {
    checkAndShowPlaceholder(oldColumnEl.id);
    checkAndShowPlaceholder(newColumnEl.id);
  }
  resetColumnBackgrounds();
}

function moveTaskToColumn(taskElement, newColumn) {
  newColumn?.appendChild(taskElement);
}

function resetColumnBackgrounds() {}

window.onTaskColumnChanged = function (taskId, targetLogical) {
  const { oldColumnEl, newColumnEl } = moveTaskDomByLogical(String(taskId), targetLogical);
  syncAfterMove(String(taskId), oldColumnEl, newColumnEl);
};

function initBoard() {
  setupAuthListener();
  initDnDListeners();
  loadTasksFromFirebase();
  setupSearchHandlers();
}