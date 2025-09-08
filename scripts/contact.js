/**
 * Rolling color index used when creating new contacts.
 * @type {number}
 * @global
 */
window.colorIndex = 0;
/**
 * Prevent immediate re-open of the edit overlay after closing.
 * @type {boolean}
 */
let _editOverlayClosing = false;
/**
 * Swallow the next document click right after saving to avoid background handlers toggling overlays.
 * @type {boolean}
 */
let _swallowNextDocClick = false;
/**
 * Suppress unintended mobile navbar visibility while editing.
 * @type {boolean}
 */
let _suppressMobileNavbar = false;
/**
 * MutationObserver that enforces navbar suppression.
 * @type {MutationObserver|null}
 */
let _navbarLockObserver = null;
/**
 * Ensures a MutationObserver exists that hides the mobile navbar while suppression is active.
 * @returns {void}
 */
function ensureMobileNavbarLockObserver(){
  if (_navbarLockObserver) return;
  _navbarLockObserver = new MutationObserver(() => {
    const el = document.getElementById('single-person-content-mobile-navbar');
    if (!el) return;
    if (_suppressMobileNavbar && !el.classList.contains('d-none')) {
      el.classList.add('d-none');
    }
  });
  _navbarLockObserver.observe(document.documentElement, { attributes:true, subtree:true, attributeFilter:['class'] });
}
document.addEventListener('DOMContentLoaded', ensureMobileNavbarLockObserver);

/**
 * Patch: wraps `toggleEditContact` to re-enable (but not auto-open) the mobile navbar
 * when the edit overlay closes.
 */
(function patchToggleEditContactOnce(){
  if (window._toggleEditPatched) return;
  const orig = window.toggleEditContact;
  if (typeof orig !== 'function') return;
  window.toggleEditContact = function patchedToggleEditContact() {
    const result = orig.apply(this, arguments);
    setTimeout(() => {
      if (!isEditOverlayOpen()) {
        _suppressMobileNavbar = false; 
        removeDetailsMobileNavbar?.(); 
      }
    }, 0);
    return result;
  };
  window._toggleEditPatched = true;
})();

/**
 * Capture-phase click guard to optionally swallow the next document click.
 */
document.addEventListener('click', function(e){
  if (_swallowNextDocClick) {
    e.stopPropagation();
    e.preventDefault();
    _swallowNextDocClick = false;
  }
}, { capture: true });

/**
 * After each click settles, if the edit overlay is closed, allow the navbar again (do not auto-open).
 */
document.addEventListener('click', () => {
  setTimeout(() => {
    if (!isEditOverlayOpen()) {
      _suppressMobileNavbar = false; 
      removeDetailsMobileNavbar?.(); 
    }
  }, 0);
});

/**
 * Handle ESC-based closes: allow navbar again without auto-opening.
 */
document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape') {
    setTimeout(() => {
      if (!isEditOverlayOpen()) {
        _suppressMobileNavbar = false; 
        removeDetailsMobileNavbar?.(); 
      }
    }, 0);
  }
});

/**
 * Returns true if the edit-contact overlay is visible.
 * @returns {boolean}
 */
function isEditOverlayOpen() {
  const overlayRoot =
    document.getElementById('edit-contact-overlay') ||
    document.querySelector('#edit-contact, .edit-contact-overlay, .contact-edit-overlay, .edit-contact');
  if (overlayRoot) {
    const cs = window.getComputedStyle(overlayRoot);
    if (
      overlayRoot.classList.contains('d-none') ||
      cs.display === 'none' ||
      cs.visibility === 'hidden' ||
      cs.opacity === '0'
    ) {
      return false;
    }
    return true;
  }

  const el = document.getElementById('edit-name-input');
  if (!el) return false;
  if (el.closest('.d-none')) return false;
  const cs = window.getComputedStyle(el);
  if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return false;
  return el.offsetParent !== null && el.getClientRects().length > 0;
}

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
  const d = $("contact-details"), a = $("add-new-contact-container");
  document.querySelectorAll(".contact-person.active").forEach(el => el.classList.remove("active"));
  document.querySelector(`.contact-person[onclick*="'${id}'"]`)?.classList.add("active");
  d.replaceChildren();
  getContactDetails(name, email, phone, colorIndex, d);
  d.classList.remove("d-none");
  const mobile = window.innerWidth <= 900;
