// Get Contact Person
function getContactPerson(key, id) {
  let savedColorIndex = key.colorIndex;
  if (!savedColorIndex) {
    savedColorIndex = (id.charCodeAt(0) % 15) + 1;
  }

  const initials = key.initials || getInitials(key.name);

  return /*html*/ `
        <div class="contact-placeholder">
            <img src="./assets/contacts/img/Vector 10.svg" />
        </div>
        <div class="contact-person" onclick="showContactDetails('${key.name}', '${key.email}', '${key.phone}', ${savedColorIndex}, '${id}')">
            <div class="contact-person-icon">
                <img src="./assets/general_elements/icons/color${savedColorIndex}.svg" />
                <p>${initials}</p>
            </div>
            <div class="contact-person-name">
                <h5>${key.name}</h5>
                <a>${key.email}</a>
            </div>
        </div>`;
}

let currentContact = {};

// Get Contact Details
function getContactDetails(name, email, phone, colorIndex, detailSection) {
  detailSection.innerHTML = /*html*/ `
        <div class="contact-single-person-content-head">
            <div class="contact-person-icon-big">
                <img src="./assets/general_elements/icons/color${colorIndex}.svg" />
                <h3>${getInitials(name)}</h3>
            </div>
            <div class="contact-single-person-content-head-name">
                <h3>${name}</h3>
                <div class="contact-single-person-content-head-edit-container">
                    <div class="contact-single-person-content-head-edit-box" onclick="openEditContact()">
                        <img class="regular-image" src="./assets/contacts/icons/pen_thin.svg" />
                        <p>Edit</p>
                    </div>
                    <div class="contact-single-person-content-head-trash-box" onclick="deleteContact()">
                        <img class="regular-image" src="./assets/contacts/icons/trash_thin.svg" />
                        <p>Delete</p>
                    </div>
                </div>
            </div>
        </div>
        <div class="contact-single-person-content-info">
            <h4>Contact Information</h4>
            <h6>Email</h6>
            <a>${email}</a>
            <h6>Phone</h6>
            <span>${phone}</span>
        </div>`;
}

// Get New Layout Details
function getNewLayoutDetails(name, email, phone, colorIndex, detailSection) {
  detailSection.innerHTML = ``;
  detailSection.innerHTML = /*html*/ `
    <div class="contact-single-person-content-mobile-headline">
        <h5>Contact Information</h5>
        <a class="help-a-tag-back-button" onclick="detailsMobileBack()">
            <img src="./assets/general_elements/icons/arrow_left.svg">
        </a>
    </div>
    <div class="contact-single-person-content-head">
        <div class="contact-person-icon-big">
            <img src="./assets/general_elements/icons/color${colorIndex}.svg" />
            <h3>${getInitials(name)}</h3>
        </div>
        <div class="contact-single-person-content-head-name">
            <h4>${name}</h4>
        </div>
    </div>
    <div class="contact-single-person-content-info">
        <h6>Email</h6>
        <a>${email}</a>
        <h6>Phone</h6>
        <span>${phone}</span>
    </div>
    <div class="single-person-content-mobile-bottom" onclick="addDetailsMobileNavbar(), removeDetailsMobileNavbar(event)">
        <div class="white-point"></div>
        <div class="white-point"></div>
        <div class="white-point"></div>
    </div>
    <div class="single-person-content-mobile-navbar d-none" id="single-person-content-mobile-navbar" onclick="removeDetailsMobileNavbar(event)">
        <div class="single-person-content-mobile-navbar-content" onclick="openEditContact()">
            <img src="./assets/contacts/icons/pen_thin.svg" alt="Edit Icon">
            <p>Edit</p>
        </div>
        <div class="single-person-content-mobile-navbar-content" onclick="deleteContactAndGoBack(event)">
            <img src="./assets/contacts/icons/trash_thin.svg" alt="Delete Icon">
            <p>Delete</p>
        </div>
    </div>
    `;
}

// Get Mobile Task Todo
function getMobileTaskTodo() {
  $("mobile-task-to-do").innerHTML = /*html*/ `
    <div class="task-tile-todo" onclick="location.href='board.html'" id="task-tile-todo">
            <div class="task-tile-todo-content">
              <div class="task-tile-icon-container">
                <img src="./assets/summary/icons/todo.svg" alt="Icon Task Todo" />
                <svg viewBox="0 0 300 300">
                  <circle cx="150" cy="150" r="140" fill="none" stroke="white" stroke-width="10" />
                </svg>
              </div>
              <h2>1</h2>
            </div>
            <h5>Task To-do</h5>
          </div>`;
}

// Get Mobile Task On Board
function getMobileTaskOnBoard() {
  $("mobile-task-on-board").innerHTML = /*html*/ `
    <div class="task-tile-board-overview" onclick="location.href='board.html'" id="task-tile-board-overview">
            <div class="task-tile-board-overview-content">
              <div class="task-tile-icon-container">
                <img src="./assets/summary/icons/default.svg" alt="Icon Task in Board" />
                <svg viewBox="0 0 300 300">
                  <circle cx="150" cy="150" r="140" fill="none" stroke="white" stroke-width="10" />
                </svg>
              </div>
              <h2>5</h2>
            </div>
            <h5>Task on Board</h5>
          </div>`;
}

// Get Error Message
function getErrorMessage(message) {
  return /*html*/ `<p class="error-message">${message}</p>`;
}


// addtask subtasks list display
import { subtasks, addEditEvents, deleteEvent } from "./addtask.js";
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
