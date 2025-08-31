import {
  getDatabase,
  update,
  ref,
  get,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { renderAssignedContacts, renderSubtasks } from "./template.modul.js";

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

/**
 * Opens the Add Task overlay and resets the form.
 * @returns {void}
 */
function openOverlay() {
  overlay.classList.remove("d-none");
  overlayContent.classList.remove("slide-out");
  overlayContent.classList.add("slide-in");
  const cancelBtn = $("cancel-button");
  if (cancelBtn) cancelBtn.click();
  else
    document.addEventListener(
      "addtask:template-ready",
      () => $("cancel-button")?.click(),
      { once: true }
    );
}

/**
 * Closes the Add Task overlay with a slide-out animation.
 * @returns {void}
 */
function closeOverlay() {
  overlayContent.classList.remove("slide-in");
  overlayContent.classList.add("slide-out");
  overlayContent.addEventListener("animationend", function handler() {
    overlay.classList.add("d-none");
    overlayContent.classList.remove("slide-out");
    overlayContent.removeEventListener("animationend", handler);
  });
}

/**
 * Toggles the task overlay into edit mode and moves the form into place.
 * @returns {void}
 */
$("edit-task-btn").addEventListener("click", onEditTaskBtnClick);
function onEditTaskBtnClick() {
  $("task-overlay-content").classList.toggle("d-none");
  document.querySelector(".edit-addtask-wrapper").classList.toggle("d-none");
  const src = document.querySelector(".addtask-aside-clone .addtask-wrapper");
  const dst = document.querySelector(".edit-addtask");
  if (src && dst) dst.replaceChildren(src);
}


/**
 * Renders a subtask progress bar and label.
 * @param {{checked:boolean}[]} subtasks
 * @returns {string}
 */
export function renderSubtaskProgress(subtasks) {
  const total = subtasks.length;
  const done = subtasks.filter((st) => st.checked).length;
  const percentage = total ? Math.round((done / total) * 100) : 0;
  return `
    <div class="subtasks-box">
      <div class="progressbar">
        <div class="progressbar-inlay" style="width: ${percentage}%"></div>
      </div>
      ${done}/${total} Subtasks
    </div>
  `;
}

/**
 * Maps a task category to a CSS class for labels.
 * @param {string} category
 * @returns {string}
 */
export function getLabelClass(category) {
  return (
    {
      "User Story": "user-story",
      "Technical task": "technical-task",
    }[category] || ""
  );
}
