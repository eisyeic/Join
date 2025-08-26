// Firebase Imports
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { auth } from "./firebase.js";

// Utility
let currentMode = "login";

// Init
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => setThemeWhite(true), 500);
  setupEmailValidation();
  initializePasswordFields("login");
  $("guest-button").addEventListener("click", handleGuestLogin);
  $("sign-up-page-button").addEventListener("click", showSignUpForm);
  $("sign-up-bottom-button").addEventListener("click", showSignUpForm);
  document.getElementById("sign-up-bottom-box-mobile").addEventListener("click", showSignUpForm);
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

// Background and Logo animation
function setThemeWhite(isWhite) {
  $("layout").classList.toggle("bg-white", isWhite);
  $("layout").classList.toggle("bg-blue", !isWhite);
  $("logo-white").style.opacity = isWhite ? "0" : "1";
  $("logo-blue").style.opacity = isWhite ? "1" : "0";
  updateSignUpBoxDisplay();
}

// Show Sign Up view
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

// show Login view
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

// Update Sign Up box display based on current mode
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

// Setup password icon toggle functionality
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

// Toggle password visibility
function togglePasswordVisibility(input, toggle, visible) {
  if (!input.value) return;
  input.type = visible ? "text" : "password";
  updatePasswordIcon(input, toggle, visible);
}

// Reset password field to default state
function resetPasswordField(input, toggle, errorBox) {
  input.type = "password";
  updatePasswordIcon(input, toggle, false);
  clearFieldError(input, errorBox);
}

// Update the password icon based on visibility
function updatePasswordIcon(input, toggle, isVisible) {
  toggle.src = input.value
    ? isVisible
      ? "./assets/icons/login/visibility.svg"
      : "./assets/icons/login/visibility_off.svg"
    : "./assets/icons/login/lock.svg";
  toggle.classList.toggle("cursor-pointer", !!input.value);
}

// Email Validation functionality
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

// Validate Email Format
function validateEmailFormat(input, errorBox) {
  let email = input.value.trim();
  let pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && !pattern.test(email)) {
    showError(errorBox, "Check your email. Please try again.");
    input.parentElement.style.borderColor = "var(--error-color)";
  }
}

// Auth functions
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

// Sign Up button handler
function handleSignUp() {
  let name = $("name").value.trim();
  let email = $("sign-up-email").value.trim();
  let password = $("sign-up-password").value;
  let confirm = $("confirm-password").value;
  let accepted = $("confirm").classList.contains("checked");
  if (!validateSignUpInputs(name, email, password, confirm, accepted)) return;
  registerUser(email, password);
}

// Validate Sign Up inputs
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

// Register new User
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
      }, 1200);
    })
    .catch((err) => showError($("error-sign-up"), err.message));
}

// Guewst login handler
function handleGuestLogin() {
  signInWithEmailAndPassword(auth, "guest@login.de", "guestpassword")
    .then(() => (window.location.href = "./summary-board.html"))
    .catch((err) => {
      $("errorMessage").innerHTML = "Guest login failed.";
    });
}

// showError function
function showError(el, msg) {
  el.innerHTML = msg;
  return false;
}

// Clear field text error
function clearFieldError(input, el) {
  el.innerHTML = "";
  input.parentElement.style.borderColor = "";
}

// Display authentication error and border color
function displayAuthError(el, pwInput, emailInput) {
  showError(el, "Check your email and password. Please try again.");
  pwInput.parentElement.style.borderColor = "var(--error-color)";
  if (emailInput)
    emailInput.parentElement.style.borderColor = "var(--error-color)";
}

// Keydown Enter Handler
function handleKeyDown(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    $("login-box").classList.contains("d-none")
      ? handleSignUp()
      : handleLogin();
  }
}

// Clear form inputs and error messages
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
