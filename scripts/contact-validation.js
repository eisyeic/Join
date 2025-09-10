// Contact form validation utilities

// Validates a simple email address pattern
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Keydown filter to allow only letters (incl. umlauts), spaces, hyphens, and apostrophes in name fields
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

// Keydown filter for phone inputs: allows digits, one leading plus, and control keys; enforces max length
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

// Normalizes phone input to digits plus a single leading plus sign, capped length
function sanitizePhoneOnInput(e) {
  let v = e.target.value.replace(/[^\d+]/g, ''); 
  if (v.startsWith('+')) {
    v = '+' + v.slice(1).replace(/\+/g, ''); 
  } else {
    v = v.replace(/\+/g, ''); 
  }
  e.target.value = v.slice(0, 20); 
}

// Returns a mapping from input field IDs to their corresponding error message containers
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

// Sets the inline error message for a given field
function setErrorMessage(fieldId, message) {
  const fieldMapping = getFieldMapping();
  if (fieldMapping[fieldId]) {
    $(fieldMapping[fieldId]).innerHTML = getErrorMessage(message);
  }
}

// Applies error styling to a field and its placeholder element
function setFieldErrorStyle(field, placeholder) {
  field.style.borderColor = "red";
  field.classList.add("error-input");
  if (placeholder) {
    placeholder.classList.add("error-input-placeholder");
  }
}

// Convenience helper to set both message and styles for a field error
function showFieldError(fieldId, message) {
  const field = $(fieldId);
  const placeholder = $(fieldId + "-placeholder");
  setErrorMessage(fieldId, message);
  setFieldErrorStyle(field, placeholder);
}

// Clears the inline error message for a given field
function clearErrorMessage(fieldId) {
  const fieldMapping = getFieldMapping();
  if (fieldMapping[fieldId]) {
    $(fieldMapping[fieldId]).innerHTML = "";
  }
}

// Removes error styling from a field and its placeholder element
function clearFieldErrorStyle(field, placeholder) {
  field.style.borderColor = "";
  field.classList.remove("error-input");
  if (placeholder) {
    placeholder.classList.remove("error-input-placeholder");
  }
}

// Clears both the message and the styles for a field error
function clearFieldError(fieldId) {
  const field = $(fieldId);
  const placeholder = $(fieldId + "-placeholder");
  clearErrorMessage(fieldId);
  clearFieldErrorStyle(field, placeholder);
}

// Build a standardized inline error message HTML
function getErrorMessage(message) {
  return /*html*/ `<p class="error-message">${message}</p>`;
}

// Wires input validators once the DOM is ready
function setupInputValidators() {
  document.addEventListener("DOMContentLoaded", function () {
    $("edit-phone-input").addEventListener("keydown", validatePhoneInput);
    $("phone-new-contact").addEventListener("keydown", validatePhoneInput);
    $("name-new-contact").addEventListener("keydown", validateNameInput);
    $("edit-name-input").addEventListener("keydown", validateNameInput);
  });
}

setupInputValidators();

// Export functions for use in other modules
if (typeof window !== 'undefined') {
  window.isValidEmail = isValidEmail;
  window.validateNameInput = validateNameInput;
  window.validatePhoneInput = validatePhoneInput;
  window.sanitizePhoneOnInput = sanitizePhoneOnInput;
  window.showFieldError = showFieldError;
  window.clearFieldError = clearFieldError;
  window.getErrorMessage = getErrorMessage;
}