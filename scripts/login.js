// Firebase Imports
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { auth } from "./firebase.js";

// UI Elements
const layout = document.getElementById("layout");
const logoBlue = document.getElementById("logo-blue");
const logoWhite = document.getElementById("logo-white");
const signUpButtonBox = document.getElementById("sign-up-top-right-box");
const signUpBottomBox = document.getElementById("sign-up-bottom-box");
const loginBox = document.getElementById("login-box");
const signUpBox = document.getElementById("sign-up-box");
const goBack = document.getElementById("go-back");
const error = document.getElementById("errorMessage");
const errorSignUp = document.getElementById("error-sign-up");
const passwordInput = document.getElementById("login-password");
const emailInput = document.getElementById("login-email");
const emailSignUpInput = document.getElementById("sign-up-email");
const confirmBox = document.getElementById("confirm");
const loginButton = document.getElementById("login-button");
const signupPageButton = document.getElementById("sign-up-page-button");
const signUpButton = document.getElementById("sign-up-button");
const slideInMessage = document.getElementById("slide-in-banner");

// Background Animation
setTimeout(() => {
  layout.classList.add("bg-white");
  logoWhite.style.opacity = "0";
  logoBlue.style.opacity = "1";
}, 500);

// Toggle Signup View
function openSignUpBox() {
  layout.classList.toggle("bg-blue");
  layout.classList.toggle("bg-white");
  logoWhite.style.opacity = layout.classList.contains("bg-blue") ? "1" : "0";
  logoBlue.style.opacity = layout.classList.contains("bg-blue") ? "0" : "1";
  signUpButtonBox.classList.add("d-none");
  signUpBottomBox.classList.add("d-none-important");
  loginBox.classList.add("d-none");
  signUpBox.classList.remove("d-none");
  setupPasswordField("sign-up-password", "toggle-sign-up-password", errorSignUp);
  setupPasswordField("confirm-password", "toggle-confirm-password", errorSignUp);
}

// Back to Login View
goBack.addEventListener("click", () => {
  layout.classList.toggle("bg-blue");
  layout.classList.toggle("bg-white");
  logoWhite.style.opacity = layout.classList.contains("bg-blue") ? "1" : "0";
  logoBlue.style.opacity = layout.classList.contains("bg-blue") ? "0" : "1";
  signUpButtonBox.classList.remove("d-none");
  signUpBottomBox.classList.remove("d-none-important");
  loginBox.classList.remove("d-none");
  signUpBox.classList.add("d-none");
  setupPasswordField("login-password", "togglePassword", error);
});

// Setup Password Toggle and Reset
function setupPasswordField(inputId, toggleId, errorElement) {
  const input = document.getElementById(inputId);
  const toggle = document.getElementById(toggleId);
  if (!input || !toggle) return;

  let isVisible = false;

  function updateIcon() {
    if (!input.value) {
      toggle.src = "./assets/log_in_sign_up/icons/lock.svg";
      toggle.classList.remove("cursor-pointer");
    } else {
      toggle.src = isVisible
        ? "./assets/log_in_sign_up/icons/visibility.svg"
        : "./assets/log_in_sign_up/icons/visibility_off.svg";
      toggle.classList.add("cursor-pointer");
    }
  }

  toggle.addEventListener("click", () => {
    if (!input.value) return;
    isVisible = !isVisible;
    input.type = isVisible ? "text" : "password";
    updateIcon();
  });

  input.addEventListener("input", () => {
    isVisible = false;
    input.type = "password";
    updateIcon();
    input.parentElement.style.borderColor = "";
    if (errorElement) errorElement.innerHTML = "";
  });
}

// Email Validation
function validation() {
  let email = this.value.trim();
  let pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && !pattern.test(email)) {
    let msg = "Check your email. Please try again.";
    showError(this.id === "login-email" ? error : errorSignUp, msg);
    this.parentElement.style.borderColor = "var(--error-color)";
  }
}

