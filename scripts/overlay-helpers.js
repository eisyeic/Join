/** @file Helpers for Task Overlay: DB ops, DOM helpers, rendering, subtasks. */

import {
  getDatabase,
  update,
  ref,
  get,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

/** Firebase RTDB */
const db = getDatabase();

/**
 * @typedef {Object} Subtask
 * @property {string} name
 * @property {boolean} [checked]
 */

/**
 * @typedef {Object} Task
 * @property {string} [id]
 * @property {string} [title]
 * @property {string} [description]
 * @property {string} [dueDate]              // "DD/MM/YYYY"
 * @property {"urgent"|"medium"|"low"} [priority]
 * @property {string} [category]
 * @property {Subtask[]} [subtasks]
 */

/* ========================= DB OPS ========================= */

/**
 * Fetch a task by ID and attach the id.
 * @param {string} taskId
 * @returns {Promise<Task|null>}
 */
export async function fetchTask(taskId) {
  const snap = await get(ref(db, `tasks/${taskId}`));
  if (!snap.exists()) return null;
  const task = /** @type {Task} */ (snap.val());
  task.id = taskId;
  return task;
}

/**
 * Normalize subtasks to {name, checked} and persist.
 * @param {string} taskId
 * @param {Task} task
 * @returns {Promise<void>}
 */
export async function normalizeSubtasks(taskId, task) {
  if (!Array.isArray(task.subtasks)) return;
  const normalized = task.subtasks.map((st) =>
    typeof st === "string" ? { name: st, checked: false } : st
  );
  await update(ref(db, `tasks/${taskId}`), { subtasks: normalized });
  task.subtasks = normalized;
}

/**
 * Update one subtask's checked state.
 * @param {string} taskId
 * @param {number} subtaskIndex
 * @param {boolean} isChecked
 * @returns {Promise<void>}
 */
export async function updateSubtaskStatus(taskId, subtaskIndex, isChecked) {
  const taskRef = ref(db, `tasks/${taskId}`);
  const snap = await get(taskRef);
  const task = /** @type {Task} */ (snap.val());
  if (!task?.subtasks?.[subtaskIndex]) return;
  const updated = task.subtasks.map((st, i) =>
    i === subtaskIndex
      ? { ...(typeof st === "string" ? { name: st } : st), checked: isChecked }
      : st
  );
  await update(taskRef, { subtasks: updated });
}

/* ===================== RENDER HELPERS ===================== */

/**
 * Render priority label + icon.
 * @param {"urgent"|"medium"|"low"} [priority]
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
 * Capitalize first character.
 * @param {string} [str]
 * @returns {string}
 */
export function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
}

/**
 * Subtask progress markup.
 * @param {Subtask[]} subtasks
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
 * Map category -> CSS class for label.
 * @param {string} [category]
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

/* =================== SUBTASK UI WIRING ==================== */

/**
 * Attach change/hover events for one subtask row.
 * @param {HTMLInputElement} checkbox
 * @param {HTMLLabelElement} label
 * @param {HTMLImageElement|null} img
 * @param {string} taskId
 * @param {number} index
 * @returns {void}
 */
export function attachSubtaskEvents(checkbox, label, img, taskId, index) {
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
 * Find checkbox/label/img triplets by [data-subtask-index].
 * @returns {{checkbox: HTMLInputElement, label: HTMLLabelElement|null, img: HTMLImageElement|null, idx: number}[]|null}
 */
export function getPairsByDataIndex() {
  const nodes = document.querySelectorAll("[data-subtask-index]");
  if (!nodes.length) return null;
  /** @type {{checkbox: HTMLInputElement, label: HTMLLabelElement|null, img: HTMLImageElement|null, idx: number}[]} */
  const out = [];
  nodes.forEach((el) => {
    const idx = parseInt(el.getAttribute("data-subtask-index") || "", 10);
    const checkbox =
      el.matches('input[type="checkbox"]') ? /** @type {HTMLInputElement} */ (el) : el.querySelector('input[type="checkbox"]');
    if (!checkbox || Number.isNaN(idx)) return;
    const label =
      document.querySelector(`label[for="${checkbox.id}"]`) ||
      /** @type {HTMLLabelElement} */ (checkbox.nextElementSibling);
    const img = label ? /** @type {HTMLImageElement|null} */ (label.querySelector("img")) : null;
    out.push({ checkbox, label, img, idx });
  });
  return out;
}

/**
 * Find checkbox/label/img triplets by id pattern "subtaskN".
 * @returns {{checkbox: HTMLInputElement, label: HTMLLabelElement|null, img: HTMLImageElement|null, idx: number}[]|null}
 */
export function getPairsByIdPattern() {
  const boxes = document.querySelectorAll('input[type="checkbox"][id^="subtask"]');
  if (!boxes.length) return null;
  /** @type {{checkbox: HTMLInputElement, label: HTMLLabelElement|null, img: HTMLImageElement|null, idx: number}[]} */
  const out = [];
  boxes.forEach((checkbox) => {
    const m = (checkbox.id || "").match(/(\d+)$/);
    if (!m) return;
    const idx = parseInt(m[1], 10);
    const label =
      document.querySelector(`label[for="${checkbox.id}"]`) ||
      /** @type {HTMLLabelElement} */ (checkbox.nextElementSibling);
    const img = label ? /** @type {HTMLImageElement|null} */ (label.querySelector("img")) : null;
    out.push({ checkbox: /** @type {HTMLInputElement} */ (checkbox), label, img, idx });
  });
  return out;
}