/**
 * @file logins.js
 * @description Login-specific logic for Firebase Auth.
 * Includes: login with email/password, guest login,
 * Enter-key handling, password visibility toggle for login field,
 * and generic error handling.
 */
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { auth } from "./firebase.js";

/**
 * Initializes the login view
 * @returns {void}
 */
function initLogin() {
  setupPasswordFields();
  setupEventListeners();
  setupKeyboardHandlers();
}

/**
 * Sets up password fields
 */
function setupPasswordFields() {
  initializePasswordFields("login");
}

/**
 * Sets up event listeners
 */
function setupEventListeners() {
  setupLoginEventListeners();
}

/**
 * Sets up keyboard handlers
 */
function setupKeyboardHandlers() {
  document.addEventListener("keydown", handleKeyDown);
}
document.addEventListener("DOMContentLoaded", initLogin);

/**
 * Registers event listeners for login-related buttons.
 * @returns {void}
 */
function setupLoginEventListeners() {
  $("guest-button")?.addEventListener("click", handleGuestLogin);
  $("login-button")?.addEventListener("click", handleLogin);
}

/**
 * Attempts login with Firebase using email and password
 * @returns {void}
 */
function handleLogin() {
  const credentials = getLoginCredentials();
  if (!validatePassword(credentials.password)) {
    return showPasswordError();
  }
  performLogin(credentials);
}

/**
 * Gets login credentials from form
 * @returns {Object} Email and password
 */
function getLoginCredentials() {
  return {
    email: $("login-email").value.trim(),
    password: $("login-password").value
  };
}

/**
 * Validates password length
 * @param {string} password - Password to validate
 * @returns {boolean} True if valid
 */
function validatePassword(password) {
  return password.length >= 6;
}

/**
 * Shows password validation error
 */
function showPasswordError() {
  displayAuthError($("errorMessage"), $("login-password"));
}

/**
 * Performs Firebase login
 * @param {Object} credentials - Email and password
 */
function performLogin(credentials) {
  signInWithEmailAndPassword(auth, credentials.email, credentials.password)
    .then(() => redirectToSummary())
    .catch(() => showLoginError());
}

/**
 * Redirects to summary page
 */
function redirectToSummary() {
  window.location.href = "summary-board.html";
}

/**
 * Shows login error
 */
function showLoginError() {
  displayAuthError($("errorMessage"), $("login-password"), $("login-email"));
}

/**
 * Performs guest login with static credentials
 * @returns {void}
 */
function handleGuestLogin() {
  const guestCredentials = getGuestCredentials();
  performGuestLogin(guestCredentials);
}

/**
 * Gets guest login credentials
 * @returns {Object} Guest email and password
 */
function getGuestCredentials() {
  return {
    email: "guest@login.de",
    password: "guestpassword"
  };
}

/**
 * Performs guest Firebase login
 * @param {Object} credentials - Guest credentials
 */
function performGuestLogin(credentials) {
  signInWithEmailAndPassword(auth, credentials.email, credentials.password)
    .then(() => redirectToSummaryGuest())
    .catch(() => showGuestError());
}

/**
 * Redirects to summary page for guest
 */
function redirectToSummaryGuest() {
  window.location.href = "./summary-board.html";
}

/**
 * Shows guest login error
 */
function showGuestError() {
  $("errorMessage").innerHTML = "Guest login failed.";
}

/**
 * Handles Enter key press
 * @param {KeyboardEvent} e
 * @returns {void}
 */
function handleKeyDown(e) {
  if (!isEnterKey(e)) return;
  
  e.preventDefault();
  executeEnterAction();
}

/**
 * Checks if key is Enter
 * @param {KeyboardEvent} e - Keyboard event
 * @returns {boolean} True if Enter key
 */
function isEnterKey(e) {
  return e.key === "Enter";
}

/**
 * Executes appropriate action for Enter key
 */
function executeEnterAction() {
  if (isLoginBoxHidden()) {
    triggerSignUp();
  } else {
    handleLogin();
  }
}

/**
 * Checks if login box is hidden
 * @returns {boolean} True if hidden
 */
function isLoginBoxHidden() {
  return $("login-box")?.classList.contains("d-none");
}

/**
 * Triggers sign up button click
 */
function triggerSignUp() {
  $("sign-up-button")?.click();
}

/* ---- Shared helpers for login ---- */

/**
 * Initializes password toggle for the login field.
 * @param {"login"} context
 * @returns {void}
 */
