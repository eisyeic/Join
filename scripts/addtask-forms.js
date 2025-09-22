/**
 * Add click listener to priority button.
 * @param {Element} button
 * @returns {void}
 */
function addPriorityClickListener(button) {
  button.addEventListener("click", () => {
    if (typeof handlePriorityClick === 'function') {
      handlePriorityClick(button);
    }
  });
}

/**
 * Setup priority button listeners.
 * @returns {void}
 */
function setupPriorityButtons() {
  const buttons = document.querySelectorAll(".priority-button");
  buttons.forEach(addPriorityClickListener);
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
  if (typeof clearAllPriorityActive === 'function') clearAllPriorityActive();
  if (typeof updateSelectedPriority === 'function') updateSelectedPriority("medium");
  const mediumButton = getMediumButton();
  if (mediumButton && typeof setButtonActive === 'function') {
    setButtonActive(mediumButton);
  }
}



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

/** Initialize category and global listeners */
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

/** Initialize subtask input and hover listeners */
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