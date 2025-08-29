/* eslint-env browser */
/**
 * @file Toggles desktop/mobile navigation visibility based on Firebase
 *       authentication state. Guests (email === 'guest@login.de') see
 *       the login boxes; authenticated users see the full navigation.
 *
 * External dependencies:
 *  - Firebase Auth v10.12.0
 *  - `auth` instance from ./firebase.js
 */

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { auth } from "./firebase.js";

/**
 * Listen for authentication state changes and toggle the nav elements.
 * - Logged-in (non-guest): show `.nav` and `.nav-box`, hide login boxes.
 * - Guest or signed-out: show login boxes, hide nav.
 *
 * @param {import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js").User|null} user
 *   The current Firebase user, or null if signed out.
 * @returns {void}
 */
onAuthStateChanged(auth, (user) => {
  const nav               = document.querySelector('.nav');
  const navBox            = document.querySelector('.nav-box');
  const navLoginBox       = document.querySelector('.nav-login-box');
  const navLoginBoxMobile = document.querySelector('.nav-login-box-mobile');

  const showNav = !!user;

  nav?.classList.toggle('d-none', !showNav);
  navBox?.classList.toggle('d-none', !showNav);

  navLoginBox?.classList.toggle('d-none', showNav);
  navLoginBoxMobile?.classList.toggle('d-none', showNav);
});
