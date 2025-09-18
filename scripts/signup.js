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
 * Initializes the sign-up view after DOM load:
 * sets theme, email validation, event listeners, 
 * resize listener, and disables sign-up button initially.
 * @returns {void}
 */
function initSignup() {
  setInitialTheme();
  setupInitialConfigurations();
  disableSignUpButton();
}
document.addEventListener("DOMContentLoaded", initSignup);

/**
 * Adds event listener to element if it exists
 * @param {string} id
 * @param {string} event
 * @param {Function} handler
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
 * Registers event listeners for sign-up related buttons and checkboxes.
 * @returns {void}
 */
function setupSignupEventListeners() {
  setupSignUpFormListeners();
  setupActionButtonListeners();
  setupCheckboxListeners();
}

/**
 * Attaches resize listener for responsive sign-up box display.
 * @returns {void}
 */
function setupResizeListener() {
  window.addEventListener("resize", updateSignUpBoxDisplay);
}

/**
 * Sets layout background classes
 * @param {boolean} isWhite
 */
function setLayoutBackground(isWhite) {
  $("layout").classList.toggle("bg-white", isWhite);
  $("layout").classList.toggle("bg-blue", !isWhite);
}

/**
 * Sets logo visibility based on theme
 * @param {boolean} isWhite
 */
function setLogoVisibility(isWhite) {
  $("logo-white").style.opacity = isWhite ? "0" : "1";
  $("logo-blue").style.opacity = isWhite ? "1" : "0";
}

/**
 * Switches between white and blue theme and updates sign-up box visibility.
 * @param {boolean} isWhite - true = white theme, false = blue theme
 * @returns {void}
 */
function setThemeWhite(isWhite) {
  setLayoutBackground(isWhite);
  setLogoVisibility(isWhite);
  updateSignUpBoxDisplay();
}

/**
 * Sets current mode to signup
 */
function setSignupMode() {
  currentMode = "signup";
}

/**
 * Hides mobile signup box if on mobile
 */
function hideMobileSignupBox() {
  if (window.innerWidth <= 720) {
    $("sign-up-bottom-box-mobile").style.display = "none";
  }
}

/**
 * Hides top right signup box
 */
function hideTopRightSignupBox() {
  $("sign-up-top-right-box").style.display = "none";
}

/**
 * Shows signup form and hides login form
 */
function toggleFormVisibility() {
  $("sign-up-box").classList.remove("d-none");
  $("login-box").classList.add("d-none");
}

/**
 * Clears login form inputs
 */
function clearLoginInputs() {
  clearFormInputs(["login-email", "login-password"], $("errorMessage"));
}

/**
 * Displays the sign-up form and hides the login form.
 * Also initializes password toggle for sign-up fields.
 * @returns {void}
 */
