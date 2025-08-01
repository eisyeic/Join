import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { auth } from "./firebase.js";

// Funktion für Initialen
function getInitials(name) {
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

// Animation
document.addEventListener('DOMContentLoaded', () => {
  if (window.innerWidth <= 900) {
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
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    const name = user.displayName || "User";
    const greeting = getGreeting();
    console.log(`${greeting}, ${name}!`);

    const usernameElement = document.getElementById("username");
    const greetingElement = document.getElementById("greeting");
    const initialsElement = document.getElementById("person-icon-header-text");

    if (usernameElement && name !== "User") {
      usernameElement.textContent = name;

      if (greetingElement) {
        greetingElement.textContent = greeting + ",";
        greetingElement.style.fontSize = "48px";
        greetingElement.style.fontWeight = "400";
      }

      if (initialsElement) {
        const initials = getInitials(name);
        initialsElement.textContent = initials;

        if (initials.length === 2) {
          initialsElement.style.fontSize = "22px";
        } else {
          initialsElement.style.fontSize = "30px";
        }
      }
    }
  }
});

// Time of day ! ungetestet !
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 5) return "Good Night";
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}
