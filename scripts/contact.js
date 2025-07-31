// ===== GLOBAL VARIABLES =====

window.colorIndex = 0;

// ===== UTILITY FUNCTIONS =====

window.getInitials = function (name) {
  const words = name.split(" ");
  const firstInitial = words[0] ? words[0][0].toUpperCase() : "";
  const secondInitial = words[1] ? words[1][0].toUpperCase() : "";
  return firstInitial + secondInitial;
};

// ===== OVERLAY TOGGLE FUNCTIONS =====

// Clear Add Form Inputs
function clearAddFormInputs() {
  $("name-new-contact").value = "";
  $("email-new-contact").value = "";
  $("phone-new-contact").value = "";
  clearFieldError("name-new-contact");
  clearFieldError("email-new-contact");
  clearFieldError("phone-new-contact");
}

// Open Add Contact
function openAddContact() {
  $("contact-overlay-close-add").classList.remove("d-none");
  clearAddFormInputs();
}

// Close Add Contact
function closeAddContact() {
  $("contact-overlay-close-add").classList.add("d-none");
  clearAddFormInputs();
}

// Toggle Add Contact
function toggleAddContact() {
  $("contact-overlay-close-add").classList.toggle("d-none");
}

// Toggle Edit Contact
function toggleEditContact() {
  $("contact-overlay-close-edit").classList.toggle("d-none");
}

// Show Contact Details
function showContactDetails(name, email, phone, colorIndex, id) {
  currentContact = { name, email, phone, colorIndex, id };
  const detailSection = document.getElementById("contact-details");

  getContactDetails(name, email, phone, colorIndex, detailSection);
  detailSection.classList.remove("d-none");

  if (window.innerWidth <= 900) {
    $("contact-details").classList.add("mobile-visible");
    $("add-new-contact-container").style.display = "none";

    getNewLayoutDetails(name, email, phone, colorIndex, detailSection);
  }
}

// Details Mobile Back
function detailsMobileBack() {
  $("contact-details").classList.remove("mobile-visible");
  $("contact-details").style.display = "none";
  $("add-new-contact-container").style.display = "block";
}

// Add Details Mobile Navbar
function addDetailsMobileNavbar() {
  $("single-person-content-mobile-navbar").classList.remove("d-none");
}

// Remove Mobile Navbar
function removeDetailsMobileNavbar(event) {
  if (event) {
    event.stopPropagation();
  }
  else{
    $("single-person-content-mobile-navbar").classList.add("d-none");
  }
}

// ===== EDIT CONTACT FUNCTIONS =====

// Get Edit Form Elements
function getEditFormElements() {
  return {
    nameInput: $("edit-name-input"),
    emailInput: $("edit-email-input"),
    phoneInput: $("edit-phone-input"),
    iconImg: $("edit-icon-img"),
    iconText: $("edit-icon-text"),
  };
}

// Populate Edit Form
function populateEditForm(elements) {
  elements.nameInput.value = currentContact.name;
  elements.emailInput.value = currentContact.email;
  elements.phoneInput.value = currentContact.phone;
  elements.iconImg.src = `./assets/general_elements/icons/color${currentContact.colorIndex}.svg`;
  elements.iconText.textContent = getInitials(currentContact.name);
}

// Open Edit Contact
function openEditContact() {
  const elements = getEditFormElements();
  populateEditForm(elements);
  toggleEditContact();
}

// ===== SAVE CONTACT FUNCTIONS =====

// Get Updated Contact Data
function getUpdatedContactData() {
  currentContact.name = $("edit-name-input").value;
  currentContact.email = $("edit-email-input").value;
  currentContact.phone = $("edit-phone-input").value;
}

// Get Contact Update Data
function getContactUpdateData() {
  return {
    name: currentContact.name,
    email: currentContact.email,
    phone: currentContact.phone,
    colorIndex: currentContact.colorIndex,
    initials: getInitials(currentContact.name)
  };
}

// Handle Update Success
function handleUpdateSuccess() {
  showContactDetails(
    currentContact.name,
    currentContact.email,
    currentContact.phone,
    currentContact.colorIndex
  );
  toggleEditContact();
}

// Update Contact In Firebase
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

// Validate Phone Input
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

// Is Valid Email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate Name Input
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

// Initialize Event Listeners
document.addEventListener("DOMContentLoaded", function () {
  $("edit-phone-input").addEventListener("keydown", validatePhoneInput);
  $("phone-new-contact").addEventListener("keydown", validatePhoneInput);
  $("name-new-contact").addEventListener("keydown", validateNameInput);
  $("edit-name-input").addEventListener("keydown", validateNameInput);
});

// Delete Contact And Go Back
function deleteContactAndGoBack(event) {
  event.stopPropagation();
  deleteContact();
  detailsMobileBack();
}

// ===== ERROR HANDLING =====

