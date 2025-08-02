import {
  getDatabase,
  ref,
  onValue, 
  update
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { app, auth } from "./firebase.js";
import { renderSubtasks } from "./templates.js";

let db = getDatabase(app);

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

// task overlay
window.showTaskOverlay = function () {
  $("task-overlay-bg").classList.toggle("d-none");
};

// load data from firebase
function loadTasksFromFirebase() {
  let tasksRef = ref(db, "tasks");
  onValue(tasksRef, (snapshot) => {
    let tasks = snapshot.val();
    renderAllColumns(tasks);
  });
}


function renderAllColumns(tasks) {
  const columnMap = {
    "todo": "to-do-column",
    "inProgress": "in-progress-column",
    "awaitFeedback": "await-feedback-column",
    "done": "done-column"
  };

  // Leere alle Spalten
  for (let key in columnMap) {
    const columnElement = $(columnMap[key]);
    columnElement.innerHTML = ""; // leeren
  }

  // Aufgaben nach Spalte einsortieren
  for (let taskId in tasks) {
    const task = tasks[taskId];
    const targetColumnId = columnMap[task.column] || "to-do-column";
    const columnElement = $(targetColumnId);
    const taskElement = createTaskElement(task, taskId);
    columnElement.appendChild(taskElement);
  }

  // Füge "No tasks"-Platzhalter in leere Spalten ein
  for (let key in columnMap) {
    const column = $(columnMap[key]);
    if (column.children.length === 0) {
      const placeholder = document.createElement("div");
      placeholder.classList.add("no-tasks");
      placeholder.textContent = "No tasks";
      column.appendChild(placeholder);
    }
  }
}

function checkEmptyColumns() {
  const allColumnIds = ["to-do-column", "in-progress-column", "await-feedback-column", "done-column"];
  allColumnIds.forEach(id => {
    const column = $(id);

    // Alle echten Tasks (ohne Platzhalter)
    const taskCards = Array.from(column.children).filter(
      el => !el.classList.contains("no-tasks")
    );

    // Wenn leer → Platzhalter anzeigen
    if (taskCards.length === 0 && !column.querySelector(".no-tasks")) {
      const placeholder = document.createElement("div");
      placeholder.classList.add("no-tasks");
      placeholder.textContent = "No tasks";
      column.appendChild(placeholder);
    }

    // Wenn Tasks vorhanden → Platzhalter entfernen
    if (taskCards.length > 0) {
      const existingPlaceholder = column.querySelector(".no-tasks");
      if (existingPlaceholder) {
        existingPlaceholder.remove();
      }
    }
  });
}



function createTaskElement(task, taskId) {
  let labelClass = getLabelClass(task.category);
  let ticket = document.createElement("div");
  ticket.classList.add("ticket");
  ticket.setAttribute("id", taskId);
  ticket.setAttribute("draggable", "true");
  ticket.setAttribute("ondragstart", "drag(event)");

  ticket.innerHTML = `
    <div class="ticket-content" onclick="showTaskOverlay()">
      <div class="label ${labelClass}">${task.category}</div>
      <div class="frame">
        <div class="ticket-title">${task.title}</div>
        <div class="ticket-text">${task.description}</div>
      </div>
      ${
        task.subtasks && task.subtasks.length > 0
          ? renderSubtaskProgress(task.subtasks)
          : ""
      }
      <div class="initials-icon-box">
        <div class="initials">
          ${task.assignedContacts ? renderAssignedInitials(task.assignedContacts) : ""}
        </div>
        <img src="./assets/icons/board/${task.priority.toLowerCase()}.svg" alt="${task.priority}">
      </div>
    </div>
  `;
  return ticket;
}


document.querySelectorAll(".board-column").forEach(column => {
  column.addEventListener("dragover", allowDrop);
  column.addEventListener("drop", drop);
});


// drag and drop prevent default
window.allowDrop = function(event) {
  event.preventDefault();
};

// drag functionality 
window.drag = function(event) {
  event.dataTransfer.setData("text", event.target.id);
};

// drop functionality
window.drop = function(event) {
  event.preventDefault();
  const taskId = event.dataTransfer.getData("text");
  const taskElement = document.getElementById(taskId);
  const newColumn = event.currentTarget;

  // Platzhalter entfernen, falls vorhanden
  const placeholder = newColumn.querySelector(".no-tasks");
  if (placeholder) {
    placeholder.remove();
  }

  // Karte anhängen (am Ende)
  newColumn.appendChild(taskElement);

  // Update Firebase
  updateTaskColumn(taskId, newColumn.id);

  // Prüfe auf leere Spalten
  checkEmptyColumns();
};

function updateTaskColumn(taskId, newColumnId) {
  const columnMapReverse = {
    "to-do-column": "todo",
    "in-progress-column": "inProgress",
    "await-feedback-column": "awaitFeedback",
    "done-column": "done"
  };

  const dbRef = ref(db, `tasks/${taskId}`);
  const newColumnValue = columnMapReverse[newColumnId] || "todo";

  // Nutze die importierte update-Funktion mit Referenz und Objekt
  update(dbRef, { column: newColumnValue })
    .catch(error => {
      console.error("Fehler beim Updaten der Spalte:", error);
    });
}



function renderAssignedInitials(contacts) {
  const maxShown = 3;
  const shownContacts = contacts.slice(0, maxShown);

  return shownContacts.map((contact, index) => {
    const positionClass = ['first-initial', 'second-initial', 'third-initial'][index];
    return `
      <div class="initial-circle ${positionClass}" 
           style="background-image: url(../assets/icons/contact/color${contact.colorIndex}.svg)">
        ${contact.initials}
      </div>
    `;
  }).join('');
}


// get label bg color
function getLabelClass(category) {
  if (category === "User Story") return "user-story";
  if (category === "Technical task") return "technical-task";
  return "";
}

// subtask rendering progressbar
function renderSubtaskProgress(subtasks) {
  let total = subtasks.length;
  let done = subtasks.filter((st) => st.done).length;
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
});
