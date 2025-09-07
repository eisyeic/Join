import { renderAssignedInitials } from "./board.js";
import { truncateDescription, renderSubtaskProgress, getLabelClass } from "./task-overlay.js";

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

/**
 * Holds the currently open move overlay element, or null if none is open.
 * Used to ensure only one overlay exists at a time.
 * @type {HTMLDivElement|null}
 */
let _currentMoveOverlay = null;
/**
 * Cleanup callback for global listeners registered by the move overlay.
 * If set, calling this function removes event listeners and resets state.
 * @type {(() => void)|null}
 */
let _moveOverlayCleanup = null;

/** Small helpers (≤14 lines each) **/

/**
 * Builds the inner HTML string for a board ticket.
 * Keeps markup small; heavy logic is delegated to helpers.
 * @param {Task} task - The task data used to render the ticket.
 * @param {string} taskId - Unique identifier of the task.
 * @returns {string} HTML string for the ticket content.
 */
function buildTicketHTML(task, taskId) {
  const labelClass = getLabelClass(task.category);
  const truncated = truncateDescription(task.description || "");
  const initials = task.assignedContacts ? renderAssignedInitials(task.assignedContacts) : "";
  return `
    <div class="ticket-content" onclick="showTaskOverlay('${taskId}')">
      <div class="label-box">
        <div class="label ${labelClass}">${task.category ?? ""}</div>
        <img class="plus-minus-img" src="./assets/icons/board/plusminus.svg" alt="plus/minus" draggable="false" role="button" aria-label="Weitere Optionen">
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
 * Wires the plus/minus button inside a ticket to open the move overlay.
 * Stops event propagation to avoid triggering the ticket click handler.
 * @param {HTMLElement} ticket - The ticket root element.
 * @param {string} taskId - The task identifier bound to this ticket.
 * @returns {void}
 */
function initPlusMinus(ticket, taskId) {
  const btn = /** @type {HTMLImageElement|null} */(ticket.querySelector(".plus-minus-img"));
  if (!btn) return;
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const col = getCurrentColumnForTicket(ticket);
    openMoveOverlay(btn, taskId, col);
  });
  ["mousedown","touchstart","dragstart"].forEach((t)=>btn.addEventListener(t,(e)=>e.stopPropagation(),{passive:true}));
}

/**
 * Safely resolves the assigned contacts array from a task.
 * @param {Task} task
 * @returns {AssignedContact[]} Array of contacts (possibly empty).
 */
function resolveContacts(task){
  return Array.isArray(task?.assignedContacts) ? task.assignedContacts : [];
}

/**
 * Repeatedly tries to find an element by id, then executes a callback.
 * Useful when rendering into elements that appear asynchronously.
 * @param {string} id - Target element id.
 * @param {(el:HTMLElement)=>void} fn - Callback invoked with the element.
 * @param {number} [tries=15] - Maximum animation frames to retry.
 * @returns {void}
 */
function retryUntilFound(id, fn, tries=15){
  const el = document.getElementById(id);
  if (el) return fn(el);
  if (tries<=0) return;
  requestAnimationFrame(()=>retryUntilFound(id, fn, tries-1));
}

/**
 * Renders a list of contacts into a container element.
 * @param {HTMLElement} container - Target container for DOM injection.
 * @param {AssignedContact[]} contacts - Contacts to render.
 * @returns {void}
 */
function renderContactsTo(container, contacts){
  container.innerHTML = contacts.map((c)=>{
    const idx = Number.isFinite(c?.colorIndex)?c.colorIndex:0;
    const initials = c?.initials||"";
    const name = c?.name||initials;
    return `<div class="member"><div class="initial-circle" style="background-image:url(../assets/icons/contact/color${idx}.svg)">${initials}</div><span>${name}</span></div>`;
  }).join("");
}

/**
 * Creates the subtasks HTML block including check visuals.
 * @param {Subtask[]} subtasks - List of subtasks to display.
 * @returns {string} HTML string representing the subtasks section.
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
 * @returns {void}
 */
function renderNoSubtasks(container){ container.innerHTML = "<b>no subtasks</b>"; }

/**
 * Creates the move overlay element for a given task.
 * @param {string} taskId - Task id to attach to the overlay dataset.
 * @param {string} currentColumn - The ticket's current logical column.
 * @returns {HTMLDivElement} The constructed overlay element.
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
 * Attaches event handlers for overlay actions (move up/down/to column).
 * @param {HTMLDivElement} overlay - The overlay root element.
 * @param {string} taskId - The associated task id.
 * @returns {void}
 */
function attachMoveOverlayHandlers(overlay, taskId){
  overlay.addEventListener("mousedown", (e)=>e.stopPropagation());
  overlay.addEventListener("touchstart", (e)=>e.stopPropagation(), {passive:true});
  overlay.addEventListener("click", (e)=>{
    e.stopPropagation();
    const trg = e.target instanceof Element ? e.target.closest("[data-col],[data-action]") : null;
    if(!trg) return;
    const action = trg.getAttribute("data-action");
    const col = trg.getAttribute("data-col");
    if (action==="up") moveTaskUp(taskId);
    else if (action==="down") moveTaskDown(taskId);
    else if (col) moveTaskToColumn(taskId, col);
    closeMoveOverlay();
  });
}

/**
 * Positions the overlay near an anchor element and clamps to viewport.
 * @param {Element} anchorEl - Anchor used to compute the position.
 * @param {HTMLDivElement} overlay - The overlay element to position.
 * @returns {void}
 */
function placeOverlay(anchorEl, overlay){
  const M=8, r=anchorEl.getBoundingClientRect();
  document.body.appendChild(overlay);
  overlay.style.display="flex"; overlay.style.visibility="hidden"; overlay.style.position="fixed"; overlay.style.zIndex="9999";
  const { width:ow, height:oh } = overlay.getBoundingClientRect();
  let top=r.top, left=r.right-ow;
  if(left<M) left=M; if(left+ow>innerWidth-M) left=innerWidth-M-ow;
  if(top<M) top=M; if(top+oh>innerHeight-M) top=innerHeight-M-oh;
  overlay.style.left=`${Math.round(left)}px`; overlay.style.top=`${Math.round(top)}px`;
}

/**
 * Plays a small open animation and focuses the overlay for accessibility.
 * @param {HTMLDivElement} overlay
 * @returns {void}
 */
function animateOpen(overlay){
  overlay.style.transition="opacity 140ms ease, transform 140ms ease";
  overlay.style.transformOrigin="top right";
  overlay.style.transform="translate(0,0) scale(0.98)";
  overlay.style.opacity="0"; overlay.style.visibility="visible";
  requestAnimationFrame(()=>{ overlay.classList.add("is-open"); overlay.style.opacity="1"; overlay.style.transform="translate(0,0) scale(1)"; });
  overlay.tabIndex=-1; overlay.focus?.();
}

/**
 * Registers global listeners to close the overlay on outside interactions.
 * Stores a cleanup function in `_moveOverlayCleanup`.
 * @param {HTMLDivElement} overlay
 * @returns {void}
 */
function registerGlobalOverlayCleanup(overlay){
  const onDocClick=(ev)=>{ if(!overlay.contains(ev.target)) closeMoveOverlay(); };
  const onKey=(ev)=>{ if(ev.key==="Escape") closeMoveOverlay(); };
  const onAny=()=>closeMoveOverlay();
  document.addEventListener("click", onDocClick, {capture:true});
  document.addEventListener("keydown", onKey);
  ["scroll","wheel","touchmove"].forEach(t=>document.addEventListener(t,onAny,{capture:true,passive:true}));
  window.addEventListener("resize", onAny);
  _moveOverlayCleanup=()=>{
    document.removeEventListener("click", onDocClick, {capture:true});
    document.removeEventListener("keydown", onKey);
    ["scroll","wheel","touchmove"].forEach(t=>document.removeEventListener(t,onAny,{capture:true}));
    window.removeEventListener("resize", onAny);
  };
}

/**
 * Animates the closing of an overlay and invokes a completion callback.
 * @param {HTMLDivElement} el - The overlay element being closed.
 * @param {() => void} after - Callback run after the animation finishes.
 * @returns {void}
 */
function animateClose(el, after){
  el.style.transform="translate(0,0) scale(0.98)"; el.style.opacity="0"; el.classList.remove("is-open");
  let done=false; const onEnd=()=>{ if(done) return; done=true; el.removeEventListener("transitionend", onEnd); after(); };
  el.addEventListener("transitionend", onEnd, {once:true}); setTimeout(onEnd, 240);
}

/**
 * Executes the stored overlay cleanup (if any) and clears the reference.
 * @returns {void}
 */
function runMoveOverlayCleanup(){ if(_moveOverlayCleanup){ _moveOverlayCleanup(); _moveOverlayCleanup=null; } }

/**
 * Finds the previous/next sibling that has the `ticket` class.
 * @param {Element} el - Starting ticket element.
 * @param {"prev"|"next"} dir - Direction to search.
 * @returns {Element|null}
 */
function getSiblingTicket(el, dir){
  let sib = dir==="prev" ? el.previousElementSibling : el.nextElementSibling;
  while (sib && !sib.classList.contains("ticket")) sib = dir==="prev" ? sib.previousElementSibling : sib.nextElementSibling;
  return sib;
}

/**
 * Notifies external code that the order of tickets has changed.
 * Calls a global hook if it exists.
 * @param {Element} parent - The column container whose order changed.
 * @returns {void}
 */
function notifyOrderChanged(parent){ if (typeof window.onTaskOrderChanged === "function") window.onTaskOrderChanged(parent); }

/**
 * Resolves the DOM container for a logical column key.
 * @param {string} targetColumn - Column key (e.g., "todo").
 * @returns {HTMLElement|null}
 */
function findTargetContainer(targetColumn){
  return document.querySelector(`[data-column="${targetColumn}"]`) || document.getElementById(targetColumn);
}

/**
 * Creates a draggable ticket element for the board.
 * @param {Task} task - Task payload to render.
 * @param {string} taskId - Unique task id used as DOM id.
 * @returns {HTMLDivElement} The ticket element.
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
 * Safe to call before the overlay is attached; it retries briefly.
 * @param {Task} task
 * @returns {void}
 */
export function renderAssignedContacts(task) {
  const contacts = resolveContacts(task);
  retryUntilFound("overlay-members", (container)=>{
    renderContactsTo(/** @type {HTMLElement} */(container), contacts);
  });
}

/** Expose for inline handlers if needed. */
window.renderAssignedContacts = renderAssignedContacts;

/**
 * Renders the subtasks section inside the task overlay.
 * @param {Task} task
 * @returns {void}
 */
export function renderSubtasks(task) {
  const container = /** @type {HTMLElement} */($("overlay-subtasks"));
  if (task.subtasks && task.subtasks.length) container.innerHTML = toSubtasksHtml(task.subtasks);
  else renderNoSubtasks(container);
}

/**
 * Opens (or toggles) the move overlay anchored to the plus/minus button.
 * Ensures any previously open overlay is closed first.
 * @param {Element} anchorEl - Anchor for positioning.
 * @param {string} taskId - Task id for actions.
 * @param {string} currentColumn - Current logical column of the ticket.
 * @returns {void}
 */
function openMoveOverlay(anchorEl, taskId, currentColumn) {
  if (_currentMoveOverlay && _currentMoveOverlay.dataset.taskId === String(taskId)) { closeMoveOverlay(); return; }
  closeMoveOverlay();
  const overlay = createMoveOverlay(taskId, currentColumn);
  attachMoveOverlayHandlers(overlay, taskId);
  placeOverlay(anchorEl, overlay);
  animateOpen(overlay);
  registerGlobalOverlayCleanup(overlay);
  _currentMoveOverlay = overlay;
}

/**
 * Closes the active move overlay (if any) and cleans up listeners.
 * @returns {void}
 */
function closeMoveOverlay() {
  if (_currentMoveOverlay) {
    const el = _currentMoveOverlay; _currentMoveOverlay = null;
    animateClose(el, ()=>{ el.remove(); runMoveOverlayCleanup(); });
    return;
  }
  runMoveOverlayCleanup();
}

/**
 * Moves the ticket one position up within its current column.
 * @param {string} taskId
 * @returns {void}
 */
function moveTaskUp(taskId){
  const ticket = /** @type {HTMLElement|null} */(document.getElementById(String(taskId))); if(!ticket) return;
  const parent = ticket.parentElement; if(!parent) return;
  const prev = /** @type {Element|null} */(getSiblingTicket(ticket,"prev"));
  if (prev) { parent.insertBefore(ticket, prev); notifyOrderChanged(parent); }
}

/**
 * Moves the ticket one position down within its current column.
 * @param {string} taskId
 * @returns {void}
 */
function moveTaskDown(taskId){
  const ticket = /** @type {HTMLElement|null} */(document.getElementById(String(taskId))); if(!ticket) return;
  const parent = ticket.parentElement; if(!parent) return;
  const next = /** @type {Element|null} */(getSiblingTicket(ticket,"next"));
  if (next) { parent.insertBefore(next, ticket); notifyOrderChanged(parent); }
}

/**
 * Moves the ticket to a different column. If a bridge hook exists, use it.
 * @param {string} taskId
 * @param {"todo"|"inProgress"|"awaitFeedback"|"done"|string} targetColumn
 * @returns {void}
 */
function moveTaskToColumn(taskId, targetColumn){
  const ticket = /** @type {HTMLElement|null} */(document.getElementById(String(taskId))); if(!ticket) return;
  const source = getCurrentColumnForTicket(ticket);
  if (typeof window.onTaskColumnChanged === "function") { window.onTaskColumnChanged(taskId, targetColumn); return; }
  const target = /** @type {HTMLElement|null} */(findTargetContainer(targetColumn)); if(!target){ console.warn(`[moveTaskToColumn] Target container for "${targetColumn}" not found.`); return; }
  target.appendChild(ticket); ticket.dataset.column = targetColumn;
  if (typeof window.onTaskColumnChanged === "function") window.onTaskColumnChanged(taskId, targetColumn, source);
}

/**
 * Infers the logical column from a ticket element or its closest container.
 * @param {HTMLElement} ticketEl
 * @returns {string} Logical column key or empty string if unknown.
 */
function getCurrentColumnForTicket(ticketEl){
  if (ticketEl?.dataset?.column) return ticketEl.dataset.column;
  const colEl = ticketEl.closest("[data-column]") || ticketEl.closest(".column");
  if (colEl) return /** @type {HTMLElement} */(colEl).dataset?.column || /** @type {HTMLElement} */(colEl).id || "";
  return "";
}

/**
 * Normalizes various DOM ids/data attributes to the app's column keys.
 * @param {string} raw
 * @returns {"todo"|"inProgress"|"awaitFeedback"|"done"|string}
 */
function normalizeColumnName(raw){
  if(!raw) return ""; const v=String(raw).toLowerCase().replace(/\s+/g,"");
  if(v==="todo"||v.includes("to-do-column")) return "todo";
  if(v==="inprogress"||v.includes("in-progress-column")) return "inProgress";
  if(v.startsWith("await")||v.includes("review")||v.includes("await-feedback-column")) return "awaitFeedback";
  if(v==="done"||v.includes("done-column")) return "done"; return raw;
}

/**
 * Returns allowed move targets for a given current column.
 * @param {string} currentColumn
 * @returns {{label:string,col:"todo"|"inProgress"|"awaitFeedback"|"done"}[]}
 */
function getMoveTargetsFor(currentColumn){
  const map={ todo:[{label:"progress",col:"inProgress"}], inProgress:[{label:"to-do",col:"todo"},{label:"awaiting",col:"awaitFeedback"}], awaitFeedback:[{label:"progress",col:"inProgress"},{label:"done",col:"done"}], done:[{label:"awaiting",col:"awaitFeedback"}] };
  return map[normalizeColumnName(currentColumn)]||[];
}
