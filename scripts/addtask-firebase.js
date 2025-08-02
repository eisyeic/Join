import {  getDatabase, ref, push, set, get } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { app, auth } from "./firebase.js";

let db = getDatabase(app);
let loadedContacts = {};
let subtasks = [];

// User initials
onAuthStateChanged(auth, (user) => {
  if (window.updateUserInitials) {
    window.updateUserInitials(user);
  }
});

loadContactsAndRender();

// load contact onload page
function loadContactsAndRender() {
  let contactListBox = $("contact-list-box");
  contactListBox.innerHTML = "";
  get(ref(db, "contacts")).then((snapshot) => {
    if (snapshot.exists()) {
      loadedContacts = snapshot.val();
      renderContacts(loadedContacts, contactListBox);
    }
  });
}

let contactInput = $("contact-input");
if (contactInput) {
  contactInput.addEventListener("input", function () {
    let searchValue = this.value.trim().toLowerCase();
    let filtered = {};
    $("contact-list-box").classList.remove("d-none");
    if (searchValue.length === 0) {
      Object.assign(filtered, loadedContacts);
    } else {
      for (let id in loadedContacts) {
        let contact = loadedContacts[id];
        let nameParts = contact.name.trim().toLowerCase().split(" ");

        let matches = nameParts.some((part) => part.startsWith(searchValue));
        if (matches) {
          filtered[id] = contact;
        }
      }
    }
    let contactListBox = $("contact-list-box");
    contactListBox.innerHTML = "";
    renderContacts(filtered, contactListBox);
  });
}

// render contacts
function renderContacts(contacts, container) {
  for (let id in contacts) {
    let contact = contacts[id]; // <-- hier korrekt definieren
    let li = createContactListItem(contact, id);
    container.appendChild(li);
  }
}

// create list element contacts
function createContactListItem(contact, id) {
  let li = document.createElement("li");
  li.id = id;
  li.innerHTML = `
    <div>
      <div class="contact-initial" style="background-image: url(../assets/icons/contact/color${contact.colorIndex}.svg)">
        ${contact.initials}
      </div>
      ${contact.name}
    </div>
    <img src="./assets/icons/add_task/check_default.svg" alt="checkbox" />
  `;
  addContactListItemListener(li);
  return li;
}

// click handler contact list
function addContactListItemListener(li) {
  li.addEventListener("click", () => {
    li.classList.toggle("selected");
    let checkboxIcon = li.querySelector("img");
    let isSelected = li.classList.contains("selected");
    checkboxIcon.src = isSelected
      ? "./assets/icons/add_task/check_white.svg"
      : "./assets/icons/add_task/check_default.svg";
    renderSelectedContactInitials();
  });
}

// render selected contacts
function renderSelectedContactInitials() {
  let selectedLis = document.querySelectorAll("#contact-list-box li.selected");
  let contactInitialsBox = document.getElementById("contact-initials");
  contactInitialsBox.innerHTML = "";
  let initialsToShow = Array.from(selectedLis).slice(0, 3);
  initialsToShow.forEach((li) => {
    let initialsEl = li.querySelector(".contact-initial");
    if (initialsEl) {
      let clone = initialsEl.cloneNode(true);
      contactInitialsBox.appendChild(clone);
    }
  });
}

function setupContactBoxToggle() {
  let contactListBox = document.getElementById("contact-list-box");
  let contactInitialsBox = document.getElementById("contact-initials");
  let trigger = document.getElementById("contact-input");
  setupDocumentClick(contactListBox, contactInitialsBox, trigger);
  setupInputClick(contactListBox, contactInitialsBox, trigger);
}

function setupDocumentClick(contactListBox, contactInitialsBox, trigger) {
  document.addEventListener("click", (e) => {
    if (
      !contactListBox.contains(e.target) &&
      !contactInitialsBox.contains(e.target) &&
      e.target !== trigger
    ) {
      contactListBox.classList.add("d-none");
      updateInitialsBox(contactInitialsBox);
    }
  });
}

function setupInputClick(contactListBox, contactInitialsBox, trigger) {
  trigger.addEventListener("click", () => {
    contactListBox.classList.remove("d-none");
    contactInitialsBox.classList.add("d-none");
  });
}

