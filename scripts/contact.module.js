import {
  getDatabase,
  ref,
  push,
  onValue,
  remove,
  child
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { app, auth } from "./firebase.js";

onAuthStateChanged(auth, handleAuthChange);

function handleAuthChange(user) {
  if (window.updateUserInitials) window.updateUserInitials(user);
}

const db = getDatabase(app);
const dataRef = ref(db, "contacts");

function initializeContactContainer(data) {
  const box = $("all-contacts");
  box.innerHTML = "";
  if (!data) {
    box.innerHTML = `<div class="no-contacts">No Contacts</div>`;
    return null;
  }
  return box;
}

function getSortedContacts(data) {
  return Object.entries(data).sort(([, a], [, b]) =>
    (a?.name || "").localeCompare(b?.name || "", undefined, { sensitivity: "base" })
  );
}

function addLetterHeaderIfNeeded(firstLetter, container, currentLetter) {
  if (firstLetter === currentLetter.value) return;
  const hdr = document.createElement("div");
  hdr.classList.add("contact-abc-box");
  hdr.textContent = firstLetter;
  container.appendChild(hdr);
  currentLetter.value = firstLetter;
}

function createContactElement(id, contact, container) {
  const wrapper = document.createElement("div");
  wrapper.classList.add("rendered-contacts");
  wrapper.innerHTML = getContactPerson(contact, id); 
  container.appendChild(wrapper);
}

function renderSingleContact(id, contact, container, currentLetter) {
  const first = (contact.name || "").charAt(0).toUpperCase();
  addLetterHeaderIfNeeded(first, container, currentLetter);
  createContactElement(id, contact, container);
}

function renderContactList(data, container) {
  const entries = getSortedContacts(data);
  const currentLetter = { value: "" };
  entries.forEach(([id, c], i) => {
    if (!c.colorIndex) c.colorIndex = (i % 15) + 1;
    renderSingleContact(id, c, container, currentLetter);
  });
}

function processContactData(data) {
  const container = initializeContactContainer(data);
  if (container) renderContactList((data), container);
}

(function showAllData() {
  onValue(dataRef, (snapshot) => {
    processContactData(snapshot.val());
  });
})();

function getNewContactData() {
  const name = $("name-new-contact").value || "";
  return {
    name,
    email: $("email-new-contact").value || "",
    phone: $("phone-new-contact").value || "",
    colorIndex: window.colorIndex,
    initials: getInitials(name), 
  };
}

function handleSaveSuccess(data) {
  const el = $("check-status-add-contact");
  if (el) {
    toggleAddContact(); 
    el.classList.remove("d-none");
    setTimeout(() => el.classList.add("d-none"), 4000);
  }
}

function saveToFirebase(data) {
  push(dataRef, data)
    .then(() => handleSaveSuccess(data))
    .catch((err) => console.error("Save failed:", err));
}

window.deleteContact = async () => {
  const key = typeof currentContact?.id === "string" ? currentContact.id.trim() : "";
  if (!key) {
    console.warn("Abbruch: Kein Push-Key in currentContact.id:", currentContact);
    return;
  }
  try {
    await remove(child(dataRef, key));  
    document.getElementById("contact-details")?.replaceChildren();
  } catch (err) {
    console.error("Delete failed:", err);
  }
};

window.dataSave = () => {
  if (!validateAddContactForm()) return; 
  window.colorIndex = (window.colorIndex % 15) + 1;
  saveToFirebase(getNewContactData());
};
