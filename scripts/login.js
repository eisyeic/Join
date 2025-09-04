/* eslint-env browser */
/**
 * @file Auth UI logic: login/sign-up flows, password toggles, email validation,
 *       guest login, theme animation, and basic error rendering.
 *
 * External dependencies:
 *  - Firebase Auth v10.12.0 (createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile)
 *  - `auth` instance from ./firebase.js
 *
 * Expected globals:
 *  - $: (id: string) => HTMLElement                      // shorthand for getElementById
 *  - CSS classes/variables used in the DOM and stylesheets (e.g., 'd-none', '--error-color')
 */

// Firebase Imports
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { auth } from "./firebase.js";

// Utility
/** Current UI mode: "login" | "signup". */
let currentMode = "login";

// Init
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => setThemeWhite(true), 500);
  setupEmailValidation();
  initializePasswordFields("login");
  $("guest-button").addEventListener("click", handleGuestLogin);
  $("sign-up-page-button").addEventListener("click", showSignUpForm);
  $("sign-up-bottom-button").addEventListener("click", showSignUpForm);
  document
    .getElementById("sign-up-bottom-box-mobile")
    .addEventListener("click", showSignUpForm);
  $("sign-up-button").addEventListener("click", handleSignUp);
  $("login-button").addEventListener("click", handleLogin);
  $("go-back").addEventListener("click", showLoginForm);
  $("confirm").addEventListener("click", () => {
    $("confirm").classList.toggle("checked");
    $("sign-up-button").classList.toggle("sign-up-button");
  });
  document.addEventListener("keydown", handleKeyDown);
});

// resize add event listener
window.addEventListener("resize", updateSignUpBoxDisplay);

/**
 * Set the theme (background and logo) and adjust sign-up box display.
 * @param {boolean} isWhite - Whether to use the white theme.
 * @returns {void}
 */
function setThemeWhite(isWhite) {
  $("layout").classList.toggle("bg-white", isWhite);
  $("layout").classList.toggle("bg-blue", !isWhite);
  $("logo-white").style.opacity = isWhite ? "0" : "1";
  $("logo-blue").style.opacity = isWhite ? "1" : "0";
  updateSignUpBoxDisplay();
}

/**
 * Switch to the Sign Up view and reset related inputs/state.
 * @returns {void}
 */
function showSignUpForm() {
  currentMode = "signup";
  setThemeWhite(false);
  if (window.innerWidth <= 720) {
    $("sign-up-bottom-box-mobile").style.display = "none";
  }
  $("sign-up-top-right-box").style.display = "none";
  $("sign-up-box").classList.remove("d-none");
  $("login-box").classList.add("d-none");
  clearFormInputs(["login-email", "login-password"], $("errorMessage"));
  initializePasswordFields("sign-up");
}

/**
 * Switch to the Login view and reset related inputs/state.
 * @returns {void}
 */
function showLoginForm() {
  currentMode = "login";
  setThemeWhite(true);
  if (window.innerWidth <= 720) {
    $("sign-up-bottom-box-mobile").style.display = "flex";
  }
  $("sign-up-top-right-box").style.display = "flex";
  $("login-box").classList.remove("d-none");
  $("sign-up-box").classList.add("d-none");
  clearFormInputs(
    ["name", "sign-up-email", "sign-up-password", "confirm-password"],
    $("error-sign-up")
  );
  initializePasswordFields("login");
}

/**
 * Update visibility of the top-right sign-up box and the mobile bottom box
 * based on current mode and viewport width.
 * @returns {void}
 */
function updateSignUpBoxDisplay() {
  const topRight = $("sign-up-top-right-box");
  const bottomMobile = $("sign-up-bottom-box-mobile");

  if (!topRight) return; // nothing to do if layout isn’t present

  if (currentMode === "signup") {
    topRight.classList.add("d-none");
    bottomMobile?.classList.add("d-none");
  } else {
    if (window.innerWidth <= 720) {
      topRight.classList.add("d-none");
      bottomMobile?.classList.remove("d-none");
    } else {
      topRight.classList.remove("d-none");
      bottomMobile?.classList.add("d-none");
    }
  }
}

