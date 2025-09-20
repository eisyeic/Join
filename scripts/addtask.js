/**
 * @file Add Task – UI logic for date picker, priorities, categories, and subtasks.
 * All functions follow Single Responsibility Principle.
 * @typedef {Object} SubtaskItem
 * @property {string} name
 */
window.renderSubtasks = renderSubtasks;

/**
 * Document-level pointer capture for closing popovers/committing edits, etc.
 * Registered in capture phase to run before element handlers.
 * @param {PointerEvent} event
 * @returns {void}
 */
document.addEventListener('pointerdown', onDocumentPointerDown, true);

/**
 * Initialize the date picker once the Add-Task template is ready.
 * Note: this calls the setup function on template-ready dispatch.
 * @param {CustomEvent} event
 * @returns {void}
 */
document.addEventListener('addtask:template-ready', setupDatePicker());

/**
 * Initialize the date picker wrapper binding when the template is ready.
 * @param {CustomEvent} event
 * @returns {void}
 */
document.addEventListener('addtask:template-ready', setupDatePickerWrapper());


// Global variables
window.subtasks = Array.isArray(window.subtasks) ? window.subtasks : []; 
let subtasks = window.subtasks;
let selectedPriority = "medium";
const contactInitialsBox = document.querySelector(".contact-initials"); 

/**
 * Set subtask value by index.
 * @param {number} index
 * @param {string} value
 * @returns {void}
 */
function setSubtaskValue(index, value) {
  subtasks[index] = value;
}

/**
 * Remove subtask by index.
 * @param {number} index
 * @returns {void}
 */
function removeSubtaskByIndex(index) {
  subtasks.splice(index, 1);
}

/**
 * Re-render subtasks and rebind events.
 * @returns {void}
 */
function rerenderSubtasks() {
  renderSubtasks();
  addEditEvents();
}

/**
 * @typedef {Object} SubtaskIOAPI
 * @property {(index:number, value:string) => void} set - Set a subtask's value by index.
 * @property {(index:number) => void} remove - Remove a subtask by index.
 * @property {() => void} rerender - Re-render the subtask list and rebind handlers.
 */
/** @type {SubtaskIOAPI} */
window.SubtaskIO = window.SubtaskIO || {
  set: setSubtaskValue,
  remove: removeSubtaskByIndex,
  rerender: rerenderSubtasks
};

/**
 * Get today's date in ISO format.
 * @returns {string}
 */
function getTodayISO() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Set minimum date to today.
 * @param {HTMLInputElement} datePicker
 * @returns {void}
 */
function setDatePickerMin(datePicker) {
  datePicker.min = getTodayISO();
}

/**
 * Create date object from ISO string.
 * @param {string} isoDate
 * @returns {Date}
 */
function createDateFromISO(isoDate) {
  return new Date(isoDate + 'T00:00:00');
}

/**
 * Pad number with leading zero.
 * @param {number} num
 * @returns {string}
 */
function padWithZero(num) {
  return String(num).padStart(2, '0');
}

/**
 * Format date for display as DD/MM/YYYY.
 * @param {string} isoDate
 * @returns {string}
 */
function formatDateForDisplay(isoDate) {
  const d = createDateFromISO(isoDate);
  const day = padWithZero(d.getDate());
  const month = padWithZero(d.getMonth() + 1);
  return `${day}/${month}/${d.getFullYear()}`;
}

/**
 * Update date display text.
 * @param {HTMLElement} display
 * @param {string} formattedDate
 * @returns {void}
 */
function updateDisplayText(display, formattedDate) {
  display.textContent = formattedDate;
}

/**
 * Add has-value class to wrapper.
 * @param {HTMLElement} wrapper
 * @returns {void}
 */
function addHasValueClass(wrapper) {
  wrapper.classList.add('has-value');
}

/**
 * Remove has-value class from wrapper.
 * @param {HTMLElement} wrapper
 * @returns {void}
 */
function removeHasValueClass(wrapper) {
  wrapper.classList.remove('has-value');
}

/**
 * Clear date picker error styles.
 * @returns {void}
 */
