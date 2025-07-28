import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { app } from "./firebase.js";

const db = getDatabase(app);


// Toggle Add Task Overlay
window.toggleAddTaskBoard = function () {
  $("overlay-add-task").classList.toggle("d-none");
}

// task overlay
window.showTaskOverlay = function () {
    $("task-overlay-bg").classList.toggle("d-none");
}

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
  const ticket = document.createElement('div');
  ticket.classList.add('ticket');
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
                  ${task.subtasks && task.subtasks.length > 0 ? renderSubtaskProgress(task.subtasks) : ''}
                <div class="initials-icon-box">
                  <div class="initials">
                    ${renderInitials(task.assignedContacts)}
                  </div>
                  <img src="./assets/icons/board/${task.priority.toLowerCase()}.svg" alt="${task.priority}">
                </div>
              </div>
            </div> `;
  return ticket;
}

function getLabelClass(category) {
  if (category === "User Story") return 'user-story';
  if (category === "Technical task") return 'technical-task';
  return '';
}

function renderSubtaskProgress(subtasks) {
  const total = subtasks.length;
  const done = subtasks.filter(st => st.done).length;
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

function renderInitials(assignedTo = []) {
  const colors = ["#FFA500", "#00BFFF", "#32CD32", "#9370DB", "#FF69B4"]; // beliebige Farben

  if (!Array.isArray(assignedTo) || assignedTo.length === 0) return '';

  return assignedTo.map((name, index) => {
    const initials = name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();

    const zIndex = index + 1;
    const marginLeft = index === 0 ? 0 : -10;
    const color = colors[index % colors.length];

    return `
      <div class="initial-circle" 
           style="background-color: ${color}; 
                  z-index: ${zIndex}; 
                  margin-left: ${marginLeft}px;">
        ${initials}
      </div>`;
  }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  loadTasksFromFirebase();
});
