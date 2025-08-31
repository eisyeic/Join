/**
 * Rolling color index used when creating new contacts.
 * @type {number}
 * @global
 */
window.colorIndex = 0;

// ===== UTILITY FUNCTIONS =====

/**
 * Derive up to two initials from a full name.
 * @param {string} name - Full name (e.g., "Ada Lovelace").
 * @returns {string} Uppercase initials (e.g., "AL").
 * @global
 */
window.getInitials = function (name) {
  const words = name.split(" ");
  const firstInitial = words[0] ? words[0][0].toUpperCase() : "";
  const secondInitial = words[1] ? words[1][0].toUpperCase() : "";
  return firstInitial + secondInitial;
};

// ===== OVERLAY TOGGLE FUNCTIONS =====





/**
 * Show contact details in the details pane and handle mobile layout.
 * Also sets the global `currentContact`.
 * @param {string} name
 * @param {string} email
 * @param {string} phone
 * @param {number} colorIndex
 * @param {string} id - Contact id.
 * @returns {void}
 * @global
 */
function showContactDetails(name, email, phone, colorIndex, id) {
  currentContact = { name, email, phone, colorIndex, id };
  const detailSection = document.getElementById("contact-details");
  document.querySelectorAll(".contact-person").forEach((contact) => {
    contact.classList.remove("active");
  });
  const clickedContact = document.querySelector(`[onclick*="'${id}'"]`);
  if (clickedContact) {
    clickedContact.classList.add("active");
  }
  getContactDetails(name, email, phone, colorIndex, detailSection);
  detailSection.classList.remove("d-none");
  if (window.innerWidth <= 900) {
    $("contact-details").classList.add("mobile-visible");
    $("add-new-contact-container").style.display = "none";
    getNewLayoutDetails(name, email, phone, colorIndex, detailSection);
  }
}

/**
 * Mobile back action: hide details, show add-contact panel.
 * @returns {void}
 */
function detailsMobileBack() {
  $("contact-details").classList.remove("mobile-visible");
  $("contact-details").style.display = "none";
  $("add-new-contact-container").style.display = "block";
}

/**
 * Show the mobile navbar in contact details view.
 * @returns {void}
 */
function addDetailsMobileNavbar() {
  $("single-person-content-mobile-navbar").classList.remove("d-none");
}

/**
 * Hide the mobile navbar. Stops propagation if an event is provided.
 * @param {Event} [event]
 * @returns {void}
 */
function removeDetailsMobileNavbar(event) {
  if (event) {
    event.stopPropagation();
  } else {
    const mobileNavbar = document.getElementById(
      "single-person-content-mobile-navbar"
    );
    if (mobileNavbar) {
      mobileNavbar.classList.add("d-none");
    }
  }
}

// ===== EDIT CONTACT FUNCTIONS =====

/**
 * Get references to edit form elements.
 * @returns {{
 *  nameInput: HTMLInputElement,
 *  emailInput: HTMLInputElement,
 *  phoneInput: HTMLInputElement,
 *  iconImg: HTMLImageElement,
 *  iconText: HTMLElement
 * }}
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
 * Populate the edit form with `currentContact` values.
 * @param {ReturnType<typeof getEditFormElements>} elements
 * @returns {void}
 */
function populateEditForm(elements) {
  elements.nameInput.value = currentContact.name;
  elements.emailInput.value = currentContact.email;
  elements.phoneInput.value = currentContact.phone;
  elements.iconImg.src = `./assets/general_elements/icons/color${currentContact.colorIndex}.svg`;
  elements.iconText.textContent = getInitials(currentContact.name);
}

/**
 * Open the Edit-Contact overlay with prefilled fields.
 * @returns {void}
 */
function openEditContact() {
  const elements = getEditFormElements();
  populateEditForm(elements);
  toggleEditContact();
}

// ===== SAVE CONTACT FUNCTIONS =====

/**
 * Read updated values from edit inputs into `currentContact`.
 * @returns {void}
 */
function getUpdatedContactData() {
  currentContact.name = $("edit-name-input").value;
  currentContact.email = $("edit-email-input").value;
  currentContact.phone = $("edit-phone-input").value;
}

/**
 * Build the update payload for Firebase.
 * @returns {{name:string,email:string,phone:string,colorIndex:number,initials:string}}
 */
function getContactUpdateData() {
  return {
    name: currentContact.name,
    email: currentContact.email,
    phone: currentContact.phone,
    colorIndex: currentContact.colorIndex,
    initials: getInitials(currentContact.name),
  };
}

/**
 * After successful update: re-render details and close editor.
 * @returns {void}
 */
function handleUpdateSuccess() {
  showContactDetails(
    currentContact.name,
    currentContact.email,
    currentContact.phone,
    currentContact.colorIndex,
    currentContact.id
  );
  toggleEditContact();
}

/**
 * Update the current contact in Firebase (dynamic imports).
 * Expects `currentContact.id` to be defined.
 * @returns {void}
 */
function updateContactInFirebase() {
  import(
    "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js"
  ).then(({ getDatabase, ref, update }) => {
    import("./firebase.js").then(({ app }) => {
      const db = getDatabase(app);
      const contactRef = ref(db, `contacts/${currentContact.id}`);
      const updateData = getContactUpdateData();

      update(contactRef, updateData).then(() => {
        handleUpdateSuccess();
      });
    });
  });
}

// ===== INPUT VALIDATION =====

