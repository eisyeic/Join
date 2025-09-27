function getMobileTaskTodo() {
  document.getElementById("mobile-task-to-do").innerHTML = /*html*/ `
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

function getMobileTaskOnBoard() {
  document.getElementById("mobile-task-on-board").innerHTML = /*html*/ `
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

function getTaskMainTemplate() {
  return `
    <!-- task title -->
    <div class="addtask-main-content">
      <div>
        <input type="text" class="addtask-title" id="addtask-title" placeholder="Enter a title" autocomplete="off"/>
        <div class="addtask-error" id="addtask-error"></div>
      </div>
      <!-- description -->
      <div class="description">
        <span class="label-main">Description</span>
        <span class="label-optional">(optional)</span>
        <textarea id="addtask-textarea" placeholder="Enter a description"></textarea>
      </div>
      <!-- date choose -->
      <div class="due-date">
        <span class="label-main">Due Date</span>
        <div class="date-input" id="datepicker-wrapper" data-placeholder="dd.mm.yyyy">
          <input type="date" id="datepicker" required/>
        </div>
        <div class="addtask-error" id="due-date-error"></div>
      </div>
    </div>
  `;
}

function getPriorityTemplate() {
  return `
    <!-- priority choose -->
    <div class="priority-wrapper">
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
    </div>
  `;
}

function getAssignedTemplate() {
  return `
    <!-- assigned container -->
    <div class="assigned-box">
      <span class="label-main">Assigned to</span>
      <span class="label-optional">(optional)</span>
      <div id="assigned-select-box" class="assigned-select-box">
        <input id="contact-input" type="text" placeholder="Select contacts to assign" autocomplete="off"/>
        <img id="assigned-icon" class="arrow-down" src="./assets/icons/add_task/arrow_down_default.svg" alt="Arrow Down Icon" />
      </div>
      <div id="contact-list-box" class="contact-list-box d-none">
        <!-- contacts template -->
        <li>
          <div>
            <div class="contact-initial">AS</div>
            Anja Schulze
          </div>
          <img class="contact-initials-checkbox" src="./assets/icons/add_task/check_default.svg" alt="Check Box" />
        </li>
      </div>
      <!-- initials under select contact-box -->
      <div id="contact-initials" class="contact-initials d-none"></div>
    </div>
  `;
}

function getCategoryTemplate() {
  return `
    <!-- category container -->
    <div class="category-box">
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
    </div>
  `;
}

function getSubtasksTemplate() {
  return `
    <!-- subtask container -->
    <div class="subtask-box">
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
    </div>
  `;
}

function getSubtaskItemTemplate(subtask, index) {
  return `
      <li class="subtask-item" data-index="${index}">
        <span class="subtask-text">${subtask}</span>
        <input class="subtask-edit-input d-none" type="text" id="sub${index}" value="${subtask}" />
        <div class="subtask-func-btn d-none">
          <img class="subtask-edit-icon" src="./assets/icons/add_task/edit_default.svg" alt="Edit"/>
          <div class="vertical-spacer first-spacer"></div>
          <img class="subtask-delete-icon" src="./assets/icons/add_task/delete_default.svg" alt="Delete" />
          <div class="vertical-spacer second-spacer d-none"></div>
          <img class="subtask-save-icon d-none" src="./assets/icons/add_task/sub_check_def.svg" alt="Save" />
        </div>
      </li>`;
}