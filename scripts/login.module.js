/**
 * Firebase Auth imports.
 * @see https://firebase.google.com/docs/reference/js/auth
 */
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { auth } from "./firebase.js";

/** External UI/validation helpers (global). */
/** @type {(box:HTMLElement|null, ...els:(HTMLElement|null|undefined)[])=>void} */
const displayAuthError = window.displayAuthError;
/** @type {(box:HTMLElement|null, msg:string)=>void} */
const showError = window.showError;
/** @type {(name:string,email:string,pw:string,confirm:string,accepted:boolean)=>boolean} */
const validateSignUpInputs = window.validateSignUpInputs;
/** @type {(() => void)|undefined} */
const showLoginForm = window.showLoginForm;

/* ================= Central DOM references ================= */
/** @type {HTMLInputElement|null} */ const loginEmailInput      = document.getElementById("login-email");
/** @type {HTMLInputElement|null} */ const loginPasswordInput   = document.getElementById("login-password");
/** @type {HTMLElement|null}      */ const errorMessageBox      = document.getElementById("errorMessage");

/// Sign-up
/** @type {HTMLInputElement|null} */ const nameInput            = document.getElementById("name");
/** @type {HTMLInputElement|null} */ const signUpEmailInput     = document.getElementById("sign-up-email");
/** @type {HTMLInputElement|null} */ const signUpPasswordInput  = document.getElementById("sign-up-password");
/** @type {HTMLInputElement|null} */ const confirmPasswordInput = document.getElementById("confirm-password");
/** @type {HTMLElement|null}      */ const confirmCheckbox      = document.getElementById("confirm");
/** @type {HTMLButtonElement|null}*/ const signUpButton         = document.getElementById("sign-up-button");

/** @type {HTMLElement|null}      */ const layout               = document.getElementById("layout");
/** @type {HTMLElement|null}      */ const slideInBanner        = document.getElementById("slide-in-banner");
/** @type {HTMLElement|null}      */ const errorSignUpBox       = document.getElementById("error-sign-up");

/**
 * Login handler: highlight both fields if empty/invalid, then try Firebase sign-in.
 * @returns {void}
 */
window.handleLogin = function () {
  const emailEl = loginEmailInput;
  const pwEl    = loginPasswordInput;
  const email   = (emailEl?.value || "").trim();
  const pw      = pwEl?.value || "";

  if (!email || !pw || pw.length < 6) {
    return displayAuthError?.(errorMessageBox, pwEl, emailEl);
  }

  signInWithEmailAndPassword(auth, email, pw)
    .then(() => { window.location.href = "summary-board.html"; })
    .catch(() => displayAuthError?.(errorMessageBox, pwEl, emailEl));
};

/**
 * Sign-up handler: validate fields, highlight specific invalid inputs, then register.
 * Disables the submit button until the flow completes.
 * @returns {void}
 */
window.handleSignUp = function () {
  const name     = (nameInput?.value || "").trim();
  const email    = (signUpEmailInput?.value || "").trim();
  const password = signUpPasswordInput?.value || "";
  const confirm  = (confirmPasswordInput?.value || "");
  const accepted = !!confirmCheckbox?.classList.contains("checked");

  const mark = (el) => { if (el?.parentElement) el.parentElement.style.borderColor = "var(--error-color)"; };
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Use your existing validator for messaging; if it fails, mark the specific fields.
  const ok = validateSignUpInputs?.(name, email, password, confirm, accepted);
  if (!ok) {
    if (!name) mark(nameInput);
    if (!email || !emailOk) mark(signUpEmailInput);
    if (!password || password.length < 6) mark(signUpPasswordInput);
    if (!confirm || confirm !== password) mark(confirmPasswordInput);
    // (Optional) You could also visually mark the confirm checkbox here if desired.
    return;
  }

  registerUser(email, password);
  if (signUpButton) signUpButton.style.pointerEvents = "none";
};

/**
 * Shows the success UI after registration (banner, reset, back-to-login).
 * @returns {void}
 */
function showSignUpSuccessUI() {
  if (layout) layout.style.opacity = "0.5";
  slideInBanner?.classList.add("visible");
  setTimeout(() => {
    slideInBanner?.classList.remove("visible");
    if (layout) layout.style.opacity = "1";
    typeof showLoginForm === "function" && showLoginForm();
    confirmCheckbox?.classList.toggle("checked");
    if (signUpButton) signUpButton.style.pointerEvents = "";
  }, 1200);
}

/**
 * Registers the user with Firebase and sets the display name.
 * Global (no export).
 * @param {string} email
 * @param {string} password
 * @returns {void}
 */
window.registerUser = function (email, password) {
  const displayName = (nameInput?.value || "").trim();
  createUserWithEmailAndPassword(auth, email, password)
    .then((cred) => updateProfile(cred.user, { displayName }))
    .then(showSignUpSuccessUI)
    .catch((err) => showError?.(errorSignUpBox, err?.message || "Registration failed."));
};

/**
 * Guest sign-in; on success redirects, on error shows a short UI message.
 * Global (no export).
 * @returns {void}
 */
window.handleGuestLogin = function () {
  signInWithEmailAndPassword(auth, "guest@login.de", "guestpassword")
    .then(() => { window.location.href = "./summary-board.html"; })
    .catch(() => {
      if (errorMessageBox) errorMessageBox.innerHTML = "Guest login failed.";
    });
};