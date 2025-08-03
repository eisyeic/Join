import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { auth, app } from "./firebase.js";

const db = getDatabase(app);

// ===== UTILITY FUNCTIONS =====

function getInitials(name) {
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 5) return "Good Night";
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

// ===== TASK MANAGEMENT =====

function loadTaskCounts() {
  const tasksRef = ref(db, "tasks");
  
  onValue(tasksRef, (snapshot) => {
    const tasks = snapshot.val();
    
    const counts = {
      todo: 0,
      inProgress: 0,
      awaitFeedback: 0,
      done: 0,
      urgent: 0,
      total: 0
    };
    
    if (tasks) {
      for (let taskId in tasks) {
        const task = tasks[taskId];
        counts.total++;
        
        if (task.column === 'todo') counts.todo++;
        if (task.column === 'inProgress') counts.inProgress++;
        if (task.column === 'awaitFeedback') counts.awaitFeedback++;
        if (task.column === 'done') counts.done++;
        if (task.priority === 'urgent') counts.urgent++;
      }
    } 
    updateTaskCountElements(counts);
  });
}

function updateTaskCountElements(counts) {
  // Desktop elements
  const elements = {
    todo: $("task-to-do-text"),
    inProgress: $("task-in-progress-text"),
    awaitFeedback: $("task-awaiting-feedback-text"),
    done: $("task-done-text"),
    urgent: $("task-urgent-text"),
    total: $("task-on-board-text")
  };

  if (elements.todo) elements.todo.innerText = counts.todo;
  if (elements.inProgress) elements.inProgress.innerText = counts.inProgress;
  if (elements.awaitFeedback) elements.awaitFeedback.innerText = counts.awaitFeedback;
  if (elements.done) elements.done.innerText = counts.done;
  if (elements.urgent) elements.urgent.innerText = counts.urgent;
  if (elements.total) elements.total.innerText = counts.total;

  // Mobile elements
  const mobileElements = {
    todo: $("task-to-do-text-mobile"),
    inProgress: $("task-in-progress-text-mobile"),
    awaiting: $("task-awaiting-feedback-text-mobile"),
    done: $("task-done-text-mobile"),
    urgent: $("task-urgent-text-mobile"),
    total: $("task-on-board-text-mobile")
  };

  if (mobileElements.todo) mobileElements.todo.innerText = counts.todo;
  if (mobileElements.inProgress) mobileElements.inProgress.innerText = counts.inProgress;
  if (mobileElements.awaiting) mobileElements.awaiting.innerText = counts.awaitFeedback;
  if (mobileElements.done) mobileElements.done.innerText = counts.done;
  if (mobileElements.urgent) mobileElements.urgent.innerText = counts.urgent;
  if (mobileElements.total) mobileElements.total.innerText = counts.total;
}

// ===== USER AUTHENTICATION =====

function updateUserInterface(user) {
  const name = user.displayName || "User";
  const greeting = getGreeting();
  const elements = {
    username: document.getElementById("username"),
    greeting: document.getElementById("greeting"),
    initials: document.getElementById("person-icon-header-text")
  };

  if (elements.username && name !== "User") {
    elements.username.textContent = name;

    if (elements.greeting) {
      elements.greeting.textContent = greeting + ",";
      elements.greeting.style.fontSize = "48px";
      elements.greeting.style.fontWeight = "400";
    }

    if (elements.initials) {
      const initials = getInitials(name);
      elements.initials.textContent = initials;
      elements.initials.style.fontSize = initials.length === 2 ? "22px" : "30px";
    }
  }
}

// ===== ANIMATIONS =====

function initMobileAnimations() {
  if (window.innerWidth > 900) return;

  setTimeout(() => {
    const dashboardHeader = document.querySelector('.dashboard-header');
    if (dashboardHeader) {
      dashboardHeader.style.transition = 'transform 0.8s ease';
      dashboardHeader.style.transform = 'translateY(-25vh)';
    }
  }, 2500);

  setTimeout(() => {
    const taskDashboardMobile = document.querySelector('.task-dashboard-mobile');
    if (taskDashboardMobile) {
      taskDashboardMobile.style.transition = 'transform 0.6s ease, opacity 0.6s ease';
      taskDashboardMobile.style.transform = 'translateY(0)';
      taskDashboardMobile.style.opacity = '1';
    }
  }, 2800);
}

// ===== INITIALIZATION =====

onAuthStateChanged(auth, (user) => {
  if (user) {
    updateUserInterface(user);
  }
});

document.addEventListener('DOMContentLoaded', () => {
  initMobileAnimations();
  loadTaskCounts();
});