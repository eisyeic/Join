/**
 * @file Edit Overlay logic for tasks.
 * Handles switching to edit mode, populating the form, attaching handlers,
 * and synchronizing data with Firebase.
 */

/**
 * Opens the edit overlay and loads the task into the form.
 * @param {object|string} taskOrId - Task object or task ID (string).
 * @returns {void}
 */
function openEditInsideOverlay(taskOrId) {
  switchToEditView();
  moveFormIntoEdit();
  attachEditDateInputHandlers();

  if (typeof taskOrId === 'string') {
    loadTaskById(taskOrId).then((task) => {
      if (!task) return;
      task.id = taskOrId;
      proceedEditWithTask(task);
    });
  } else if (taskOrId && typeof taskOrId === 'object') {
    proceedEditWithTask(taskOrId);
  }
}

/**
 * Continues editing with a loaded task object.
 * @param {any} task - Task object.
 * @returns {void}
 */
function proceedEditWithTask(task) {
  attachEditDateInputHandlers();
  markEditingId(task);
  populateEditForm(task);
  if (typeof window.applyAssignedInitialsCap === 'function') {
    queueMicrotask(() => applyAssignedInitialsCap());
  }
  setTimeout(() => {
    populateEditForm(task);
    if (typeof window.applyAssignedInitialsCap === 'function') applyAssignedInitialsCap();
  }, 0);
  syncAssignedSelectionToList();
  if (typeof window.addEditEvents === 'function') window.addEditEvents();
}

/**
 * Switches overlay view from content to edit mode.
 * @returns {void}
 */
function switchToEditView() {
  const taskContent = document.getElementById("task-overlay-content");
  const editWrap = document.querySelector(".edit-addtask-wrapper");
  taskContent?.classList.add("d-none");
  editWrap?.classList.remove("d-none");
}

/**
 * Moves the Add Task form into the edit container.
 * @returns {void}
 */
function moveFormIntoEdit() {
  const src =
    document.querySelector(".addtask-aside-clone .addtask-wrapper") ||
    document.querySelector(".edit-addtask .addtask-wrapper");
  const dst = document.querySelector(".edit-addtask");
  if (src && dst && src.parentElement !== dst) dst.replaceChildren(src);
}

/**
 * Convert a dd/mm/yyyy string to ISO yyyy-mm-dd.
 * @param {string} s
 * @returns {string} ISO string or empty string if invalid.
 */