/**
 * Allow only phone-friendly keystrokes.
 * @param {KeyboardEvent} event
 * @returns {void}
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
 * Basic email format validation.
 * @param {string} email
 * @returns {boolean} True if the email matches a simple regex.
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Allow only letters, spaces, hyphen, apostrophe (incl. umlauts).
 * @param {KeyboardEvent} event
 * @returns {void}
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


/**
 * Wire input validators after DOM is ready.
 * @returns {void}
 */
document.addEventListener("DOMContentLoaded", function () {
  $("edit-phone-input").addEventListener("keydown", validatePhoneInput);
  $("phone-new-contact").addEventListener("keydown", validatePhoneInput);
  $("name-new-contact").addEventListener("keydown", validateNameInput);
  $("edit-name-input").addEventListener("keydown", validateNameInput);
});

/**
 * Delete the current contact and navigate back (mobile).
 * @param {Event} event
 * @returns {void}
 * @global
 */
function deleteContactAndGoBack(event) {
  event.stopPropagation();
  deleteContact();
  detailsMobileBack();
}

/**
 * Map field IDs to their respective error container IDs.
 * @returns {Record<string,string>}
 */
function getFieldMapping() {
  return {
    "name-new-contact": "name-new-contact-box",
    "email-new-contact": "email-new-contact-box",
    "phone-new-contact": "phone-new-contact-box",
    "edit-name-input": "edit-name-input-box",
    "edit-email-input": "edit-email-input-box",
    "edit-phone-input": "edit-phone-input-box",
  };
}

/**
 * Inject an error message for a field into its error container.
 * @param {string} fieldId
 * @param {string} message
 * @returns {void}
 */
function setErrorMessage(fieldId, message) {
  const fieldMapping = getFieldMapping();
  if (fieldMapping[fieldId]) {
    $(fieldMapping[fieldId]).innerHTML = getErrorMessage(message);
  }
}

/**
 * Apply error styles to a field and its placeholder (if present).
 * @param {HTMLElement} field
 * @param {HTMLElement} [placeholder]
 * @returns {void}
 */
function setFieldErrorStyle(field, placeholder) {
  field.style.borderColor = "red";
  field.classList.add("error-input");
  if (placeholder) {
    placeholder.classList.add("error-input-placeholder");
  }
}

/**
 * Show a validation error on a field by id.
 * @param {string} fieldId
 * @param {string} message
 * @returns {void}
 */
function showFieldError(fieldId, message) {
  const field = $(fieldId);
  const placeholder = $(fieldId + "-placeholder");

  setErrorMessage(fieldId, message);
  setFieldErrorStyle(field, placeholder);
}

/**
 * Clear the error message for a specific field id.
 * @param {string} fieldId
 * @returns {void}
 */
function clearErrorMessage(fieldId) {
  const fieldMapping = getFieldMapping();
  if (fieldMapping[fieldId]) {
    $(fieldMapping[fieldId]).innerHTML = "";
  }
}

/**
 * Remove error styles from a field and its placeholder.
 * @param {HTMLElement} field
 * @param {HTMLElement} [placeholder]
 * @returns {void}
 */
function clearFieldErrorStyle(field, placeholder) {
  field.style.borderColor = "";
  field.classList.remove("error-input");
  if (placeholder) {
    placeholder.classList.remove("error-input-placeholder");
  }
}

/**
 * Clear error message and styles for a specific field id.
 * @param {string} fieldId
 * @returns {void}
 */
function clearFieldError(fieldId) {
  const field = $(fieldId);
  const placeholder = $(fieldId + "-placeholder");

  clearErrorMessage(fieldId);
  clearFieldErrorStyle(field, placeholder);
}

/**
 * Read values from edit form inputs.
 * @returns {{name:string,email:string,phone:string}}
 */
function getEditFormValues() {
  return {
    name: $("edit-name-input").value.trim(),
    email: $("edit-email-input").value.trim(),
    phone: $("edit-phone-input").value.trim(),
  };
}

/**
 * Clear all edit-form error messages/styles.
 * @returns {void}
 */
function clearEditFormErrors() {
  clearFieldError("edit-name-input");
  clearFieldError("edit-email-input");
  clearFieldError("edit-phone-input");
}

/**
 * Validate edit name field (required).
 * @param {string} name
 * @returns {boolean} True if valid.
 */
function validateEditNameField(name) {
  if (!name) {
    showFieldError("edit-name-input", "Name is required");
    return false;
  }
  return true;
}

/**
 * Validate edit email field (required + format).
 * @param {string} email
 * @returns {boolean} True if valid.
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
 * Validate edit phone field (required).
 * @param {string} phone
 * @returns {boolean} True if valid.
 */
function validateEditPhoneField(phone) {
  if (!phone) {
    showFieldError("edit-phone-input", "Phone is required");
    return false;
  }
  return true;
}

/**
 * Validate all edit form fields.
 * @param {{name:string,email:string,phone:string}} values
 * @returns {boolean} True if all valid.
 */
function validateEditFormFields(values) {
  const nameValid = validateEditNameField(values.name);
  const emailValid = validateEditEmailField(values.email);
  const phoneValid = validateEditPhoneField(values.phone);

  return nameValid && emailValid && phoneValid;
}

/**
 * Validate the edit contact form and return validity.
 * @returns {boolean}
 */
function validateEditContactForm() {
  const values = getEditFormValues();
  clearEditFormErrors();
  return validateEditFormFields(values);
}

/**
 * Validate edit form, collect updated data, and trigger Firebase update.
 * @returns {void}
 */
function saveEditedContact() {
  if (!validateEditContactForm()) {
    return;
  }

  getUpdatedContactData();
  updateContactInFirebase();
}
