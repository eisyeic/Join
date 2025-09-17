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
 * Immediately invoked async function to initialize authentication UI.
 * 
 * - Injects a style to hide the `#person-icon-header-text` by default.
 * - Appends the style element to the document head.
 * - Calls and awaits `initAuthUI()` to set up authentication-related UI.
 * 
 * @async
 * @function
 * @returns {Promise<void>} Resolves once the auth UI has been initialized.
 */
(async () => {
  const style = document.createElement("style");
  style.textContent = `#person-icon-header-text { opacity: 0; }`;
  document.head.appendChild(style);
  await initAuthUI();
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
 * Hides profile navbar and removes listener
 * @param {HTMLElement} navbar - Profile navbar element
 */
function hideProfileNavbar(navbar) {
  navbar.classList.add("d-none");
  removeOutsideClickHandler();
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
 * Clears header UI and removes cached value
 * @param {HTMLElement} element - Header element
 */
function clearHeader(element) {
  localStorage.removeItem(HEADER_KEY);
  element.textContent = "";
  element.style.fontSize = "";
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
 * Applies initials to header element and caches them
 * @param {HTMLElement} element - Header element
 * @param {string} initials - Initials to apply
 */
function applyHeader(element, initials) {
  const previousText = element.textContent || "";
  
  if (previousText === initials) {
    element.style.opacity = "1";
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
 * Clears cached header initials and hides text visually
 */
window.clearHeaderTextCache = function () {
  localStorage.removeItem("headerTextCache");
  const element = $("person-icon-header-text");
  
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
 * Toggles header UI sections based on auth state
 * @param {boolean} isLoggedIn - Whether user is logged in
 */
function setHeaderUIForAuth(isLoggedIn) {
  const headerMenu = findHeaderMenu();
  const headerLogin = findHeaderLogin();
  
  if (headerMenu) {
    headerMenu.classList.toggle("d-none", !isLoggedIn);
  }
  if (headerLogin) {
    headerLogin.classList.toggle("d-none", isLoggedIn);
  }
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
 * Gets header element that holds initials
 * @returns {HTMLElement|null} Initials element
 */
function getInitialsEl() {
  return document.getElementById("person-icon-header-text");
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
  const element = getInitialsEl();
  if (user) {
    handleUserAuthenticated(user, element);
  } else {
    handleUserUnauthenticated(element);
  }
}

/**
 * Handles authenticated user state
 * @param {Object} user - User object
 * @param {HTMLElement} element - Initials element
 */
function handleUserAuthenticated(user, element) {
  window.updateUserInitials?.(user);
  if (element) element.style.opacity = "1";
  showAuthedNav();
}

/**
 * Handles unauthenticated user state
 * @param {HTMLElement} element - Initials element
 */
function handleUserUnauthenticated(element) {
  window.clearHeaderTextCache?.();
  resetInitials(element);
  showAnonNav();
  redirectIfNotPublic();
}

/**
 * Initializes Firebase Auth listener and wires UI
 */
async function initAuthUI() {
  try {
    const modules = await loadFirebaseModules();
    modules.onAuthStateChanged(modules.auth, handleAuthChange);
  } catch (err) {
    console.error("Auth initialization failed:", err);
    redirectIfNotPublic();
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
 * Signs out current user and redirects to index
 */
async function doLogout() {
  if (window.__loggingOut) return;
  window.__loggingOut = true;
  try {
    await performLogout();
  } catch (err) {
    console.error("Logout failed:", err);
  } finally {
    window.__loggingOut = false;
    location.replace("index.html");
  }
}

/**
 * Performs the actual logout process
 */
async function performLogout() {
  const modules = await loadLogoutModules();
  hideProfileNavbar($("profile-navbar"));
  window.clearHeaderTextCache?.();
  await modules.signOut(modules.auth);
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
 * Attaches global click handler for logout links
 */
(function attachLogoutListener() {
  if (window.__logoutListenerAttached) return;
  window.__logoutListenerAttached = true;
  document.addEventListener("click", handleLogoutClick);
}());

/**
 * Handles logout click events
 * @param {Event} e - Click event
 */
function handleLogoutClick(e) {
  const element = e.target.closest("[data-logout]");
  if (!element) return;
  e.preventDefault();
  doLogout();
};