function showSignUpForm() {
  setSignupMode();
  setThemeWhite(false);
  hideMobileSignupBox();
  hideTopRightSignupBox();
  toggleFormVisibility();
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
 * Shows mobile signup box if on mobile
 */
function showMobileSignupBox() {
  if (window.innerWidth <= 720) {
    $("sign-up-bottom-box-mobile").style.display = "flex";
  }
}

/**
 * Shows top right signup box
 */
function showTopRightSignupBox() {
  $("sign-up-top-right-box").style.display = "flex";
}

/**
 * Shows login form and hides signup form
 */
function toggleLoginFormVisibility() {
  $("login-box").classList.remove("d-none");
  $("sign-up-box").classList.add("d-none");
}

/**
 * Clears signup form inputs
 */
function clearSignupInputs() {
  clearFormInputs(["name", "sign-up-email", "sign-up-password", "confirm-password"], $("error-sign-up"));
}

/**
 * Displays the login form and hides the sign-up form.
 * Also resets sign-up inputs and re-initializes login password field.
 * @returns {void}
 */
function showLoginForm() {
  setLoginMode();
  setThemeWhite(true);
  showMobileSignupBox();
  showTopRightSignupBox();
  toggleLoginFormVisibility();
  clearSignupInputs();
  initializePasswordFields("login");
}

/**
 * Gets signup box elements
 * @returns {Object}
 */
function getSignupBoxElements() {
  return {
    topRight: $("sign-up-top-right-box"),
    bottomMobile: $("sign-up-bottom-box-mobile")
  };
}

/**
 * Checks if elements are valid for display update
 * @param {Object} elements
 * @returns {boolean}
 */
function areSignupBoxElementsValid(elements) {
  return elements.topRight !== null;
}

/**
 * Checks if current mode is signup
 * @returns {boolean}
 */
function isSignupMode() {
  return currentMode === "signup";
}

/**
 * Checks if viewport is mobile
 * @returns {boolean}
 */
function isMobileViewport() {
  return window.innerWidth <= 720;
}

/**
 * Hides both signup boxes
 * @param {Object} elements
 */
function hideBothSignupBoxes(elements) {
  elements.topRight.classList.add("d-none");
  elements.bottomMobile?.classList.add("d-none");
}

/**
 * Shows mobile signup box and hides desktop
 * @param {Object} elements
 */
function showMobileHideDesktop(elements) {
  elements.topRight.classList.add("d-none");
  elements.bottomMobile?.classList.remove("d-none");
}

/**
 * Shows desktop signup box and hides mobile
 * @param {Object} elements
 */
function showDesktopHideMobile(elements) {
  elements.topRight.classList.remove("d-none");
  elements.bottomMobile?.classList.add("d-none");
}

/**
 * Updates signup boxes for login mode
 * @param {Object} elements
 */
function updateSignupBoxesForLogin(elements) {
  if (isMobileViewport()) {
    showMobileHideDesktop(elements);
  } else {
    showDesktopHideMobile(elements);
  }
}

/**
 * Updates visibility of sign-up boxes (top-right and bottom-mobile)
 * based on mode and viewport width.
 * @returns {void}
 */
function updateSignUpBoxDisplay() {
  const elements = getSignupBoxElements();
  if (!areSignupBoxElementsValid(elements)) return;
  
  if (isSignupMode()) {
    hideBothSignupBoxes(elements);
  } else {
    updateSignupBoxesForLogin(elements);
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
 * Gets signup form values
 * @returns {Object}
 */
function getSignupFormValues() {
  return {
    name: $("name").value.trim(),
    email: $("sign-up-email").value.trim(),
    password: $("sign-up-password").value,
    confirm: $("confirm-password").value,
    accepted: $("confirm").classList.contains("checked")
  };
}

/**
 * Disables signup button
 */
function disableSignupButton() {
  $("sign-up-button").style.pointerEvents = "none";
}

/**
 * Processes signup if validation passes
 * @param {Object} values
 */
function processSignupIfValid(values) {
  const { name, email, password, confirm, accepted } = values;
  if (!validateSignUpInputs(name, email, password, confirm, accepted)) return;
  registerUser(email, password);
  disableSignupButton();
}

/**
 * Handles sign-up button click:
 * validates inputs and registers the user.
 * @returns {void}
 */
function handleSignUp() {
  const values = getSignupFormValues();
  processSignupIfValid(values);
}

/**
 * Checks if all required fields are filled
 * @param {string} name
 * @param {string} email
 * @param {string} pw
 * @param {string} confirmPw
 * @returns {boolean}
 */
function areAllFieldsFilled(name, email, pw, confirmPw) {
  return !(!name || !email || !pw || !confirmPw);
}

/**
 * Validates email format
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmailFormat(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validates password length
 * @param {string} password
 * @returns {boolean}
 */
function isValidPasswordLength(password) {
  return password.length >= 6;
}

/**
 * Checks if passwords match
 * @param {string} pw
 * @param {string} confirmPw
 * @returns {boolean}
 */
function doPasswordsMatch(pw, confirmPw) {
  return pw === confirmPw;
}

/**
 * Gets error element for signup
 * @returns {HTMLElement}
 */
function getSignupErrorElement() {
  return $("error-sign-up");
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
  const errorElement = getSignupErrorElement();
  
  if (!areAllFieldsFilled(name, email, pw, confirmPw))
    return showError(errorElement, "Please fill out all fields.");
  if (!isValidEmailFormat(email))
    return showError(errorElement, "Invalid email.");
  if (!isValidPasswordLength(pw))
    return showError(errorElement, "Password must be at least 6 characters.");
  if (!doPasswordsMatch(pw, confirmPw))
    return showError(errorElement, "Passwords do not match.");
  if (!accepted)
    return showError(errorElement, "You must accept the privacy policy.");
  return true;
}

/**
 * Gets user name from form
 * @returns {string}
 */
function getUserNameFromForm() {
  return $("name").value.trim();
}

/**
 * Creates Firebase user account
 * @param {string} email
 * @param {string} password
 * @returns {Promise}
 */
function createFirebaseUser(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

/**
 * Updates user profile with display name
 * @param {Object} userCredential
 * @param {string} name
 * @returns {Promise}
 */
function updateUserProfile(userCredential, name) {
  return updateProfile(userCredential.user, { displayName: name });
}

/**
 * Shows success banner
 */
function showSuccessBanner() {
  $("layout").style.opacity = "0.5";
  $("slide-in-banner").classList.add("visible");
}

/**
 * Hides success banner
 */
function hideSuccessBanner() {
  $("slide-in-banner").classList.remove("visible");
  $("layout").style.opacity = "1";
}

/**
 * Resets form state after successful registration
 */
function resetFormAfterSuccess() {
  showLoginForm();
  $("confirm").classList.toggle("checked");
  $("sign-up-button").style.pointerEvents = "";
}

/**
 * Handles successful registration
 */
function handleRegistrationSuccess() {
  showSuccessBanner();
  setTimeout(() => {
    hideSuccessBanner();
    resetFormAfterSuccess();
  }, 1200);
}

/**
 * Handles registration error
 * @param {Error} err
 */
function handleRegistrationError(err) {
  showError(getSignupErrorElement(), err.message);
}

/**
 * Registers a new Firebase user and sets displayName.
 * Shows a success banner and switches back to login form.
 * @param {string} email
 * @param {string} password
 * @returns {void}
 */
function registerUser(email, password) {
  const name = getUserNameFromForm();
  createFirebaseUser(email, password)
    .then((userCredential) => updateUserProfile(userCredential, name))
    .then(handleRegistrationSuccess)
    .catch(handleRegistrationError);
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
 * Gets password toggle elements
 * @param {string} inputId
 * @param {string} toggleId
 * @returns {Object|null}
 */
function getPasswordToggleElements(inputId, toggleId) {
  const input = $(inputId);
  const toggle = $(toggleId);
  return (input && toggle) ? { input, toggle } : null;
}

/**
 * Creates toggle click handler
 * @param {HTMLElement} input
 * @param {HTMLElement} toggle
 * @param {Object} visibilityState
 * @returns {Function}
 */
function createToggleClickHandler(input, toggle, visibilityState) {
  return () => {
    visibilityState.isVisible = !visibilityState.isVisible;
    togglePasswordVisibility(input, toggle, visibilityState.isVisible);
  };
}

/**
 * Creates input change handler
 * @param {HTMLElement} input
 * @param {HTMLElement} toggle
 * @param {HTMLElement} errorBox
 * @returns {Function}
 */
function createInputChangeHandler(input, toggle, errorBox) {
  return () => resetPasswordField(input, toggle, errorBox);
}

/**
 * Sets up password field event handlers
 * @param {Object} elements
 * @param {HTMLElement} errorBox
 */
function setupPasswordFieldHandlers(elements, errorBox) {
  const { input, toggle } = elements;
  const visibilityState = { isVisible: false };
  
  toggle.onclick = createToggleClickHandler(input, toggle, visibilityState);
  input.oninput = createInputChangeHandler(input, toggle, errorBox);
  updatePasswordIcon(input, toggle, visibilityState.isVisible);
}

/**
 * Sets up toggle behavior for password fields.
 * @param {string} inputId
 * @param {string} toggleId
 * @param {HTMLElement} errorBox
 * @returns {void}
 */
function setupPasswordToggle(inputId, toggleId, errorBox) {
  const elements = getPasswordToggleElements(inputId, toggleId);
  if (!elements) return;
  setupPasswordFieldHandlers(elements, errorBox);
}

/**
 * Checks if input has value
 * @param {HTMLInputElement} input
 * @returns {boolean}
 */
function hasInputValue(input) {
  return !!input.value;
}

/**
 * Sets input type based on visibility
 * @param {HTMLInputElement} input
 * @param {boolean} visible
 */
function setInputType(input, visible) {
  input.type = visible ? "text" : "password";
}

/**
 * Toggles password field visibility.
 * @param {HTMLInputElement} input
 * @param {HTMLImageElement} toggle
 * @param {boolean} visible
 * @returns {void}
 */
function togglePasswordVisibility(input, toggle, visible) {
  if (!hasInputValue(input)) return;
  setInputType(input, visible);
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
 * Gets appropriate icon path based on state
 * @param {boolean} hasValue
 * @param {boolean} isVisible
 * @returns {string}
 */
function getIconPath(hasValue, isVisible) {
  if (!hasValue) return "./assets/icons/login/lock.svg";
  return isVisible 
    ? "./assets/icons/login/visibility.svg"
    : "./assets/icons/login/visibility_off.svg";
}

/**
 * Sets toggle icon source
 * @param {HTMLImageElement} toggle
 * @param {string} iconPath
 */
function setToggleIconSource(toggle, iconPath) {
  toggle.src = iconPath;
}

/**
 * Sets toggle cursor style
 * @param {HTMLImageElement} toggle
 * @param {boolean} hasValue
 */
function setToggleCursor(toggle, hasValue) {
  toggle.classList.toggle("cursor-pointer", hasValue);
}

/**
 * Updates the password toggle icon based on input state.
 * @param {HTMLInputElement} input
 * @param {HTMLImageElement} toggle
 * @param {boolean} isVisible
 * @returns {void}
 */
function updatePasswordIcon(input, toggle, isVisible) {
  const hasValue = hasInputValue(input);
  const iconPath = getIconPath(hasValue, isVisible);
  
  setToggleIconSource(toggle, iconPath);
  setToggleCursor(toggle, hasValue);
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