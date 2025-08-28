import {
  getLabelClass,
  renderSubtaskProgress,
  renderAssignedInitials,
} from "./board.js";
import { truncateDescription } from "./task-overlay.js";

/**
 * @typedef {Object} AssignedContact
 * @property {string} [id]
 * @property {string} [name]
 * @property {string} [initials]
 * @property {number} [colorIndex]
 */

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
 * @property {string} [category]        - e.g. "User Story" | "Technical task"
 * @property {"urgent"|"medium"|"low"|string} [priority]
 * @property {"todo"|"inProgress"|"awaitFeedback"|"done"|string} [column]
 * @property {AssignedContact[]} [assignedContacts]
 * @property {Subtask[]} [subtasks]
 */

/** @type {HTMLDivElement|null} */
let _currentMoveOverlay = null;
/** @type {(()=>void)|null} */
let _moveOverlayCleanup = null;

/**
 * Create a draggable task ticket element for the board columns.
 * @param {Task} task
 * @param {string} taskId
 * @returns {HTMLDivElement}
 */
export function createTaskElement(task, taskId) {
  const labelClass = getLabelClass(task.category);
  const ticket = document.createElement("div");
  ticket.classList.add("ticket");
  ticket.setAttribute("id", taskId);
  ticket.setAttribute("draggable", "true");
  ticket.setAttribute("ondragstart", "drag(event)");
  if (task.column) ticket.dataset.column = task.column;

  const truncated = truncateDescription(task.description || "");

  ticket.innerHTML = `
    <div class="ticket-content" onclick="showTaskOverlay('${taskId}')">
      <div class="label-box">  
        <div class="label ${labelClass}">${task.category ?? ""}</div>
        <img
          class="plus-minus-img"
          src="./assets/icons/board/plusminus.svg"
          alt="plus/minus"
          draggable="false"
          role="button"
          aria-label="Weitere Optionen"
        >
      </div>
      <div class="frame">
        <div class="ticket-title">${task.title ?? ""}</div>
        <div class="ticket-text">${truncated}</div>
      </div>
      ${task.subtasks?.length ? renderSubtaskProgress(task.subtasks) : ""}
      <div class="initials-icon-box">
        <div class="initials">
          ${task.assignedContacts ? renderAssignedInitials(task.assignedContacts) : ""}
        </div>
        <img src="./assets/icons/board/${task.priority}.svg" alt="${task.priority}">
      </div>
    </div>
  `;

  const plusMinus = /** @type {HTMLImageElement|null} */ (ticket.querySelector(".plus-minus-img"));
  if (plusMinus) {
    plusMinus.addEventListener("click", (e) => {
      e.stopPropagation();
      const currentColumn = getCurrentColumnForTicket(ticket);
      openMoveOverlay(plusMinus, taskId, currentColumn);
    });
    plusMinus.addEventListener("mousedown", (e) => e.stopPropagation());
    plusMinus.addEventListener("touchstart", (e) => e.stopPropagation(), { passive: true });
    plusMinus.addEventListener("dragstart", (e) => e.preventDefault());
  }
  return ticket;
}

/**
 * Render the assigned contacts inside the task overlay.
 * Safe to call before the overlay DOM is ready; it retries briefly.
 * @param {Task} task
 * @returns {void}
 */
export function renderAssignedContacts(task) {
  const contacts = Array.isArray(task?.assignedContacts) ? task.assignedContacts : [];

  /** @param {number} [tries] */
  const waitAndRender = (tries = 15) => {
    const container = /** @type {HTMLElement|null} */ (document.getElementById("overlay-members"));
    if (!container) {
      if (tries > 0) requestAnimationFrame(() => waitAndRender(tries - 1));
      return;
    }
    container.innerHTML = contacts
      .map((c) => {
        const colorIdx = Number.isFinite(c?.colorIndex) ? c.colorIndex : 0;
        const initials = c?.initials || "";
        const name = c?.name || initials;
        return `
          <div class="member">
            <div class="initial-circle"
                 style="background-image:url(../assets/icons/contact/color${colorIdx}.svg)">
              ${initials}
            </div>
            <span>${name}</span>
          </div>
        `;
      })
      .join("");
  };

  waitAndRender();
}

