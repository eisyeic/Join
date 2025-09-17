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
 * Bind date input handlers once (id: #datepicker).
 * @returns {void}
 */
export function ensureDateHandlersBound() {
  const input = /** @type {HTMLInputElement|null} */(document.getElementById('datepicker'));
  if (!input || input.dataset.editHandlersBound === '1') return;
  const wrapper = document.getElementById('datepicker-wrapper');
  const display = document.getElementById('date-display');
  const placeholder = document.getElementById('date-placeholder');
  bindDateFocus(input, display);
  bindDateBlur(input, wrapper, display, placeholder);
  bindDateWrapperClick(input, display);
  observeDisplayToSyncInput(input, display);
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
 * On blur: normalize value and reflect UI label/placeholder.
 * @param {HTMLInputElement} input
 * @param {HTMLElement|null} wrapper
 * @param {HTMLElement|null} display
 * @param {HTMLElement|null} placeholder
 * @returns {void}
 */
export function bindDateBlur(input, wrapper, display, placeholder) {
  input.addEventListener('blur', () => {
    const raw = input.value.trim();
    const iso = resolveIsoFromRaw(raw);
    const ddmmyyyy = iso ? isoToDDMMYYYY(iso) : '';
    input.type = 'date';
    input.value = iso || '';
    applyDateUIState(wrapper, display, placeholder, ddmmyyyy);
  });
}

/**
 * Open native picker synchronously in a user gesture.
 * @param {HTMLInputElement} input
 * @param {HTMLElement|null} display
 * @returns {void}
 */
export function bindDateWrapperClick(input, display) {
  const wrapper = document.getElementById('datepicker-wrapper');
  if (!wrapper) return;
  wrapper.addEventListener('pointerdown', (ev) => {
    if (typeof ev.button === 'number' && ev.button !== 0) return;
    ev.preventDefault();
    ev.stopPropagation();
    input.type = 'date';
    if (display && !/^\d{4}-\d{2}-\d{2}$/.test(input.value)) {
      const iso = ddmmyyyyToISO(display.textContent || "");
      if (iso) input.value = iso;
    }
    try {
      if (typeof input.showPicker === 'function') input.showPicker();
      else input.focus();
    } catch (_) {}
  }, { passive: false });
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
 * Apply visual state for date UI wrapper/label/placeholder.
 * @param {HTMLElement|null} wrapper
 * @param {HTMLElement|null} display
 * @param {HTMLElement|null} placeholder
 * @param {string} ddmmyyyy
 * @returns {void}
 */
export function applyDateUIState(wrapper, display, placeholder, ddmmyyyy) {
  const has = !!ddmmyyyy;
  wrapper?.classList.toggle('has-value', has);
  if (display) display.textContent = ddmmyyyy;
  if (placeholder) placeholder.style.display = has ? 'none' : '';
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
 * Render initials list or hide container if empty.
 * @param {HTMLElement} box
 * @param {any[]} assigned
 * @returns {void}
 */
export function renderInitials(box, assigned) {
  if (!assigned.length) return hideInitialsBox(box);
  box.innerHTML = assigned.map(initialsHtmlFromPerson).join("");
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
 * Toggle list item selected state and its check icon.
 * @param {HTMLElement} li
 * @param {Set<string>} idSet
 * @returns {void}
 */
export function toggleLiSelected(li, idSet) {
  const isSel = idSet.has(li.id);
  li.classList.toggle("selected", isSel);
  const img = li.querySelector("img");
  if (img) img.src = isSel ? "./assets/icons/add_task/check_white.svg" : "./assets/icons/add_task/check_default.svg";
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