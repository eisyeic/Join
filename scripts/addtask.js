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
  }
});

// Clear subtask input
$("sub-clear").addEventListener("click", function () {
  $("sub-input").value = "";
  $("subtask-func-btn").classList.add("d-none");
  $("subtask-plus-box").classList.remove("d-none");
});

// subtask list display
$("sub-plus").addEventListener("click", function () {
  $("subtask-list").innerHTML = subtasks
    .map((subtask, index) => `<div class="subtask-item">${subtask} <span class="remove-subtask" data-index="${index}">x</span></div>`)
    .join("");
});