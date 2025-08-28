/**
 * Subscribes to Firebase Auth state and toggles navigation/login UI accordingly.
 * Treats the user with email "guest@login.de" as not authenticated.
 * Expects the following elements to exist in the DOM:
 * - .nav-login-box (desktop login panel)
 * - .nav (sidebar navigation)
 * - .nav-box (mobile footer navigation)
 * - .nav-login-box-mobile (mobile login panel)
 *
 * @fileoverview Auth-gated navigation visibility.
 */

/** @typedef {import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js").User} FirebaseUser */

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { auth } from "./firebase.js";

/**
 * React to authentication changes and show/hide navigation and login boxes.
 * @param {FirebaseUser|null} user - The current authenticated user or null.
 */
onAuthStateChanged(auth, (user) => {
  /** @type {HTMLElement} */ const navLoginBox = document.querySelector('.nav-login-box');
  /** @type {HTMLElement} */ const nav = document.querySelector('.nav');
  /** @type {HTMLElement} */ const navBox = document.querySelector('.nav-box');
  /** @type {HTMLElement} */ const navLoginBoxMobile = document.querySelector('.nav-login-box-mobile');

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
