/** @file Helpers for Task Overlay: DB ops, DOM helpers, rendering, subtasks. */

import {
  getDatabase,
  update,
  ref,
  get,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

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
 * @property {string} [dueDate]
 * @property {"urgent"|"medium"|"low"} [priority]
 * @property {string} [category]
 * @property {Subtask[]} [subtasks]
 */

/**
 * Creates overlay helpers with all necessary functions for task management.
 * @returns {Object} Object containing all helper functions
 */
function createOverlayHelpers() {
  const db = getDatabase();

  return {
    async fetchTask(taskId) {
      const snap = await get(ref(db, `tasks/${taskId}`));
      if (!snap.exists()) return null;
      const task = snap.val();
      task.id = taskId;
      return task;
    },

    async normalizeSubtasks(taskId, task) {
      if (!Array.isArray(task.subtasks)) return;
      const normalized = task.subtasks.map((st) =>
        typeof st === "string" ? { name: st, checked: false } : st
      );
      await update(ref(db, `tasks/${taskId}`), { subtasks: normalized });
      task.subtasks = normalized;
    },

    async updateSubtaskStatus(taskId, subtaskIndex, isChecked) {
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
    },

    renderPriority(priority) {
      const icons = {
        urgent: "./assets/icons/board/Urgent.svg",
        medium: "./assets/icons/board/Medium.svg",
        low: "./assets/icons/board/Low.svg",
      };
      $("overlay-priority-text").textContent = this.capitalize(priority);
      $("overlay-priority-icon").src = icons[priority] || "";
    },

    capitalize(str) {
      return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
    },

    renderSubtaskProgress(subtasks) {
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
    },

    getLabelClass(category) {
      return (
        {
          "User Story": "user-story",
          "Technical task": "technical-task",
        }[category] || ""
      );
    },

    attachSubtaskEvents(checkbox, label, img, taskId, index) {
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
        this.updateSubtaskStatus(taskId, index, checkbox.checked);
      });
      label.addEventListener("mouseenter", updateImage);
      label.addEventListener("mouseleave", updateImage);
    },

    getPairsByDataIndex() {
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
          checkbox.nextElementSibling;
        const img = label ? label.querySelector("img") : null;
        out.push({ checkbox, label, img, idx });
      });
      return out;
    },

    getPairsByIdPattern() {
      const boxes = document.querySelectorAll('input[type="checkbox"][id^="subtask"]');
      if (!boxes.length) return null;
      const out = [];
      boxes.forEach((checkbox) => {
        const m = (checkbox.id || "").match(/(\d+)$/);
        if (!m) return;
        const idx = parseInt(m[1], 10);
        const label =
          document.querySelector(`label[for="${checkbox.id}"]`) ||
          checkbox.nextElementSibling;
        const img = label ? label.querySelector("img") : null;
        out.push({ checkbox, label, img, idx });
      });
      return out;
    }
  };
}

const helpers = createOverlayHelpers();

export const fetchTask = helpers.fetchTask.bind(helpers);
export const normalizeSubtasks = helpers.normalizeSubtasks.bind(helpers);
export const updateSubtaskStatus = helpers.updateSubtaskStatus.bind(helpers);
export const renderPriority = helpers.renderPriority.bind(helpers);
export const capitalize = helpers.capitalize.bind(helpers);
export const renderSubtaskProgress = helpers.renderSubtaskProgress.bind(helpers);
export const getLabelClass = helpers.getLabelClass.bind(helpers);
export const attachSubtaskEvents = helpers.attachSubtaskEvents.bind(helpers);
export const getPairsByDataIndex = helpers.getPairsByDataIndex.bind(helpers);
export const getPairsByIdPattern = helpers.getPairsByIdPattern.bind(helpers);