function clearDatePickerErrors() {
  $("datepicker-wrapper").style.borderColor = "";
  $("due-date-error").innerHTML = "";
}

/**
 * Update date display and wrapper styles.
 * @param {HTMLInputElement} datePicker
 * @param {HTMLElement} wrapper
 * @param {HTMLElement} display
 * @returns {void}
 */
function updateDateDisplay(datePicker, wrapper, display) {
  if (datePicker.value) {
    const formatted = formatDateForDisplay(datePicker.value);
    updateDisplayText(display, formatted);
    addHasValueClass(wrapper);
    clearDatePickerErrors();
  } else {
    removeHasValueClass(wrapper);
  }
}

/**
 * Create sync function for date picker.
 * @param {HTMLInputElement} datePicker
 * @param {HTMLElement} wrapper
 * @param {HTMLElement} display
 * @returns {Function}
 */
function createSyncFunction(datePicker, wrapper, display) {
  return () => updateDateDisplay(datePicker, wrapper, display);
}

/**
 * Bind date picker events.
 * @param {HTMLInputElement} datePicker
 * @param {HTMLElement} wrapper
 * @param {HTMLElement} display
 * @returns {void}
 */
function bindDatePickerEvents(datePicker, wrapper, display) {
  const sync = createSyncFunction(datePicker, wrapper, display);
  datePicker.addEventListener('change', sync);
  datePicker.addEventListener('input', sync);
  sync();
}

/**
 * Get datepicker wrapper element.
 * @returns {HTMLElement|null}
 */
function getDatePickerWrapper() {
  return document.getElementById('datepicker-wrapper');
}

/**
 * Get datepicker input element.
 * @returns {HTMLInputElement|null}
 */
function getDatePickerInput() {
  return /** @type {HTMLInputElement} */(document.getElementById('datepicker'));
}

/**
 * Check if event is left mouse button.
 * @param {PointerEvent} ev
 * @returns {boolean}
 */
function isLeftMouseButton(ev) {
  return typeof ev.button !== 'number' || ev.button === 0;
}

/**
 * Prevent event default and propagation.
 * @param {Event} ev
 * @returns {void}
 */
function preventEventDefaults(ev) {
  ev.preventDefault();
  ev.stopPropagation();
}

/**
 * Set input type to date.
 * @param {HTMLInputElement} input
 * @returns {void}
 */
function setInputTypeDate(input) {
  input.type = 'date';
}

/**
 * Check if showPicker is available.
 * @param {HTMLInputElement} input
 * @returns {boolean}
 */
function hasShowPicker(input) {
  return typeof input.showPicker === 'function';
}

/**
 * Show date picker or focus input.
 * @param {HTMLInputElement} input
 * @returns {void}
 */
function showPickerOrFocus(input) {
  try {
    if (hasShowPicker(input)) {
      input.showPicker();
    } else {
      input.focus();
    }
  } catch (_) {
    // Ignore errors
  }
}

/**
 * Handle wrapper pointer down event.
 * @param {PointerEvent} ev
 * @param {HTMLInputElement} input
 * @returns {void}
 */
function handleWrapperPointerDown(ev, input) {
  if (!isLeftMouseButton(ev)) return;
  
  preventEventDefaults(ev);
  setInputTypeDate(input);
  showPickerOrFocus(input);
}

/**
 * Setup datepicker wrapper functionality.
 * @returns {void}
 */
function setupDatePickerWrapper() {
  const wrapper = getDatePickerWrapper();
  const input = getDatePickerInput();
  
  if (wrapper && input) {
    wrapper.addEventListener('pointerdown', (ev) => {
      handleWrapperPointerDown(ev, input);
    }, { passive: false });
  }
}

/**
 * Get all priority buttons.
 * @returns {NodeListOf<Element>}
 */
function getAllPriorityButtons() {
  return document.querySelectorAll(".priority-button");
}

/**
 * Remove active class from all priority buttons.
 * @returns {void}
 */
function clearAllPriorityActive() {
  getAllPriorityButtons().forEach((btn) => {
    btn.classList.remove("active");
  });
}

/**
 * Add active class to button.
 * @param {Element} button
 * @returns {void}
 */
