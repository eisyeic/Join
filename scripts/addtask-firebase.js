import { getDatabase, ref, push, set, get, update } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { app, auth } from "./firebase.js";

let db = getDatabase(app);
let loadedContacts = {};
let currentEditingTaskId = "";

/**
 * Set the current editing task id and mirror it to the wrapper dataset.
 * @param {string} id
 * @returns {void}
 */
window.setCurrentEditingTaskId = function (id) {
  currentEditingTaskId = id || "";
  const wrapper = document.querySelector('.addtask-wrapper');
  if (wrapper) wrapper.dataset.editingId = currentEditingTaskId;
};

/**
 * Get the current editing task id from in-memory state.
 * @returns {string}
 */
window.getCurrentEditingTaskId = function () {
  return currentEditingTaskId;
};

/**
 * Initialize Add Task: contacts, auth listener, input filter, and buttons.
 * @returns {void}
 */
(function initAddTask() {
  loadContactsAndRender();
  setupAuthListener();
  setupContactInputListener();
  setupCreateButton();
  setupOkButtons();
})();

/**
 * Resolve the active editing id from memory, globals, or DOM dataset.
 * @returns {string}
 */
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

/**
 * Normalize a contact by id from the loadedContacts cache.
 * @param {string} id
 * @returns {Contact}
 */
function mapContact(id) {
  const c = loadedContacts[id] || {};
  const initials = c.initials || (c.name ? c.name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase() : "");
  return { id, name: c.name || String(id), colorIndex: c.colorIndex ?? 1, initials };
}

/**
 * Read selected contact ids from the assigned-select-box dataset.
 * @returns {string[]}
 */