function updateInitialsBox(contactInitialsBox) {
  renderSelectedContactInitials();
  let selected = document.querySelectorAll("#contact-list-box li.selected");
  if (selected.length > 0) {
    contactInitialsBox.classList.remove("d-none");
  } else {
    contactInitialsBox.classList.add("d-none");
  }
}

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
$("datepicker-wrapper").addEventListener("click", function () {
  picker.open();
  $("datepicker").style.borderColor = "";
  $("due-date-error").innerHTML = "";
});

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
      $("category-selection").classList.add("d-none");
      $("category-icon").classList.remove("arrow-up");
      $("category-icon").classList.add("arrow-down");
      $("category-select").style.borderColor = ""; // Fehler entfernen falls vorhanden
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
  if ($("contact-input")) {
    $("contact-input").value = "";
    renderContacts(loadedContacts, $("contact-list-box"));
  }
  let selectedContacts = document.querySelectorAll("#contact-list-box li.selected");
  if (selectedContacts.length > 0) {
    $("contact-initials").classList.remove("d-none");
  } else {
    $("contact-initials").classList.add("d-none");
  }
  $("assigned-icon").classList.remove("arrow-up");
  $("assigned-icon").classList.add("arrow-down");
}
}

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
// create button check necessary fields filled
$("create-button").addEventListener("click", handleCreateClick);
function handleCreateClick() {
  let taskData = collectFormData();
  let isValid = validateFormData(taskData);
  if (!isValid) return;
  sendTaskToFirebase(taskData);
}

// collect form data
function collectFormData() {
  let column = "todo";
  let title = $("addtask-title").value.trim();
  let description = $("addtask-textarea").value.trim();
  let dueDate = $("datepicker").value.trim();
  let category = $("category-select").querySelector("span").textContent;

let assignedContacts = Array.from(
  document.querySelectorAll("#contact-list-box li.selected")
).map((li) => {
  let id = li.id; 
  let contact = loadedContacts[id];
  return {
    id,
    name: contact.name,
    colorIndex: contact.colorIndex,
    initials: contact.initials,
  };
});

  return {
    column,
    title,
    description,
    dueDate,
    category,
    priority: selectedPriority,
    assignedContacts,
    subtasks,
  };
}

// validate data before send
function validateFormData(data) {
  let valid = true;
  $("addtask-error").innerHTML = "";
  $("due-date-error").innerHTML = "";
  $("category-selection-error").innerHTML = "";
  if (!data.title) {
    $("addtask-error").innerHTML = "This field is required";
    $("addtask-title").style.borderColor = "var(--error-color)";
    valid = false;
  }
  if (!data.dueDate) {
    $("due-date-error").innerHTML = "Please select a due date";
    $("datepicker").style.borderColor = "var(--error-color)";
    valid = false;
  }
  if (data.category === "Select task category") {
    $("category-selection-error").innerHTML = "Please choose category";
    $("category-select").style.borderColor = "var(--error-color)";
    valid = false;
  }
  if (!data.priority) {
    valid = false;
  }
  return valid;
}

// send to firebase
function sendTaskToFirebase(taskData) {
  let tasksRef = ref(db, "tasks");
  let newTaskRef = push(tasksRef);

  let task = {
    ...taskData,
    createdAt: new Date().toISOString(),
  };
  set(newTaskRef, task)
    .then(() => {
      clearForm();
      window.location.href = "./board.html";
    })
    .catch((error) => {
      console.error("Fehler beim Speichern:", error);
    });
}

// clear form
function clearForm() {
  $("cancel-button").click();
}

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

// Medium-Button aktivieren beim Laden
document.querySelector(".medium-button").classList.add("active");

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

$("sub-input").addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    event.preventDefault(); // verhindert z. B. Form-Submit

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
  if (subtasks.length === 0) {
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

function saveEditedSubtask(saveBtn) {
  let item = saveBtn.closest(".subtask-item");
  let index = item.getAttribute("data-index");
  let input = item.querySelector(".subtask-edit-input");
  let newValue = input.value.trim();

  if (newValue) {
    subtasks[index] = newValue;
    renderSubtasks(); 
  }
}

document.addEventListener("click", function (event) {
  let openInput = document.querySelector(".subtask-edit-input");
  if (!openInput) return;

  let subtaskItem = openInput.closest(".subtask-item");
  let saveBtn = subtaskItem.querySelector(".subtask-save-icon");
  if (!subtaskItem.contains(event.target)) {
    saveEditedSubtask(saveBtn);
  }
});

document.querySelectorAll(".subtask-save-icon").forEach((saveBtn) => {
  saveBtn.addEventListener("click", () => {
    saveEditedSubtask(saveBtn);
  });
});

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
