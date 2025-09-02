/**
 * Shorthand for document.getElementById.
 * @param {string} id
 * @returns {HTMLElement|null}
 */
let $ = (id) => document.getElementById(id);

/**
 * Toggle the profile dropdown visibility and bind/unbind outside click handler.
 * @returns {void}
 */
function toggleProfileNavbar() {
  const profileNavbar = $("profile-navbar");
  if (!profileNavbar) return;
  profileNavbar.classList.toggle("d-none");
  if (!profileNavbar.classList.contains("d-none")) {
    setTimeout(() => document.addEventListener("click", closeProfileNavbar), 0);
  } else {
    document.removeEventListener("click", closeProfileNavbar);
  }
}

/**
 * Close the profile dropdown when clicking outside of it or its toggle.
 * @param {MouseEvent} ev
 * @returns {void}
 */
function closeProfileNavbar(ev) {
  if (!ev) return;
  const profileNavbar = $("profile-navbar");
  if (!profileNavbar) return;
  const toggle = document.getElementById("profile-toggle") || document.querySelector("[data-profile-toggle]") || document.querySelector('img[alt="Guest Icon"]');
  const target = ev.target;
  const inside = profileNavbar.contains(target);
  const onToggle = toggle && (toggle === target || toggle.contains(target));
  if (!inside && !onToggle) {
    profileNavbar.classList.add("d-none");
    document.removeEventListener("click", closeProfileNavbar);
  }
}

/**
 * Initialize header initials opacity and restore cached value on DOMContentLoaded.
 * @returns {void}
 */
(() => {
  const style = document.createElement("style");
  style.textContent = `#person-icon-header-text { opacity: 0; }`;
  document.head.appendChild(style);
  document.addEventListener("DOMContentLoaded", () => {
    const cached = JSON.parse(localStorage.getItem("headerTextCache") || "null");
    const el = $("person-icon-header-text");
    if (!el) return;
    if (cached) {
      el.textContent = cached.text;
      el.style.fontSize = cached.fontSize;
    } else {
      el.textContent = "";
      el.style.fontSize = "";
    }
  });
})();

/** @typedef {{displayName?: string, email?: string}} User */

/** LocalStorage key for caching header text. */
 /** @type {string} */
const HEADER_KEY = "headerTextCache";

/** DOM id of the header initials element. */
 /** @type {string} */
const HEADER_EL_ID = "person-icon-header-text";

/**
 * Get the header element that displays the user's initials.
 * @returns {HTMLElement|null} The header element or null if not found.
 */
function getHeaderEl() {
  return document.getElementById(HEADER_EL_ID);
}

/**
 * Build a base string to derive initials from (name > email local-part).
 * @param {User} user - The authenticated user object.
 * @returns {string} Display name or email local-part; empty string if none.
 */
function getUserBase(user) {
  const name = (user.displayName || "").trim();
  if (name) return name;
  const email = user.email || "";
  return email.split("@")[0] || "";
}

/**
 * Split a base string into alphanumeric name parts (Unicode-aware).
 * @param {string} base - Source string for name parsing.
 * @returns {string[]} Non-empty parts.
 */
function nameParts(base) {
  return base.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}

/**
 * Compute initials from name parts (first letters of first two parts).
 * @param {string[]} parts - Parsed name parts.
 * @returns {string} Uppercased initials or empty string.
 */
function initialsFromParts(parts) {
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return "";
}

/**
 * Clear the header UI and remove any cached value.
 * @param {HTMLElement} el - Header target element.
 * @returns {void}
 */
function clearHeader(el) {
  localStorage.removeItem(HEADER_KEY);
  el.textContent = "";
  el.style.fontSize = "";
}

/**
 * Determine font size for the initials.
 * @param {string} initials - Computed initials.
 * @returns {string} CSS font-size value.
 */
function fontSizeForInitials(initials) {
  return initials.length === 2 ? "22px" : "30px";
}

/**
 * Apply initials to the header element and cache them.
 * @param {HTMLElement} el - Header target element.
 * @param {string} initials - Computed initials to display.
 * @returns {void}
 */
