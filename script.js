/**
 * Shorthand for getElementById
 * @param {string} id
 * @returns {HTMLElement|null}
 */
let $ = (id) => document.getElementById(id);

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

function closeProfileNavbar(ev) {
  if (!ev) return;
  const profileNavbar = $("profile-navbar");
  if (!profileNavbar) return;
  const toggle =
    document.getElementById("profile-toggle") ||
    document.querySelector("[data-profile-toggle]") ||
    document.querySelector('img[alt="Guest Icon"]');
  const target = /** @type {Node} */ (ev.target);
  const inside = profileNavbar.contains(target);
  const onToggle = toggle && (toggle === target || toggle.contains(target));
  if (!inside && !onToggle) {
    profileNavbar.classList.add("d-none");
    document.removeEventListener("click", closeProfileNavbar);
  }
}

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

/**
 * Initialen setzen & cachen (gilt für alle eingeloggten User, inkl. Gast)
 * @param {{displayName?: string|null, email?: string|null}|null} user
 */
window.updateUserInitials = function (user) {
  if (!user) return;
  const el = document.getElementById("person-icon-header-text");
  if (!el) return;

  const base =
    (user.displayName && user.displayName.trim()) ||
    (user.email && user.email.split("@")[0]) ||
    "";

  const parts = base.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  let initials = "";
  if (parts.length >= 2) {
    initials = (parts[0][0] + parts[1][0]).toUpperCase();
  } else if (parts.length === 1) {
    initials = parts[0][0].toUpperCase();
  }
  if (!initials) {
    localStorage.removeItem("headerTextCache");
    el.textContent = "";
    el.style.fontSize = "";
    return;
  }

  const fontSize = initials.length === 2 ? "22px" : "30px";
  localStorage.setItem("headerTextCache", JSON.stringify({ text: initials, fontSize }));
  el.textContent = initials;
  el.style.fontSize = fontSize;
  /** @type {HTMLElement} */ (el).style.opacity = "1";
};


window.clearHeaderTextCache = function () {
  localStorage.removeItem("headerTextCache");
  const el = $("person-icon-header-text");
  if (el) {
    el.textContent = "";
    el.style.fontSize = "";
    /** @type {HTMLElement} */ (el).style.opacity = "0";
  }
};

function setHeaderUIForAuth(isLoggedIn) {
  const headerMenu =
    document.querySelector("[data-role='header-menu']") ||
    document.querySelector("#header-menu") ||
    document.querySelector("#person-icon-header");
  const headerLogin =
    document.querySelector("[data-role='header-login']") ||
    document.querySelector("#header-login");
  if (headerMenu) headerMenu.classList.toggle("d-none", !isLoggedIn);
  if (headerLogin) headerLogin.classList.toggle("d-none", isLoggedIn);
}

const FIREBASE_MODULE_PATH = "./scripts/firebase.js"; 
const REDIRECT = "index.html";
function isPublicPage() {
  const p = location.pathname.replace(/\/+$/, "").toLowerCase();
  return /(?:^|\/)(index|privacy-policy|legal-notice|help)(?:\.html)?$/.test(p) || p === "";
}

(async () => {
  try {
    const [{ auth }, { onAuthStateChanged }] = await Promise.all([
      import(FIREBASE_MODULE_PATH),
      import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js"),
    ]);
    onAuthStateChanged(auth, (user) => {
      const initialsEl = document.getElementById("person-icon-header-text");
      if (user) {
        window.updateUserInitials?.(user);
        if (initialsEl) initialsEl.style.opacity = "1";
        document.querySelector(".nav")?.classList.remove("d-none");
        document.querySelector(".nav-box")?.classList.remove("d-none");
        document.querySelector(".nav-login-box")?.classList.add("d-none");
        document.querySelector(".nav-login-box-mobile")?.classList.add("d-none");
        return;
      }
      window.clearHeaderTextCache?.();
      if (initialsEl) {
        initialsEl.textContent = "";
        initialsEl.style.fontSize = "";
        initialsEl.style.opacity = "0";
      }
      document.querySelector(".nav")?.classList.add("d-none");
      document.querySelector(".nav-box")?.classList.add("d-none");
      document.querySelector(".nav-login-box")?.classList.remove("d-none");
      document.querySelector(".nav-login-box-mobile")?.classList.remove("d-none");
      if (!isPublicPage()) {
        location.replace("index.html");
      }
    });
  } catch (err) {
    console.error("Auth-Initialisierung fehlgeschlagen:", err);
    if (!isPublicPage()) location.replace("index.html");
  }
})();

function isIndexPage() {
  const p = location.pathname.toLowerCase();
  return p === "/" || p.endsWith("/index.html");
}

(async () => {
  try {
    const [{ auth }, { onAuthStateChanged }] = await Promise.all([
      import(FIREBASE_MODULE_PATH),
      import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js"),
    ]);
    onAuthStateChanged(auth, (user) => {
  const el = document.getElementById("person-icon-header-text");
  if (user) {
    applyHeaderNavByAuth?.(user);        
    window.updateUserInitials?.(user);
    if (el) el.style.opacity = "1";
    return;
  }
  applyHeaderNavByAuth?.(null);  
  localStorage.removeItem("headerTextCache");
  if (el) { el.textContent = ""; el.style.fontSize = ""; el.style.opacity = "0"; }
  if (!isPublicPage()) location.replace("index.html");
});

  } catch (err) {
    console.error("Auth-Initialisierung fehlgeschlagen:", err);
  }
})();

async function doLogout() {
  if (window.__loggingOut) return;
  window.__loggingOut = true;
  try {
    const [{ auth }, { signOut }] = await Promise.all([
      import(FIREBASE_MODULE_PATH),
      import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js"),
    ]);
    document.getElementById("profile-navbar")?.classList.add("d-none");
    window.clearHeaderTextCache?.();
    await signOut(auth);
  } catch (err) {
    console.error("Logout fehlgeschlagen:", err);
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

function attachLogoutListener() {
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-logout]");
    if (!el) return;
    e.preventDefault();
    doLogout();
  });
}
attachLogoutListener();

function applyHeaderNavByAuth(user) {
  const showNav = !!user;
  const nav               = document.querySelector('.nav');
  const navBox            = document.querySelector('.nav-box');
  const navLoginBox       = document.querySelector('.nav-login-box');
  const navLoginBoxMobile = document.querySelector('.nav-login-box-mobile');
  nav?.classList.toggle('d-none', !showNav);
  navBox?.classList.toggle('d-none', !showNav);
  navLoginBox?.classList.toggle('d-none', showNav);
  navLoginBoxMobile?.classList.toggle('d-none', showNav);
}