emailInput.addEventListener("blur", validation);
emailSignUpInput.addEventListener("blur", validation);
emailInput.addEventListener("input", () => {
  error.innerHTML = "";
  emailInput.parentElement.style.borderColor = "";
});
emailSignUpInput.addEventListener("input", () => {
  errorSignUp.innerHTML = "";
  emailSignUpInput.parentElement.style.borderColor = "";
});

// Confirm Box
confirmBox.addEventListener("click", () => {
  confirmBox.classList.toggle("checked");
  signUpButton.classList.toggle("sign-up-button");
});

// Login
function logIn() {
  let email = emailInput.value.trim();
  let password = passwordInput.value;
  if (password.length < 6) {
    showError(error, "Check your email and password. Please try again.");
    passwordInput.parentElement.style.borderColor = "var(--error-color)";
    return;
  }
  signInWithEmailAndPassword(auth, email, password)
    .then(user => {
      window.location.href = "summary-board.html";
    })
    .catch(() => {
      showError(error, "Check your email and password. Please try again.");
      emailInput.parentElement.style.borderColor = "var(--error-color)";
      passwordInput.parentElement.style.borderColor = "var(--error-color)";
    });
}

// Signup
function signUp() {
  const name = document.getElementById("name").value.trim();
  const email = emailSignUpInput.value.trim();
  const password = document.getElementById("sign-up-password").value;
  const confirm = document.getElementById("confirm-password").value;
  const accepted = confirmBox.classList.contains("checked");

  resetSignUpErrors();

  if (!allFieldsFilled(name, email, password, confirm)) return;
  if (!isValidEmail(email)) return;
  if (!isValidPassword(password)) return;
  if (password !== confirm) return showError(errorSignUp, "Passwords do not match.");
  if (!accepted) return showError(errorSignUp, "You must accept the privacy policy.");

  createUserWithEmailAndPassword(auth, email, password)
    .then(() => {
      layout.style.opacity = "0.5";
      slideInMessage.classList.add("visible");
      setTimeout(() => {
        slideInMessage.classList.remove("visible");
        layout.style.opacity = "1";
        goBack.click();
      }, 1200);
    })
    .catch(error => showError(errorSignUp, error.message));
}

function guestLogin() {
  const email = "guest@login.de";
  const password = "guestpassword";

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      window.location.href = "./summary-board.html";
    })
    .catch((error) => {
      const errorMessage = document.getElementById("errorMessage");
      errorMessage.innerHTML = "Guest login failed.";
      console.error("Guest login error:", error.message);
    });
}

document.getElementById("guest-button").addEventListener("click", guestLogin);

// Helper Functions
function showError(element, msg) {
  element.innerHTML = msg;
}

function resetSignUpErrors() {
  errorSignUp.innerHTML = "";
  emailSignUpInput.parentElement.style.borderColor = "";
}

function allFieldsFilled(name, email, pw, confirmPw) {
  if (!name || !email || !pw || !confirmPw) {
    showError(errorSignUp, "Please fill out all fields.");
    return false;
  }
  return true;
}

function isValidEmail(email) {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!pattern.test(email)) {
    emailSignUpInput.parentElement.style.borderColor = "var(--error-color)";
    showError(errorSignUp, "Check your email. Please try again.");
    return false;
  }
  return true;
}

function isValidPassword(pw) {
  if (pw.length < 6) {
    document.getElementById("sign-up-password").parentElement.style.borderColor = "var(--error-color)";
    showError(errorSignUp, "Password must be at least 6 characters.");
    return false;
  }
  return true;
}

// Init
signupPageButton.addEventListener("click", openSignUpBox);
signUpButton.addEventListener("click", signUp);
loginButton.addEventListener("click", logIn);
document.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    e.preventDefault();
    if (!loginBox.classList.contains("d-none")) logIn();
    else if (!signUpBox.classList.contains("d-none")) signUp();
  }
});

// Initial password setup for login
setupPasswordField("login-password", "togglePassword", error);
