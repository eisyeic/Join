/**
 * Update task column attribute.
 * @param {HTMLElement} taskElement
 * @param {HTMLElement} newColumn
 * @returns {void}
 */
function updateTaskAttribute(taskElement, newColumn) {
  taskElement.dataset.column = DOM_TO_LOGICAL[newColumn.id] || taskElement.dataset.column;
}

/**
 * Move task DOM and update attributes.
 * @param {HTMLElement} taskElement
 * @param {HTMLElement} newColumn
 * @returns {void}
 */
function moveTaskDom(taskElement, newColumn) {
  moveTaskToColumn(taskElement, newColumn);
  updateTaskAttribute(taskElement, newColumn);
}

/**
 * Get Firebase reference for task.
 * @param {string} taskId
 * @returns {any}
 */
function getTaskRef(taskId) {
  return ref(db, `tasks/${taskId}`);
}

/**
 * Get logical column value from DOM ID.
 * @param {string} newColumnId
 * @returns {string}
 */
function getLogicalColumn(newColumnId) {
  return DOM_TO_LOGICAL[newColumnId] || "todo";
}

/**
 * Create update data for task.
 * @param {string} newColumnValue
 * @returns {object}
 */
function createUpdateData(newColumnValue) {
  return { column: newColumnValue, movedAt: Date.now() };
}

/**
 * Handle update error.
 * @param {Error} err
 * @returns {void}
 */
function handleUpdateError(err) {
  console.error("Fehler beim Aktualisieren der Spalte:", err);
}

/**
 * Update task column in Firebase.
 * @param {string} taskId
 * @param {string} newColumnId
 * @returns {Promise<void>}
 */
function updateTaskColumn(taskId, newColumnId) {
  const dbRef = getTaskRef(taskId);
  const newColumnValue = getLogicalColumn(newColumnId);
  const updateData = createUpdateData(newColumnValue);
  
  return update(dbRef, updateData).catch(handleUpdateError);
}

/**
 * Check if overflow should be shown.
 * @param {number} total
 * @param {number} maxShown
 * @returns {boolean}
 */
function shouldShowOverflow(total, maxShown) {
  return total > maxShown;
}

/**
 * Calculate overflow count.
 * @param {number} total
 * @param {number} maxShown
 * @returns {number}
 */
function computeOverflow(total, maxShown) {
  return shouldShowOverflow(total, maxShown) ? total - (maxShown - 1) : 0;
}

/**
 * Build overflow circle HTML.
 * @param {number} n
 * @param {string} posClass
 * @returns {string}
 */
function buildMoreCircle(n, posClass) {
  return `<div class="initial-circle ${posClass} initial-circle--more" title="+${n}">+${n}</div>`;
}

/**
 * Get contact color index.
 * @param {object} contact
 * @returns {number}
 */
function getContactColorIndex(contact) {
  return Number.isFinite(contact?.colorIndex) ? contact.colorIndex : 0;
}

/**
 * Get contact initials.
 * @param {object} contact
 * @returns {string}
 */
function getContactInitials(contact) {
  return contact?.initials || "";
}

/**
 * Get contact title.
 * @param {object} contact
 * @returns {string}
 */
function getContactTitle(contact) {
  const initials = getContactInitials(contact);
  return contact?.name || initials;
}

/**
 * Build initials circle HTML.
 * @param {object} c
 * @param {string} posClass
 * @returns {string}
 */
function buildInitialsCircle(c, posClass) {
  const colorIdx = getContactColorIndex(c);
  const initials = getContactInitials(c);
  const title = getContactTitle(c);
  return `<div class="initial-circle ${posClass}" style="background-image: url(../assets/icons/contact/color${colorIdx}.svg)" title="${title}">${initials}</div>`;
}

/**
 * Check if contacts array is valid.
 * @param {any} contacts
 * @returns {boolean}
 */
function isValidContactsArray(contacts) {
  return Array.isArray(contacts) && contacts.length > 0;
}

/**
 * Get contacts to show.
 * @param {any[]} contacts
 * @param {number} maxShown
 * @returns {any[]}
 */
function getContactsToShow(contacts, maxShown) {
  return contacts.slice(0, maxShown);
}

/**
 * Get position class for contact.
 * @param {number} idx
 * @returns {string}
 */
function getPositionClass(idx) {
  const positions = ["first-initial", "second-initial", "third-initial"];
  return positions[idx] || "";
}

/**
 * Check if should show overflow at index.
 * @param {boolean} hasOverflow
 * @param {number} idx
 * @param {number} maxShown
 * @returns {boolean}
 */
function shouldShowOverflowAtIndex(hasOverflow, idx, maxShown) {
  return hasOverflow && idx === maxShown - 1;
}

/**
 * Render single contact or overflow.
 * @param {object} contact
 * @param {number} idx
 * @param {boolean} hasOverflow
 * @param {number} overflowCount
 * @param {number} maxShown
 * @returns {string}
 */
function renderSingleContact(contact, idx, hasOverflow, overflowCount, maxShown) {
  const pos = getPositionClass(idx);
  if (shouldShowOverflowAtIndex(hasOverflow, idx, maxShown)) {
    return buildMoreCircle(overflowCount, pos);
  }
  return buildInitialsCircle(contact, pos);
}

/**
 * Render assigned initials for contacts.
 * @param {any[]} contacts
 * @returns {string}
 */
function renderAssignedInitials(contacts = []) {
  const maxShown = 3;
  if (!isValidContactsArray(contacts)) {
    return "";
  }
  const shown = getContactsToShow(contacts, maxShown);
  const hasOverflow = shouldShowOverflow(contacts.length, maxShown);
  const overflowCount = computeOverflow(contacts.length, maxShown);
  
  return shown.map((c, idx) => 
    renderSingleContact(c, idx, hasOverflow, overflowCount, maxShown)
  ).join("");
}

/**
 * Create debounced function.
 * @template {(...a:any[])=>any} F
 * @param {F} fn
 * @param {number} [wait=200]
 * @returns {F}
 */
function debounce(fn, wait = 200) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

/**
 * Extract search term from input.
 * @param {HTMLInputElement} input
 * @returns {string}
 */
function extractSearchTerm(input) {
  return (input.value || "").toLowerCase().trim();
}
