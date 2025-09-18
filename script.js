// Variables
const HEADER_KEY = "headerTextCache";
const HEADER_EL_ID = "person-icon-header-text";
const FIREBASE_MODULE_PATH = "./scripts/firebase.js";
const REDIRECT = "index.html";

/**
 * Shorthand for document.getElementById
 * @param {string} id - Element ID
 * @returns {HTMLElement|null} Element or null
 */
let $ = (id) => document.getElementById(id);

/**
 * Creates style element for hiding header text
 * @returns {HTMLStyleElement} Style element
 */
function createHeaderHideStyle() {
  const style = document.createElement("style");
  style.textContent = `#person-icon-header-text { opacity: 0; }`;
  return style;
}

/**
 * Injects style to document head
 * @param {HTMLStyleElement} style - Style element to inject
 */
function injectStyle(style) {
  document.head.appendChild(style);
}

/**
 * Initializes the application
 */
async function initializeApp() {
  const style = createHeaderHideStyle();
  injectStyle(style);
  await initAuthUI();
}

// Initialize the application
(async () => {
  await initializeApp();
})();

/**
 * Finds profile toggle element
 * @returns {HTMLElement|null} Toggle element
 */
function findProfileToggle() {
  return document.getElementById("profile-toggle") || 
         document.querySelector("[data-profile-toggle]") || 
         document.querySelector('img[alt="Guest Icon"]');
}

/**
 * Determines if navbar should be closed
 * @param {HTMLElement} navbar - Profile navbar
 * @param {HTMLElement} toggle - Toggle element
 * @param {HTMLElement} target - Click target
 * @returns {boolean} True if should close
 */
function shouldCloseNavbar(navbar, toggle, target) {
  const inside = navbar.contains(target);
  const onToggle = toggle && (toggle === target || toggle.contains(target));
  return !inside && !onToggle;
}

/**
 * Hides profile navbar
 * @param {HTMLElement} navbar - Profile navbar element
 */
function hideProfileNavbar(navbar) {
  navbar.classList.add("d-none");
}

/**
 * Removes outside click handler
 */
function removeOutsideClickHandler() {
  // Implementation depends on how the handler was attached
}

/**
 * Gets header element that displays user initials
 * @returns {HTMLElement|null} Header element
 */
function getHeaderEl() {
  return document.getElementById(HEADER_EL_ID);
}

/**
 * Builds base string to derive initials from
 * @param {Object} user - User object
 * @returns {string} Base string for initials
 */
function getUserBase(user) {
  const name = (user.displayName || "").trim();
  if (name) return name;
  
  const email = user.email || "";
  return email.split("@")[0] || "";
}

/**
 * Splits base string into alphanumeric name parts
 * @param {string} base - Base string
 * @returns {Array} Array of name parts
 */
function nameParts(base) {
  return base.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}

/**
 * Computes initials from name parts
 * @param {Array} parts - Name parts array
 * @returns {string} Computed initials
 */
function initialsFromParts(parts) {
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  if (parts.length === 1) {
    return parts[0][0].toUpperCase();
  }
  return "";
}

/**
 * Removes cached header value
 */
function removeCachedHeader() {
  localStorage.removeItem(HEADER_KEY);
}

/**
 * Clears header element content
 * @param {HTMLElement} element - Header element
 */
function clearHeaderElement(element) {
  element.textContent = "";
  element.style.fontSize = "";
}

/**
 * Clears header UI and removes cached value
 * @param {HTMLElement} element - Header element
 */
function clearHeader(element) {
  removeCachedHeader();
  clearHeaderElement(element);
}

/**
 * Determines font size for initials
 * @param {string} initials - Initials string
 * @returns {string} Font size value
 */
function fontSizeForInitials(initials) {
  return initials.length === 2 ? "22px" : "30px";
}

/**
 * Shows header element
 * @param {HTMLElement} element - Header element
 */
function showHeaderElement(element) {
  element.style.opacity = "1";
}

/**
 * Checks if initials are already displayed
 * @param {HTMLElement} element - Header element
 * @param {string} initials - Initials to check
 * @returns {boolean} True if already displayed
 */
function areInitialsAlreadyDisplayed(element, initials) {
  return (element.textContent || "") === initials;
}

/**
 * Applies initials to header element and caches them
 * @param {HTMLElement} element - Header element
 * @param {string} initials - Initials to apply
 */
function applyHeader(element, initials) {
  if (areInitialsAlreadyDisplayed(element, initials)) {
    showHeaderElement(element);
    return;
  }
  
  cacheInitials(initials);
  setInitialsInElement(element, initials);
}

/**
 * Caches initials in localStorage
 * @param {string} initials - Initials to cache
 */
