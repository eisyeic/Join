/**
 * Toggles profile dropdown visibility and manages click handlers
 */
function toggleProfileNavbar() {
  const profileNavbar = $("profile-navbar");
  if (!profileNavbar) return;
  profileNavbar.classList.toggle("d-none");
  if (isProfileNavbarVisible(profileNavbar)) {
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
  toggleHidden(qs(".nav"), false);
  toggleHidden(qs(".nav-box"), false);
  toggleHidden(qs(".nav-login-box"), true);
  toggleHidden(qs(".nav-login-box-mobile"), true);
}

/**
 * Shows navigation for anonymous users
 */
function showAnonNav() {
  toggleHidden(qs(".nav"), true);
  toggleHidden(qs(".nav-box"), true);
  toggleHidden(qs(".nav-login-box"), false);
  toggleHidden(qs(".nav-login-box-mobile"), false);
}

/**
 * Closes profile dropdown when clicking outside
 * @param {Event} ev - Click event
 */
function closeProfileNavbar(ev) {
  if (!ev) return;
  
  const profileNavbar = $("profile-navbar");
  if (!profileNavbar) return;
  
  const toggle = findProfileToggle();
  const target = ev.target;
  
  if (shouldCloseNavbar(profileNavbar, toggle, target)) {
    hideProfileNavbar(profileNavbar);
  }
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
  const showNav = !!user;
  const navElements = getNavigationElements();
  toggleNavigationVisibility(navElements, showNav);
}