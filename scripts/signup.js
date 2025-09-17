/**
 * @file signup.js
 * @description Sign-up specific logic for Firebase Auth.
 * Handles: theme switching, sign-up box display, 
 * confirm checkbox, email/password validation, 
 * and user registration with Firebase.
 */
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { auth } from "./firebase.js";

let currentMode = "login";

/**
 * Initializes the sign-up view after DOM load:
 * sets theme, email validation, event listeners, 
 * resize listener, and disables sign-up button initially.
 * @returns {void}
 */
function initSignup() {
  setTimeout(() => setThemeWhite(true), 500);
  setupEmailValidation();
  setupSignupEventListeners();
  setupResizeListener();
  $("sign-up-button").style.pointerEvents = "none";
}
document.addEventListener("DOMContentLoaded", initSignup);

/**
 * Registers event listeners for sign-up related buttons and checkboxes.
 * @returns {void}
 */
function setupSignupEventListeners() {
  $("sign-up-page-button")?.addEventListener("click", showSignUpForm);
  $("sign-up-bottom-button")?.addEventListener("click", showSignUpForm);
  document.getElementById("sign-up-bottom-box-mobile")?.addEventListener("click", showSignUpForm);
  $("sign-up-button")?.addEventListener("click", handleSignUp);
  $("go-back")?.addEventListener("click", showLoginForm);
  $("confirm")?.addEventListener("click", () => {
    $("confirm").classList.toggle("checked");
    $("sign-up-button").style.pointerEvents = $("confirm").classList.contains("checked") ? "" : "none";
  });
}

/**
 * Attaches resize listener for responsive sign-up box display.
 * @returns {void}
 */
function setupResizeListener() {
  window.addEventListener("resize", updateSignUpBoxDisplay);
}

/**
 * Switches between white and blue theme and updates sign-up box visibility.
 * @param {boolean} isWhite - true = white theme, false = blue theme
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
 * Displays the sign-up form and hides the login form.
 * Also initializes password toggle for sign-up fields.
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
 * Displays the login form and hides the sign-up form.
 * Also resets sign-up inputs and re-initializes login password field.
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
  clearFormInputs(["name", "sign-up-email", "sign-up-password", "confirm-password"], $("error-sign-up"));
  initializePasswordFields("login");
}

/**
 * Updates visibility of sign-up boxes (top-right and bottom-mobile)
 * based on mode and viewport width.
 * @returns {void}
 */
function updateSignUpBoxDisplay() {
  const topRight = $("sign-up-top-right-box");
  const bottomMobile = $("sign-up-bottom-box-mobile");
  if (!topRight) return;
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

/**
 * Sets up email field validation (blur + input).
 * @returns {void}
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
 * Handles sign-up button click:
 * validates inputs and registers the user.
 * @returns {void}
 */
function handleSignUp() {
  const name = $("name").value.trim();
  const email = $("sign-up-email").value.trim();
  const password = $("sign-up-password").value;
  const confirm = $("confirm-password").value;
  const accepted = $("confirm").classList.contains("checked");
  if (!validateSignUpInputs(name, email, password, confirm, accepted)) return;
  registerUser(email, password);
  $("sign-up-button").style.pointerEvents = "none";
}

/**
 * Validates all sign-up inputs.
 * @param {string} name
 * @param {string} email
 * @param {string} pw
 * @param {string} confirmPw
 * @param {boolean} accepted
 * @returns {boolean} true if valid, false otherwise
 */
function validateSignUpInputs(name, email, pw, confirmPw, accepted) {
  if (!name || !email || !pw || !confirmPw)
    return showError($("error-sign-up"), "Please fill out all fields.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return showError($("error-sign-up"), "Invalid email.");
  if (pw.length < 6)
    return showError($("error-sign-up"), "Password must be at least 6 characters.");
  if (pw !== confirmPw)
    return showError($("error-sign-up"), "Passwords do not match.");
  if (!accepted)
    return showError($("error-sign-up"), "You must accept the privacy policy.");
  return true;
}

/**
 * Registers a new Firebase user and sets displayName.
 * Shows a success banner and switches back to login form.
 * @param {string} email
 * @param {string} password
 * @returns {void}
 */
function registerUser(email, password) {
  const name = $("name").value.trim();
  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => updateProfile(userCredential.user, { displayName: name }))
    .then(() => {
      $("layout").style.opacity = "0.5";
      $("slide-in-banner").classList.add("visible");
      setTimeout(() => {
        $("slide-in-banner").classList.remove("visible");
        $("layout").style.opacity = "1";
        showLoginForm();
        $("confirm").classList.toggle("checked");
        $("sign-up-button").style.pointerEvents = "";
      }, 1200);
    })
    .catch((err) => showError($("error-sign-up"), err.message));
}

/* --- Shared helpers --- */

/**
 * Initializes password toggles for sign-up fields.
 * @param {"sign-up"} context
 * @returns {void}
 */
function initializePasswordFields(context) {
  if (context !== "sign-up") return;
  [["sign-up-password", "toggle-sign-up-password"], ["confirm-password", "toggle-confirm-password"]]
    .forEach(([inputId, toggleId]) => setupPasswordToggle(inputId, toggleId, $("error-sign-up")));
}

/**
 * Sets up toggle behavior for password fields.
 * @param {string} inputId
 * @param {string} toggleId
 * @param {HTMLElement} errorBox
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
 * Toggles password field visibility.
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
 * Resets a password field to hidden and clears errors.
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
 * Updates the password toggle icon based on input state.
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
 * Validates email format and shows error if invalid.
 * @param {HTMLInputElement} input
 * @param {HTMLElement} errorBox
 * @returns {void}
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
 * Displays an error message in the given element.
 * @param {HTMLElement} el
 * @param {string} msg
 * @returns {false}
 */
function showError(el, msg) {
  el.innerHTML = msg;
  return false;
}

/**
 * Clears error message and resets input border color.
 * @param {HTMLInputElement} input
 * @param {HTMLElement} el
 * @returns {void}
 */
function clearFieldError(input, el) {
  el.innerHTML = "";
  input.parentElement.style.borderColor = "";
}

/**
 * Clears multiple input fields and error messages.
 * @param {string[]} inputs - IDs of input elements
 * @param {HTMLElement} errorBox - Optional error container
 * @returns {void}
 */
function clearFormInputs(inputs, errorBox) {
  inputs.forEach((id) => {
    const input = $(id);
    if (input) {
      input.value = "";
      input.parentElement.style.borderColor = "";
    }
  });
  if (errorBox) errorBox.innerHTML = "";
}