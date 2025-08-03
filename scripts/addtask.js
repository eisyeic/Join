
let subtasks = [];

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
  picker.open();
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
  if (!isListVisible) {
    let selectedContacts =
      $("contact-list-box").querySelectorAll("li.selected");
    if (selectedContacts.length > 0) {
      contactInitialsBox.classList.remove("d-none");
    } else {
      contactInitialsBox.classList.add("d-none");
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

// save subtask changes
document.querySelectorAll(".subtask-save-icon").forEach((saveBtn) => {
  saveBtn.addEventListener("click", () => {
    let item = saveBtn.closest(".subtask-item");
    let index = item.getAttribute("data-index");
    let input = item.querySelector(".subtask-edit-input");
    let newValue = input.value.trim();
    if (newValue) {
      subtasks[index] = newValue;
      renderSubtasks();
    }
  });
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
document.addEventListener("click", function (event) {
  // Speichern per Klick auf das Icon
  if (event.target.classList.contains("subtask-save-icon")) {
    saveEditedSubtask(event.target);
    return;
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
