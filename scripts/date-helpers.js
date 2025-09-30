/** 
 * @file Date utilities and bindings for task edit overlay.
 * Contains date conversion, input handling, and UI state management.
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