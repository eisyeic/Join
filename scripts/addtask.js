let subtasks = [];

// Waits for element to appear in DOM
function waitForElementById(id, timeout = 8000) {
  return new Promise((resolve, reject) => {
    const elNow = $(id);
    if (elNow) return resolve(elNow);
    const obs = createElementObserver(id, resolve);
    obs.observe(document.documentElement, { childList: true, subtree: true });
    if (timeout) setupTimeout(id, resolve, reject, obs, timeout);
  });
}

// Creates mutation observer for element waiting
function createElementObserver(id, resolve) {
  return new MutationObserver((mutations, obs) => {
    const el = $(id);
    if (el) { obs.disconnect(); resolve(el); }
  });
}

// Sets up timeout for element waiting
function setupTimeout(id, resolve, reject, obs, timeout) {
  setTimeout(() => {
    obs.disconnect();
    const el = $(id);
    if (el) resolve(el); else reject(new Error('waitForElementById timeout: #' + id));
  }, timeout);
}

// Initializes add task contacts functionality
async function initAddTaskContacts() {
  try {
    await waitForElementById('contact-list-box');
    window.loadContactsAndRender();
  } catch (_) {}
  bindContactInput();
}

// Binds contact input event handler
async function bindContactInput() {
  const input = await waitForElementById('contact-input', 2000).catch(() => null);
  if (input && !input._bound) {
    input._bound = true;
    input.addEventListener('input', contactInputHandler);
  }
}

// Handles contact input search functionality
function contactInputHandler(e) {
  const value = (e?.target?.value || '').trim().toLowerCase();
  const box = $("contact-list-box");
  if (!box) return;
  
  box.classList.remove('d-none');
  const filtered = filterContacts(value);
  box.innerHTML = '';
  renderContacts(filtered, box);
}

// Filters contacts based on search value
function filterContacts(value) {
  if (!value) return { ...window.loadedContacts };
  
  const filtered = {};
  for (let id in window.loadedContacts) {
    const contact = window.loadedContacts[id];
    const nameParts = (contact?.name || '').trim().toLowerCase().split(' ');
    if (nameParts.some(part => part.startsWith(value))) {
      filtered[id] = contact;
    }
  }
  return filtered;
}

// Renders contacts in container
function renderContacts(contacts, container) {
  container.innerHTML = "";
  for (let id in contacts) {
    let contact = contacts[id]; 
    let li = createContactListItem(contact, id);
    container.appendChild(li);
  }
}

// Creates contact list item element
function createContactListItem(contact, id) {
  let li = document.createElement("li");
  li.id = id;
  li.innerHTML = createContactListItemTemplate(contact, id);
  addContactListItemListener(li);
  return li;
}

// Adds click event listener to contact list item
function addContactListItemListener(li) {
  li.addEventListener("click", () => {
    li.classList.toggle("selected");
    updateCheckboxIcon(li);
    renderSelectedContactInitials();
  });
}

// Updates checkbox icon based on selection state
function updateCheckboxIcon(li) {
  const checkboxIcon = li.querySelector("img");
  const isSelected = li.classList.contains("selected");
  checkboxIcon.src = isSelected
    ? "./assets/icons/add_task/check_white.svg"
    : "./assets/icons/add_task/check_default.svg";
}

// Renders selected contact initials
function renderSelectedContactInitials() {
  const selectedLis = document.querySelectorAll("#contact-list-box li.selected");
  const contactInitialsBox = $("contact-initials");
  if (!contactInitialsBox) return;
  
  contactInitialsBox.innerHTML = "";
  const initialsToShow = Array.from(selectedLis).slice(0, 3);
  initialsToShow.forEach(li => {
    const initialsEl = li.querySelector(".contact-initial");
    if (initialsEl) {
      contactInitialsBox.appendChild(initialsEl.cloneNode(true));
    }
  });
}

// Collects form data for task creation
function collectFormData() {
  return {
    column: "todo",
    title: $("addtask-title").value.trim(),
    description: $("addtask-textarea").value.trim(),
    dueDate: $("datepicker").value.trim(),
    category: $("category-select").querySelector("span").textContent,
    priority: selectedPriority,
    assignedContacts: getSelectedContacts(),
    subtasks: subtasks.map(name => ({ name, checked: false }))
  };
}

