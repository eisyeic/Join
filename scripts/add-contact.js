/**
 * @file Add-Contact UI helpers.
 * Provides form state management, validation, and overlay toggles for the Add/Edit Contact flows.
 *
 * Assumptions:
 * - `$` is a DOM helper that returns an HTMLElement by id.
 * - `showFieldError`, `clearFieldError`, and `isValidEmail` exist globally.
 *
 * @typedef {Object} AddFormValues
 * @property {string} name  - The contact's full name.
 * @property {string} email - The contact's email address.
 * @property {string} phone - The contact's phone number.
 */

/**
 * Clear all Add-Contact form input values only.
 * @returns {void}
 */
function clearAddFormInputValues() {
  $("name-new-contact").value = "";
  $("email-new-contact").value = "";
  $("phone-new-contact").value = "";
}

/**
 * Clear all Add-Contact form inputs and remove any error states.
 * @returns {void}
 */
function clearAddFormInputs() {
  clearAddFormInputValues();
  clearAddFormErrors();
}

/**
 * Show the Add-Contact overlay element.
 * @returns {void}
 */
function showAddContactOverlay() {
  $("contact-overlay-close-add").classList.remove("d-none");
}

/**
 * Open the Add-Contact overlay and reset the form.
 * Shows the overlay container and clears inputs/errors.
 * @returns {void}
 */
function openAddContact() {
  showAddContactOverlay();
  clearAddFormInputs();
}

/**
 * Hide the Add-Contact overlay element.
 * @returns {void}
 */
function hideAddContactOverlay() {
  $("contact-overlay-close-add").classList.add("d-none");
}

/**
 * Close the Add-Contact overlay and reset the form.
 * Hides the overlay container and clears inputs/errors.
 * @returns {void}
 */
function closeAddContact() {
  hideAddContactOverlay();
  clearAddFormInputs();
}

/**
 * Toggle visibility of the Add-Contact overlay element only.
 * @returns {void}
 */
function toggleAddContactOverlay() {
  $("contact-overlay-close-add").classList.toggle("d-none");
}

/**
 * Toggle visibility of the Edit-Contact overlay element only.
 * @returns {void}
 */
function toggleEditContactOverlay() {
  $("contact-overlay-close-edit").classList.toggle("d-none");
}

/**
 * Toggle visibility of the Add-Contact overlay (legacy function for compatibility).
 * @returns {void}
 */
function toggleAddContact() {
  toggleAddContactOverlay();
}

/**
 * Toggle visibility of the Edit-Contact overlay (legacy function for compatibility).
 * @returns {void}
 */
function toggleEditContact() {
  toggleEditContactOverlay();
}

/**
 * Read raw values from the Add-Contact form inputs.
 * @returns {AddFormValues} The current values from the form.
 */
function getAddFormValues() {
  return {
    name: $("name-new-contact").value.trim(),
    email: $("email-new-contact").value.trim(),
    phone: $("phone-new-contact").value.trim(),
  };
}

/**
 * Clear all Add-Contact form error messages/styles.
 * @returns {void}
 */
function clearAddFormErrors() {
  clearFieldError("name-new-contact");
  clearFieldError("email-new-contact");
  clearFieldError("phone-new-contact");
}

/**
 * Validate the name field (required).
 * @param {string} name - The name to validate.
 * @returns {boolean} True if valid; otherwise false.
 */
function validateAddNameField(name) {
  if (!name) {
    showFieldError("name-new-contact", "Name is required");
    return false;
  }
  return true;
}

/**
 * Validate the email field (required + format).
 * @param {string} email - The email to validate.
 * @returns {boolean} True if valid; otherwise false.
 */
function validateAddEmailField(email) {
  if (!email) {
    showFieldError("email-new-contact", "E-Mail is required");
    return false;
  } else if (!isValidEmail(email)) {
    showFieldError("email-new-contact", "Please enter a valid email address");
    return false;
  }
  return true;
}

/**
 * Validate the phone field (required).
 * @param {string} phone - The phone number to validate.
 * @returns {boolean} True if valid; otherwise false.
 */
function validateAddPhoneField(phone) {
  if (!phone) {
    showFieldError("phone-new-contact", "Phone is required");
    return false;
  }
  return true;
}

/**
 * Validate all Add-Contact form fields.
 * @param {AddFormValues} values - The values to validate.
 * @returns {boolean} True when all fields are valid; otherwise false.
 */
function validateAddFormFields(values) {
  const nameValid = validateAddNameField(values.name);
  const emailValid = validateAddEmailField(values.email);
  const phoneValid = validateAddPhoneField(values.phone);
  return nameValid && emailValid && phoneValid;
}

/**
 * Validate the Add-Contact form by reading current inputs and checking all fields.
 * @returns {boolean} True if the form is valid; otherwise false.
 */
function validateAddContactForm() {
  const values = getAddFormValues();
  clearAddFormErrors();
  return validateAddFormFields(values);
}