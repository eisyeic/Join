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