function initializePasswordFields(context) {
  if (context !== "login") return;
  setupPasswordToggle("login-password", "togglePassword", $("errorMessage"));
}

/**
 * Sets up toggle icon and input events for a password field
 * @param {string} inputId - ID of the password input element
 * @param {string} toggleId - ID of the toggle icon
 * @param {HTMLElement} errorBox - Error container element
 * @returns {void}
 */
function setupPasswordToggle(inputId, toggleId, errorBox) {
  const elements = getPasswordElements(inputId, toggleId);
  if (!elements.input || !elements.toggle) return;
  
  setupToggleEvents(elements, errorBox);
  initializePasswordIcon(elements);
}

/**
 * Gets password input and toggle elements
 * @param {string} inputId - Input element ID
 * @param {string} toggleId - Toggle element ID
 * @returns {Object} Input and toggle elements
 */
function getPasswordElements(inputId, toggleId) {
  return {
    input: $(inputId),
    toggle: $(toggleId)
  };
}

/**
 * Sets up toggle and input events
 * @param {Object} elements - Input and toggle elements
 * @param {HTMLElement} errorBox - Error container
 */
function setupToggleEvents(elements, errorBox) {
  let isVisible = false;
  elements.toggle.onclick = () => {
    isVisible = !isVisible;
    togglePasswordVisibility(elements.input, elements.toggle, isVisible);
  };
  elements.input.oninput = () => resetPasswordField(elements.input, elements.toggle, errorBox);
}

/**
 * Initializes password icon
 * @param {Object} elements - Input and toggle elements
 */
function initializePasswordIcon(elements) {
  updatePasswordIcon(elements.input, elements.toggle, false);
}

/**
 * Toggles a password field between text and password type.
 * @param {HTMLInputElement} input
 * @param {HTMLImageElement} toggle
 * @param {boolean} visible
 * @returns {void}
 */
function togglePasswordVisibility(input, toggle, visible) {
  if (!input.value) return;
  input.type = visible ? "text" : "password";
  updatePasswordIcon(input, toggle, visible);
}

/**
 * Resets a password field to hidden and clears error styles
 * @param {HTMLInputElement} input
 * @param {HTMLImageElement} toggle
 * @param {HTMLElement} errorBox
 * @returns {void}
 */
function resetPasswordField(input, toggle, errorBox) {
  hidePassword(input);
  resetPasswordIcon(input, toggle);
  clearFieldError(input, errorBox);
}

/**
 * Hides password field
 * @param {HTMLInputElement} input - Password input
 */
function hidePassword(input) {
  input.type = "password";
}

/**
 * Resets password icon to hidden state
 * @param {HTMLInputElement} input - Password input
 * @param {HTMLImageElement} toggle - Toggle icon
 */
function resetPasswordIcon(input, toggle) {
  updatePasswordIcon(input, toggle, false);
}

/**
 * Updates the toggle icon depending on field state.
 * @param {HTMLInputElement} input
 * @param {HTMLImageElement} toggle
 * @param {boolean} isVisible
 * @returns {void}
 */
function updatePasswordIcon(input, toggle, isVisible) {
  toggle.src = input.value
    ? isVisible
      ? "./assets/icons/login/visibility.svg"
      : "./assets/icons/login/visibility_off.svg"
    : "./assets/icons/login/lock.svg";
  toggle.classList.toggle("cursor-pointer", !!input.value);
}

/**
 * Displays an error message in an element.
 * @param {HTMLElement} el
 * @param {string} msg
 * @returns {false}
 */
function showError(el, msg) {
  el.innerHTML = msg;
  return false;
}

/**
 * Clears error message and resets border color.
 * @param {HTMLInputElement} input
 * @param {HTMLElement} el
 * @returns {void}
 */
function clearFieldError(input, el) {
  el.innerHTML = "";
  input.parentElement.style.borderColor = "";
}

/**
 * Shows a generic authentication error and highlights fields in red.
 * @param {HTMLElement} el
 * @param {HTMLInputElement} pwInput
 * @param {HTMLInputElement} [emailInput]
 * @returns {false}
 */
function displayAuthError(el, pwInput, emailInput) {
  showError(el, "Check your email and password. Please try again.");
  pwInput.parentElement.style.borderColor = "var(--error-color)";
  if (emailInput) emailInput.parentElement.style.borderColor = "var(--error-color)";
  return false;
}