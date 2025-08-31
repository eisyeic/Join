/**
 * Switch overlay to edit mode and preload form.
 * @param {any} task
 * @returns {void}
 */
function openEditInsideOverlay(task) {
  switchToEditView();
  moveFormIntoEdit();
  markEditingId(task);
  populateEditForm(task);
  if (typeof window.applyAssignedInitialsCap === "function") {
    queueMicrotask(() => applyAssignedInitialsCap());
  }
  setTimeout(() => {
    populateEditForm(task);
    if (typeof window.applyAssignedInitialsCap === "function") {
      applyAssignedInitialsCap();
    }
  }, 0);
  syncAssignedSelectionToList();
  if (typeof window.addEditEvents === "function") window.addEditEvents();
}


/**
 * Show edit wrapper and hide read-only content.
 * @returns {void}
 */
function switchToEditView() {
  const taskContent = document.getElementById("task-overlay-content");
  const editWrap = document.querySelector(".edit-addtask-wrapper");
  taskContent?.classList.add("d-none");
  editWrap?.classList.remove("d-none");
}

/**
 * Move the addtask form into the overlay edit container.
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
 * Store the editing task id on the wrapper dataset.
 * @param {{id?:string}} task
 * @returns {void}
 */
function markEditingId(task) {
  const wrap = document.querySelector(".addtask-wrapper");
  if (wrap && task?.id) wrap.dataset.editingId = String(task.id);
}

/**
 * Populate the edit form via provided hook or fallback.
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
 * Fallback population for edit form fields.
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
 * Set title and description fields.
 * @param {{title?:string,description?:string}} task
 * @returns {void}
 */
function setTitleAndDescription(task) {
  const titleEl = document.getElementById("addtask-title");
  const descEl = document.getElementById("addtask-textarea");
  if (titleEl) /** @type {HTMLInputElement} */ (titleEl).value = task.title || "";
  if (descEl) /** @type {HTMLTextAreaElement} */ (descEl).value = task.description || "";
}

/**
 * Fill due date input (keeps dd/mm/yyyy if string).
 * @param {{dueDate?:string}} task
 * @returns {void}
 */
function setDueDateField(task) {
  const dateEl = document.getElementById("datepicker");
  if (!dateEl) return;
  const d = task.dueDate ? new Date(task.dueDate) : null;
  if (d && !Number.isNaN(d.getTime())) {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = String(d.getFullYear());
    /** @type {HTMLInputElement} */ (dateEl).value = `${dd}/${mm}/${yyyy}`;
  } else {
    /** @type {HTMLInputElement} */ (dateEl).value = task.dueDate || "";
  }
}

/**
 * Set category label and data value.
 * @param {{category?:string}} task
 * @returns {void}
 */
function setCategorySelection(task) {
  const sel = document.getElementById("category-select");
  const span = sel ? sel.querySelector("span") : null;
  if (span) span.textContent = task.category || "Select task category";
  if (sel) sel.dataset.value = task.category || "";
}

/**
 * Activate the correct priority button.
 * @param {{priority?:string}} task
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
 * Render assigned initials and store selected ids.
 * @param {{assignedContacts?:any[],assigned?:any[]}} task
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
 * Update initials preview box markup.
 * @param {HTMLElement} box
 * @param {Array<any>} assigned
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
 * Sync global subtasks array for the edit UI.
 * @param {{subtasks?:any[]}} task
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
 * Mirror selected contacts to the list UI.
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
 * Remove a task and its category mirrors.
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