function applyHeader(el, initials) {
  const fontSize = fontSizeForInitials(initials);
  localStorage.setItem(HEADER_KEY, JSON.stringify({ text: initials, fontSize }));
  el.textContent = initials;
  el.style.fontSize = fontSize;
  el.style.opacity = "1";
}

/**
 * Update the header with the user's initials (or clear if not derivable).
 * Side effects: touches DOM and localStorage.
 * @param {User|null|undefined} user - Current user.
 * @returns {void}
 */
window.updateUserInitials = function (user) {
  if (!user) return;
  const el = getHeaderEl();
  if (!el) return;
  const base = getUserBase(user);
  const initials = initialsFromParts(nameParts(base));
  if (!initials) return clearHeader(el);
  applyHeader(el, initials);
};

/**
 * Clear cached header initials and hide the text visually.
 * @returns {void}
 */
window.clearHeaderTextCache = function () {
  localStorage.removeItem("headerTextCache");
  const el = $("person-icon-header-text");
  if (el) {
    el.textContent = "";
    el.style.fontSize = "";
    el.style.opacity = "0";
  }
};

/**
 * Toggle header UI sections based on auth state.
 * @param {boolean} isLoggedIn
 * @returns {void}
 */
function setHeaderUIForAuth(isLoggedIn) {
  const headerMenu = document.querySelector("[data-role='header-menu']") || document.querySelector("#header-menu") || document.querySelector("#person-icon-header");
  const headerLogin = document.querySelector("[data-role='header-login']") || document.querySelector("#header-login");
  if (headerMenu) headerMenu.classList.toggle("d-none", !isLoggedIn);
  if (headerLogin) headerLogin.classList.toggle("d-none", isLoggedIn);
}

const FIREBASE_MODULE_PATH = "./scripts/firebase.js";
const REDIRECT = "index.html";

/**
 * Determine whether the current page is public (no auth required).
 * @returns {boolean}
 */
function isPublicPage() {
  const p = location.pathname.replace(/\/+$/, "").toLowerCase();
  return /(?:^|\/)(index|privacy-policy|legal-notice|help)(?:\.html)?$/.test(p) || p === "";
}

/** @typedef {{ displayName?: string, email?: string }} User */

/** Query single element helper. */
/// @param {string} sel
/// @returns {Element|null}
function qs(sel) { return document.querySelector(sel); }

/**
 * Get the header element that holds the initials.
 * @returns {HTMLElement|null}
 */
function getInitialsEl() {
  return document.getElementById("person-icon-header-text");
}

/**
 * Toggle .d-none on an element.
 * @param {Element|null} el
 * @param {boolean} hidden
 * @returns {void}
 */
function toggleHidden(el, hidden) {
  el?.classList.toggle("d-none", hidden);
}

/**
 * Show navigation for authenticated users.
 * @returns {void}
 */
function showAuthedNav() {
  toggleHidden(qs(".nav"), false);
  toggleHidden(qs(".nav-box"), false);
  toggleHidden(qs(".nav-login-box"), true);
  toggleHidden(qs(".nav-login-box-mobile"), true);
}

/**
 * Show navigation for anonymous users.
 * @returns {void}
 */
function showAnonNav() {
  toggleHidden(qs(".nav"), true);
  toggleHidden(qs(".nav-box"), true);
  toggleHidden(qs(".nav-login-box"), false);
  toggleHidden(qs(".nav-login-box-mobile"), false);
}

/**
 * Clear initials UI (and leave cache clearing to external helper).
 * @param {HTMLElement|null} el
 * @returns {void}
 */
function resetInitials(el) {
  if (!el) return;
  el.textContent = "";
  el.style.fontSize = "";
  el.style.opacity = "0";
}

/**
 * Redirect to index if the page is not public.
 * @returns {void}
 */
function redirectIfNotPublic() {
  if (typeof isPublicPage === "function" && !isPublicPage()) {
    location.replace("index.html");
  }
}

/**
 * Handle Firebase auth state changes and update UI.
 * @param {User|null} user
 * @returns {void}
 */
