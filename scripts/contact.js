// ===== GLOBAL VARIABLES =====

// Color index for contact icons (cycles through 15 colors)
window.colorIndex = 0;

// ===== UTILITY FUNCTIONS =====

/**
 * Generates initials from a full name
 * @param {string} name - Full name of the contact
 * @returns {string} - Two-letter initials (e.g., "John Doe" -> "JD")
 */
window.getInitials = function (name) {
  const words = name.split(" ");
  const firstInitial = words[0] ? words[0][0].toUpperCase() : "";
  const secondInitial = words[1] ? words[1][0].toUpperCase() : "";
  return firstInitial + secondInitial;
};

// ===== OVERLAY TOGGLE FUNCTIONS =====

/**
 * Clears all input fields in the add contact form and removes error states
 */
function clearAddFormInputs() {
  $("name-new-contact").value = "";
  $("email-new-contact").value = "";
  $("phone-new-contact").value = "";
  clearFieldError("name-new-contact");
  clearFieldError("email-new-contact");
  clearFieldError("phone-new-contact");
}

/**
 * Opens the add contact overlay and clears form inputs
 */
function openAddContact() {
  $("contact-overlay-close-add").classList.remove("d-none");
  clearAddFormInputs();
}

/**
 * Closes the add contact overlay and clears form inputs
 */
function closeAddContact() {
  $("contact-overlay-close-add").classList.add("d-none");
  clearAddFormInputs();
}

/**
 * Toggles the add contact overlay visibility without clearing inputs
 */
function toggleAddContact() {
  $("contact-overlay-close-add").classList.toggle("d-none");
}

/**
 * Toggles the edit contact overlay visibility
 */
function toggleEditContact() {
  $("contact-overlay-close-edit").classList.toggle("d-none");
}

/**
 * Displays detailed view of a selected contact
 * @param {string} name - Contact's name
 * @param {string} email - Contact's email
 * @param {string} phone - Contact's phone number
 * @param {number} colorIndex - Color index for contact icon
 * @param {string} id - Unique contact ID
 */
function showContactDetails(name, email, phone, colorIndex, id) {
  currentContact = { name, email, phone, colorIndex, id };
  const detailSection = document.getElementById("contact-details");

  getContactDeteails(name, email, phone, colorIndex, id, detailSection);
  detailSection.classList.remove("d-none");

  if (window.innerWidth <= 900) {
    $("contact-details").classList.add("mobile-visible");
    $("add-new-contact-container").style.display = "none";

    getNewLayoutDetails(name, email, phone, colorIndex, detailSection);
  }
}

/**
 * Returns to contact list view on mobile devices
 */
function detailsMobileBack() {
  $("contact-details").classList.remove("mobile-visible");
  $("contact-details").style.display = "none";
  $("add-new-contact-container").style.display = "block";
}

/**
 * Shows the mobile navigation bar for contact details
 */
function addDetailsMobileNavbar() {
  $("single-person-content-mobile-navbar").classList.remove("d-none");
}

/**
 * Hides the mobile navigation bar for contact details
 * @param {Event} event - Optional event object to prevent propagation
 */
function removeDetailsMobileNavbar(event) {
  if (event) {
    event.stopPropagation();
  }
  const element = $("single-person-content-mobile-navbar");
  if (element) {
    element.classList.add("d-none");
  }
}

// ===== EDIT CONTACT FUNCTIONS =====

/**
 * Retrieves all form elements needed for editing a contact
 * @returns {Object} Object containing references to form elements
 */
function getEditFormElements() {
  return {
    nameInput: $("edit-name-input"),
    emailInput: $("edit-email-input"),
    phoneInput: $("edit-phone-input"),
    iconImg: $("edit-icon-img"),
    iconText: $("edit-icon-text"),
  };
}

/**
 * Fills the edit form with current contact data
 * @param {Object} elements - Form elements object from getEditFormElements()
 */
function populateEditForm(elements) {
  elements.nameInput.value = currentContact.name;
  elements.emailInput.value = currentContact.email;
  elements.phoneInput.value = currentContact.phone;
  elements.iconImg.src = `./assets/general_elements/icons/color${currentContact.colorIndex}.svg`;
  elements.iconText.textContent = getInitials(currentContact.name);
}

/**
 * Opens the edit contact overlay and populates it with current contact data
 */
function openEditContact() {
  const elements = getEditFormElements();
  populateEditForm(elements);
  toggleEditContact();
}

// ===== SAVE CONTACT FUNCTIONS =====

/**
 * Retrieves updated contact data from the edit form and updates currentContact object
 */
function getUpdatedContactData() {
  currentContact.name = $("edit-name-input").value;
  currentContact.email = $("edit-email-input").value;
  currentContact.phone = $("edit-phone-input").value;
}

/**
 * Updates contact information in Firebase database and refreshes the display
 */
