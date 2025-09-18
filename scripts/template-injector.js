/**
 * @file Templates & auto-injection for the Add-Task UI.
 * Provides helper templates and injects the Add-Task template into
 * `.addtask-wrapper` as soon as the DOM and container are ready.
 */

/**
 * Minimal contact shape for rendering in the dropdown.
 * @typedef {Object} Contact
 * @property {string} name
 * @property {string} initials
 * @property {number} colorIndex
 * @property {string} [id]
 */

/**
 * Creates contact initial circle HTML
 * @param {Contact} contact
 * @returns {string}
 */
function createContactInitialHTML(contact) {
  return `<div class="contact-initial" style="background-image: url(./assets/general_elements/icons/color${contact.colorIndex}.svg)">${contact.initials}</div>`;
}

/**
 * Creates contact info section HTML
 * @param {Contact} contact
 * @returns {string}
 */
function createContactInfoHTML(contact) {
  const initialHTML = createContactInitialHTML(contact);
  return `<div>${initialHTML}${contact.name}</div>`;
}

/**
 * Creates checkbox image HTML
 * @returns {string}
 */
function createCheckboxHTML() {
  return `<img src="./assets/icons/add_task/check_default.svg" alt="checkbox" />`;
}

/**
 * Builds the markup for a contact entry in the "Assigned to" dropdown.
 * @param {Contact} contact - Contact to display (name, initials, color index).
 * @param {string} id - Internal/optional ID (not used in the template; kept for API compatibility).
 * @returns {string} HTML string for the option.
 */
function createContactListItemTemplate(contact, id) {
  const contactInfo = createContactInfoHTML(contact);
  const checkbox = createCheckboxHTML();
  return contactInfo + checkbox;
}

/**
 * Returns plain text content for error messages.
 * (Some components expect a string instead of complex markup.)
 * @param {string} message - Error message text.
 * @returns {string} The unchanged error message text.
 */
function createErrorMessageTemplate(message) {
  return message;
}

if (typeof window !== "undefined") {
  /** @ts-ignore: Legacy expose for inline usage */
  window.createContactListItemTemplate = createContactListItemTemplate;
  /** @ts-ignore */
  window.createErrorMessageTemplate = createErrorMessageTemplate;
}

/**
 * Finds addtask wrapper container
 * @param {Document|HTMLElement} root
 * @returns {HTMLElement|null}
 */
function findAddtaskContainer(root) {
  return root.querySelector(".addtask-wrapper");
}

/**
 * Checks if container is already rendered
 * @param {HTMLElement} container
 * @returns {boolean}
 */
function isContainerRendered(container) {
  return container.dataset.rendered === "1" || container.childElementCount > 0;
}

/**
 * Sets template content in container
 * @param {HTMLElement} container
 */
function setTemplateContent(container) {
  container.innerHTML = getAddtaskTemplate();
}

/**
 * Marks container as rendered
 * @param {HTMLElement} container
 */
function markContainerRendered(container) {
  container.dataset.rendered = "1";
}

/**
 * Dispatches template ready event
 */
function dispatchTemplateReadyEvent() {
  document.dispatchEvent(new CustomEvent("addtask:template-ready"));
}

/**
 * Renders template into container
 * @param {HTMLElement} container
 */
function renderTemplateToContainer(container) {
  setTemplateContent(container);
  markContainerRendered(container);
  dispatchTemplateReadyEvent();
}

/**
 * Renders the template into the container, if possible.
 * @param {Document|HTMLElement} [root=document] - Root for querying `.addtask-wrapper`.
 * @returns {boolean} true if the container existed (regardless of whether injection happened).
 */
function renderAddtaskTemplate(root = document) {
  const container = findAddtaskContainer(root);
  if (!container) return false;
  
  if (isContainerRendered(container)) return true;
  
  renderTemplateToContainer(container);
  return true;
}

/**
 * Checks if document is still loading
 * @returns {boolean}
 */
function isDocumentLoading() {
  return document.readyState === "loading";
}

/**
 * Adds DOM content loaded listener
 * @param {Function} callback
 */
function addDOMContentLoadedListener(callback) {
  document.addEventListener("DOMContentLoaded", callback, { once: true });
}

/**
 * Handles template injection timing
 */
function handleTemplateInjection() {
  if (!renderAddtaskTemplate()) {
    if (isDocumentLoading()) {
      addDOMContentLoadedListener(renderAddtaskTemplate);
    } else {
      renderAddtaskTemplate();
    }
  }
}

/**
 * IIFE: Injects the Add-Task template once `.addtask-wrapper` exists
 * and is still empty. Dispatches the `addtask:template-ready` event
 * after a successful render.
 *
 * Expects a global function `getAddtaskTemplate(): string`
 * that returns the required HTML markup.
 */
(function injectAddTaskTemplate() {
  handleTemplateInjection();
})();