/**
 * @file Contacts: details view, edit overlay controls, and mobile navbar handling.
 * Functions are kept short (≤14 lines) and single-purpose. Public APIs unchanged.
 */

// Contact management
/**
 * Initialize contact module
 * @returns {void}
 */
(function initContact() {
  setupAllEventHandlers();
})()

/**
 * Sets up all event handlers
 */
function setupAllEventHandlers() {
  setupMobileNavbarObserver();
  setupClickGuard();
  setupOverlayCloseHandler();
  setupEscapeHandler();
};

window.showContactDetails = showContactDetails;
window.detailsMobileBack = detailsMobileBack;
window.addDetailsMobileNavbar = addDetailsMobileNavbar;
window.removeDetailsMobileNavbar = removeDetailsMobileNavbar;
window.saveEditedContact = saveEditedContact;
window.deleteContactAndGoBack = deleteContactAndGoBack;

/** Rolling color index used when creating new contacts. */
window.colorIndex = 0;
/** Prevent immediate re-open of the edit overlay after closing. */
let _editOverlayClosing = false;
/** Swallow the next document click right after saving to avoid background handlers toggling overlays. */
let _swallowNextDocClick = false;
/** Suppress unintended mobile navbar visibility while editing. */
let _suppressMobileNavbar = false;
/** MutationObserver that enforces navbar suppression. */
let _navbarLockObserver = null;

/**
 * Get the mobile navbar element.
 * @returns {HTMLElement|null}
 */
function getMobileNavbarEl(){
  return document.getElementById('single-person-content-mobile-navbar');
}

/**
 * Reset mobile navbar suppression once the edit overlay is closed.
 * @returns {void}
 */
function resetNavbarIfOverlayClosed(){
  if (!isEditOverlayOpen()) { _suppressMobileNavbar = false; removeDetailsMobileNavbar?.(); }
}

/**
 * Ensure a MutationObserver exists that hides the mobile navbar while suppression is active.
 * @returns {void}
 */
function ensureMobileNavbarLockObserver(){
  if (_navbarLockObserver) return;
  _navbarLockObserver = new MutationObserver(() => {
    const el = getMobileNavbarEl();
    if (!el) return;
    if (_suppressMobileNavbar && !el.classList.contains('d-none')) el.classList.add('d-none');
  });
  _navbarLockObserver.observe(document.documentElement, { attributes:true, subtree:true, attributeFilter:['class'] });
}

/**
 * Setup mobile navbar observer on DOM ready.
 * @returns {void}
 */
function setupMobileNavbarObserver() {
  document.addEventListener('DOMContentLoaded', ensureMobileNavbarLockObserver);
}

/** Patch: wraps toggleEditContact to re-enable navbar when overlay closes. */
(function patchToggleEditContactOnce(){
  if (window._toggleEditPatched) return;
  const orig = window.toggleEditContact;
  if (typeof orig !== 'function') return;
  window.toggleEditContact = function patchedToggleEditContact() {
    const result = orig.apply(this, arguments);
    setTimeout(() => { resetNavbarIfOverlayClosed(); }, 0);
    return result;
  };
  window._toggleEditPatched = true;
})();

/**
 * Swallow the next document click when guard is active.
 * @returns {void}
 */
function setupClickGuard() {
  document.addEventListener('click', function(e){
    if (_swallowNextDocClick) {
      e.stopPropagation();
      e.preventDefault();
      _swallowNextDocClick = false;
    }
  }, { capture: true });
}

/**
 * On document clicks, if overlay ended up closed, reset mobile navbar.
 * @returns {void}
 */
function setupOverlayCloseHandler() {
  document.addEventListener('click', () => { setTimeout(() => { resetNavbarIfOverlayClosed(); }, 0); });
}

/**
 * Close on Escape: when overlay closes, reset navbar.
 * @returns {void}
 */
function setupEscapeHandler() {
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') setTimeout(() => { resetNavbarIfOverlayClosed(); }, 0);
  });
}

