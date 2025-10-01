/**
 * @file Ticket helper functions for text processing and data extraction.
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

/**
 * Truncates description text for cards without cutting words.
 * @param {string} text
 * @param {number} [max=50]
 * @returns {string}
 */
export function truncateForCard(text, max = 50) {
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
export function getTaskDescription(task) {
  return task.description || "";
}

/**
 * Gets task category or empty string
 * @param {Task} task
 * @returns {string}
 */
export function getTaskCategory(task) {
  return task.category ?? "";
}

/**
 * Gets task title or empty string
 * @param {Task} task
 * @returns {string}
 */
export function getTaskTitle(task) {
  return task.title ?? "";
}

/**
 * Renders initials for assigned contacts
 * @param {Task} task
 * @returns {string}
 */
export function renderTaskInitials(task) {
  return task.assignedContacts ? renderAssignedInitials(task.assignedContacts) : "";
}

/**
 * Renders subtasks progress HTML
 * @param {Task} task
 * @returns {string}
 */
export function renderTaskSubtasks(task) {
  return task.subtasks?.length ? renderSubtaskProgress(task.subtasks) : "";
}

/**
 * Creates ticket template data object
 * @param {Task} task
 * @param {string} taskId
 * @returns {Object}
 */
export function createTicketTemplateData(task, taskId) {
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
export function buildTicketHTML(task, taskId) {
  const templateData = createTicketTemplateData(task, taskId);
  return window.ticketTemplate(templateData);
}

/**
 * Safely resolves the assigned contacts array from a task.
 * @param {Task} task
 * @returns {Array<{id?:string,name?:string,initials?:string,colorIndex?:number}>}
 */
export function resolveContacts(task){
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
export function retryUntilFound(id, fn, tries=15){
  const el = document.getElementById(id);
  if (el) return fn(el);
  if (tries<=0) return;
  requestAnimationFrame(()=>retryUntilFound(id, fn, tries-1));
}