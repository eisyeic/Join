/**
 * @file Contact management with Single Responsibility Principle
 * Each function has one clear purpose. Public APIs unchanged.
 */

// Global variables
let _editOverlayClosing = false;
let _swallowNextDocClick = false;
let _suppressMobileNavbar = false;
let _navbarLockObserver = null;

// Initialize contact module
(function initContact() {
  setupAllEventHandlers();
})()

// Global API exports
window.showContactDetails = showContactDetails;
window.detailsMobileBack = detailsMobileBack;
window.addDetailsMobileNavbar = addDetailsMobileNavbar;
window.removeDetailsMobileNavbar = removeDetailsMobileNavbar;
window.saveEditedContact = saveEditedContact;
window.deleteContactAndGoBack = deleteContactAndGoBack;
window.openEditContact = openEditContact;
window.getContactPerson = getContactPerson;
window.getInitials = getInitials;
window.colorIndex = 0;

// Event handlers setup
function setupAllEventHandlers() {
  setupMobileNavbarObserver();
  setupClickGuard();
  setupOverlayCloseHandler();
  setupEscapeHandler();
  patchToggleEditContact();
}

function setupMobileNavbarObserver() {
  document.addEventListener('DOMContentLoaded', ensureMobileNavbarLockObserver);
}

function setupClickGuard() {
  document.addEventListener('click', handleClickGuard, { capture: true });
}

function setupOverlayCloseHandler() {
  document.addEventListener('click', handleOverlayClose);
}

function setupEscapeHandler() {
  document.addEventListener('keydown', handleEscapeKey);
}

// Mobile navbar management
function getMobileNavbarEl() {
  return document.getElementById('single-person-content-mobile-navbar');
}

function resetNavbarIfOverlayClosed() {
  if (!isEditOverlayOpen()) {
    _suppressMobileNavbar = false;
    removeDetailsMobileNavbar?.();
  }
}

function createNavbarLockCallback() {
  return () => {
    const el = getMobileNavbarEl();
    if (el && _suppressMobileNavbar && !el.classList.contains('d-none')) {
      el.classList.add('d-none');
    }
  };
}

function ensureMobileNavbarLockObserver() {
  if (_navbarLockObserver) return;
  _navbarLockObserver = new MutationObserver(createNavbarLockCallback());
  _navbarLockObserver.observe(document.documentElement, {
    attributes: true,
    subtree: true,
    attributeFilter: ['class']
  });
}

function patchToggleEditContact() {
  if (window._toggleEditPatched) return;
  const orig = window.toggleEditContact;
  if (typeof orig !== 'function') return;
  window.toggleEditContact = function patchedToggleEditContact() {
    const result = orig.apply(this, arguments);
    setTimeout(() => { resetNavbarIfOverlayClosed(); }, 0);
    return result;
  };
  window._toggleEditPatched = true;
}

// Event handlers
function handleClickGuard(e) {
  if (_swallowNextDocClick) {
    e.stopPropagation();
    e.preventDefault();
    _swallowNextDocClick = false;
  }
}

function handleOverlayClose() {
  setTimeout(() => { resetNavbarIfOverlayClosed(); }, 0);
}

function handleEscapeKey(ev) {
  if (ev.key === 'Escape') {
    setTimeout(() => { resetNavbarIfOverlayClosed(); }, 0);
  }
}

// Overlay detection
function findEditOverlayRoot() {
  return document.getElementById('edit-contact-overlay') ||
    document.querySelector('#edit-contact, .edit-contact-overlay, .contact-edit-overlay, .edit-contact');
}

function isElementVisible(el) {
  const cs = window.getComputedStyle(el);
  if (el.classList.contains('d-none')) return false;
  if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return false;
  return el.offsetParent !== null && el.getClientRects().length > 0;
}

function isEditOverlayOpen() {
  const overlayRoot = findEditOverlayRoot();
  if (overlayRoot) return isElementVisible(overlayRoot);
  const el = document.getElementById('edit-name-input');
  if (!el) return false;
  if (el.closest('.d-none')) return false;
  return isElementVisible(el);
}

// Utility functions
function getInitials(name) {
  const words = name.split(" ");
  const firstInitial = words[0] ? words[0][0].toUpperCase() : "";
  const secondInitial = words[1] ? words[1][0].toUpperCase() : "";
  return firstInitial + secondInitial;
}

function setCurrentContact(name, email, phone, colorIndex, id) {
  currentContact = { name, email, phone, colorIndex, id };
}

function markActiveContact(id) {
  document.querySelectorAll('.contact-person.active').forEach(el => el.classList.remove('active'));
  document.querySelector(`.contact-person[onclick*="'${id}'"]`)?.classList.add('active');
}