// Password Logic

/**
 * Initialize password fields and their toggles for the given context.
 * @param {"login"|"sign-up"} context - Determines which inputs to wire.
 * @returns {void}
 */
function initializePasswordFields(context) {
  let fields = {
    login: [["login-password", "togglePassword"]],
    "sign-up": [
      ["sign-up-password", "toggle-sign-up-password"],
      ["confirm-password", "toggle-confirm-password"],
    ],
  };
  fields[context].forEach(([inputId, toggleId]) =>
    setupPasswordToggle(
      inputId,
      toggleId,
      context === "login" ? $("errorMessage") : $("error-sign-up")
    )
  );
}

/**
 * Wire up a single password input with its visibility toggle and error box.
 * @param {string} inputId - ID of the password input element.
 * @param {string} toggleId - ID of the icon/image acting as a toggle.
 * @param {HTMLElement} errorBox - Element for showing errors.
 * @returns {void}
 */
function setupPasswordToggle(inputId, toggleId, errorBox) {
  let input = $(inputId);
  let toggle = $(toggleId);
  if (!input || !toggle) return;
  let isVisible = false;
  toggle.onclick = () =>
    togglePasswordVisibility(input, toggle, (isVisible = !isVisible));
  input.oninput = () => resetPasswordField(input, toggle, errorBox);
  updatePasswordIcon(input, toggle, isVisible);
}

/**
 * Toggle password input type and icon.
 * @param {HTMLInputElement} input
 * @param {HTMLImageElement} toggle
 * @param {boolean} visible - If true, show text; else, hide text.
 * @returns {void}
 */
function togglePasswordVisibility(input, toggle, visible) {
  if (!input.value) return;
  input.type = visible ? "text" : "password";
  updatePasswordIcon(input, toggle, visible);
}

/**
 * Reset a password field to default state and clear related error styling.
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
 * Update the password toggle icon based on visibility and input content.
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
 * Wire email validation for login and sign-up inputs.
 * @returns {void}
 */
function setupEmailValidation() {
  [
    ["login-email", "errorMessage"],
    ["sign-up-email", "error-sign-up"],
  ].forEach(([inputId, errorId]) => {
    let input = $(inputId);
    let errorBox = $(errorId);
    input.addEventListener("blur", () => validateEmailFormat(input, errorBox));
    input.addEventListener("input", () => clearFieldError(input, errorBox));
  });
}

/**
 * Validate email format on blur and show inline error if invalid.
 * @param {HTMLInputElement} input
 * @param {HTMLElement} errorBox
 * @returns {void}
 */
function validateEmailFormat(input, errorBox) {
  let email = input.value.trim();
  let pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && !pattern.test(email)) {
    showError(errorBox, "Check your email. Please try again.");
    input.parentElement.style.borderColor = "var(--error-color)";
  }
}

// Auth functions

/**
 * Attempt to sign in with email and password.
 * Navigates to summary-board on success; shows inline errors on failure.
 * @returns {void}
 */
function handleLogin() {
  let email = $("login-email").value.trim();
  let password = $("login-password").value;
  if (password.length < 6)
    return displayAuthError($("errorMessage"), $("login-password"));
  signInWithEmailAndPassword(auth, email, password)
    .then(() => (window.location.href = "summary-board.html"))
    .catch(() =>
      displayAuthError($("errorMessage"), $("login-password"), $("login-email"))
    );
}

/**
 * Validate sign-up inputs and proceed to registration if valid.
 * @returns {void}
 */
function handleSignUp() {
  let name = $("name").value.trim();
  let email = $("sign-up-email").value.trim();
  let password = $("sign-up-password").value;
  let confirm = $("confirm-password").value;
  let accepted = $("confirm").classList.contains("checked");
  if (!validateSignUpInputs(name, email, password, confirm, accepted)) return;
  registerUser(email, password);
  $("sign-up-button").disabled = true;
  $("sign-up-button").style.pointerEvents = "none";
}

