/**
 * @file Add Task – UI logic for date picker, priorities, categories, and subtasks.
 * Refactored into small, single-responsibility functions (≤14 lines) with JSDoc.
 * @typedef {Object} SubtaskItem
 * @property {string} name
 */
window.renderSubtasks = renderSubtasks;

/**
 * Global event wiring for Add-Task UI (template readiness & document-level pointer handling).
 */
document.addEventListener('pointerdown', onDocumentPointerDown, true);
document.addEventListener('addtask:template-ready', setupDatePicker());
document.addEventListener('addtask:template-ready', setupDatePickerWrapper());

// Global variables
window.subtasks = Array.isArray(window.subtasks) ? window.subtasks : []; 
let subtasks = window.subtasks;
let selectedPriority = "medium";
const contactInitialsBox = document.querySelector(".contact-initials"); 

/**
 * @typedef {Object} SubtaskIOAPI
 * @property {(index:number, value:string) => void} set - Set a subtask's value by index.
 * @property {(index:number) => void} remove - Remove a subtask by index.
 * @property {() => void} rerender - Re-render the subtask list and rebind handlers.
 */
/** @type {SubtaskIOAPI} */
window.SubtaskIO = window.SubtaskIO || {
  set(index, value) { subtasks[index] = value; },
  remove(index) { subtasks.splice(index, 1); },
  rerender() { renderSubtasks(); addEditEvents(); }
};

/**
 * Apply min attribute (today) to the native date input.
 * @param {HTMLInputElement} datePicker
 * @returns {void}
 */
function setDatePickerMin(datePicker) {
  const today = new Date().toISOString().split('T')[0];
  datePicker.min = today;
}

/**
 * Format a YYYY-MM-DD into DD/MM/YYYY for UI display.
 * @param {string} isoDate
 * @returns {string}
 */
