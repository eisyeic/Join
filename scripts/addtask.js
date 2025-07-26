// clear error message when user starts typing
$("addtask-title").addEventListener("input", function () {
  this.style.borderColor = "";
  $("addtask-error").innerHTML = "";
});

// datepicker dropdown menu
let picker = flatpickr($("datepicker"), {
  minDate: "today",
  dateFormat: "d/m/Y",
});

// open date picker
$("datepicker-wrapper").addEventListener("click", () => {
  picker.open();
  $("datepicker").style.borderColor = "";
  $("due-date-error").innerHTML = "";
});

// dropdown for assigned contacts
$("assigned-select-box").addEventListener("click", function () {
  $("contact-list-box").classList.toggle("d-none");
  $("assigned-icon").classList.toggle("arrow-down");
  $("assigned-icon").classList.toggle("arrow-up");
});

// dropdown for category selection
$("category-select").addEventListener("click", function () {
  $("category-selection").classList.toggle("d-none");
  $("category-icon").classList.toggle("arrow-down");
  $("category-icon").classList.toggle("arrow-up");
});

// category selection functionality
$("category-selection")
  .querySelectorAll("li")
  .forEach((item) => {
    item.addEventListener("click", () => {
      let value = item.getAttribute("data-value");
      $("category-select").querySelector("span").textContent = value;
      $("category-selection").classList.toggle("d-none");
      $("category-icon").classList.remove("arrow-up");
      $("category-icon").classList.add("arrow-down");
    });
  });

// close dropdowns when clicking outside
document.addEventListener("click", function (event) {
  let isClickInsideCategory =
    $("category-select").contains(event.target) ||
    $("category-selection").contains(event.target);
  let isClickInsideAssigned =
    $("assigned-select-box").contains(event.target) ||
    $("contact-list-box").contains(event.target);

  if (!isClickInsideCategory) {
    $("category-selection").classList.add("d-none");
    $("category-icon").classList.remove("arrow-up");
    $("category-icon").classList.add("arrow-down");
  }

  if (!isClickInsideAssigned) {
    $("contact-list-box").classList.add("d-none");
    $("assigned-icon").classList.remove("arrow-up");
    $("assigned-icon").classList.add("arrow-down");
  }
});

// clear button functionality
$("cancel-button").addEventListener("click", function () {
  $("addtask-title").value = "";
  $("addtask-title").style.borderColor = "";
  $("addtask-error").innerHTML = "";
  $("addtask-textarea").value = "";
  $("datepicker").value = "";
  $("datepicker").style.borderColor = "";
  $("due-date-error").innerHTML = "";
  $("category-select").querySelector("span").textContent =
    "Select task category";
  subtasks = [];
  renderSubtasks();

  document
    .querySelectorAll(".priority-button")
    .forEach((btn) => btn.classList.remove("active"));
  selectedPriority = null;
});

// create button check necessary fields filled
$("create-button").addEventListener("click", function () {
  if (!$("addtask-title").value) {
    $("addtask-error").innerHTML = "This field is required";
    $("addtask-title").style.borderColor = "var(--error-color)";
  }
  if (!$("datepicker").value) {
    $("due-date-error").innerHTML = "Please select a due date";
    $("datepicker").style.borderColor = "var(--error-color)";
  }
});

// priority buttons functionality
let selectedPriority = null;

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

// subtasks list
let subtasks = [];

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

// Clear subtask input
$("sub-clear").addEventListener("click", function () {
  $("sub-input").value = "";
  $("subtask-func-btn").classList.add("d-none");
  $("subtask-plus-box").classList.remove("d-none");
});

$("sub-plus").addEventListener("click", function () {
  if (subtasks.length == "") {
    $("sub-input").value = "Contact Form";
    $("subtask-plus-box").classList.add("d-none");
    $("subtask-func-btn").classList.remove("d-none");
  }
});

// subtask list display
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

// edit subtask functionality
function addEditEvents() {
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
}

// delete subtask functionality
function deleteEvent() {
  document.querySelectorAll(".subtask-delete-icon").forEach((deleteBtn) => {
    deleteBtn.addEventListener("click", () => {
      let item = deleteBtn.closest(".subtask-item");
      let index = item.getAttribute("data-index");
      subtasks.splice(index, 1);
      renderSubtasks();
    });
  });
}

// hover effect for subtask buttons
$("subtask-list").addEventListener("mouseover", function (event) {
  let item = event.target.closest(".subtask-item");
  if (item) {
    item.querySelector(".subtask-func-btn").classList.remove("d-none");
  }
});

// leave hover effect for subtask buttons
$("subtask-list").addEventListener("mouseout", function (event) {
  let item = event.target.closest(".subtask-item");
  if (item) {
    item.querySelector(".subtask-func-btn").classList.add("d-none");
  }
});
