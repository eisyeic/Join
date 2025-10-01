/**
 * @file task-edit-form.js
 * @description Form population and UI updates for task editing
 */
import { 
  computeDateStrings, applyDateInput, applyDateUIState,
  getAssignedArray, renderInitials
} from "./edit-overlay-helpers.js";
import { markEditingId } from "./task-edit-core.js";
import { setSubtasksArray } from "./task-edit-sync.js";

/**
 * Checks if custom edit mode function exists
 */
function hasCustomEditMode() {
  return typeof window.enterAddTaskEditMode === "function";
}

/**
 * Tries to use custom edit mode
 */
function tryCustomEditMode(task) {
  try {
    window.enterAddTaskEditMode(task);
    return true;
  } catch (e) {
    console.warn("enterAddTaskEditMode failed, using fallback", e);
    return false;
  }
}

/**
 * Uses custom edit mode if available
 */
function useCustomEditModeIfAvailable(task) {
  if (hasCustomEditMode()) {
    return tryCustomEditMode(task);
  }
  return false;
}

/**
 * Populate form (custom hook if available, else fallback)
 */
function populateEditForm(task) {
  if (!useCustomEditModeIfAvailable(task)) {
    populateEditFormFallback(task);
  }
}

/**
 * Validates task for form population
 */
function isValidTaskForPopulation(task) {
  return task !== null && task !== undefined;
}

/**
 * Populates basic form fields
 */
function populateBasicFields(task) {
  setTitleAndDescription(task);
  setDueDateField(task);
  setCategorySelection(task);
  setPriorityButtons(task);
}

/**
 * Populates relationship fields
 */
function populateRelationshipFields(task) {
  setAssignedContactsUI(task);
  setSubtasksArray(task);
}

/**
 * Fallback: set all fields based on task
 */
function populateEditFormFallback(task) {
  if (!isValidTaskForPopulation(task)) return;
  
  markEditingId(task);
  populateBasicFields(task);
  populateRelationshipFields(task);
}

/**
 * Gets title input element
 */
function getTitleElement() {
  return document.getElementById("addtask-title");
}

/**
 * Gets description textarea element
 */
function getDescriptionElement() {
  return document.getElementById("addtask-textarea");
}

/**
 * Sets title value
 */
function setTitleValue(element, task) {
  element.value = task.title || "";
}

/**
 * Sets description value
 */
function setDescriptionValue(element, task) {
  element.value = task.description || "";
}

/**
 * Set title & description
 */
function setTitleAndDescription(task) {
  const titleEl = getTitleElement();
  const descEl = getDescriptionElement();
  
  if (titleEl) setTitleValue(titleEl, task);
  if (descEl) setDescriptionValue(descEl, task);
}

/**
 * Gets datepicker element
 */
function getDatepickerElement() {
  return document.getElementById('datepicker');
}

/**
 * Gets date wrapper elements
 */
function getDateWrapperElements() {
  return {
    wrapper: document.getElementById('datepicker-wrapper'),
    display: document.getElementById('date-display'),
    placeholder: document.getElementById('date-placeholder')
  };
}

/**
 * Applies date input value
 */
function applyDateInputValue(dateEl, iso) {
  applyDateInput(dateEl, iso);
}

/**
 * Applies date UI state to elements
 */
function applyDateUIToElements(elements, ddmmyyyy) {
  applyDateUIState(
    elements.wrapper,
    elements.display,
    elements.placeholder,
    ddmmyyyy
  );
}

/**
 * Set due date
 */
function setDueDateField(task) {
  const dateEl = getDatepickerElement();
  if (!dateEl) return;
  
  const { iso, ddmmyyyy } = computeDateStrings(task?.dueDate);
  const elements = getDateWrapperElements();
  
  applyDateInputValue(dateEl, iso);
  applyDateUIToElements(elements, ddmmyyyy);
}

/**
 * Gets category select element
 */
function getCategorySelectElement() {
  return document.getElementById("category-select");
}

/**
 * Gets category span element
 */
function getCategorySpan(selectElement) {
  return selectElement ? selectElement.querySelector("span") : null;
}

/**
 * Gets category text or default
 */
function getCategoryText(task) {
  return task.category || "Select task category";
}

/**
 * Gets category value or empty string
 */
function getCategoryValue(task) {
  return task.category || "";
}

/**
 * Sets category span text
 */
function setCategorySpanText(span, text) {
  span.textContent = text;
}

/**
 * Sets category select value
 */
function setCategorySelectValue(select, value) {
  select.dataset.value = value;
}

/**
 * Set category selection
 */
function setCategorySelection(task) {
  const sel = getCategorySelectElement();
  const span = getCategorySpan(sel);
  
  if (span) setCategorySpanText(span, getCategoryText(task));
  if (sel) setCategorySelectValue(sel, getCategoryValue(task));
}

/**
 * Gets all priority buttons
 */
function getAllPriorityButtons() {
  return document.querySelectorAll(".prio-buttons .priority-button");
}

/**
 * Clears active state from all priority buttons
 */
function clearActivePriorityButtons() {
  getAllPriorityButtons().forEach((b) => b.classList.remove("active"));
}

/**
 * Gets priority button selector map
 */
function getPriorityButtonMap() {
  return { urgent: ".urgent-button", medium: ".medium-button", low: ".low-button" };
}

/**
 * Gets normalized priority key
 */
function getNormalizedPriorityKey(task) {
  return (task.priority || "medium").toLowerCase();
}

/**
 * Gets priority button selector
 */
function getPriorityButtonSelector(key) {
  const map = getPriorityButtonMap();
  return map[key] || ".medium-button";
}

/**
 * Activates priority button
 */
function activatePriorityButton(selector) {
  document.querySelector(selector)?.classList.add("active");
}

/**
 * Activate priority button
 */
function setPriorityButtons(task) {
  clearActivePriorityButtons();
  const key = getNormalizedPriorityKey(task);
  const selector = getPriorityButtonSelector(key);
  activatePriorityButton(selector);
}

/**
 * Gets contact initials box element
 */
function getContactInitialsBox() {
  return document.getElementById("contact-initials");
}

/**
 * Gets assigned select box element
 */
function getAssignedSelectBox() {
  return document.getElementById("assigned-select-box");
}

/**
 * Renders initials in box
 */
function renderInitialsInBox(initialsBox, assigned) {
  renderInitials(initialsBox, assigned);
}

/**
 * Extracts contact IDs from assigned array
 */
function extractContactIds(assigned) {
  return assigned.map((p) => p.id).filter(Boolean);
}

/**
 * Sets selected data on select box
 */
function setSelectedData(selectBox, contactIds) {
  selectBox.dataset.selected = JSON.stringify(contactIds);
}

/**
 * Render assigned contacts & persist selection
 */
function setAssignedContactsUI(task) {
  const assigned = getAssignedArray(task);
  const initialsBox = getContactInitialsBox();
  const selectBox = getAssignedSelectBox();
  
  if (initialsBox) renderInitialsInBox(initialsBox, assigned);
  if (selectBox) {
    const contactIds = extractContactIds(assigned);
    setSelectedData(selectBox, contactIds);
  }
}

export { populateEditForm };