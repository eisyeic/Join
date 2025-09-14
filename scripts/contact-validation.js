/**
 * Validate email format (simple regex).
 * @param {string} email - Email string to validate.
 * @returns {boolean} True if the email matches the pattern.
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Keydown filter for name fields.
 * Allows letters, umlauts, spaces, hyphens, apostrophes, and control keys.
 * @param {KeyboardEvent} event
 * @returns {void}
 */
function validateNameInput(event) {
  const allowedChars = /[a-zA-ZäöüÄÖÜß\s\-']/;
  if (
    !allowedChars.test(event.key) &&
    !["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight"].includes(
      event.key
    )
  ) {
    event.preventDefault();
  }
}

/**
 * Keydown filter for phone fields.
 * Accepts digits, one leading plus, control keys; enforces max length 20.
 * @param {KeyboardEvent} e
 * @returns {void}
 */
function validatePhoneInput(e) {
  const t = e.target;
  const k = e.key;
  const ctrlCmd = e.ctrlKey || e.metaKey;
  if (ctrlCmd && ['a','c','v','x','z','y'].includes(k.toLowerCase())) return;
  if (['Backspace','Delete','Tab','ArrowLeft','ArrowRight','Home','End'].includes(k)) return;
  const selLen = (t.selectionEnd ?? t.value.length) - (t.selectionStart ?? 0);
  const nextLen = t.value.length - selLen + 1;
  if (k === '+') {
    const atStart = (t.selectionStart ?? 0) === 0;
    const hasPlus = t.value.startsWith('+');
    if (!atStart || hasPlus || nextLen > 20) e.preventDefault();
    return;
  }
  if (/^\d$/.test(k)) {
    if (nextLen > 20) e.preventDefault();
    return;
  }
  e.preventDefault();
}

/**
 * Normalize phone value to digits and at most one leading plus; trim to 20 chars.
 * @param {InputEvent} e
 * @returns {void}
 */
function sanitizePhoneOnInput(e) {
  let v = e.target.value.replace(/[^\d+]/g, ''); 
  if (v.startsWith('+')) {
    v = '+' + v.slice(1).replace(/\+/g, ''); 
  } else {
    v = v.replace(/\+/g, ''); 
  }
  e.target.value = v.slice(0, 20); 
}

/**
 * Mapping of input IDs to their error container IDs.
 * @returns {Record<string,string>}
 */
function getFieldMapping() {
  return {
    "name-new-contact": "name-new-contact-box",
    "email-new-contact": "email-new-contact-box",
    "phone-new-contact": "phone-new-contact-box",
    "edit-name-input": "edit-name-input-box",
    "edit-email-input": "edit-email-input-box",
    "edit-phone-input": "edit-phone-input-box",
  };
}

/**
 * Set error message HTML for a field.
 * @param {string} fieldId - Input element id.
 * @param {string} message - Error message to display.
 * @returns {void}
 */
function setErrorMessage(fieldId, message) {
  const fieldMapping = getFieldMapping();
  if (fieldMapping[fieldId]) {
    $(fieldMapping[fieldId]).innerHTML = getErrorMessage(message);
  }
}

/**
 * Apply error styles to a field and its placeholder.
 * @param {HTMLElement} field
 * @param {HTMLElement} [placeholder]
 * @returns {void}
 */
function setFieldErrorStyle(field, placeholder) {
  field.style.borderColor = "red";
  field.classList.add("error-input");
  if (placeholder) {
    placeholder.classList.add("error-input-placeholder");
  }
}

/**
 * Set error message and styles for a field.
 * @param {string} fieldId
 * @param {string} message
 * @returns {void}
 */
function showFieldError(fieldId, message) {
  const field = $(fieldId);
  const placeholder = $(fieldId + "-placeholder");
  setErrorMessage(fieldId, message);
  setFieldErrorStyle(field, placeholder);
}

/**
 * Clear error message for a field.
 * @param {string} fieldId
 * @returns {void}
 */
function clearErrorMessage(fieldId) {
  const fieldMapping = getFieldMapping();
  if (fieldMapping[fieldId]) {
    $(fieldMapping[fieldId]).innerHTML = "";
  }
}

/**
 * Remove error styles from a field and its placeholder.
 * @param {HTMLElement} field
 * @param {HTMLElement} [placeholder]
 * @returns {void}
 */
function clearFieldErrorStyle(field, placeholder) {
  field.style.borderColor = "";
  field.classList.remove("error-input");
  if (placeholder) {
    placeholder.classList.remove("error-input-placeholder");
  }
}

/**
 * Clear both error message and styles for a field.
 * @param {string} fieldId
 * @returns {void}
 */
function clearFieldError(fieldId) {
  const field = $(fieldId);
  const placeholder = $(fieldId + "-placeholder");
  clearErrorMessage(fieldId);
  clearFieldErrorStyle(field, placeholder);
}

/**
 * Return standardized HTML for inline error message.
 * @param {string} message
 * @returns {string}
 */
function getErrorMessage(message) {
  return /*html*/ `<p class="error-message">${message}</p>`;
}

/**
 * Attach keydown validators to form inputs.
 * @returns {void}
 */
function attachValidators(){
  $("edit-phone-input").addEventListener("keydown", validatePhoneInput);
  $("phone-new-contact").addEventListener("keydown", validatePhoneInput);
  $("name-new-contact").addEventListener("keydown", validateNameInput);
  $("edit-name-input").addEventListener("keydown", validateNameInput);
}

/**
 * Setup input validators on DOM ready.
 * @returns {void}
 */
function setupInputValidators(){
  document.addEventListener("DOMContentLoaded", attachValidators);
}
setupInputValidators();


/** Export functions for use in other modules */
if (typeof window !== 'undefined') {
  window.isValidEmail = isValidEmail;
  window.validateNameInput = validateNameInput;
  window.validatePhoneInput = validatePhoneInput;
  window.sanitizePhoneOnInput = sanitizePhoneOnInput;
  window.showFieldError = showFieldError;
  window.clearFieldError = clearFieldError;
  window.getErrorMessage = getErrorMessage;
}

/**
 * Validates the phone field; sets UI error if invalid.
 * @param {string} phone
 * @returns {boolean}
 */
function validateEditPhoneField(phone) {
  if (!phone) {
    showFieldError("edit-phone-input", "Phone is required");
    return false;
  }
  return true;
}

/**
 * Validates the email field; sets UI error if invalid.
 * @param {string} email
 * @returns {boolean}
 */
function validateEditEmailField(email) {
  if (!email) {
    showFieldError("edit-email-input", "E-Mail is required");
    return false;
  } else if (!isValidEmail(email)) {
    showFieldError("edit-email-input", "Please enter a valid email address");
    return false;
  }
  return true;
}

/**
 * Validates all edit contact fields and returns whether the form is valid.
 * @param {{name:string,email:string,phone:string}} values
 * @returns {boolean}
 */
function validateEditFormFields(values) {
  const nameValid = validateEditNameField(values.name);
  const emailValid = validateEditEmailField(values.email);
  const phoneValid = validateEditPhoneField(values.phone);

  return nameValid && emailValid && phoneValid;
}

/**
 * Validates the edit contact form by reading values and applying validators.
 * @returns {boolean}
 */
function validateEditContactForm() {
  const values = getEditFormValues();
  clearEditFormErrors();
  return validateEditFormFields(values);
}