// create button check necessary fields filled
let createButton = document.getElementById('create-button');
let addtaskTitle = document.getElementById('addtask-title');
let addtaskError = document.getElementById('addtask-error');
let dueDate = document.getElementById('datepicker');
let dueDateError = document.getElementById('due-date-error');
let cancelButton = document.getElementById('cancel-button');

createButton.addEventListener("click", function() {
    if (!addtaskTitle.value) {
      addtaskError.innerHTML = "Thies field is required";
      addtaskTitle.style.borderColor = "var(--error-color)";
    }
    if (!dueDate.value) {
      dueDateError.innerHTML = "Please select a due date";
      dueDate.style.borderColor = "var(--error-color)";
    }
    
          

      
    
    
    // to do: check if all necessary fields are filled




});

// clear button functionality
cancelButton.addEventListener("click", function() {
  addtaskTitle.value = "";
  addtaskError.innerHTML = "";
  dueDate.value = "";
  dueDateError.innerHTML = "";
  addtaskTitle.style.borderColor = "";
  dueDate.style.borderColor = "";
});

// clear error message when user starts typing
addtaskTitle.addEventListener("input", function() {
  this.style.borderColor = "";
  addtaskError.innerHTML = "";
});

// dropdown for assigned contacts
let assignedSelect = document.getElementById('assigned-select-box');
let assignedIcon = document.getElementById('assigned-icon');
let contanctDropDown = document.getElementById('contact-list-box');

assignedSelect.addEventListener("click", function() {
    contanctDropDown.classList.toggle('d-none');
    assignedIcon.classList.toggle('arrow-down');
    assignedIcon.classList.toggle('arrow-up');
});

// dropdown for category selection
let categorySelect = document.getElementById('category-select');
let categoryIcon = document.getElementById('category-icon');
let categoryDropDown = document.getElementById('category-selection');

categorySelect.addEventListener("click", function() {
    categoryDropDown.classList.toggle('d-none');
    categoryIcon.classList.toggle('arrow-down');
    categoryIcon.classList.toggle('arrow-up');
});

// datepicker dropdown menu
let datePicker = document.getElementById("datepicker-wrapper");
let input = document.getElementById("datepicker");
let picker = flatpickr(input, {
  minDate: "today",
  dateFormat: "d/m/Y",
});

// Open the date picker when the datePicker element is clicked
datePicker.addEventListener("click", () => {
  picker.open();
  dueDate.style.borderColor = "";
});