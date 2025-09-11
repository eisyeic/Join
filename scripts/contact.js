// Contact management

// Rolling color index used when creating new contacts
window.colorIndex = 0;
// Prevent immediate re-open of the edit overlay after closing
let _editOverlayClosing = false;
// Swallow the next document click right after saving to avoid background handlers toggling overlays
let _swallowNextDocClick = false;
// Suppress unintended mobile navbar visibility while editing
let _suppressMobileNavbar = false;
// MutationObserver that enforces navbar suppression
let _navbarLockObserver = null;

// Ensures a MutationObserver exists that hides the mobile navbar while suppression is active
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

// Setup mobile navbar observer on DOM ready
function setupMobileNavbarObserver() {
  document.addEventListener('DOMContentLoaded', ensureMobileNavbarLockObserver);
}

// Patch: wraps toggleEditContact to re-enable (but not auto-open) the mobile navbar when the edit overlay closes
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

// Setup click guard to swallow next document click
function setupClickGuard() {
  document.addEventListener('click', function(e){
    if (_swallowNextDocClick) {
      e.stopPropagation();
      e.preventDefault();
      _swallowNextDocClick = false;
    }
  }, { capture: true });
}

// Setup overlay close handler
function setupOverlayCloseHandler() {
  document.addEventListener('click', () => {
    setTimeout(() => {
      if (!isEditOverlayOpen()) {
        _suppressMobileNavbar = false; 
        removeDetailsMobileNavbar?.(); 
      }
    }, 0);
  });
}

// Setup escape key handler
function setupEscapeHandler() {
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
}

// Returns true if the edit-contact overlay is visible
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

// Derive up to two initials from a full name
window.getInitials = function (name) {
  const words = name.split(" ");
  const firstInitial = words[0] ? words[0][0].toUpperCase() : "";
  const secondInitial = words[1] ? words[1][0].toUpperCase() : "";
  return firstInitial + secondInitial;
};

