import { renderSubtasks } from "./templates.js";

export let subtasks = [];

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
  subtasks = [];
  renderSubtasks();
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

// edit subtask functionality
export function addEditEvents() {
  document.querySelectorAll(".subtask-edit-icon").forEach((editBtn) => {
    editBtn.addEventListener("click", () => {
      let item = editBtn.closest(".subtask-item");
      let input = item.querySelector(".subtask-edit-input");
      let firstSpacer = item.querySelector(".first-spacer");
      let secondSpacer = item.querySelector(".second-spacer");
      item.querySelector(".subtask-text").classList.add("d-none");
      input.classList.remove("d-none");
      input.classList.add("active");
      input.focus();
      input.select();
      item.classList.add("editing");
      firstSpacer.classList.add("d-none");
      secondSpacer.classList.remove("d-none");
      item.querySelector(".subtask-edit-icon").classList.add("d-none");
      item.querySelector(".subtask-save-icon").classList.remove("d-none");
    });
  });
}

// delete subtask functionality
export function deleteEvent() {
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

// priority buttons functionality
export let selectedPriority = "medium";
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