function ddmmyyyyToISO(s) {
  const m = /^\s*(\d{2})\/(\d{2})\/(\d{4})\s*$/.exec(s || "");
  if (!m) return "";
  const [, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Convert an ISO yyyy-mm-dd string to dd/mm/yyyy.
 * @param {string} s
 * @returns {string} dd/mm/yyyy or empty string if invalid.
 */
function isoToDDMMYYYY(s) {
  const m = /^\s*(\d{4})-(\d{2})-(\d{2})\s*$/.exec(s || "");
  if (!m) return "";
  const [, yyyy, mm, dd] = m;
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Attaches focus/blur handlers to the date input in edit mode.
 * @returns {void}
 */
function attachEditDateInputHandlers() {
  const input = /** @type {HTMLInputElement|null} */(document.getElementById('datepicker'));
  const wrapper = document.getElementById('datepicker-wrapper');
  const display = document.getElementById('date-display');
  const placeholder = document.getElementById('date-placeholder');
  if (!input) return;
  if (input.dataset.editHandlersBound === '1') return;

  // Ensure the input keeps a valid ISO value for native validation/valueAsDate,
  // while the UI shows dd/mm/yyyy in the display span.
  const syncFromDisplayToInput = () => {
    const ui = (display?.textContent || "").trim();
    const iso = ui ? ddmmyyyyToISO(ui) : "";
    input.type = 'date';
    input.value = iso || "";
  };

  input.addEventListener('focus', () => {
    // Keep type=date and ensure an ISO value for opening the native picker
    const val = input.value.trim();
    // If the text input somehow contains dd/mm/yyyy, normalize to ISO
    if (!/^\d{4}-\d{2}-\d{2}$/.test(val) && display) {
      const iso = ddmmyyyyToISO(display.textContent || "");
      if (iso) input.value = iso;
    }
    input.type = 'date';
    input.focus();
    if (typeof input.showPicker === 'function') {
      requestAnimationFrame(() => { try { input.showPicker(); } catch (_) {} });
    }
  });

  input.addEventListener('blur', () => {
    // Read current value (likely ISO because type=date), mirror UI as dd/mm/yyyy,
    // but KEEP the input as type=date with an ISO value so native validation works.
    const raw = input.value.trim();
    let iso = "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      iso = raw;
    } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
      iso = ddmmyyyyToISO(raw);
    }
    const ddmmyyyy = iso ? isoToDDMMYYYY(iso) : "";

    // Keep input as a valid date control
    input.type = 'date';
    input.value = iso || "";

    if (ddmmyyyy) {
      wrapper?.classList.add('has-value');
      if (display) display.textContent = ddmmyyyy;
      if (placeholder) placeholder.style.display = 'none';
    } else {
      wrapper?.classList.remove('has-value');
      if (display) display.textContent = '';
      if (placeholder) placeholder.style.display = '';
    }
  });

  if (wrapper) {
    wrapper.addEventListener('click', () => {
      input.type = 'date';
      // Make sure we have an ISO value before opening picker
      if (display && !/^\d{4}-\d{2}-\d{2}$/.test(input.value)) {
        const iso = ddmmyyyyToISO(display.textContent || "");
        if (iso) input.value = iso;
      }
      input.focus();
      if (typeof input.showPicker === 'function') {
        requestAnimationFrame(() => { try { input.showPicker(); } catch (_) {} });
      }
    });
  }

  // Also keep input in sync if someone updates the display text externally
  const mo = new MutationObserver(() => syncFromDisplayToInput());
  if (display) mo.observe(display, { characterData: true, childList: true, subtree: true });

  input.dataset.editHandlersBound = '1';
}

/**
 * Stores the currently editing task ID in the wrapper.
 * @param {any} task
 * @returns {void}
 */
function markEditingId(task) {
  const wrap = document.querySelector(".addtask-wrapper");
  if (wrap && task?.id) wrap.dataset.editingId = String(task.id);
}

/**
 * Populates the form with task data (via hook or fallback).
 * @param {any} task
 * @returns {void}
 */
function populateEditForm(task) {
  if (typeof window.enterAddTaskEditMode === "function") {
    try {
      window.enterAddTaskEditMode(task);
      return;
    } catch (e) {
      console.warn("enterAddTaskEditMode failed, using fallback", e);
    }
  }
  populateEditFormFallback(task);
}

/**
 * Fallback method to populate the form with task data.
 * @param {any} task
 * @returns {void}
 */
function populateEditFormFallback(task) {
  if (!task) return;
  markEditingId(task);
  setTitleAndDescription(task);
  setDueDateField(task);
  setCategorySelection(task);
  setPriorityButtons(task);
  setAssignedContactsUI(task);
  setSubtasksArray(task);
}

/**
 * Sets task title and description into form fields.
 * @param {any} task
 * @returns {void}
 */
function setTitleAndDescription(task) {
  const titleEl = document.getElementById("addtask-title");
  const descEl = document.getElementById("addtask-textarea");
  if (titleEl) /** @type {HTMLInputElement} */ (titleEl).value = task.title || "";
  if (descEl) /** @type {HTMLTextAreaElement} */ (descEl).value = task.description || "";
}

/**
 * Sets due date into the input field (dd/mm/yyyy).
 * @param {any} task
 * @returns {void}
 */
function setDueDateField(task) {
  const dateEl = /** @type {HTMLInputElement|null} */(document.getElementById('datepicker'));
  const wrapper = document.getElementById('datepicker-wrapper');
  const display = document.getElementById('date-display');
  const placeholder = document.getElementById('date-placeholder');
  if (!dateEl) return;

  // Task.dueDate is expected as dd/mm/yyyy; keep the input as a real date control with ISO value
  const ddmmyyyy = task?.dueDate && /^\d{2}\/\d{2}\/\d{4}$/.test(task.dueDate)
    ? task.dueDate
    : '';

  const iso = ddmmyyyy ? ddmmyyyyToISO(ddmmyyyy) : '';

  dateEl.type = 'date';
  dateEl.value = iso || '';

  if (ddmmyyyy) {
    wrapper?.classList.add('has-value');
    if (display) display.textContent = ddmmyyyy;
    if (placeholder) placeholder.style.display = 'none';
  } else {
    wrapper?.classList.remove('has-value');
    if (display) display.textContent = '';
    if (placeholder) placeholder.style.display = '';
  }
}

/**
 * Sets the category selection in the form.
 * @param {any} task
 * @returns {void}
 */
function setCategorySelection(task) {
  const sel = document.getElementById("category-select");
  const span = sel ? sel.querySelector("span") : null;
  if (span) span.textContent = task.category || "Select task category";
  if (sel) sel.dataset.value = task.category || "";
}

/**
 * Activates the correct priority button.
 * @param {any} task
 * @returns {void}
 */
function setPriorityButtons(task) {
  document.querySelectorAll(".prio-buttons .priority-button")
    .forEach((b) => b.classList.remove("active"));
  const map = { urgent: ".urgent-button", medium: ".medium-button", low: ".low-button" };
  const key = (task.priority || "medium").toLowerCase();
  document.querySelector(map[key] || ".medium-button")?.classList.add("active");
}

/**
 * Renders assigned contacts and saves the selection.
 * @param {any} task
 * @returns {void}
 */
function setAssignedContactsUI(task) {
  const assigned = Array.isArray(task.assignedContacts)
    ? task.assignedContacts
    : Array.isArray(task.assigned)
    ? task.assigned
    : [];
  const initialsBox = document.getElementById("contact-initials");
  const selectBox = document.getElementById("assigned-select-box");
  if (initialsBox) updateInitialsBox(initialsBox, assigned);
  if (selectBox) selectBox.dataset.selected = JSON.stringify(assigned.map((p) => p.id).filter(Boolean));
}

/**
 * Updates the initials preview element.
 * @param {HTMLElement} box
 * @param {any[]} assigned
 * @returns {void}
 */
function updateInitialsBox(box, assigned) {
  if (!assigned.length) {
    box.classList.add("d-none");
    box.innerHTML = "";
    return;
  }
  const html = assigned
    .map((p) => {
      const name = p.name || "";
      const ini =
        (p.initials && String(p.initials).trim()) ||
        (name ? name.trim().split(/\s+/).map((x) => x[0]).join("").slice(0, 2).toUpperCase() : "");
      const color = typeof p.colorIndex === "number" ? p.colorIndex : 1;
      return `<div class="contact-initial" style="background-image: url(../assets/icons/contact/color${color}.svg)">${ini}</div>`;
    })
    .join("");
  box.innerHTML = html;
  box.classList.remove("d-none");
}

/**
 * Syncs the global subtasks array with the task.
 * @param {any} task
 * @returns {void}
 */
function setSubtasksArray(task) {
  if (!Array.isArray(task.subtasks)) return;
  try {
    const list = task.subtasks
      .map((st) => (typeof st === "string" ? st : st?.name || ""))
      .filter(Boolean);
    if (!Array.isArray(window.subtasks)) window.subtasks = [];
    window.subtasks.length = 0;
    window.subtasks.push(...list);
    if (typeof window.renderSubtasks === "function") window.renderSubtasks();
    if (typeof window.addEditEvents === "function") window.addEditEvents();
  } catch {}
}

/**
 * Mirrors assigned selections into the contact list.
 * @returns {void}
 */
function syncAssignedSelectionToList() {
  const list = document.getElementById("contact-list-box");
  const selectBox = document.getElementById("assigned-select-box");
  if (!list || !selectBox) return;
  let ids = [];
  try {
    ids = JSON.parse(selectBox.dataset.selected || "[]") || [];
  } catch {}
  const idSet = new Set(ids);
  list.querySelectorAll("li").forEach((li) => {
    const img = li.querySelector("img");
    const isSel = idSet.has(li.id);
    li.classList.toggle("selected", isSel);
    if (img)
      img.src = isSel
        ? "./assets/icons/add_task/check_white.svg"
        : "./assets/icons/add_task/check_default.svg";
  });
}

/**
 * Loads a task by ID from Firebase RTDB.
 * @param {string} taskId
 * @returns {Promise<any|null>}
 */
async function loadTaskById(taskId) {
  try {
    const RTDB = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js');
    const { app } = await import('./firebase.js');
    const db = RTDB.getDatabase(app);
    const snap = await RTDB.get(RTDB.ref(db, `tasks/${taskId}`));
    return snap.exists() ? snap.val() : null;
  } catch (e) {
    console.error('Failed to load task', e);
    return null;
  }
}

/**
 * Deletes a task (and related category mirrors) from Firebase RTDB.
 * @param {string} taskId
 * @returns {Promise<void>}
 */
window.deleteTaskFromDatabase = async function(taskId) {
  if (!taskId) throw new Error("Missing taskId");
  const RTDB = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js");
  const { app } = await import("./firebase.js");
  const db = RTDB.getDatabase(app);
  await RTDB.remove(RTDB.ref(db, `tasks/${taskId}`));
};

/**
 * Ensures that openEditInsideOverlay is available globally.
 * @returns {void}
 */
(function ensureGlobalOpenEdit() {
  if (typeof window.openEditInsideOverlay !== 'function' && typeof openEditInsideOverlay === 'function') {
    window.openEditInsideOverlay = openEditInsideOverlay;
  }
})();