// Gets selected contacts data
function getSelectedContacts() {
  return Array.from(document.querySelectorAll("#contact-list-box li.selected"))
    .map(li => {
      const contact = window.loadedContacts[li.id];
      return {
        id: li.id,
        name: contact.name,
        colorIndex: contact.colorIndex,
        initials: contact.initials
      };
    });
}

// Validates form data for task creation
function validateFormData(data) {
  clearValidationErrors();
  let valid = true;
  
  if (!data.title) valid = setFieldError("addtask", "This field is required");
  if (!data.dueDate) valid = setFieldError("due-date", "Please select a due date");
  if (data.category === "Select task category") {
    valid = setFieldError("category-selection", "Please choose category");
  }
  if (!data.priority) valid = false;
  
  return valid;
}

// Clears all validation error messages
function clearValidationErrors() {
  $("addtask-error").innerHTML = "";
  $("due-date-error").innerHTML = "";
  $("category-selection-error").innerHTML = "";
}

// Sets field error message and styling
function setFieldError(fieldType, message) {
  const errorMap = {
    "addtask": { error: "addtask-error", field: "addtask-title" },
    "due-date": { error: "due-date-error", field: "datepicker-wrapper" },
    "category-selection": { error: "category-selection-error", field: "category-select" }
  };
  
  const config = errorMap[fieldType];
  $(config.error).innerHTML = message;
  $(config.field).style.borderColor = "var(--error-color)";
  return false;
}

// Handles create button click event
function handleCreateClick() {
  const taskData = collectFormData();
  const isValid = validateFormData(taskData);
  if (!isValid) return;
  
  window.sendTaskToFirebase(taskData);
  if (!window.location.pathname.endsWith("addtask.html")) {
    window.toggleAddTaskBoard();
  }
}

// Handles successful task save
function handleTaskSaveSuccess() {
  showSuccessBanner();
  setTimeout(() => {
    hideSuccessBanner();
    $("cancel-button").click();
    redirectToBoardIfNeeded();
  }, 1200);
}

// Shows success banner
function showSuccessBanner() {
  const layout = $("layout");
  const slideInBanner = $("slide-in-banner");
  if (layout) layout.style.opacity = "0.3";
  if (slideInBanner) slideInBanner.classList.add("visible");
}

// Hides success banner
function hideSuccessBanner() {
  const layout = $("layout");
  const slideInBanner = $("slide-in-banner");
  if (slideInBanner) slideInBanner.classList.remove("visible");
  if (layout) layout.style.opacity = "1";
}

// Redirects to board if not already there
function redirectToBoardIfNeeded() {
  if (!window.location.pathname.endsWith("board.html")) {
    window.location.href = "./board.html";
  }
}

// Initialize contacts when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAddTaskContacts);
} else {
  initAddTaskContacts();
}

// Immediately bind contact input if already present
(() => {
  const ci = $("contact-input");
  if (ci && !ci._bound) { 
    ci._bound = true; 
    ci.addEventListener('input', contactInputHandler); 
  }
})();

// Export functions to window for Firebase module
window.renderContacts = renderContacts;
window.handleTaskSaveSuccess = handleTaskSaveSuccess;

// datepicker dropdown menu
let picker = flatpickr("#datepicker", {
  minDate: "today",
  dateFormat: "d/m/Y",
  onChange: function (dateStr) {
    if (dateStr) {
      $("datepicker-wrapper").style.borderColor = "";
      $("due-date-error").innerHTML = "";
    }
  },
});

// open date picker
$("datepicker-wrapper").addEventListener("click", function () {
  document.querySelector("#datepicker").click();
});

// priority buttons functionality
let selectedPriority = "medium";
document.querySelectorAll(".priority-button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".priority-button").forEach((btn) => {
      btn.classList.remove("active");
    });
    button.classList.add("active");
    selectedPriority = button.classList.contains("urgent-button")
      ? "urgent"
      : button.classList.contains("medium-button")
      ? "medium"
      : "low";
  });
});

// reset priority selection
function resetPrioritySelection() {
  document
    .querySelectorAll(".priority-button")
    .forEach((btn) => btn.classList.remove("active"));
  selectedPriority = "medium";
  const mediumButton = document.querySelector(".medium-button");
  if (mediumButton) {
    mediumButton.classList.add("active");
  }
}

