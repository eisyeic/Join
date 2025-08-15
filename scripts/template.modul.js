import {
  getLabelClass,
  renderSubtaskProgress,
  renderAssignedInitials,
} from "./board.js";

import { truncateDescription } from "./task-overlay.js";


// create task template
export function createTaskElement(task, taskId) {
  let labelClass = getLabelClass(task.category);
  let ticket = document.createElement("div");
  ticket.classList.add("ticket");
  ticket.setAttribute("id", taskId);
  ticket.setAttribute("draggable", "true");
  ticket.setAttribute("ondragstart", "drag(event)");
  
  // Beschreibung kürzen wenn nötig
  const truncatedDescription = truncateDescription(task.description || '');
  
  ticket.innerHTML = `
    <div class="ticket-content" onclick="showTaskOverlay('${taskId}')">
      <div class="label ${labelClass}">${task.category}</div>
      <div class="frame">
        <div class="ticket-title">${task.title}</div>
        <div class="ticket-text">${truncatedDescription}</div>
      </div>
      ${
        task.subtasks && task.subtasks.length > 0
          ? renderSubtaskProgress(task.subtasks)
          : ""
      }
      <div class="initials-icon-box">
        <div class="initials">
          ${
            task.assignedContacts
              ? renderAssignedInitials(task.assignedContacts)
              : ""
          }
        </div>
        <img src="./assets/icons/board/${task.priority}.svg" alt="${task.priority}">
      </div>
    </div>
  `;
  return ticket;
}

// render contacts in task overlay
export function renderAssignedContacts(task) {
  let container = $("overlay-members");
  if (!container) return;
  container.innerHTML = "";
  let maxShown = 3;
  let contacts = task.assignedContacts || [];
  for (let i = 0; i < Math.min(contacts.length, maxShown); i++) {
    let contact = contacts[i];
      container.innerHTML += `
        <div class="member">
          <div class="initial-circle" style="background-image: url(../assets/icons/contact/color${contact.colorIndex}.svg)">
            ${contact.initials}
          </div>
        <span>${contact.name}</span>
      </div>
    `;
  }
}

// render subtasks in task overlay
export function renderSubtasks(task) {
  let container = $("overlay-subtasks");
  if (task.subtasks && task.subtasks.length > 0) {
    container.innerHTML = "<b>Subtasks</b>";
    task.subtasks.forEach((subtask, i) => {
      let checked = subtask.checked ? "checked" : "";
      let checkboxId = `subtask${i}`;
      let iconSrc = subtask.checked
        ? "./assets/icons/add_task/check_checked.svg"
        : "./assets/icons/add_task/check_default.svg";
      let labelClass = subtask.checked ? "checked" : "";
      container.innerHTML += `
        <div class="subtask">
          <input type="checkbox" id="${checkboxId}" ${checked} style="display: none"/>
          <label for="${checkboxId}" class="${labelClass}">
            <img src="${iconSrc}" />
            ${subtask.name}
          </label>
        </div>
      `;
    });
  } else {
    container.innerHTML = "<b>no subtasks</b>";
  }
}