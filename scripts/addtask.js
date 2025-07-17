const createButton = document.getElementById('create-button');

const assignedSelect = document.getElementById('assigned-select-box');
const assignedIcon = document.getElementById('assigned-icon');
const contanctDropDown = document.getElementById('contact-list-box');

const categorySelect = document.getElementById('category-select');
const categorySelection = document.getElementById('category-selection');

createButton.addEventListener("mouseover", function() {
    createButton.classList.toggle('button-toggle');    
});

assignedSelect.addEventListener("click", function() {
    contanctDropDown.classList.toggle('d-none');
    assignedIcon.classList.toggle('arrow-down');
    assignedIcon.classList.toggle('arrow-up');
});

categorySelect.addEventListener("click", function() {
    categorySelection.classList.toggle('d-none');
});

flatpickr("#datepicker", {
      dateFormat: "d.m.Y",
    });