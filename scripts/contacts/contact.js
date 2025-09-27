window.colorIndex = 0;

let editOverlayClosing = false;
let swallowNextDocClick = false;
let suppressMobileNavbar = false;
let navbarLockObserver = null;
function ensureMobileNavbarLockObserver(){
  if (navbarLockObserver) return;
  const el = document.getElementById('single-person-content-mobile-navbar');
  if (!el) return;
  navbarLockObserver = new MutationObserver(() => {
    if (suppressMobileNavbar && !el.classList.contains('d-none')) {
      el.classList.add('d-none');
    }
  });
  navbarLockObserver.observe(el, { attributes:true, attributeFilter:['class'] });
  if (suppressMobileNavbar && !el.classList.contains('d-none')) {
    el.classList.add('d-none');
  }
}
document.addEventListener('DOMContentLoaded', ensureMobileNavbarLockObserver);

(function patchToggleEditContactOnce(){
  if (window._toggleEditPatched) return;
  const orig = window.toggleEditContact;
  if (typeof orig !== 'function') return;
  window.toggleEditContact = function patchedToggleEditContact() {
    const result = orig.apply(this, arguments);
    setTimeout(() => resetNavbarIfOverlayClosed(), 0);
    return result;
  };
  window._toggleEditPatched = true;
})();

document.addEventListener('click', function(e){
  if (swallowNextDocClick) {
    e.stopPropagation();
    e.preventDefault();
    swallowNextDocClick = false;
  }
}, { capture: true });

document.addEventListener('click', () => resetNavbarIfOverlayClosed());

document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape') {
    resetNavbarIfOverlayClosed();
  }
});

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

function resetNavbarIfOverlayClosed() {
  // Timing: nach event bubbling/layout
  setTimeout(() => {
    if (!isEditOverlayOpen()) {
      suppressMobileNavbar = false;
      removeDetailsMobileNavbar?.();
    }
  }, 0);
}

window.getInitials = function (name) {
  const words = name.split(" ");
  const firstInitial = words[0] ? words[0][0].toUpperCase() : "";
  const secondInitial = words[1] ? words[1][0].toUpperCase() : "";
  return firstInitial + secondInitial;
};

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

function detailsMobileBack() {
  const d = $("contact-details"), a = $("add-new-contact-container");
  d.classList.remove("mobile-visible"); d.classList.add("d-none");
  a.classList.remove("d-none"); removeDetailsMobileNavbar?.();
}

function addDetailsMobileNavbar() {
  const el = $("single-person-content-mobile-navbar");
  if (!el) return;
  if (suppressMobileNavbar) { el.classList.add('d-none'); return; }
  if (el.classList.contains("d-none")) el.classList.remove("d-none");
}

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

function getEditFormElements() {
  return {
    nameInput: $("edit-name-input"),
    emailInput: $("edit-email-input"),
    phoneInput: $("edit-phone-input"),
    iconImg: $("edit-icon-img"),
    iconText: $("edit-icon-text"),
  };
}

function populateEditForm(elements) {
  elements.nameInput.value = currentContact.name;
  elements.emailInput.value = currentContact.email;
  elements.phoneInput.value = currentContact.phone;
  elements.iconImg.src = `./assets/general_elements/icons/color${currentContact.colorIndex}.svg`;
  elements.iconText.textContent = getInitials(currentContact.name);
}

function openEditContact(e) {
  const ev = e || (typeof window !== 'undefined' && window.event ? window.event : null);
  const target = ev && ev.target instanceof Element ? ev.target : null;

  // If an Event is present, tame it; otherwise allow programmatic/inline calls
  if (ev) {
    if (typeof ev.stopPropagation === 'function') ev.stopPropagation();
    if (typeof ev.preventDefault === 'function') ev.preventDefault();
    swallowNextDocClick = true;
    setTimeout(() => { swallowNextDocClick = false; }, 250);

    const isFromContactList = target && target.closest('.contact-person');
    if (isFromContactList) return;

    const allowed = target && (
      target.closest('#single-person-content-mobile-navbar') ||
      target.closest('#edit-contact-button') ||
      target.closest('[data-role="edit-contact-trigger"]') ||
      target.closest('.contact-single-person-content-head-edit-box')
    );
    if (!allowed) return;
  }
  if (editOverlayClosing) return;
  suppressMobileNavbar = true;
  removeDetailsMobileNavbar();
  const elements = getEditFormElements();
  populateEditForm(elements);
  toggleEditContact();
}