function updateContactInFirebase() {
  import(
    "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js"
  ).then(({ getDatabase, ref, update }) => {
    import("./firebase.js").then(({ app }) => {
      const db = getDatabase(app);
      const contactRef = ref(db, `contacts/${currentContact.id}`);

      update(contactRef, {
        name: currentContact.name,
        email: currentContact.email,
        phone: currentContact.phone,
        colorIndex: currentContact.colorIndex,
      }).then(() => {
        showContactDetails(
          currentContact.name,
          currentContact.email,
          currentContact.phone,
          currentContact.colorIndex
        );
        toggleEditContact(); 
      });
    });
  });
}

// ===== INPUT VALIDATION =====

/**
 * Validates phone number input to allow only valid characters
 * @param {Event} event - Keyboard event
 */
function validatePhoneInput(event) {
  const allowedChars = /[0-9+\-() ]/;
  if (
    !allowedChars.test(event.key) &&
    !["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight"].includes(
      event.key
    )
  ) {
    event.preventDefault();
  }
}

/**
 * Validates email format
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if email is valid
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates name input to allow only valid characters
 * @param {Event} event - Keyboard event
 */
function validateNameInput(event) {
  const allowedChars = /[a-zA-ZäöüÄÖÜß\s\-']/;
  if (
    !allowedChars.test(event.key) &&
    !["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight"].includes(
      event.key
    )
  ) {
    event.preventDefault();
  }
}

// ===== EVENT LISTENERS =====

/**
 * Initializes event listeners when DOM is loaded
 */
document.addEventListener("DOMContentLoaded", function () {
  $("edit-phone-input").addEventListener("keydown", validatePhoneInput);
  $("phone-new-contact").addEventListener("keydown", validatePhoneInput);
  $("name-new-contact").addEventListener("keydown", validateNameInput);
  $("edit-name-input").addEventListener("keydown", validateNameInput);
});

/**
 * Deletes contact and returns to contact list (mobile view)
 * @param {Event} event - Click event
 */
function deleteContactAndGoBack(event) {
  event.stopPropagation();
  deleteContact();
  detailsMobileBack();
}

// ===== ERROR HANDLING =====

/**
 * Displays error message for a specific input field
 * @param {string} fieldId - ID of the input field
 * @param {string} message - Error message to display
 */
function showFieldError(fieldId, message) {
  const field = $(fieldId);
  const placeholder = $(fieldId + "-placeholder");

  // Bestehende Add Contact Felder
  if (fieldId === "name-new-contact") {
    $("name-new-contact-box").innerHTML = `<p class="error-message">${message}</p>`;
  }
  if (fieldId === "email-new-contact") {
    $("email-new-contact-box").innerHTML = `<p class="error-message">${message}</p>`;
  }
  if (fieldId === "phone-new-contact") {
    $("phone-new-contact-box").innerHTML = `<p class="error-message">${message}</p>`;
  }

  // Neue Edit Contact Felder
  if (fieldId === "edit-name-input") {
    $("edit-name-input-box").innerHTML = `<p class="error-message">${message}</p>`;
  }
  if (fieldId === "edit-email-input") {
    $("edit-email-input-box").innerHTML = `<p class="error-message">${message}</p>`;
  }
  if (fieldId === "edit-phone-input") {
    $("edit-phone-input-box").innerHTML = `<p class="error-message">${message}</p>`;
  }

  field.style.borderColor = "red";
  field.classList.add("error-input");
  if (placeholder) {
    placeholder.classList.add("error-input-placeholder");
  }
}

/**
 * Clears error state and message for a specific input field
 * @param {string} fieldId - ID of the input field to clear
 */
function clearFieldError(fieldId) {
  const field = $(fieldId);
  const placeholder = $(fieldId + "-placeholder");

  // Bestehende Add Contact Felder
  if (fieldId === "name-new-contact") {
    $("name-new-contact-box").innerHTML = "";
  }
  if (fieldId === "email-new-contact") {
    $("email-new-contact-box").innerHTML = "";
  }
  if (fieldId === "phone-new-contact") {
    $("phone-new-contact-box").innerHTML = "";
  }

  // Neue Edit Contact Felder
  if (fieldId === "edit-name-input") {
    $("edit-name-input-box").innerHTML = "";
  }
  if (fieldId === "edit-email-input") {
    $("edit-email-input-box").innerHTML = "";
  }
  if (fieldId === "edit-phone-input") {
    $("edit-phone-input-box").innerHTML = "";
  }

  field.style.borderColor = "";
  field.classList.remove("error-input");
  if (placeholder) {
    placeholder.classList.remove("error-input-placeholder");
  }
}

/**
 * Validates the edit contact form inputs
 * @returns {boolean} - True if all fields are valid, false otherwise
 */
function validateEditContactForm() {
  let isValid = true;

  const name = $("edit-name-input").value.trim();
  const email = $("edit-email-input").value.trim();
  const phone = $("edit-phone-input").value.trim();

  clearFieldError("edit-name-input");
  clearFieldError("edit-email-input");
  clearFieldError("edit-phone-input");

  if (!name) {
    showFieldError("edit-name-input", "Name is required");
    isValid = false;
  }

  if (!email) {
    showFieldError("edit-email-input", "E-Mail is required");
    isValid = false;
  } else if (!isValidEmail(email)) {
    showFieldError("edit-email-input", "Please enter a valid email address");
    isValid = false;
  }

  if (!phone) {
    showFieldError("edit-phone-input", "Phone is required");
    isValid = false;
  }

  return isValid;
}

/**
 * Validates the add contact form inputs
 * @returns {boolean} - True if all fields are valid, false otherwise
 */
function validateAddContactForm() {
  let isValid = true;

  const name = $("name-new-contact").value.trim();
  const email = $("email-new-contact").value.trim();
  const phone = $("phone-new-contact").value.trim();

  clearFieldError("name-new-contact");
  clearFieldError("email-new-contact");
  clearFieldError("phone-new-contact");

  if (!name) {
    showFieldError("name-new-contact", "Name is required");
    isValid = false;
  }

  if (!email) {
    showFieldError("email-new-contact", "E-Mail is required");
    isValid = false;
  } else if (!isValidEmail(email)) {
    showFieldError("email-new-contact", "Please enter a valid email address");
    isValid = false;
  }

  if (!phone) {
    showFieldError("phone-new-contact", "Phone is required");
    isValid = false;
  }

  return isValid;
}

/**
 * Validates and saves the edited contact data
 */
function saveEditedContact() {
  if (!validateEditContactForm()) {
    return;
  }
  
  getUpdatedContactData();
  updateContactInFirebase();
} $(fieldId + "-placeholder");

  // Bestehende Add Contact Felder
  if (fieldId === "name-new-contact") {
    $("name-new-contact-box").innerHTML = "";
  }
  if (fieldId === "email-new-contact") {
    $("email-new-contact-box").innerHTML = "";
  }
  if (fieldId === "phone-new-contact") {
    $("phone-new-contact-box").innerHTML = "";
  }

  // Neue Edit Contact Felder
  if (fieldId === "edit-name-input") {
    $("edit-name-input-box").innerHTML = "";
  }
  if (fieldId === "edit-email-input") {
    $("edit-email-input-box").innerHTML = "";
  }
  if (fieldId === "edit-phone-input") {
    $("edit-phone-input-box").innerHTML = "";
  }

  field.style.borderColor = "";
  field.classList.remove("error-input");
  if (placeholder) {
    placeholder.classList.remove("error-input-placeholder");
  }
}

