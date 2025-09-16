/**
 * @file Login and Sign-up logic for a Firebase Auth based app.
 * Handles form switching, validation, password visibility, and login/registration.
 *
 * Assumptions:
 * - There is a global helper function `$` that returns an HTMLElement by ID.
 * - All referenced IDs exist in the DOM when event handlers run.
 * - CSS variables like `--error-color` are defined.
 */
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { auth } from "./firebase.js";

/** @type {"login"|"signup"} */
let currentMode = "login";

/**
 * Initializes the login/sign-up view after DOM is ready:
 * theme setup, validation, password toggles, event listeners, and keyboard handling.
 * @returns {void}
 */
function initLogin() {
  setTimeout(() => setThemeWhite(true), 500);
  setupEmailValidation();
  initializePasswordFields("login");
  setupEventListeners();
  setupResizeListener();
  $("sign-up-button").style.pointerEvents = "none";
  document.addEventListener("keydown", handleKeyDown);
}

/**
 * Attaches all DOM event listeners for login/sign-up interactions.
 * @returns {void}
 */
function setupEventListeners() {
  $("guest-button").addEventListener("click", handleGuestLogin);
  $("sign-up-page-button").addEventListener("click", showSignUpForm);
  $("sign-up-bottom-button").addEventListener("click", showSignUpForm);
  document.getElementById("sign-up-bottom-box-mobile").addEventListener("click", showSignUpForm);
  $("sign-up-button").addEventListener("click", handleSignUp);
  $("login-button").addEventListener("click", handleLogin);
  $("go-back").addEventListener("click", showLoginForm);
  $("confirm").addEventListener("click", () => {
    $("confirm").classList.toggle("checked");
    if ($("confirm").classList.contains("checked")) {
      $("sign-up-button").style.pointerEvents = "";
    } else {
      $("sign-up-button").style.pointerEvents = "none";
    }
  });
}

document.addEventListener("DOMContentLoaded", initLogin);

/**
 * Adds a resize listener to handle responsive sign-up box display.
 * @returns {void}
 */
function setupResizeListener() {
  window.addEventListener("resize", updateSignUpBoxDisplay);
}

/**
 * Switches between white and blue theme, including logo visibility.
 * Also updates sign-up box display.
 * @param {boolean} isWhite - true = white theme, false = blue theme.
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
 * Switches to the sign-up view: updates theme, clears login fields,
 * and initializes sign-up password fields.
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
 * Switches to the login view: updates theme, clears sign-up fields,
 * and initializes login password fields.
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
 * Controls visibility of the top-right and bottom-mobile sign-up boxes
 * based on current mode and viewport width.
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
 * Initializes password toggle logic for a given context.
 * @param {"login"|"sign-up"} context - Which form fields should be initialized.
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
 * Sets up toggle icon and behavior for a password input field.
 * @param {string} inputId - ID of the password input.
 * @param {string} toggleId - ID of the clickable icon/image.
 * @param {HTMLElement} errorBox - Error container element.
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
 * Toggles a password field between "text" and "password" if it has content.
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
 * Resets a password field (hidden) and clears error styles.
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
 * Updates the toggle icon depending on input content and visibility state.
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
 * Attaches blur/input listeners for email validation and error clearing.
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
 * Validates email format on blur; sets error message/styles if invalid.
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

/**
 * Attempts Firebase login with form values. Redirects on success,
 * shows a generic error message on failure.
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
 * Validates sign-up fields and registers a new account if valid.
 * Temporarily disables the sign-up button (pointer-events).
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
  $("sign-up-button").style.pointerEvents = "none";  
}

/**
 * Validates sign-up input fields.
 * @param {string} name
 * @param {string} email
 * @param {string} pw
 * @param {string} confirmPw
 * @param {boolean} accepted
 * @returns {boolean} true if valid; otherwise false (after showing error).
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
 * Registers a new Firebase user, sets displayName,
 * shows success banner, then switches back to login form.
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
        $("sign-up-button").style.pointerEvents = "";
      }, 1200);
    })
    .catch((err) => showError($("error-sign-up"), err.message));
}

/**
 * Signs in with a static guest account. Redirects on success, shows error on failure.
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
 * Writes an error message into a DOM element.
 * @param {HTMLElement} el
 * @param {string} msg
 * @returns {false} Always returns false for convenience.
 */
function showError(el, msg) {
  el.innerHTML = msg;
  return false;
}

/**
 * Clears inline error and resets border color on the input's parent element.
 * @param {HTMLInputElement} input
 * @param {HTMLElement} el
 * @returns {void}
 */
function clearFieldError(input, el) {
  el.innerHTML = "";
  input.parentElement.style.borderColor = "";
}

/**
 * Shows a generic auth error and highlights password (and optionally email) fields.
 * @param {HTMLElement} el
 * @param {HTMLInputElement} pwInput
 * @param {HTMLInputElement} [emailInput]
 * @returns {false} Always returns false for convenience.
 */
function displayAuthError(el, pwInput, emailInput) {
  showError(el, "Check your email and password. Please try again.");
  pwInput.parentElement.style.borderColor = "var(--error-color)";
  if (emailInput)
    emailInput.parentElement.style.borderColor = "var(--error-color)";
  return false;
}

/**
 * Global keydown handler: Enter submits the currently visible form.
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
 * Clears multiple input fields by ID and resets their borders;
 * also clears the optional error container.
 * @param {string[]} inputs
 * @param {HTMLElement} [errorBox]
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