function getUpdatedContactData() {
  currentContact.name = $("edit-name-input").value;
  currentContact.email = $("edit-email-input").value;
  currentContact.phone = $("edit-phone-input").value;
}

function getContactUpdateData() {
  return {
    name: currentContact.name,
    email: currentContact.email,
    phone: currentContact.phone,
    colorIndex: currentContact.colorIndex,
    initials: getInitials(currentContact.name),
  };
}

function handleUpdateSuccess() {
  showContactDetails(
    currentContact.name,
    currentContact.email,
    currentContact.phone,
    currentContact.colorIndex,
    currentContact.id
  );
  editOverlayClosing = true;
  toggleEditContact();
  suppressMobileNavbar = true;
  setTimeout(() => { editOverlayClosing = false; suppressMobileNavbar = false; }, 350);
}

function updateContactInFirebase() {
  import(
    "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js"
  ).then(({ getDatabase, ref, update }) => {
    import("../firebase.js").then(({ app }) => {
      const db = getDatabase(app);
      const contactRef = ref(db, `contacts/${currentContact.id}`);
      const updateData = getContactUpdateData();

      update(contactRef, updateData).then(() => {
        handleUpdateSuccess();
      });
    });
  });
}

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

function sanitizePhoneOnInput(e) {
  let v = e.target.value.replace(/[^\d+]/g, ''); 
  if (v.startsWith('+')) {
    v = '+' + v.slice(1).replace(/\+/g, ''); 
  } else {
    v = v.replace(/\+/g, ''); 
  }
  e.target.value = v.slice(0, 20); 
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

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

document.addEventListener("DOMContentLoaded", function () {
  $("edit-phone-input").addEventListener("keydown", validatePhoneInput);
  $("phone-new-contact").addEventListener("keydown", validatePhoneInput);
  $("name-new-contact").addEventListener("keydown", validateNameInput);
  $("edit-name-input").addEventListener("keydown", validateNameInput);
});

function deleteContactAndGoBack(event) {
  event.stopPropagation();
  deleteContact();
  detailsMobileBack();
}

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

function setErrorMessage(fieldId, message) {
  const fieldMapping = getFieldMapping();
  if (fieldMapping[fieldId]) {
    $(fieldMapping[fieldId]).innerHTML = getErrorMessage(message);
  }
}

function setFieldErrorStyle(field, placeholder) {
  field.style.borderColor = "red";
  field.classList.add("error-input");
  if (placeholder) {
    placeholder.classList.add("error-input-placeholder");
  }
}

function showFieldError(fieldId, message) {
  const field = $(fieldId);
  const placeholder = $(fieldId + "-placeholder");
  setErrorMessage(fieldId, message);
  setFieldErrorStyle(field, placeholder);
}

function clearErrorMessage(fieldId) {
  const fieldMapping = getFieldMapping();
  if (fieldMapping[fieldId]) {
    $(fieldMapping[fieldId]).innerHTML = "";
  }
}

function clearFieldErrorStyle(field, placeholder) {
  field.style.borderColor = "";
  field.classList.remove("error-input");
  if (placeholder) {
    placeholder.classList.remove("error-input-placeholder");
  }
}

function clearFieldError(fieldId) {
  const field = $(fieldId);
  const placeholder = $(fieldId + "-placeholder");

  clearErrorMessage(fieldId);
  clearFieldErrorStyle(field, placeholder);
}

function getEditFormValues() {
  return {
    name: $("edit-name-input").value.trim(),
    email: $("edit-email-input").value.trim(),
    phone: $("edit-phone-input").value.trim(),
  };
}

function clearEditFormErrors() {
  clearFieldError("edit-name-input");
  clearFieldError("edit-email-input");
  clearFieldError("edit-phone-input");
}

function validateEditNameField(name) {
  if (!name) {
    showFieldError("edit-name-input", "Name is required");
    return false;
  }
  return true;
}

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

function validateEditPhoneField(phone) {
  if (!phone) {
    showFieldError("edit-phone-input", "Phone is required");
    return false;
  }
  return true;
}

function validateEditFormFields(values) {
  const nameValid = validateEditNameField(values.name);
  const emailValid = validateEditEmailField(values.email);
  const phoneValid = validateEditPhoneField(values.phone);

  return nameValid && emailValid && phoneValid;
}

function validateEditContactForm() {
  const values = getEditFormValues();
  clearEditFormErrors();
  return validateEditFormFields(values);
}

function saveEditedContact() {
  const ev = (typeof window !== 'undefined' && window.event) ? window.event : null;
  if (ev && typeof ev.stopPropagation === 'function') ev.stopPropagation();
  swallowNextDocClick = true;
  setTimeout(() => { _swallowNextDocClick = false; }, 300);
  suppressMobileNavbar = true; setTimeout(()=>{ _suppressMobileNavbar = false; }, 350);

  if (!validateEditContactForm()) {
    return;
  }
  getUpdatedContactData();
  updateContactInFirebase();
}

/**
 * Build a standardized inline error message HTML.
 * @param {string} message
 * @returns {string} HTML
 */
function getErrorMessage(message) {
  return /*html*/ `<p class="error-message">${message}</p>`;
}

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

/** @type {Partial<Contact>} */
let currentContact = {};

function getContactDetails(name, email, phone, colorIndex, detailSection, id) {
  detailSection.innerHTML = /*html*/ `
        <div class="contact-single-person-content-head">
            <div class="contact-person-icon-big">
                <img src="./assets/general_elements/icons/color${colorIndex}.svg" />
                <h3>${getInitials(name)}</h3>
            </div>
            <div class="contact-single-person-content-head-name">
                <h3>${name}</h3>
                <div class="contact-single-person-content-head-edit-container">
                    <div class="contact-single-person-content-head-edit-box" id="edit-contact-button" data-role="edit-contact-trigger" onclick="openEditContact(event)">
                        <img class="regular-image" src="./assets/contacts/icons/pen_thin.svg" />
                        <p>Edit</p>
                    </div>
                    <div class="contact-single-person-content-head-trash-box" onclick="deleteContact()">
                        <img class="regular-image" src="./assets/contacts/icons/trash_thin.svg" />
                        <p>Delete</p>
                    </div>
                </div>
            </div>
        </div>
        <div class="contact-single-person-content-info">
            <h4>Contact Information</h4>
            <h6>Email</h6>
            <a>${email}</a>
            <h6>Phone</h6>
            <span>${phone}</span>
        </div>`;
}

function getNewLayoutDetails(name, email, phone, colorIndex, detailSection) {
  detailSection.innerHTML = ``;
  detailSection.innerHTML = /*html*/ `
    <div class="contact-single-person-content-mobile-headline">
        <h5>Contact Information</h5>
        <a class="help-a-tag-back-button" onclick="detailsMobileBack()">
            <img src="./assets/general_elements/icons/arrow_left.svg">
        </a>
    </div>
    <div class="contact-single-person-content-head">
        <div class="contact-person-icon-big">
            <img src="./assets/general_elements/icons/color${colorIndex}.svg" />
            <h3>${getInitials(name)}</h3>
        </div>
        <div class="contact-single-person-content-head-name">
            <h4>${name}</h4>
        </div>
    </div>
    <div class="contact-single-person-content-info">
        <h6>Email</h6>
        <a>${email}</a>
        <h6>Phone</h6>
        <span>${phone}</span>
    </div>
    <div class="single-person-content-mobile-bottom" onclick="addDetailsMobileNavbar(), removeDetailsMobileNavbar(event)">
        <div class="white-point"></div>
        <div class="white-point"></div>
        <div class="white-point"></div>
    </div>
    <div class="single-person-content-mobile-navbar d-none" id="single-person-content-mobile-navbar" onclick="removeDetailsMobileNavbar(event)">
        <div class="single-person-content-mobile-navbar-content" onclick="openEditContact()">
            <img src="./assets/contacts/icons/pen_thin.svg" alt="Edit Icon">
            <p>Edit</p>
        </div>
        <div class="single-person-content-mobile-navbar-content" onclick="deleteContactAndGoBack(event)">
            <img src="./assets/contacts/icons/trash_thin.svg" alt="Delete Icon">
            <p>Delete</p>
        </div>
    </div>
    `;
}