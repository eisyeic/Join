import { getDatabase, ref, push, set, get, update } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { app, auth } from "./firebase.js";

let db = getDatabase(app);
let loadedContacts = {};

let currentEditingTaskId = "";
// Allow other modules / overlay openers to set and read the current editing task id
window.setCurrentEditingTaskId = function (id) {
  currentEditingTaskId = id || "";
  // keep dataset in sync for fallback lookups
  const wrapper = document.querySelector('.addtask-wrapper');
  if (wrapper) wrapper.dataset.editingId = currentEditingTaskId;
};
window.getCurrentEditingTaskId = function () {
  return currentEditingTaskId;
};

loadContactsAndRender();

// Helpers (keep functions short)
function getEditingId() {
  return (
    currentEditingTaskId ||
    (typeof window.getCurrentEditingTaskId === "function"
      ? window.getCurrentEditingTaskId()
      : "") ||
    document.querySelector(".addtask-wrapper")?.dataset.editingId ||
    ""
  );
}

function getAssignedContactsFromUI() {
  const selectedLis = document.querySelectorAll("#contact-list-box li.selected");
  if (selectedLis.length > 0) {
    return Array.from(selectedLis).map((li) => {
      const id = li.id;
      const c = loadedContacts[id] || {};
      return { id, name: c.name, colorIndex: c.colorIndex, initials: c.initials };
    });
  }
  try {
    const raw = document.getElementById("assigned-select-box")?.dataset.selected || "[]";
    const ids = JSON.parse(raw) || [];
    return ids.map((id) => {
      const c = loadedContacts[id] || {};
      const initials = c.initials || (c.name ? c.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase() : "");
      return { id, name: c.name || String(id), colorIndex: c.colorIndex ?? 1, initials };
    });
  } catch (_) {
    return [];
  }
}

function baseTaskFromForm() {
  return {
    column: "todo",
    title: $("addtask-title").value.trim(),
    description: $("addtask-textarea").value.trim(),
    dueDate: $("datepicker").value.trim(),
    category: $("category-select").querySelector("span").textContent,
    priority: selectedPriority,
    subtasks: subtasks.map((name) => ({ name, checked: false })),
  };
}

function showBanner() {
  const layout = $("layout");
  const banner = $("slide-in-banner");
  if (layout) layout.style.opacity = "0.5";
  if (banner) banner.classList.add("visible");
}

function hideBanner() {
  const layout = $("layout");
  const banner = $("slide-in-banner");
  if (banner) banner.classList.remove("visible");
  if (layout) layout.style.opacity = "1";
}

function finishCreateFlow() {
  setTimeout(() => {
    hideBanner();
    $("cancel-button").click();
    if (!window.location.pathname.endsWith("board.html")) {
      window.location.href = "./board.html";
    }
  }, 1200);
}

function finishUpdateFlow() {
  setTimeout(() => {
    hideBanner();
    document.querySelector(".edit-addtask-wrapper")?.classList.add("d-none");
    document.getElementById("task-overlay-content")?.classList.remove("d-none");
    if (typeof window.hideOverlay === "function") window.hideOverlay();
    else if (!window.location.pathname.endsWith("board.html")) window.location.href = "./board.html";
  }, 900);
}

function resetFormErrors() {
  $("addtask-error").innerHTML = "";
  $("due-date-error").innerHTML = "";
  $("category-selection-error").innerHTML = "";
}

function setError(msgId, borderId, msg) {
  $(msgId).innerHTML = msg;
  if (borderId) $(borderId).style.borderColor = "var(--error-color)";
}

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
  const base = baseTaskFromForm();
  return {
    ...base,
    assignedContacts: getAssignedContactsFromUI(),
    editingId: getEditingId(),
  };
}

// validate form addtask
function validateTitle(data) {
  if (!data.title) {
    setError("addtask-error", "addtask-title", "This field is required");
    return false;
  }
  return true;
}

// validate due date
function validateDueDate(data) {
  if (!data.dueDate) {
    setError("due-date-error", "datepicker-wrapper", "Please select a due date");
    return false;
  }
  return true;
}

// validate category
function validateCategory(data) {
  if (data.category === "Select task category") {
    setError("category-selection-error", "category-select", "Please choose category");
    return false;
  }
  return true;
}

function validatePriority(data) {
  return !!data.priority;
}

// validate form data
function validateFormData(data) {
  resetFormErrors();
  let ok = true;
  ok = validateTitle(data) && ok;
  ok = validateDueDate(data) && ok;
  ok = validateCategory(data) && ok;
  ok = validatePriority(data) && ok;
  return ok;
}

// handle ok button
async function handleEditOkClick() {
  const taskData = collectFormData();
  if (!validateFormData(taskData)) return;
  const taskId = getEditingId();
  if (!taskId) return sendTaskToFirebase(taskData);
  const snap = await get(ref(db, `tasks/${taskId}`));
  if (snap.exists()) {
    const oldTask = snap.val();
    taskData.column = oldTask?.column ?? taskData.column;
  }
  updateTaskInFirebase(taskId, taskData);
}
window.handleEditOkClick = handleEditOkClick;

// create button check necessary fields filled
$("create-button").addEventListener("click", handleCreateClick);
function handleCreateClick() {
  const data = collectFormData();
  if (!validateFormData(data)) return;
  sendTaskToFirebase(data);
  if (!window.location.pathname.endsWith("addtask.html")) window.toggleAddTaskBoard();
}

// Edit-OK / Save button(s)
const okBtn = $("ok-button");
if (okBtn) okBtn.addEventListener("click", handleEditOkClick);
const editOkBtn = $("edit-ok-button");
if (editOkBtn) editOkBtn.addEventListener("click", handleEditOkClick);
document.addEventListener('click', (e) => {
  const saveBtn = e.target.closest('#ok-button, #edit-ok-button, [data-action="save-task"]');
  if (saveBtn) {
    handleEditOkClick();
  }
});

// send to firebase
function sendTaskToFirebase(taskData) {
  const tasksRef = ref(db, "tasks");
  const newRef = push(tasksRef);
  const task = { ...taskData, createdAt: new Date().toISOString() };
  set(newRef, task)
    .then(() => { showBanner(); finishCreateFlow(); })
    .catch((e) => console.error("Fehler beim Speichern:", e));
}

// update task informations
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
    .then(() => { showBanner(); finishUpdateFlow(); })
    .catch((e) => console.error("Fehler beim Aktualisieren:", e));
}
