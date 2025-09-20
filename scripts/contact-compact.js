/**
 * @file Contacts (compact): details view, edit overlay, validation, and Firebase updates.
 * Functions follow single-responsibility and are kept ≤14 lines each. Public APIs unchanged.
 */
/** Initialize contact module: observers, click guards, escape handling */
(function initContact() {
  setupAllContactHandlers();
})()

/** Setup all contact event handlers */
function setupAllContactHandlers() {
  setupMobileNavbarObserver();
  setupClickGuard();
  setupOverlayCloseHandler();
  setupEscapeHandler();
};

/** Rolling color index used for new contacts. */
window.colorIndex = 0;
/** Prevents immediate re-open of edit overlay after closing. */
let _editOverlayClosing = false;
/** Swallow the next document click after save to avoid background toggles. */
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
 * Ensure a MutationObserver exists that hides the mobile navbar while suppression is active.
 * @returns {void}
 */
function ensureMobileNavbarLockObserver(){
  if (_navbarLockObserver) return;
  _navbarLockObserver = new MutationObserver(() => {
    const el = getMobileNavbarEl();
    if (!el) return;
    if (_suppressMobileNavbar && !el.classList.contains('d-none')) {
      el.classList.add('d-none');
    }
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

/**
 * Reset mobile navbar suppression once the edit overlay is closed.
 * @returns {void}
 */
function resetNavbarIfOverlayClosed(){
  if (!isEditOverlayOpen()) { _suppressMobileNavbar = false; removeDetailsMobileNavbar?.(); }
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
  document.addEventListener('click', () => {
    setTimeout(() => {
      if (!isEditOverlayOpen()) {
        _suppressMobileNavbar = false; 
        removeDetailsMobileNavbar?.(); 
      }
    }, 0);
  });
}

/**
 * Close on Escape: when overlay closes, reset navbar.
 * @returns {void}
 */
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
  const root = findEditOverlayRoot();
  if (root) return isElementVisible(root);
  const el = document.getElementById('edit-name-input');
  if (!el) return false;
  if (el.closest('.d-none')) return false;
  return isElementVisible(/** @type {HTMLElement} */(el));
}

/**
 * Update global currentContact state.
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
 * Render details into the given container.
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
 * Apply mobile/desktop layout rules for the details view.
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
  if (mobile) { getNewLayoutDetails?.(name,email,phone,colorIndex,d); removeDetailsMobileNavbar?.(); }
  else { removeDetailsMobileNavbar?.(); }
}

/**
 * Show contact details in the details pane and handle mobile layout
 * @returns {void}
 */
function showContactDetails(name, email, phone, colorIndex, id) {
  updateContactState(name, email, phone, colorIndex, id);
  updateContactDisplay(name, email, phone, colorIndex, id);
}

/** Update contact state */
function updateContactState(name, email, phone, colorIndex, id) {
  setCurrentContact(name, email, phone, colorIndex, id);
  markActiveContact(id);
}

/** Update contact display */
function updateContactDisplay(name, email, phone, colorIndex, id) {
  const elements = getDetailsElements();
  renderDetails(elements.details, name, email, phone, colorIndex);
  applyDetailsLayout(elements.details, elements.addContainer, name, email, phone, colorIndex);
}

/** Get details elements */
function getDetailsElements() {
  return {
    details: $("contact-details"),
    addContainer: $("add-new-contact-container")
  };
}

/**
 * Mobile back: hide details, show add-contact panel
 * @returns {void}
 */
function detailsMobileBack() {
  const elements = getMobileBackElements();
  hideMobileDetails(elements.details);
  showAddContactPanel(elements.addContainer);
  cleanupMobileNavbar();
}

/** Get mobile back elements */
function getMobileBackElements() {
  return {
    details: $("contact-details"),
    addContainer: $("add-new-contact-container")
  };
}

/** Hide mobile details */
function hideMobileDetails(details) {
  details.classList.remove("mobile-visible");
  details.classList.add("d-none");
}

/** Show add contact panel */
function showAddContactPanel(addContainer) {
  addContainer.classList.remove("d-none");
}

/** Cleanup mobile navbar */
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

/** Hide the mobile navbar; stops propagation if event is provided. */
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
 * Get handles to edit form elements inside the overlay.
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
 * Populate the edit form fields from currentContact.
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
  if (!target) return false;
  if (target.closest('.contact-person')) return false;
  return !!(target.closest('#single-person-content-mobile-navbar') || target.closest('#edit-contact-button') || target.closest('[data-role="edit-contact-trigger"]'));
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
  
  executeEditOverlayOpen(e);
}

/** Check if edit overlay should open */
function shouldOpenEditOverlay(e) {
  const ev = getNormalizedEvent(e);
  if (!ev) return false;
  
  const target = ev.target instanceof Element ? ev.target : null;
  return isAllowedEditTrigger(target) && !_editOverlayClosing;
}

/** Execute edit overlay opening */
function executeEditOverlayOpen(e) {
  const ev = getNormalizedEvent(e);
  preventEventDefaults(ev);
  armClickAndNavbarGuards();
  prepareEditOverlay();
}

/** Prevent event defaults */
function preventEventDefaults(ev) {
  ev.stopPropagation?.();
  ev.preventDefault?.();
}

/** Copy values from edit form into currentContact. */
function getUpdatedContactData() {
  currentContact.name = $("edit-name-input").value;
  currentContact.email = $("edit-email-input").value;
  currentContact.phone = $("edit-phone-input").value;
}

/** Build update payload for Firebase from currentContact. */
function getContactUpdateData() {
  return {
    name: currentContact.name,
    email: currentContact.email,
    phone: currentContact.phone,
    colorIndex: currentContact.colorIndex,
    initials: getInitials(currentContact.name),
  };
}

/** After successful update: refresh UI and close overlay safely */
function handleUpdateSuccess() {
  refreshContactDetails();
  closeEditOverlaySafely();
}

/** Refresh contact details display */
function refreshContactDetails() {
  showContactDetails(
    currentContact.name,
    currentContact.email,
    currentContact.phone,
    currentContact.colorIndex,
    currentContact.id
  );
}

/** Close edit overlay safely */
function closeEditOverlaySafely() {
  setOverlayClosingState();
  toggleEditContact();
  suppressMobileNavbarTemporarily();
}

/** Set overlay closing state */
function setOverlayClosingState() {
  _editOverlayClosing = true;
  _suppressMobileNavbar = true;
}

/** Suppress mobile navbar temporarily */
function suppressMobileNavbarTemporarily() {
  setTimeout(() => {
    _editOverlayClosing = false;
    _suppressMobileNavbar = false;
  }, 350);
}

/** Persist the edited contact to Firebase and update UI on success */
function updateContactInFirebase() {
  loadFirebaseModules()
    .then(modules => performFirebaseUpdate(modules))
    .then(() => handleUpdateSuccess());
}

/** Load Firebase modules */
function loadFirebaseModules() {
  return import('https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js')
    .then(({ getDatabase, ref, update }) => 
      import('./firebase.js').then(({ app }) => ({ getDatabase, ref, update, app })));
}

/** Perform Firebase update */
function performFirebaseUpdate(modules) {
  const { getDatabase, ref, update, app } = modules;
  const db = getDatabase(app);
  const contactRef = ref(db, `contacts/${currentContact.id}`);
  const updateData = getContactUpdateData();
  return update(contactRef, updateData);
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

/** Clears all edit form error states. */
function clearEditFormErrors() {
  clearFieldError("edit-name-input");
  clearFieldError("edit-email-input");
  clearFieldError("edit-phone-input");
}