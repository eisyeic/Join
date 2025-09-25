import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { auth, app } from "./firebase.js";

const db = getDatabase(app);

function getInitials(name) {
  return name
    .split(" ")
    .map(word => word.charAt(0).toUpperCase())
    .join("");
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 5) return "Good Night";
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

function $(id) {
  return document.getElementById(id);
}

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

function parseTaskDate(dateStr) {
  const [day, month, year] = dateStr.split('/');
  const correctedDate = `${month}/${day}/${year}`;
  const taskDate = new Date(correctedDate);
  return isNaN(taskDate) ? null : taskDate;
}

function updateUrgentDeadline(earliestDate) {
  const desktopDeadline = $("urgent-deadline");
  const mobileDeadline = $("urgent-deadline-mobile");
  const displayDate = formatUrgentDate(earliestDate);

  if (desktopDeadline) desktopDeadline.textContent = displayDate;
  if (mobileDeadline) mobileDeadline.textContent = displayDate;
}

function formatUrgentDate(date) {
  if (!date) return "Nothing";
  const month = date.toLocaleDateString('en-US', { month: 'long' });
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
}

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

function initMobileAnimations() {
  if (window.innerWidth > 900) return;

  animateDashboardHeader();
  animateTaskDashboardMobile();
}

function animateDashboardHeader() {
  setTimeout(() => {
    const header = document.querySelector('.dashboard-header');
    if (header) {
      header.style.transition = 'transform 1s ease, opacity 1s ease';
      header.style.transform = 'translateY(-25vh)';
      header.style.opacity = '0';
    }
  }, 1800);
}

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

onAuthStateChanged(auth, handleAuthChange);

function handleAuthChange(user) {
  if (user) updateUserInterface(user);
}

document.addEventListener('DOMContentLoaded', onDomContentLoaded);

function onDomContentLoaded() {
  initMobileAnimations();
  loadTaskCounts();
}