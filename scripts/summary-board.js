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
 * Creates Firebase tasks reference
 * @returns {Object}
 */
function createTasksReference() {
  return ref(db, "tasks");
}

/**
 * Updates earliest urgent date if newer
 * @param {Date|null} current
 * @param {Date} newDate
 * @returns {Date}
 */
function updateEarliestDate(current, newDate) {
  return !current || newDate < current ? newDate : current;
}

/**
 * Processes all tasks and computes statistics
 * @param {Object} tasks
 * @returns {Object}
 */
function processAllTasks(tasks) {
  const counts = initializeCounts();
  let earliestUrgentDate = null;
  
  if (tasks) {
    for (const taskId in tasks) {
      const task = tasks[taskId];
      processTask(task, counts, (date) => {
        earliestUrgentDate = updateEarliestDate(earliestUrgentDate, date);
      });
    }
  }
  
  return { counts, earliestUrgentDate };
}

/**
 * Updates UI with task statistics
 * @param {Object} counts
 * @param {Date|null} earliestUrgentDate
 */
function updateTaskUI(counts, earliestUrgentDate) {
  updateTaskCountElements(counts);
  updateUrgentDeadline(earliestUrgentDate);
}

/**
 * Handles Firebase snapshot data
 * @param {Object} snapshot
 */
function handleTasksSnapshot(snapshot) {
  const tasks = snapshot.val();
  const { counts, earliestUrgentDate } = processAllTasks(tasks);
  updateTaskUI(counts, earliestUrgentDate);
}

/**
 * Subscribes to Firebase tasks, computes counters and the earliest urgent date,
 * then updates the UI.
 * @returns {void}
 */
