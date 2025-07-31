// ===== FIREBASE SETUP =====
import {
  getDatabase,
  ref,
  push,
  onValue,
  remove,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { app } from "./firebase.js";

// Initialize Firebase database connection
const db = getDatabase(app);
const dataRef = ref(db, "contacts");

// ===== CONTACT DISPLAY FUNCTIONS =====

// Initializes the contact container and handles empty data state

function initializeContactContainer(data) {
  const dataContainer = $("all-contacts");
  dataContainer.innerHTML = "";

  if (!data) {
    dataContainer.innerHTML = `<div class="no-contacts">No Contacts</div>`;
    return null;
  }
  return dataContainer;
}

// Sorts contacts alphabetically by name
function getSortedContacts(data) {
  return Object.entries(data).sort(([, a], [, b]) =>
    a.name.localeCompare(b.name)
  );
}

// Adds alphabetical letter header if the first letter changes
function addLetterHeaderIfNeeded(firstLetter, dataContainer, currentLetter) {
  if (firstLetter !== currentLetter.value) {
    const letterHeader = document.createElement("div");
    letterHeader.classList.add("contact-abc-box");
    letterHeader.textContent = firstLetter;
    dataContainer.appendChild(letterHeader);
    currentLetter.value = firstLetter;
  }
}

// Creates and appends a contact element to the container
function createContactElement(id, key, dataContainer) {
  const renderContacts = document.createElement("div");
  renderContacts.classList.add("rendered-contacts");
  renderContacts.innerHTML = getContactPerson(key, renderContacts, id);
  dataContainer.appendChild(renderContacts);
}

// Renders a single contact with letter header if needed
function renderSingleContact(id, key, dataContainer, currentLetter) {
  const firstLetter = key.name.charAt(0).toUpperCase();

  addLetterHeaderIfNeeded(firstLetter, dataContainer, currentLetter);
  createContactElement(id, key, dataContainer);
}

// Renders the complete contact list with alphabetical headers
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

// Processes and renders contact data from Firebase
function processContactData(data) {
  const dataContainer = initializeContactContainer(data);
  if (dataContainer) {
    renderContactList(data, dataContainer);
  }
}

// Sets up Firebase listener for real-time contact data updates
function showAllData() {
  onValue(dataRef, (snapshot) => {
    const data = snapshot.val();
    processContactData(data);
  });
}

// ===== ADD CONTACT FUNCTIONS =====

// Retrieves form data for creating a new contact
function getNewContactData() {
  const name = $("name-new-contact").value;
  return {
    name: $("name-new-contact").value,
    email: $("email-new-contact").value,
    phone: $("phone-new-contact").value,
    colorIndex: window.colorIndex,
    initials: getInitials(name)
  };
}

// Handles successful contact save operation
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

// Saves contact data to Firebase database
function saveToFirebase(data) {
  push(dataRef, data)
    .then(() => handleSaveSuccess(data))
    .catch((error) => console.error(error));
}

// ===== GLOBAL FUNCTIONS =====

// Deletes the currently selected contact from Firebase, Global function accessible from HTML onclick events
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

// Validates and saves new contact data to Firebase, Global function accessible from HTML onclick events

window.dataSave = () => {
  if (!validateAddContactForm()) {
    return;
  }
  window.colorIndex = (window.colorIndex % 15) + 1;
  const data = getNewContactData();
  saveToFirebase(data);
};

// ===== INITIALIZATION =====

// Initialize contact display on page load
showAllData();
