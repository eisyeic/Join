/**
 * @file Summary Board logic.
 * Loads tasks from Firebase, updates counters/deadlines, shows user info,
 * and runs mobile-only intro animations.
 */

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { auth, app } from "./firebase.js";

const db = getDatabase(app);

// --------------------------------------------------
// Utilities
// --------------------------------------------------

/**
 * Returns uppercase initials from a full name.
 * @param {string} name - Full name.
 * @returns {string} Uppercase initials.
 */
function getInitials(name) {
  return name
    .split(" ")
    .map(word => word.charAt(0).toUpperCase())
    .join("");
}

/**
 * Returns a time-of-day greeting based on the current hour.
 * @returns {"Good Night"|"Good Morning"|"Good Afternoon"|"Good Evening"}
 */
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 5) return "Good Night";
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

/**
 * Shorthand for document.getElementById.
 * @param {string} id - Element ID.
 * @returns {HTMLElement|null}
 */
function $(id) {
  return document.getElementById(id);
}

// --------------------------------------------------
// Task Management
// --------------------------------------------------

/**
 * Subscribes to Firebase tasks, computes counters and the earliest urgent date,
 * then updates the UI.
 * @returns {void}
 */
function loadTaskCounts() {
  const tasksRef = ref(db, "tasks");
  onValue(tasksRef, (snapshot) => {
    const tasks = snapshot.val();
    const counts = initializeCounts();
    let earliestUrgentDate = null;
    if (tasks) {
      for (const taskId in tasks) {
        const task = tasks[taskId];
        processTask(task, counts, (date) => {
          if (!earliestUrgentDate || date < earliestUrgentDate) {
            earliestUrgentDate = date;
          }
        });
      }
    }
    updateTaskCountElements(counts);
    updateUrgentDeadline(earliestUrgentDate);
  });
}

/**
 * Creates the initial counters object.
 * @returns {{todo:number,inProgress:number,awaitFeedback:number,done:number,urgent:number,total:number}}
 */
function initializeCounts() {
  return {
    todo: 0,
    inProgress: 0,
    awaitFeedback: 0,
    done: 0,
    urgent: 0,
    total: 0
  };
}

/**
 * Updates counters for a single task and tracks the earliest urgent due date.
 * @param {any} task - Task object from Firebase.
 * @param {ReturnType<initializeCounts>} counts - Counters object.
 * @param {(date: Date) => void} updateEarliestDate - Callback for earliest date.
 * @returns {void}
 */
function processTask(task, counts, updateEarliestDate) {
  counts.total++;
  if (task.column === 'todo') counts.todo++;
  if (task.column === 'inProgress') counts.inProgress++;
  if (task.column === 'awaitFeedback') counts.awaitFeedback++;
  if (task.column === 'done') counts.done++;

  if (task.priority === 'urgent') {
    counts.urgent++;
    if (task.dueDate) {
      const taskDate = parseTaskDate(task.dueDate);
      if (taskDate) updateEarliestDate(taskDate);
    }
  }
}

/**
 * Parses a date string in DD/MM/YYYY format to a Date object.
 * @param {string} dateStr
 * @returns {Date|null}
 */
function parseTaskDate(dateStr) {
  const [day, month, year] = dateStr.split('/');
  const correctedDate = `${month}/${day}/${year}`;
  const taskDate = new Date(correctedDate);
  return isNaN(taskDate) ? null : taskDate;
}

/**
 * Writes the earliest urgent deadline into the UI.
 * @param {Date|null} earliestDate
 * @returns {void}
 */
function updateUrgentDeadline(earliestDate) {
  const desktopDeadline = $("urgent-deadline");
  const mobileDeadline = $("urgent-deadline-mobile");
  const displayDate = formatUrgentDate(earliestDate);

  if (desktopDeadline) desktopDeadline.textContent = displayDate;
  if (mobileDeadline) mobileDeadline.textContent = displayDate;
}

/**
 * Formats a Date as "Month D, YYYY", or returns "Nothing" if null.
 * @param {Date|null} date
 * @returns {string}
 */
function formatUrgentDate(date) {
  if (!date) return "Nothing";
  const month = date.toLocaleDateString('en-US', { month: 'long' });
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
}

