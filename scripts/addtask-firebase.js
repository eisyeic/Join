import { getDatabase, ref, push, set, get, update } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { app, auth } from "./firebase.js";

let db = getDatabase(app);
let loadedContacts = {};

loadContactsAndRender();


// User initials
onAuthStateChanged(auth, (user) => {
  if (window.updateUserInitials) {
    window.updateUserInitials(user);
  }
});

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

// contact input event listener
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
    container.innerHTML = "";
  for (let id in contacts) {
    let contact = contacts[id]; 
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

// collect form data
function collectFormData() {
  let column = "todo";
  let title = $("addtask-title").value.trim();
  let description = $("addtask-textarea").value.trim();
  let dueDate = $("datepicker").value.trim();
  let category = $("category-select").querySelector("span").textContent;
  let assignedContacts = [];
  const selectedLis = document.querySelectorAll("#contact-list-box li.selected");
  if (selectedLis.length > 0) {
    assignedContacts = Array.from(selectedLis).map((li) => {
      let id = li.id;
      let contact = loadedContacts[id];
      return {
        id,
        name: contact.name,
        colorIndex: contact.colorIndex,
        initials: contact.initials,
      };
    });
  } else {
    // Fallback for edit mode: read IDs that were pre-selected via dataset
    try {
      const selectedJson = document.getElementById('assigned-select-box')?.dataset.selected || '[]';
      const ids = JSON.parse(selectedJson);
      assignedContacts = (ids || []).map((id) => {
        const c = loadedContacts[id] || {};
        return {
          id,
          name: c.name || String(id),
          colorIndex: c.colorIndex ?? 1,
          initials: c.initials || (c.name ? c.name.split(" ").map(p=>p[0]).join("").slice(0,2).toUpperCase() : ""),
        };
      });
    } catch (_) {}
  }
  const editingId = (typeof window.getCurrentEditingTaskId === 'function' ? window.getCurrentEditingTaskId() : '') || document.querySelector('.addtask-wrapper')?.dataset.editingId || '';
  return {
    column,
    title,
    description,
    dueDate,
    category,
    priority: selectedPriority,
    assignedContacts,
    subtasks: subtasks.map(name => ({ name, checked: false })),
    editingId,
  };
}

// validate form addtask
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
    $("datepicker-wrapper").style.borderColor = "var(--error-color)";
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

function handleEditOkClick() {
  let taskData = collectFormData();
  let isValid = validateFormData(taskData);
  if (!isValid) return;

  const taskId = taskData.editingId || (typeof window.getCurrentEditingTaskId === 'function' ? window.getCurrentEditingTaskId() : '') || document.querySelector('.addtask-wrapper')?.dataset.editingId || '';

  if (taskId) {
    updateTaskInFirebase(taskId, taskData);
  } else {
    // No editing id present -> fallback to create behavior
    sendTaskToFirebase(taskData);
  }
}

// create button check necessary fields filled
$("create-button").addEventListener("click", handleCreateClick);
function handleCreateClick() {
  let taskData = collectFormData();
  let isValid = validateFormData(taskData);
  if (!isValid) return;
  sendTaskToFirebase(taskData);
  if (!window.location.pathname.endsWith("addtask.html")) {
    window.toggleAddTaskBoard();
  }
}

// Edit-OK / Save button(s)
const okBtn = $("ok-button");
if (okBtn) okBtn.addEventListener("click", handleEditOkClick);
const editOkBtn = $("edit-ok-button");
if (editOkBtn) editOkBtn.addEventListener("click", handleEditOkClick);

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
      const layout = $("layout");
      const slideInBanner = $("slide-in-banner");
      if (layout) layout.style.opacity = "0.5";
      if (slideInBanner) slideInBanner.classList.add("visible");
      setTimeout(() => {
        if (slideInBanner) slideInBanner.classList.remove("visible");
        if (layout) layout.style.opacity = "1";
        $("cancel-button").click();
        if (!window.location.pathname.endsWith("board.html")) {
          window.location.href = "./board.html";
        }
      }, 1200);
    })
    .catch((error) => {
      console.error("Fehler beim Speichern:", error);
    });
}

function updateTaskInFirebase(taskId, taskData) {
  const taskRef = ref(db, `tasks/${taskId}`);
  const toSave = {
    column: taskData.column,
    title: taskData.title,
    description: taskData.description,
    dueDate: taskData.dueDate,
    category: taskData.category,
    priority: taskData.priority,
    assignedContacts: taskData.assignedContacts,
    subtasks: taskData.subtasks,
    updatedAt: new Date().toISOString(),
  };
  update(taskRef, toSave)
    .then(() => {
      const layout = $("layout");
      const slideInBanner = $("slide-in-banner");
      if (layout) layout.style.opacity = "0.5";
      if (slideInBanner) slideInBanner.classList.add("visible");
      setTimeout(() => {
        if (slideInBanner) slideInBanner.classList.remove("visible");
        if (layout) layout.style.opacity = "1";
        // close edit view / overlay
        document.querySelector('.edit-addtask-wrapper')?.classList.add('d-none');
        document.getElementById('task-overlay-content')?.classList.remove('d-none');
        if (typeof window.hideOverlay === 'function') {
          // if user expects closing after save
          window.hideOverlay();
        } else if (!window.location.pathname.endsWith('board.html')) {
          window.location.href = './board.html';
        }
      }, 900);
    })
    .catch((error) => {
      console.error("Fehler beim Aktualisieren:", error);
    });
}