d.classList.toggle("mobile-visible", mobile);
a.classList.toggle("d-none", mobile);
if (mobile) {
  getNewLayoutDetails?.(name, email, phone, colorIndex, d);
  removeDetailsMobileNavbar?.();
} else {
  removeDetailsMobileNavbar?.();
}
}

/**
 * Mobile back action: hide details, show add-contact panel.
 * @returns {void}
 */
function detailsMobileBack() {
  const d = $("contact-details"), a = $("add-new-contact-container");
  d.classList.remove("mobile-visible"); d.classList.add("d-none");
  a.classList.remove("d-none"); removeDetailsMobileNavbar?.();
}

/**
 * Show the mobile navbar in contact details view.
 * @returns {void}
 */
function addDetailsMobileNavbar() {
  const el = $("single-person-content-mobile-navbar");
  if (!el) return;
  if (_suppressMobileNavbar) { el.classList.add('d-none'); return; }
  if (el.classList.contains("d-none")) el.classList.remove("d-none");
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


/**
 * Returns a handle set to the edit form elements inside the contact edit overlay.
 * @returns {{nameInput:HTMLElement,emailInput:HTMLElement,phoneInput:HTMLElement,iconImg:HTMLImageElement,iconText:HTMLElement}}
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
 * Populates the edit form fields from the currentContact object.
 * @param {{nameInput:HTMLInputElement,emailInput:HTMLInputElement,phoneInput:HTMLInputElement,iconImg:HTMLImageElement,iconText:HTMLElement}} elements
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
 * Opens the Edit-Contact overlay with prefilled fields.
 * Only responds to clicks from the burger navbar or explicit edit triggers.
 * @param {Event} [e]
 * @returns {void}
 */
function openEditContact(e) {
  const ev = e || (typeof window !== 'undefined' && window.event ? window.event : null);
  if (!ev) return;
  if (typeof ev.stopPropagation === 'function') ev.stopPropagation();
  if (typeof ev.preventDefault === 'function') ev.preventDefault();
  _swallowNextDocClick = true;
  setTimeout(() => { _swallowNextDocClick = false; }, 250);
  const target = ev && ev.target instanceof Element ? ev.target : null;
  const isFromContactList = target && target.closest('.contact-person');
  if (isFromContactList) {
    return;
  }
  if (ev) {
    const allowed = target && (
      target.closest('#single-person-content-mobile-navbar') ||
      target.closest('#edit-contact-button') ||
      target.closest('[data-role="edit-contact-trigger"]')
    );
    if (!allowed) {
      return;
    }
  }
  if (_editOverlayClosing) return;
  _suppressMobileNavbar = true;
  removeDetailsMobileNavbar();
  const elements = getEditFormElements();
  populateEditForm(elements);
  toggleEditContact();
}

/**
 * Copies values from the edit form inputs back into the currentContact object.
 * @returns {void}
 */
function getUpdatedContactData() {
  currentContact.name = $("edit-name-input").value;
  currentContact.email = $("edit-email-input").value;
  currentContact.phone = $("edit-phone-input").value;
}

/**
 * Builds the update payload for Firebase from the currentContact state.
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
 * Handles UI updates after a successful contact update save.
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
  _editOverlayClosing = true;
  toggleEditContact();
  _suppressMobileNavbar = true;
  setTimeout(() => { _editOverlayClosing = false; _suppressMobileNavbar = false; }, 350);
}

/**
 * Persists the edited contact to Firebase Realtime Database and updates the UI on success.
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

/**
 * Keydown filter for phone inputs: allows digits, one leading plus, and control keys; enforces max length.
 * @param {KeyboardEvent} e
 * @returns {void}
 */
function validatePhoneInput(e) {
  const t = e.target;
  const k = e.key;
  const ctrlCmd = e.ctrlKey || e.metaKey;
  if (ctrlCmd && ['a','c','v','x','z','y'].includes(k.toLowerCase())) return;
  if (['Backspace','Delete','Tab','ArrowLeft','ArrowRight','Home','End'].includes(k)) return;
  const selLen = (t.selectionEnd ?? t.value.length) - (t.selectionStart ?? 0);
  const nextLen = t.value.length - selLen + 1;
  if (k === '+') {
    const atStart = (t.selectionStart ?? 0) === 0;
    const hasPlus = t.value.startsWith('+');
    if (!atStart || hasPlus || nextLen > 20) e.preventDefault();
    return;
  }
  if (/^\d$/.test(k)) {
    if (nextLen > 20) e.preventDefault();
    return;
  }
  e.preventDefault();
}

/**
 * Normalizes phone input to digits plus a single leading plus sign, capped length.
 * @param {InputEvent} e
 * @returns {void}
 */
function sanitizePhoneOnInput(e) {
  let v = e.target.value.replace(/[^\d+]/g, ''); 
  if (v.startsWith('+')) {
    v = '+' + v.slice(1).replace(/\+/g, ''); 
  } else {
    v = v.replace(/\+/g, ''); 
  }
  e.target.value = v.slice(0, 20); 
}

/**
 * Validates a simple email address pattern.
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Keydown filter to allow only letters (incl. umlauts), spaces, hyphens, and apostrophes in name fields.
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
 * Wires input validators once the DOM is ready.
 */
document.addEventListener("DOMContentLoaded", function () {
  $("edit-phone-input").addEventListener("keydown", validatePhoneInput);
  $("phone-new-contact").addEventListener("keydown", validatePhoneInput);
  $("name-new-contact").addEventListener("keydown", validateNameInput);
  $("edit-name-input").addEventListener("keydown", validateNameInput);
});

/**
 * Deletes the current contact and navigates back in the mobile layout.
 * @param {Event} event
 * @returns {void}
 */
function deleteContactAndGoBack(event) {
  event.stopPropagation();
  deleteContact();
  detailsMobileBack();
}

/**
 * Returns a mapping from input field IDs to their corresponding error message containers.
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
 * Sets the inline error message for a given field.
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
 * Applies error styling to a field and its placeholder element.
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
 * Convenience helper to set both message and styles for a field error.
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
 * Clears the inline error message for a given field.
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
 * Removes error styling from a field and its placeholder element.
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
 * Clears both the message and the styles for a field error.
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
 * Reads current values from the edit contact form inputs.
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
 * Clears all edit form error states.
 * @returns {void}
 */
function clearEditFormErrors() {
  clearFieldError("edit-name-input");
  clearFieldError("edit-email-input");
  clearFieldError("edit-phone-input");
}

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

/**
 * Validates the edit contact form by reading values and applying validators.
 * @returns {boolean}
 */
function validateEditContactForm() {
  const values = getEditFormValues();
  clearEditFormErrors();
  return validateEditFormFields(values);
}

/**
 * Validates and saves the edited contact; updates Firebase and guards against menu re-open.
 * @returns {void}
 */
function saveEditedContact() {
  const ev = (typeof window !== 'undefined' && window.event) ? window.event : null;
  if (ev && typeof ev.stopPropagation === 'function') ev.stopPropagation();
  _swallowNextDocClick = true;
  setTimeout(() => { _swallowNextDocClick = false; }, 300);
  _suppressMobileNavbar = true; setTimeout(()=>{ _suppressMobileNavbar = false; }, 350);

  if (!validateEditContactForm()) {
    return;
  }
  getUpdatedContactData();
  updateContactInFirebase();
}
