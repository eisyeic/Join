/**
 * @file Board Ticket & Move Overlay logic.
 * Renders tickets, assigned contacts, subtasks, and controls the move overlay.
 */

import { renderAssignedInitials } from "./board.js";
import { renderSubtaskProgress, getLabelClass } from "./task-overlay.js";

/**
 * Subtask structure.
 * @typedef {Object} Subtask
 * @property {string} name
 * @property {boolean} [checked]
 */

/**
 * Minimal Task structure used for tickets.
 * @typedef {Object} Task
 * @property {string} [id]
 * @property {string} [title]
 * @property {string} [description]
 * @property {"urgent"|"medium"|"low"} [priority]
 * @property {string} [category]
 * @property {string} [column]
 * @property {Subtask[]} [subtasks]
 * @property {Array<{id?:string,name?:string,initials?:string,colorIndex?:number}>} [assignedContacts]
 */

/** @type {HTMLElement|null} Currently open move overlay element, or null */
let _currentMoveOverlay = null;
/** @type {Function|null} Cleanup callback for global overlay listeners */
let _moveOverlayCleanup = null;

// --------------------------------------------------
// Helpers
// --------------------------------------------------

/**
 * Truncates description text for cards without cutting words.
 * @param {string} text
 * @param {number} [max=50]
 * @returns {string}
 */
function truncateForCard(text, max = 50) {
  const s = (text || "").trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut) + "…";
}

/**
 * Builds the HTML markup for a ticket.
 * @param {Task} task
 * @param {string} taskId
 * @returns {string}
 */
function buildTicketHTML(task, taskId) {
  const labelClass = getLabelClass(task.category);
  const desc = task.description || "";
  const truncated = truncateForCard(desc, 50);
  const initials = task.assignedContacts ? renderAssignedInitials(task.assignedContacts) : "";
  return `
    <div class="ticket-content" onclick="showTaskOverlay('${taskId}')">
      <div class="label-box">
        <div class="label ${labelClass}">${task.category ?? ""}</div>
        <img class="plus-minus-img" src="./assets/icons/board/plusminus.svg" alt="plus/minus" draggable="false" role="button" aria-label="More options">
      </div>
      <div class="frame">
        <div class="ticket-title">${task.title ?? ""}</div>
        <div class="ticket-text">${truncated}</div>
      </div>
      ${task.subtasks?.length ? renderSubtaskProgress(task.subtasks) : ""}
      <div class="initials-icon-box">
        <div class="initials">${initials}</div>
        <img src="./assets/icons/board/${task.priority}.svg" alt="${task.priority}">
      </div>
    </div>`;
}

/**
 * Wires up the plus/minus button of a ticket to open the move overlay.
 * @param {HTMLElement} ticket
 * @param {string} taskId
 */
function initPlusMinus(ticket, taskId) {
  const btn = /** @type {HTMLImageElement|null} */(ticket.querySelector(".plus-minus-img"));
  if (!btn) return;
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const col = getCurrentColumnForTicket(ticket);
    openMoveOverlay(btn, taskId, col);
  });
  ["mousedown","touchstart","dragstart"].forEach((t)=>
    btn.addEventListener(t,(e)=>e.stopPropagation(),{passive:true})
  );
}

/**
 * Safely resolves the assigned contacts array from a task.
 * @param {Task} task
 * @returns {Array<{id?:string,name?:string,initials?:string,colorIndex?:number}>}
 */
function resolveContacts(task){
  if (Array.isArray(task?.assignedContacts)) return task.assignedContacts;
  if (Array.isArray(task?.assigned)) return task.assigned;
  return [];
}

/**
 * Repeatedly tries to find an element by ID, then executes a callback.
 * @param {string} id
 * @param {(el:HTMLElement)=>void} fn
 * @param {number} [tries=15]
 */
function retryUntilFound(id, fn, tries=15){
  const el = document.getElementById(id);
  if (el) return fn(el);
  if (tries<=0) return;
  requestAnimationFrame(()=>retryUntilFound(id, fn, tries-1));
}

/**
 * Renders contacts into a container element.
 * @param {HTMLElement} container
 * @param {Array<{id?:string,name?:string,initials?:string,colorIndex?:number}>} contacts
 */
function renderContactsTo(container, contacts){
  container.innerHTML = contacts.map((c)=>{
    const idx = Number.isFinite(c?.colorIndex)?c.colorIndex:0;
    const initials = c?.initials||"";
    const name = c?.name||initials;
    return `<div class="member"><div class="initial-circle" style="background-image:url(./assets/general_elements/icons/color${idx}.svg)">${initials}</div><span>${name}</span></div>`;
  }).join("");
}