function loadTaskCounts() {
  const tasksRef = createTasksReference();
  onValue(tasksRef, handleTasksSnapshot);
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
 * Increments total task count
 * @param {Object} counts
 */
function incrementTotalCount(counts) {
  counts.total++;
}

/**
 * Updates column-specific counters
 * @param {any} task
 * @param {Object} counts
 */
function updateColumnCounts(task, counts) {
  if (task.column === 'todo') counts.todo++;
  if (task.column === 'inProgress') counts.inProgress++;
  if (task.column === 'awaitFeedback') counts.awaitFeedback++;
  if (task.column === 'done') counts.done++;
}

/**
 * Checks if task is urgent priority
 * @param {any} task
 * @returns {boolean}
 */
function isUrgentTask(task) {
  return task.priority === 'urgent';
}

/**
 * Processes urgent task date
 * @param {any} task
 * @param {Function} updateEarliestDate
 */
function processUrgentTaskDate(task, updateEarliestDate) {
  if (task.dueDate) {
    const taskDate = parseTaskDate(task.dueDate);
    if (taskDate) updateEarliestDate(taskDate);
  }
}

/**
 * Processes urgent task
 * @param {any} task
 * @param {Object} counts
 * @param {Function} updateEarliestDate
 */
function processUrgentTask(task, counts, updateEarliestDate) {
  counts.urgent++;
  processUrgentTaskDate(task, updateEarliestDate);
}

/**
 * Updates counters for a single task and tracks the earliest urgent due date.
 * @param {any} task - Task object from Firebase.
 * @param {ReturnType<initializeCounts>} counts - Counters object.
 * @param {(date: Date) => void} updateEarliestDate - Callback for earliest date.
 * @returns {void}
 */
function processTask(task, counts, updateEarliestDate) {
  incrementTotalCount(counts);
  updateColumnCounts(task, counts);
  
  if (isUrgentTask(task)) {
    processUrgentTask(task, counts, updateEarliestDate);
  }
}

/**
 * Splits date string into components
 * @param {string} dateStr
 * @returns {Array<string>}
 */
function splitDateString(dateStr) {
  return dateStr.split('/');
}

/**
 * Converts DD/MM/YYYY to MM/DD/YYYY format
 * @param {string} day
 * @param {string} month
 * @param {string} year
 * @returns {string}
 */
function formatDateForJS(day, month, year) {
  return `${month}/${day}/${year}`;
}

/**
 * Creates Date object from formatted string
 * @param {string} formattedDate
 * @returns {Date}
 */
function createDateObject(formattedDate) {
  return new Date(formattedDate);
}

/**
 * Validates Date object
 * @param {Date} date
 * @returns {boolean}
 */
function isValidDate(date) {
  return !isNaN(date);
}

/**
 * Parses a date string in DD/MM/YYYY format to a Date object.
 * @param {string} dateStr
 * @returns {Date|null}
 */
function parseTaskDate(dateStr) {
  const [day, month, year] = splitDateString(dateStr);
  const correctedDate = formatDateForJS(day, month, year);
  const taskDate = createDateObject(correctedDate);
  return isValidDate(taskDate) ? taskDate : null;
}

/**
 * Gets desktop deadline element
 * @returns {HTMLElement|null}
 */
function getDesktopDeadlineElement() {
  return $("urgent-deadline");
}

/**
 * Gets mobile deadline element
 * @returns {HTMLElement|null}
 */
function getMobileDeadlineElement() {
  return $("urgent-deadline-mobile");
}

/**
 * Sets deadline text on element
 * @param {HTMLElement} element
 * @param {string} text
 */
function setDeadlineText(element, text) {
  element.textContent = text;
}

/**
 * Updates deadline element if it exists
 * @param {HTMLElement|null} element
 * @param {string} displayDate
 */
function updateDeadlineElement(element, displayDate) {
  if (element) setDeadlineText(element, displayDate);
}

/**
 * Writes the earliest urgent deadline into the UI.
 * @param {Date|null} earliestDate
 * @returns {void}
 */
function updateUrgentDeadline(earliestDate) {
  const desktopDeadline = getDesktopDeadlineElement();
  const mobileDeadline = getMobileDeadlineElement();
  const displayDate = formatUrgentDate(earliestDate);

  updateDeadlineElement(desktopDeadline, displayDate);
  updateDeadlineElement(mobileDeadline, displayDate);
}

/**
 * Checks if date is null or undefined
 * @param {Date|null} date
 * @returns {boolean}
 */
function isNullDate(date) {
  return !date;
}

/**
 * Gets month name from date
 * @param {Date} date
 * @returns {string}
 */
function getMonthName(date) {
  return date.toLocaleDateString('en-US', { month: 'long' });
}

/**
 * Gets day from date
 * @param {Date} date
 * @returns {number}
 */
function getDay(date) {
  return date.getDate();
}

/**
 * Gets year from date
 * @param {Date} date
 * @returns {number}
 */
function getYear(date) {
  return date.getFullYear();
}

/**
 * Formats date components into display string
 * @param {string} month
 * @param {number} day
 * @param {number} year
 * @returns {string}
 */
function formatDateComponents(month, day, year) {
  return `${month} ${day}, ${year}`;
}

/**
 * Formats a Date as "Month D, YYYY", or returns "Nothing" if null.
 * @param {Date|null} date
 * @returns {string}
 */
function formatUrgentDate(date) {
  if (isNullDate(date)) return "Nothing";
  
  const month = getMonthName(date);
  const day = getDay(date);
  const year = getYear(date);
  return formatDateComponents(month, day, year);
}

/**
 * Gets desktop counter elements
 * @returns {Object}
 */
function getDesktopCounterElements() {
  return {
    todo: $("task-to-do-text"),
    inProgress: $("task-in-progress-text"),
    awaitFeedback: $("task-awaiting-feedback-text"),
    done: $("task-done-text"),
    urgent: $("task-urgent-text"),
    total: $("task-on-board-text")
  };
}

/**
 * Gets mobile counter elements
 * @returns {Object}
 */
function getMobileCounterElements() {
  return {
    todo: $("task-to-do-text-mobile"),
    inProgress: $("task-in-progress-text-mobile"),
    awaitFeedback: $("task-awaiting-feedback-text-mobile"),
    done: $("task-done-text-mobile"),
    urgent: $("task-urgent-text-mobile"),
    total: $("task-on-board-text-mobile")
  };
}

/**
 * Animates counters for element set
 * @param {Object} elements
 * @param {Object} counts
 */
function animateCounterSet(elements, counts) {
  for (const key in counts) {
    animateCounter(elements[key], counts[key]);
  }
}

/**
 * Updates and animates task counters for desktop and mobile widgets.
 * @param {ReturnType<initializeCounts>} counts
 * @returns {void}
 */
function updateTaskCountElements(counts) {
  const elements = getDesktopCounterElements();
  const mobileElements = getMobileCounterElements();
  
  animateCounterSet(elements, counts);
  animateCounterSet(mobileElements, counts);
}

/**
 * Validates counter animation parameters
 * @param {HTMLElement|null} element
 * @param {number} target
 * @returns {boolean}
 */
function isValidCounterAnimation(element, target) {
  return element !== null && !isNaN(target);
}

/**
 * Clears existing counter interval
 * @param {HTMLElement} element
 */
function clearExistingInterval(element) {
  if (element.counterInterval) {
    clearInterval(element.counterInterval);
  }
}

/**
 * Updates counter display
 * @param {HTMLElement} element
 * @param {number} value
 */
function updateCounterDisplay(element, value) {
  element.textContent = value;
}

/**
 * Completes counter animation
 * @param {HTMLElement} element
 * @param {number} target
 */
function completeCounterAnimation(element, target) {
  clearInterval(element.counterInterval);
  updateCounterDisplay(element, target);
}

/**
 * Creates counter animation interval
 * @param {HTMLElement} element
 * @param {number} target
 * @param {number} maxFakeCount
 * @param {number} delay
 */
function createCounterInterval(element, target, maxFakeCount, delay) {
  let current = 0;
  element.counterInterval = setInterval(() => {
    updateCounterDisplay(element, current);
    current++;
    if (current > maxFakeCount) {
      completeCounterAnimation(element, target);
    }
  }, delay);
}

/**
 * Animates a numeric counter from 0 up to its target value.
 * @param {HTMLElement|null} element - Target element.
 * @param {number} target - Final value.
 * @returns {void}
 */
function animateCounter(element, target) {
  if (!isValidCounterAnimation(element, target)) return;
  
  const maxFakeCount = 9;
  const delay = 10;
  
  clearExistingInterval(element);
  createCounterInterval(element, target, maxFakeCount, delay);
}

// --------------------------------------------------
// User Authentication
// --------------------------------------------------

/**
 * Gets user display name or default
 * @param {Object} user
 * @returns {string}
 */
function getUserDisplayName(user) {
  return user.displayName || "User";
}

/**
 * Gets user interface elements
 * @returns {Object}
 */
function getUserInterfaceElements() {
  return {
    username: $("username"),
    greeting: $("greeting"),
    initials: $("person-icon-header-text")
  };
}

/**
 * Checks if user has valid name
 * @param {string} name
 * @returns {boolean}
 */
function hasValidUserName(name) {
  return name !== "User";
}

/**
 * Sets username text
 * @param {HTMLElement} element
 * @param {string} name
 */
function setUsernameText(element, name) {
  element.textContent = name;
}

/**
 * Formats greeting text
 * @param {string} greeting
 * @returns {string}
 */
function formatGreetingText(greeting) {
  return greeting + ",";
}

/**
 * Sets greeting styles
 * @param {HTMLElement} element
 */
function setGreetingStyles(element) {
  element.style.fontSize = "48px";
  element.style.fontWeight = "400";
}

/**
 * Updates greeting element
 * @param {HTMLElement} element
 * @param {string} greeting
 */
function updateGreetingElement(element, greeting) {
  element.textContent = formatGreetingText(greeting);
  setGreetingStyles(element);
}

/**
 * Updates user initials if function available
 * @param {HTMLElement} element
 * @param {Object} user
 */
function updateInitialsIfAvailable(element, user) {
  if (element && window.updateUserInitials) {
    window.updateUserInitials(user);
  }
}

/**
 * Projects the user's name, greeting, and initials into the UI.
 * @param {import("firebase/auth").User} user - Firebase user.
 * @returns {void}
 */
function updateUserInterface(user) {
  const name = getUserDisplayName(user);
  const greeting = getGreeting();
  const elements = getUserInterfaceElements();
  
  if (elements.username && hasValidUserName(name)) {
    setUsernameText(elements.username, name);
    
    if (elements.greeting) {
      updateGreetingElement(elements.greeting, greeting);
    }
    
    updateInitialsIfAvailable(elements.initials, user);
  }
}

// --------------------------------------------------
// Animations
// --------------------------------------------------

/**
 * Checks if device is mobile
 * @returns {boolean}
 */
function isMobileDevice() {
  return window.innerWidth <= 900;
}

/**
 * Runs all mobile animations
 */
function runMobileAnimations() {
  animateDashboardHeader();
  animateTaskDashboardMobile();
}

/**
 * Runs mobile-only intro animations.
 * @returns {void}
 */
function initMobileAnimations() {
  if (!isMobileDevice()) return;
  runMobileAnimations();
}

/**
 * Gets dashboard header element
 * @returns {HTMLElement|null}
 */
function getDashboardHeader() {
  return document.querySelector('.dashboard-header');
}

/**
 * Sets header transition style
 * @param {HTMLElement} header
 */
function setHeaderTransition(header) {
  header.style.transition = 'transform 1s ease';
}

/**
 * Sets header transform style
 * @param {HTMLElement} header
 */
function setHeaderTransform(header) {
  header.style.transform = 'translateY(-25vh)';
}

/**
 * Applies header animation styles
 * @param {HTMLElement} header
 */
function applyHeaderAnimationStyles(header) {
  setHeaderTransition(header);
  setHeaderTransform(header);
}

/**
 * Executes header animation
 */
function executeHeaderAnimation() {
  const header = getDashboardHeader();
  if (header) {
    applyHeaderAnimationStyles(header);
  }
}

/**
 * Slides the dashboard header upward.
 * @returns {void}
 */
function animateDashboardHeader() {
  setTimeout(executeHeaderAnimation, 1800);
}

/**
 * Gets mobile dashboard element
 * @returns {HTMLElement|null}
 */
function getMobileDashboard() {
  return document.querySelector('.task-dashboard-mobile');
}

/**
 * Sets mobile dashboard transition
 * @param {HTMLElement} dashboard
 */
function setMobileDashboardTransition(dashboard) {
  dashboard.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
}

/**
 * Sets mobile dashboard transform
 * @param {HTMLElement} dashboard
 */
function setMobileDashboardTransform(dashboard) {
  dashboard.style.transform = 'translateY(0)';
}

/**
 * Sets mobile dashboard opacity
 * @param {HTMLElement} dashboard
 */
function setMobileDashboardOpacity(dashboard) {
  dashboard.style.opacity = '1';
}

/**
 * Applies mobile dashboard animation styles
 * @param {HTMLElement} dashboard
 */
function applyMobileDashboardStyles(dashboard) {
  setMobileDashboardTransition(dashboard);
  setMobileDashboardTransform(dashboard);
  setMobileDashboardOpacity(dashboard);
}

/**
 * Executes mobile dashboard animation
 */
function executeMobileDashboardAnimation() {
  const dashboardMobile = getMobileDashboard();
  if (dashboardMobile) {
    applyMobileDashboardStyles(dashboardMobile);
  }
}

/**
 * Fades and slides in the mobile task dashboard.
 * @returns {void}
 */
function animateTaskDashboardMobile() {
  setTimeout(executeMobileDashboardAnimation, 2100);
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