/**
 * Template functions for rendering HTML elements
 */

/**
 * Creates HTML template for contact list item
 * @param {Object} contact - Contact object with name, initials, colorIndex
 * @param {string} id - Contact ID
 * @returns {string} HTML string for contact list item
 */
export function createContactListItemTemplate(contact, id) {
  return `
    <div>
      <div class="contact-initial" style="background-image: url(./assets/icons/contact/color${contact.colorIndex}.svg)">
        ${contact.initials}
      </div>
      ${contact.name}
    </div>
    <img src="./assets/icons/add_task/check_default.svg" alt="checkbox" />
  `;
}

/**
 * Creates error message template
 * @param {string} message - Error message text
 * @returns {string} HTML string for error message
 */
export function createErrorMessageTemplate(message) {
  return message;
}