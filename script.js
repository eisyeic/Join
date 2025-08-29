/**
 * Shorthand for getElementById
 * @param {string} id
 * @returns {HTMLElement|null}
 */
let $ = (id) => document.getElementById(id);

/* ======================= Dropdown ======================= */

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

/* ======================= Initialen & Cache ======================= */

// Initialen erst nach Auth-Status anzeigen (bis dahin versteckt)
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
      // Sichtbar schaltet erst der Auth-Listener
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
    // Zwei Wörter → erste Buchstaben, z. B. "Max Mustermann" → "MM"
    initials = (parts[0][0] + parts[1][0]).toUpperCase();
  } else if (parts.length === 1) {
    // Ein Wort → nur erster Buchstabe, z. B. "guest" → "G"
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


/** Cache leeren & Initialen ausblenden (bei Logout/Nicht-Login) */
window.clearHeaderTextCache = function () {
  localStorage.removeItem("headerTextCache");
  const el = $("person-icon-header-text");
  if (el) {
    el.textContent = "";
    el.style.fontSize = "";
    /** @type {HTMLElement} */ (el).style.opacity = "0";
  }
};

/* ======================= Header-UI umschalten ======================= */
/**
 * Zeigt/versteckt Avatar/Menu vs. Login-Button.
 * Passe die Selektoren an dein Markup an:
 * - headerMenu: Container deines normalen Menüs / Avatarbereichs
 * - headerLogin: Dein "Login"-Button/Link
 */
function setHeaderUIForAuth(isLoggedIn) {
  const headerMenu =
    document.querySelector("[data-role='header-menu']") ||
    document.querySelector("#header-menu") ||
    document.querySelector("#person-icon-header"); // Fallback: Avatarbereich

  const headerLogin =
    document.querySelector("[data-role='header-login']") ||
    document.querySelector("#header-login");

  if (headerMenu) headerMenu.classList.toggle("d-none", !isLoggedIn);
  if (headerLogin) headerLogin.classList.toggle("d-none", isLoggedIn);
}

/* ======================= Auth-Gate & Redirect ======================= */

const FIREBASE_MODULE_PATH = "./scripts/firebase.js"; 
const REDIRECT = "index.html";

/** öffentliche Seiten (kein Redirect, wenn nicht eingeloggt) */
function isPublicPage() {
  // Erlaubt: index, privacy-policy, legal-notice, help (mit/ohne .html)
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
        // Eingeloggt (Gast = normal)
        window.updateUserInitials?.(user);
        if (initialsEl) initialsEl.style.opacity = "1";

        // Optional: Nav/Login-UI umschalten (falls genutzt)
        document.querySelector(".nav")?.classList.remove("d-none");
        document.querySelector(".nav-box")?.classList.remove("d-none");
        document.querySelector(".nav-login-box")?.classList.add("d-none");
        document.querySelector(".nav-login-box-mobile")?.classList.add("d-none");
        return;
      }

      // Nicht eingeloggt: Initialen/Navigation verbergen
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

      // → Redirect auf geschützten Seiten (z. B. summary-board.html, addtaks.html, board.html, contac.html)
      if (!isPublicPage()) {
        location.replace("index.html");
      }
    });
  } catch (err) {
    console.error("Auth-Initialisierung fehlgeschlagen:", err);
    // Fallback: wenn Auth gar nicht lädt, schicke vorsichtshalber zur Index (nur auf geschützten Seiten)
    if (!isPublicPage()) location.replace("index.html");
  }
})();





/** Start-/Index-Seite erkannt? */
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
    // eingeloggt: Initialen anzeigen, Menü zeigen (Gast = normal)
    applyHeaderNavByAuth?.(user);         // falls vorhanden
    window.updateUserInitials?.(user);
    if (el) el.style.opacity = "1";
    return;
  }

  // nicht eingeloggt: Initialen verstecken, Login-UI zeigen
  applyHeaderNavByAuth?.(null);           // falls vorhanden
  localStorage.removeItem("headerTextCache");
  if (el) { el.textContent = ""; el.style.fontSize = ""; el.style.opacity = "0"; }

  // Redirect, außer auf index / privacy-policy / legal-notice / help
  if (!isPublicPage()) location.replace("index.html");
});

  } catch (err) {
    console.error("Auth-Initialisierung fehlgeschlagen:", err);
  }
})();


/** Einheitlicher Logout (Gast = normaler User) */
async function doLogout() {
  if (window.__loggingOut) return;
  window.__loggingOut = true;

  try {
    const [{ auth }, { signOut }] = await Promise.all([
      import(FIREBASE_MODULE_PATH),
      import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js"),
    ]);

    // Menü schließen & UI aufräumen
    document.getElementById("profile-navbar")?.classList.add("d-none");
    window.clearHeaderTextCache?.();

    await signOut(auth);
  } catch (err) {
    console.error("Logout fehlgeschlagen:", err);
    // selbst bei Fehler: zur Index-Seite
  } finally {
    window.__loggingOut = false;
    // Immer zur Index-Seite
    location.replace("index.html");
  }
}

// Delegierter Listener für <a data-logout> oder <button data-logout>
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-logout]");
  if (!el) return;
  e.preventDefault();
  doLogout();
});

/** Delegierter Click-Listener für alle Seiten/DOM-Zustände */
function attachLogoutListener() {
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-logout]");
    if (!el) return;
    e.preventDefault();
    doLogout();
  });
}

// direkt aktivieren (Script wird mit defer geladen)
attachLogoutListener();


/**
 * Zeigt/versteckt Navigation vs. Login-Boxen je nach Auth-Status.
 * - Eingeloggt (auch guest@login.de): .nav / .nav-box sichtbar, Login-Boxen versteckt
 * - Nicht eingeloggt:                 .nav / .nav-box versteckt, Login-Boxen sichtbar
 */
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
