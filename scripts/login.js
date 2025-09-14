
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { auth } from "./firebase.js";

let currentMode = "login";


function initLogin() {
  setTimeout(() => setThemeWhite(true), 500);
  setupEmailValidation();
  initializePasswordFields("login");
  setupEventListeners();
  setupResizeListener();
  $("sign-up-button").style.pointerEvents = "none";
  document.addEventListener("keydown", handleKeyDown);
}

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


function setupResizeListener() {
  window.addEventListener("resize", updateSignUpBoxDisplay);
}

function setThemeWhite(isWhite) {
  $("layout").classList.toggle("bg-white", isWhite);
  $("layout").classList.toggle("bg-blue", !isWhite);
  $("logo-white").style.opacity = isWhite ? "0" : "1";
  $("logo-blue").style.opacity = isWhite ? "1" : "0";
  updateSignUpBoxDisplay();
}

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

function togglePasswordVisibility(input, toggle, visible) {
  if (!input.value) return;
  input.type = visible ? "text" : "password";
  updatePasswordIcon(input, toggle, visible);
}

// Reset a password field to default state and clear related error styling
function resetPasswordField(input, toggle, errorBox) {
  input.type = "password";
  updatePasswordIcon(input, toggle, false);
  clearFieldError(input, errorBox);
}

// Update the password toggle icon based on visibility and input content
function updatePasswordIcon(input, toggle, isVisible) {
  toggle.src = input.value
    ? isVisible
      ? "./assets/icons/login/visibility.svg"
      : "./assets/icons/login/visibility_off.svg"
    : "./assets/icons/login/lock.svg";
  toggle.classList.toggle("cursor-pointer", !!input.value);
}

// Wire email validation for login and sign-up inputs
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

// Validate email format on blur and show inline error if invalid
function validateEmailFormat(input, errorBox) {
  let email = input.value.trim();
  let pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && !pattern.test(email)) {
    showError(errorBox, "Check your email. Please try again.");
    input.parentElement.style.borderColor = "var(--error-color)";
  }
}



// Attempt to sign in with email and password
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

// Validate sign-up inputs and proceed to registration if valid
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

// Validate sign-up fields (required, format, length, matching, consent)
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

// Create a new Firebase user and set displayName, then show success banner and switch back to Login view
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

// Guest login handler: signs in with a static guest account
function handleGuestLogin() {
  signInWithEmailAndPassword(auth, "guest@login.de", "guestpassword")
    .then(() => (window.location.href = "./summary-board.html"))
    .catch((err) => {
      $("errorMessage").innerHTML = "Guest login failed.";
    });
}

// Render an error message into the given element
function showError(el, msg) {
  el.innerHTML = msg;
  return false;
}

// Clear inline error for an input and reset its border color
function clearFieldError(input, el) {
  el.innerHTML = "";
  input.parentElement.style.borderColor = "";
}

// Show a generic auth error and highlight password/email borders
function displayAuthError(el, pwInput, emailInput) {
  showError(el, "Check your email and password. Please try again.");
  pwInput.parentElement.style.borderColor = "var(--error-color)";
  if (emailInput)
    emailInput.parentElement.style.borderColor = "var(--error-color)";
  return false;
}

// Global Enter key handler: triggers login or sign-up depending on the visible box
function handleKeyDown(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    $("login-box").classList.contains("d-none")
      ? handleSignUp()
      : handleLogin();
  }
}

// Clear specific form inputs and an associated error box
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
