import {
  getDatabase,
  update,
  ref,
  get,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { renderAssignedContacts, renderSubtasks } from "./template.modul.js";
import { getLabelClass } from "./board.js";

/**
 * Firebase Realtime Database instance.
 * @type {import("https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js").Database}
 */
const db = getDatabase();

/** @type {readonly string[]} */
const TASK_CATEGORIES = ["toDo", "inProgress", "awaitFeedback", "done"];

/**
 * Open the task overlay for a given task id.
 * @param {string} taskId
 * @returns {Promise<void>}
 */
window.showTaskOverlay = async function (taskId) {
  try {
    const task = await fetchTask(taskId);
    if (!task) return;
    await normalizeSubtasks(taskId, task);
    fillTaskOverlay(task);
    wireEditButton(task);
    wireDeleteButton(taskId);
    showOverlayUI();
  } catch (err) {
    console.error("Error showing task overlay:", err);
  }
};

/**
 * Hide the task overlay with animation.
 * @returns {void}
 */
window.hideOverlay = function () {
  const bg = $("task-overlay-bg");
  const overlay = $("task-overlay");
  if (!bg || !overlay) return;
  document.querySelector(".edit-addtask-wrapper")?.classList.add("d-none");
  document.getElementById("task-overlay-content")?.classList.remove("d-none");
  overlay.classList.remove("animate-in");
  overlay.classList.add("animate-out");
  setTimeout(() => {
    bg.classList.add("d-none");
    overlay.classList.remove("animate-out");
  }, 300);
};

/**
 * Fetch a task by id and attach its id on the object.
 * @param {string} taskId
 * @returns {Promise<any|null>}
 */
async function fetchTask(taskId) {
  const snap = await get(ref(db, `tasks/${taskId}`));
  if (!snap.exists()) return null;
  const task = snap.val();
  task.id = taskId;
  return task;
}

/**
 * Render all overlay sections for a task.
 * @param {any} task
 * @returns {void}
 */
function fillTaskOverlay(task) {
  renderCategory(task.category);
  renderTitleDescDate(task);
  renderPriority(task.priority);
  renderAssignedContacts(task);
  renderSubtasks(task);
  setupSubtaskListeners(task);
}

/**
 * Render category label and class on overlay.
 * @param {string} category
 * @returns {void}
 */
function renderCategory(category) {
  const el = $("overlay-user-story");
  el.textContent = category || "";
  el.className = "";
  el.classList.add(getLabelClass(category));
}

/**
 * Render title, description and due date.
 * @param {{title?:string,description?:string,dueDate?:string}} task
 * @returns {void}
 */
function renderTitleDescDate(task) {
  $("overlay-title").innerHTML = task.title || "";
  $("overlay-description").textContent = task.description || "";
  $("overlay-due-date").textContent = task.dueDate || "";
}

/**
 * Render priority text + icon on overlay.
 * @param {"urgent"|"medium"|"low"|string} priority
 * @returns {void}
 */
export function renderPriority(priority) {
  const icons = {
    urgent: "./assets/icons/board/Urgent.svg",
    medium: "./assets/icons/board/Medium.svg",
    low: "./assets/icons/board/Low.svg",
  };
  $("overlay-priority-text").textContent = capitalize(priority);
  $("overlay-priority-icon").src = icons[priority] || "";
}

/**
 * Capitalize first letter of a string.
 * @param {string} str
 * @returns {string}
 */
function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
}

/**
 * Attach subtask checkbox listeners and visuals.
 * @param {{id:string,subtasks?:any[]}} task
 * @returns {void}
 */
function setupSubtaskListeners(task) {
  const pairs =
    getPairsByDataIndex() || getPairsByIdPattern() || /** @type {any[]} */ ([]);
  pairs.forEach(({ checkbox, label, img, idx }) => {
    if (checkbox && label) attachSubtaskEvents(checkbox, label, img, task.id, idx);
  });
}

/**
 * Find checkbox/label/img pairs via data-subtask-index.
 * @returns {{checkbox:HTMLInputElement,label:HTMLLabelElement,img:HTMLImageElement|null,idx:number}[]|null}
 */
function getPairsByDataIndex() {
  const nodes = document.querySelectorAll("[data-subtask-index]");
  if (!nodes.length) return null;
  const out = [];
  nodes.forEach((el) => {
    const idx = parseInt(el.getAttribute("data-subtask-index") || "", 10);
    const checkbox =
      el.matches('input[type="checkbox"]') ? el : el.querySelector('input[type="checkbox"]');
    if (!checkbox || Number.isNaN(idx)) return;
    const label =
      document.querySelector(`label[for="${checkbox.id}"]`) ||
      /** @type {HTMLLabelElement} */ (checkbox.nextElementSibling);
    const img = label ? label.querySelector("img") : null;
    out.push({ checkbox, label, img, idx });
  });
  return out;
}

/**
 * Find checkbox/label/img pairs via id pattern (subtaskN).
 * @returns {{checkbox:HTMLInputElement,label:HTMLLabelElement,img:HTMLImageElement|null,idx:number}[]|null}
 */