// dropdown for assigned contacts
let contactInitialsBox = document.querySelector(".contact-initials");
$("assigned-select-box").addEventListener("click", function () {
  $("contact-list-box").classList.toggle("d-none");
  let isListVisible = !$("contact-list-box").classList.contains("d-none");
  $("assigned-icon").classList.add("arrow-up");
  $("assigned-icon").classList.remove("arrow-down");
  if (!isListVisible) {
    let selectedContacts =
      $("contact-list-box").querySelectorAll("li.selected");
    if (selectedContacts.length > 0) {
      contactInitialsBox.classList.remove("d-none");
    } else {
      contactInitialsBox.classList.add("d-none");
      $("assigned-icon").classList.remove("arrow-up");
      $("assigned-icon").classList.add("arrow-down");
    }
  } else {
    contactInitialsBox.classList.add("d-none");
  }
});

// category selection functionality
$("category-selection")
  .querySelectorAll("li")
  .forEach((item) => {
    item.addEventListener("click", () => {
      let value = item.getAttribute("data-value");
      $("category-select").querySelector("span").textContent = value;
      $("category-selection").classList.add("d-none");
      $("category-icon").classList.remove("arrow-up");
      $("category-icon").classList.add("arrow-down");
      $("category-select").style.borderColor = "";
      $("category-selection-error").innerHTML = "";
    });
  });

// Main event listener to close dropdowns when clicking outside
document.addEventListener("click", (event) => {
  handleCategoryClickOutside(event);
  handleAssignedClickOutside(event);
});

// Checks if the click was outside the category dropdown and closes it
function handleCategoryClickOutside(event) {
  let isClickInsideCategory =
    $("category-select").contains(event.target) ||
    $("category-selection").contains(event.target);
  if (!isClickInsideCategory) {
    $("category-selection").classList.add("d-none");
    $("category-icon").classList.remove("arrow-up");
    $("category-icon").classList.add("arrow-down");
  }
}

// Checks if the click was outside the assigned contacts dropdown and closes it
function handleAssignedClickOutside(event) {
  let isClickInsideAssigned =
    $("assigned-select-box").contains(event.target) ||
    $("contact-list-box").contains(event.target);
  if (!isClickInsideAssigned) {
    $("contact-list-box").classList.add("d-none");
    let selectedContacts = document.querySelectorAll(
      "#contact-list-box li.selected"
    );
    if (selectedContacts.length > 0) {
      $("contact-initials").classList.remove("d-none");
    } else {
      $("contact-initials").classList.add("d-none");
    }
    $("assigned-icon").classList.remove("arrow-up");
    $("assigned-icon").classList.add("arrow-down");
  }
}

// dropdown for category selection
$("category-select").addEventListener("click", function () {
  $("category-selection").classList.toggle("d-none");
  $("category-icon").classList.toggle("arrow-down");
  $("category-icon").classList.toggle("arrow-up");
});

// subtasks functionality
$("sub-input").addEventListener("input", function () {
  if (this.value !== "") {
    $("subtask-plus-box").classList.add("d-none");
    $("subtask-func-btn").classList.remove("d-none");
  } else {
    $("subtask-plus-box").classList.remove("d-none");
    $("subtask-func-btn").classList.add("d-none");
  }
});

// hover effect for subtask buttons
$("subtask-list").addEventListener("mouseover", (event) => {
  let item = event.target.closest(".subtask-item");
  if (item) {
    item.querySelector(".subtask-func-btn").classList.remove("d-none");
  }
});

// leave hover effect for subtask buttons
$("subtask-list").addEventListener("mouseout", (event) => {
  let item = event.target.closest(".subtask-item");
  if (item) {
    item.querySelector(".subtask-func-btn").classList.add("d-none");
  }
});

// clear error message when user starts typing
$("addtask-title").addEventListener("input", function () {
  this.style.borderColor = "";
  $("addtask-error").innerHTML = "";
});

// Create button event listener
$("create-button").addEventListener("click", handleCreateClick);

// clear button functionality
$("cancel-button").addEventListener("click", function () {
  $("addtask-title").value = "";
  $("addtask-title").style.borderColor = "";
  $("addtask-error").innerHTML = "";
  $("addtask-textarea").value = "";
  $("datepicker").value = "";
  $("datepicker-wrapper").style.borderColor = "";
  $("due-date-error").innerHTML = "";
  $("category-select").querySelector("span").textContent =
    "Select task category";
  $("category-select").style.borderColor = "";
  $("category-selection-error").innerHTML = "";
  renderSubtasks({subtasks});
  clearAssignedContacts();
  resetPrioritySelection();
});

