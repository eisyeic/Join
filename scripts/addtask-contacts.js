/**
 * @file AddTask Contacts - Single Responsibility utilities
 * @typedef {Object} Contact
 * @property {string} name
 * @property {string} [initials]
 * @property {number} [colorIndex]
 */

// === SECURITY & VALIDATION ===
function sanitizeContactId(contactId) {
  return String(contactId || '').replace(/[^a-zA-Z0-9_-]/g, '');
}

function sanitizeText(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function validateColorIndex(colorIndex) {
  const index = parseInt(colorIndex, 10);
  return (index >= 1 && index <= 20) ? index : 1;
}

// === DOM ELEMENT CREATION ===
function createContactListItem(contact, contactId) {
  const li = document.createElement('li');
  li.id = sanitizeContactId(contactId);
  setupContactListItemContent(li, contact, contactId);
  attachContactClickHandler(li, contact, contactId);
  return li;
}

function setupContactListItemContent(li, contact, contactId) {
  const template = createContactListItemTemplate(contact, contactId);
  li.innerHTML = template;
}

function attachContactClickHandler(li, contact, contactId) {
  li.addEventListener('click', () => toggleContactSelection(li, contact, contactId));
}

// === DOM MANIPULATION ===
function clearList(list) {
  if (list) list.innerHTML = '';
}

function getContactInitialsBox() {
  return document.querySelector('.contact-initials');
}

function getCheckboxIcon(li) {
  return li.querySelector('img[data-role="checkbox"], img');
}

// === CONTACT RENDERING ===
window.renderContactsForAddTask = function(contacts, contactListBox) {
  if (!contacts || !contactListBox) return;
  clearList(contactListBox);
  renderContactItems(contacts, contactListBox);
};

function renderContactItems(contacts, container) {
  Object.keys(contacts).forEach(contactId => {
    const contactItem = createContactListItem(contacts[contactId], contactId);
    container.appendChild(contactItem);
  });
}

// === SEARCH FUNCTIONALITY ===
let cachedContactItems = null;

window.onContactInputForAddTask = function(event) {
  const searchTerm = extractSearchTerm(event);
  filterContactItems(searchTerm);
};

function extractSearchTerm(event) {
  return String(event?.target?.value || '').toLowerCase().trim();
}

function filterContactItems(searchTerm) {
  if (!cachedContactItems) {
    cachedContactItems = document.querySelectorAll('#contact-list-box li');
  }
  
  cachedContactItems.forEach(item => {
    const isVisible = item.textContent.toLowerCase().includes(searchTerm);
    item.style.display = isVisible ? 'flex' : 'none';
  });
}

// === SELECTION STATE ===
function isContactSelected(li) {
  return li.classList.contains('selected');
}

function toggleContactSelection(li, contact, contactId) {
  if (isContactSelected(li)) {
    performContactDeselection(li, contactId);
  } else {
    performContactSelection(li, contact, contactId);
  }
  updateUIAfterSelectionChange();
}

function performContactSelection(li, contact, contactId) {
  li.classList.add('selected');
  updateCheckboxIcon(li, true);
  addContactInitial(contact, contactId);
}

function performContactDeselection(li, contactId) {
  li.classList.remove('selected');
  updateCheckboxIcon(li, false);
  removeContactInitial(contactId);
}

// === CHECKBOX MANAGEMENT ===
function updateCheckboxIcon(li, isSelected) {
  const checkbox = getCheckboxIcon(li);
  if (checkbox) {
    checkbox.src = getCheckboxIconPath(isSelected);
  }
}

function getCheckboxIconPath(isSelected) {
  return isSelected
    ? './assets/icons/add_task/check_white.svg'
    : './assets/icons/add_task/check_default.svg';
}

// === INITIALS MANAGEMENT ===
function addContactInitial(contact, contactId) {
  const box = getContactInitialsBox();
  if (!box) return;
  
  const initialElement = createInitialElement(contact, contactId);
  box.appendChild(initialElement);
}

function createInitialElement(contact, contactId) {
  const div = document.createElement('div');
  div.className = 'contact-initial';
  div.dataset.contactId = sanitizeContactId(contactId);
  
  const colorIndex = validateColorIndex(contact.colorIndex);
  div.style.backgroundImage = `url(./assets/general_elements/icons/color${colorIndex}.svg)`;
  
  const initials = contact.initials || generateInitials(contact.name);
  div.textContent = sanitizeText(initials);
  
  return div;
}

function removeContactInitial(contactId) {
  const sanitizedId = sanitizeContactId(contactId);
  const selector = `.contact-initials [data-contact-id="${sanitizedId}"]`;
  const initial = document.querySelector(selector);
  if (initial) initial.remove();
}

function generateInitials(name) {
  if (!name) return '';
  return name.split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// === UI STATE UPDATES ===
function updateUIAfterSelectionChange() {
  try {
    updateSelectedContactsDataset();
    updateInitialsVisibility();
    applyCappingIfAvailable();
  } catch (error) {
    console.warn('Selection update error:', error);
    recoverFromSelectionError();
  }
}

function recoverFromSelectionError() {
  // Ensure UI remains in consistent state
  const box = getContactInitialsBox();
  if (box && !document.querySelector('#contact-list-box li.selected')) {
    box.classList.add('d-none');
  }
}

function updateInitialsVisibility() {
  const box = getContactInitialsBox();
  if (!box) return;
  
  const hasSelections = hasSelectedContacts();
  box.classList.toggle('d-none', !hasSelections);
}

function hasSelectedContacts() {
  return document.querySelector('#contact-list-box li.selected') !== null;
}

function applyCappingIfAvailable() {
  if (typeof window.applyAssignedInitialsCap === 'function') {
    window.applyAssignedInitialsCap();
  }
}

// === DATA SYNCHRONIZATION ===
function updateSelectedContactsDataset() {
  const selectedIds = getSelectedContactIds();
  storeSelectedContactIds(selectedIds);
}

function getSelectedContactIds() {
  const selectedItems = document.querySelectorAll('#contact-list-box li.selected');
  return Array.from(selectedItems).map(li => li.id);
}

function storeSelectedContactIds(selectedIds) {
  const assignedSelectBox = document.getElementById('assigned-select-box');
  if (assignedSelectBox) {
    assignedSelectBox.dataset.selected = JSON.stringify(selectedIds);
  }
}

// === EVENT HANDLERS ===
function handleAssignedClickOutside(event) {
  if (!isValidClickEvent(event)) return;
  
  const isOutsideAssigned = !isClickInsideAssignedArea(event.target);
  if (isOutsideAssigned) {
    executeOutsideClickActions();
  }
}

function isValidClickEvent(event) {
  return event?.target;
}

function isClickInsideAssignedArea(target) {
  const selectBox = document.getElementById("assigned-select-box");
  const list = document.getElementById("contact-list-box");
  return (selectBox?.contains(target)) || (list?.contains(target));
}

function executeOutsideClickActions() {
  if (typeof closeAssignedList === 'function') closeAssignedList();
  if (typeof window.applyAssignedInitialsCap === 'function') window.applyAssignedInitialsCap();
  if (typeof updateInitialsVisibility === 'function') updateInitialsVisibility();
}

// === CLEANUP FUNCTIONS ===
function clearAssignedContacts() {
  clearSelectedStates();
  clearInitialsDisplay();
  resetCachedElements();
}

function clearSelectedStates() {
  document.querySelectorAll("#contact-list-box li.selected").forEach(li => {
    li.classList.remove("selected");
    resetCheckboxIcon(li);
  });
}

function resetCheckboxIcon(li) {
  const checkboxIcon = getCheckboxIcon(li);
  if (checkboxIcon) {
    checkboxIcon.src = "./assets/icons/add_task/check_default.svg";
  }
}

function clearInitialsDisplay() {
  const box = getContactInitialsBox();
  if (box) {
    box.classList.add("d-none");
    box.innerHTML = "";
  }
}

function resetCachedElements() {
  cachedContactItems = null;
}