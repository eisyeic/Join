/**
 * Shorthand for `document.getElementById`.
 * @param {string} id - Element id.
 * @returns {HTMLElement|null} The element or null if not found.
 */
let $ = (id) => document.getElementById(id);

/**
 * Toggle the profile dropdown (header avatar menu).
 * Adds/removes a global click listener to close when clicking outside.
 * @returns {void}
 */
function toggleProfileNavbar() {
  const profileNavbar = $("profile-navbar");
  if (!profileNavbar) return;

  profileNavbar.classList.toggle("d-none");

  if (!profileNavbar.classList.contains("d-none")) {
    // defer so the very click that opened it won't immediately close it
    setTimeout(() => {
      document.addEventListener("click", closeProfileNavbar);
    }, 0);
  } else {
    document.removeEventListener("click", closeProfileNavbar);
  }
}

/**
 * Close the profile dropdown if the click happened outside of it
 * and not on the guest icon.
 * @param {MouseEvent} ev
 * @returns {void}
 */
function closeProfileNavbar(ev) {
  const profileNavbar = $("profile-navbar");
  if (!profileNavbar) return;

  const guestIcon = /** @type {HTMLElement|null} */ (
    document.querySelector('img[alt="Guest Icon"]')
  );

  const target = /** @type {Node} */ (ev.target);
  const clickedOutside = !profileNavbar.contains(target);
  const clickedGuestIcon = guestIcon && target === guestIcon;

  if (clickedOutside && !clickedGuestIcon) {
    profileNavbar.classList.add("d-none");
    document.removeEventListener("click", closeProfileNavbar);
  }
}

/**
 * Initialize header initials from cache for a smoother first paint.
 * Falls back to "G" with a readable font size if no cache exists.
 * @returns {void}
 */
(() => {
  const cached = JSON.parse(localStorage.getItem("headerTextCache") || "null");
  if (cached) {
    const style = document.createElement("style");
    style.textContent = `#person-icon-header-text { opacity: 0; }`;
    document.head.appendChild(style);

    document.addEventListener("DOMContentLoaded", () => {
      const initialsElement = document.getElementById("person-icon-header-text");
      if (initialsElement) {
        initialsElement.textContent = cached.text;
        initialsElement.style.fontSize = cached.fontSize;
        /** @type {HTMLElement} */ (initialsElement).style.opacity = "1";
        style.remove();
      }
    });
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      const initialsElement = document.getElementById("person-icon-header-text");
      if (initialsElement && initialsElement.textContent === "G") {
        initialsElement.style.fontSize = "30px";
      }
    });
  }
})();

/**
 * Update the user initials in the header circle and cache them.
 * Special-cases the guest account to always show "G".
 * Exposed globally for auth callbacks.
 * @param {{displayName?: string|null, email?: string|null}|null} user - Firebase user-like object.
 * @returns {void}
 */
window.updateUserInitials = function (user) {
  if (!user) return;

  const name = user.displayName || "User";
  const initialsElement = document.getElementById("person-icon-header-text");
  if (!initialsElement) return;

  let initials;
  let fontSize;

  const isGuest = user.email === "guest@login.de" || name === "User";
  if (isGuest) {
    initials = "G";
    fontSize = "30px";
  } else {
    initials = name
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase())
      .join("");
    fontSize = initials.length === 2 ? "22px" : "30px";
  }

  localStorage.setItem(
    "headerTextCache",
    JSON.stringify({ text: initials, fontSize })
  );

  requestAnimationFrame(() => {
    const cached = JSON.parse(localStorage.getItem("headerTextCache") || "null");
    if (cached) {
      initialsElement.textContent = cached.text;
      initialsElement.style.fontSize = cached.fontSize;
    }
  });
};

/**
 * Clear the cached initials (e.g., on logout) and reset header to "G".
 * Exposed globally for logout flows.
 * @returns {void}
 */
window.clearHeaderTextCache = function () {
  localStorage.removeItem("headerTextCache");
  const initialsElement = document.getElementById("person-icon-header-text");
  if (initialsElement) {
    initialsElement.textContent = "G";
    initialsElement.style.fontSize = "30px";
  }
};