/**
 * Builds the subtasks HTML block including checkboxes.
 * @param {Subtask[]} subtasks
 * @returns {string}
 */
function toSubtasksHtml(subtasks){
  return `<b>Subtasks:</b><div class="subtasks-container">${subtasks.map((s,i)=>{
    const chk = s.checked?"checked":"";
    const id = `subtask${i}`;
    const icon = s.checked?"./assets/icons/add_task/check_checked.svg":"./assets/icons/add_task/check_default.svg";
    const cls = s.checked?"checked":"";
    return `<div class="subtask"><input type="checkbox" id="${id}" ${chk} style="display:none"/><label for="${id}" class="${cls}"><img src="${icon}" />${s.name}</label></div>`;
  }).join("")}</div>`;
}

/**
 * Writes a simple fallback when no subtasks are present.
 * @param {HTMLElement} container
 */
function renderNoSubtasks(container){ container.innerHTML = "<b>no subtasks</b>"; }

// --------------------------------------------------
// Move Overlay
// --------------------------------------------------

/**
 * Creates the move overlay element for a given task.
 * @param {string} taskId
 * @param {string} currentColumn
 * @returns {HTMLDivElement}
 */
function createMoveOverlay(taskId, currentColumn){
  const overlay = document.createElement("div");
  overlay.className = "move-overlay";
  overlay.setAttribute("role","menu");
  overlay.dataset.taskId = taskId;
  const order={todo:0,inProgress:1,awaitFeedback:2,done:3};
  const norm=normalizeColumnName(currentColumn);
  const targets=getMoveTargetsFor(currentColumn);
  const body=[`<div class="move-overlay__title">Move to</div>`].concat(targets.map(t=>{
    const dir=(order[t.col]??0)<(order[norm]??0)?"up":"down";
    const icon=dir==="up"?"arrow_upward.svg":"arrow_downward.svg";
    return `<button type="button" class="move-option" data-col="${t.col}" role="menuitem" style="display:flex;align-items:center;gap:8px;background:none;border:none;padding:6px 0;color:inherit;cursor:pointer;text-align:left;width:100%;"><img src="./assets/icons/board/${icon}" alt="" width="16" height="16"><span>${t.label}</span></button>`;
  }));
  overlay.innerHTML = body.join("\n");
  return overlay;
}

/**
 * Attaches click handlers for overlay actions (move up/down/to column).
 * @param {HTMLElement} overlay
 * @param {string} taskId
 */
function attachMoveOverlayHandlers(overlay, taskId){ /* ... */ }

/**
 * Positions the overlay near an anchor element, clamped to the viewport.
 * @param {HTMLElement} anchorEl
 * @param {HTMLElement} overlay
 */
function placeOverlay(anchorEl, overlay){ /* ... */ }

/**
 * Opens (or toggles) the move overlay anchored to the plus/minus button.
 * @param {HTMLElement} anchorEl
 * @param {string} taskId
 * @param {string} currentColumn
 */
function openMoveOverlay(anchorEl, taskId, currentColumn) { /* ... */ }

/**
 * Closes the active move overlay (if any).
 */
function closeMoveOverlay() { /* ... */ }

// --------------------------------------------------
// Ticket Creation & Rendering
// --------------------------------------------------

/**
 * Creates a draggable ticket element for the board.
 * @param {Task} task
 * @param {string} taskId
 * @returns {HTMLDivElement}
 */
export function createTaskElement(task, taskId) {
  const ticket = document.createElement("div");
  ticket.classList.add("ticket");
  ticket.id = taskId; ticket.draggable = true; ticket.setAttribute("ondragstart","drag(event)");
  if (task.column) ticket.dataset.column = task.column;
  ticket.innerHTML = buildTicketHTML(task, taskId);
  initPlusMinus(ticket, taskId);
  return ticket;
}

/**
 * Renders assigned contacts into the task overlay once the container exists.
 * @param {Task} task
 */
export function renderAssignedContacts(task) {
  const contacts = resolveContacts(task);
  retryUntilFound("overlay-members", (container)=>{
    renderContactsTo(/** @type {HTMLElement} */(container), contacts);
  });
}

/**
 * Renders the subtasks section inside the task overlay.
 * @param {Task} task
 */
export function renderSubtasks(task) {
  const container = /** @type {HTMLElement} */(document.getElementById("overlay-subtasks"));
  if (!container) return;
  if (task?.subtasks && task.subtasks.length) {
    container.innerHTML = toSubtasksHtml(task.subtasks);
  } else {
    renderNoSubtasks(container);
  }
}