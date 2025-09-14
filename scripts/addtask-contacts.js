/**
 * @file AddTask Contacts rendering & selection utilities.
 * Keeps DOM operations small and focused. Each function has a single responsibility.
 *
 * Assumptions:
 * - `createContactListItemTemplate(contact, contactId)` returns the <li> innerHTML markup.
 * - The contact list container uses the id `#contact-list-box`.
 * - The initials container uses the class `.contact-initials`.
 *
 * @typedef {Object} Contact
 * @property {string} name
 * @property {string} [initials]
 * @property {number} [colorIndex]
 */

/**
 * Create a fully wired <li> element for a contact.
 * @param {Contact} contact
 * @param {string} contactId
 * @returns {HTMLLIElement}
 */
function createContactListItem(contact, contactId) {
  const li = document.createElement('li');
  li.id = contactId;
  li.innerHTML = createContactListItemTemplate(contact, contactId);
  attachContactToggleHandler(li, contact, contactId);
  return li;
}

/**
 * Attach the click handler to toggle selection for a contact list item.
 * @param {HTMLLIElement} li
 * @param {Contact} contact
 * @param {string} contactId
 * @returns {void}
 */
function attachContactToggleHandler(li, contact, contactId) {
  li.addEventListener('click', () => toggleContactSelection(li, contact, contactId));
}

/**
 * Clear all children of the given list element.
 * @param {HTMLElement} list
 * @returns {void}
 */
function clearList(list) {
  list.innerHTML = '';
}

/**
 * Render contacts into the contact list box for AddTask.
 * @param {Record<string, Contact>} contacts - Map of contactId to contact.
 * @param {HTMLElement} contactListBox - The <ul>/<ol> element that holds contacts.
 * @returns {void}
 */
window.renderContactsForAddTask = function(contacts, contactListBox) {
  if (!contacts || !contactListBox) return;
  clearList(contactListBox);
  Object.keys(contacts).forEach((contactId) => {
    const li = createContactListItem(contacts[contactId], contactId);
    contactListBox.appendChild(li);
  });
};

/**
 * Filter the visible contacts by the search term (case-insensitive).
 * @param {InputEvent} event
 * @returns {void}
 */
window.onContactInputForAddTask = function(event) {
  const searchTerm = String(event.target.value || '').toLowerCase();
  filterContactItems('#contact-list-box li', (itemText) => itemText.includes(searchTerm));
};

/**
 * Apply visibility to items based on a predicate.
 * @param {string} selector - Selector for the <li> items.
 * @param {(text: string) => boolean} predicate - Returns true to show the item.
 * @returns {void}
 */
function filterContactItems(selector, predicate) {
  document.querySelectorAll(selector).forEach((item) => {
    const text = item.textContent.toLowerCase();
    item.style.display = predicate(text) ? 'flex' : 'none';
  });
}

/**
 * Toggle selection state for a contact item.
 * @param {HTMLLIElement} li
 * @param {Contact} contact
 * @param {string} contactId
 * @returns {void}
 */
function toggleContactSelection(li, contact, contactId) {
  const selected = li.classList.contains('selected');
  if (selected) {
    deselectContact(li, contactId);
  } else {
    selectContact(li, contact, contactId);
  }
  updateSelectedContactsDataset();
  updateInitialsVisibility();
  applyCappingIfAvailable();
}

/**
 * Mark the contact as selected and update related UI.
 * @param {HTMLLIElement} li
 * @param {Contact} contact
 * @param {string} contactId
 * @returns {void}
 */
function selectContact(li, contact, contactId) {
  li.classList.add('selected');
  updateCheckboxIcon(li, true);
  addContactInitial(contact, contactId);
}

/**
 * Mark the contact as deselected and update related UI.
 * @param {HTMLLIElement} li
 * @param {string} contactId
 * @returns {void}
 */
function deselectContact(li, contactId) {
  li.classList.remove('selected');
  updateCheckboxIcon(li, false);
  removeContactInitial(contactId);
}

/**
 * Update the checkbox icon based on selection state.
 * @param {HTMLLIElement} li
 * @param {boolean} isSelected
 * @returns {void}
 */
function updateCheckboxIcon(li, isSelected) {
  const checkbox = li.querySelector('img');
  if (checkbox) {
    checkbox.src = isSelected
      ? './assets/icons/add_task/check_white.svg'
      : './assets/icons/add_task/check_default.svg';
  }
}

/**
 * Show or hide the initials box depending on selection count.
 * @returns {void}
 */
function updateInitialsVisibility() {
  const box = document.querySelector('.contact-initials');
  if (!box) return;
  const any = document.querySelectorAll('#contact-list-box li.selected').length > 0;
  box.classList.toggle('d-none', !any);
}

/**
 * Apply capping logic if a global helper is present.
 * @returns {void}
 */
function applyCappingIfAvailable() {
  if (typeof window.applyAssignedInitialsCap === 'function') {
    window.applyAssignedInitialsCap();
  }
}

/**
 * Add a single contact initial to the initials box.
 * @param {Contact} contact
 * @param {string} contactId
 * @returns {void}
 */
function addContactInitial(contact, contactId) {
  const contactInitialsBox = document.querySelector('.contact-initials');
  if (!contactInitialsBox) return;
  const initialDiv = document.createElement('div');
  initialDiv.className = 'contact-initial';
  initialDiv.dataset.contactId = contactId;
  initialDiv.style.backgroundImage = `url(./assets/general_elements/icons/color${contact.colorIndex || 1}.svg)`;
  initialDiv.textContent = contact.initials || getInitials(contact.name);
  contactInitialsBox.appendChild(initialDiv);
}

/**
 * Remove a single contact initial by contact id.
 * @param {string} contactId
 * @returns {void}
 */
function removeContactInitial(contactId) {
  const initial = document.querySelector(`.contact-initials [data-contact-id="${contactId}"]`);
  if (initial) {
    initial.remove();
  }
}

/**
 * Sync the selected contact ids to the assigned-select-box dataset.
 * @returns {void}
 */
function updateSelectedContactsDataset() {
  const selectedLis = document.querySelectorAll('#contact-list-box li.selected');
  const selectedIds = Array.from(selectedLis).map(li => li.id);
  const assignedSelectBox = document.getElementById('assigned-select-box');
  if (assignedSelectBox) {
    assignedSelectBox.dataset.selected = JSON.stringify(selectedIds);
  }
}

/**
 * Compute initials from a full name.
 * @param {string} name
 * @returns {string}
 */
function getInitials(name) {
  if (!name) return '';
  return name.split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Close assigned contacts dropdown if the click was outside assigned elements.
 * @param {MouseEvent} event
 * @returns {void}
 */
function handleAssignedClickOutside(event) {
  const target = event.target;
  const selectBox = $("assigned-select-box");
  const list = $("contact-list-box");
  const insideAssigned = selectBox.contains(target) || list.contains(target);
  if (!insideAssigned) {
    closeAssignedList();
    applyAssignedInitialsCap();
    updateInitialsBoxVisibility();
  }
}

/**
 * Remove all selected contacts and clear the initials box.
 * @returns {void}
 */
function clearAssignedContacts() {
  document.querySelectorAll("#contact-list-box li.selected").forEach((li) => {
    li.classList.remove("selected");
    const checkboxIcon = li.querySelectorAll("img")[0];
    if (checkboxIcon) checkboxIcon.src = "./assets/icons/add_task/check_default.svg";
  });
  contactInitialsBox?.classList.add("d-none");
  if (contactInitialsBox) contactInitialsBox.innerHTML = "";
}