function formatDateForDisplay(isoDate) {
  const d = new Date(isoDate + 'T00:00:00');
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getFullYear()}`;
}

/**
 * Update the date display and wrapper styles based on picker value.
 * @param {HTMLInputElement} datePicker
 * @returns {void}
 */
function updateDateDisplay(datePicker, wrapper, display) {
  if (datePicker.value) {
    display.textContent = formatDateForDisplay(datePicker.value);
    wrapper.classList.add('has-value');
    $("datepicker-wrapper").style.borderColor = "";
    $("due-date-error").innerHTML = "";
  } else {
    wrapper.classList.remove('has-value');
  }
}

/**
 * Bind change/input listeners to a date picker to keep UI in sync.
 * @param {HTMLInputElement} datePicker
 * @returns {void}
 */
function bindDatePickerEvents(datePicker, wrapper, display) {
  const sync = () => updateDateDisplay(datePicker, wrapper, display);
  datePicker.addEventListener('change', sync);
  datePicker.addEventListener('input', sync);
  sync();
}

/**
 * Wire the wrapper so clicking it opens the native datepicker (or focuses it as fallback).
 * @returns {void}
 */
function setupDatePickerWrapper() {
const wrapper = document.getElementById('datepicker-wrapper');
const input   = /** @type {HTMLInputElement} */(document.getElementById('datepicker'));

if (wrapper && input) {
  wrapper.addEventListener('pointerdown', (ev) => {
    if (typeof ev.button === 'number' && ev.button !== 0) return;
    ev.preventDefault();
    ev.stopPropagation();
    input.type = 'date';
    try {
      if (typeof input.showPicker === 'function') {
        input.showPicker(); 
      } else {
        input.focus(); 
      }
    } catch (_) {
    }
  }, { passive: false });
}
}

// Priority buttons: set active state and update selectedPriority
document.querySelectorAll(".priority-button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".priority-button").forEach((btn) => {
      btn.classList.remove("active");
    });
    button.classList.add("active");
    selectedPriority = button.classList.contains("urgent-button") ? "urgent" : button.classList.contains("medium-button") ? "medium" : "low";
  });
});

/**
 * Reset priority buttons to default (medium) and active state.
 * @returns {void}
 */
function resetPrioritySelection() {
  document.querySelectorAll(".priority-button").forEach((btn) => btn.classList.remove("active"));
  selectedPriority = "medium";
  const mediumButton = document.querySelector(".medium-button");
  if (mediumButton) mediumButton.classList.add("active");
}

// Handle category option clicks and update the select label
$("category-selection").querySelectorAll("li").forEach((item) => {
  item.addEventListener("click", () => {
    const value = item.getAttribute("data-value") ?? "";
    $("category-select").querySelector("span").textContent = value;
    $("category-selection").classList.add("d-none");
    $("category-icon").classList.remove("arrow-up");
    $("category-icon").classList.add("arrow-down");
    $("category-select").style.borderColor = "";
    $("category-selection-error").innerHTML = "";
  });
});

// Global click: close dropdowns if clicking outside their areas
document.addEventListener("click", (event) => {
  handleCategoryClickOutside(event);
  handleAssignedClickOutside(event);
});

// Toggle the category dropdown when clicking the select
$("category-select").addEventListener("click", () => {
  $("category-selection").classList.toggle("d-none");
  $("category-icon").classList.toggle("arrow-down");
  $("category-icon").classList.toggle("arrow-up");
});

// Toggle subtask input action buttons based on content presence
$("sub-input").addEventListener("input", function () {
  if (this.value !== "") {
    $("subtask-plus-box").classList.add("d-none");
    $("subtask-func-btn").classList.remove("d-none");
  } else {
    $("subtask-plus-box").classList.remove("d-none");
    $("subtask-func-btn").classList.add("d-none");
  }
});

// Reveal subtask controls on hover
$("subtask-list").addEventListener("mouseover", (event) => {
  const item = event.target.closest(".subtask-item");
  item?.querySelector(".subtask-func-btn")?.classList.remove("d-none");
});

// Hide subtask controls when leaving the item
$("subtask-list").addEventListener("mouseout", (event) => {
  const item = event.target.closest(".subtask-item");
  item?.querySelector(".subtask-func-btn")?.classList.add("d-none");
});

// Clear title error styles on user input
$("addtask-title").addEventListener("input", function () {
  this.style.borderColor = "";
  $("addtask-error").innerHTML = "";
});

// Reset the entire Add Task form to defaults
$("cancel-button").addEventListener("click", () => {
  $("addtask-title").value = "";
  $("addtask-title").style.borderColor = "";
  $("addtask-error").innerHTML = "";
  $("addtask-textarea").value = "";
  const datePicker = $("datepicker");
  const wrapper = $("datepicker-wrapper");
  if (datePicker) {
    datePicker.value = "";
    wrapper?.classList.remove('has-value');
  }
  $("datepicker-wrapper").style.borderColor = "";
  $("due-date-error").innerHTML = "";
  $("category-select").querySelector("span").textContent = "Select task category";
  $("category-select").style.borderColor = "";
  $("category-selection-error").innerHTML = "";
  subtasks.length = 0;
  $("sub-input").value = "";
  $("subtask-func-btn").classList.add("d-none");
  $("subtask-plus-box").classList.remove("d-none");
  renderSubtasks();
  clearAssignedContacts();
  const asb = $("assigned-select-box");
  if (asb) asb.dataset.selected = "[]";
  $("contact-list-box").classList.add("d-none");
  resetPrioritySelection();
});

/**
 * Attach edit click listeners for all subtask edit icons.
 * @returns {void}
 */
function addEditEvents() {
  document.querySelectorAll(".subtask-edit-icon").forEach((editBtn) => {
    editBtn.addEventListener("click", () => enterEditMode(editBtn));
  });
}
window.addEditEvents = addEditEvents;

/**
 * Put a subtask item into edit mode and bind Enter-to-save.
 * @param {HTMLElement} editBtn
 * @returns {void}
 */
function enterEditMode(editBtn) {
  const item = editBtn.closest(".subtask-item");
  const input = item?.querySelector(".subtask-edit-input");
  if (!item || !input) return;
  showEditFields(item, input);
  setupEnterKeyToSave(input, item);
}
window.enterEditMode = enterEditMode;

/**
 * Reveal edit input fields for a subtask item and focus the input.
 * @param {HTMLElement} item
 * @param {HTMLInputElement} input
 * @returns {void}
 */
function showEditFields(item, input) {
  item.querySelector(".subtask-text")?.classList.add("d-none");
  input.classList.remove("d-none");
  input.classList.add("active");
  input.focus();
  input.select();
  item.classList.add("editing");
  item.querySelector(".first-spacer")?.classList.add("d-none");
  item.querySelector(".second-spacer")?.classList.remove("d-none");
  item.querySelector(".subtask-edit-icon")?.classList.add("d-none");
  item.querySelector(".subtask-save-icon")?.classList.remove("d-none");
}

/**
 * Bind Enter key on the edit input to trigger save for the subtask.
 * @param {HTMLInputElement} input
 * @param {HTMLElement} item
 * @returns {void}
 */
function setupEnterKeyToSave(input, item) {
  const handler = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const saveBtn = item.querySelector(".subtask-save-icon");
      if (saveBtn) saveEditedSubtask(saveBtn);
      input.removeEventListener("keydown", handler);
    }
  };
  input.addEventListener("keydown", handler);
}

// Add a subtask via the check icon
$("sub-check").addEventListener("click", () => {
  const subtaskText = $("sub-input").value.trim();
  if (!subtaskText) return;
  subtasks.push(subtaskText);
  $("sub-input").value = "";
  $("subtask-func-btn").classList.add("d-none");
  $("subtask-plus-box").classList.remove("d-none");
  renderSubtasks();
});

// Add a subtask when pressing Enter in the input
$("sub-input").addEventListener("keydown", function (event) {
  if (event.key !== "Enter") return;
  event.preventDefault();
  const subtaskText = this.value.trim();
  if (!subtaskText) return;
  subtasks.push(subtaskText);
  this.value = "";
  $("subtask-func-btn").classList.add("d-none");
  $("subtask-plus-box").classList.remove("d-none");
  renderSubtasks();
});

/**
 * Read edit context from a save button inside a subtask item.
 * @param {HTMLElement} saveBtn
 * @returns {{ index:number|null, input: HTMLInputElement|null, item: HTMLElement|null }}
 */
function getEditContext(saveBtn) {
  const item = saveBtn.closest('.subtask-item');
  const input = item ? item.querySelector('.subtask-edit-input') : null;
  const index = item ? Number(item.getAttribute('data-index')) : NaN;
  return { index: Number.isFinite(index) ? index : null, input: /** @type {HTMLInputElement|null} */(input), item };
}

/**
 * Apply the edited value into the subtasks array (delete if empty).
 * @param {number} index
 * @param {string} value
 * @returns {void}
 */
function applyEditedSubtask(index, value) {
  const trimmed = value.trim();
  if (!trimmed) {
    subtasks.splice(index, 1);
  } else {
    subtasks[index] = trimmed;
  }
}

/**
 * Persist an edited subtask triggered by clicking the save icon.
 * @param {HTMLElement} saveBtn
 * @returns {void}
 */
function saveEditedSubtask(saveBtn) {
  const { index, input } = getEditContext(saveBtn);
  if (index === null || !input) return;
  applyEditedSubtask(index, input.value);
  renderSubtasks();
  addEditEvents();
}
window.saveEditedSubtask = saveEditedSubtask;

/**
 * Delegated handler to save a subtask when its save icon is clicked.
 * @returns {void}
 */
$("subtask-list").addEventListener("click", (event) => {
  if (event.target.classList?.contains("subtask-save-icon")) {
    saveEditedSubtask(event.target);
  }
});

/**
 * Build the HTML for the subtask list.
 * @param {string[]} items
 * @returns {string}
 */
function buildSubtasksHTML(items) {
  return items
    .map((subtask, index) => (
      `\n      <li class="subtask-item" data-index="${index}">\n        <span class="subtask-text">${subtask}</span>\n        <input class="subtask-edit-input d-none" type="text" id="sub${index}" value="${subtask}" />\n        <div class="subtask-func-btn d-none">\n          <img class="subtask-edit-icon" src="./assets/icons/add_task/edit_default.svg" alt="Edit"/>\n          <div class="vertical-spacer first-spacer"></div>\n          <img class="subtask-delete-icon" src="./assets/icons/add_task/delete_default.svg" alt="Delete" />\n          <div class="vertical-spacer second-spacer d-none"></div>\n          <img class="subtask-save-icon d-none" src="./assets/icons/add_task/sub_check_def.svg" alt="Save" />\n        </div>\n      </li>`
    ))
    .join("");
}

/**
 * Attach edit/delete handlers after rendering the list.
 * @returns {void}
 */
function attachSubtaskHandlers() {
  addEditEvents();
  deleteEvent();
}

/**
 * Commit edits of any subtask items currently in editing state when clicking outside.
 * @param {EventTarget} target
 * @returns {boolean} True if any edit was committed.
 */
function commitEditingSubtasksOutside(target) {
  const editingItems = document.querySelectorAll('.subtask-item.editing');
  let committed = false;
  editingItems.forEach((item) => {
    if (!item.contains(target)) {
      const saveBtn = item.querySelector('.subtask-save-icon');
      if (saveBtn) { window.saveEditedSubtask(saveBtn); committed = true; }
    }
  });
  return committed;
}

/**
 * If the new-subtask input has text and click is outside input & controls, add the subtask.
 * @param {EventTarget} target
 * @returns {void}
 */
function autoAddNewSubtaskIfPending(target) {
  const subInput = document.getElementById('sub-input');
  if (!subInput || !subInput.value.trim()) return;
  const funcBox = document.getElementById('subtask-func-btn');
  const outside = !(subInput.contains(target) || (funcBox && funcBox.contains(target)));
  if (outside) document.getElementById('sub-check')?.click();
}