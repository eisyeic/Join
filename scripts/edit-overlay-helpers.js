/** 
 * @file Shared helpers for task edit overlay.
 * Contains date utilities/bindings, assigned/initials UI, subtasks, and selection helpers.
 */

/* ---------- Date utils & bindings ---------- */

/**
 * Convert dd/mm/yyyy to yyyy-mm-dd.
 * @param {string} s
 * @returns {string}
 */
export function ddmmyyyyToISO(s) {
  const m = /^\s*(\d{2})\/(\d{2})\/(\d{4})\s*$/.exec(s || "");
  if (!m) return "";
  const [, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Convert yyyy-mm-dd to dd/mm/yyyy.
 * @param {string} s
 * @returns {string}
 */
export function isoToDDMMYYYY(s) {
  const m = /^\s*(\d{4})-(\d{2})-(\d{2})\s*$/.exec(s || "");
  if (!m) return "";
  const [, yyyy, mm, dd] = m;
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Bind date input handlers once (id: #datepicker)
 * @returns {void}
 */
export function ensureDateHandlersBound() {
  const input = getDateInput();
  if (!input || isAlreadyBound(input)) return;
  
  const elements = getDateElements();
  bindAllDateHandlers(input, elements);
  markAsBound(input);
}

/**
 * Gets date input element
 * @returns {HTMLInputElement|null}
 */
function getDateInput() {
  return document.getElementById('datepicker');
}

/**
 * Checks if handlers are already bound
 * @param {HTMLInputElement} input
 * @returns {boolean}
 */
function isAlreadyBound(input) {
  return input.dataset.editHandlersBound === '1';
}

/**
 * Gets all date-related elements
 * @returns {Object}
 */
function getDateElements() {
  return {
    wrapper: document.getElementById('datepicker-wrapper'),
    display: document.getElementById('date-display'),
    placeholder: document.getElementById('date-placeholder')
  };
}

/**
 * Binds all date handlers
 * @param {HTMLInputElement} input
 * @param {Object} elements
 */
function bindAllDateHandlers(input, elements) {
  bindDateFocus(input, elements.display);
  bindDateBlur(input, elements.wrapper, elements.display, elements.placeholder);
  bindDateWrapperClick(input, elements.display);
  observeDisplayToSyncInput(input, elements.display);
}

/**
 * Marks input as bound
 * @param {HTMLInputElement} input
 */
function markAsBound(input) {
  input.dataset.editHandlersBound = '1';
}

/**
 * Normalize and set type on focus (no picker).
 * @param {HTMLInputElement} input
 * @param {HTMLElement|null} display
 * @returns {void}
 */
export function bindDateFocus(input, display) {
  input.addEventListener('focus', () => {
    const val = input.value.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(val) && display) {
      const iso = ddmmyyyyToISO(display.textContent || "");
      if (iso) input.value = iso;
    }
    input.type = 'date';
  });
}

/**
 * On blur: normalize value and reflect UI label/placeholder
 * @param {HTMLInputElement} input
 * @param {HTMLElement|null} wrapper
 * @param {HTMLElement|null} display
 * @param {HTMLElement|null} placeholder
 * @returns {void}
 */
export function bindDateBlur(input, wrapper, display, placeholder) {
  input.addEventListener('blur', () => {
    const processedDate = processDateOnBlur(input);
    updateDateUI(wrapper, display, placeholder, processedDate.ddmmyyyy);
  });
}

/**
 * Processes date value on blur
 * @param {HTMLInputElement} input
 * @returns {Object}
 */
function processDateOnBlur(input) {
  const raw = input.value.trim();
  const iso = resolveIsoFromRaw(raw);
  const ddmmyyyy = iso ? isoToDDMMYYYY(iso) : '';
  
  input.type = 'date';
  input.value = iso || '';
  
  return { iso, ddmmyyyy };
}

/**
 * Updates date UI elements
 * @param {HTMLElement|null} wrapper
 * @param {HTMLElement|null} display
 * @param {HTMLElement|null} placeholder
 * @param {string} ddmmyyyy
 */
function updateDateUI(wrapper, display, placeholder, ddmmyyyy) {
  applyDateUIState(wrapper, display, placeholder, ddmmyyyy);
}

/**
 * Open native picker synchronously in a user gesture
 * @param {HTMLInputElement} input
 * @param {HTMLElement|null} display
 * @returns {void}
 */
export function bindDateWrapperClick(input, display) {
  const wrapper = getDateWrapper();
  if (!wrapper) return;
  
  wrapper.addEventListener('pointerdown', (ev) => {
    if (!isValidPointerEvent(ev)) return;
    
    handleWrapperClick(ev, input, display);
  }, { passive: false });
}

/**
 * Gets date wrapper element
 * @returns {HTMLElement|null}
 */
function getDateWrapper() {
  return document.getElementById('datepicker-wrapper');
}

/**
 * Validates pointer event
 * @param {PointerEvent} ev
 * @returns {boolean}
 */
function isValidPointerEvent(ev) {
  return !(typeof ev.button === 'number' && ev.button !== 0);
}

/**
 * Handles wrapper click event
 * @param {PointerEvent} ev
 * @param {HTMLInputElement} input
 * @param {HTMLElement|null} display
 */
function handleWrapperClick(ev, input, display) {
  ev.preventDefault();
  ev.stopPropagation();
  
  prepareInputForPicker(input, display);
  openDatePicker(input);
}

/**
 * Prepares input for date picker
 * @param {HTMLInputElement} input
 * @param {HTMLElement|null} display
 */
function prepareInputForPicker(input, display) {
  input.type = 'date';
  if (display && !/^\d{4}-\d{2}-\d{2}$/.test(input.value)) {
    const iso = ddmmyyyyToISO(display.textContent || "");
    if (iso) input.value = iso;
  }
}

/**
 * Opens date picker
 * @param {HTMLInputElement} input
 */
function openDatePicker(input) {
  try {
    if (typeof input.showPicker === 'function') {
      input.showPicker();
    } else {
      input.focus();
    }
  } catch (_) {}
}

/**
 * Observe display label and mirror value to the input.
 * @param {HTMLInputElement} input
 * @param {HTMLElement|null} display
 * @returns {void}
 */
export function observeDisplayToSyncInput(input, display) {
  if (!display) return;
  const mo = new MutationObserver(() => syncFromDisplayToInput(input, display));
  mo.observe(display, { characterData: true, childList: true, subtree: true });
}

/**
 * Sync label text -> input value (ISO).
 * @param {HTMLInputElement} input
 * @param {HTMLElement|null} display
 * @returns {void}
 */
export function syncFromDisplayToInput(input, display) {
  const ui = (display?.textContent || '').trim();
  const iso = ui ? ddmmyyyyToISO(ui) : '';
  input.type = 'date';
  input.value = iso || '';
}

/**
 * Normalize a raw date (ISO or dd/mm/yyyy) to ISO or empty.
 * @param {string} raw
 * @returns {string}
 */
export function resolveIsoFromRaw(raw) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) return ddmmyyyyToISO(raw);
  return '';
}

/**
 * Apply visual state for date UI wrapper/label/placeholder
 * @param {HTMLElement|null} wrapper
 * @param {HTMLElement|null} display
 * @param {HTMLElement|null} placeholder
 * @param {string} ddmmyyyy
 * @returns {void}
 */
export function applyDateUIState(wrapper, display, placeholder, ddmmyyyy) {
  const hasValue = hasDateValue(ddmmyyyy);
  updateWrapperState(wrapper, hasValue);
  updateDisplayText(display, ddmmyyyy);
  updatePlaceholderVisibility(placeholder, hasValue);
}

/**
 * Checks if date has value
 * @param {string} ddmmyyyy
 * @returns {boolean}
 */
function hasDateValue(ddmmyyyy) {
  return !!ddmmyyyy;
}

/**
 * Updates wrapper state
 * @param {HTMLElement|null} wrapper
 * @param {boolean} hasValue
 */
function updateWrapperState(wrapper, hasValue) {
  wrapper?.classList.toggle('has-value', hasValue);
}

/**
 * Updates display text
 * @param {HTMLElement|null} display
 * @param {string} text
 */
function updateDisplayText(display, text) {
  if (display) display.textContent = text;
}

/**
 * Updates placeholder visibility
 * @param {HTMLElement|null} placeholder
 * @param {boolean} hasValue
 */
function updatePlaceholderVisibility(placeholder, hasValue) {
  if (placeholder) placeholder.style.display = hasValue ? 'none' : '';
}

/**
 * Build ISO + UI strings from a raw dueDate.
 * @param {unknown} raw
 * @returns {{ iso: string, ddmmyyyy: string }}
 */
export function computeDateStrings(raw) {
  const isDdmy = typeof raw === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(raw);
  const ddmmyyyy = isDdmy ? raw : '';
  const iso = ddmmyyyy ? ddmmyyyyToISO(ddmmyyyy) : '';
  return { iso, ddmmyyyy };
}

/**
 * Put an ISO value into a date input.
 * @param {HTMLInputElement} input
 * @param {string} iso
 * @returns {void}
 */
export function applyDateInput(input, iso) {
  input.type = 'date';
  input.value = iso || '';
}

/* ---------- Assigned / initials ---------- */

/**
 * Pick assigned array from a task (supports two field names).
 * @param {any} task
 * @returns {any[]}
 */
export function getAssignedArray(task) {
  if (Array.isArray(task.assignedContacts)) return task.assignedContacts;
  if (Array.isArray(task.assigned)) return task.assigned;
  return [];
}

/**
 * Render initials list or hide container if empty
 * @param {HTMLElement} box
 * @param {any[]} assigned
 * @returns {void}
 */
export function renderInitials(box, assigned) {
  if (!assigned.length) {
    hideInitialsBox(box);
    return;
  }
  
  showInitialsBox(box, assigned);
}

/**
 * Shows initials box with content
 * @param {HTMLElement} box
 * @param {any[]} assigned
 */
function showInitialsBox(box, assigned) {
  setInitialsContent(box, assigned);
  makeBoxVisible(box);
}

/**
 * Sets initials content
 * @param {HTMLElement} box
 * @param {any[]} assigned
 */
function setInitialsContent(box, assigned) {
  box.innerHTML = assigned.map(initialsHtmlFromPerson).join("");
}

/**
 * Makes box visible
 * @param {HTMLElement} box
 */
function makeBoxVisible(box) {
  box.classList.remove("d-none");
}

/**
 * Hide initials box and clear content.
 * @param {HTMLElement} box
 * @returns {void}
 */
export function hideInitialsBox(box) {
  box.classList.add("d-none");
  box.innerHTML = "";
}

/**
 * Produce HTML for a single initials bubble.
 * @param {{name?:string, initials?:string, colorIndex?:number}} p
 * @returns {string}
 */
export function initialsHtmlFromPerson(p) {
  const name = p.name || "";
  const ini = (p.initials && String(p.initials).trim()) || computedInitials(name);
  const color = typeof p.colorIndex === "number" ? p.colorIndex : 1;
  return `<div class="contact-initial" style="background-image: url(../assets/icons/contact/color${color}.svg)">${ini}</div>`;
}

/**
 * Compute initials (2 letters) from a name string.
 * @param {string} name
 * @returns {string}
 */
export function computedInitials(name) {
  return name ? name.trim().split(/\s+/).map((x) => x[0]).join("").slice(0,2).toUpperCase() : "";
}

/* ---------- Subtasks ---------- */

/**
 * Normalize subtasks to a string array.
 * @param {Array<string|{name?:string}>} arr
 * @returns {string[]}
 */
export function normalizeSubtasks(arr) {
  return arr.map((st) => (typeof st === "string" ? st : st?.name || "")).filter(Boolean);
}

/**
 * Ensure global window.subtasks exists.
 * @returns {void}
 */
export function ensureGlobalSubtasks() {
  if (!Array.isArray(window.subtasks)) window.subtasks = [];
}

/**
 * Replace window.subtasks with a new list.
 * @param {string[]} list
 * @returns {void}
 */
export function overwriteGlobalSubtasks(list) {
  window.subtasks.length = 0;
  window.subtasks.push(...list);
}

/**
 * Render subtasks if global hook is present.
 * @returns {void}
 */
export function renderSubtasksIfAny() {
  if (typeof window.renderSubtasks === "function") window.renderSubtasks();
}

/* ---------- Selection helpers ---------- */

/**
 * Parse selected IDs from a dataset string.
 * @param {HTMLElement} selectBox
 * @returns {string[]}
 */
export function getSelectedIds(selectBox) {
  try { return JSON.parse(selectBox.dataset.selected || "[]") || []; } catch { return []; }
}

/**
 * Toggle list item selected state and its check icon
 * @param {HTMLElement} li
 * @param {Set<string>} idSet
 * @returns {void}
 */
export function toggleLiSelected(li, idSet) {
  const isSelected = determineSelectionState(li, idSet);
  updateListItemState(li, isSelected);
  updateCheckIcon(li, isSelected);
}

/**
 * Determines if item is selected
 * @param {HTMLElement} li
 * @param {Set<string>} idSet
 * @returns {boolean}
 */
function determineSelectionState(li, idSet) {
  return idSet.has(li.id);
}

/**
 * Updates list item selected state
 * @param {HTMLElement} li
 * @param {boolean} isSelected
 */
function updateListItemState(li, isSelected) {
  li.classList.toggle("selected", isSelected);
}

/**
 * Updates check icon based on selection
 * @param {HTMLElement} li
 * @param {boolean} isSelected
 */
function updateCheckIcon(li, isSelected) {
  const img = li.querySelector("img");
  if (img) {
    img.src = getCheckIconPath(isSelected);
  }
}

/**
 * Gets appropriate check icon path
 * @param {boolean} isSelected
 * @returns {string}
 */
function getCheckIconPath(isSelected) {
  return isSelected 
    ? "./assets/icons/add_task/check_white.svg" 
    : "./assets/icons/add_task/check_default.svg";
}

/** Resolve contact by id using global collections. */
export function defaultContactResolver(id) {
  if (window.contactsById && window.contactsById[id]) return window.contactsById[id];
  if (Array.isArray(window.contacts)) {
    const c = window.contacts.find((x) => String(x.id) === String(id));
    if (c) return c;
  }
  return { id, name: String(id) };
}

/** Get selected IDs from list items ('.selected') inside a list or by listId. */
export function getSelectedIdsFromList(listOrId = 'contact-list-box') {
  const list = typeof listOrId === 'string' ? document.getElementById(listOrId) : listOrId;
  if (!list) return [];
  return Array.from(list.querySelectorAll('li.selected')).map((li) => li.id).filter(Boolean);
}

/** Render initials from current selection (prefers list state; falls back to dataset). */
export function renderInitialsAuto(selectBoxId = 'assigned-select-box', initialsBoxId = 'contact-initials', listId = 'contact-list-box', resolver = defaultContactResolver, max = 5) {
  const selectBox = document.getElementById(selectBoxId);
  const initialsBox = document.getElementById(initialsBoxId);
  if (!initialsBox) return;
  const list = document.getElementById(listId);
  const ids = list ? getSelectedIdsFromList(list) : (selectBox ? getSelectedIds(selectBox) : []);
  const contacts = ids.map((id) => resolver(id)).filter(Boolean);
  renderInitials(initialsBox, contacts, max);
}

/** Watch selection changes and keep initials synced like AddTask. */
export function watchAssignedSelection(selectBoxId = 'assigned-select-box', initialsBoxId = 'contact-initials', resolver = defaultContactResolver, max = 5, listId = 'contact-list-box') {
  const selectBox = document.getElementById(selectBoxId);
  const initialsBox = document.getElementById(initialsBoxId);
  const list = document.getElementById(listId);
  if (!initialsBox) return;

  const rerender = () => renderInitialsAuto(selectBoxId, initialsBoxId, listId, resolver, max);

  // Initial paint
  rerender();

  // React to data-selected changes
  if (selectBox) {
    const moSel = new MutationObserver(rerender);
    moSel.observe(selectBox, { attributes: true, attributeFilter: ['data-selected'] });
  }

  // React to .selected toggles and list mutations
  if (list) {
    const moList = new MutationObserver(rerender);
    moList.observe(list, { attributes: true, attributeFilter: ['class'], subtree: true, childList: true });
  }

  // Optional custom event hook
  initialsBox.addEventListener('assigned:change', rerender);
}

/** Apply initials cap using current selection (bridge for AddTask-like behavior). */
export function applyAssignedInitialsCap(initialsBoxId = 'contact-initials', max = 5, resolver = defaultContactResolver) {
  renderInitialsAuto('assigned-select-box', initialsBoxId, 'contact-list-box', resolver, max);
}

// Expose global bridge only if not already provided by AddTask
if (typeof window !== 'undefined' && typeof window.applyAssignedInitialsCap !== 'function') {
  window.applyAssignedInitialsCap = () => applyAssignedInitialsCap('contact-initials', 5, defaultContactResolver);
}