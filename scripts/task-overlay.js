import {
  getDatabase,
  update,
  ref,
  get,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { renderAssignedContacts, renderSubtasks } from "./template.modul.js";
import { getLabelClass } from "./board.js";

const db = getDatabase();
const TASK_CATEGORIES = ['toDo', 'inProgress', 'awaitFeedback', 'done'];
let currentTask = null;

// Displays the task overlay with detailed information
window.showTaskOverlay = async function (taskId) {
  try {
    const db = getDatabase();
    const taskRef = ref(db, `tasks/${taskId}`);
    const snapshot = await get(taskRef);
    const task = snapshot.val();
    if (!task) return;

    task.id = taskId;
    currentTask = task;
    await normalizeSubtasks(taskId, task);
    fillTaskOverlay(task);
    
    // Properly defined delete button reference
    const deleteBtn = $("delete-task-btn");
    if (deleteBtn) {
      deleteBtn.onclick = async () => {
        try {
          await deleteTaskFromDatabase(taskId);
          hideOverlay();
        } catch (error) {
          console.error("Error deleting task:", error);
        }
      };
    }
    const bg = $("task-overlay-bg");
    const overlay = $("task-overlay");
    if (!bg || !overlay) return;
    
    bg.classList.remove("d-none");
    overlay.classList.remove("animate-out");
    overlay.classList.add("animate-in");
  } catch (error) {
    console.error("Error showing task overlay:", error);
  }
};

// hide task overlay animated
window.hideOverlay = function() {
  const bg = $("task-overlay-bg");
  const overlay = $("task-overlay");
  if (!bg || !overlay) return;
  
  overlay.classList.remove("animate-in");
  overlay.classList.add("animate-out");
  setTimeout(() => {
    bg.classList.add("d-none");
    overlay.classList.remove("animate-out");
  }, 300);
};

// fill task
function fillTaskOverlay(task) {
  renderCategory(task.category);
  renderTitleDescDate(task);
  renderPriority(task.priority);
  renderAssignedContacts(task);
  renderSubtasks(task);
  setupSubtaskListeners(task);
}

// render category of task
function renderCategory(category) {
  const el = $("overlay-user-story");
  el.textContent = category || "";
  el.className = "";
  el.classList.add(getLabelClass(category));
}

// render all task data
function renderTitleDescDate(task) {
  $("overlay-title").innerHTML = task.title || "";
  $("overlay-description").textContent = task.description || "";
  $("overlay-due-date").textContent = task.dueDate || "";
}

// render priority in task overlay
export function renderPriority(priority) {
  const icons = {
    urgent: "./assets/icons/board/Urgent.svg",
    medium: "./assets/icons/board/Medium.svg",
    low: "./assets/icons/board/Low.svg",
  };
  $("overlay-priority-text").textContent = capitalize(priority);
  $("overlay-priority-icon").src = icons[priority] || "";
}

// capitalize first letter function
function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
}

// subtask listener
function setupSubtaskListeners(task) {
  task.subtasks?.forEach((_, i) => {
    const checkbox = $(`subtask${i}`);
    const label = checkbox?.nextElementSibling;
    const img = label?.querySelector("img");
    if (checkbox && label && img) {
      attachSubtaskEvents(checkbox, label, img, task.id, i);
    }
  });
}

// subtasks checkbox events
function attachSubtaskEvents(checkbox, label, img, taskId, i) {
  const updateImage = () => {
    const hover = label.matches(":hover");
    const basePath = "./assets/icons/add_task/";
    let icon;
    if (checkbox.checked) {
      icon = hover ? "checked_hover.svg" : "check_checked.svg";
    } else {
      icon = hover ? "check_default_hover.svg" : "check_default.svg";
    }
    img.src = basePath + icon;
  };

  checkbox.addEventListener("change", () => {
    label.classList.toggle("checked", checkbox.checked);
    updateImage();
    updateSubtaskStatus(taskId, i, checkbox.checked);
  });
  label.addEventListener("mouseenter", updateImage);
  label.addEventListener("mouseleave", updateImage);
}

