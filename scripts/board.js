import {
  getDatabase,
  ref,
  onValue,
  update,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { app, auth } from "./firebase.js";
import { createTaskElement } from "./template.modul.js";


const MIN_SEARCH_CHARS = 3;
let currentSearchTerm = "";
function debounce(fn, wait = 200) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}


/**
 * Maps logical task columns to their DOM container ids.
 * @type {{todo:string,inProgress:string,awaitFeedback:string,done:string}}
 */
let columnMap = {
  todo: "to-do-column",
  inProgress: "in-progress-column",
  awaitFeedback: "await-feedback-column",
  done: "done-column",
};

// User initials
onAuthStateChanged(auth, handleAuthChange);
/**
 * Handles auth state change to project user initials.
 * @param {import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js").User|null} user
 */
function handleAuthChange(user) {
  if (window.updateUserInitials) {
    window.updateUserInitials(user);
  }
}

const overlay = $("overlay-add-task");
const overlayContent = document.querySelector(".add-task-overlay-content");

// Backdrop-Click NUR EINMAL registrieren
overlay?.addEventListener("click", onOverlayBackdropClick);
/**
 * Closes the Add Task overlay when clicking the backdrop and resets edit view.
 * @param {MouseEvent} e
 */
function onOverlayBackdropClick(e) {
  if (e.target !== overlay || overlay.classList.contains("d-none")) return;
  document.querySelector('.edit-addtask-wrapper')?.classList.add('d-none');
  document.getElementById('task-overlay-content')?.classList.remove('d-none');
  window.toggleAddTaskBoard();
}

// Toggle Add Task Overlay
window.toggleAddTaskBoard = function () {
  if (overlay.classList.contains("d-none")) openOverlay();
  else closeOverlay();
  moveFormBackToAside();
};

/** Opens the overlay and resets the form via Cancel button. */
function openOverlay() {
  overlay.classList.remove("d-none");
  overlayContent.classList.remove("slide-out");
  overlayContent.classList.add("slide-in");
  const cancelBtn = $("cancel-button");
  if (cancelBtn) cancelBtn.click();
  else document.addEventListener('addtask:template-ready', () => $("cancel-button")?.click(), { once: true });
}

/** Closes the overlay with slide-out animation. */
function closeOverlay() {
  overlayContent.classList.remove("slide-in");
  overlayContent.classList.add("slide-out");
  overlayContent.addEventListener("animationend", function handler() {
    overlay.classList.add("d-none");
    overlayContent.classList.remove("slide-out");
    overlayContent.removeEventListener("animationend", handler);
  });
}

/** Returns the Add Task form wrapper back into the aside clone. */
function moveFormBackToAside() {
  const src = document.querySelector('.edit-addtask .addtask-wrapper');
  const dst = document.querySelector('.addtask-aside-clone');
  if (src && dst) dst.replaceChildren(src);
}

let db = getDatabase(app);

/**
 * Subscribes to /tasks changes and re-renders all columns.
 */
function loadTasksFromFirebase() {
  let tasksRef = ref(db, "tasks");
  onValue(tasksRef, (snapshot) => {
    let tasks = snapshot.val();
    renderAllColumns(tasks);
  });
}

/**
 * Renders all columns from a tasks dictionary.
 * @param {Record<string, any>} tasks
 */
function renderAllColumns(tasks) {
  clearAllColumns();
  const sortedIds = getSortedTaskIds(tasks);
  sortedIds.forEach((taskId) => renderTask(tasks[taskId], taskId));
  Object.keys(columnMap).forEach((key) => checkAndShowPlaceholder(columnMap[key]));
}

/** Clears innerHTML of every column container. */
function clearAllColumns() {
  for (const key in columnMap) $(columnMap[key]).innerHTML = "";
}

/**
 * Returns task ids sorted by movedAt (ascending).
 * @param {Record<string, any>} tasks
 * @returns {string[]}
 */
function getSortedTaskIds(tasks) {
  return Object.keys(tasks).sort((a, b) => (tasks[a].movedAt||0) - (tasks[b].movedAt||0));
}

/**
 * Creates and appends a task card into its target column.
 * @param {any} task
 * @param {string} taskId
 */
function renderTask(task, taskId) {
  const targetColumnId = columnMap[task.column] || "to-do-column";
  const columnElement = $(targetColumnId);
  const taskElement = createTaskElement(task, taskId);
  columnElement.appendChild(taskElement);
}

// placeholde inner text
let placeholderTexts = {
  "to-do-column": "No tasks to do",
  "in-progress-column": "No tasks in progressing",
  "await-feedback-column": "No tasks await feedback",
  "done-column": "No tasks done",
};

/**
 * Ensures a column shows a placeholder when it has no task cards.
 * @param {string} columnId
 */
