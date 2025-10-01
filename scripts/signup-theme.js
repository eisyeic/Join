/**
 * @file signup-theme.js
 * @description Theme management and UI display logic for signup
 */
import { getCurrentMode } from "./signup-core.js";

/**
 * Sets layout background classes
 */
function setLayoutBackground(isWhite) {
  $("layout").classList.toggle("bg-white", isWhite);
  $("layout").classList.toggle("bg-blue", !isWhite);
}

/**
 * Sets logo visibility based on theme
 */
function setLogoVisibility(isWhite) {
  $("logo-white").style.opacity = isWhite ? "0" : "1";
  $("logo-blue").style.opacity = isWhite ? "1" : "0";
}

/**
 * Switches between white and blue theme and updates sign-up box visibility
 */
function setThemeWhite(isWhite) {
  setLayoutBackground(isWhite);
  setLogoVisibility(isWhite);
  updateSignUpBoxDisplay();
}

/**
 * Gets signup box elements
 */
function getSignupBoxElements() {
  return {
    topRight: $("sign-up-top-right-box"),
    bottomMobile: $("sign-up-bottom-box-mobile")
  };
}

/**
 * Checks if elements are valid for display update
 */
function areSignupBoxElementsValid(elements) {
  return elements.topRight !== null;
}

/**
 * Checks if current mode is signup
 */
function isSignupMode() {
  return getCurrentMode() === "signup";
}

/**
 * Checks if viewport is mobile
 */
function isMobileViewport() {
  return window.innerWidth <= 720;
}

/**
 * Hides both signup boxes
 */
function hideBothSignupBoxes(elements) {
  elements.topRight.classList.add("d-none");
  elements.bottomMobile?.classList.add("d-none");
}

/**
 * Shows mobile signup box and hides desktop
 */
function showMobileHideDesktop(elements) {
  elements.topRight.classList.add("d-none");
  elements.bottomMobile?.classList.remove("d-none");
}

/**
 * Shows desktop signup box and hides mobile
 */
function showDesktopHideMobile(elements) {
  elements.topRight.classList.remove("d-none");
  elements.bottomMobile?.classList.add("d-none");
}

/**
 * Updates signup boxes for login mode
 */
function updateSignupBoxesForLogin(elements) {
  if (isMobileViewport()) {
    showMobileHideDesktop(elements);
  } else {
    showDesktopHideMobile(elements);
  }
}

/**
 * Updates visibility of sign-up boxes based on mode and viewport width
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

export { setThemeWhite, updateSignUpBoxDisplay };