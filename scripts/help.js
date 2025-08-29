/* eslint-env browser */
/**
 * @file Propagates Firebase Auth state changes to the UI by invoking the
 *       global `window.updateUserInitials` callback (if present).
 *
 * External dependencies:
 *  - Firebase Auth v10.12.0
 *  - `auth` instance from ./firebase.js
 */

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { auth } from "./firebase.js";

/**
 * Listen for authentication state changes and forward the `user` object
 * (or `null` when signed out) to a global UI hook if available.
 * @param {import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js").User|null} user
 *   The currently signed-in Firebase user, or null if signed out.
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
