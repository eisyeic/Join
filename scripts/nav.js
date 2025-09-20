/**
 * Toggles profile dropdown visibility and manages click handlers
 */
function toggleProfileNavbar() {
  const profileNavbar = getProfileNavbar();
  if (!profileNavbar) return;
  toggleNavbarVisibility(profileNavbar);
  manageClickHandlers(profileNavbar);
}

/**
 * Gets profile navbar element
 * @returns {HTMLElement|null} Profile navbar element
 */
function getProfileNavbar() {
  return $("profile-navbar");
}

/**
 * Toggles navbar visibility
 * @param {HTMLElement} navbar - Profile navbar element
 */
function toggleNavbarVisibility(navbar) {
  navbar.classList.toggle("d-none");
}

/**
 * Manages click handlers based on navbar visibility
 * @param {HTMLElement} navbar - Profile navbar element
 */
function manageClickHandlers(navbar) {
  if (isProfileNavbarVisible(navbar)) {
    setupOutsideClickHandler();
  } else {
    removeOutsideClickHandler();
  }
}

/**
 * Checks if profile navbar is visible
 * @param {HTMLElement} navbar - Profile navbar element
 * @returns {boolean} True if visible
 */
function isProfileNavbarVisible(navbar) {
  return !navbar.classList.contains("d-none");
}

/**
 * Sets up outside click handler with delay
 */
function setupOutsideClickHandler() {
  setTimeout(() => document.addEventListener("click", closeProfileNavbar), 0);
}

/**
 * Redirects to index if page is not public
 */
function redirectIfNotPublic() {
  if (!isPublicPage()) {
    location.replace("index.html");
  }
}

/**
 * Removes outside click handler
 */
function removeOutsideClickHandler() {
  document.removeEventListener("click", closeProfileNavbar);
}

/**
 * Toggles d-none class on element
 * @param {HTMLElement} element - Element to toggle
 * @param {boolean} hidden - Whether to hide element
 */
function toggleHidden(element, hidden) {
  element?.classList.toggle("d-none", hidden);
}

/**
 * Shows navigation for authenticated users
 */
function showAuthedNav() {
  const navElements = getNavigationElements();
  toggleNavigationVisibility(navElements, true);
}

/**
 * Shows navigation for anonymous users
 */
function showAnonNav() {
  const navElements = getNavigationElements();
  toggleNavigationVisibility(navElements, false);
}

/**
 * Closes profile dropdown when clicking outside
 * @param {Event} ev - Click event
 */
function closeProfileNavbar(ev) {
  if (!ev) return;
  
  const profileNavbar = getProfileNavbar();
  if (!profileNavbar) return;
  
  if (shouldCloseOnClick(ev, profileNavbar)) {
    hideProfileNavbar(profileNavbar);
  }
}

/**
 * Determines if navbar should close based on click event
 * @param {Event} ev - Click event
 * @param {HTMLElement} navbar - Profile navbar element
 * @returns {boolean} True if should close
 */
function shouldCloseOnClick(ev, navbar) {
  const toggle = findProfileToggle();
  const target = ev.target;
  return shouldCloseNavbar(navbar, toggle, target);
}

/**
 * Toggles navigation visibility
 * @param {Object} elements - Navigation elements
 * @param {boolean} showNav - Whether to show navigation
 */
function toggleNavigationVisibility(elements, showNav) {
  elements.nav?.classList.toggle("d-none", !showNav);
  elements.navBox?.classList.toggle("d-none", !showNav);
  elements.navLoginBox?.classList.toggle("d-none", showNav);
  elements.navLoginBoxMobile?.classList.toggle("d-none", showNav);
}

/**
 * Gets navigation elements
 * @returns {Object} Navigation elements
 */
function getNavigationElements() {
  return {
    nav: document.querySelector(".nav"),
    navBox: document.querySelector(".nav-box"),
    navLoginBox: document.querySelector(".nav-login-box"),
    navLoginBoxMobile: document.querySelector(".nav-login-box-mobile")
  };
}

/**
 * Shows/hides navigation UI based on authentication
 * @param {Object|null} user - User object or null
 */
function applyHeaderNavByAuth(user) {
  const showNav = determineNavVisibility(user);
  const navElements = getNavigationElements();
  toggleNavigationVisibility(navElements, showNav);
}

/**
 * Determines navigation visibility based on user
 * @param {Object|null} user - User object or null
 * @returns {boolean} True if navigation should be visible
 */
function determineNavVisibility(user) {
  return !!user;
}