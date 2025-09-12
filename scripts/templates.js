// Current contact object
let currentContact = {};

// Render the desktop contact details view into the given container
function getContactDetails(name, email, phone, colorIndex, detailSection, id) {
  detailSection.innerHTML = `
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

// Render the mobile contact details layout into the given container
function getNewLayoutDetails(name, email, phone, colorIndex, detailSection) {
  detailSection.innerHTML = ``;
  detailSection.innerHTML = `
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

// Render the Task To-do summary tile for mobile
function getMobileTaskTodo() {
  $("mobile-task-to-do").innerHTML = `
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

// Render the Task on Board summary tile for mobile
function getMobileTaskOnBoard() {
  $("mobile-task-on-board").innerHTML = `
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

// Build a standardized inline error message HTML
function getErrorMessage(message) {
  return `<p class="error-message">${message}</p>`;
}

// Template sections
function getTaskTitleSection() {
  return `<div class="addtask-main-content">
    <div>
      <input type="text" class="addtask-title" id="addtask-title" placeholder="Enter a title" autocomplete="off"/>
      <div class="addtask-error" id="addtask-error"></div>
    </div>
    <div class="description">
      <span class="label-main">Description</span>
      <span class="label-optional">(optional)</span>
      <textarea id="addtask-textarea" placeholder="Enter a description"></textarea>
    </div>
    <div class="due-date">
      <span class="label-main">Due Date</span>
      <div class="date-input" id="datepicker-wrapper">
        <input type="date" id="datepicker" />
        <span id="date-placeholder" class="date-placeholder">dd/mm/yyyy</span>
        <span id="date-display" class="date-display"></span>
        <img src="./assets/icons/add_task/event.svg" alt="Calendar Icon" />
      </div>
      <div class="addtask-error" id="due-date-error"></div>
    </div>
  </div>`;
}

function getPrioritySection() {
  return `<div class="priority-wrapper">
    <span class="label-main">Priority</span>
    <div class="prio-buttons">
      <button class="priority-button urgent-button">
        <span>Urgent</span>
        <img src="./assets/icons/add_task/urgent.svg" alt="Urgent Icon" />
      </button>
      <button class="priority-button medium-button active">
        <span>Medium</span>
        <img src="./assets/icons/add_task/medium.svg" alt="Medium Icon" />
      </button>
      <button class="priority-button low-button">
        <span>Low</span>
        <img src="./assets/icons/add_task/low.svg" alt="Low Icon" />
      </button>
    </div>
  </div>`;
}

function getAssignedSection() {
  return `<div class="assigned-box">
    <span class="label-main">Assigned to</span>
    <span class="label-optional">(optional)</span>
    <div id="assigned-select-box" class="assigned-select-box">
      <input id="contact-input" type="text" placeholder="Select contacts to assign" autocomplete="off"/>
      <img id="assigned-icon" class="arrow-down" src="./assets/icons/add_task/arrow_down_default.svg" alt="Arrow Down Icon" />
    </div>
    <div id="contact-list-box" class="contact-list-box d-none"></div>
    <div id="contact-initials" class="contact-initials d-none"></div>
  </div>`;
}

function getCategorySection() {
  return `<div class="category-box">
    <span class="label-main">Category</span>
    <div id="category-select" class="category-select-box">
      <span>Select task category</span>
      <img id="category-icon" class="arrow-down" src="./assets/icons/add_task/arrow_down_default.svg" alt="Arrow Down Icon" />
    </div>
    <div class="addtask-error" id="category-selection-error"></div>
    <div id="category-selection" class="category-selection d-none">
      <li data-value="Technical task">Technical task</li>
      <li data-value="User Story">User Story</li>
    </div>
  </div>`;
}

function getSubtaskSection() {
  return `<div class="subtask-box">
    <div>
      <span class="label-main">Subtasks</span>
      <span class="label-optional">(optional)</span>
    </div>
    <div class="subtask-select">
      <input id="sub-input" type="text" placeholder="Add new subtask" />
      <div id="subtask-func-btn" class="subtask-func-btn d-none">
        <img id="sub-clear" class="sub-clear" src="./assets/icons/add_task/sub_clear_def.svg" alt="Close Icon" />
        <div class="vertical-spacer"></div>
        <img id="sub-check" class="sub-check" src="./assets/icons/add_task/sub_check_def.svg" alt="Check Icon" />
      </div>
      <div id="subtask-plus-box" class="subtask-plus-box">
        <img id="sub-plus" src="./assets/icons/add_task/add.svg" alt="Plus Icon" />
      </div>
    </div>
    <div id="subtask-list"></div>
  </div>`;
}

// Return the full Add-Task form markup
function getAddtaskTemplate() {
  return getTaskTitleSection() + getPrioritySection() + getAssignedSection() + getCategorySection() + getSubtaskSection();
}

// Build the contact dropdown option template used in Assigned to
function createContactListItemTemplate(contact, id) {
  return `
    <div>
      <div class="contact-initial" style="background-image: url(./assets/general_elements/icons/color${contact.colorIndex}.svg)">
        ${contact.initials}
      </div>
      ${contact.name}
    </div>
    <img src="./assets/icons/add_task/check_default.svg" alt="checkbox" />
  `;
}







