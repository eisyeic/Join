/**
 * Initialize all dropdown outside-click handlers for add/edit task overlays.
 * @returns {void}
 */
(function initDropdownHandlers() {
  setupDropdownOutsideCloseIn($('overlay-add-task'));
  const editWrapper = document.querySelector('#task-overlay .edit-addtask-wrapper');
  if (editWrapper) setupDropdownOutsideCloseIn(editWrapper);
})();

/**
 * Hide the category dropdown panel.
 * @param {HTMLElement} scope - The container element.
 * @returns {void}
 */
function hideCategoryPanel(scope) {
  const panel = scope.querySelector('#category-selection');
  if (panel) panel.classList.add('d-none');
}

/**
 * Reset the category dropdown icon to down arrow.
 * @param {HTMLElement} scope - The container element.
 * @returns {void}
 */
function resetCategoryIcon(scope) {
  const icon = scope.querySelector('#category-icon');
  if (icon) {
    icon.classList.remove('arrow-up');
    icon.classList.add('arrow-down');
  }
}

/**
 * Close the category dropdown within a given container.
 * @param {HTMLElement} scope - The container element that holds the category dropdown and icon.
 * @returns {void}
 */
function closeCategoryDropdown(scope) {
  hideCategoryPanel(scope);
  resetCategoryIcon(scope);
}

/**
 * Hide the assigned contacts dropdown list.
 * @param {HTMLElement} scope - The container element.
 * @returns {void}
 */
function hideAssignedList(scope) {
  const list = scope.querySelector('#contact-list-box');
  if (list) list.classList.add('d-none');
}

/**
 * Reset the assigned dropdown icon to down arrow.
 * @param {HTMLElement} scope - The container element.
 * @returns {void}
 */
function resetAssignedIcon(scope) {
  const icon = scope.querySelector('#assigned-icon');
  if (icon) {
    icon.classList.remove('arrow-up');
    icon.classList.add('arrow-down');
  }
}

/**
 * Update the initials display based on selected contacts.
 * @param {HTMLElement} scope - The container element.
 * @returns {void}
 */
function updateInitialsDisplay(scope) {
  if (typeof applyAssignedInitialsCap === 'function') applyAssignedInitialsCap();
  const initialsBox = scope.querySelector('#contact-initials');
  if (initialsBox) {
    const selected = scope.querySelectorAll('#contact-list-box li.selected');
    initialsBox.classList.toggle('d-none', selected.length === 0);
  }
}

/**
 * Close the assigned contacts dropdown within a given container and update the initials UI.
 * @param {HTMLElement} scope - The container element that holds the assigned contacts dropdown and initials box.
 * @returns {void}
 */
function closeAssignedDropdown(scope) {
  hideAssignedList(scope);
  resetAssignedIcon(scope);
  updateInitialsDisplay(scope);
}

/**
 * Check if click target is within category dropdown elements.
 * @param {HTMLElement} container - The container element.
 * @param {HTMLElement} target - The click target.
 * @returns {boolean} True if click is within category dropdown.
 */
function isClickInCategoryDropdown(container, target) {
  const catSelect = container.querySelector('#category-select');
  const catPanel = container.querySelector('#category-selection');
  return (catSelect && catSelect.contains(target)) || (catPanel && catPanel.contains(target));
}

/**
 * Check if click target is within assigned dropdown elements.
 * @param {HTMLElement} container - The container element.
 * @param {HTMLElement} target - The click target.
 * @returns {boolean} True if click is within assigned dropdown.
 */
function isClickInAssignedDropdown(container, target) {
  const asSelect = container.querySelector('#assigned-select-box');
  const asList = container.querySelector('#contact-list-box');
  return (asSelect && asSelect.contains(target)) || (asList && asList.contains(target));
}

/**
 * Handle outside clicks for dropdowns within a container.
 * @param {HTMLElement} container - The container element.
 * @param {Event} e - The click event.
 * @returns {void}
 */
function handleDropdownOutsideClick(container, e) {
  const target = e.target;
  if (!container.contains(target)) return;
  
  const hasCategoryElements = container.querySelector('#category-select') || container.querySelector('#category-selection');
  const hasAssignedElements = container.querySelector('#assigned-select-box') || container.querySelector('#contact-list-box');
  
  if (hasCategoryElements && !isClickInCategoryDropdown(container, target)) {
    closeCategoryDropdown(container);
  }
  if (hasAssignedElements && !isClickInAssignedDropdown(container, target)) {
    closeAssignedDropdown(container);
  }
}

/**
 * Mark container as having outside click handler attached.
 * @param {HTMLElement} container - The container element.
 * @returns {void}
 */
function markHandlerAttached(container) {
  container.dataset.outsideCloserAttached = '1';
}

/**
 * Check if container already has outside click handler attached.
 * @param {HTMLElement} container - The container element.
 * @returns {boolean} True if handler is already attached.
 */
function hasHandlerAttached(container) {
  return container.dataset.outsideCloserAttached === '1';
}

/**
 * Attach an outside-click capture handler to close category and assigned dropdowns within a container.
 * Ensures only one handler is attached per container.
 * @param {HTMLElement} container - The container element (e.g., add-task overlay, edit overlay).
 * @returns {void}
 */
function setupDropdownOutsideCloseIn(container) {
  if (!container || hasHandlerAttached(container)) return;
  
  const onClickCapture = (e) => handleDropdownOutsideClick(container, e);
  container.addEventListener('click', onClickCapture, { capture: true });
  markHandlerAttached(container);
}

/**
 * Check if click is within subtask input zone.
 * @param {HTMLElement} scope - The container element.
 * @param {HTMLElement} target - The click target.
 * @returns {boolean} True if click is within subtask zone.
 */
function isClickInSubtaskZone(scope, target) {
  const subZone = scope.querySelector('.subtask-select');
  return subZone && subZone.contains(target);
}

/**
 * Save subtask if input has value (only in add mode).
 * @param {HTMLElement} scope - The container element.
 * @param {boolean} editMode - True if in edit mode.
 * @returns {void}
 */
function saveSubtaskIfNeeded(scope, editMode) {
  const input = scope.querySelector('#sub-input');
  if (!editMode && input && input.value.trim()) {
    if (typeof window.addSubtask === 'function') {
      window.addSubtask(input.value.trim());
    }
    input.value = '';
  }
}

/**
 * Reset subtask input UI to default state.
 * @param {HTMLElement} scope - The container element.
 * @returns {void}
 */
function resetSubtaskUI(scope) {
  const func = scope.querySelector('#subtask-func-btn');
  const plus = scope.querySelector('#subtask-plus-box');
  const input = scope.querySelector('#sub-input');
  
  if (func) func.classList.add('d-none');
  if (plus) plus.classList.remove('d-none');
  if (input) input.blur();
}

/**
 * Handle clicks outside the subtask input zone.
 * - In add mode, saves a subtask if input has value.
 * - Always resets the subtask input UI.
 * @param {MouseEvent} event - The click event.
 * @param {boolean} [editMode=false] - True if in edit mode; prevents auto-add.
 * @returns {void}
 */
function handleSubtaskClickOutside(event, editMode = false) {
  const scope = event.currentTarget || document;
  
  if (isClickInSubtaskZone(scope, event.target)) return;
  
  saveSubtaskIfNeeded(scope, editMode);
  resetSubtaskUI(scope);
}