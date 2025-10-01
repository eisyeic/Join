/**
 * @file Move overlay functionality for tickets.
 */

import { normalizeColumnName, getMoveTargetsFor, getColumnOrder, getMoveDirection, getArrowIcon } from "./column-helpers.js";

/** @type {HTMLElement|null} Currently open move overlay element, or null */
let _currentMoveOverlay = null;
/** @type {Function|null} Cleanup callback for global overlay listeners */
let _moveOverlayCleanup = null;

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
export function openMoveOverlay(anchorEl, taskId, currentColumn) {
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
export function closeMoveOverlay() {
  if (_currentMoveOverlay) {
    _currentMoveOverlay.remove();
    _currentMoveOverlay = null;
  }
  if (_moveOverlayCleanup) {
    _moveOverlayCleanup();
    _moveOverlayCleanup = null;
  }
}

/** Make moveTask globally available */
window.moveTask = moveTask;