import { getDatabase, ref, push, set, get, update } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { app, auth } from "./firebase.js";

let db = getDatabase(app);
let loadedContacts = {};
let currentEditingTaskId = "";

/**
 * Sets the current task ID that is being edited and mirrors it to the DOM wrapper dataset for cross-module access.
 * @param {string} id - The Firebase task id to edit. Use empty string to clear.
 */
window.setCurrentEditingTaskId = function (id) {
  currentEditingTaskId = id || "";
  const wrapper = document.querySelector('.addtask-wrapper');
  if (wrapper) wrapper.dataset.editingId = currentEditingTaskId;
};
/**
 * Returns the task id that is currently being edited. Falls back to wrapper dataset if needed.
 * @returns {string}
 */
window.getCurrentEditingTaskId = function () {
  return currentEditingTaskId;
};

loadContactsAndRender();

/**
 * Resolves the active editing id from in-memory state, global helpers, or DOM dataset.
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
 * Normalize a contact record by id.
 * @param {string} id
 * @returns {{id:string,name?:string,colorIndex?:number,initials:string}}
 */
function mapContact(id) {
  const c = loadedContacts[id] || {};
  const initials = c.initials || (c.name ? c.name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase() : "");
  return { id, name: c.name || String(id), colorIndex: c.colorIndex ?? 1, initials };
}

/**
 * Read selected contact ids from the dataset.
 * @returns {string[]}
 */
function getIdsFromDataset() {
  try {
    const raw = document.getElementById("assigned-select-box")?.dataset.selected || "[]";
    const ids = JSON.parse(raw);
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
}

/**
 * Collect assigned contacts from UI (selected lis or dataset).
 * @returns {Array<{id:string,name?:string,colorIndex?:number,initials:string}>}
 */
function getAssignedContactsFromUI() {
  const selectedLis = document.querySelectorAll("#contact-list-box li.selected");
  if (selectedLis.length > 0) return Array.from(selectedLis, li => mapContact(li.id));
  const ids = getIdsFromDataset();
  return ids.map(mapContact);
}


/**
 * Reads core task fields from the Add Task form and returns the base task payload (without contacts or editing meta).
 * @returns {{column:string,title:string,description:string,dueDate:string,category:string,priority:string,subtasks:{name:string,checked:boolean}[]}}
 */
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

/**
 * Shows the slide-in confirmation banner and dims the overlay.
 */
function showBanner() {
  const overlay = $("overlay-bg");
  const banner = $("slide-in-banner");
  if (overlay) overlay.style.display = "block";
  if (banner) banner.classList.add("visible");
}

/**
 * Hides the slide-in confirmation banner and restores overlay opacity.
 */
function hideBanner() {
  const overlay = $("overlay-bg");
  const banner = $("slide-in-banner");
  if (banner) banner.classList.remove("visible");
  if (overlay) overlay.style.display = "none";
}

/**
 * Completes the create-task flow: hides banner, resets UI, and navigates to board if needed.
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
 * Completes the update-task flow: hides banner/overlay and returns to board when appropriate.
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
 * Clears all validation error messages in the Add Task form.
 */
function resetFormErrors() {
  $("addtask-error").innerHTML = "";
  $("due-date-error").innerHTML = "";
  $("category-selection-error").innerHTML = "";
}

/**
 * Renders a single validation error and optionally highlights a field border.
 * @param {string} msgId - Element id that displays the message
 * @param {string} borderId - Element id whose border should turn into error color
 * @param {string} msg - Text to display
 */
function setError(msgId, borderId, msg) {
  $(msgId).innerHTML = msg;
  if (borderId) $(borderId).style.borderColor = "var(--error-color)";
}

/**
 * Auth listener to project user initials into the UI when available.
 */
onAuthStateChanged(auth, (user) => {
  if (window.updateUserInitials) {
    window.updateUserInitials(user);
  }
});

/**
 * Loads contacts from Firebase and renders them into the contact list box.
 */
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

/**
 * Filters the contact list as the user types in the contact input and re-renders the list.
 * @param {InputEvent} e
 */
function onContactInput(e) {
  const value = String(e.target.value || "").trim().toLowerCase();
  const listBox = $("contact-list-box");
  listBox.classList.remove("d-none");
  const filtered = {};
  if (value.length === 0) {
    Object.assign(filtered, loadedContacts);
  } else {
    for (const id in loadedContacts) {
      const contact = loadedContacts[id];
      const nameParts = String(contact.name || "").trim().toLowerCase().split(" ");
      if (nameParts.some((part) => part.startsWith(value))) {
        filtered[id] = contact;
      }
    }
  }
  listBox.innerHTML = "";
  renderContacts(filtered, listBox);
}

const contactInput = $("contact-input");
if (contactInput) {
  contactInput.addEventListener("input", onContactInput);
}

/**
 * Renders a contact dictionary into list items inside the provided container.
 * @param {Object.<string, {name:string,initials:string,colorIndex:number}>} contacts
 * @param {HTMLElement} container
 */
function renderContacts(contacts, container) {
  for (const id in contacts) {
    const contact = contacts[id];
    const li = createContactListItem(contact, id);
    container.appendChild(li);
  }
}

/**
 * Creates a single contact list item element with avatar and checkbox UI.
 * @param {{name:string,initials:string,colorIndex:number}} contact
 * @param {string} id
 * @returns {HTMLLIElement}
 */
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

/**
 * Attaches selection toggle behavior to a contact list item and updates the initials strip.
 * @param {HTMLLIElement} li
 */
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

/**
 * Renders up to three selected contact initials below the selector.
 */
function renderSelectedContactInitials() {
  let selectedLis = document.querySelectorAll("#contact-list-box li.selected");
  let contactInitialsBox = document.getElementById("contact-initials");
  contactInitialsBox.innerHTML = "";
  
  selectedLis.forEach((li) => {
    let initialsEl = li.querySelector(".contact-initial");
    if (initialsEl) {
      let clone = initialsEl.cloneNode(true);
      contactInitialsBox.appendChild(clone);
    }
  });
}


/**
 * Aggregates the full task payload from the form, including assigned contacts and editing id.
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
 * Validates the title field.
 * @param {{title:string}} data
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
 * Validates the due date field.
 * @param {{dueDate:string}} data
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
 * Validates the category dropdown selection.
 * @param {{category:string}} data
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
 * Validates that a priority has been selected.
 * @param {{priority:string}} data
 * @returns {boolean}
 */
function validatePriority(data) {
  return !!data.priority;
}

/**
 * Runs all form validators and returns the combined result.
 * @param {Object} data
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
 * Handles saving when editing: validates, preserves column, and updates the task.
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
 * Handles creating a new task from the Add Task form after validation.
 */
function handleCreateClick() {
  const data = collectFormData();
  if (!validateFormData(data)) return;
  sendTaskToFirebase(data);
  if (!window.location.pathname.endsWith("addtask.html")) window.toggleAddTaskBoard();
}

const createBtn = $("create-button");
if (createBtn) createBtn.addEventListener("click", handleCreateClick);

/**
 * Wires explicit click handlers for save/edit OK buttons to prevent double triggers (no global delegation).
 */
const okBtn = $("ok-button");
if (okBtn) okBtn.addEventListener("click", handleEditOkClick);
const editOkBtn = $("edit-ok-button");
if (editOkBtn) editOkBtn.addEventListener("click", handleEditOkClick);

/**
 * Persists a new task to Firebase under /tasks and triggers the create flow UI.
 * @param {Object} taskData
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
 * Updates an existing task in Firebase and triggers the update flow UI.
 * @param {string} taskId
 * @param {Object} taskData
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
