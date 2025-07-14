const createButton = document.getElementById('create-button');
const asignedSelect = document.getElementById('asigned-select-box');
const contanctDropDown = document.getElementById('contact-list-box');

createButton.addEventListener("mouseover", function() {
    createButton.classList.toggle('button-toggle');    
});

asignedSelect.addEventListener("click", function() {
    contanctDropDown.classList.toggle('d-none');
}); 