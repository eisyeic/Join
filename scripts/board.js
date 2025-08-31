import {
  getDatabase,
  ref,
  onValue,
  update,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { app, auth } from "./firebase.js";
import { createTaskElement } from "./template.modul.js";

/** Minimum characters required to trigger search filtering. */
const MIN_SEARCH_CHARS = 3;
/** Current search term used to filter tasks. */
let currentSearchTerm = "";

/**
 * Debounce helper.
 * Executes `fn` after no calls have been made for `wait` ms.
 * @template {(...args:any[])=>any} F
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
 * Logical → DOM column ids.
 * @type {{todo:string,inProgress:string,awaitFeedback:string,done:string}}
 */
const columnMap = {
  todo: "to-do-column",
  inProgress: "in-progress-column",
  awaitFeedback: "await-feedback-column",
  done: "done-column",
};

onAuthStateChanged(auth, handleAuthChange);
/**
 * Updates user initials badge on auth changes.
 * @param {import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js").User|null} user
 * @returns {void}
 */
function handleAuthChange(user) {
  if (window.updateUserInitials) window.updateUserInitials(user);
}

/** Overlay root element. */
const overlay = $("overlay-add-task");
/** Overlay content element. */
const overlayContent = document.querySelector(".add-task-overlay-content");

overlay?.addEventListener("click", onOverlayBackdropClick);
/**
 * Closes the Add Task overlay if the backdrop is clicked.
 * @param {MouseEvent} e
 * @returns {void}
 */
function onOverlayBackdropClick(e) {
  if (e.target !== overlay || overlay.classList.contains("d-none")) return;
  document.querySelector(".edit-addtask-wrapper")?.classList.add("d-none");
  document.getElementById("task-overlay-content")?.classList.remove("d-none");
  window.toggleAddTaskBoard();
}

/**
 * Toggles the Add Task overlay visibility.
 * @returns {void}
 */
window.toggleAddTaskBoard = function () {
  if (overlay.classList.contains("d-none")) openOverlay();
  else closeOverlay();
  moveFormBackToAside();
};

/**
 * Opens the Add Task overlay and resets the form.
 * @returns {void}
 */
function openOverlay() {
  overlay.classList.remove("d-none");
  overlayContent.classList.remove("slide-out");
  overlayContent.classList.add("slide-in");
  const cancelBtn = $("cancel-button");
  if (cancelBtn) cancelBtn.click();
  else
    document.addEventListener(
      "addtask:template-ready",
      () => $("cancel-button")?.click(),
      { once: true }
    );
}

/**
 * Closes the Add Task overlay with a slide-out animation.
 * @returns {void}
 */
function closeOverlay() {
  overlayContent.classList.remove("slide-in");
  overlayContent.classList.add("slide-out");
  overlayContent.addEventListener("animationend", function handler() {
    overlay.classList.add("d-none");
    overlayContent.classList.remove("slide-out");
    overlayContent.removeEventListener("animationend", handler);
  });
}

/**
 * Moves the add-task form back to the aside placeholder.
 * @returns {void}
 */
function moveFormBackToAside() {
  const src = document.querySelector(".edit-addtask .addtask-wrapper");
  const dst = document.querySelector(".addtask-aside-clone");
  if (src && dst) dst.replaceChildren(src);
}

/** Firebase RTDB instance. */
const db = getDatabase(app);

/**
 * Subscribes to `/tasks` and renders the board on changes.
 * @returns {void}
 */
function loadTasksFromFirebase() {
  const tasksRef = ref(db, "tasks");
  onValue(tasksRef, (snapshot) => {
    const tasks = snapshot.val() || {};
    renderAllColumns(tasks);
  });
}

/**
 * Renders all task columns from a task dictionary.
 * @param {Record<string, any>} tasks
 * @returns {void}
 */
function renderAllColumns(tasks) {
  clearAllColumns();
  const sortedIds = getSortedTaskIds(tasks);
  sortedIds.forEach((taskId) => renderTask(tasks[taskId], taskId));
  Object.keys(columnMap).forEach((k) => checkAndShowPlaceholder(columnMap[k]));
}

/**
 * Clears all columns’ inner HTML.
 * @returns {void}
 */
function clearAllColumns() {
  for (const key in columnMap) $(columnMap[key]).innerHTML = "";
}

/**
 * Returns task ids sorted by `movedAt` ascending.
 * @param {Record<string, any>} tasks
 * @returns {string[]}
 */
function getSortedTaskIds(tasks) {
  return Object.keys(tasks).sort(
    (a, b) => (tasks[a].movedAt || 0) - (tasks[b].movedAt || 0)
  );
}

/**
 * Creates and appends a task card into its target column.
 * @param {any} task
 * @param {string} taskId
 * @returns {void}
 */
function renderTask(task, taskId) {
  const targetColumnId = columnMap[task.column] || "to-do-column";
  const columnElement = $(targetColumnId);
  const taskElement = createTaskElement(task, taskId);

  if (!taskElement.id) taskElement.id = String(taskId);
  taskElement.setAttribute("draggable", "true");
  taskElement.addEventListener("dragstart", onTaskDragStart);

  columnElement.appendChild(taskElement);
}

/**
 * Placeholder text per column DOM id.
 * @type {Record<string,string>}
 */
const placeholderTexts = {
  "to-do-column": "No tasks to do",
  "in-progress-column": "No tasks in progressing",
  "await-feedback-column": "No tasks await feedback",
  "done-column": "No tasks done",
};

/**
 * Ensures a placeholder exists if a column has no tasks.
 * @param {string} columnId
 * @returns {void}
 */
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

/** Flag indicating a drag operation is in progress. */
let IS_DRAGGING = false;

/**
 * DragStart handler for task cards.
 * @param {DragEvent} e
 * @returns {void}
 */
function onTaskDragStart(e) {
  const id = e.currentTarget?.id || /** @type {HTMLElement} */(e.target).id;
  if (id) {
    e.dataTransfer?.setData("text/plain", id);
    e.dataTransfer?.setData("text", id);
  }
  if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
  IS_DRAGGING = true;
  e.currentTarget?.addEventListener(
    "dragend",
    () => {
      IS_DRAGGING = false;
      resetColumnBackgrounds();
    },
    { once: true }
  );
}

/**
 * Optional global dragstart used by inline HTML attributes.
 * @param {DragEvent} e
 * @returns {void}
 */
window.drag = onTaskDragStart;

/**
 * Wires drag hover listeners to all drop targets (`.task-list`).
 * Expects HTML to call `drop(event)` via `ondrop` attribute.
 * @returns {void}
 */
function initDnDListeners() {
  document.querySelectorAll(".task-list").forEach((list) => {
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
  });
}

/**
 * Applies highlight to the given drop target and clears it on others.
 * @param {Element} el
 * @returns {void}
 */
function highlightColumn(el) {
  document
    .querySelectorAll(".task-list")
    .forEach((n) => n.classList.remove("highlight-column"));
  el.classList.add("highlight-column");
}

/**
 * Removes highlight from a single drop target.
 * @param {Element} el
 * @returns {void}
 */
function unhighlightColumn(el) {
  el.classList.remove("highlight-column");
}

/**
 * Clears highlight from all drop targets.
 * @returns {void}
 */
function resetColumnBackgrounds() {
  document
    .querySelectorAll(".task-list")
    .forEach((el) => el.classList.remove("highlight-column"));
}

/**
 * Logical → DOM column id map.
 * @type {{todo:string,inProgress:string,awaitFeedback:string,review:string,done:string}}
 */
const LOGICAL_TO_DOM = {
  todo: "to-do-column",
  inProgress: "in-progress-column",
  awaitFeedback: "await-feedback-column",
  review: "await-feedback-column",
  done: "done-column",
};

/**
 * DOM → logical column id map.
 * @type {Record<string,'todo'|'inProgress'|'awaitFeedback'|'done'>}
 */
const DOM_TO_LOGICAL = {
  "to-do-column": "todo",
  "in-progress-column": "inProgress",
  "await-feedback-column": "awaitFeedback",
  "done-column": "done",
};

/**
 * Drop handler (intended to be called from HTML via `ondrop="drop(event)"`).
 * Moves the card in the DOM, updates Firebase, and maintains placeholders.
 * @param {DragEvent} event
 * @returns {void}
 */
window.drop = function handleDrop(event) {
  event.preventDefault();
  const taskId =
    event.dataTransfer?.getData("text/plain") ||
    event.dataTransfer?.getData("text");
  if (!taskId) return;
  const taskElement = document.getElementById(taskId);
  const newColumn = (event.currentTarget).closest(".task-list") || (event.currentTarget);
  const oldColumn = taskElement?.parentElement;
  if (!taskElement || !newColumn || !oldColumn) return;
  newColumn.appendChild(taskElement);
  taskElement.dataset.column =
    DOM_TO_LOGICAL[newColumn.id] || taskElement.dataset.column;
  updateTaskColumn(taskId, newColumn.id);
  checkAndShowPlaceholder(oldColumn.id);
  checkAndShowPlaceholder(newColumn.id);
  IS_DRAGGING = false;
  resetColumnBackgrounds();
};

/**
 * Persists a task’s column change and stamps `movedAt`.
 * @param {string} taskId
 * @param {string} newColumnId
 * @returns {Promise<void>|void}
 */
function updateTaskColumn(taskId, newColumnId) {
  const dbRef = ref(db, `tasks/${taskId}`);
  const newColumnValue = DOM_TO_LOGICAL[newColumnId] || "todo";
  return update(dbRef, { column: newColumnValue, movedAt: Date.now() }).catch(
    (err) => console.error("Fehler beim Aktualisieren der Spalte:", err)
  );
}

/**
 * Renders up to three contact initials with colored backgrounds.
 * @param {{initials?:string,colorIndex?:number,name?:string}[]} [contacts=[]]
 * @returns {string}
 */
/**
 * @typedef {Object} Contact
 * @property {string} [name]
 * @property {string} [initials]
 * @property {number} [colorIndex]
 */

/**
 * Render up to 3 initials; last slot becomes "+x" if overflow.
 * @param {Contact[]} [contacts=[]]
 * @returns {string}
 */
export function renderAssignedInitials(contacts = []) {
  const maxShown = 3;
  if (!isValidContacts(contacts)) return "";
  const shown = contacts.slice(0, maxShown);
  const hasOverflow = contacts.length > maxShown;
  const overflowCount = calcOverflow(contacts.length, maxShown);
  const ctx = { hasOverflow, overflowCount, maxShown };
  return shown.map((c, idx) => renderChip(c, idx, ctx)).join("");
}

/**
 * @param {any} contacts
 * @returns {contacts is Contact[]}
 */
function isValidContacts(contacts) {
  return Array.isArray(contacts) && contacts.length > 0;
}

/**
 * @param {number} len
 * @param {number} maxShown
 */
function calcOverflow(len, maxShown) {
  return len > maxShown ? len - (maxShown - 1) : 0;
}

/**
 * @param {number} idx
 * @returns {string}
 */
function getPositionClass(idx) {
  return ["first-initial", "second-initial", "third-initial"][idx] || "";
}

/**
 * @param {number} count
 * @param {string} positionClass
 * @returns {string}
 */
function renderOverflowBadge(count, positionClass) {
  return `
    <div class="initial-circle ${positionClass} initial-circle--more" title="+${count}">
      +${count}
    </div>
  `;
}

/**
 * @param {Contact} c
 * @param {string} positionClass
 * @returns {string}
 */
function renderInitialCircle(c, positionClass) {
  const colorIdx = Number.isFinite(c?.colorIndex) ? c.colorIndex : 0;
  const initials = c?.initials || "";
  const title = c?.name || initials;
  return `
    <div class="initial-circle ${positionClass}"
         style="background-image: url(../assets/icons/contact/color${colorIdx}.svg)"
         title="${title}">
      ${initials}
    </div>
  `;
}

/**
 * @param {Contact} c
 * @param {number} idx
 * @param {{hasOverflow:boolean, overflowCount:number, maxShown:number}} ctx
 * @returns {string}
 */
function renderChip(c, idx, ctx) {
  const pos = getPositionClass(idx);
  if (ctx.hasOverflow && idx === ctx.maxShown - 1) {
    return renderOverflowBadge(ctx.overflowCount, pos);
  }
  return renderInitialCircle(c, pos);
}


/**
 * Maps a task category to a CSS class for labels.
 * @param {string} category
 * @returns {string}
 */
export function getLabelClass(category) {
  return (
    {
      "User Story": "user-story",
      "Technical task": "technical-task",
    }[category] || ""
  );
}

/**
 * Renders a subtask progress bar and label.
 * @param {{checked:boolean}[]} subtasks
 * @returns {string}
 */
export function renderSubtaskProgress(subtasks) {
  const total = subtasks.length;
  const done = subtasks.filter((st) => st.checked).length;
  const percentage = total ? Math.round((done / total) * 100) : 0;
  return `
    <div class="subtasks-box">
      <div class="progressbar">
        <div class="progressbar-inlay" style="width: ${percentage}%"></div>
      </div>
      ${done}/${total} Subtasks
    </div>
  `;
}

/**
 * DOMContentLoaded bootstrap: wires DnD, loads tasks, sets up search.
 * @returns {void}
 */
document.addEventListener("DOMContentLoaded", onBoardDomContentLoaded);
function onBoardDomContentLoaded() {
  initDnDListeners();
  loadTasksFromFirebase();
  setupSearchHandlers();
}

/**
 * Sets up search input/button handlers with debounce.
 * @returns {void}
 */
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

/**
 * Filters visible tasks across all columns by a search term.
 * @param {string} searchTerm
 * @returns {void}
 */
function filterTasks(searchTerm) {
  const allTasks = document.querySelectorAll(".ticket");
  filterTaskVisibility(allTasks, searchTerm);
  updateAllPlaceholders();
}

/**
 * Applies filter display logic to a set of task elements.
 * @param {NodeListOf<Element>|Element[]} tasks
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
 * Updates placeholders for all columns after filtering.
 * @returns {void}
 */
function updateAllPlaceholders() {
  for (const key in columnMap) updatePlaceholderForColumn(columnMap[key]);
}

/**
 * Ensures a single column shows/hides its placeholder based on visible tasks.
 * @param {string} columnId
 * @returns {void}
 */
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

/**
 * Toggles the task overlay into edit mode and moves the form into place.
 * @returns {void}
 */
$("edit-task-btn").addEventListener("click", onEditTaskBtnClick);
function onEditTaskBtnClick() {
  $("task-overlay-content").classList.toggle("d-none");
  document.querySelector(".edit-addtask-wrapper").classList.toggle("d-none");
  const src = document.querySelector(".addtask-aside-clone .addtask-wrapper");
  const dst = document.querySelector(".edit-addtask");
  if (src && dst) dst.replaceChildren(src);
}

/**
 * Updates a task's column programmatically (overlay action), mirroring DnD.
 * @param {string|number} taskId
 * @param {'todo'|'inProgress'|'awaitFeedback'|'done'|string} targetLogical
 * @returns {void}
 */
window.onTaskColumnChanged = function (taskId, targetLogical) {
  const taskEl = document.getElementById(String(taskId));
  if (!taskEl) return;

  const oldColumnEl = taskEl.closest(".task-list") || taskEl.parentElement;
  const newDomId = LOGICAL_TO_DOM[targetLogical] || targetLogical;
  const newColumnEl = document.getElementById(newDomId);
  if (!newColumnEl || !oldColumnEl) return;

  newColumnEl.appendChild(taskEl);
  taskEl.dataset.column =
    DOM_TO_LOGICAL[newColumnEl.id] || taskEl.dataset.column;

  updateTaskColumn(String(taskId), newColumnEl.id);
  checkAndShowPlaceholder(oldColumnEl.id);
  checkAndShowPlaceholder(newColumnEl.id);
  resetColumnBackgrounds();
};