function checkAndShowPlaceholder(columnId) {
  let column = $(columnId);
  let taskCards = Array.from(column.children).filter(
    (el) => !el.classList.contains("no-tasks")
  );
  let existingPlaceholder = column.querySelector(".no-tasks");
  if (taskCards.length === 0 && !existingPlaceholder) {
    let placeholder = document.createElement("div");
    placeholder.classList.add("no-tasks");
    placeholder.textContent = placeholderTexts[columnId] || "No tasks";
    column.appendChild(placeholder);
  } else if (taskCards.length > 0 && existingPlaceholder) {
    existingPlaceholder.remove();
  }
}

// drag and drop event listener
document.querySelectorAll(".board-column").forEach((column) => {
  column.addEventListener("dragover", allowDrop);
  column.addEventListener("drop", drop);
});

/** Prevents default to allow dropping. */
window.allowDrop = function (event) {
  event.preventDefault();
};

/** Starts a drag and highlights adjacent columns. */
window.drag = function (event) {
  event.dataTransfer.setData("text", event.target.id);
  highlightAdjacentColumns(event.target);
};

/**
 * Highlights columns adjacent to the one containing the dragged card.
 * @param {HTMLElement} taskElement
 */
function highlightAdjacentColumns(taskElement) {
  const columns = document.querySelectorAll('.task-list');
  const currentColumn = taskElement.closest('.task-list');
  columns.forEach(column => {
    column.classList.remove('highlight-column');
  });
  if (currentColumn) {
    const currentIndex = Array.from(columns).indexOf(currentColumn);
    if (currentIndex > 0) {
      columns[currentIndex - 1].classList.add('highlight-column'); 
    }
    if (currentIndex < columns.length - 1) {
      columns[currentIndex + 1].classList.add('highlight-column'); 
    }
  }
}

// Zu/Abbildung Spaltenname <-> DOM-ID
const LOGICAL_TO_DOM = {
  todo: 'to-do-column',
  inProgress: 'in-progress-column',
  awaitFeedback: 'await-feedback-column',
  review: 'await-feedback-column', // Fallback, falls "review" noch irgendwo kommt
  done: 'done-column',
};

const DOM_TO_LOGICAL = {
  'to-do-column': 'todo',
  'in-progress-column': 'inProgress',
  'await-feedback-column': 'awaitFeedback',
  'done-column': 'done',
};


/** Handles drop event for a task card. */
window.drop = handleDrop;
function handleDrop(event) {
  event.preventDefault();
  const taskId = event.dataTransfer.getData("text");
  const taskElement = $(taskId);
  const oldColumn = taskElement.parentElement;
  const newColumn = event.currentTarget;
  finalizeDrop(taskId, taskElement, oldColumn, newColumn);
}
/** Moves DOM, updates DB, placeholders and highlights after drop. */
function finalizeDrop(taskId, taskElement, oldColumn, newColumn) {
  newColumn.appendChild(taskElement);
  // NEW: dataset aktuell halten, damit Overlays später die richtige Spalte erkennen
  taskElement.dataset.column = DOM_TO_LOGICAL[newColumn.id] || taskElement.dataset.column;

  updateTaskColumn(taskId, newColumn.id);
  checkAndShowPlaceholder(oldColumn.id);
  checkAndShowPlaceholder(newColumn.id);
  resetColumnBackgrounds();
}


/** Removes highlight styling from all task-list columns. */
function resetColumnBackgrounds() {
  const columns = document.querySelectorAll('.task-list');
  columns.forEach(column => {
    column.classList.remove('highlight-column');
  });
}

/**
 * Persists the new column to Firebase and stamps movedAt.
 * @param {string} taskId
 * @param {string} newColumnId - DOM id of the target column.
 */
function updateTaskColumn(taskId, newColumnId) {
  const columnMapReverse = {
    "to-do-column": "todo",
    "in-progress-column": "inProgress",
    "await-feedback-column": "awaitFeedback",
    "done-column": "done",
  };
  let dbRef = ref(db, `tasks/${taskId}`);
  let newColumnValue = columnMapReverse[newColumnId] || "todo";
  update(dbRef, {
    column: newColumnValue,
    movedAt: Date.now(),
  }).catch((error) =>
    console.error("Fehler beim Aktualisieren der Spalte:", error)
  );
}

/**
 * Renders up to three contact initials with background images.
 * @param {{initials:string,colorIndex:number}[]} contacts
 * @returns {string}
 */
export function renderAssignedInitials(contacts = []) {
  const maxShown = 3;
  if (!Array.isArray(contacts) || contacts.length === 0) return "";

  const shownContacts = contacts.slice(0, maxShown);
  const hasOverflow = contacts.length > maxShown;
  const overflowCount = contacts.length - (maxShown - 1);

  return shownContacts
    .map((contact, index) => {
      const positionClass = ["first-initial", "second-initial", "third-initial"][index];

      if (hasOverflow && index === maxShown - 1) {
        return `
          <div class="initial-circle ${positionClass} initial-circle--more" title="+${overflowCount}">
            +${overflowCount}
          </div>
        `;
      }

      const colorIdx = Number.isFinite(contact?.colorIndex) ? contact.colorIndex : 0;
      const initials = contact?.initials || "";
      const title = contact?.name || initials;

      return `
        <div class="initial-circle ${positionClass}" 
             style="background-image: url(../assets/icons/contact/color${colorIdx}.svg)"
             title="${title}">
          ${initials}
        </div>
      `;
    })
    .join("");
}