function cacheInitials(initials) {
  localStorage.setItem(HEADER_KEY, JSON.stringify({ text: initials }));
}

/**
 * Sets initials in element and makes visible
 * @param {HTMLElement} element - Header element
 * @param {string} initials - Initials to set
 */
function setInitialsInElement(element, initials) {
  element.textContent = initials;
  element.style.opacity = "1";
}


/**
 * Updates header with user initials or clears if not derivable
 * @param {Object} user - User object
 */
window.updateUserInitials = function (user) {
  if (!user) return;
  
  const element = getHeaderEl();
  if (!element) return;
  
  const base = getUserBase(user);
  const initials = initialsFromParts(nameParts(base));
  
  if (!initials) {
    clearHeader(element);
    return;
  }
  
  applyHeader(element, initials);
};

/**
 * Gets header text element by ID
 * @returns {HTMLElement|null} Header text element
 */
function getHeaderTextElement() {
  return $("person-icon-header-text");
}

/**
 * Clears cached header initials and hides text visually
 */
window.clearHeaderTextCache = function () {
  removeCachedHeader();
  const element = getHeaderTextElement();
  
  if (element) {
    resetHeaderElement(element);
  }
};

/**
 * Resets header element to initial state
 * @param {HTMLElement} element - Header element
 */
function resetHeaderElement(element) {
  element.textContent = "";
  element.style.fontSize = "";
  element.style.opacity = "0";
}

/**
 * Shows or hides header menu
 * @param {boolean} show - Whether to show menu
 */
function toggleHeaderMenu(show) {
  const headerMenu = findHeaderMenu();
  if (headerMenu) {
    headerMenu.classList.toggle("d-none", !show);
  }
}

/**
 * Shows or hides header login
 * @param {boolean} show - Whether to show login
 */
function toggleHeaderLogin(show) {
  const headerLogin = findHeaderLogin();
  if (headerLogin) {
    headerLogin.classList.toggle("d-none", !show);
  }
}

/**
 * Toggles header UI sections based on auth state
 * @param {boolean} isLoggedIn - Whether user is logged in
 */
function setHeaderUIForAuth(isLoggedIn) {
  toggleHeaderMenu(isLoggedIn);
  toggleHeaderLogin(!isLoggedIn);
}

/**
 * Finds header menu element
 * @returns {HTMLElement|null} Header menu element
 */
function findHeaderMenu() {
  return document.querySelector("[data-role='header-menu']") ||
         document.querySelector("#header-menu") ||
         document.querySelector("#person-icon-header");
}

/**
 * Finds header login element
 * @returns {HTMLElement|null} Header login element
 */
function findHeaderLogin() {
  return document.querySelector("[data-role='header-login']") ||
         document.querySelector("#header-login");
}

/**
 * Determines whether current page is public (no auth required)
 * @returns {boolean} True if public page
 */
function isPublicPage() {
  const path = location.pathname.replace(/\/+$/, "").toLowerCase();
  const publicPagePattern = /(?:^|\/)(?:index|privacy-policy|legal-notice|help)(?:\.html)?$/;
  return publicPagePattern.test(path) || path === "";
}

/**
 * Query single element helper
 * @param {string} selector - CSS selector
 * @returns {HTMLElement|null} Element or null
 */
function qs(selector) {
  return document.querySelector(selector);
}



/**
 * Clears initials UI
 * @param {HTMLElement} element - Initials element
 */
function resetInitials(element) {
  if (!element) return;
  
  element.textContent = "";
  element.style.fontSize = "";
  element.style.opacity = "0";
}

/**
 * Handles Firebase auth state changes and updates UI
 * @param {Object|null} user - User object or null
 */
function handleAuthChange(user) {
  const element = getHeaderEl();
  if (user) {
    handleUserAuthenticated(user, element);
  } else {
    handleUserUnauthenticated(element);
  }
}

/**
 * Updates user initials in UI
 * @param {Object} user - User object
 */
function updateUserInitialsInUI(user) {
  window.updateUserInitials?.(user);
}

/**
 * Shows authenticated navigation
 */
function showAuthedNav() {
  setHeaderUIForAuth(true);
}

/**
 * Shows element with opacity
 * @param {HTMLElement} element - Element to show
 */
function showElement(element) {
  if (element) element.style.opacity = "1";
}

/**
 * Handles authenticated user state
 * @param {Object} user - User object
 * @param {HTMLElement} element - Initials element
 */
function handleUserAuthenticated(user, element) {
  updateUserInitialsInUI(user);
  showElement(element);
  showAuthedNav();
}

/**
 * Clears user data from UI
 */
function clearUserDataFromUI() {
  window.clearHeaderTextCache?.();
}

