// ===== IMPORTS =====
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { auth, app } from "./firebase.js";

const db = getDatabase(app);


// ===== UTILITY FUNCTIONS =====

/**
 * Returns uppercase initials from a full name.
 * Splits by whitespace and takes the first character of each part.
 * @param {string} name - Full name (e.g., "John Doe").
 * @returns {string} Uppercase initials (e.g., "JD").
 */
function getInitials(name) {
  return name
    .split(" ")
    .map(word => word.charAt(0).toUpperCase())
    .join("");
}

/**
 * Generates a time-of-day greeting based on the current hour.
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
 * @param {string} id - Element id.
 * @returns {HTMLElement|null}
 */
function $(id) {
  return document.getElementById(id);
}


// ===== TASK MANAGEMENT =====

/**
 * Subscribes to Firebase tasks, aggregates counters and earliest urgent date,
 * then updates the UI for desktop and mobile summaries.
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
 * Creates an initial counters object for task board statistics.
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
 * Updates counters for a single task and tracks earliest urgent due date.
 * @param {{column:string,priority:string,dueDate?:string}} task
 * @param {{total:number,todo:number,inProgress:number,awaitFeedback:number,done:number,urgent:number}} counts
 * @param {(date: Date) => void} updateEarliestDate - Callback to update earliest urgent date.
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
 * Returns null if parsing fails.
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
 * Writes the earliest urgent deadline date into desktop and mobile elements.
 * @param {Date|null} earliestDate
 */
function updateUrgentDeadline(earliestDate) {
  const desktopDeadline = $("urgent-deadline");
  const mobileDeadline = $("urgent-deadline-mobile");
  const displayDate = formatUrgentDate(earliestDate);

  if (desktopDeadline) desktopDeadline.textContent = displayDate;
  if (mobileDeadline) mobileDeadline.textContent = displayDate;
}

/**
 * Formats a Date as "Month D, YYYY" for display or returns "Nothing" if null.
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
 * Updates (and animates) task counters in desktop and mobile widgets.
 * @param {{todo:number,inProgress:number,awaitFeedback:number,done:number,urgent:number,total:number}} counts
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
 * Animates a numeric counter from 0 to its target, then snaps to the final value.
 * @param {HTMLElement|null} element - Counter element.
 * @param {number} target - Final count value.
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


// ===== USER AUTHENTICATION =====

/**
 * Projects the authenticated user's name, greeting, and initials into the UI.
 * @param {{displayName?:string}} user
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


// ===== ANIMATIONS =====

/**
 * Initializes mobile-only intro animations for the summary board.
 */
function initMobileAnimations() {
  if (window.innerWidth > 900) return;

  animateDashboardHeader();
  animateTaskDashboardMobile();
}

/**
 * Slides the dashboard header upward after a short delay.
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
 * Fades and slides in the mobile task dashboard after the header animation.
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


// ===== INITIALIZATION =====

function setupAuthListener() {
  onAuthStateChanged(auth, handleAuthChange);
}
/**
 * Handles Firebase auth state changes and updates the UI for signed-in users.
 * @param {import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js").User|null} user
 */
function handleAuthChange(user) {
  if (user) updateUserInterface(user);
}

function initSummaryBoard() {
  setupAuthListener();
  initMobileAnimations();
  loadTaskCounts();
}

document.addEventListener('DOMContentLoaded', initSummaryBoard);