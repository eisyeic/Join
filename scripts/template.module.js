import { subtasks, addEditEvents, deleteEvent } from "./addtask.js";


// addtask subtasks list display
export function renderSubtasks() {
  $("subtask-list").innerHTML = subtasks
    .map(
      (subtask, index) => `
      <li class="subtask-item" data-index="${index}">
        <span class="subtask-text">${subtask}</span>
        <input class="subtask-edit-input d-none" type="text" id="sub${index}" value="${subtask}" />
        <div class="subtask-func-btn d-none">
          <img class="subtask-edit-icon" src="./assets/icons/add_task/edit_default.svg" alt="Edit""/>
          <div class="vertical-spacer first-spacer"></div>
          <img class="subtask-delete-icon" src="./assets/icons/add_task/delete_default.svg" alt="Delete" />
          <div class="vertical-spacer second-spacer d-none"></div>
          <img class="subtask-save-icon d-none" src="./assets/icons/add_task/sub_check_def.svg" alt="Save" />
        </div>
      </li>`
    )
    .join("");
  addEditEvents();
  deleteEvent();
}
