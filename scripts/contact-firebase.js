/**
 * @file Contacts: Firebase subscription, alphabetical rendering, add/delete contacts.
 * Functions are ≤14 lines and single-purpose. Public APIs unchanged.
 *
 * @typedef {Object} Contact
 * @property {string} name
 * @property {string} email
 * @property {string} phone
 * @property {number} colorIndex
 * @property {string} initials
 */
// Contacts module: Firebase subscription, alphabetical rendering, add/delete contacts

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


/** Listen to auth changes and delegate to handler. */
function setupAuthListener() {
  onAuthStateChanged(auth, handleAuthChange);
}
/** Projects user initials to the UI (if hook is present). */
function handleAuthChange(user) {
  if (window.updateUserInitials) window.updateUserInitials(user);
}


/** Firebase DB handle and contacts ref */
const db = getDatabase(app);
const dataRef = ref(db, "contacts");
let loadedContacts = {};



/** Prepare contacts container; shows empty state if no data. */
function initializeContactContainer(data) {
  const box = document.getElementById("all-contacts");
  box.innerHTML = "";
  if (!data) {
    box.innerHTML = `<div class="no-contacts">No Contacts</div>`;
    return null;
  }
  return box;
}

/** Return entries sorted by name (case-insensitive). */
function getSortedContacts(data) {
  return Object.entries(data).sort(([, a], [, b]) =>
    (a?.name || "").localeCompare(b?.name || "", undefined, { sensitivity: "base" })
  );
}

/** Add an alphabet letter header if the letter changed. */
function addLetterHeaderIfNeeded(firstLetter, container, currentLetter) {
  if (firstLetter === currentLetter.value) return;
  const hdr = document.createElement("div");
  hdr.classList.add("contact-abc-box");
  hdr.textContent = firstLetter;
  container.appendChild(hdr);
  currentLetter.value = firstLetter;
}

/** Append a single rendered contact element. */
function createContactElement(id, contact, container) {
  const wrapper = document.createElement("div");
  wrapper.classList.add("rendered-contacts");
  wrapper.innerHTML = getContactPerson(contact, id); // external template fn
  container.appendChild(wrapper);
}

/** Render one contact with optional letter header. */
function renderSingleContact(id, contact, container, currentLetter) {
  const first = (contact.name || "").charAt(0).toUpperCase();
  addLetterHeaderIfNeeded(first, container, currentLetter);
  createContactElement(id, contact, container);
}

/**
 * Assign a colorIndex if missing and persist to Firebase. Returns ensured color.
 * @param {string} id
 * @param {Contact} c
 * @param {Set<number>} usedColors
 * @param {number} i
 * @returns {number}
 */
function ensureAndPersistColorIndex(id, c, usedColors, i) {
  if (c.colorIndex) return c.colorIndex;
  let colorIndex = 1;
  while (usedColors.has(colorIndex) && colorIndex <= 15) colorIndex++;
  if (colorIndex > 15) colorIndex = (i % 15) + 1;
  c.colorIndex = colorIndex;
  import("https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js")
    .then(({ update, ref }) => { update(ref(db, `contacts/${id}`), { colorIndex }); });
  return colorIndex;
}

/**
 * Render the full contact list with alphabetical headers.
 * @param {Record<string, Contact>} data
 * @param {HTMLElement} container
 */
function renderContactList(data, container) {
  const entries = getSortedContacts(data);
  const currentLetter = { value: "" };
  const usedColors = new Set();
  entries.forEach(([id, c], i) => {
    const color = ensureAndPersistColorIndex(id, c, usedColors, i);
    usedColors.add(color);
    renderSingleContact(id, c, container, currentLetter);
  });
}

/** Process Firebase data and render the contact list. */
function processContactData(data) {
  const container = initializeContactContainer(data);
  if (container) renderContactList(/** @type {Record<string, any>} */ (data), container);
}

/** Subscribe to /contacts and render on every change. */
function showAllData() {
  onValue(dataRef, (snapshot) => {
    const data = snapshot.val();
    loadedContacts = data || {};
    processContactData(data);
  });
}



