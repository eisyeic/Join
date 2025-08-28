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
  const navLoginBox = document.querySelector('.nav-login-box');
  const nav = document.querySelector('.nav');
  const navBox = document.querySelector('.nav-box');
  const navLoginBoxMobile = document.querySelector('.nav-login-box-mobile');
  
  if (user && user.email !== 'guest@login.de') {
    navLoginBox.classList.add('d-none');
    nav.classList.remove('d-none');
    navBox.classList.remove('d-none');
    navLoginBoxMobile.classList.add('d-none');
  } else {
    navLoginBox.classList.remove('d-none');
    nav.classList.add('d-none');
    navBox.classList.add('d-none');
    navLoginBoxMobile.classList.remove('d-none');
  }
});
