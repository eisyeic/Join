/**
 * @file signup-core.js
 * @description Core signup functionality and initialization
 */
import { auth } from "./firebase.js";
import { setThemeWhite, updateSignUpBoxDisplay } from "./signup-theme.js";
import { setupEmailValidation, initializePasswordFields } from "./signup-validation.js";
import { handleSignUp } from "./signup-auth.js";

let currentMode = "login";

/**
 * Sets initial theme with delay
 */
function setInitialTheme() {
  setTimeout(() => setThemeWhite(true), 500);
}

/**
 * Disables sign-up button initially
 */
function disableSignUpButton() {
  $("sign-up-button").style.pointerEvents = "none";
}

/**
 * Sets up all initial configurations
 */
function setupInitialConfigurations() {
  setupEmailValidation();
  setupSignupEventListeners();
  setupResizeListener();
}

/**
 * Initializes the sign-up view after DOM load
 */
function initSignup() {
  setInitialTheme();
  setupInitialConfigurations();
  disableSignUpButton();
}
document.addEventListener("DOMContentLoaded", initSignup);

/**
 * Adds event listener to element if it exists
 */
function addEventListenerIfExists(id, event, handler) {
  const element = $(id) || document.getElementById(id);
  element?.addEventListener(event, handler);
}

/**
 * Handles confirm checkbox toggle
 */
function handleConfirmToggle() {
  $("confirm").classList.toggle("checked");
  const isChecked = $("confirm").classList.contains("checked");
  $("sign-up-button").style.pointerEvents = isChecked ? "" : "none";
}

/**
 * Sets up sign-up form button listeners
 */
function setupSignUpFormListeners() {
  addEventListenerIfExists("sign-up-page-button", "click", showSignUpForm);
  addEventListenerIfExists("sign-up-bottom-button", "click", showSignUpForm);
  addEventListenerIfExists("sign-up-bottom-box-mobile", "click", showSignUpForm);
}

/**
 * Sets up action button listeners
 */
function setupActionButtonListeners() {
  addEventListenerIfExists("sign-up-button", "click", handleSignUp);
  addEventListenerIfExists("go-back", "click", showLoginForm);
}

/**
 * Sets up checkbox listeners
 */
function setupCheckboxListeners() {
  addEventListenerIfExists("confirm", "click", handleConfirmToggle);
}

/**
 * Registers event listeners for sign-up related buttons and checkboxes
 */
function setupSignupEventListeners() {
  setupSignUpFormListeners();
  setupActionButtonListeners();
  setupCheckboxListeners();
}

/**
 * Attaches resize listener for responsive sign-up box display
 */
function setupResizeListener() {
  window.addEventListener("resize", updateSignUpBoxDisplay);
}

/**
 * Sets current mode to signup
 */
function setSignupMode() {
  currentMode = "signup";
}

/**
 * Clears login form inputs
 */
function clearLoginInputs() {
  clearFormInputs(["login-email", "login-password"], $("errorMessage"));
}

/**
 * Displays the sign-up form and hides the login form
 */
function showSignUpForm() {
  setSignupMode();
  setThemeWhite(false);
  if (window.innerWidth <= 720) {
    $("sign-up-bottom-box-mobile").style.display = "none";
  }
  $("sign-up-top-right-box").style.display = "none";
  $("sign-up-box").classList.remove("d-none");
  $("login-box").classList.add("d-none");
  clearLoginInputs();
  initializePasswordFields("sign-up");
}

/**
 * Sets current mode to login
 */
function setLoginMode() {
  currentMode = "login";
}

/**
 * Clears signup form inputs
 */
function clearSignupInputs() {
  clearFormInputs(["name", "sign-up-email", "sign-up-password", "confirm-password"], $("error-sign-up"));
}

/**
 * Displays the login form and hides the sign-up form
 */
function showLoginForm() {
  setLoginMode();
  setThemeWhite(true);
  if (window.innerWidth <= 720) {
    $("sign-up-bottom-box-mobile").style.display = "flex";
  }
  $("sign-up-top-right-box").style.display = "flex";
  $("login-box").classList.remove("d-none");
  $("sign-up-box").classList.add("d-none");
  clearSignupInputs();
  initializePasswordFields("login");
}

/**
 * Clears multiple input fields and error messages
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

// Export current mode getter for other modules
export function getCurrentMode() {
  return currentMode;
}

// Export functions for other modules
export { showLoginForm };