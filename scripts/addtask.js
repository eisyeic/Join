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