function setButtonActive(button) {
  button.classList.add("active");
}

/**
 * Determine priority from button classes.
 * @param {Element} button
 * @returns {string}
 */
function getPriorityFromButton(button) {
  if (button.classList.contains("urgent-button")) return "urgent";
  if (button.classList.contains("medium-button")) return "medium";
  return "low";
}

/**
 * Update selected priority variable.
 * @param {string} priority
 * @returns {void}
 */
function updateSelectedPriority(priority) {
  selectedPriority = priority;
}

/**
 * Handle priority button click.
 * @param {Element} button
 * @returns {void}
 */
function handlePriorityClick(button) {
  clearAllPriorityActive();
  setButtonActive(button);
  const priority = getPriorityFromButton(button);
  updateSelectedPriority(priority);
}

/**
 * Add click listener to priority button.
 * @param {Element} button
 * @returns {void}
 */
function addPriorityClickListener(button) {
  button.addEventListener("click", () => handlePriorityClick(button));
}

/**
 * Setup priority button listeners.
 * @returns {void}
 */
function setupPriorityButtons() {
  getAllPriorityButtons().forEach(addPriorityClickListener);
}

/**
 * Get medium priority button.
 * @returns {Element|null}
 */
function getMediumButton() {
  return document.querySelector(".medium-button");
}

/**
 * Reset priority selection to medium.
 * @returns {void}
 */
function resetPrioritySelection() {
  clearAllPriorityActive();
  updateSelectedPriority("medium");
  const mediumButton = getMediumButton();
  if (mediumButton) {
    setButtonActive(mediumButton);
  }
}

// Initialize priority buttons
setupPriorityButtons();

/**
 * Get category selection items.
 * @returns {NodeListOf<Element>}
 */
function getCategoryItems() {
  return $("category-selection").querySelectorAll("li");
}

/**
 * Get category value from item.
 * @param {Element} item
 * @returns {string}
 */
function getCategoryValue(item) {
  return item.getAttribute("data-value") ?? "";
}

/**
 * Update category select text.
 * @param {string} value
 * @returns {void}
 */
function updateCategorySelectText(value) {
  $("category-select").querySelector("span").textContent = value;
}

/**
 * Hide category dropdown.
 * @returns {void}
 */
function hideCategoryDropdown() {
  $("category-selection").classList.add("d-none");
}

/**
 * Reset category icon to down arrow.
 * @returns {void}
 */
function resetCategoryIcon() {
  $("category-icon").classList.remove("arrow-up");
  $("category-icon").classList.add("arrow-down");
}

/**
 * Clear category error styles.
 * @returns {void}
 */
function clearCategoryErrors() {
  $("category-select").style.borderColor = "";
  $("category-selection-error").innerHTML = "";
}

/**
 * Handle category item click.
 * @param {Element} item
 * @returns {void}
 */
function handleCategoryItemClick(item) {
  const value = getCategoryValue(item);
  updateCategorySelectText(value);
  hideCategoryDropdown();
  resetCategoryIcon();
  clearCategoryErrors();
}

/**
 * Setup category item listeners.
 * @returns {void}
 */
function setupCategoryItems() {
  getCategoryItems().forEach((item) => {
    item.addEventListener("click", () => handleCategoryItemClick(item));
  });
}

/**
 * Handle global click events.
 * @param {MouseEvent} event
 * @returns {void}
 */
function handleGlobalClick(event) {
  handleCategoryClickOutside(event);
  handleAssignedClickOutside(event);
}

/**
 * Toggle category dropdown visibility.
 * @returns {void}
 */
function toggleCategoryDropdown() {
  $("category-selection").classList.toggle("d-none");
}

/**
 * Toggle category icon state.
 * @returns {void}
 */
function toggleCategoryIcon() {
  $("category-icon").classList.toggle("arrow-down");
  $("category-icon").classList.toggle("arrow-up");
}

/**
 * Handle category select click.
 * @returns {void}
 */
function handleCategorySelectClick() {
  toggleCategoryDropdown();
  toggleCategoryIcon();
}

