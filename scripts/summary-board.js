import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { auth } from "./firebase.js";

onAuthStateChanged(auth, user => {
  if (user) {
    const name = user.displayName || "User";
    const greeting = getGreeting();
    console.log(`${greeting}, ${name}!`);

 // To Do:  hier noch anpassen damit im HTML angezeigt wird!
    const greetingElement = document.getElementById("greeting");
    if (greetingElement) {
      greetingElement.textContent = `${greeting}, ${name}!`;
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