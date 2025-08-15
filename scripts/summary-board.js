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
    
    let earliestUrgentDate = null;
    
    if (tasks) {
      for (let taskId in tasks) {
        const task = tasks[taskId];
        counts.total++;
        
        if (task.column === 'todo') counts.todo++;
        if (task.column === 'inProgress') counts.inProgress++;
        if (task.column === 'awaitFeedback') counts.awaitFeedback++;
        if (task.column === 'done') counts.done++;
        if (task.priority === 'urgent') {
          counts.urgent++;
          if (task.dueDate) {
            const [day, month, year] = task.dueDate.split('/');
            const correctedDate = `${month}/${day}/${year}`;
            const taskDate = new Date(correctedDate);
            if (!earliestUrgentDate || taskDate < earliestUrgentDate) {
              earliestUrgentDate = taskDate;
            }
          }
        }
      }
    }
    
    updateTaskCountElements(counts);
    updateUrgentDeadline(earliestUrgentDate);
  });
}

function updateUrgentDeadline(earliestDate) {
  const desktopDeadline = $("urgent-deadline");
  const mobileDeadline = $("urgent-deadline-mobile");
  
  let displayDate = "Nothing";
  
  if (earliestDate) {
    const dateStr = earliestDate.toString();
    const parsedDate = new Date(dateStr);
    
    const month = parsedDate.toLocaleDateString('en-US', { month: 'long' });
    const day = parsedDate.getDate();
    const year = parsedDate.getFullYear();
    displayDate = `${month} ${day}, ${year}`;
  }
  
  if (desktopDeadline) desktopDeadline.textContent = displayDate;
  if (mobileDeadline) mobileDeadline.textContent = displayDate;
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
  if (!element || isNaN(target)) {
    return;
  }

  let current = 0;
  const maxFakeCount = 9;
  const delay = 10;

  if (element.counterInterval) {
    clearInterval(element.counterInterval);
  }
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
      // Verwende die globale updateUserInitials Funktion
      if (window.updateUserInitials) {
        window.updateUserInitials(user);
      }
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