// normalize subtasks
async function normalizeSubtasks(taskId, task) {
  if (!Array.isArray(task.subtasks)) return;
  const normalized = task.subtasks.map(st => 
    typeof st === "string" ? { name: st, checked: false } : st
  );
  await update(ref(db, `tasks/${taskId}`), { subtasks: normalized });
  task.subtasks = normalized;
}

// update subtasks
export async function updateSubtaskStatus(taskId, subtaskIndex, isChecked) {
  const taskRef = ref(db, `tasks/${taskId}`);
  const snapshot = await get(taskRef);
  const task = snapshot.val();
  
  if (task?.subtasks?.[subtaskIndex]) {
    const updatedSubtasks = task.subtasks.map((st, i) => 
      i === subtaskIndex ? { ...(typeof st === "string" ? { name: st } : st), checked: isChecked } : st
    );
    await update(taskRef, { subtasks: updatedSubtasks });
  }
}

// Deletes a task from all database locations
async function deleteTaskFromDatabase(taskId) {
  const updates = { [`tasks/${taskId}`]: null };
  TASK_CATEGORIES.forEach(category => {
    updates[`${category}Tasks/${taskId}`] = null;
  });
  await update(ref(db), updates);
}

// max 50 letter length displayed
export function truncateDescription(text) {
  const MAX_LENGTH = 50;
  if (text.length <= MAX_LENGTH) {
    return text;
  }
  let truncated = text.substr(0, MAX_LENGTH);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > 0) {
    truncated = truncated.substr(0, lastSpace);
  }
  return truncated + '...';
}

window.toggleEditTaskBoard = function() {
  if (currentTask) {
    getEditTaskBoardTemplate(currentTask);
  }
}

window.saveEditedTask = async function() {
  if (!currentTask) return;
  
  const categoryText = $("edit-category-select").querySelector('span').textContent;
  const updatedTask = {
    title: $("edit-task-title").value,
    description: $("edit-task-textarea").value,
    dueDate: $("edit-datepicker").value,
    priority: document.querySelector('.priority-button.active')?.dataset.priority || currentTask.priority,
    category: categoryText === 'Select task category' ? currentTask.category : categoryText
  };
  
  if (currentTask.assignedTo) updatedTask.assignedTo = currentTask.assignedTo;
  if (currentTask.subtasks) updatedTask.subtasks = currentTask.subtasks;
  
  try {
    await update(ref(db, `tasks/${currentTask.id}`), updatedTask);
    Object.assign(currentTask, updatedTask);
    createTaskOverlayTemplate();
    fillTaskOverlay(currentTask);
  } catch (error) {
    console.error("Error saving task:", error);
  }
}

function createTaskOverlayTemplate() {
  $("task-overlay-content").innerHTML = /*html*/ `
    <div class="label-exit-box">
      <span id="overlay-user-story">User Story...</span>
      <img onclick="hideOverlay()" id="task-overlay-exit-button" class="overlay-exit-button" src="./assets/icons/board/exit_default.svg" alt="close overlay" />
    </div>
    <div class="task-overlay-title" id="overlay-title"></div>
    <div class="task-text" id="overlay-description"></div>
    <div class="due-date-box">
      <b>Due date:</b><span id="overlay-due-date"></span>
    </div>
    <div class="priority-box">
      <b>Priority:</b>
      <div class="priority">
        <span id="overlay-priority-text"></span>
        <img id="overlay-priority-icon" src="" alt="" />
      </div>
    </div>
    <div class="assigned-to">
      <b>Assigned to:</b>
      <div id="overlay-members" class="members"></div>
    </div>
    <div id="overlay-subtasks" class="subtasks-check-box"></div>
    <div class="delete-edit-box">
      <div class="button-box-delete" id="delete-task-btn">
        <img class="icon-hover-filter" src="./assets/icons/board/delete_default.svg" alt="Delete" />
        <span>Delete</span>
      </div>
      <div class="vertical-spacer"></div>
      <div class="button-box-edit" id="edit-task-btn" onclick="toggleEditTaskBoard()">
        <img class="icon-hover-filter" src="./assets/icons/board/edit_default.svg" alt="Edit" />
        <span>Edit</span>
      </div>
    </div>
  `;
}