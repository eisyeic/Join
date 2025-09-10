// Clear all inputs and error states in the Add-Contact form
function clearAddFormInputs() {
  $("name-new-contact").value = "";
  $("email-new-contact").value = "";
  $("phone-new-contact").value = "";
  clearFieldError("name-new-contact");
  clearFieldError("email-new-contact");
  clearFieldError("phone-new-contact");
}

// Open the Add-Contact overlay and reset the form
function openAddContact() {
  $("contact-overlay-close-add").classList.remove("d-none");
  clearAddFormInputs();
}

// Close the Add-Contact overlay and reset the form
function closeAddContact() {
  $("contact-overlay-close-add").classList.add("d-none");
  clearAddFormInputs();
}

// Toggle visibility of the Add-Contact overlay
function toggleAddContact() {
  $("contact-overlay-close-add").classList.toggle("d-none");
}

// Toggle visibility of the Edit-Contact overlay
function toggleEditContact() {
  $("contact-overlay-close-edit").classList.toggle("d-none");
}

// Read values from Add-Contact form inputs
function getAddFormValues() {
  return {
    name: $("name-new-contact").value.trim(),
    email: $("email-new-contact").value.trim(),
    phone: $("phone-new-contact").value.trim(),
  };
}

// Clear all add-form error messages/styles
function clearAddFormErrors() {
  clearFieldError("name-new-contact");
  clearFieldError("email-new-contact");
  clearFieldError("phone-new-contact");
}

// Validate add name field (required)
function validateAddNameField(name) {
  if (!name) {
    showFieldError("name-new-contact", "Name is required");
    return false;
  }
  return true;
}

// Validate add email field (required + format)
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

// Validate add phone field (required)
function validateAddPhoneField(phone) {
  if (!phone) {
    showFieldError("phone-new-contact", "Phone is required");
    return false;
  }
  return true;
}

// Validate all add form fields
function validateAddFormFields(values) {
  const nameValid = validateAddNameField(values.name);
  const emailValid = validateAddEmailField(values.email);
  const phoneValid = validateAddPhoneField(values.phone);

  return nameValid && emailValid && phoneValid;
}

// Validate the add contact form and return validity
function validateAddContactForm() {
  const values = getAddFormValues();
  clearAddFormErrors();
  return validateAddFormFields(values);
}