/**
 * Shows anonymous navigation
 */
function showAnonNav() {
  setHeaderUIForAuth(false);
}

/**
 * Redirects if not on public page
 */
function redirectIfNotPublic() {
  if (!isPublicPage()) {
    location.replace(REDIRECT);
  }
}

/**
 * Handles unauthenticated user state
 * @param {HTMLElement} element - Initials element
 */
function handleUserUnauthenticated(element) {
  clearUserDataFromUI();
  resetInitials(element);
  showAnonNav();
  redirectIfNotPublic();
}

/**
 * Sets up Firebase auth state listener
 * @param {Object} modules - Firebase modules
 */
function setupAuthStateListener(modules) {
  modules.onAuthStateChanged(modules.auth, handleAuthChange);
}

/**
 * Handles auth initialization error
 * @param {Error} err - Error object
 */
function handleAuthInitError(err) {
  console.error("Auth initialization failed:", err);
  redirectIfNotPublic();
}

/**
 * Initializes Firebase Auth listener and wires UI
 */
async function initAuthUI() {
  try {
    const modules = await loadFirebaseModules();
    setupAuthStateListener(modules);
  } catch (err) {
    handleAuthInitError(err);
  }
}

/**
 * Loads Firebase modules
 * @returns {Object} Firebase modules
 */
async function loadFirebaseModules() {
  const [{ auth }, { onAuthStateChanged }] = await Promise.all([
    import(FIREBASE_MODULE_PATH),
    import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js"),
  ]);
  return { auth, onAuthStateChanged };
}


/**
 * Checks if logout is in progress
 * @returns {boolean} True if logout in progress
 */
function isLogoutInProgress() {
  return window.__loggingOut;
}

/**
 * Sets logout in progress flag
 * @param {boolean} inProgress - Whether logout is in progress
 */
function setLogoutInProgress(inProgress) {
  window.__loggingOut = inProgress;
}

/**
 * Redirects to index page
 */
function redirectToIndex() {
  location.replace("index.html");
}

/**
 * Handles logout error
 * @param {Error} err - Error object
 */
function handleLogoutError(err) {
  console.error("Logout failed:", err);
}

/**
 * Signs out current user and redirects to index
 */
async function doLogout() {
  if (isLogoutInProgress()) return;
  setLogoutInProgress(true);
  try {
    await performLogout();
  } catch (err) {
    handleLogoutError(err);
  } finally {
    setLogoutInProgress(false);
    redirectToIndex();
  }
}

/**
 * Hides profile navbar by ID
 */
function hideProfileNavbarById() {
  const navbar = $("profile-navbar");
  if (navbar) {
    hideProfileNavbar(navbar);
  }
}

/**
 * Signs out from Firebase
 * @param {Object} modules - Firebase modules
 */
async function signOutFromFirebase(modules) {
  await modules.signOut(modules.auth);
}

/**
 * Performs the actual logout process
 */
async function performLogout() {
  const modules = await loadLogoutModules();
  hideProfileNavbarById();
  clearUserDataFromUI();
  await signOutFromFirebase(modules);
}

/**
 * Loads modules needed for logout
 * @returns {Object} Logout modules
 */
async function loadLogoutModules() {
  const [{ auth }, { signOut }] = await Promise.all([
    import(FIREBASE_MODULE_PATH),
    import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js")
  ]);
  return { auth, signOut };
}

/**
 * Checks if logout listener is already attached
 * @returns {boolean} True if already attached
 */
function isLogoutListenerAttached() {
  return window.__logoutListenerAttached;
}

/**
 * Marks logout listener as attached
 */
function markLogoutListenerAttached() {
  window.__logoutListenerAttached = true;
}

/**
 * Adds logout click event listener
 */
function addLogoutClickListener() {
  document.addEventListener("click", handleLogoutClick);
}

/**
 * Attaches global click handler for logout links
 */
function attachLogoutListener() {
  if (isLogoutListenerAttached()) return;
  markLogoutListenerAttached();
  addLogoutClickListener();
}

// Attach logout listener
attachLogoutListener();

/**
 * Finds logout element from event target
 * @param {Event} e - Click event
 * @returns {HTMLElement|null} Logout element or null
 */
function findLogoutElement(e) {
  return e.target.closest("[data-logout]");
}

/**
 * Prevents default event behavior
 * @param {Event} e - Event to prevent
 */
function preventDefault(e) {
  e.preventDefault();
}

/**
 * Handles logout click events
 * @param {Event} e - Click event
 */
function handleLogoutClick(e) {
  const element = findLogoutElement(e);
  if (!element) return;
  preventDefault(e);
  doLogout();
}