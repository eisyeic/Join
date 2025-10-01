/**
 * @file signup-validation.js
 * @description Validation and password field management for signup
 */

/**
 * Sets up email field validation (blur + input)
 */
function setupEmailValidation() {
  [["sign-up-email", "error-sign-up"]].forEach(([inputId, errorId]) => {
    const input = $(inputId);
    const errorBox = $(errorId);
    input.addEventListener("blur", () => validateEmailFormat(input, errorBox));
    input.addEventListener("input", () => clearFieldError(input, errorBox));
  });
}

/**
 * Validates email format and shows error if invalid
 */
function validateEmailFormat(input, errorBox) {
  const email = input.value.trim();
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && !pattern.test(email)) {
    showError(errorBox, "Check your email. Please try again.");
    input.parentElement.style.borderColor = "var(--error-color)";
  }
}

/**
 * Displays an error message in the given element
 */
function showError(el, msg) {
  el.innerHTML = msg;
  return false;
}

/**
 * Clears error message and resets input border color
 */
function clearFieldError(input, el) {
  el.innerHTML = "";
  input.parentElement.style.borderColor = "";
}

/**
 * Initializes password toggles for sign-up fields
 */
function initializePasswordFields(context) {
  if (context !== "sign-up") return;
  [["sign-up-password", "toggle-sign-up-password"], ["confirm-password", "toggle-confirm-password"]]
    .forEach(([inputId, toggleId]) => setupPasswordToggle(inputId, toggleId, $("error-sign-up")));
}

/**
 * Gets password toggle elements
 */
function getPasswordToggleElements(inputId, toggleId) {
  const input = $(inputId);
  const toggle = $(toggleId);
  return (input && toggle) ? { input, toggle } : null;
}

/**
 * Creates toggle click handler
 */
function createToggleClickHandler(input, toggle, visibilityState) {
  return () => {
    visibilityState.isVisible = !visibilityState.isVisible;
    togglePasswordVisibility(input, toggle, visibilityState.isVisible);
  };
}

/**
 * Creates input change handler
 */
function createInputChangeHandler(input, toggle, errorBox) {
  return () => resetPasswordField(input, toggle, errorBox);
}

/**
 * Sets up password field event handlers
 */
function setupPasswordFieldHandlers(elements, errorBox) {
  const { input, toggle } = elements;
  const visibilityState = { isVisible: false };
  
  toggle.onclick = createToggleClickHandler(input, toggle, visibilityState);
  input.oninput = createInputChangeHandler(input, toggle, errorBox);
  updatePasswordIcon(input, toggle, visibilityState.isVisible);
}

/**
 * Sets up toggle behavior for password fields
 */
function setupPasswordToggle(inputId, toggleId, errorBox) {
  const elements = getPasswordToggleElements(inputId, toggleId);
  if (!elements) return;
  setupPasswordFieldHandlers(elements, errorBox);
}

/**
 * Checks if input has value
 */
function hasInputValue(input) {
  return !!input.value;
}

/**
 * Sets input type based on visibility
 */
function setInputType(input, visible) {
  input.type = visible ? "text" : "password";
}

/**
 * Toggles password field visibility
 */
function togglePasswordVisibility(input, toggle, visible) {
  if (!hasInputValue(input)) return;
  setInputType(input, visible);
  updatePasswordIcon(input, toggle, visible);
}

/**
 * Resets a password field to hidden and clears errors
 */
function resetPasswordField(input, toggle, errorBox) {
  input.type = "password";
  updatePasswordIcon(input, toggle, false);
  clearFieldError(input, errorBox);
}

/**
 * Gets appropriate icon path based on state
 */
function getIconPath(hasValue, isVisible) {
  if (!hasValue) return "./assets/icons/login/lock.svg";
  return isVisible 
    ? "./assets/icons/login/visibility.svg"
    : "./assets/icons/login/visibility_off.svg";
}

/**
 * Sets toggle icon source
 */
function setToggleIconSource(toggle, iconPath) {
  toggle.src = iconPath;
}

/**
 * Sets toggle cursor style
 */
function setToggleCursor(toggle, hasValue) {
  toggle.classList.toggle("cursor-pointer", hasValue);
}

/**
 * Updates the password toggle icon based on input state
 */
function updatePasswordIcon(input, toggle, isVisible) {
  const hasValue = hasInputValue(input);
  const iconPath = getIconPath(hasValue, isVisible);
  
  setToggleIconSource(toggle, iconPath);
  setToggleCursor(toggle, hasValue);
}

export { setupEmailValidation, initializePasswordFields, showError };