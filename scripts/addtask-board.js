/**
 * Close the category dropdown within a given container.
 * @param {HTMLElement} scope - Container element that wraps the category UI.
 * @returns {void}
 */
function closeCategoryDropdown(scope) {
  const panel = scope.querySelector('#category-selection');
  const icon = scope.querySelector('#category-icon');
  if (panel) panel.classList.add('d-none');
  if (icon) {
    icon.classList.remove('arrow-up');
    icon.classList.add('arrow-down');
  }
}

/**
 * Close the assigned contacts dropdown within a given container and update UI.
 * @param {HTMLElement} scope - Container element that wraps the assigned UI.
 * @returns {void}
 */
function closeAssignedDropdown(scope) {
  const list = scope.querySelector('#contact-list-box');
  const icon = scope.querySelector('#assigned-icon');
  if (list) list.classList.add('d-none');
  if (typeof applyAssignedInitialsCap === 'function') applyAssignedInitialsCap();
  const initialsBox = scope.querySelector('#contact-initials');
  if (initialsBox) {
    const selected = scope.querySelectorAll('#contact-list-box li.selected');
    initialsBox.classList.toggle('d-none', selected.length === 0);
  }
  if (icon) {
    icon.classList.remove('arrow-up');
    icon.classList.add('arrow-down');
  }
}

/**
 * Attach a capture-phase outside-click handler for Category & Assigned inside a container.
 * @param {HTMLElement} container - Wrapper (e.g., #overlay-add-task or #task-overlay).
 * @returns {void}
 */
function setupDropdownOutsideCloseIn(container) {
  if (!container || container.dataset.outsideCloserAttached === '1') return;
  const onClickCapture = (e) => {
    const t = e.target;
    if (!container.contains(t)) return;
    const catSelect = container.querySelector('#category-select'), catPanel = container.querySelector('#category-selection'), asSelect = container.querySelector('#assigned-select-box'), asList = container.querySelector('#contact-list-box');
    const inCat = (catSelect && catSelect.contains(t)) || (catPanel && catPanel.contains(t)), inAs = (asSelect && asSelect.contains(t)) || (asList && asList.contains(t));
    if ((catSelect || catPanel) && !inCat) closeCategoryDropdown(container);
    if ((asSelect || asList) && !inAs) closeAssignedDropdown(container);
  };
  container.addEventListener('click', onClickCapture, { capture: true });
  container.dataset.outsideCloserAttached = '1';
}

/**
 * Handle subtask outside-click: save if input has value (add mode), then close UI.
 * In edit mode it only closes the UI.
 * @param {MouseEvent} event - Pointer/click event.
 * @param {boolean} [editMode=false] - When true, never adds a new subtask.
 * @returns {void}
 */
function handleSubtaskClickOutside(event, editMode = false) {
  const scope = event.currentTarget || document;
  const subZone = scope.querySelector('.subtask-select');
  if (subZone && subZone.contains(event.target)) return;
  const input = scope.querySelector('#sub-input');
  if (!editMode && input && input.value.trim()) {
    if (typeof window.addSubtask === 'function') window.addSubtask(input.value.trim());
    input.value = '';
  }
  const func = scope.querySelector('#subtask-func-btn');
  const plus = scope.querySelector('#subtask-plus-box');
  if (func) func.classList.add('d-none');
  if (plus) plus.classList.remove('d-none');
  if (input) input.blur();
}


/**
 * Initialize outside-click closing for Add-Task overlay.
 */
setupDropdownOutsideCloseIn($('overlay-add-task'));

/**
 * Initialize outside-click closing for Task overlay.
 */
setupDropdownOutsideCloseIn($('task-overlay'));

/**
 * Initialize outside-click closing for Edit-AddTask wrapper if it exists.
 */
const editWrapper = document.querySelector('#task-overlay .edit-addtask-wrapper');
if (editWrapper) setupDropdownOutsideCloseIn(editWrapper);
