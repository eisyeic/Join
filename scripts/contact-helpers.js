/**
 * @file Contact helper functions - utilities and form handling
 */

/**
 * Derive up to two initials from a full name.
 * @param {string} name
 * @returns {string}
 */
function getInitials(name) {
  const words = name.split(" ");
  const firstInitial = words[0] ? words[0][0].toUpperCase() : "";
  const secondInitial = words[1] ? words[1][0].toUpperCase() : "";
  return firstInitial + secondInitial;
}

/**
 * Try to find the edit overlay root element.
 * @returns {HTMLElement|null}
 */
function findEditOverlayRoot(){
  return document.getElementById('edit-contact-overlay') ||
    document.querySelector('#edit-contact, .edit-contact-overlay, .contact-edit-overlay, .edit-contact');
}

/**
 * Check if an element is visually visible.
 * @param {HTMLElement} el
 * @returns {boolean}
 */
function isElementVisible(el){
  const cs = window.getComputedStyle(el);
  if (el.classList.contains('d-none')) return false;
  if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return false;
  return el.offsetParent !== null && el.getClientRects().length > 0;
}

/**
 * Returns true if the edit-contact overlay is visible.
 * @returns {boolean}
 */
function isEditOverlayOpen() {
  const overlayRoot = findEditOverlayRoot();
  if (overlayRoot) return isElementVisible(overlayRoot);
  const el = document.getElementById('edit-name-input');
  if (!el) return false;
  if (el.closest('.d-none')) return false;
  return isElementVisible(el);
}

/**
 * Returns a handle set to the edit form elements inside the contact edit overlay.
 * @returns {{nameInput:HTMLInputElement,emailInput:HTMLInputElement,phoneInput:HTMLInputElement,iconImg:HTMLImageElement,iconText:HTMLElement}}
 */
function getEditFormElements() {
  return {
    nameInput: $("edit-name-input"),
    emailInput: $("edit-email-input"),
    phoneInput: $("edit-phone-input"),
    iconImg: $("edit-icon-img"),
    iconText: $("edit-icon-text"),
  };
}

/**
 * Populates the edit form fields from the currentContact object.
 * @param {{nameInput:HTMLInputElement,emailInput:HTMLInputElement,phoneInput:HTMLInputElement,iconImg:HTMLImageElement,iconText:HTMLElement}} elements
 * @returns {void}
 */
function populateEditForm(elements) {
  elements.nameInput.value = currentContact.name;
  elements.emailInput.value = currentContact.email;
  elements.phoneInput.value = currentContact.phone;
  elements.iconImg.src = `./assets/general_elements/icons/color${currentContact.colorIndex}.svg`;
  elements.iconText.textContent = getInitials(currentContact.name);
}

/**
 * Reads current values from the edit contact form inputs.
 * @returns {{name:string,email:string,phone:string}}
 */
function getEditFormValues() {
  return {
    name: $("edit-name-input").value.trim(),
    email: $("edit-email-input").value.trim(),
    phone: $("edit-phone-input").value.trim(),
  };
}

/**
 * Clears all edit form error states.
 * @returns {void}
 */
function clearEditFormErrors() {
  clearFieldError("edit-name-input");
  clearFieldError("edit-email-input");
  clearFieldError("edit-phone-input");
}

/**
 * Builds a compact contact row as HTML
 * @param {{name:string,email:string,phone:string,colorIndex?:number,initials?:string}} key
 * @param {string} id
 * @returns {string} HTML string for the contact row
 */
function getContactPerson(key, id) {
  const contactData = {
    name: key.name,
    email: key.email,
    phone: key.phone,
    initials: key.initials || getInitials(key.name),
    savedColorIndex: key.colorIndex || ((id.charCodeAt(0) % 15) + 1),
    id: id
  };
  return window.contactPersonTemplate(contactData);
}

// Export functions globally
window.getInitials = getInitials;
window.isEditOverlayOpen = isEditOverlayOpen;
window.getEditFormElements = getEditFormElements;
window.populateEditForm = populateEditForm;
window.getEditFormValues = getEditFormValues;
window.clearEditFormErrors = clearEditFormErrors;
window.getContactPerson = getContactPerson;