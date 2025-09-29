/**
 * @file Handles rendering and editing of subtasks in the Add Task form.
 * Provides normalization, rendering, editing, deleting and saving logic.
 */

/**
 * Normalize subtask input values into a clean string array.
 * @param {Array<string|{name:string}>} input
 * @returns {string[]}
 */
function normalizeSubtasks(input) {
  if (!input || typeof input === "undefined") return [];
  return input
    .map((st) => (typeof st === "string" ? st : st && st.name ? st.name : ""))
    .filter(Boolean);
}

/**
 * Render the subtask list into the DOM.
 * @param {string[]} list
 */
function renderSubtaskList(list) {
  const items = Array.isArray(list) ? list : [];
  document.getElementById("subtask-list").innerHTML = items.map((s, i) => getSubtaskItemTemplate(s, i)).join("");
}

/** Normalize, update and render the current subtasks with edit/delete events. */
function renderSubtasks() {
  let normalized = normalizeSubtasks(subtasks);
  subtasks = normalized;
  renderSubtaskList(normalized);
  addEditEvents();
  deleteEvent();
}

/** Attach edit handlers to all subtask edit icons. */
function addEditEvents() {
  document.querySelectorAll('.subtask-edit-icon').forEach((btn) => {
    btn.addEventListener('click', onEditClick);
  });
}

/**
 * Handler for clicking edit icon on a subtask.
 * @param {MouseEvent} e
 */
function onEditClick(e){ enterEditMode(e.currentTarget); }

/**
 * Enter editing mode for a subtask.
 * @param {HTMLElement} editBtn
 */
function enterEditMode(editBtn) {
  const item = editBtn.closest('.subtask-item');
  const input = item?.querySelector('.subtask-edit-input');
  if (!item || !input) return;
  showEditFields(item, input);
  setupEnterKeyToSave(input, item);
}

/**
 * Show the editable input field for a subtask and hide static text/icons.
 * @param {HTMLElement} item
 * @param {HTMLInputElement} input
 */
function showEditFields(item, input) {
  item.querySelector(".subtask-text")?.classList.add("d-none");
  input.classList.remove("d-none");
  input.classList.add("active");
  input.focus();
  input.select();
  item.classList.add("editing");
  item.querySelector(".first-spacer")?.classList.add("d-none");
  item.querySelector(".second-spacer")?.classList.remove("d-none");
  item.querySelector(".subtask-edit-icon")?.classList.add("d-none");
  item.querySelector(".subtask-save-icon")?.classList.remove("d-none");
}

/**
 * Setup Enter key handler to save edited subtask.
 * @param {HTMLInputElement} input
 * @param {HTMLElement} item
 */
function setupEnterKeyToSave(input, item) {
  const handler = (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const btn = item.querySelector('.subtask-save-icon');
    if (btn) saveEditedSubtask(btn);
    input.removeEventListener('keydown', handler);
  };
  input.addEventListener('keydown', handler);
}

/** Attach delete handlers to all subtask delete icons. */
function deleteEvent() {
  document.querySelectorAll('.subtask-delete-icon').forEach((btn) => {
    btn.addEventListener('click', () => onDeleteClick(btn));
  });
}

/**
 * Handle delete icon click: remove subtask and rerender.
 * @param {HTMLElement} btn
 */
function onDeleteClick(btn){
  const item = btn.closest('.subtask-item');
  if (!item) return;
  const index = Number(item.getAttribute('data-index'));
  if (!Number.isFinite(index)) return;
  subtasks.splice(index, 1);
  renderSubtasks();
}

/**
 * Save a subtask's new value, or remove if empty.
 * @param {HTMLElement} saveBtn
 */
function saveEditedSubtask(saveBtn) {
  const item = saveBtn.closest('.subtask-item');
  if (!item) return;
  const index = Number(item.getAttribute('data-index'));
  const input = item.querySelector('.subtask-edit-input');
  if (!Number.isFinite(index) || !input) return;
  const value = input.value.trim();
  if (!value) subtasks.splice(index, 1);
  else subtasks[index] = value;
  renderSubtasks();
}

/** Global subtasks array, shared across modules. */
window.subtasks = Array.isArray(window.subtasks) ? window.subtasks : []; 
let subtasks = window.subtasks; 

/** Utility object for external subtask manipulation. */
window.SubtaskIO = window.SubtaskIO || {
  set(index, value) { subtasks[index] = value; },
  remove(index) { subtasks.splice(index, 1); },
  rerender() { renderSubtasks(); }
};