/** Collect new-contact form values. */
function getNewContactData() {
  const name = document.getElementById("name-new-contact")?.value || "";
  return {
    name,
    email: document.getElementById("email-new-contact")?.value || "",
    phone: document.getElementById("phone-new-contact")?.value || "",
    colorIndex: window.colorIndex,
    initials: window.getInitials?.(name) || "",
  };
}

/** Handle successful save: toggle UI status and refresh list */
function handleSaveSuccess(data) {
  const statusElement = getCheckStatusElement();
  if (!statusElement) return;
  
  toggleAddContactIfAvailable();
  showTemporarySuccessStatus(statusElement);
}

/** Get check status element */
function getCheckStatusElement() {
  return document.getElementById("check-status-add-contact");
}

/** Toggle add contact if function is available */
function toggleAddContactIfAvailable() {
  if (window.toggleAddContact) window.toggleAddContact();
}

/** Show temporary success status */
function showTemporarySuccessStatus(element) {
  element.classList.remove("d-none");
  setTimeout(() => element.classList.add("d-none"), 4000);
}

/** Push a new contact into Firebase. */
function saveToFirebase(data) {
  push(dataRef, data)
    .then(() => handleSaveSuccess(data))
    .catch((err) => console.error("Save failed:", err));
}

/** Delete the currently selected contact. */
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

/** Get next available color index (1..15) */
function getNextColorIndex() {
  const usedColors = collectUsedColorIndices();
  return findNextAvailableColorIndex(usedColors);
}

/** Collect used color indices from loaded contacts */
function collectUsedColorIndices() {
  const usedColors = new Set();
  Object.values(loadedContacts).forEach(contact => {
    if (contact.colorIndex) usedColors.add(contact.colorIndex);
  });
  return usedColors;
}

/** Find next available color index or return random */
function findNextAvailableColorIndex(usedColors) {
  for (let i = 1; i <= 15; i++) {
    if (!usedColors.has(i)) return i;
  }
  return Math.floor(Math.random() * 15) + 1;
}

/** Validate and save a new contact. */
window.dataSave = () => {
  if (!validateAddContactForm()) return; // external validator
  window.colorIndex = getNextColorIndex();
  saveToFirebase(getNewContactData());
};

/** Renders contacts for AddTask dropdown with selection functionality. */
window.renderContactsForAddTask = function(contacts, container) {
  for (const id in contacts) {
    const contact = contacts[id];
    const li = createAddTaskContactItem(contact, id);
    container.appendChild(li);
  }
};

/** Build inner HTML for an AddTask contact list item. */
/** @param {Contact} contact */
function getAddTaskItemHTML(contact) {
  return `
    <div>
      <div class="contact-initial" style="background-image: url(../assets/icons/contact/color${contact.colorIndex}.svg)">
        ${contact.initials}
      </div>
      ${contact.name}
    </div>
    <img src="./assets/icons/add_task/check_default.svg" alt="checkbox" />
  `;
}

/** Toggle selected state and checkbox icon for a <li> */
/** @param {HTMLLIElement} li */
function toggleListItemSelection(li) {
  toggleSelectionState(li);
  updateCheckboxIcon(li);
}

/** Toggle selection state of list item */
function toggleSelectionState(li) {
  li.classList.toggle("selected");
}

/** Update checkbox icon based on selection state */
function updateCheckboxIcon(li) {
  const icon = li.querySelector("img");
  if (!icon) return;
  icon.src = getCheckboxIconPath(li);
}

/** Get checkbox icon path based on selection */
function getCheckboxIconPath(li) {
  return li.classList.contains("selected")
    ? "./assets/icons/add_task/check_white.svg"
    : "./assets/icons/add_task/check_default.svg";
}

/** Handle click on AddTask contact item. */
/** @param {HTMLLIElement} li */
function onAddTaskItemClick(li) {
  toggleListItemSelection(li);
  renderSelectedContactInitials();
}

/** Creates contact list item for AddTask with selection functionality */
function createAddTaskContactItem(contact, id) {
  const li = document.createElement("li");
  li.id = id;
  li.innerHTML = getAddTaskItemHTML(contact);
  li.addEventListener("click", () => onAddTaskItemClick(li));
  return li;
}

