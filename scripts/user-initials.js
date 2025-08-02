import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { auth } from "./firebase.js";

// Funktion für Initialen
function getInitials(name) {
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    const name = user.displayName || "User";
    const initialsElement = document.getElementById("person-icon-header-text");

    if (initialsElement && name !== "User") {
      const initials = getInitials(name);
      initialsElement.textContent = initials;
      
      // Schriftgröße anpassen: 22px bei 2 Buchstaben, 30px bei 1 Buchstabe
      if (initials.length === 2) {
        initialsElement.style.fontSize = "22px";
      } else {
        initialsElement.style.fontSize = "30px";
      }
    }
  }
});