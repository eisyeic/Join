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
function renderSubtasks() {
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

function getEditTaskBoardTemplate(task) {
  $("task-overlay-content").innerHTML = /*html*/ `
      <div class="edit-task-content">
        <div class="addtask-main-content">
          <div>
            <input type="text" class="addtask-title" id="edit-task-title" value="${task?.title || ''}" placeholder="Enter a title" />
            <div class="addtask-error" id="edit-title-error"></div>
          </div>
          
          <div class="description">
            <span class="label-main">Description</span>
            <span class="label-optional">(optional)</span>
            <textarea id="edit-task-textarea" placeholder="Enter a description">${task?.description || ''}</textarea>
          </div>
          
          <div class="due-date">
            <span class="label-main">Due Date</span>
            <div class="date-input" onclick="document.querySelector('#edit-datepicker')._flatpickr?.open()">
              <input type="text" id="edit-datepicker" value="${task?.dueDate || ''}" placeholder="dd/mm/yyyy" />
              <img src="./assets/icons/add_task/event.svg" alt="Calendar Icon" />
            </div>
            <div class="addtask-error" id="edit-due-date-error"></div>
          </div>
        </div>
        
        <div class="priority-wrapper">
          <span class="label-main">Priority</span>
          <div class="prio-buttons">
            <button class="priority-button urgent-button ${task?.priority === 'urgent' ? 'active' : ''}" data-priority="urgent">
              <span>Urgent</span>
              <img src="./assets/icons/add_task/urgent.svg" alt="Urgent Icon" />
            </button>
            <button class="priority-button medium-button ${task?.priority === 'medium' ? 'active' : ''}" data-priority="medium">
              <span>Medium</span>
              <img src="./assets/icons/add_task/medium.svg" alt="Medium Icon" />
            </button>
            <button class="priority-button low-button ${task?.priority === 'low' ? 'active' : ''}" data-priority="low">
              <span>Low</span>
              <img src="./assets/icons/add_task/low.svg" alt="Low Icon" />
            </button>
          </div>
        </div>
        
        <div class="assigned-box">
          <span class="label-main">Assigned to</span>
          <span class="label-optional">(optional)</span>
          <div id="edit-assigned-select-box" class="assigned-select-box">
            <input id="edit-contact-input" type="text" placeholder="Select contacts to assign" />
            <img id="edit-assigned-icon" class="arrow-down" src="./assets/icons/add_task/arrow_down_default.svg" alt="Arrow Down Icon" />
          </div>
          <div id="edit-contact-list-box" class="contact-list-box d-none"></div>
        </div>
        
        <div class="category-box">
          <span class="label-main">Category</span>
          <div id="edit-category-select" class="category-select-box">
            <span>${task?.category || 'Select task category'}</span>
            <img id="edit-category-icon" class="arrow-down" src="./assets/icons/add_task/arrow_down_default.svg" alt="Arrow Down Icon" />
          </div>
          <div class="addtask-error" id="edit-category-selection-error"></div>
          <div id="edit-category-selection" class="category-selection d-none">
            <li data-value="Technical task">Technical task</li>
            <li data-value="User Story">User Story</li>
          </div>
        </div>
        
        <div class="subtask-box">
          <div>
            <span class="label-main">Subtasks</span>
            <span class="label-optional">(optional)</span>
          </div>
          <div class="subtask-select">
            <input id="edit-sub-input" type="text" placeholder="Add new subtask" />
            <div id="edit-subtask-func-btn" class="subtask-func-btn d-none">
              <img id="edit-sub-clear" class="sub-clear" src="./assets/icons/add_task/sub_clear_def.svg" alt="Close Icon" />
              <div class="vertical-spacer"></div>
              <img id="edit-sub-check" class="sub-check" src="./assets/icons/add_task/sub_check_def.svg" alt="Check Icon" />
            </div>
            <div id="edit-subtask-plus-box" class="subtask-plus-box">
              <img id="edit-sub-plus" src="./assets/icons/add_task/add.svg" alt="Plus Icon" />
            </div>
          </div>
          <div id="edit-subtask-list">${renderEditSubtasks(task?.subtasks || [])}</div>
        </div>
      </div>
      
      <div class="edit-task-buttons">
        <div class="add-task-button">
          <div class="save-button base-button button-blue button-regular" onclick="saveEditedTask()">
            OK
            <img src="./assets/icons/add_task/check.svg" alt="Save Icon" />
          </div>
        </div>
      </div>
    </div>
  `;
  setupEditPriorityButtons();
  setupEditDatePicker();
  setupEditCategoryDropdown();
  setupEditSubtasks();
  setupEditAssignedContacts();
}

function setupEditPriorityButtons() {
  document.querySelectorAll('.priority-button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.priority-button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

function setupEditDatePicker() {
  if (typeof flatpickr !== 'undefined') {
    flatpickr('#edit-datepicker', {
      dateFormat: 'd/m/Y',
      minDate: 'today'
    });
  }
  
  const dateInput = document.querySelector('.date-input');
  if (dateInput) {
    dateInput.addEventListener('click', () => {
      const datePicker = document.querySelector('#edit-datepicker');
      if (datePicker && datePicker._flatpickr) {
        datePicker._flatpickr.open();
      }
    });
  }
}

function setupEditCategoryDropdown() {
  const categorySelect = $("edit-category-select");
  const categorySelection = $("edit-category-selection");
  const categoryIcon = $("edit-category-icon");
  
  categorySelect.addEventListener('click', () => {
    categorySelection.classList.toggle('d-none');
    categoryIcon.style.transform = categorySelection.classList.contains('d-none') ? 'rotate(0deg)' : 'rotate(180deg)';
  });
  
  categorySelection.querySelectorAll('li').forEach(item => {
    item.addEventListener('click', () => {
      categorySelect.querySelector('span').textContent = item.textContent;
      categorySelection.classList.add('d-none');
      categoryIcon.style.transform = 'rotate(0deg)';
    });
  });
}

function setupEditSubtasks() {
  const subInput = $("edit-sub-input");
  const subPlus = $("edit-sub-plus");
  const subCheck = $("edit-sub-check");
  const subClear = $("edit-sub-clear");
  const funcBtn = $("edit-subtask-func-btn");
  const plusBox = $("edit-subtask-plus-box");
  
  subInput.addEventListener('input', () => {
    if (subInput.value.trim()) {
      funcBtn.classList.remove('d-none');
      plusBox.classList.add('d-none');
    } else {
      funcBtn.classList.add('d-none');
      plusBox.classList.remove('d-none');
    }
  });
  
  subCheck.addEventListener('click', () => {
    if (subInput.value.trim()) {
      addEditSubtask(subInput.value.trim());
      subInput.value = '';
      funcBtn.classList.add('d-none');
      plusBox.classList.remove('d-none');
    }
  });
  
  subClear.addEventListener('click', () => {
    subInput.value = '';
    funcBtn.classList.add('d-none');
    plusBox.classList.remove('d-none');
  });
}

function addEditSubtask(name) {
  const subtaskList = $("edit-subtask-list");
  const index = subtaskList.children.length;
  const li = document.createElement('li');
  li.className = 'subtask-item';
  li.dataset.index = index;
  li.innerHTML = `
    <span class="subtask-text">${name}</span>
    <input class="subtask-edit-input d-none" type="text" value="${name}" />
    <div class="subtask-func-btn d-none">
      <img class="subtask-edit-icon" src="./assets/icons/add_task/edit_default.svg" alt="Edit"/>
      <div class="vertical-spacer first-spacer"></div>
      <img class="subtask-delete-icon" src="./assets/icons/add_task/delete_default.svg" alt="Delete" />
    </div>
  `;
  subtaskList.appendChild(li);
}



function renderEditSubtasks(subtasks) {
  return subtasks.map((subtask, index) => {
    const name = typeof subtask === 'string' ? subtask : subtask.name;
    return `
      <li class="subtask-item" data-index="${index}">
        <span class="subtask-text">${name}</span>
        <input class="subtask-edit-input d-none" type="text" id="edit-sub${index}" value="${name}" />
        <div class="subtask-func-btn d-none">
          <img class="subtask-edit-icon" src="./assets/icons/add_task/edit_default.svg" alt="Edit"/>
          <div class="vertical-spacer first-spacer"></div>
          <img class="subtask-delete-icon" src="./assets/icons/add_task/delete_default.svg" alt="Delete" />
          <div class="vertical-spacer second-spacer d-none"></div>
          <img class="subtask-save-icon d-none" src="./assets/icons/add_task/sub_check_def.svg" alt="Save" />
        </div>
      </li>`;
  }).join('');
}

function renderEditAssignedContacts(assignedTo) {
  if (!assignedTo || assignedTo.length === 0) return '';
  return assignedTo.map(contact => {
    const initials = contact.initials || contact.name?.substring(0, 2).toUpperCase() || 'XX';
    return `<div class="contact-initial">${initials}</div>`;
  }).join('');
}

function setupEditAssignedContacts() {
  const assignedSelectBox = $("edit-assigned-select-box");
  const contactListBox = $("edit-contact-list-box");
  const assignedIcon = $("edit-assigned-icon");
  const contactInitials = $("edit-contact-initials"); // may be null

  // ... your sample contacts setup ...

  if (assignedIcon) {
    assignedIcon.addEventListener('click', function(e) {
      e.stopPropagation();
      contactListBox.classList.toggle('d-none');
      const isListVisible = !contactListBox.classList.contains('d-none');
      if (!isListVisible && contactInitials) {
        const selectedContacts = contactListBox.querySelectorAll('li.selected');
        contactInitials.classList.toggle('d-none', selectedContacts.length === 0);
      } else if (contactInitials) {
        contactInitials.classList.add('d-none');
      }
    });
  }

  // ... search listeners unchanged ...

  contactListBox.addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (!li) return;
    e.stopPropagation();
    const img = li.querySelector('img');
    li.classList.toggle('selected');
    img.src = li.classList.contains('selected')
      ? './assets/icons/add_task/check_white.svg'
      : './assets/icons/add_task/check_default.svg';
    updateEditContactInitials();
  });

  function updateEditContactInitials() {
    if (!contactInitials) return;
    const selectedContacts = contactListBox.querySelectorAll('li.selected');
    if (selectedContacts.length > 0) {
      contactInitials.innerHTML = Array.from(selectedContacts).map(li => {
        const initial = li.querySelector('.contact-initial');
        return initial ? initial.outerHTML : '';
      }).join('');
      contactInitials.classList.remove('d-none');
    } else {
      contactInitials.innerHTML = '';
      contactInitials.classList.add('d-none');
    }
  }

  document.addEventListener('click', (event) => {
    if (!assignedSelectBox.contains(event.target) && !contactListBox.contains(event.target)) {
      contactListBox.classList.add('d-none');
      if (contactInitials) {
        const selectedContacts = contactListBox.querySelectorAll('li.selected');
        contactInitials.classList.toggle('d-none', selectedContacts.length === 0);
      }
    }
  });
}