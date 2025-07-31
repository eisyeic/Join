// ===== FIREBASE SETUP =====
import {
  getDatabase,
  ref,
  push,
  onValue,
  remove,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { app } from "./firebase.js";

const db = getDatabase(app);
const dataRef = ref(db, "contacts");

// ===== CONTACT DISPLAY FUNCTIONS =====

// Clear container and handle empty data
function initializeContactContainer(data) {
  const dataContainer = $("all-contacts");
  dataContainer.innerHTML = "";

  if (!data) {
    dataContainer.innerHTML = `<div class="no-contacts">No Contacts</div>`;
    return null;
  }
  return dataContainer;
}

// Sort contacts alphabetically
function getSortedContacts(data) {
  return Object.entries(data).sort(([, a], [, b]) =>
    a.name.localeCompare(b.name)
  );
}

// Add letter header if first letter changed
function addLetterHeaderIfNeeded(firstLetter, dataContainer, currentLetter) {
  if (firstLetter !== currentLetter.value) {
    const letterHeader = document.createElement("div");
    letterHeader.classList.add("contact-abc-box");
    letterHeader.textContent = firstLetter;
    dataContainer.appendChild(letterHeader);
    currentLetter.value = firstLetter;
  }
}

// Create and append contact element
function createContactElement(id, key, dataContainer) {
  const renderContacts = document.createElement("div");
  renderContacts.classList.add("rendered-contacts");
  renderContacts.innerHTML = getContactPerson(key, renderContacts, id);
  dataContainer.appendChild(renderContacts);
}

// Render individual contact with letter header if needed
function renderSingleContact(id, key, dataContainer, currentLetter) {
  const firstLetter = key.name.charAt(0).toUpperCase();

  addLetterHeaderIfNeeded(firstLetter, dataContainer, currentLetter);
  createContactElement(id, key, dataContainer);
}

// Render sorted contacts with letter headers
function renderContactList(data, dataContainer) {
  const sortedEntries = getSortedContacts(data);
  let currentLetter = { value: "" };
  let contactIndex = 0;

  sortedEntries.forEach(([id, key]) => {
    if (!key.colorIndex) {
      key.colorIndex = (contactIndex % 15) + 1;
    }
    contactIndex++;
    renderSingleContact(id, key, dataContainer, currentLetter);
  });
}


// Process and render contact data
function processContactData(data) {
  const dataContainer = initializeContactContainer(data);
  if (dataContainer) {
    renderContactList(data, dataContainer);
  }
}

// Listen to Firebase data changes
function showAllData() {
  onValue(dataRef, (snapshot) => {
    const data = snapshot.val();
    processContactData(data);
  });
}

// ===== ADD CONTACT FUNCTIONS =====

// Get form data for new contact
function getNewContactData() {
  return {
    name: $("name-new-contact").value,
    email: $("email-new-contact").value,
    phone: $("phone-new-contact").value,
    colorIndex: colorIndex
  };
}


// Show success status and refresh data
function handleSaveSuccess(data) {
  const statusElement = $("check-status-add-contact");

  if (statusElement) {
    toggleAddContact();
    statusElement.classList.remove("d-none");
    setTimeout(() => {
      statusElement.classList.add("d-none");
    }, 4000);
  }

  console.log("Saved:", data);
  showAllData();
}

// Save data to Firebase
function saveToFirebase(data) {
  push(dataRef, data)
    .then(() => handleSaveSuccess(data))
    .catch((error) => console.error(error));
}

// ===== GLOBAL FUNCTIONS =====

// Delete contact from Firebase
window.deleteContact = () => {
  import(
    "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js"
  ).then(({ remove }) => {
    const contactRef = ref(db, `contacts/${currentContact.id}`);

    remove(contactRef).then(() => {
      document.getElementById("contact-details").innerHTML = "";
      console.log("Contact deleted:", currentContact.name);
    });
  });
};

// Save data
window.dataSave = () => {
  if (!validateAddContactForm()) {
    return;
  }
  colorIndex = (colorIndex % 15) + 1;
  const data = getNewContactData();
  saveToFirebase(data);
};




// ===== INITIALIZATION =====

// Show all data immediately on load
showAllData();
