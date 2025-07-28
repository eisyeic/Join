import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { app } from "./firebase.js";

const db = getDatabase(app);


// Toggle Add Task Overlay
window.toggleAddTaskBoard = function () {
  $d("overlay-add-task").classList.toggle("d-none");
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
  const todoColumn = document.getElementById("to-do-column");
  todoColumn.innerHTML = ""; 
  for (let taskId in tasks) {
    const task = tasks[taskId];
    const taskElement = createTaskElement(task);
    todoColumn.appendChild(taskElement);
  }
}

function createTaskElement(task) {
  const labelClass = getLabelClass(task.category);
  const ticket = document.createElement('div');
  ticket.classList.add('ticket');
  ticket.innerHTML = `
            <div onclick="showTaskOverlay()" class="ticket">
              <div class="ticket-content">
                <div class="label ${labelClass}">${task.category}</div>
                <div class="frame">
                  <div class="ticket-title">
                    Kochwelt Page & Recipe Recommender
                  </div>
                  <div class="ticket-text">
                    Build start page with recipe recommendation...
                  </div>
                </div>
                <div class="subtasks-box">
                  <div class="progressbar">
                    <div class="progressbar-inlay"></div>
                  </div>
                  1/2 Subtasks
                </div>
                <div class="initials-icon-box">
                  <div class="initials">
                    <img
                      class="first-initial"
                      src="./assets/icons/board/Profile badge.svg"
                      alt=""
                    />
                    <img
                      class="second-initial"
                      src="./assets/icons/board/Profile badge (1).svg"
                      alt=""
                    />
                    <img
                      class="third-initial"
                      src="./assets/icons/board/Profile badge (2).svg"
                      alt=""
                    />
                  </div>
                  <div class="priority-icon">
                    <img src="./assets/icons/board/urgent.svg" alt="" />
                  </div>
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

/* 
<div class="ticket-content">
      <div class="label" style="background-color: ${getCategoryColor(task.category)};">
        ${task.category}
      </div>
      <div class="frame">
        <span class="ticket-title">${task.title}</span>
        <span class="ticket-text">${task.description}</span>
      </div>
      ${task.subtasks && task.subtasks.length > 0 ? renderSubtaskProgress(task.subtasks) : ''}
      <div class="initials-icon-box">
        <div class="initials">
          ${renderInitials(task.assignedTo)}
        </div>
        <img src="./assets/icons/board/${task.priority.toLowerCase()}.svg" alt="${task.priority}">
      </div>
    </div>
*/

function renderInitials(assignedTo = []) {
  return assignedTo.map((name, index) => {
    const initials = name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
    const zIndex = index + 1;
    const marginLeft = index === 0 ? 0 : -10;

    return `<div class="first-initial" style="z-index: ${zIndex}; margin-left: ${marginLeft}px;">
              <img src="./assets/icons/profile/profile_icon_${(index % 3) + 1}.svg" alt="${initials}">
            </div>`;
  }).join('');
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
      <span>${done}/${total} Subtasks</span>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  loadTasksFromFirebase();
});