function handleAuthChange(user) {
  const el = getInitialsEl();
  if (user) {
    window.updateUserInitials?.(user);
    if (el) el.style.opacity = "1";
    showAuthedNav();
    return;
  }
  window.clearHeaderTextCache?.();
  resetInitials(el);
  showAnonNav();
  redirectIfNotPublic();
}

/**
 * Initialize Firebase Auth listener and wire the UI.
 * @returns {Promise<void>}
 */
async function initAuthUI() {
  try {
    const [{ auth }, { onAuthStateChanged }] = await Promise.all([
      import(FIREBASE_MODULE_PATH),
      import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js"),
    ]);
    onAuthStateChanged(auth, handleAuthChange);
  } catch (err) {
    console.error("Auth initialization failed:", err);
    redirectIfNotPublic();
  }
}

// Kick off on load (kept as IIFE like your original)
(async () => { await initAuthUI(); })();


/**
 * Check if current page is index.html.
 * @returns {boolean}
 */
function isIndexPage() {
  const p = location.pathname.toLowerCase();
  return p === "/" || p.endsWith("/index.html");
}

/**
 * Get the header initials element.
 * @returns {HTMLElement|null}
 */
function getHeaderEl() {
  return document.getElementById("person-icon-header-text");
}

/**
 * Handle UI when user is authenticated.
 * @param {any} user
 * @returns {void}
 */
function onUserAuthenticated(user) {
  applyHeaderNavByAuth?.(user);
  window.updateUserInitials?.(user);
  const el = getHeaderEl();
  if (el) el.style.opacity = "1";
}

/**
 * Handle UI when no user is authenticated.
 * @returns {void}
 */
function onUserUnauthenticated() {
  applyHeaderNavByAuth?.(null);
  localStorage.removeItem("headerTextCache");
  const el = getHeaderEl();
  if (el) {
    el.textContent = "";
    el.style.fontSize = "";
    el.style.opacity = "0";
  }
  if (!isPublicPage()) location.replace("index.html");
}

/**
 * onAuthStateChanged callback wrapper.
 * @param {any|null} user
 * @returns {void}
 */
function handleAuthStateChange(user) {
  if (user) {
    onUserAuthenticated(user);
    return;
  }
  onUserUnauthenticated();
}

/**
 * Initialize auth state listener to apply header nav state.
 * @returns {void}
 */
(async () => {
  try {
    const [{ auth }, { onAuthStateChanged }] = await Promise.all([
      import(FIREBASE_MODULE_PATH),
      import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js"),
    ]);
    onAuthStateChanged(auth, handleAuthStateChange);
  } catch (err) {
    console.error("Auth initialization failed:", err);
  }
})();


/**
 * Sign out the current user and redirect to index.
 * @returns {Promise<void>}
 */
async function doLogout() {
  if (window.__loggingOut) return;
  window.__loggingOut = true;
  try {
    const [{ auth }, { signOut }] = await Promise.all([import(FIREBASE_MODULE_PATH), import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js")]);
    document.getElementById("profile-navbar")?.classList.add("d-none");
    window.clearHeaderTextCache?.();
    await signOut(auth);
  } catch (err) {
    console.error("Logout failed:", err);
  } finally {
    window.__loggingOut = false;
    location.replace("index.html");
  }
}

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-logout]");
  if (!el) return;
  e.preventDefault();
  doLogout();
});

/**
 * Attach a global click handler to trigger logout links with data-logout.
 * @returns {void}
 */
function attachLogoutListener() {
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-logout]");
    if (!el) return;
    e.preventDefault();
    doLogout();
  });
}
attachLogoutListener();

/**
 * Show/hide navigation UI depending on authentication.
 * @param {unknown} user
 * @returns {void}
 */
function applyHeaderNavByAuth(user) {
  const showNav = !!user;
  const nav = document.querySelector(".nav");
  const navBox = document.querySelector(".nav-box");
  const navLoginBox = document.querySelector(".nav-login-box");
  const navLoginBoxMobile = document.querySelector(".nav-login-box-mobile");
  nav?.classList.toggle("d-none", !showNav);
  navBox?.classList.toggle("d-none", !showNav);
  navLoginBox?.classList.toggle("d-none", showNav);
  navLoginBoxMobile?.classList.toggle("d-none", showNav);
}
