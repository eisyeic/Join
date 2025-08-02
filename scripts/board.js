import {
  getDatabase,
  ref,
  onValue,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { app, auth } from "./firebase.js";

const db = getDatabase(app);

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

function loadTasksFromFirebase() {
  const tasksRef = ref(db, "tasks");
  onValue(tasksRef, (snapshot) => {
    const tasks = snapshot.val();
    renderToDoTasks(tasks);
  });
}

function renderToDoTasks(tasks) {
  const todoColumn = $("to-do-column");
  todoColumn.innerHTML = "";
  for (let taskId in tasks) {
    const task = tasks[taskId];
    const taskElement = createTaskElement(task);
    todoColumn.appendChild(taskElement);
  }
}

function createTaskElement(task, taskId) {
  const labelClass = getLabelClass(task.category);
  const ticket = document.createElement("div");
  ticket.classList.add("ticket");
  ticket.innerHTML = `
            <div onclick="showTaskOverlay(${taskId})" class="ticket">
              <div class="ticket-content">
                <div class="label ${labelClass}">${task.category}</div>
                <div class="frame">
                  <div class="ticket-title">
                    ${task.title}
                  </div>
                  <div class="ticket-text">
                    ${task.description}
                  </div>
                </div>
                  ${
                    task.subtasks && task.subtasks.length > 0
                      ? renderSubtaskProgress(task.subtasks)
                      : ""
                  }
                <div class="initials-icon-box">
                  <div class="initials">
                    
                  </div>
                  <img src="./assets/icons/board/${task.priority.toLowerCase()}.svg" alt="${task.priority}">
                </div>
              </div>
            </div> `;
  return ticket;
}

function getLabelClass(category) {
  if (category === "User Story") return "user-story";
  if (category === "Technical task") return "technical-task";
  return "";
}

function renderSubtaskProgress(subtasks) {
  const total = subtasks.length;
  const done = subtasks.filter((st) => st.done).length;
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

document.addEventListener("DOMContentLoaded", () => {
  loadTasksFromFirebase();
});
