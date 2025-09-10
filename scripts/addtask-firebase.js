import { getDatabase, ref, push, set, get, update } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { app, auth } from "./firebase.js";

let db = getDatabase(app);
let loadedContacts = {};
let currentEditingTaskId = "";



// Sets the current editing task ID and updates the wrapper dataset attribute
window.setCurrentEditingTaskId = function (id) {
  currentEditingTaskId = id || "";
  const wrapper = document.querySelector('.addtask-wrapper');
  if (wrapper) wrapper.dataset.editingId = currentEditingTaskId;
};

// Returns the task id that is currently being edited
window.getCurrentEditingTaskId = function () {
  return currentEditingTaskId;
};


// Initializes the Add Task module: loads contacts, sets up listeners, and ensures the UI is ready
function initAddTask() {
  loadContactsAndRender();
  setupAuthListener();
  setupContactInputListener();
  setupCreateButton();
  setupOkButtons();
}

// Resolves the active editing id from in-memory state, global helpers, or DOM dataset
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

// Normalize a contact record by id
function mapContact(id) {
  const c = loadedContacts[id] || {};
  const initials = c.initials || (c.name ? c.name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase() : "");
  return { id, name: c.name || String(id), colorIndex: c.colorIndex ?? 1, initials };
}

// Read selected contact ids from the dataset
function getIdsFromDataset() {
  try {
    const raw = $("assigned-select-box")?.dataset.selected || "[]";
    const ids = JSON.parse(raw);
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
}

// Collect assigned contacts from UI (selected lis or dataset)
function getAssignedContactsFromUI() {
  const selectedLis = document.querySelectorAll("#contact-list-box li.selected");
  if (selectedLis.length > 0) return Array.from(selectedLis, li => mapContact(li.id));
  const ids = getIdsFromDataset();
  return ids.map(mapContact);
}


// Reads core task fields from the Add Task form and returns the base task payload
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

// Shows the slide-in confirmation banner and dims the overlay
function showBanner() {
  const overlay = $("overlay-bg");
  const banner = $("slide-in-banner");
  if (overlay) overlay.style.display = "block";
  if (banner) banner.classList.add("visible");
}

// Hides the slide-in confirmation banner and restores overlay opacity
function hideBanner() {
  const overlay = $("overlay-bg");
  const banner = $("slide-in-banner");
  if (banner) banner.classList.remove("visible");
  if (overlay) overlay.style.display = "none";
}

// Completes the create-task flow: hides banner, resets UI, and navigates to board if needed
function finishCreateFlow() {
  setTimeout(() => {
    hideBanner();
    $("cancel-button").click();
    if (!window.location.pathname.endsWith("board.html")) {
      window.location.href = "./board.html";
    }
  }, 1200);
}

// Completes the update-task flow: hides banner/overlay and returns to board when appropriate
function finishUpdateFlow() {
  setTimeout(() => {
    hideBanner();
    document.querySelector(".edit-addtask-wrapper")?.classList.add("d-none");
    document.getElementById("task-overlay-content")?.classList.remove("d-none");
    if (typeof window.hideOverlay === "function") window.hideOverlay();
    else if (!window.location.pathname.endsWith("board.html")) window.location.href = "./board.html";
  }, 900);
}

// Clears all validation error messages in the Add Task form
function resetFormErrors() {
  $("addtask-error").innerHTML = "";
  $("due-date-error").innerHTML = "";
  $("category-selection-error").innerHTML = "";
}

// Renders a single validation error and optionally highlights a field border
function setError(msgId, borderId, msg) {
  $(msgId).innerHTML = msg;
  if (borderId) $(borderId).style.borderColor = "var(--error-color)";
}

// Auth listener to project user initials into the UI when available
function setupAuthListener() {
  onAuthStateChanged(auth, (user) => {
    if (window.updateUserInitials) {
      window.updateUserInitials(user);
    }
  });
}

// Loads contacts from Firebase and renders them into the contact list box
function loadContactsAndRender() {
  let contactListBox = $("contact-list-box");
  if (!contactListBox) return;
  contactListBox.innerHTML = "";
  get(ref(db, "contacts")).then((snapshot) => {
    if (snapshot.exists()) {
      loadedContacts = snapshot.val();
      if (window.renderContactsForAddTask) {
        window.renderContactsForAddTask(loadedContacts, contactListBox);
      }
    }
  });
}

// Setup contact input listener
function setupContactInputListener() {
  const contactInput = $("contact-input");
  if (contactInput && window.onContactInputForAddTask) {
    contactInput.addEventListener("input", window.onContactInputForAddTask);
  }
}


// Aggregates the full task payload from the form, including assigned contacts and editing id
function collectFormData() {
  const base = baseTaskFromForm();
  return {
    ...base,
    assignedContacts: getAssignedContactsFromUI(),
    editingId: getEditingId(),
  };
}

// Validates the title field
function validateTitle(data) {
  if (!data.title) {
    setError("addtask-error", "addtask-title", "This field is required");
    return false;
  }
  return true;
}

// Validates the due date field
function validateDueDate(data) {
  if (!data.dueDate) {
    setError("due-date-error", "datepicker-wrapper", "Please select a due date");
    return false;
  }
  return true;
}

// Validates the category dropdown selection
function validateCategory(data) {
  if (data.category === "Select task category") {
    setError("category-selection-error", "category-select", "Please choose category");
    return false;
  }
  return true;
}

// Validates that a priority has been selected
function validatePriority(data) {
  return !!data.priority;
}

// Runs all form validators, mutating the UI error state, and returns the combined result
function validateFormData(data) {
  resetFormErrors();
  let ok = true;
  ok = validateTitle(data) && ok;
  ok = validateDueDate(data) && ok;
  ok = validateCategory(data) && ok;
  ok = validatePriority(data) && ok;
  return ok;
}

// Handles saving when editing: validates, preserves column, and updates the task
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

// Handles creating a new task from the Add Task form after validation
function handleCreateClick() {
  const data = collectFormData();
  if (!validateFormData(data)) return;
  sendTaskToFirebase(data);
  if (!window.location.pathname.endsWith("addtask.html")) window.toggleAddTaskBoard();
}

// Setup create button event listener
function setupCreateButton() {
  const createBtn = $("create-button");
  if (createBtn) createBtn.addEventListener("click", handleCreateClick);
}

// Wires explicit click handlers for save/edit OK buttons to prevent double triggers
function setupOkButtons() {
  const okBtn = $("ok-button");
  if (okBtn) okBtn.addEventListener("click", handleEditOkClick);
  const editOkBtn = $("edit-ok-button");
  if (editOkBtn) editOkBtn.addEventListener("click", handleEditOkClick);
}

// Persists a new task to Firebase under /tasks and triggers the create flow UI
function sendTaskToFirebase(taskData) {
  const tasksRef = ref(db, "tasks");
  const newRef = push(tasksRef);
  const task = { ...taskData, createdAt: new Date().toISOString() };
  set(newRef, task)
    .then(() => { showBanner(); finishCreateFlow(); })
    .catch((e) => console.error("Fehler beim Speichern:", e));
}

// Updates an existing task in Firebase and triggers the update flow UI
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

// Run initialization immediately on script load
initAddTask();