/**
 * Try to find the edit overlay root element.
 * @returns {HTMLElement|null}
 */
function findEditOverlayRoot(){
  return document.getElementById('edit-contact-overlay') ||
    document.querySelector('#edit-contact, .edit-contact-overlay, .contact-edit-overlay, .edit-contact');
}

/**
 * Check if an element is visually visible.
 * @param {HTMLElement} el
 * @returns {boolean}
 */
function isElementVisible(el){
  const cs = window.getComputedStyle(el);
  if (el.classList.contains('d-none')) return false;
  if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return false;
  return el.offsetParent !== null && el.getClientRects().length > 0;
}

/**
 * Returns true if the edit-contact overlay is visible.
 * @returns {boolean}
 */
function isEditOverlayOpen() {
  const overlayRoot = findEditOverlayRoot();
  if (overlayRoot) return isElementVisible(overlayRoot);
  const el = document.getElementById('edit-name-input');
  if (!el) return false;
  if (el.closest('.d-none')) return false;
  return isElementVisible(/** @type {HTMLElement} */(el));
}

/**
 * Derive up to two initials from a full name.
 * @param {string} name
 * @returns {string}
 */
window.getInitials = function (name) {
  const words = name.split(" ");
  const firstInitial = words[0] ? words[0][0].toUpperCase() : "";
  const secondInitial = words[1] ? words[1][0].toUpperCase() : "";
  return firstInitial + secondInitial;
};

/**
 * Update currentContact object.
 * @param {string} name
 * @param {string} email
 * @param {string} phone
 * @param {number} colorIndex
 * @param {string} id
 * @returns {void}
 */
function setCurrentContact(name,email,phone,colorIndex,id){
  currentContact = { name, email, phone, colorIndex, id };
}

/**
 * Mark the active contact in the list.
 * @param {string} id
 * @returns {void}
 */
function markActiveContact(id){
  document.querySelectorAll('.contact-person.active').forEach(el => el.classList.remove('active'));
  document.querySelector(`.contact-person[onclick*="'${id}'"]`)?.classList.add('active');
}

/**
 * Render details section content.
 * @param {HTMLElement} d
 * @param {string} name
 * @param {string} email
 * @param {string} phone
 * @param {number} colorIndex
 * @returns {void}
 */
function renderDetails(d,name,email,phone,colorIndex){
  d.replaceChildren();
  getContactDetails(name, email, phone, colorIndex, d);
  d.classList.remove('d-none');
}

/**
 * Apply mobile/desktop layout toggles for details pane.
 * @param {HTMLElement} d
 * @param {HTMLElement} a
 * @param {string} name
 * @param {string} email
 * @param {string} phone
 * @param {number} colorIndex
 * @returns {void}
 */
function applyDetailsLayout(d,a,name,email,phone,colorIndex){
  const mobile = window.innerWidth <= 900;
  d.classList.toggle('mobile-visible', mobile);
  a.classList.toggle('d-none', mobile);
  if (mobile) { getNewLayoutDetails?.(name, email, phone, colorIndex, d); removeDetailsMobileNavbar?.(); }
  else { removeDetailsMobileNavbar?.(); }
}

/**
 * Show contact details in the details pane and handle mobile layout
 * @returns {void}
 */
function showContactDetails(name, email, phone, colorIndex, id) {
  updateCurrentContact(name, email, phone, colorIndex, id);
  updateContactUI(name, email, phone, colorIndex, id);
}

/**
 * Updates current contact data
 * @param {string} name
 * @param {string} email
 * @param {string} phone
 * @param {number} colorIndex
 * @param {string} id
 */
function updateCurrentContact(name, email, phone, colorIndex, id) {
  setCurrentContact(name, email, phone, colorIndex, id);
}

/**
 * Updates contact UI elements
 * @param {string} name
 * @param {string} email
 * @param {string} phone
 * @param {number} colorIndex
 * @param {string} id
 */