// Get Field Mapping
function getFieldMapping() {
  return {
    "name-new-contact": "name-new-contact-box",
    "email-new-contact": "email-new-contact-box",
    "phone-new-contact": "phone-new-contact-box",
    "edit-name-input": "edit-name-input-box",
    "edit-email-input": "edit-email-input-box",
    "edit-phone-input": "edit-phone-input-box"
  };
}

// Set Error Message
function setErrorMessage(fieldId, message) {
  const fieldMapping = getFieldMapping();
  if (fieldMapping[fieldId]) {
    $(fieldMapping[fieldId]).innerHTML = getErrorMessage(message);
  }
}

// Set Field Error Style
function setFieldErrorStyle(field, placeholder) {
  field.style.borderColor = "red";
  field.classList.add("error-input");
  if (placeholder) {
    placeholder.classList.add("error-input-placeholder");
  }
}

// Show Field Error
function showFieldError(fieldId, message) {
  const field = $(fieldId);
  const placeholder = $(fieldId + "-placeholder");
  
  setErrorMessage(fieldId, message);
  setFieldErrorStyle(field, placeholder);
}

// Clear Error Message
function clearErrorMessage(fieldId) {
  const fieldMapping = getFieldMapping();
  if (fieldMapping[fieldId]) {
    $(fieldMapping[fieldId]).innerHTML = "";
  }
}

// Clear Field Error Style
function clearFieldErrorStyle(field, placeholder) {
  field.style.borderColor = "";
  field.classList.remove("error-input");
  if (placeholder) {
    placeholder.classList.remove("error-input-placeholder");
  }
}

// Clear Field Error
function clearFieldError(fieldId) {
  const field = $(fieldId);
  const placeholder = $(fieldId + "-placeholder");
  
  clearErrorMessage(fieldId);
  clearFieldErrorStyle(field, placeholder);
}

// Get Edit Form Values
function getEditFormValues() {
  return {
    name: $("edit-name-input").value.trim(),
    email: $("edit-email-input").value.trim(),
    phone: $("edit-phone-input").value.trim()
  };
}

// Clear Edit Form Errors
function clearEditFormErrors() {
  clearFieldError("edit-name-input");
  clearFieldError("edit-email-input");
  clearFieldError("edit-phone-input");
}

// Validate Edit Name Field
function validateEditNameField(name) {
  if (!name) {
    showFieldError("edit-name-input", "Name is required");
    return false;
  }
  return true;
}

// Validate Edit Email Field
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

// Validate Edit Phone Field
function validateEditPhoneField(phone) {
  if (!phone) {
    showFieldError("edit-phone-input", "Phone is required");
    return false;
  }
  return true;
}

// Validate Edit Form Fields
function validateEditFormFields(values) {
  const nameValid = validateEditNameField(values.name);
  const emailValid = validateEditEmailField(values.email);
  const phoneValid = validateEditPhoneField(values.phone);
  
  return nameValid && emailValid && phoneValid;
}

// Validate Edit Contact Form
function validateEditContactForm() {
  const values = getEditFormValues();
  clearEditFormErrors();
  return validateEditFormFields(values);
}

// Get Add Form Values
function getAddFormValues() {
  return {
    name: $("name-new-contact").value.trim(),
    email: $("email-new-contact").value.trim(),
    phone: $("phone-new-contact").value.trim()
  };
}

// Clear Add Form Errors
function clearAddFormErrors() {
  clearFieldError("name-new-contact");
  clearFieldError("email-new-contact");
  clearFieldError("phone-new-contact");
}

// Validate Add Name Field
function validateAddNameField(name) {
  if (!name) {
    showFieldError("name-new-contact", "Name is required");
    return false;
  }
  return true;
}

// Validate Add Email Field
function validateAddEmailField(email) {
  if (!email) {
    showFieldError("email-new-contact", "E-Mail is required");
    return false;
  } else if (!isValidEmail(email)) {
    showFieldError("email-new-contact", "Please enter a valid email address");
    return false;
  }
  return true;
}

// Validate Add Phone Field
function validateAddPhoneField(phone) {
  if (!phone) {
    showFieldError("phone-new-contact", "Phone is required");
    return false;
  }
  return true;
}

// Validate Add Form Fields
function validateAddFormFields(values) {
  const nameValid = validateAddNameField(values.name);
  const emailValid = validateAddEmailField(values.email);
  const phoneValid = validateAddPhoneField(values.phone);
  
  return nameValid && emailValid && phoneValid;
}

// Validate Add Contact Form
function validateAddContactForm() {
  const values = getAddFormValues();
  clearAddFormErrors();
  return validateAddFormFields(values);
}

// Save Edited Contact
function saveEditedContact() {
  if (!validateEditContactForm()) {
    return;
  }

  getUpdatedContactData();
  updateContactInFirebase();
}