/** Renders selected contact initials for AddTask. */
function renderSelectedContactInitials() {
  let selectedLis = document.querySelectorAll("#contact-list-box li.selected");
  let contactInitialsBox = document.getElementById("contact-initials");
  if (!contactInitialsBox) return;
  contactInitialsBox.innerHTML = "";
  selectedLis.forEach((li) => {
    let initialsEl = li.querySelector(".contact-initial");
    if (initialsEl) {
      let clone = initialsEl.cloneNode(true);
      contactInitialsBox.appendChild(clone);
    }
  });
}

/** Normalize search input value to lowercase trimmed string. */
/** @param {Event} e
 * @returns {string}
 */
function getSearchValue(e) {
  return String(e.target.value || "").trim().toLowerCase();
}

/** Filter contacts by name parts starting with value. 
 * @param {string} value
 * @param {Record<string, Contact>} contacts
 * @returns {Record<string, Contact>}
 */
function filterContactsByValue(value, contacts) {
  if (!value) return { ...(contacts || {}) };
  const filtered = {};
  for (const id in (contacts || {})) {
    const name = String(contacts[id].name || "").toLowerCase();
    const parts = name.split(" ").filter(Boolean);
    if (parts.some((p) => p.startsWith(value))) filtered[id] = contacts[id];
  }
  return filtered;
}

/** Re-render the AddTask contact list box with provided contacts.
 * @param {HTMLElement} listBox
 * @param {Record<string, Contact>} contactsMap
 */
function rerenderAddTaskList(listBox, contactsMap) {
  listBox.innerHTML = "";
  window.renderContactsForAddTask(contactsMap, listBox);
}

/** Filters contacts for AddTask input. */
window.onContactInputForAddTask = function(e) {
  const value = getSearchValue(e);
  const listBox = document.getElementById("contact-list-box");
  if (!listBox) return;
  listBox.classList.remove("d-none");
  const filtered = filterContactsByValue(value, loadedContacts);
  rerenderAddTaskList(listBox, filtered);
};

/** Initialize the contact module. */
function initContacts() {
  setupAuthListener();
  showAllData();
}

// Start initialization on page load
initContacts();


/**
 * Validates the name field; sets UI error if invalid.
 * @param {string} name
 * @returns {boolean}
 */
function validateEditNameField(name) {
  if (!name) {
    showFieldError("edit-name-input", "Name is required");
    return false;
  }
  return true;
}

/**
 * Validates the email field; sets UI error if invalid.
 * @param {string} email
 * @returns {boolean}
 */
function validateEditEmailField(email) {
  if (!email) {
    showFieldError("edit-email-input", "E-Mail is required");
    return false;
  } else if (!isValidEmail(email)) {
    showFieldError("edit-email-input", "Please enter a valid email address");
    return false;
  }
  return true;
}

/**
 * Validates the phone field; sets UI error if invalid.
 * @param {string} phone
 * @returns {boolean}
 */
function validateEditPhoneField(phone) {
  if (!phone) {
    showFieldError("edit-phone-input", "Phone is required");
    return false;
  }
  return true;
}

/**
 * Validates all edit contact fields and returns whether the form is valid.
 * @param {{name:string,email:string,phone:string}} values
 * @returns {boolean}
 */
function validateEditFormFields(values) {
  const nameValid = validateEditNameField(values.name);
  const emailValid = validateEditEmailField(values.email);
  const phoneValid = validateEditPhoneField(values.phone);

  return nameValid && emailValid && phoneValid;
}

/** Validates the edit contact form by reading values and applying validators. */
function validateEditContactForm() {
  const values = getEditFormValues();
  clearEditFormErrors();
  return validateEditFormFields(values);
}

/** Validate & save edited contact; updates Firebase and guards against menu re-open. */
function saveEditedContact() {
  const ev = (typeof window !== 'undefined' && window.event) ? window.event : null;
  ev?.stopPropagation?.();
  _swallowNextDocClick = true; setTimeout(() => { _swallowNextDocClick = false; }, 300);
  _suppressMobileNavbar = true; setTimeout(()=>{ _suppressMobileNavbar = false; }, 350);
  if (!validateEditContactForm()) return;
  getUpdatedContactData();
  updateContactInFirebase();
}

/** Delete current contact and navigate back in mobile layout. */
function deleteContactAndGoBack(event) {
  event.stopPropagation();
  deleteContact();
  detailsMobileBack();
}