// Contact details display
function showContactDetails(name, email, phone, colorIndex, id) {
  setCurrentContact(name, email, phone, colorIndex, id);
  markActiveContact(id);
  renderContactDetails(name, email, phone, colorIndex);
  applyMobileLayout(name, email, phone, colorIndex);
}

function renderContactDetails(name, email, phone, colorIndex) {
  const details = $("contact-details");
  details.replaceChildren();
  getContactDetails(name, email, phone, colorIndex, details);
  details.classList.remove('d-none');
}

function applyMobileLayout(name, email, phone, colorIndex) {
  const details = $("contact-details");
  const addContainer = $("add-new-contact-container");
  const mobile = window.innerWidth <= 900;
  
  details.classList.toggle('mobile-visible', mobile);
  addContainer.classList.toggle('d-none', mobile);
  
  if (mobile) {
    getNewLayoutDetails?.(name, email, phone, colorIndex, details);
    removeDetailsMobileNavbar?.();
  } else {
    removeDetailsMobileNavbar?.();
  }
}

// Mobile navigation
function detailsMobileBack() {
  const details = $("contact-details");
  const addContainer = $("add-new-contact-container");
  
  details.classList.remove("mobile-visible");
  details.classList.add("d-none");
  addContainer.classList.remove("d-none");
  removeDetailsMobileNavbar?.();
}

function addDetailsMobileNavbar() {
  const el = $("single-person-content-mobile-navbar");
  if (!el) return;
  if (_suppressMobileNavbar) {
    el.classList.add('d-none');
    return;
  }
  if (el.classList.contains("d-none")) el.classList.remove("d-none");
}

function removeDetailsMobileNavbar(event) {
  if (event) {
    event.stopPropagation();
  } else {
    const mobileNavbar = document.getElementById("single-person-content-mobile-navbar");
    if (mobileNavbar) {
      mobileNavbar.classList.add("d-none");
    }
  }
}

// Edit overlay management
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
  const ev = e || window.event;
  if (!ev || _editOverlayClosing) return;
  
  ev.stopPropagation?.();
  ev.preventDefault?.();
  
  activateGuards();
  prepareAndOpenOverlay();
}

function activateGuards() {
  _swallowNextDocClick = true;
  setTimeout(() => { _swallowNextDocClick = false; }, 250);
  _suppressMobileNavbar = true;
  removeDetailsMobileNavbar();
}

function prepareAndOpenOverlay() {
  const elements = getEditFormElements();
  populateEditForm(elements);
  toggleEditContact();
}

// Contact saving
function saveEditedContact() {
  const ev = window.event;
  if (ev && typeof ev.stopPropagation === 'function') {
    ev.stopPropagation();
  }
  
  setupSaveGuards();
  
  if (!validateEditContactForm()) return;
  
  updateContactData();
  saveToFirebase();
}

function setupSaveGuards() {
  _swallowNextDocClick = true;
  setTimeout(() => { _swallowNextDocClick = false; }, 300);
  _suppressMobileNavbar = true;
  setTimeout(() => { _suppressMobileNavbar = false; }, 350);
}

function updateContactData() {
  currentContact.name = $("edit-name-input").value;
  currentContact.email = $("edit-email-input").value;
  currentContact.phone = $("edit-phone-input").value;
}

function saveToFirebase() {
  import("https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js")
    .then(({ getDatabase, ref, update }) => {
      import("./firebase.js").then(({ app }) => {
        const db = getDatabase(app);
        const contactRef = ref(db, `contacts/${currentContact.id}`);
        const updateData = {
          name: currentContact.name,
          email: currentContact.email,
          phone: currentContact.phone,
          colorIndex: currentContact.colorIndex,
          initials: getInitials(currentContact.name),
        };
        
        update(contactRef, updateData).then(() => {
          handleSaveSuccess();
        });
      });
    });
}

function handleSaveSuccess() {
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
  setTimeout(() => {
    _editOverlayClosing = false;
    _suppressMobileNavbar = false;
  }, 350);
}

// Contact deletion
function deleteContactAndGoBack(event) {
  event.stopPropagation();
  deleteContact();
  detailsMobileBack();
}

// Contact rendering
function getContactPerson(key, id) {
  const contactData = {
    name: key.name,
    email: key.email,
    phone: key.phone,
    initials: key.initials || getInitials(key.name),
    savedColorIndex: key.colorIndex || ((id.charCodeAt(0) % 15) + 1),
    id: id
  };
  return window.contactPersonTemplate(contactData);
}