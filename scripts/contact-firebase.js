// utility
let $ = id => document.getElementById(id);

// Realtime Database

import {
  getDatabase,
  ref,
  push,
  onValue,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { app } from "./firebase.js";

const db = getDatabase(app);
const dataRef = ref(db, "contacts");

function showAllData() {
  onValue(dataRef, (snapshot) => {
    const dataContainer = $("all-contacts");
    dataContainer.innerHTML = "";

    const data = snapshot.val();
    if (!data) {
      dataContainer.innerHTML = `
      <div class="no-contacts">No Contacts<div>`;
      return;
    }

    // Durch alle Datensätze iterieren
    Object.entries(data).forEach(([id, key]) => {
      const renderContacts = document.createElement("div");
      renderContacts.classList.add("rendered-contacts");
      renderContacts.innerHTML = getContactPerson(key, renderContacts);

      dataContainer.appendChild(renderContacts);
    });
  });
}

// Funktion für Initialen - global verfügbar
window.getInitials = function(name) {
  const words = name.split(' ');
  const firstInitial = words[0] ? words[0][0].toUpperCase() : '';
  const secondInitial = words[1] ? words[1][0].toUpperCase() : '';
  return firstInitial + secondInitial;
};


// daten speichern
window.dataSave = () => {
  const name = $("name-new-contact").value;
  const email = $("email-new-contact").value;
  const phone = $("phone-new-contact").value;
  const statusElement = $("check-status-add-contact");

  const data = { name, phone, email };

  push(dataRef, data)
    .then(() => {
      if (statusElement) {
        toggleAddContact()
        statusElement.classList.remove("d-none");
        
        // Nach 4 Sekunden (Dauer der Animation) wieder verstecken
        setTimeout(() => {
          statusElement.classList.add("d-none");
        }, 4000);
      }
      console.log("Gespeichert:", data);
      showAllData();
    })
    .catch((error) => {
      console.error(error);
    });
};


// Direkt beim Laden alle Daten anzeigen
showAllData();
