/**
 * Clear datepicker error styles.
 * @returns {void}
 */
function clearDatePickerErrorStyles() {
  $("datepicker-wrapper").style.borderColor = "";
  $("due-date-error").innerHTML = "";
}

/**
 * Reset datepicker to default state.
 * @returns {void}
 */
function clearDatepicker() {
  clearDatePickerValue();
  clearDatePickerWrapperClass();
  clearDatePickerErrorStyles();
}

/**
 * Reset category select text.
 * @returns {void}
 */
function resetCategorySelectText() {
  $("category-select").querySelector("span").textContent = "Select task category";
}

/**
 * Clear category error styles.
 * @returns {void}
 */
function clearCategoryErrorStyles() {
  $("category-select").style.borderColor = "";
  $("category-selection-error").innerHTML = "";
}

/**
 * Reset category selection to default.
 * @returns {void}
 */
function clearCategory() {
  resetCategorySelectText();
  clearCategoryErrorStyles();
}

/**
 * Empty subtasks array.
 * @returns {void}
 */
function emptySubtasksArray() {
  subtasks.length = 0;
}

/**
 * Clear subtask input value.
 * @returns {void}
 */
function clearSubtaskInput() {
  $("sub-input").value = "";
}

/**
 * Reset subtask control visibility.
 * @returns {void}
 */
function resetSubtaskControls() {
  $("subtask-func-btn").classList.add("d-none");
  $("subtask-plus-box").classList.remove("d-none");
}

/**
 * Clear all subtasks and reset UI.
 * @returns {void}
 */
function clearSubtasks() {
  emptySubtasksArray();
  clearSubtaskInput();
  resetSubtaskControls();
  renderSubtasks();
}

/**
 * Reset assigned select box dataset.
 * @returns {void}
 */
function resetAssignedSelectBox() {
  const asb = $("assigned-select-box");
  if (asb) {
    asb.dataset.selected = "[]";
  }
}

/**
 * Hide contact list box.
 * @returns {void}
 */
function hideContactListBox() {
  $("contact-list-box").classList.add("d-none");
}

/**
 * Clear assigned contacts selection.
 * @returns {void}
 */
function clearAssigned() {
  clearAssignedContacts();
  resetAssignedSelectBox();
  hideContactListBox();
}

// Initialize title input listener
$("addtask-title").addEventListener("input", function () {
  handleTitleInputChange(this);
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

/**
 * Add a subtask when clicking the check icon; resets input and buttons, then re-renders.
 * @returns {void}
 */
$("sub-check").addEventListener("click", () => {
  const subtaskText = $("sub-input").value.trim();
  if (!subtaskText) return;
  subtasks.push(subtaskText);
  $("sub-input").value = "";
  $("subtask-func-btn").classList.add("d-none");
  $("subtask-plus-box").classList.remove("d-none");
  renderSubtasks();
});

/**
 * Add a subtask on Enter keypress inside the input; prevents form submission.
 * @param {KeyboardEvent} event
 * @returns {void}
 */
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
 * Delegated handler for clicks inside the subtask list; saves a subtask when its save icon is clicked.
 * @param {MouseEvent} event
 * @returns {void}
 */
$("subtask-list").addEventListener("click", (event) => {
  if (event.target.classList?.contains("subtask-save-icon")) {
    saveEditedSubtask(event.target);
  }
});

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