/**
 * Maps task category name to a CSS class used for the label.
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
 * Builds the progress bar HTML for subtasks and the done/total label.
 * @param {{checked:boolean}[]} subtasks
 * @returns {string}
 */
export function renderSubtaskProgress(subtasks) {
  let total = subtasks.length;
  let done = subtasks.filter((st) => st.checked).length;
  let percentage = total ? Math.round((done / total) * 100) : 0;
  return `
    <div class="subtasks-box">
      <div class="progressbar">
        <div class="progressbar-inlay" style="width: ${percentage}%"></div>
      </div>
      ${done}/${total} Subtasks
    </div>
  `;
}

// load tasks from firebase
document.addEventListener("DOMContentLoaded", onBoardDomContentLoaded);
/** Bootstraps board: tasks subscription and search handlers. */
function onBoardDomContentLoaded() {
  loadTasksFromFirebase();
  setupSearchHandlers();
}

/** Wires search input and button handlers. */
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

  // Live-Suche beim Tippen (mit Debounce)
  const debouncedRun = debounce(run, 200);
  searchInput.addEventListener("input", debouncedRun);

  // Optional: Enter erlaubt sofortiges Suchen
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") run();
  });

  // Search-Button bleibt nutzbar, aber respektiert die 3-Zeichen-Regel
  searchButton?.addEventListener("click", run);
}


/**
 * Shows only tasks whose title or description contains the term.
 * @param {string} searchTerm
 */
function filterTasks(searchTerm) {
  let allTasks = document.querySelectorAll(".ticket");
  filterTaskVisibility(allTasks, searchTerm);
  updateAllPlaceholders();
}

/**
 * Applies display filtering to a NodeList of task cards.
 * @param {NodeListOf<Element>|Element[]} tasks
 * @param {string} searchTerm
 */
function filterTaskVisibility(tasks, searchTerm) {
  tasks.forEach((taskEl) => {
    let title =
      taskEl.querySelector(".ticket-title")?.textContent.toLowerCase() || "";
    let description =
      taskEl.querySelector(".ticket-text")?.textContent.toLowerCase() || "";
    let matches =
      title.includes(searchTerm) || description.includes(searchTerm);
    taskEl.style.display = matches || searchTerm === "" ? "" : "none";
  });
}

/** Updates placeholders for all columns after a filter run. */
function updateAllPlaceholders() {
  for (let key in columnMap) {
    updatePlaceholderForColumn(columnMap[key]);
  }
}

/**
 * Ensures a specific column shows or hides its placeholder based on visible tasks.
 * @param {string} columnId
 */
function updatePlaceholderForColumn(columnId) {
  let column = document.getElementById(columnId);
  let visibleTasks = Array.from(column.querySelectorAll(".ticket")).filter(
    (el) => el.style.display !== "none"
  );
  const placeholder = column.querySelector(".no-tasks");
  if (visibleTasks.length === 0 && !placeholder) {
    let newPlaceholder = document.createElement("div");
    newPlaceholder.classList.add("no-tasks");
    newPlaceholder.textContent = placeholderTexts[columnId] || "No tasks";
    column.appendChild(newPlaceholder);
  } else if (visibleTasks.length > 0 && placeholder) {
    placeholder.remove();
  }
}

$("edit-task-btn").addEventListener("click", onEditTaskBtnClick);
/**
 * Switches overlay content into edit mode and moves the form into the edit container.
 */
function onEditTaskBtnClick() {
  $("task-overlay-content").classList.toggle("d-none");
  document.querySelector(".edit-addtask-wrapper").classList.toggle("d-none");
  const src = document.querySelector('.addtask-aside-clone .addtask-wrapper');
  const dst = document.querySelector('.edit-addtask');
  if (src && dst) dst.replaceChildren(src);
}

// Wird vom Overlay (template.modul.js) aufgerufen, um "wie DnD" zu verschieben.
window.onTaskColumnChanged = function(taskId, targetLogical /* z.B. 'inProgress', 'awaitFeedback' */) {
  const taskEl = document.getElementById(String(taskId));
  if (!taskEl) return;

  const oldColumnEl = taskEl.closest('.task-list') || taskEl.parentElement;
  const newDomId = LOGICAL_TO_DOM[targetLogical] || targetLogical;
  const newColumnEl = document.getElementById(newDomId);

  if (!newColumnEl || !oldColumnEl) {
    console.warn('[onTaskColumnChanged] Ziel/Quelle nicht gefunden:', { targetLogical, newDomId });
    return;
  }
  finalizeDrop(taskId, taskEl, oldColumnEl, newColumnEl);
};