function updateContactUI(name, email, phone, colorIndex, id) {
  const elements = getDetailsElements();
  markActiveContact(id);
  renderDetails(elements.details, name, email, phone, colorIndex);
  applyDetailsLayout(elements.details, elements.addContainer, name, email, phone, colorIndex);
}

/**
 * Gets details UI elements
 * @returns {Object}
 */
function getDetailsElements() {
  return {
    details: $("contact-details"),
    addContainer: $("add-new-contact-container")
  };
}

/**
 * Mobile back action: hide details, show add-contact panel
 * @returns {void}
 */
function detailsMobileBack() {
  const elements = getMobileBackElements();
  hideMobileDetails(elements.details);
  showAddContainer(elements.addContainer);
  cleanupMobileNavbar();
}

/**
 * Gets elements for mobile back action
 * @returns {Object}
 */
function getMobileBackElements() {
  return {
    details: $("contact-details"),
    addContainer: $("add-new-contact-container")
  };
}

/**
 * Hides mobile details view
 * @param {HTMLElement} details
 */
function hideMobileDetails(details) {
  details.classList.remove("mobile-visible");
  details.classList.add("d-none");
}

/**
 * Shows add container
 * @param {HTMLElement} addContainer
 */
function showAddContainer(addContainer) {
  addContainer.classList.remove("d-none");
}

/**
 * Cleans up mobile navbar
 */
function cleanupMobileNavbar() {
  removeDetailsMobileNavbar?.();
}

/** Show the mobile navbar in contact details view. */
function addDetailsMobileNavbar() {
  const el = $("single-person-content-mobile-navbar");
  if (!el) return;
  if (_suppressMobileNavbar) { el.classList.add('d-none'); return; }
  if (el.classList.contains("d-none")) el.classList.remove("d-none");
}

/** Hide the mobile navbar. Stops propagation if an event is provided. */
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
 * @returns {{nameInput:HTMLInputElement,emailInput:HTMLInputElement,phoneInput:HTMLInputElement,iconImg:HTMLImageElement,iconText:HTMLElement}}
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
 * Normalize incoming event from click.
 * @param {Event|undefined} e
 * @returns {Event|null}
 */
function getNormalizedEvent(e){
  return e || (typeof window !== 'undefined' && window.event ? window.event : null);
}

/**
 * Determine if the event target is allowed to open the overlay.
 * @param {Element|null} target
 * @returns {boolean}
 */
function isAllowedEditTrigger(target){
  return true;
}

/**
 * Temporarily swallow next document click and suppress navbar.
 * @returns {void}
 */
function armClickAndNavbarGuards(){
  _swallowNextDocClick = true; setTimeout(() => { _swallowNextDocClick = false; }, 250);
  _suppressMobileNavbar = true; removeDetailsMobileNavbar();
}

/**
 * Prepare and open the edit overlay with prefilled fields.
 * @returns {void}
 */
function prepareEditOverlay(){
  const elements = getEditFormElements();
  populateEditForm(elements);
  toggleEditContact();
}

/**
 * Opens the Edit-Contact overlay with prefilled fields
 * @param {Event} e
 * @returns {void}
 */
function openEditContact(e) {
  if (!shouldOpenEditOverlay(e)) return;
  
  setupEditOverlay(e);
}

/**
 * Determines if edit overlay should open
 * @param {Event} e
 * @returns {boolean}
 */
function shouldOpenEditOverlay(e) {
  const ev = getNormalizedEvent(e);
  if (!ev) return false;
  
  const target = ev.target instanceof Element ? ev.target : null;
  return isAllowedEditTrigger(target) && !_editOverlayClosing;
}

/**
 * Sets up and opens edit overlay
 * @param {Event} e
 */
function setupEditOverlay(e) {
  const ev = getNormalizedEvent(e);
  preventEventDefaults(ev);
  armClickAndNavbarGuards();
  prepareEditOverlay();
}

/**
 * Prevents event defaults
 * @param {Event} ev
 */
