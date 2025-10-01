/**
 * @file Column and move target helper functions.
 */

/**
 * Normalizes column name
 * @param {string} columnName
 * @returns {string}
 */
export function normalizeColumnName(columnName) {
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
export function getMoveTargetsFor(currentColumn) {
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
 * Gets current column for a ticket
 * @param {HTMLElement} ticket
 * @returns {string}
 */
export function getCurrentColumnForTicket(ticket) {
  return ticket.dataset.column || ticket.closest('[data-column]')?.dataset.column || 'todo';
}

/**
 * Gets column order mapping
 * @returns {Object}
 */
export function getColumnOrder() {
  return {todo:0, inProgress:1, awaitFeedback:2, done:3};
}

/**
 * Determines move direction
 * @param {Object} order
 * @param {string} targetCol
 * @param {string} currentCol
 * @returns {string}
 */
export function getMoveDirection(order, targetCol, currentCol) {
  return (order[targetCol] ?? 0) < (order[currentCol] ?? 0) ? "up" : "down";
}

/**
 * Gets arrow icon for direction
 * @param {string} direction
 * @returns {string}
 */
export function getArrowIcon(direction) {
  return direction === "up" ? "arrow_upward.svg" : "arrow_downward.svg";
}