/**
 * Validate sign-up fields (required, format, length, matching, consent).
 * @param {string} name
 * @param {string} email
 * @param {string} pw
 * @param {string} confirmPw
 * @param {boolean} accepted - Privacy policy accepted.
 * @returns {boolean} True if all validations pass.
 */
function validateSignUpInputs(name, email, pw, confirmPw, accepted) {
  if (!name || !email || !pw || !confirmPw)
    return showError($("error-sign-up"), "Please fill out all fields.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return showError($("error-sign-up"), "Invalid email.");
  if (pw.length < 6)
    return showError(
      $("error-sign-up"),
      "Password must be at least 6 characters."
    );
  if (pw !== confirmPw)
    return showError($("error-sign-up"), "Passwords do not match.");
  if (!accepted)
    return showError($("error-sign-up"), "You must accept the privacy policy.");
  return true;
}

/**
 * Create a new Firebase user and set displayName, then show success banner
 * and switch back to Login view.
 * @param {string} email
 * @param {string} password
 * @returns {void}
 */
function registerUser(email, password) {
  let name = $("name").value.trim();
  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      return updateProfile(userCredential.user, {
        displayName: name,
      });
    })
    .then(() => {
      $("layout").style.opacity = "0.5";
      $("slide-in-banner").classList.add("visible");
      setTimeout(() => {
        $("slide-in-banner").classList.remove("visible");
        $("layout").style.opacity = "1";
        showLoginForm();
        $("confirm").classList.toggle("checked");
        $("sign-up-button").disabled = false;
        $("sign-up-button").style.pointerEvents = "";
      }, 1200);
    })
    .catch((err) => showError($("error-sign-up"), err.message));
}

/**
 * Guest login handler: signs in with a static guest account.
 * @returns {void}
 */
function handleGuestLogin() {
  signInWithEmailAndPassword(auth, "guest@login.de", "guestpassword")
    .then(() => (window.location.href = "./summary-board.html"))
    .catch((err) => {
      $("errorMessage").innerHTML = "Guest login failed.";
    });
}

/**
 * Render an error message into the given element.
 * @param {HTMLElement} el
 * @param {string} msg
 * @returns {false} Always returns false for early-return patterns.
 */
function showError(el, msg) {
  el.innerHTML = msg;
  return false;
}

/**
 * Clear inline error for an input and reset its border color.
 * @param {HTMLInputElement} input
 * @param {HTMLElement} el - Error container element.
 * @returns {void}
 */
function clearFieldError(input, el) {
  el.innerHTML = "";
  input.parentElement.style.borderColor = "";
}

/**
 * Show a generic auth error and highlight password/email borders.
 * @param {HTMLElement} el - Error container.
 * @param {HTMLInputElement} pwInput
 * @param {HTMLInputElement} [emailInput]
 * @returns {false} Always returns false for early-return patterns.
 */
function displayAuthError(el, pwInput, emailInput) {
  showError(el, "Check your email and password. Please try again.");
  pwInput.parentElement.style.borderColor = "var(--error-color)";
  if (emailInput)
    emailInput.parentElement.style.borderColor = "var(--error-color)";
  return false;
}

/**
 * Global Enter key handler: triggers login or sign-up depending on the visible box.
 * @param {KeyboardEvent} e
 * @returns {void}
 */
function handleKeyDown(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    $("login-box").classList.contains("d-none")
      ? handleSignUp()
      : handleLogin();
  }
}

/**
 * Clear specific form inputs and an associated error box.
 * @param {string[]} inputs - List of input element IDs to clear.
 * @param {HTMLElement} [errorBox] - Optional element to clear innerHTML on.
 * @returns {void}
 */
function clearFormInputs(inputs, errorBox) {
  inputs.forEach((id) => {
    let input = $(id);
    if (input) {
      input.value = "";
      input.parentElement.style.borderColor = "";
    }
  });
  if (errorBox) errorBox.innerHTML = "";
}
