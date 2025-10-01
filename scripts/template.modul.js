/**
 * @file Board Ticket & Move Overlay logic.
 * Renders tickets, assigned contacts, subtasks, and controls the move overlay.
 */

import { renderAssignedInitials } from "./board.js";
import { renderSubtaskProgress, getLabelClass } from "./task-overlay-core.js";

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
 * Gets task description or empty string
 * @param {Task} task
 * @returns {string}
 */
function getTaskDescription(task) {
  return task.description || "";
}

/**
 * Gets task category or empty string
 * @param {Task} task
 * @returns {string}
 */
function getTaskCategory(task) {
  return task.category ?? "";
}

/**
 * Gets task title or empty string
 * @param {Task} task
 * @returns {string}
 */
function getTaskTitle(task) {
  return task.title ?? "";
}

/**
 * Renders initials for assigned contacts
 * @param {Task} task
 * @returns {string}
 */
function renderTaskInitials(task) {
  return task.assignedContacts ? renderAssignedInitials(task.assignedContacts) : "";
}

/**
 * Renders subtasks progress HTML
 * @param {Task} task
 * @returns {string}
 */
function renderTaskSubtasks(task) {
  return task.subtasks?.length ? renderSubtaskProgress(task.subtasks) : "";
}

/**
 * Creates ticket template data object
 * @param {Task} task
 * @param {string} taskId
 * @returns {Object}
 */
function createTicketTemplateData(task, taskId) {
  return {
    taskId: taskId,
    labelClass: getLabelClass(task.category),
    category: getTaskCategory(task),
    title: getTaskTitle(task),
    truncatedDesc: truncateForCard(getTaskDescription(task), 50),
    subtasksHtml: renderTaskSubtasks(task),
    initials: renderTaskInitials(task),
    priority: task.priority
  };
}

/**
 * Builds the HTML markup for a ticket.
 * @param {Task} task
 * @param {string} taskId
 * @returns {string}
 */
function buildTicketHTML(task, taskId) {
  const templateData = createTicketTemplateData(task, taskId);
  return window.ticketTemplate(templateData);
}

/**
 * Finds plus/minus button in ticket
 * @param {HTMLElement} ticket
 * @returns {HTMLImageElement|null}
 */
function findPlusMinusButton(ticket) {
  return /** @type {HTMLImageElement|null} */(ticket.querySelector(".plus-minus-img"));
}

/**
 * Gets current column for a ticket
 * @param {HTMLElement} ticket
 * @returns {string}
 */
function getCurrentColumnForTicket(ticket) {
  return ticket.dataset.column || ticket.closest('[data-column]')?.dataset.column || 'todo';
}

/**
 * Normalizes column name
 * @param {string} columnName
 * @returns {string}
 */
function normalizeColumnName(columnName) {
  const mapping = {
    'todo': 'todo',
    'in-progress': 'inProgress',
    'inProgress': 'inProgress',
    'await-feedback': 'awaitFeedback',
    'awaitFeedback': 'awaitFeedback',
    'done': 'done'
  };
  return mapping[columnName] || 'todo';
}

/**
 * Gets move targets for current column
 * @param {string} currentColumn
 * @returns {Array<{col: string, label: string}>}
 */
function getMoveTargetsFor(currentColumn) {
  const allTargets = [
    { col: 'todo', label: 'To Do' },
    { col: 'inProgress', label: 'In Progress' },
    { col: 'awaitFeedback', label: 'Await Feedback' },
    { col: 'done', label: 'Done' }
  ];
  const normalized = normalizeColumnName(currentColumn);
  return allTargets.filter(target => target.col !== normalized);
}

/**
 * Handles plus/minus button click
 * @param {Event} e
 * @param {HTMLElement} btn
 * @param {HTMLElement} ticket
 * @param {string} taskId
 */
function handlePlusMinusClick(e, btn, ticket, taskId) {
  e.stopPropagation();
  const col = getCurrentColumnForTicket(ticket);
  openMoveOverlay(btn, taskId, col);
}

/**
 * Adds click event listener to plus/minus button
 * @param {HTMLElement} btn
 * @param {HTMLElement} ticket
 * @param {string} taskId
 */
function addPlusMinusClickListener(btn, ticket, taskId) {
  btn.addEventListener("click", (e) => {
    handlePlusMinusClick(e, btn, ticket, taskId);
  });
}

/**
 * Prevents event propagation
 * @param {Event} e
 */
function stopEventPropagation(e) {
  e.stopPropagation();
}

/**
 * Adds drag prevention listeners to plus/minus button
 * @param {HTMLElement} btn
 */
