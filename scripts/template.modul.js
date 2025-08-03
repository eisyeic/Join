import {
  getLabelClass,
  renderSubtaskProgress,
  renderAssignedInitials,
} from "./board.js";

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
  let container = $("overlay-members");
  if (!container) return;
  container.innerHTML = "";
  let maxShown = 3;
  let contactsToShow = task.assignedContacts?.slice(0, maxShown) || [];
  contactsToShow.forEach((contact) => {
    container.innerHTML += `
      <div class="member">
        <div class="member">
          <div class="initial-circle"
            style="background-image: url(../assets/icons/contact/color${contact.colorIndex}.svg)">
            ${contact.initials}
          </div>
          <span>${contact.name}</span>
        </div>
      </div>
    `;
  });
}

// render subtasks in task overlay
export function renderSubtasks(task) {
  const container = $("overlay-subtasks");
  container.innerHTML = "<b>Subtasks:</b>";

  task.subtasks?.forEach((title, i) => {
    container.innerHTML += `
      <div class="subtask">
        <input type="checkbox" id="subtask${i}" style="display: none"/>
        <label for="subtask${i}">
          <img src="./assets/icons/add_task/check_default.svg" />
          ${title}
        </label>
      </div>
    `;
  });
}
