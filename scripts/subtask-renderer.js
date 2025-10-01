/**
 * @file Subtask rendering functions for task overlays.
 */

/**
 * Subtask structure.
 * @typedef {Object} Subtask
 * @property {string} name
 * @property {boolean} [checked]
 */

/**
 * Gets checked attribute string for subtask
 * @param {Subtask} subtask
 * @returns {string}
 */
export function getSubtaskCheckedAttr(subtask) {
  return subtask.checked ? "checked" : "";
}

/**
 * Gets subtask ID
 * @param {number} index
 * @returns {string}
 */
export function getSubtaskId(index) {
  return `subtask${index}`;
}

/**
 * Gets subtask icon path
 * @param {Subtask} subtask
 * @returns {string}
 */
export function getSubtaskIcon(subtask) {
  return subtask.checked 
    ? "./assets/icons/add_task/check_checked.svg" 
    : "./assets/icons/add_task/check_default.svg";
}

/**
 * Gets subtask CSS class
 * @param {Subtask} subtask
 * @returns {string}
 */
export function getSubtaskClass(subtask) {
  return subtask.checked ? "checked" : "";
}

/**
 * Creates HTML for a single subtask
 * @param {Subtask} subtask
 * @param {number} index
 * @returns {string}
 */
export function createSubtaskHTML(subtask, index) {
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
export function mapSubtasksToHTML(subtasks) {
  return subtasks.map(createSubtaskHTML);
}

/**
 * Creates subtasks container HTML
 * @param {string} subtasksHTML
 * @returns {string}
 */
export function createSubtasksContainer(subtasksHTML) {
  return `<div class="subtasks-container">${subtasksHTML}</div>`;
}

/**
 * Creates subtasks title
 * @returns {string}
 */
export function createSubtasksTitle() {
  return "<b>Subtasks:</b>";
}

/**
 * Builds the subtasks HTML block including checkboxes.
 * @param {Subtask[]} subtasks
 * @returns {string}
 */
export function toSubtasksHtml(subtasks){
  const title = createSubtasksTitle();
  const htmlArray = mapSubtasksToHTML(subtasks);
  const container = createSubtasksContainer(htmlArray.join(""));
  return title + container;
}

/**
 * Writes a simple fallback when no subtasks are present.
 * @param {HTMLElement} container
 */
export function renderNoSubtasks(container){ 
  container.innerHTML = "<b>no subtasks</b>"; 
}