// clear assigned contacts
function clearAssignedContacts() {
  document.querySelectorAll("#contact-list-box li.selected").forEach((li) => {
    li.classList.remove("selected");
    let checkboxIcon = li.querySelectorAll("img")[0];
    checkboxIcon.src = "./assets/icons/add_task/check_default.svg";
  });
  contactInitialsBox.classList.add("d-none");
  contactInitialsBox.innerHTML = "";
}

// edit subtask functionality

function addEditEvents() {
  document.querySelectorAll(".subtask-edit-icon").forEach((editBtn) => {
    editBtn.addEventListener("click", () => enterEditMode(editBtn));
  });
}

// enter sub edit mode
function enterEditMode(editBtn) {
  const item = editBtn.closest(".subtask-item");
  const input = item.querySelector(".subtask-edit-input");
  showEditFields(item, input);
  setupEnterKeyToSave(input, item);
}

// show edit inputs 
function showEditFields(item, input) {
  item.querySelector(".subtask-text").classList.add("d-none");
  input.classList.remove("d-none");
  input.classList.add("active");
  input.focus();
  input.select();
  item.classList.add("editing");
  item.querySelector(".first-spacer").classList.add("d-none");
  item.querySelector(".second-spacer").classList.remove("d-none");
  item.querySelector(".subtask-edit-icon").classList.add("d-none");
  item.querySelector(".subtask-save-icon").classList.remove("d-none");
}

// enter keydown sublist event function
function setupEnterKeyToSave(input, item) {
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const saveBtn = item.querySelector(".subtask-save-icon");
      if (saveBtn) saveEditedSubtask(saveBtn);
    }
  }, { once: true }); 
}


// add subtask to the list
$("sub-check").addEventListener("click", function () {
  let subtaskText = $("sub-input").value.trim();
  if (subtaskText) {
    subtasks.push(subtaskText);
    $("sub-input").value = "";
    $("subtask-func-btn").classList.add("d-none");
    $("subtask-plus-box").classList.remove("d-none");
    renderSubtasks();
  }
});


// enter keydown new subitem add
$("sub-input").addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    let subtaskText = this.value.trim();
    if (subtaskText) {
      subtasks.push(subtaskText);
      this.value = "";
      $("subtask-func-btn").classList.add("d-none");
      $("subtask-plus-box").classList.remove("d-none");
      renderSubtasks();
    }
  }
});

// subtask delete functionality
function deleteEvent() {
  document.querySelectorAll(".subtask-delete-icon").forEach((deleteBtn) => {
    deleteBtn.addEventListener("click", () => {
      let item = deleteBtn.closest(".subtask-item");
      let index = item.getAttribute("data-index");
      subtasks.splice(index, 1);
      renderSubtasks();
      addEditEvents();
    });
  });
}

// Clear subtask input
$("sub-clear").addEventListener("click", function () {
  $("sub-input").value = "";
  $("subtask-func-btn").classList.add("d-none");
  $("subtask-plus-box").classList.remove("d-none");
});

// add subtask by default
$("sub-plus").addEventListener("click", function () {
  if (subtasks.length === 0) {
    $("sub-input").value = "Contact Form";
    $("subtask-plus-box").classList.add("d-none");
    $("subtask-func-btn").classList.remove("d-none");
  }
});


// sub save button functionality
function saveEditedSubtask(saveBtn) {
  let item = saveBtn.closest(".subtask-item");
  let index = item.getAttribute("data-index");
  let input = item.querySelector(".subtask-edit-input");
  let newValue = input.value.trim();
  if (newValue) {
    subtasks[index] = newValue;
    renderSubtasks();
    addEditEvents();
  }
}

// sub save by click button
$("subtask-list").addEventListener("click", (event) => {
  if (event.target.classList.contains("subtask-save-icon")) {
    saveEditedSubtask(event.target);
  }
});


// sub save by click outside
document.addEventListener("click", function (event) {
  document.querySelectorAll(".subtask-item.editing").forEach((subtaskItem) => {
    if (!subtaskItem.contains(event.target)) {
      let saveBtn = subtaskItem.querySelector(".subtask-save-icon");
      saveEditedSubtask(saveBtn);
    }
  });
});