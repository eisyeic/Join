// Switch overlay to edit mode and preload form (accepts task object or taskId)
function openEditInsideOverlay(taskOrId) {
  switchToEditView();
  moveFormIntoEdit();
  attachEditDateInputHandlers();

  if (typeof taskOrId === 'string') {
    // Fetch the task by id then proceed
    loadTaskById(taskOrId).then((task) => {
      if (!task) return;
      task.id = taskOrId;
      proceedEditWithTask(task);
    });
  } else if (taskOrId && typeof taskOrId === 'object') {
    proceedEditWithTask(taskOrId);
  }
}

// Proceed to fill the edit form once a task object is available
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


// Show edit wrapper and hide read-only content
function switchToEditView() {
  const taskContent = document.getElementById("task-overlay-content");
  const editWrap = document.querySelector(".edit-addtask-wrapper");
  taskContent?.classList.add("d-none");
  editWrap?.classList.remove("d-none");
}

// Move the addtask form into the overlay edit container
function moveFormIntoEdit() {
  const src =
    document.querySelector(".addtask-aside-clone .addtask-wrapper") ||
    document.querySelector(".edit-addtask .addtask-wrapper");
  const dst = document.querySelector(".edit-addtask");
  if (src && dst && src.parentElement !== dst) dst.replaceChildren(src);
}

// Attach focus/blur handlers to allow editing the date via native picker
function attachEditDateInputHandlers() {
  const input = /** @type {HTMLInputElement|null} */(document.getElementById('datepicker'));
  const wrapper = document.getElementById('datepicker-wrapper');
  const display = document.getElementById('date-display');
  const placeholder = document.getElementById('date-placeholder');
  if (!input) return;
  if (input.dataset.editHandlersBound === '1') return;

  input.addEventListener('focus', () => {
    // Switch to native picker and prefill as ISO if we currently have dd/mm/yyyy
    const val = input.value.trim();
    if (val && /^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
      const [dd, mm, yyyy] = val.split('/');
      input.value = `${yyyy}-${mm}-${dd}`; // ISO for date input
    }
    input.type = 'date';
    // Ensure focus and open the native picker immediately on first click
    input.focus();
    if (typeof input.showPicker === 'function') {
      // Some browsers require async to open reliably on first interaction
      requestAnimationFrame(() => { try { input.showPicker(); } catch (_) {} });
    }
  });

  input.addEventListener('blur', () => {
    const raw = input.value.trim();
    let ddmmyyyy = '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      const [yyyy, mm, dd] = raw.split('-');
      ddmmyyyy = `${dd}/${mm}/${yyyy}`;
    } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
      ddmmyyyy = raw;
    }

    input.type = 'text';
    input.value = ddmmyyyy;

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
      if (input.type !== 'date') input.type = 'date';
      input.focus();
      if (typeof input.showPicker === 'function') {
        requestAnimationFrame(() => { try { input.showPicker(); } catch (_) {} });
      }
    });
  }

  input.dataset.editHandlersBound = '1';
}

// Store the editing task id on the wrapper dataset
function markEditingId(task) {
  const wrap = document.querySelector(".addtask-wrapper");
  if (wrap && task?.id) wrap.dataset.editingId = String(task.id);
}

// Populate the edit form via provided hook or fallback
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

// Fallback population for edit form fields
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

// Set title and description fields
function setTitleAndDescription(task) {
  const titleEl = document.getElementById("addtask-title");
  const descEl = document.getElementById("addtask-textarea");
  if (titleEl) /** @type {HTMLInputElement} */ (titleEl).value = task.title || "";
  if (descEl) /** @type {HTMLTextAreaElement} */ (descEl).value = task.description || "";
}

// Fill due date input (only dd/mm/yyyy supported)
function setDueDateField(task) {
  const dateEl = /** @type {HTMLInputElement|null} */(document.getElementById('datepicker'));
  const wrapper = document.getElementById('datepicker-wrapper');
  const display = document.getElementById('date-display');
  const placeholder = document.getElementById('date-placeholder');
  if (!dateEl) return;

  const ddmmyyyy = task?.dueDate && /^\d{2}\/\d{2}\/\d{4}$/.test(task.dueDate)
    ? task.dueDate
    : '';

  if (dateEl.type === 'date') dateEl.type = 'text';
  dateEl.value = ddmmyyyy;

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

// Set category label and data value
function setCategorySelection(task) {
  const sel = document.getElementById("category-select");
  const span = sel ? sel.querySelector("span") : null;
  if (span) span.textContent = task.category || "Select task category";
  if (sel) sel.dataset.value = task.category || "";
}

// Activate the correct priority button
function setPriorityButtons(task) {
  document.querySelectorAll(".prio-buttons .priority-button")
    .forEach((b) => b.classList.remove("active"));
  const map = { urgent: ".urgent-button", medium: ".medium-button", low: ".low-button" };
  const key = (task.priority || "medium").toLowerCase();
  document.querySelector(map[key] || ".medium-button")?.classList.add("active");
}

// Render assigned initials and store selected ids
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

// Update initials preview box markup
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

// Sync global subtasks array for the edit UI
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

// Mirror selected contacts to the list UI
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

// Load a task by id from Firebase Realtime Database
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

// Remove a task and its category mirrors
window.deleteTaskFromDatabase = async function(taskId) {
  if (!taskId) throw new Error("Missing taskId");
  const RTDB = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js");
  const { app } = await import("./firebase.js");
  const db = RTDB.getDatabase(app);
  await RTDB.remove(RTDB.ref(db, `tasks/${taskId}`));
};

(function ensureGlobalOpenEdit() {
  if (typeof window.openEditInsideOverlay !== 'function' && typeof openEditInsideOverlay === 'function') {
    window.openEditInsideOverlay = openEditInsideOverlay;
  }
})();