/** Expose for inline handlers if needed. */
window.renderAssignedContacts = renderAssignedContacts;

/**
 * Render the task subtasks inside the overlay.
 * @param {Task} task
 * @returns {void}
 */
export function renderSubtasks(task) {
  const container = /** @type {HTMLElement} */ ($("overlay-subtasks"));
  if (task.subtasks && task.subtasks.length > 0) {
    const subtasksHtml = task.subtasks
      .map((subtask, i) => {
        const checked = subtask.checked ? "checked" : "";
        const checkboxId = `subtask${i}`;
        const iconSrc = subtask.checked
          ? "./assets/icons/add_task/check_checked.svg"
          : "./assets/icons/add_task/check_default.svg";
        const labelClass = subtask.checked ? "checked" : "";
        return `
          <div class="subtask">
            <input type="checkbox" id="${checkboxId}" ${checked} style="display: none"/>
            <label for="${checkboxId}" class="${labelClass}">
              <img src="${iconSrc}" />
              ${subtask.name}
            </label>
          </div>
        `;
      })
      .join("");
    container.innerHTML = `<b>Subtasks:</b><div class="subtasks-container">${subtasksHtml}</div>`;
  } else {
    container.innerHTML = "<b>no subtasks</b>";
  }
}

/**
 * Open a small move/reorder overlay near the ticket's button.
 * @param {Element} anchorEl
 * @param {string} taskId
 * @param {string} currentColumn
 * @returns {void}
 */
function openMoveOverlay(anchorEl, taskId, currentColumn) {
  if (_currentMoveOverlay && _currentMoveOverlay.dataset.taskId === String(taskId)) {
    closeMoveOverlay();
    return;
  }
  closeMoveOverlay();

  const overlay = document.createElement("div");
  overlay.className = "move-overlay";
  overlay.setAttribute("role", "menu");
  overlay.dataset.taskId = taskId;

  const normCurrent = normalizeColumnName(currentColumn);
  const order = /** @type {Record<string, number>} */ ({ todo: 0, inProgress: 1, awaitFeedback: 2, done: 3 });

  const parts = [];
  parts.push(`<div class="move-overlay__title">Move to</div>`);
  const targets = getMoveTargetsFor(currentColumn);
  targets.forEach((t) => {
    const dir = (order[t.col] ?? 0) < (order[normCurrent] ?? 0) ? "up" : "down";
    const iconFile = dir === "up" ? "arrow_upward.svg" : "arrow_downward.svg";
    parts.push(`
      <button type="button"
              class="move-option"
              data-col="${t.col}"
              role="menuitem"
              style="display:flex;align-items:center;gap:8px;background:none;border:none;padding:6px 0;color:inherit;cursor:pointer;text-align:left;width:100%;">
        <img src="./assets/icons/board/${iconFile}" alt="" width="16" height="16">
        <span>${t.label}</span>
      </button>
    `);
  });

  overlay.innerHTML = parts.join("\n");

  overlay.addEventListener("mousedown", (e) => e.stopPropagation());
  overlay.addEventListener("touchstart", (e) => e.stopPropagation(), { passive: true });
  overlay.addEventListener("click", (e) => {
    e.stopPropagation();
    const trg = e.target instanceof Element ? e.target.closest("[data-col],[data-action]") : null;
    if (!trg) return;
    const action = trg.getAttribute("data-action");
    const col = trg.getAttribute("data-col");
    if (action === "up") moveTaskUp(taskId);
    else if (action === "down") moveTaskDown(taskId);
    else if (col) moveTaskToColumn(taskId, col);
    closeMoveOverlay();
  });

  document.body.appendChild(overlay);
  overlay.style.display = "flex";
  overlay.style.visibility = "hidden";
  overlay.style.position = "fixed";
  overlay.style.zIndex = "9999";

  positionOverlayTopLeft(anchorEl, overlay);

  overlay.style.transition = "opacity 140ms ease, transform 140ms ease";
  overlay.style.transformOrigin = "top right";
  overlay.style.transform = "translate(0,0) scale(0.98)";
  overlay.style.opacity = "0";
  overlay.style.visibility = "visible";
  requestAnimationFrame(() => {
    overlay.classList.add("is-open");
    overlay.style.opacity = "1";
    overlay.style.transform = "translate(0,0) scale(1)";
  });

  overlay.tabIndex = -1;
  overlay.focus?.();

  const onDocClick = (ev) => { if (!overlay.contains(ev.target)) closeMoveOverlay(); };
  const onKey = (ev) => { if (ev.key === "Escape") closeMoveOverlay(); };
  const onAnyScrollOrResize = () => closeMoveOverlay();

  document.addEventListener("click", onDocClick, { capture: true });
  document.addEventListener("keydown", onKey);
  document.addEventListener("scroll", onAnyScrollOrResize, { capture: true, passive: true });
  document.addEventListener("wheel", onAnyScrollOrResize, { capture: true, passive: true });
  document.addEventListener("touchmove", onAnyScrollOrResize, { capture: true, passive: true });
  window.addEventListener("resize", onAnyScrollOrResize);

  _moveOverlayCleanup = () => {
    document.removeEventListener("click", onDocClick, { capture: true });
    document.removeEventListener("keydown", onKey);
    document.removeEventListener("scroll", onAnyScrollOrResize, { capture: true });
    document.removeEventListener("wheel", onAnyScrollOrResize, { capture: true });
    document.removeEventListener("touchmove", onAnyScrollOrResize, { capture: true });
    window.removeEventListener("resize", onAnyScrollOrResize);
  };

  _currentMoveOverlay = overlay;
}

