/**
 * @file summary-core.js
 * @description Core functionality and initialization for Summary Board
 */
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { auth } from "./firebase.js";
import { loadTaskCounts } from "./summary-tasks.js";
import { updateUserInterface } from "./summary-ui.js";
import { initMobileAnimations } from "./summary-animations.js";

/**
 * Returns uppercase initials from a full name
 */
function getInitials(name) {
  return name
    .split(" ")
    .map(word => word.charAt(0).toUpperCase())
    .join("");
}

/**
 * Returns a time-of-day greeting based on the current hour
 */
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 5) return "Good Night";
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

/**
 * Shorthand for document.getElementById
 */
function $(id) {
  return document.getElementById(id);
}

/**
 * Subscribes to Firebase Auth state changes
 */
function setupAuthListener() {
  onAuthStateChanged(auth, handleAuthChange);
}

/**
 * Handles Auth state changes and updates the UI for signed-in users
 */
function handleAuthChange(user) {
  if (user) updateUserInterface(user);
}

/**
 * Initializes the Summary Board: auth listener, animations, and task counters
 */
function initSummaryBoard() {
  setupAuthListener();
  initMobileAnimations();
  loadTaskCounts();
}

document.addEventListener('DOMContentLoaded', initSummaryBoard);

// Export utilities for other modules
export { getInitials, getGreeting, $ };