/** 
 * @file Initials and contact utilities for task edit overlay.
 * Contains assigned contacts handling, initials rendering, and contact resolution.
 */

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

// Import getSelectedIds from selection-helpers
import { getSelectedIds } from './selection-helpers.js';

// Expose global bridge only if not already provided by AddTask
if (typeof window !== 'undefined' && typeof window.applyAssignedInitialsCap !== 'function') {
  window.applyAssignedInitialsCap = () => applyAssignedInitialsCap('contact-initials', 5, defaultContactResolver);
}