function getIdsFromDataset() {
  try {
    const raw = $("assigned-select-box")?.dataset.selected || "[]";
    const ids = JSON.parse(raw);
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
}

/**
 * Collect assigned contacts from selected <li> nodes; fallback to dataset ids.
 * @returns {Contact[]}
 */
function getAssignedContactsFromUI() {
  const selectedLis = document.querySelectorAll("#contact-list-box li.selected");
  if (selectedLis.length > 0) return Array.from(selectedLis, li => mapContact(li.id));
  const ids = getIdsFromDataset();
  return ids.map(mapContact);
}

/**
 * Format a value from the native datepicker (YYYY-MM-DD) to DD/MM/YYYY.
 * Returns empty string for falsy/invalid inputs.
 * @param {string} iso
 * @returns {string}
 */
function formatPickerToDDMMYYYY(iso) {
  if (!iso || typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/**
 * Read base task fields from the Add Task form.
 * @returns {BaseTask}
 */
function baseTaskFromForm() {
  const rawDate = $("datepicker")?.value || "";
  const dueDate = formatPickerToDDMMYYYY(rawDate);
  return {
    column: "todo",
    title: $("addtask-title").value.trim(),
    description: $("addtask-textarea").value.trim(),
    dueDate: dueDate,
    category: $("category-select").querySelector("span").textContent,
    priority: selectedPriority,
    subtasks: subtasks.map((name) => ({ name, checked: false })),
  };
}

/**
 * Complete the create flow: hide banner, reset UI, and navigate if not on board.
 * @returns {void}
 */
function finishCreateFlow() {
  setTimeout(() => {
    hideBanner();
    $("cancel-button").click();
    if (!window.location.pathname.endsWith("board.html")) {
      window.location.href = "./board.html";
    }
  }, 1200);
}

/**
 * Complete the update flow: hide banner/overlay & return to board when appropriate.
 * @returns {void}
 */
function finishUpdateFlow() {
  setTimeout(() => {
    hideBanner();
    document.querySelector(".edit-addtask-wrapper")?.classList.add("d-none");
    document.getElementById("task-overlay-content")?.classList.remove("d-none");
    if (typeof window.hideOverlay === "function") window.hideOverlay();
    else if (!window.location.pathname.endsWith("board.html")) window.location.href = "./board.html";
  }, 900);
}

/**
 * Clear all validation error messages in the Add Task form.
 * @returns {void}
 */
function resetFormErrors() {
  $("addtask-error").innerHTML = "";
  $("due-date-error").innerHTML = "";
  $("category-selection-error").innerHTML = "";
}

/**
 * Render a validation error and optionally highlight a field.
 * @param {string} msgId - Element id to place the message.
 * @returns {void}
 */
function setError(msgId, borderId, msg) {
  $(msgId).innerHTML = msg;
  if (borderId) $(borderId).style.borderColor = "var(--error-color)";
}

/**
 * Listen for auth changes and project user initials into the UI, if supported.
 * @returns {void}
 */
function setupAuthListener() {
  onAuthStateChanged(auth, (user) => {
    if (window.updateUserInitials) {
      window.updateUserInitials(user);
    }
  });
}

/**
 * Load contacts from Firebase and render them to the contact list box.
 * @returns {void}
 */
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

/**
 * Wire the contact input filter to the input event.
 * @returns {void}
 */
function setupContactInputListener() {
  const contactInput = $("contact-input");
  if (contactInput && window.onContactInputForAddTask) {
    contactInput.addEventListener("input", window.onContactInputForAddTask);
  }
}

/**
 * Aggregate full task payload including assigned contacts and editing id.
 * @returns {FullTask}
 */
function collectFormData() {
  const base = baseTaskFromForm();
  return {
    ...base,
    assignedContacts: getAssignedContactsFromUI(),
    editingId: getEditingId(),
  };
}

/**
 * Validate the title.
 * @param {FullTask|BaseTask} data
 * @returns {boolean}
 */
function validateTitle(data) {
  if (!data.title) {
    setError("addtask-error", "addtask-title", "This field is required");
    return false;
  }
  return true;
}

/**
 * Validate the dueDate.
 * @param {FullTask|BaseTask} data
 * @returns {boolean}
 */
function validateDueDate(data) {
  if (!data.dueDate) {
    setError("due-date-error", "datepicker-wrapper", "Please select a due date");
    return false;
  }
  return true;
}

/**
 * Validate the category.
 * @param {FullTask|BaseTask} data
 * @returns {boolean}
 */
function validateCategory(data) {
  if (data.category === "Select task category") {
    setError("category-selection-error", "category-select", "Please choose category");
    return false;
  }
  return true;
}

/**
 * Validate the priority.
 * @param {FullTask|BaseTask} data
 * @returns {boolean}
 */
function validatePriority(data) {
  return !!data.priority;
}

/**
 * Run all validators and mutate UI state.
 * @param {FullTask|BaseTask} data
 * @returns {boolean}
 */
function validateFormData(data) {
  resetFormErrors();
  let ok = true;
  ok = validateTitle(data) && ok;
  ok = validateDueDate(data) && ok;
  ok = validateCategory(data) && ok;
  ok = validatePriority(data) && ok;
  return ok;
}

/**
 * Handle clicking OK in edit mode: validate and update task, preserving column.
 * @returns {Promise<void>}
 */
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

/**
 * Handle clicking Create: validate and persist a new task.
 * @returns {void}
 */
function handleCreateClick() {
  const data = collectFormData();
  if (!validateFormData(data)) return;
  sendTaskToFirebase(data);
  if (!window.location.pathname.endsWith("addtask.html")) window.toggleAddTaskBoard();
}

/**
 * Wire the Create button click handler.
 * @returns {void}
 */
function setupCreateButton() {
  const createBtn = $("create-button");
  if (createBtn) createBtn.addEventListener("click", handleCreateClick);
}

/**
 * Wire the edit OK buttons to prevent double triggers.
 * @returns {void}
 */
function setupOkButtons() {
  const okBtn = $("ok-button");
  if (okBtn) okBtn.addEventListener("click", handleEditOkClick);
  const editOkBtn = $("edit-ok-button");
  if (editOkBtn) editOkBtn.addEventListener("click", handleEditOkClick);
}

/**
 * Persist a new task to Firebase under /tasks and start the create-flow UI.
 * @param {FullTask} taskData
 * @returns {void}
 */
function sendTaskToFirebase(taskData) {
  const tasksRef = ref(db, "tasks");
  const newRef = push(tasksRef);
  const task = { ...taskData, createdAt: new Date().toISOString() };
  set(newRef, task)
    .then(() => { showBanner(); finishCreateFlow(); })
    .catch((e) => console.error("Fehler beim Speichern:", e));
}

/**
 * Update an existing task in Firebase and start the update-flow UI.
 * @param {string} taskId
 * @param {FullTask} taskData
 * @returns {void}
 */
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