// Initialize category and global listeners
setupCategoryItems();
document.addEventListener("click", handleGlobalClick);
$("category-select").addEventListener("click", handleCategorySelectClick);

/**
 * Check if input has text.
 * @param {HTMLInputElement} input
 * @returns {boolean}
 */
function inputHasText(input) {
  return input.value !== "";
}

/**
 * Show subtask function buttons.
 * @returns {void}
 */
function showSubtaskFuncButtons() {
  $("subtask-plus-box").classList.add("d-none");
  $("subtask-func-btn").classList.remove("d-none");
}

/**
 * Hide subtask function buttons.
 * @returns {void}
 */
function hideSubtaskFuncButtons() {
  $("subtask-plus-box").classList.remove("d-none");
  $("subtask-func-btn").classList.add("d-none");
}

/**
 * Handle subtask input change.
 * @param {HTMLInputElement} input
 * @returns {void}
 */
function handleSubtaskInputChange(input) {
  if (inputHasText(input)) {
    showSubtaskFuncButtons();
  } else {
    hideSubtaskFuncButtons();
  }
}

/**
 * Get subtask item from event target.
 * @param {EventTarget} target
 * @returns {Element|null}
 */
function getSubtaskItem(target) {
  return target.closest(".subtask-item");
}

/**
 * Get subtask function button from item.
 * @param {Element} item
 * @returns {Element|null}
 */
function getSubtaskFuncButton(item) {
  return item?.querySelector(".subtask-func-btn");
}

/**
 * Show subtask function button.
 * @param {Element} button
 * @returns {void}
 */
function showSubtaskButton(button) {
  button?.classList.remove("d-none");
}

/**
 * Hide subtask function button.
 * @param {Element} button
 * @returns {void}
 */
function hideSubtaskButton(button) {
  button?.classList.add("d-none");
}

/**
 * Handle subtask mouseover.
 * @param {MouseEvent} event
 * @returns {void}
 */
function handleSubtaskMouseover(event) {
  const item = getSubtaskItem(event.target);
  const button = getSubtaskFuncButton(item);
  showSubtaskButton(button);
}

/**
 * Handle subtask mouseout.
 * @param {MouseEvent} event
 * @returns {void}
 */
function handleSubtaskMouseout(event) {
  const item = getSubtaskItem(event.target);
  const button = getSubtaskFuncButton(item);
  hideSubtaskButton(button);
}

// Initialize subtask input and hover listeners
$("sub-input").addEventListener("input", function () {
  handleSubtaskInputChange(this);
});
$("subtask-list").addEventListener("mouseover", handleSubtaskMouseover);
$("subtask-list").addEventListener("mouseout", handleSubtaskMouseout);

/**
 * Clear title input border color.
 * @param {HTMLInputElement} input
 * @returns {void}
 */
function clearTitleBorderColor(input) {
  input.style.borderColor = "";
}

/**
 * Clear title error message.
 * @returns {void}
 */
function clearTitleError() {
  $("addtask-error").innerHTML = "";
}

/**
 * Handle title input change.
 * @param {HTMLInputElement} input
 * @returns {void}
 */
function handleTitleInputChange(input) {
  clearTitleBorderColor(input);
  clearTitleError();
}

/**
 * Clear title input value.
 * @returns {void}
 */
function clearTitleValue() {
  $("addtask-title").value = "";
}

/**
 * Clear description input.
 * @returns {void}
 */
function clearDescriptionValue() {
  $("addtask-textarea").value = "";
}

/**
 * Clear title and description inputs.
 * @returns {void}
 */
function clearTitleAndDescription() {
  clearTitleValue();
  clearTitleBorderColor($("addtask-title"));
  clearTitleError();
  clearDescriptionValue();
}

/**
 * Clear datepicker value.
 * @returns {void}
 */
function clearDatePickerValue() {
  const datePicker = $("datepicker");
  if (datePicker) {
    datePicker.value = "";
  }
}

/**
 * Clear datepicker wrapper class.
 * @returns {void}
 */
function clearDatePickerWrapperClass() {
  const wrapper = $("datepicker-wrapper");
  wrapper?.classList.remove("has-value");
}

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