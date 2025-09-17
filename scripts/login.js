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
 * Initializes the login view: sets up password fields,
 * event listeners, and keydown handler.
 * @returns {void}
 */
function initLogin() {
  initializePasswordFields("login");
  setupLoginEventListeners();
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
 * Attempts login with Firebase using email and password.
 * Redirects on success, shows error on failure.
 * @returns {void}
 */
function handleLogin() {
  const email = $("login-email").value.trim();
  const password = $("login-password").value;
  if (password.length < 6)
    return displayAuthError($("errorMessage"), $("login-password"));
  signInWithEmailAndPassword(auth, email, password)
    .then(() => (window.location.href = "summary-board.html"))
    .catch(() =>
      displayAuthError($("errorMessage"), $("login-password"), $("login-email"))
    );
}

/**
 * Performs guest login with static credentials.
 * Redirects on success, shows error on failure.
 * @returns {void}
 */
function handleGuestLogin() {
  signInWithEmailAndPassword(auth, "guest@login.de", "guestpassword")
    .then(() => (window.location.href = "./summary-board.html"))
    .catch(() => {
      $("errorMessage").innerHTML = "Guest login failed.";
    });
}

/**
 * Handles Enter key press:
 * - If the login box is hidden, triggers sign-up button.
 * - Otherwise, triggers login.
 * @param {KeyboardEvent} e
 * @returns {void}
 */
function handleKeyDown(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    const isLoginHidden = $("login-box")?.classList.contains("d-none");
    if (isLoginHidden) {
      $("sign-up-button")?.click();
    } else {
      handleLogin();
    }
  }
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
 * Sets up toggle icon and input events for a password field.
 * @param {string} inputId - ID of the password input element
 * @param {string} toggleId - ID of the toggle icon
 * @param {HTMLElement} errorBox - Error container element
 * @returns {void}
 */
function setupPasswordToggle(inputId, toggleId, errorBox) {
  const input = $(inputId);
  const toggle = $(toggleId);
  if (!input || !toggle) return;
  let isVisible = false;
  toggle.onclick = () => togglePasswordVisibility(input, toggle, (isVisible = !isVisible));
  input.oninput = () => resetPasswordField(input, toggle, errorBox);
  updatePasswordIcon(input, toggle, isVisible);
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
 * Resets a password field to hidden and clears error styles.
 * @param {HTMLInputElement} input
 * @param {HTMLImageElement} toggle
 * @param {HTMLElement} errorBox
 * @returns {void}
 */
function resetPasswordField(input, toggle, errorBox) {
  input.type = "password";
  updatePasswordIcon(input, toggle, false);
  clearFieldError(input, errorBox);
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