function addDragPreventionListeners(btn) {
  ["mousedown","touchstart","dragstart"].forEach((eventType) => {
    btn.addEventListener(eventType, stopEventPropagation, {passive:true});
  });
}

/**
 * Wires up the plus/minus button of a ticket to open the move overlay.
 * @param {HTMLElement} ticket
 * @param {string} taskId
 */
function initPlusMinus(ticket, taskId) {
  const btn = findPlusMinusButton(ticket);
  if (!btn) return;
  addPlusMinusClickListener(btn, ticket, taskId);
  addDragPreventionListeners(btn);
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
 * Gets contact color index or default
 * @param {Object} contact
 * @returns {number}
 */
function getContactColorIndex(contact) {
  return Number.isFinite(contact?.colorIndex) ? contact.colorIndex : 0;
}

/**
 * Gets contact initials or empty string
 * @param {Object} contact
 * @returns {string}
 */
function getContactInitials(contact) {
  return contact?.initials || "";
}

/**
 * Gets contact name or falls back to initials
 * @param {Object} contact
 * @returns {string}
 */
function getContactName(contact) {
  return contact?.name || getContactInitials(contact);
}

/**
 * Creates HTML for a single contact member
 * @param {Object} contact
 * @returns {string}
 */
function createContactMemberHTML(contact) {
  const idx = getContactColorIndex(contact);
  const initials = getContactInitials(contact);
  const name = getContactName(contact);
  return `<div class="member"><div class="initial-circle" style="background-image:url(./assets/general_elements/icons/color${idx}.svg)">${initials}</div><span>${name}</span></div>`;
}

/**
 * Maps contacts to HTML strings
 * @param {Array<Object>} contacts
 * @returns {string[]}
 */
function mapContactsToHTML(contacts) {
  return contacts.map(createContactMemberHTML);
}

/**
 * Renders contacts into a container element.
 * @param {HTMLElement} container
 * @param {Array<{id?:string,name?:string,initials?:string,colorIndex?:number}>} contacts
 */
function renderContactsTo(container, contacts){
  const htmlArray = mapContactsToHTML(contacts);
  container.innerHTML = htmlArray.join("");
}

/**
 * Gets checked attribute string for subtask
 * @param {Subtask} subtask
 * @returns {string}
 */
function getSubtaskCheckedAttr(subtask) {
  return subtask.checked ? "checked" : "";
}

/**
 * Gets subtask ID
 * @param {number} index
 * @returns {string}
 */
function getSubtaskId(index) {
  return `subtask${index}`;
}

/**
 * Gets subtask icon path
 * @param {Subtask} subtask
 * @returns {string}
 */
function getSubtaskIcon(subtask) {
  return subtask.checked 
    ? "./assets/icons/add_task/check_checked.svg" 
    : "./assets/icons/add_task/check_default.svg";
}

/**
 * Gets subtask CSS class
 * @param {Subtask} subtask
 * @returns {string}
 */
function getSubtaskClass(subtask) {
  return subtask.checked ? "checked" : "";
}

/**
 * Creates HTML for a single subtask
 * @param {Subtask} subtask
 * @param {number} index
 * @returns {string}
 */
function createSubtaskHTML(subtask, index) {
  const chk = getSubtaskCheckedAttr(subtask);
  const id = getSubtaskId(index);
  const icon = getSubtaskIcon(subtask);
  const cls = getSubtaskClass(subtask);
  return `<div class="subtask"><input type="checkbox" id="${id}" ${chk} style="display:none"/><label for="${id}" class="${cls}"><img src="${icon}" />${subtask.name}</label></div>`;
}

/**
 * Maps subtasks to HTML strings
 * @param {Subtask[]} subtasks
 * @returns {string[]}
 */
function mapSubtasksToHTML(subtasks) {
  return subtasks.map(createSubtaskHTML);
}

/**
 * Creates subtasks container HTML
 * @param {string} subtasksHTML
 * @returns {string}
 */
function createSubtasksContainer(subtasksHTML) {
  return `<div class="subtasks-container">${subtasksHTML}</div>`;
}

/**
 * Creates subtasks title
 * @returns {string}
 */
function createSubtasksTitle() {
  return "<b>Subtasks:</b>";
}

/**
 * Builds the subtasks HTML block including checkboxes.
 * @param {Subtask[]} subtasks
 * @returns {string}
 */
function toSubtasksHtml(subtasks){
  const title = createSubtasksTitle();
  const htmlArray = mapSubtasksToHTML(subtasks);
  const container = createSubtasksContainer(htmlArray.join(""));
  return title + container;
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
 * Creates base overlay element
 * @returns {HTMLDivElement}
 */
function createBaseOverlayElement() {
  const overlay = document.createElement("div");
  overlay.className = "move-overlay";
  return overlay;
}

/**
 * Sets overlay task ID
 * @param {HTMLElement} overlay
 * @param {string} taskId
 */
function setOverlayTaskId(overlay, taskId) {
  overlay.dataset.taskId = taskId;
}

/**
 * Gets column order mapping
 * @returns {Object}
 */
function getColumnOrder() {
  return {todo:0, inProgress:1, awaitFeedback:2, done:3};
}

/**
 * Determines move direction
 * @param {Object} order
 * @param {string} targetCol
 * @param {string} currentCol
 * @returns {string}
 */
function getMoveDirection(order, targetCol, currentCol) {
  return (order[targetCol] ?? 0) < (order[currentCol] ?? 0) ? "up" : "down";
}

/**
 * Gets arrow icon for direction
 * @param {string} direction
 * @returns {string}
 */
function getArrowIcon(direction) {
  return direction === "up" ? "arrow_upward.svg" : "arrow_downward.svg";
}

/**
 * Creates move option button HTML
 * @param {Object} target
 * @param {string} icon
 * @returns {string}
 */
function createMoveOptionHTML(target, icon) {
  return `<div class="move-option" data-col="${target.col}" style="cursor:pointer;color:white;font-size:16px;padding:8px;border-radius:4px;display:flex;align-items:center;margin-bottom:8px;" onmouseover="this.style.backgroundColor='rgba(255,255,255,0.2)'" onmouseout="this.style.backgroundColor='transparent'"><img src="./assets/icons/board/${icon}" alt="" width="16" height="16" style="filter:brightness(0) invert(1);margin-right:8px;">${target.label}</div>`;
}

/**
 * Creates move overlay title
 * @returns {string}
 */
function createMoveOverlayTitle() {
  return ``;
}

/**
 * Maps targets to HTML buttons
 * @param {Array} targets
 * @param {Object} order
 * @param {string} currentColumn
 * @returns {string[]}
 */
function mapTargetsToHTML(targets, order, currentColumn) {
  const norm = normalizeColumnName(currentColumn);
  return targets.map(target => {
    const dir = getMoveDirection(order, target.col, norm);
    const icon = getArrowIcon(dir);
    return createMoveOptionHTML(target, icon);
  });
}

/**
 * Creates overlay body HTML
 * @param {string} currentColumn
 * @returns {string[]}
 */
function createOverlayBodyHTML(currentColumn) {
  const order = getColumnOrder();
  const targets = getMoveTargetsFor(currentColumn);
  const title = createMoveOverlayTitle();
  const buttons = mapTargetsToHTML(targets, order, currentColumn);
  return [title].concat(buttons);
}

/**
 * Sets overlay innerHTML
 * @param {HTMLElement} overlay
 * @param {string[]} bodyHTML
 */
function setOverlayContent(overlay, bodyHTML) {
  overlay.innerHTML = bodyHTML.join("\n");
}

/**
 * Creates the move overlay element for a given task.
 * @param {string} taskId
 * @param {string} currentColumn
 * @returns {HTMLDivElement}
 */
function createMoveOverlay(taskId, currentColumn){
  const overlay = createBaseOverlayElement();
  setOverlayTaskId(overlay, taskId);
  const bodyHTML = createOverlayBodyHTML(currentColumn);
  setOverlayContent(overlay, bodyHTML);
  return overlay;
}

/**
 * Moves task to target column
 * @param {string} taskId
 * @param {string} targetColumn
 */
function moveTask(taskId, targetColumn) {
  if (typeof window.moveTaskDomByLogical === 'function') {
    window.moveTaskDomByLogical(taskId, targetColumn);
  } else if (typeof window.updateTaskColumn === 'function') {
    window.updateTaskColumn(taskId, targetColumn);
  }
}

/**
 * Attaches click handlers for overlay actions (move up/down/to column).
 * @param {HTMLElement} overlay
 * @param {string} taskId
 */
function attachMoveOverlayHandlers(overlay, taskId) {
  overlay.addEventListener('click', (e) => {
    const button = e.target.closest('.move-option');
    if (button) {
      const targetColumn = button.dataset.col;
      if (targetColumn) {
        moveTask(taskId, targetColumn);
      }
      closeMoveOverlay();
    }
  });
}

/**
 * Positions the overlay near an anchor element, clamped to the viewport.
 * @param {HTMLElement} anchorEl
 * @param {HTMLElement} overlay
 */
function placeOverlay(anchorEl, overlay) {
  const ticket = anchorEl.closest('.ticket');
  ticket.style.position = 'relative';
  overlay.style.position = 'absolute';
  overlay.style.right = '0';
  overlay.style.top = '0px';
  ticket.appendChild(overlay);
}

/**
 * Opens (or toggles) the move overlay anchored to the plus/minus button.
 * @param {HTMLElement} anchorEl
 * @param {string} taskId
 * @param {string} currentColumn
 */
function openMoveOverlay(anchorEl, taskId, currentColumn) {
  if (_currentMoveOverlay) {
    closeMoveOverlay();
    return;
  }
  
  const overlay = createMoveOverlay(taskId, currentColumn);
  attachMoveOverlayHandlers(overlay, taskId);
  placeOverlay(anchorEl, overlay);
  
  _currentMoveOverlay = overlay;
  
  // Close on outside click
  const handleOutsideClick = (e) => {
    if (!overlay.contains(e.target)) {
      closeMoveOverlay();
    }
  };
  
  setTimeout(() => {
    document.addEventListener('click', handleOutsideClick);
    _moveOverlayCleanup = () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, 0);
}

/**
 * Closes the active move overlay (if any).
 */
function closeMoveOverlay() {
  if (_currentMoveOverlay) {
    _currentMoveOverlay.remove();
    _currentMoveOverlay = null;
  }
  if (_moveOverlayCleanup) {
    _moveOverlayCleanup();
    _moveOverlayCleanup = null;
  }
}

// --------------------------------------------------
// Ticket Creation & Rendering
// --------------------------------------------------

/**
 * Creates base ticket element
 * @returns {HTMLDivElement}
 */
function createBaseTicketElement() {
  return document.createElement("div");
}

/**
 * Adds ticket CSS class
 * @param {HTMLElement} ticket
 */
function addTicketClass(ticket) {
  ticket.classList.add("ticket");
}

/**
 * Sets ticket ID
 * @param {HTMLElement} ticket
 * @param {string} taskId
 */
function setTicketId(ticket, taskId) {
  ticket.id = taskId;
}

/**
 * Makes ticket draggable
 * @param {HTMLElement} ticket
 */
function makeTicketDraggable(ticket) {
  ticket.draggable = true;
  ticket.setAttribute("ondragstart", "drag(event)");
}

/**
 * Sets ticket column data
 * @param {HTMLElement} ticket
 * @param {Task} task
 */
function setTicketColumnData(ticket, task) {
  if (task.column) {
    ticket.dataset.column = task.column;
  }
}

/**
 * Sets ticket HTML content
 * @param {HTMLElement} ticket
 * @param {Task} task
 * @param {string} taskId
 */
function setTicketContent(ticket, task, taskId) {
  ticket.innerHTML = buildTicketHTML(task, taskId);
}

/**
 * Configures ticket element properties
 * @param {HTMLElement} ticket
 * @param {Task} task
 * @param {string} taskId
 */
function configureTicketElement(ticket, task, taskId) {
  addTicketClass(ticket);
  setTicketId(ticket, taskId);
  makeTicketDraggable(ticket);
  setTicketColumnData(ticket, task);
  setTicketContent(ticket, task, taskId);
}

/**
 * Creates a draggable ticket element for the board.
 * @param {Task} task
 * @param {string} taskId
 * @returns {HTMLDivElement}
 */
export function createTaskElement(task, taskId) {
  const ticket = createBaseTicketElement();
  configureTicketElement(ticket, task, taskId);
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
 * Gets subtasks overlay container
 * @returns {HTMLElement|null}
 */
function getSubtasksContainer() {
  return /** @type {HTMLElement} */(document.getElementById("overlay-subtasks"));
}

/**
 * Checks if task has subtasks
 * @param {Task} task
 * @returns {boolean}
 */
function hasSubtasks(task) {
  return task?.subtasks && task.subtasks.length > 0;
}

/**
 * Renders subtasks HTML to container
 * @param {HTMLElement} container
 * @param {Subtask[]} subtasks
 */
function renderSubtasksHTML(container, subtasks) {
  container.innerHTML = toSubtasksHtml(subtasks);
}

/**
 * Renders the subtasks section inside the task overlay.
 * @param {Task} task
 */
export function renderSubtasks(task) {
  const container = getSubtasksContainer();
  if (!container) return;
  
  if (hasSubtasks(task)) {
    renderSubtasksHTML(container, task.subtasks);
  } else {
    renderNoSubtasks(container);
  }
}
/** Make moveTask globally available */
window.moveTask = moveTask;