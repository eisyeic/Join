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
 * Keydown filter for name fields
 * Allows letters, umlauts, spaces, hyphens, apostrophes, and control keys
 * @param {KeyboardEvent} event
 * @returns {void}
 */
function validateNameInput(event) {
  if (!isValidNameKey(event.key)) {
    event.preventDefault();
  }
}

/**
 * Checks if key is valid for name input
 * @param {string} key
 * @returns {boolean}
 */
function isValidNameKey(key) {
  return isAllowedNameChar(key) || isControlKey(key);
}

/**
 * Checks if character is allowed in name
 * @param {string} key
 * @returns {boolean}
 */
function isAllowedNameChar(key) {
  const allowedChars = /[a-zA-ZäöüÄÖÜß\s\-']/;
  return allowedChars.test(key);
}

/**
 * Checks if key is a control key
 * @param {string} key
 * @returns {boolean}
 */
function isControlKey(key) {
  return ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight"].includes(key);
}

/**
 * Keydown filter for phone fields
 * Accepts digits, one leading plus, control keys; enforces max length 20
 * @param {KeyboardEvent} e
 * @returns {void}
 */
function validatePhoneInput(e) {
  if (shouldAllowPhoneKey(e)) return;
  
  e.preventDefault();
}

/**
 * Determines if phone key should be allowed
 * @param {KeyboardEvent} e
 * @returns {boolean}
 */
function shouldAllowPhoneKey(e) {
  if (isPhoneControlKey(e)) return true;
  if (isPhoneNavigationKey(e.key)) return true;
  
  return isValidPhoneChar(e);
}

/**
 * Checks if key is a phone control key
 * @param {KeyboardEvent} e
 * @returns {boolean}
 */
function isPhoneControlKey(e) {
  const ctrlCmd = e.ctrlKey || e.metaKey;
  return ctrlCmd && ['a','c','v','x','z','y'].includes(e.key.toLowerCase());
}

/**
 * Checks if key is a navigation key
 * @param {string} key
 * @returns {boolean}
 */
function isPhoneNavigationKey(key) {
  return ['Backspace','Delete','Tab','ArrowLeft','ArrowRight','Home','End'].includes(key);
}

/**
 * Validates phone character input
 * @param {KeyboardEvent} e
 * @returns {boolean}
 */
function isValidPhoneChar(e) {
  const nextLength = calculateNextLength(e.target);
  
  if (e.key === '+') {
    return isValidPlusInput(e.target, nextLength);
  }
  
  if (/^\d$/.test(e.key)) {
    return nextLength <= 20;
  }
  
  return false;
}

/**
 * Calculates next input length
 * @param {HTMLInputElement} target
 * @returns {number}
 */
function calculateNextLength(target) {
  const selLen = (target.selectionEnd ?? target.value.length) - (target.selectionStart ?? 0);
  return target.value.length - selLen + 1;
}

/**
 * Validates plus sign input
 * @param {HTMLInputElement} target
 * @param {number} nextLength
 * @returns {boolean}
 */
function isValidPlusInput(target, nextLength) {
  const atStart = (target.selectionStart ?? 0) === 0;
  const hasPlus = target.value.startsWith('+');
  return atStart && !hasPlus && nextLength <= 20;
}

/**
 * Normalize phone value to digits and at most one leading plus; trim to 20 chars
 * @param {InputEvent} e
 * @returns {void}
 */
function sanitizePhoneOnInput(e) {
  const sanitized = sanitizePhoneValue(e.target.value);
  e.target.value = sanitized;
}

/**
 * Sanitizes phone value
 * @param {string} value
 * @returns {string}
 */
function sanitizePhoneValue(value) {
  const cleaned = removeInvalidChars(value);
  const normalized = normalizePlusSign(cleaned);
  return limitLength(normalized, 20);
}

/**
 * Removes invalid characters
 * @param {string} value
 * @returns {string}
 */
function removeInvalidChars(value) {
  return value.replace(/[^\d+]/g, '');
}

/**
 * Normalizes plus sign to only one at start
 * @param {string} value
 * @returns {string}
 */
function normalizePlusSign(value) {
  if (value.startsWith('+')) {
    return '+' + value.slice(1).replace(/\+/g, '');
  }
  return value.replace(/\+/g, '');
}

/**
 * Limits string length
 * @param {string} value
 * @param {number} maxLength
 * @returns {string}
 */
function limitLength(value, maxLength) {
  return value.slice(0, maxLength);
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
 * Set error message and styles for a field
 * @param {string} fieldId
 * @param {string} message
 * @returns {void}
 */
function showFieldError(fieldId, message) {
  const elements = getFieldElements(fieldId);
  displayErrorMessage(fieldId, message);
  applyErrorStyles(elements);
}

/**
 * Gets field elements
 * @param {string} fieldId
 * @returns {Object}
 */
function getFieldElements(fieldId) {
  return {
    field: $(fieldId),
    placeholder: $(fieldId + "-placeholder")
  };
}

/**
 * Displays error message
 * @param {string} fieldId
 * @param {string} message
 */
function displayErrorMessage(fieldId, message) {
  setErrorMessage(fieldId, message);
}

/**
 * Applies error styles
 * @param {Object} elements
 */
function applyErrorStyles(elements) {
  setFieldErrorStyle(elements.field, elements.placeholder);
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
 * Clear both error message and styles for a field
 * @param {string} fieldId
 * @returns {void}
 */
function clearFieldError(fieldId) {
  const elements = getFieldElements(fieldId);
  removeErrorMessage(fieldId);
  removeErrorStyles(elements);
}

/**
 * Removes error message
 * @param {string} fieldId
 */
function removeErrorMessage(fieldId) {
  clearErrorMessage(fieldId);
}

/**
 * Removes error styles
 * @param {Object} elements
 */
function removeErrorStyles(elements) {
  clearFieldErrorStyle(elements.field, elements.placeholder);
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

