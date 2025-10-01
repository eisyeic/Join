/**
 * @file Contact rendering functions for task overlays.
 */

/**
 * Gets contact color index or default
 * @param {Object} contact
 * @returns {number}
 */
export function getContactColorIndex(contact) {
  return Number.isFinite(contact?.colorIndex) ? contact.colorIndex : 0;
}

/**
 * Gets contact initials or empty string
 * @param {Object} contact
 * @returns {string}
 */
export function getContactInitials(contact) {
  return contact?.initials || "";
}

/**
 * Gets contact name or falls back to initials
 * @param {Object} contact
 * @returns {string}
 */
export function getContactName(contact) {
  return contact?.name || getContactInitials(contact);
}

/**
 * Creates HTML for a single contact member
 * @param {Object} contact
 * @returns {string}
 */
export function createContactMemberHTML(contact) {
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
export function mapContactsToHTML(contacts) {
  return contacts.map(createContactMemberHTML);
}

/**
 * Renders contacts into a container element.
 * @param {HTMLElement} container
 * @param {Array<{id?:string,name?:string,initials?:string,colorIndex?:number}>} contacts
 */
export function renderContactsTo(container, contacts){
  const htmlArray = mapContactsToHTML(contacts);
  container.innerHTML = htmlArray.join("");
}