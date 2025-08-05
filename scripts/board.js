import {
  getDatabase,
  ref,
  onValue,
  update,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { app, auth } from "./firebase.js";
import { createTaskElement } from "./template.modul.js";

let db = getDatabase(app);

let columnMap = {
  todo: "to-do-column",
  inProgress: "in-progress-column",
  awaitFeedback: "await-feedback-column",
  done: "done-column",
};

// User initials
onAuthStateChanged(auth, (user) => {
  if (window.updateUserInitials) {
    window.updateUserInitials(user);
  }
});

// Toggle Add Task Overlay
window.toggleAddTaskBoard = function () {
  $("overlay-add-task").classList.toggle("d-none");
};

// load data from firebase
function loadTasksFromFirebase() {
  let tasksRef = ref(db, "tasks");
  onValue(tasksRef, (snapshot) => {
    let tasks = snapshot.val();
    renderAllColumns(tasks);
  });
}

// render tasks in columns
function renderAllColumns(tasks) {
  for (let key in columnMap) {
    let columnElement = $(columnMap[key]);
    columnElement.innerHTML = "";
  }
  let sortedTaskIds = Object.keys(tasks).sort((a, b) => {
    let aTime = tasks[a].movedAt || 0;
    let bTime = tasks[b].movedAt || 0;
    return aTime - bTime;
  });
  for (let taskId of sortedTaskIds) {
    let task = tasks[taskId];
    let targetColumnId = columnMap[task.column] || "to-do-column";
    let columnElement = $(targetColumnId);
    let taskElement = createTaskElement(task, taskId);
    columnElement.appendChild(taskElement);
  }
  for (let key in columnMap) {
    const columnId = columnMap[key];
    checkAndShowPlaceholder(columnId);
  }
}

// placeholde inner text
let placeholderTexts = {
  "to-do-column": "No tasks to do",
  "in-progress-column": "No tasks in progressing",
  "await-feedback-column": "No tasks await feedback",
  "done-column": "No tasks done",
};

// check and show placeholder
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

// drag and drop prevent default
window.allowDrop = function (event) {
  event.preventDefault();
};

// drag functionality
window.drag = function (event) {
  event.dataTransfer.setData("text", event.target.id);
  highlightAdjacentColumns(event.target);
};

// Funktion zum Markieren benachbarter Spalten
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

// drop functionality
window.drop = function (event) {
  event.preventDefault();
  let taskId = event.dataTransfer.getData("text");
  let taskElement = $(taskId);
  let oldColumn = taskElement.parentElement;
  let newColumn = event.currentTarget;
  newColumn.appendChild(taskElement);
  updateTaskColumn(taskId, newColumn.id);
  checkAndShowPlaceholder(oldColumn.id);
  checkAndShowPlaceholder(newColumn.id);
  resetColumnBackgrounds();
};

// reset column background after drop 
function resetColumnBackgrounds() {
  const columns = document.querySelectorAll('.task-list');
  columns.forEach(column => {
    column.classList.remove('highlight-column');
  });
}

// update task column placeholder
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

// render assigned contacts in task
export function renderAssignedInitials(contacts) {
  let maxShown = 3;
  let shownContacts = contacts.slice(0, maxShown);
  return shownContacts
    .map((contact, index) => {
      let positionClass = ["first-initial", "second-initial", "third-initial"][
        index
      ];
      return `
      <div class="initial-circle ${positionClass}" 
           style="background-image: url(../assets/icons/contact/color${contact.colorIndex}.svg)">
        ${contact.initials}
      </div>
    `;
    })
    .join("");
}

// get label bg color
export function getLabelClass(category) {
  return (
    {
      "User Story": "user-story",
      "Technical task": "technical-task",
    }[category] || ""
  );
}

// subtask rendering progressbar
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
document.addEventListener("DOMContentLoaded", () => {
  loadTasksFromFirebase();
  let searchInput = $("search-input");
  let searchButton = $("search-btn");
  if (!searchInput || !searchButton) return;
  function handleSearch() {
    let searchTerm = searchInput.value.toLowerCase().trim();
    filterTasks(searchTerm);
  }
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  });
  searchButton.addEventListener("click", handleSearch);
});

// search functionality
function filterTasks(searchTerm) {
  let allTasks = document.querySelectorAll(".ticket");
  filterTaskVisibility(allTasks, searchTerm);
  updateAllPlaceholders();
}

// filter task visibility
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

// update placeholder if column empty
function updateAllPlaceholders() {
  for (let key in columnMap) {
    updatePlaceholderForColumn(columnMap[key]);
  }
}

// placeholder visibility functionality
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