function getPairsByIdPattern() {
  const boxes = document.querySelectorAll('input[type="checkbox"][id^="subtask"]');
  if (!boxes.length) return null;
  const out = [];
  boxes.forEach((checkbox) => {
    const m = (checkbox.id || "").match(/(\d+)$/);
    if (!m) return;
    const idx = parseInt(m[1], 10);
    const label =
      document.querySelector(`label[for="${checkbox.id}"]`) ||
      /** @type {HTMLLabelElement} */ (checkbox.nextElementSibling);
    const img = label ? label.querySelector("img") : null;
    out.push({ checkbox, label, img, idx });
  });
  return out;
}

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
  setTimeout(() => populateEditForm(task), 0);
  syncAssignedSelectionToList();
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
    window.subtasks = task.subtasks
      .map((st) => (typeof st === "string" ? st : st?.name || ""))
      .filter(Boolean);
    if (typeof window.renderSubtasks === "function") window.renderSubtasks();
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
 * Wire the edit button inside overlay.
 * @param {any} task
 * @returns {void}
 */
function wireEditButton(task) {
  const btn = $("edit-task-btn");
  if (!btn) return;
  btn.onclick = () => openEditInsideOverlay(task);
}

/**
 * Wire the delete button inside overlay.
 * @param {string} taskId
 * @returns {void}
 */
function wireDeleteButton(taskId) {
  const btn = $("delete-task-btn");
  if (!btn) return;
  btn.onclick = async () => {
    try {
      await deleteTaskFromDatabase(taskId);
      hideOverlay();
    } catch (e) {
      console.error("Error deleting task:", e);
    }
  };
}

/**
 * Show overlay background and animate in.
 * @returns {void}
 */
function showOverlayUI() {
  const bg = $("task-overlay-bg");
  const overlay = $("task-overlay");
  if (!bg || !overlay) return;
  bg.classList.remove("d-none");
  overlay.classList.remove("animate-out");
  overlay.classList.add("animate-in");
}

/**
 * Attach subtask checkbox listeners for status and icon.
 * @param {HTMLInputElement} checkbox
 * @param {HTMLLabelElement} label
 * @param {HTMLImageElement|null} img
 * @param {string} taskId
 * @param {number} index
 * @returns {void}
 */
function attachSubtaskEvents(checkbox, label, img, taskId, index) {
  const updateImage = () => {
    if (!img) return;
    const hover = label.matches(":hover");
    const p = "./assets/icons/add_task/";
    img.src = checkbox.checked
      ? p + (hover ? "checked_hover.svg" : "check_checked.svg")
      : p + (hover ? "check_default_hover.svg" : "check_default.svg");
  };
  checkbox.addEventListener("change", () => {
    label.classList.toggle("checked", checkbox.checked);
    updateImage();
    updateSubtaskStatus(taskId, index, checkbox.checked);
  });
  label.addEventListener("mouseenter", updateImage);
  label.addEventListener("mouseleave", updateImage);
}

/**
 * Ensure subtasks are normalized to {name,checked} shape.
 * @param {string} taskId
 * @param {{subtasks?:any[]}} task
 * @returns {Promise<void>}
 */
async function normalizeSubtasks(taskId, task) {
  if (!Array.isArray(task.subtasks)) return;
  const normalized = task.subtasks.map((st) =>
    typeof st === "string" ? { name: st, checked: false } : st
  );
  await update(ref(db, `tasks/${taskId}`), { subtasks: normalized });
  task.subtasks = normalized;
}

/**
 * Update a single subtask's checked status.
 * @param {string} taskId
 * @param {number} subtaskIndex
 * @param {boolean} isChecked
 * @returns {Promise<void>}
 */
export async function updateSubtaskStatus(taskId, subtaskIndex, isChecked) {
  const taskRef = ref(db, `tasks/${taskId}`);
  const snap = await get(taskRef);
  const task = snap.val();
  if (!task?.subtasks?.[subtaskIndex]) return;
  const updated = task.subtasks.map((st, i) =>
    i === subtaskIndex
      ? { ...(typeof st === "string" ? { name: st } : st), checked: isChecked }
      : st
  );
  await update(taskRef, { subtasks: updated });
}

/**
 * Remove a task and its category mirrors.
 * @param {string} taskId
 * @returns {Promise<void>}
 */
async function deleteTaskFromDatabase(taskId) {
  const updates = { [`tasks/${taskId}`]: null };
  TASK_CATEGORIES.forEach((c) => (updates[`${c}Tasks/${taskId}`] = null));
  await update(ref(db), updates);
}

/**
 * Truncate a description to 50 chars on word boundary.
 * @param {string} text
 * @returns {string}
 */
export function truncateDescription(text) {
  const MAX = 50;
  if (text.length <= MAX) return text;
  let cut = text.slice(0, MAX);
  const lastSpace = cut.lastIndexOf(" ");
  if (lastSpace > 0) cut = cut.slice(0, lastSpace);
  return cut + "...";
}