/**
 * Close the move overlay and clean up listeners.
 * @returns {void}
 */
function closeMoveOverlay() {
  if (_currentMoveOverlay) {
    const el = _currentMoveOverlay;
    el.style.transform = "translate(0,0) scale(0.98)";
    el.style.opacity = "0";
    el.classList.remove("is-open");

    const cleanup = () => {
      el.remove();
      if (_moveOverlayCleanup) {
        _moveOverlayCleanup();
        _moveOverlayCleanup = null;
      }
    };

    let done = false;
    const onEnd = () => {
      if (done) return;
      done = true;
      el.removeEventListener("transitionend", onEnd);
      cleanup();
    };
    el.addEventListener("transitionend", onEnd, { once: true });
    setTimeout(onEnd, 240);

    _currentMoveOverlay = null;
    return;
  }
  if (_moveOverlayCleanup) {
    _moveOverlayCleanup();
    _moveOverlayCleanup = null;
  }
}

/**
 * Position overlay: top-right of overlay aligns with top-right of anchor button.
 * Uses fixed positioning and clamps within the viewport.
 * @param {Element} anchorEl
 * @param {HTMLElement} overlay
 * @returns {void}
 */
function positionOverlayTopLeft(anchorEl, overlay) {
  const MARGIN = 8;
  const r = anchorEl.getBoundingClientRect();
  const { width: ow, height: oh } = overlay.getBoundingClientRect();
  let top = r.top;
  let left = r.right - ow;
  if (left < MARGIN) left = MARGIN;
  if (left + ow > window.innerWidth - MARGIN) left = window.innerWidth - MARGIN - ow;
  if (top < MARGIN) top = MARGIN;
  if (top + oh > window.innerHeight - MARGIN) top = window.innerHeight - MARGIN - oh;
  overlay.style.left = `${Math.round(left)}px`;
  overlay.style.top = `${Math.round(top)}px`;
}

/**
 * Move a ticket one position up within its current column.
 * @param {string} taskId
 * @returns {void}
 */
function moveTaskUp(taskId) {
  const ticket = /** @type {HTMLElement|null} */ (document.getElementById(String(taskId)));
  if (!ticket) return;
  const parent = ticket.parentElement;
  if (!parent) return;
  /** @type {Element|null} */
  let prev = ticket.previousElementSibling;
  while (prev && !prev.classList.contains("ticket")) prev = prev.previousElementSibling;
  if (prev) {
    parent.insertBefore(ticket, prev);
    if (typeof window.onTaskOrderChanged === "function") window.onTaskOrderChanged(parent);
  }
}

