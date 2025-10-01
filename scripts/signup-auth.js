/**
 * @file signup-auth.js
 * @description Firebase authentication and signup processing
 */
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { auth } from "./firebase.js";
import { showError } from "./signup-validation.js";
import { showLoginForm } from "./signup-core.js";

/**
 * Gets signup form values
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
 */
function processSignupIfValid(values) {
  const { name, email, password, confirm, accepted } = values;
  if (!validateSignUpInputs(name, email, password, confirm, accepted)) return;
  registerUser(email, password);
  disableSignupButton();
}

/**
 * Handles sign-up button click
 */
function handleSignUp() {
  const values = getSignupFormValues();
  processSignupIfValid(values);
}

/**
 * Checks if all required fields are filled
 */
function areAllFieldsFilled(name, email, pw, confirmPw) {
  return !(!name || !email || !pw || !confirmPw);
}

/**
 * Validates email format
 */
function isValidEmailFormat(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validates password length
 */
function isValidPasswordLength(password) {
  return password.length >= 6;
}

/**
 * Checks if passwords match
 */
function doPasswordsMatch(pw, confirmPw) {
  return pw === confirmPw;
}

/**
 * Gets error element for signup
 */
function getSignupErrorElement() {
  return $("error-sign-up");
}

/**
 * Validates all sign-up inputs
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
 */
function getUserNameFromForm() {
  return $("name").value.trim();
}

/**
 * Creates Firebase user account
 */
function createFirebaseUser(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

/**
 * Updates user profile with display name
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
 */
function handleRegistrationError(err) {
  showError(getSignupErrorElement(), err.message);
}

/**
 * Registers a new Firebase user and sets displayName
 */
function registerUser(email, password) {
  const name = getUserNameFromForm();
  createFirebaseUser(email, password)
    .then((userCredential) => updateUserProfile(userCredential, name))
    .then(handleRegistrationSuccess)
    .catch(handleRegistrationError);
}

export { handleSignUp };