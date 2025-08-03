import {
  getLabelClass,
  renderSubtaskProgress,
  renderAssignedInitials,
} from "./board.js";

import { updateSubtaskStatus } from "./task-overlay.js";


// create task template
export function createTaskElement(task, taskId) {
  let labelClass = getLabelClass(task.category);
  let ticket = document.createElement("div");
  ticket.classList.add("ticket");
  ticket.setAttribute("id", taskId);
  ticket.setAttribute("draggable", "true");
  ticket.setAttribute("ondragstart", "drag(event)");
  ticket.innerHTML = `
    <div class="ticket-content" onclick="showTaskOverlay('${taskId}')">
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
          ${
            task.assignedContacts
              ? renderAssignedInitials(task.assignedContacts)
              : ""
          }
        </div>
        <img src="./assets/icons/board/${task.priority}.svg" alt="${
    task.priority
  }">
      </div>
    </div>
  `;
  return ticket;
}

// render contacts in task overlay
export function renderAssignedContacts(task) {
  const container = $("overlay-members");
  if (!container) return;
  container.innerHTML = "";
  const maxShown = 3;
  const contacts = task.assignedContacts || [];
  for (let i = 0; i < Math.min(contacts.length, maxShown); i++) {
    const contact = contacts[i];
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
  const container = $("overlay-subtasks");
  container.innerHTML = "<b>Subtasks:</b>";

  task.subtasks?.forEach((subtask, i) => {
    const checked = subtask.checked ? "checked" : "";
    const checkboxId = `subtask${i}`;
    const iconSrc = subtask.checked
      ? "./assets/icons/add_task/check_checked.svg"
      : "./assets/icons/add_task/check_default.svg";
    const labelClass = subtask.checked ? "checked" : "";

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
}