function preventEventDefaults(ev) {
  ev.stopPropagation?.();
  ev.preventDefault?.();
}

// Make openEditContact globally available
window.openEditContact = openEditContact;

/** Copies values from the edit form inputs back into the currentContact object. */
function getUpdatedContactData() {
  currentContact.name = $("edit-name-input").value;
  currentContact.email = $("edit-email-input").value;
  currentContact.phone = $("edit-phone-input").value;
}

/** Builds the update payload for Firebase from the currentContact state. */
function getContactUpdateData() {
  return {
    name: currentContact.name,
    email: currentContact.email,
    phone: currentContact.phone,
    colorIndex: currentContact.colorIndex,
    initials: getInitials(currentContact.name),
  };
}

/** Handles UI updates after a successful contact update save. */
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
 * Validates and saves the edited contact; updates Firebase and guards against menu re-open
 * @returns {void}
 */
function saveEditedContact() {
  handleSaveEvent();
  setupSaveGuards();
  
  if (!validateEditContactForm()) return;
  
  processSaveContact();
}

/**
 * Handles save event
 */
function handleSaveEvent() {
  const ev = getCurrentWindowEvent();
  if (ev && typeof ev.stopPropagation === 'function') {
    ev.stopPropagation();
  }
}

/**
 * Gets current window event
 * @returns {Event|null}
 */
function getCurrentWindowEvent() {
  return (typeof window !== 'undefined' && window.event) ? window.event : null;
}

/**
 * Sets up save guards
 */
function setupSaveGuards() {
  activateClickGuard();
  activateNavbarSuppression();
}

/**
 * Activates click guard
 */
function activateClickGuard() {
  _swallowNextDocClick = true;
  setTimeout(() => { _swallowNextDocClick = false; }, 300);
}

/**
 * Activates navbar suppression
 */
function activateNavbarSuppression() {
  _suppressMobileNavbar = true;
  setTimeout(() => { _suppressMobileNavbar = false; }, 350);
}

/**
 * Processes contact save
 */
function processSaveContact() {
  getUpdatedContactData();
  updateContactInFirebase();
}

/**
 * Deletes the current contact and navigates back in the mobile layout
 * @param {Event} event
 * @returns {void}
 */
function deleteContactAndGoBack(event) {
  handleDeleteEvent(event);
  executeContactDeletion();
}

/**
 * Handles delete event
 * @param {Event} event
 */
function handleDeleteEvent(event) {
  event.stopPropagation();
}

/**
 * Executes contact deletion and navigation
 */
function executeContactDeletion() {
  deleteContact();
  detailsMobileBack();
}

/**
 * Builds a compact contact row as HTML
 * @param {{name:string,email:string,phone:string,colorIndex?:number,initials?:string}} key
 * @param {string} id
 * @returns {string} HTML string for the contact row
 */
function getContactPerson(key, id) {
  const contactData = prepareContactData(key, id);
  return generateContactHTML(contactData);
}

/**
 * Prepares contact data for rendering
 * @param {Object} key
 * @param {string} id
 * @returns {Object}
 */
function prepareContactData(key, id) {
  return {
    name: key.name,
    email: key.email,
    phone: key.phone,
    initials: getContactInitials(key),
    savedColorIndex: getContactColorIndex(key, id),
    id: id
  };
}

/**
 * Gets contact initials
 * @param {Object} key
 * @returns {string}
 */
function getContactInitials(key) {
  return key.initials || getInitials(key.name);
}

/**
 * Gets contact color index
 * @param {Object} key
 * @param {string} id
 * @returns {number}
 */
function getContactColorIndex(key, id) {
  return key.colorIndex || ((id.charCodeAt(0) % 15) + 1);
}

/**
 * Generates contact HTML
 * @param {Object} contactData
 * @returns {string}
 */
function generateContactHTML(contactData) {
  return window.contactPersonTemplate(contactData);
}

// Make getContactPerson globally available
window.getContactPerson = getContactPerson;