/**
 * Validates the edit contact form inputs
 * @returns {boolean} - True if all fields are valid, false otherwise
 */
function validateEditContactForm() {
  let isValid = true;

  const name = $("edit-name-input").value.trim();
  const email = $("edit-email-input").value.trim();
  const phone = $("edit-phone-input").value.trim();

  clearFieldError("edit-name-input");
  clearFieldError("edit-email-input");
  clearFieldError("edit-phone-input");

  if (!name) {
    showFieldError("edit-name-input", "Name is required");
    isValid = false;
  }

  if (!email) {
    showFieldError("edit-email-input", "E-Mail is required");
    isValid = false;
  } else if (!isValidEmail(email)) {
    showFieldError("edit-email-input", "Please enter a valid email address");
    isValid = false;
  }

  if (!phone) {
    showFieldError("edit-phone-input", "Phone is required");
    isValid = false;
  }

  return isValid;
}

/**
 * Validates the add contact form inputs
 * @returns {boolean} - True if all fields are valid, false otherwise
 */
function validateAddContactForm() {
  let isValid = true;

  const name = $("name-new-contact").value.trim();
  const email = $("email-new-contact").value.trim();
  const phone = $("phone-new-contact").value.trim();

  clearFieldError("name-new-contact");
  clearFieldError("email-new-contact");
  clearFieldError("phone-new-contact");

  if (!name) {
    showFieldError("name-new-contact", "Name is required");
    isValid = false;
  }

  if (!email) {
    showFieldError("email-new-contact", "E-Mail is required");
    isValid = false;
  } else if (!isValidEmail(email)) {
    showFieldError("email-new-contact", "Please enter a valid email address");
    isValid = false;
  }

  if (!phone) {
    showFieldError("phone-new-contact", "Phone is required");
    isValid = false;
  }

  return isValid;
}

/**
 * Validates and saves the edited contact data
 */
function saveEditedContact() {
  if (!validateEditContactForm()) {
    return;
  }
  
  getUpdatedContactData();
  updateContactInFirebase();
}