/**
 * Move a ticket one position down within its current column.
 * @param {string} taskId
 * @returns {void}
 */
function moveTaskDown(taskId) {
  const ticket = /** @type {HTMLElement|null} */ (document.getElementById(String(taskId)));
  if (!ticket) return;
  const parent = ticket.parentElement;
  if (!parent) return;
  /** @type {Element|null} */
  let next = ticket.nextElementSibling;
  while (next && !next.classList.contains("ticket")) next = next.nextElementSibling;
  if (next) {
    parent.insertBefore(next, ticket);
    if (typeof window.onTaskOrderChanged === "function") window.onTaskOrderChanged(parent);
  }
}

/**
 * Move a ticket to a different column (uses bridge hook if available).
 * @param {string} taskId
 * @param {"todo"|"inProgress"|"awaitFeedback"|"done"|string} targetColumn
 * @returns {void}
 */
function moveTaskToColumn(taskId, targetColumn) {
  const ticket = /** @type {HTMLElement|null} */ (document.getElementById(String(taskId)));
  if (!ticket) return;
  const sourceColumn = getCurrentColumnForTicket(ticket);

  if (typeof window.onTaskColumnChanged === "function") {
    window.onTaskColumnChanged(taskId, targetColumn);
    return;
  }

  const targetContainer =
    /** @type {HTMLElement|null} */ (document.querySelector(`[data-column="${targetColumn}"]`)) ||
    /** @type {HTMLElement|null} */ (document.getElementById(targetColumn));

  if (!targetContainer) {
    console.warn(
      `[moveTaskToColumn] Target container for "${targetColumn}" not found. Expected [data-column="${targetColumn}"] or #${targetColumn}`
    );
    return;
  }

  targetContainer.appendChild(ticket);
  ticket.dataset.column = targetColumn;

  if (typeof window.onTaskColumnChanged === "function") {
    window.onTaskColumnChanged(taskId, targetColumn, sourceColumn);
  }
}

/**
 * Get the current logical column for a ticket element.
 * @param {HTMLElement} ticketEl
 * @returns {string}
 */
function getCurrentColumnForTicket(ticketEl) {
  if (ticketEl?.dataset?.column) return ticketEl.dataset.column;
  const columnEl = ticketEl.closest("[data-column]") || ticketEl.closest(".column");
  if (columnEl) {
    if (/** @type {HTMLElement} */ (columnEl).dataset?.column) return /** @type {HTMLElement} */ (columnEl).dataset.column;
    if ((/** @type {HTMLElement} */ (columnEl)).id) return (/** @type {HTMLElement} */ (columnEl)).id;
  }
  return "";
}

/**
 * Normalize various DOM id / data values to logical column keys.
 * @param {string} raw
 * @returns {"todo"|"inProgress"|"awaitFeedback"|"done"|string}
 */
function normalizeColumnName(raw) {
  if (!raw) return "";
  const v = String(raw).toLowerCase().replace(/\s+/g, "");
  if (v === "todo" || v.includes("to-do-column")) return "todo";
  if (v === "inprogress" || v.includes("in-progress-column")) return "inProgress";
  if (v.startsWith("await") || v.includes("review") || v.includes("await-feedback-column")) return "awaitFeedback";
  if (v === "done" || v.includes("done-column")) return "done";
  return raw;
}

/**
 * Compute allowed move targets from the current column.
 * @param {string} currentColumn
 * @returns {{label:string,col:"todo"|"inProgress"|"awaitFeedback"|"done"}[]}
 */
function getMoveTargetsFor(currentColumn) {
  const col = normalizeColumnName(currentColumn);
  switch (col) {
    case "todo":
      return [{ label: "progress", col: "inProgress" }];
    case "inProgress":
      return [
        { label: "to-do", col: "todo" },
        { label: "awaiting", col: "awaitFeedback" },
      ];
    case "awaitFeedback":
      return [
        { label: "progress", col: "inProgress" },
        { label: "done", col: "done" },
      ];
    case "done":
      return [{ label: "awaiting", col: "awaitFeedback" }];
    default:
      return [];
  }
}
