/**
 * @file Main template module - Board Ticket & Move Overlay logic.
 * Renders tickets, assigned contacts, subtasks, and controls the move overlay.
 */

import { buildTicketHTML, resolveContacts, retryUntilFound } from "./ticket-helpers.js";
import { renderContactsTo } from "./contact-renderer.js";
import { toSubtasksHtml, renderNoSubtasks } from "./subtask-renderer.js";
import { initPlusMinus } from "./plus-minus-handler.js";

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