/**
 * @file Plus/minus button handling for tickets.
 */

import { getCurrentColumnForTicket } from "./column-helpers.js";
import { openMoveOverlay } from "./move-overlay.js";

/**
 * Finds plus/minus button in ticket
 * @param {HTMLElement} ticket
 * @returns {HTMLImageElement|null}
 */
function findPlusMinusButton(ticket) {
  return /** @type {HTMLImageElement|null} */(ticket.querySelector(".plus-minus-img"));
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
export function initPlusMinus(ticket, taskId) {
  const btn = findPlusMinusButton(ticket);
  if (!btn) return;
  addPlusMinusClickListener(btn, ticket, taskId);
  addDragPreventionListeners(btn);
}