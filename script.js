// Shorthand for document.getElementById
let $ = (id) => document.getElementById(id);

// Toggle the profile dropdown visibility and bind/unbind outside click handler
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

// Close the profile dropdown when clicking outside of it or its toggle
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

// Initialize header initials opacity and restore cached value on DOMContentLoaded
(() => {
  const style = document.createElement("style");
  style.textContent = `#person-icon-header-text { opacity: 0; }`;
  document.head.appendChild(style);
})();

// User type definition

// LocalStorage key for caching header text
const HEADER_KEY = "headerTextCache";

// DOM id of the header initials element
const HEADER_EL_ID = "person-icon-header-text";

// Get the header element that displays the user's initials
function getHeaderEl() {
  return document.getElementById(HEADER_EL_ID);
}

// Build a base string to derive initials from (name > email local-part)
function getUserBase(user) {
  const name = (user.displayName || "").trim();
  if (name) return name;
  const email = user.email || "";
  return email.split("@")[0] || "";
}

// Split a base string into alphanumeric name parts (Unicode-aware)
function nameParts(base) {
  return base.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}

// Compute initials from name parts (first letters of first two parts)
function initialsFromParts(parts) {
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return "";
}

// Clear the header UI and remove any cached value
function clearHeader(el) {
  localStorage.removeItem(HEADER_KEY);
  el.textContent = "";
  el.style.fontSize = "";
}

// Determine font size for the initials
function fontSizeForInitials(initials) {
  return initials.length === 2 ? "22px" : "30px";
}

// Apply initials to the header element and cache them
function applyHeader(el, initials) {
  const prevText = el.textContent || "";

  if (prevText === initials ) {
    // schon gesetzt – nur sicherstellen, dass es sichtbar ist
    el.style.opacity = "1";
    return;
  }
  localStorage.setItem(HEADER_KEY, JSON.stringify({ text: initials }));
  el.textContent = initials;
  el.style.opacity = "1";
}


// Update the header with the user's initials (or clear if not derivable)
window.updateUserInitials = function (user) {
  if (!user) return;
  const el = getHeaderEl();
  if (!el) return;
  const base = getUserBase(user);
  const initials = initialsFromParts(nameParts(base));
  if (!initials) return clearHeader(el);
  applyHeader(el, initials);
};

// Clear cached header initials and hide the text visually
window.clearHeaderTextCache = function () {
  localStorage.removeItem("headerTextCache");
  const el = $("person-icon-header-text");
  if (el) {
    el.textContent = "";
    el.style.fontSize = "";
    el.style.opacity = "0";
  }
};

// Toggle header UI sections based on auth state
function setHeaderUIForAuth(isLoggedIn) {
  const headerMenu = document.querySelector("[data-role='header-menu']") || document.querySelector("#header-menu") || document.querySelector("#person-icon-header");
  const headerLogin = document.querySelector("[data-role='header-login']") || document.querySelector("#header-login");
  if (headerMenu) headerMenu.classList.toggle("d-none", !isLoggedIn);
  if (headerLogin) headerLogin.classList.toggle("d-none", isLoggedIn);
}

const FIREBASE_MODULE_PATH = "./scripts/firebase.js";
const REDIRECT = "index.html";

// Determine whether the current page is public (no auth required)
function isPublicPage() {
  const p = location.pathname.replace(/\/+$/, "").toLowerCase();
  return /(?:^|\/)(index|privacy-policy|legal-notice|help)(?:\.html)?$/.test(p) || p === "";
}

// User type definition

// Query single element helper
function qs(sel) { return document.querySelector(sel); }

// Get the header element that holds the initials
function getInitialsEl() {
  return document.getElementById("person-icon-header-text");
}

// Toggle .d-none on an element
function toggleHidden(el, hidden) {
  el?.classList.toggle("d-none", hidden);
}

// Show navigation for authenticated users
function showAuthedNav() {
  toggleHidden(qs(".nav"), false);
  toggleHidden(qs(".nav-box"), false);
  toggleHidden(qs(".nav-login-box"), true);
  toggleHidden(qs(".nav-login-box-mobile"), true);
}

// Show navigation for anonymous users
function showAnonNav() {
  toggleHidden(qs(".nav"), true);
  toggleHidden(qs(".nav-box"), true);
  toggleHidden(qs(".nav-login-box"), false);
  toggleHidden(qs(".nav-login-box-mobile"), false);
}

// Clear initials UI (and leave cache clearing to external helper)
function resetInitials(el) {
  if (!el) return;
  el.textContent = "";
  el.style.fontSize = "";
  el.style.opacity = "0";
}

// Redirect to index if the page is not public
function redirectIfNotPublic() {
  if (typeof isPublicPage === "function" && !isPublicPage()) {
    location.replace("index.html");
  }
}

// Handle Firebase auth state changes and update UI
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

// Initialize Firebase Auth listener and wire the UI
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


(async () => { await initAuthUI(); })();


// Check if current page is index.html
function isIndexPage() {
  const p = location.pathname.toLowerCase();
  return p === "/" || p.endsWith("/index.html");
}

// Get the header initials element
function getHeaderEl() {
  return document.getElementById("person-icon-header-text");
}

// Handle UI when user is authenticated
function onUserAuthenticated(user) {
  applyHeaderNavByAuth?.(user);
  window.updateUserInitials?.(user);
  const el = getHeaderEl();
  if (el) el.style.opacity = "1";
}

// Handle UI when no user is authenticated
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

// onAuthStateChanged callback wrapper
function handleAuthStateChange(user) {
  if (user) {
    onUserAuthenticated(user);
    return;
  }
  onUserUnauthenticated();
}

// Initialize auth state listener to apply header nav state
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


// Sign out the current user and redirect to index
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

// Attach a global click handler to trigger logout links with data-logout
function attachLogoutListener() {
  if (window.__logoutListenerAttached) return; // Guard
  window.__logoutListenerAttached = true;
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-logout]");
    if (!el) return;
    e.preventDefault();
    doLogout();
  });
}
attachLogoutListener();


// Show/hide navigation UI depending on authentication
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