/**
 * Updates and animates task counters for desktop and mobile widgets.
 * @param {ReturnType<initializeCounts>} counts
 * @returns {void}
 */
function updateTaskCountElements(counts) {
  const elements = {
    todo: $("task-to-do-text"),
    inProgress: $("task-in-progress-text"),
    awaitFeedback: $("task-awaiting-feedback-text"),
    done: $("task-done-text"),
    urgent: $("task-urgent-text"),
    total: $("task-on-board-text")
  };
  const mobileElements = {
    todo: $("task-to-do-text-mobile"),
    inProgress: $("task-in-progress-text-mobile"),
    awaitFeedback: $("task-awaiting-feedback-text-mobile"),
    done: $("task-done-text-mobile"),
    urgent: $("task-urgent-text-mobile"),
    total: $("task-on-board-text-mobile")
  };
  for (const key in counts) {
    animateCounter(elements[key], counts[key]);
    animateCounter(mobileElements[key], counts[key]);
  }
}

/**
 * Animates a numeric counter from 0 up to its target value.
 * @param {HTMLElement|null} element - Target element.
 * @param {number} target - Final value.
 * @returns {void}
 */
function animateCounter(element, target) {
  if (!element || isNaN(target)) return;
  let current = 0;
  const maxFakeCount = 9;
  const delay = 10;
  if (element.counterInterval) clearInterval(element.counterInterval);
  element.counterInterval = setInterval(() => {
    element.textContent = current;
    current++;
    if (current > maxFakeCount) {
      clearInterval(element.counterInterval);
      element.textContent = target;
    }
  }, delay);
}

// --------------------------------------------------
// User Authentication
// --------------------------------------------------

/**
 * Projects the user's name, greeting, and initials into the UI.
 * @param {import("firebase/auth").User} user - Firebase user.
 * @returns {void}
 */
function updateUserInterface(user) {
  const name = user.displayName || "User";
  const greeting = getGreeting();
  const elements = {
    username: $("username"),
    greeting: $("greeting"),
    initials: $("person-icon-header-text")
  };
  if (elements.username && name !== "User") {
    elements.username.textContent = name;
    if (elements.greeting) {
      elements.greeting.textContent = greeting + ",";
      elements.greeting.style.fontSize = "48px";
      elements.greeting.style.fontWeight = "400";
    }
    if (elements.initials && window.updateUserInitials) {
      window.updateUserInitials(user);
    }
  }
}

// --------------------------------------------------
// Animations
// --------------------------------------------------

/**
 * Runs mobile-only intro animations.
 * @returns {void}
 */
function initMobileAnimations() {
  if (window.innerWidth > 900) return;
  animateDashboardHeader();
  animateTaskDashboardMobile();
}

/**
 * Slides the dashboard header upward.
 * @returns {void}
 */
function animateDashboardHeader() {
  setTimeout(() => {
    const header = document.querySelector('.dashboard-header');
    if (header) {
      header.style.transition = 'transform 1s ease';
      header.style.transform = 'translateY(-25vh)';
    }
  }, 1800);
}

/**
 * Fades and slides in the mobile task dashboard.
 * @returns {void}
 */
function animateTaskDashboardMobile() {
  setTimeout(() => {
    const dashboardMobile = document.querySelector('.task-dashboard-mobile');
    if (dashboardMobile) {
      dashboardMobile.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
      dashboardMobile.style.transform = 'translateY(0)';
      dashboardMobile.style.opacity = '1';
    }
  }, 2100);
}

// --------------------------------------------------
// Initialization
// --------------------------------------------------

/**
 * Subscribes to Firebase Auth state changes.
 * @returns {void}
 */
function setupAuthListener() {
  onAuthStateChanged(auth, handleAuthChange);
}

/**
 * Handles Auth state changes and updates the UI for signed-in users.
 * @param {import("firebase/auth").User|null} user
 * @returns {void}
 */
function handleAuthChange(user) {
  if (user) updateUserInterface(user);
}

/**
 * Initializes the Summary Board: auth listener, animations, and task counters.
 * @returns {void}
 */
function initSummaryBoard() {
  setupAuthListener();
  initMobileAnimations();
  loadTaskCounts();
}

document.addEventListener('DOMContentLoaded', initSummaryBoard);