// clear error message when user starts typing
let addtaskTitle = document.getElementById("addtask-title");
let addtaskError = document.getElementById("addtask-error");

addtaskTitle.addEventListener("input", function () {
  this.style.borderColor = "";
  addtaskError.innerHTML = "";
});

// datepicker dropdown menu
let datePicker = document.getElementById("datepicker-wrapper");
let input = document.getElementById("datepicker");

let picker = flatpickr(input, {
  minDate: "today",
  dateFormat: "d/m/Y",
});

// Open date picker
let dueDate = document.getElementById("datepicker");
let dueDateError = document.getElementById("due-date-error");

datePicker.addEventListener("click", () => {
  picker.open();
  dueDate.style.borderColor = "";
  dueDateError.innerHTML = "";
});

// dropdown for assigned contacts
let assignedSelect = document.getElementById("assigned-select-box");
let assignedIcon = document.getElementById("assigned-icon");
let contanctDropDown = document.getElementById("contact-list-box");

assignedSelect.addEventListener("click", function () {
  contanctDropDown.classList.toggle("d-none");
  assignedIcon.classList.toggle("arrow-down");
  assignedIcon.classList.toggle("arrow-up");
});

// dropdown for category selection
let categorySelect = document.getElementById("category-select");
let categoryIcon = document.getElementById("category-icon");
let categoryDropDown = document.getElementById("category-selection");

categorySelect.addEventListener("click", function () {
  categoryDropDown.classList.toggle("d-none");
  categoryIcon.classList.toggle("arrow-down");
  categoryIcon.classList.toggle("arrow-up");
});

// category selection functionality
let categoryPlaceholder = categorySelect.querySelector("span");
let categoryItems = categoryDropDown.querySelectorAll("li");

categoryItems.forEach((item) => {
  item.addEventListener("click", () => {
    let value = item.getAttribute("data-value");
    categoryPlaceholder.textContent = value;
    categoryDropDown.classList.toggle("d-none");
    categoryIcon.classList.remove("arrow-up");
    categoryIcon.classList.add("arrow-down");
  });
});

// Close dropdowns when clicking outside
document.addEventListener("click", function (event) {
  let isClickInsideCategory = categorySelect.contains(event.target) || categoryDropDown.contains(event.target);
  let isClickInsideAssigned = assignedSelect.contains(event.target) || contanctDropDown.contains(event.target);

  if (!isClickInsideCategory) {
    categoryDropDown.classList.add("d-none");
    categoryIcon.classList.remove("arrow-up");
    categoryIcon.classList.add("arrow-down");
  }

  if (!isClickInsideAssigned) {
    contanctDropDown.classList.add("d-none");
    assignedIcon.classList.remove("arrow-up");
    assignedIcon.classList.add("arrow-down");
  }
});

// clear button functionality
let cancelButton = document.getElementById("cancel-button");

cancelButton.addEventListener("click", function () {
  addtaskTitle.value = "";
  addtaskTitle.style.borderColor = "";
  addtaskError.innerHTML = "";
  dueDate.value = "";
  dueDate.style.borderColor = "";
  dueDateError.innerHTML = "";
  categoryPlaceholder.textContent = "Select task category";

  priorityButtons.forEach(btn => btn.classList.remove('active'));
  selectedPriority = null;
});

// create button check necessary fields filled
let createButton = document.getElementById("create-button");

createButton.addEventListener("click", function () {
  if (!addtaskTitle.value) {
    addtaskError.innerHTML = "Thies field is required";
    addtaskTitle.style.borderColor = "var(--error-color)";
  }
  if (!dueDate.value) {
    dueDateError.innerHTML = "Please select a due date";
    dueDate.style.borderColor = "var(--error-color)";
  }
});

// priority buttons functionality
let priorityButtons = document.querySelectorAll('.priority-button');
let selectedPriority = null;

priorityButtons.forEach(button => {
  button.addEventListener('click', () => {
    priorityButtons.forEach(btn => {
      btn.classList.remove('active');
    });
    button.classList.add('active');
    selectedPriority = button.classList.contains('urgent-button') ? 'urgent'
                      : button.classList.contains('medium-button') ? 'medium'
                      : 'low';
  });
});