// Show contact details in the details pane and handle mobile layout
function showContactDetails(name, email, phone, colorIndex, id) {
  currentContact = { name, email, phone, colorIndex, id };
  const d = $("contact-details"), a = $("add-new-contact-container");
  document.querySelectorAll(".contact-person.active").forEach(el => el.classList.remove("active"));
  document.querySelector(`.contact-person[onclick*="'${id}']`)?.classList.add("active");
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

// Mobile back action: hide details, show add-contact panel
function detailsMobileBack() {
  const d = $("contact-details"), a = $("add-new-contact-container");
  d.classList.remove("mobile-visible"); d.classList.add("d-none");
  a.classList.remove("d-none"); removeDetailsMobileNavbar?.();
}

// Show the mobile navbar in contact details view
function addDetailsMobileNavbar() {
  const el = $("single-person-content-mobile-navbar");
  if (!el) return;
  if (_suppressMobileNavbar) { el.classList.add('d-none'); return; }
  if (el.classList.contains("d-none")) el.classList.remove("d-none");
}

// Hide the mobile navbar. Stops propagation if an event is provided
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

// Returns a handle set to the edit form elements inside the contact edit overlay
function getEditFormElements() {
  return {
    nameInput: $("edit-name-input"),
    emailInput: $("edit-email-input"),
    phoneInput: $("edit-phone-input"),
    iconImg: $("edit-icon-img"),
    iconText: $("edit-icon-text"),
  };
}

// Populates the edit form fields from the currentContact object
function populateEditForm(elements) {
  elements.nameInput.value = currentContact.name;
  elements.emailInput.value = currentContact.email;
  elements.phoneInput.value = currentContact.phone;
  elements.iconImg.src = `./assets/general_elements/icons/color${currentContact.colorIndex}.svg`;
  elements.iconText.textContent = getInitials(currentContact.name);
}

// Opens the Edit-Contact overlay with prefilled fields
function openEditContact(e) {
  const ev = e || (typeof window !== 'undefined' && window.event ? window.event : null);
  if (ev) {
    if (typeof ev.stopPropagation === 'function') ev.stopPropagation();
    if (typeof ev.preventDefault === 'function') ev.preventDefault();
  }
  _swallowNextDocClick = true;
  setTimeout(() => { _swallowNextDocClick = false; }, 250);
  
  if (_editOverlayClosing) return;
  _suppressMobileNavbar = true;
  removeDetailsMobileNavbar();
  const elements = getEditFormElements();
  populateEditForm(elements);
  toggleEditContact();
}

// Make openEditContact globally available
window.openEditContact = openEditContact;

// Copies values from the edit form inputs back into the currentContact object
function getUpdatedContactData() {
  currentContact.name = $("edit-name-input").value;
  currentContact.email = $("edit-email-input").value;
  currentContact.phone = $("edit-phone-input").value;
}

// Builds the update payload for Firebase from the currentContact state
function getContactUpdateData() {
  return {
    name: currentContact.name,
    email: currentContact.email,
    phone: currentContact.phone,
    colorIndex: currentContact.colorIndex,
    initials: getInitials(currentContact.name),
  };
}

// Handles UI updates after a successful contact update save
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

// Persists the edited contact to Firebase Realtime Database and updates the UI on success
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

// Reads current values from the edit contact form inputs
function getEditFormValues() {
  return {
    name: $("edit-name-input").value.trim(),
    email: $("edit-email-input").value.trim(),
    phone: $("edit-phone-input").value.trim(),
  };
}

// Clears all edit form error states
function clearEditFormErrors() {
  clearFieldError("edit-name-input");
  clearFieldError("edit-email-input");
  clearFieldError("edit-phone-input");
}

// Validates the name field; sets UI error if invalid
function validateEditNameField(name) {
  if (!name) {
    showFieldError("edit-name-input", "Name is required");
    return false;
  }
  return true;
}

// Validates the email field; sets UI error if invalid
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

// Validates the phone field; sets UI error if invalid
function validateEditPhoneField(phone) {
  if (!phone) {
    showFieldError("edit-phone-input", "Phone is required");
    return false;
  }
  return true;
}

// Validates all edit contact fields and returns whether the form is valid
function validateEditFormFields(values) {
  const nameValid = validateEditNameField(values.name);
  const emailValid = validateEditEmailField(values.email);
  const phoneValid = validateEditPhoneField(values.phone);

  return nameValid && emailValid && phoneValid;
}

// Validates the edit contact form by reading values and applying validators
function validateEditContactForm() {
  const values = getEditFormValues();
  clearEditFormErrors();
  return validateEditFormFields(values);
}

// Validates and saves the edited contact; updates Firebase and guards against menu re-open
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

// Deletes the current contact and navigates back in the mobile layout
function deleteContactAndGoBack(event) {
  event.stopPropagation();
  deleteContact();
  detailsMobileBack();
}

// Build a contact list item (compact row) as HTML string
function getContactPerson(key, id) {
  let savedColorIndex = key.colorIndex;
  if (!savedColorIndex) {
    savedColorIndex = (id.charCodeAt(0) % 15) + 1;
  }
  const initials = key.initials || getInitials(key.name);
  return /*html*/ `
        <div class="contact-placeholder">
            <img src="./assets/contacts/img/Vector 10.svg" />
        </div>
        <div class="contact-person" onclick="showContactDetails('${key.name}', '${key.email}', '${key.phone}', ${savedColorIndex}, '${id}')">
            <div class="contact-person-icon">
                <img src="./assets/general_elements/icons/color${savedColorIndex}.svg" />
                <p>${initials}</p>
            </div>
            <div class="contact-person-name">
                <h5>${key.name}</h5>
                <a>${key.email}</a>
            </div>
        </div>`;
}

// Make other functions globally available
window.getContactPerson = getContactPerson;
window.showContactDetails = showContactDetails;
window.detailsMobileBack = detailsMobileBack;
window.addDetailsMobileNavbar = addDetailsMobileNavbar;
window.removeDetailsMobileNavbar = removeDetailsMobileNavbar;
window.saveEditedContact = saveEditedContact;
window.deleteContactAndGoBack = deleteContactAndGoBack;

// Initialize contact module
function initContact() {
  setupMobileNavbarObserver();
  setupClickGuard();
  setupOverlayCloseHandler();
  setupEscapeHandler();
}

initContact();