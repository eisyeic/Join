/* eslint-env browser */
/* eslint-disable no-undef */
/**
 * @file Contacts module: Firebase subscription, alphabetical rendering,
 *       add/delete contacts. JSDoc-annotated. Every function ≤ 14 lines.
 */

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

// -- Auth initials -----------------------------------------------------------

onAuthStateChanged(auth, handleAuthChange);
/**
 * Projects user initials to the UI (if hook is present).
 * @param {import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js").User|null} user
 */
function handleAuthChange(user) {
  if (window.updateUserInitials) window.updateUserInitials(user);
}

// -- Firebase setup ----------------------------------------------------------

/** Firebase DB handle and contacts ref. */
const db = getDatabase(app);
const dataRef = ref(db, "contacts");

// -- Contact rendering --------------------------------------------------------

/**
 * Prepare the contacts container; show empty state if no data.
 * @param {Record<string, any>|null} data
 * @returns {HTMLElement|null}
 */
function initializeContactContainer(data) {
  const box = $("all-contacts");
  box.innerHTML = "";
  if (!data) {
    box.innerHTML = `<div class="no-contacts">No Contacts</div>`;
    return null;
  }
  return box;
}

/**
 * Return entries sorted by name (case-insensitive).
 * @param {Record<string, any>} data
 */
function getSortedContacts(data) {
  return Object.entries(data).sort(([, a], [, b]) =>
    (a?.name || "").localeCompare(b?.name || "", undefined, { sensitivity: "base" })
  );
}

/**
 * Add an alphabet letter header if the letter changed.
 * @param {string} firstLetter
 * @param {HTMLElement} container
 * @param {{value:string}} currentLetter
 */
function addLetterHeaderIfNeeded(firstLetter, container, currentLetter) {
  if (firstLetter === currentLetter.value) return;
  const hdr = document.createElement("div");
  hdr.classList.add("contact-abc-box");
  hdr.textContent = firstLetter;
  container.appendChild(hdr);
  currentLetter.value = firstLetter;
}

/**
 * Append a single rendered contact element.
 * @param {string} id
 * @param {{name:string}} contact
 * @param {HTMLElement} container
 */
function createContactElement(id, contact, container) {
  const wrapper = document.createElement("div");
  wrapper.classList.add("rendered-contacts");
  wrapper.innerHTML = getContactPerson(contact, id); // external template fn
  container.appendChild(wrapper);
}

/**
 * Render one contact with optional letter header.
 * @param {string} id
 * @param {{name:string,colorIndex?:number}} contact
 * @param {HTMLElement} container
 * @param {{value:string}} currentLetter
 */
function renderSingleContact(id, contact, container, currentLetter) {
  const first = (contact.name || "").charAt(0).toUpperCase();
  addLetterHeaderIfNeeded(first, container, currentLetter);
  createContactElement(id, contact, container);
}

/**
 * Render the full contact list with alphabetical headers.
 * @param {Record<string, any>} data
 * @param {HTMLElement} container
 */
function renderContactList(data, container) {
  const entries = getSortedContacts(data);
  const currentLetter = { value: "" };
  entries.forEach(([id, c], i) => {
    if (!c.colorIndex) c.colorIndex = (i % 15) + 1;
    renderSingleContact(id, c, container, currentLetter);
  });
}

/**
 * Process Firebase data and render the contact list.
 * @param {Record<string, any>|null} data
 */
function processContactData(data) {
  const container = initializeContactContainer(data);
  if (container) renderContactList(/** @type {Record<string, any>} */ (data), container);
}

/** Subscribe to /contacts and render on every change. */
function showAllData() {
  onValue(dataRef, (snapshot) => {
    processContactData(snapshot.val());
  });
}

// -- Add contact -------------------------------------------------------------

/**
 * Collect new-contact form values.
 * @returns {{name:string,email:string,phone:string,colorIndex:number,initials:string}}
 */
function getNewContactData() {
  const name = $("name-new-contact").value || "";
  return {
    name,
    email: $("email-new-contact").value || "",
    phone: $("phone-new-contact").value || "",
    colorIndex: window.colorIndex,
    initials: getInitials(name), // external helper
  };
}

/**
 * Handle successful save: toggle UI status and refresh list.
 * @param {any} data
 */
function handleSaveSuccess(data) {
  const el = $("check-status-add-contact");
  if (el) {
    toggleAddContact(); // external: close modal
    el.classList.remove("d-none");
    setTimeout(() => el.classList.add("d-none"), 4000);
  }
}

/**
 * Push a new contact into Firebase.
 * @param {ReturnType<typeof getNewContactData>} data
 */
function saveToFirebase(data) {
  push(dataRef, data)
    .then(() => handleSaveSuccess(data))
    .catch((err) => console.error("Save failed:", err));
}

/**
 * Delete the currently selected contact.
 * Relies on global `currentContact` ({ id, name }).
 */
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


/**
 * Validate and save a new contact.
 * Uses external `validateAddContactForm()` and updates rotating colorIndex.
 */
window.dataSave = () => {
  if (!validateAddContactForm()) return; // external validator
  window.colorIndex = (window.colorIndex % 15) + 1;
  saveToFirebase(getNewContactData());
};

/** Start realtime subscription on page load. */
showAllData();
