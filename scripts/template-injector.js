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
 * Builds the markup for a contact entry in the "Assigned to" dropdown.
 * @param {Contact} contact - Contact to display (name, initials, color index).
 * @param {string} id - Internal/optional ID (not used in the template; kept for API compatibility).
 * @returns {string} HTML string for the option.
 */
function createContactListItemTemplate(contact, id) {
  return `
    <div>
      <div class="contact-initial" style="background-image: url(./assets/general_elements/icons/color${contact.colorIndex}.svg)">
        ${contact.initials}
      </div>
      ${contact.name}
    </div>
    <img src="./assets/icons/add_task/check_default.svg" alt="checkbox" />
  `;
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
 * IIFE: Injects the Add-Task template once `.addtask-wrapper` exists
 * and is still empty. Dispatches the `addtask:template-ready` event
 * after a successful render.
 *
 * Expects a global function `getAddtaskTemplate(): string`
 * that returns the required HTML markup.
 */
(function injectAddTaskTemplate() {
  /**
   * Renders the template into the container, if possible.
   * @param {Document|HTMLElement} [root=document] - Root for querying `.addtask-wrapper`.
   * @returns {boolean} true if the container existed (regardless of whether injection happened).
   */
  const render = (root = document) => {
    const container = root.querySelector(".addtask-wrapper");
    if (!container) return false;
    if (container.dataset.rendered === "1" || container.childElementCount > 0)
      return true;

    // getAddtaskTemplate is provided externally
    container.innerHTML = getAddtaskTemplate();
    container.dataset.rendered = "1";
    document.dispatchEvent(new CustomEvent("addtask:template-ready"));
    return true;
  };

  // Try immediately; if not possible, wait for DOMContentLoaded
  if (!render()) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", render, { once: true });
    } else {
      render();
    }
  }
})();