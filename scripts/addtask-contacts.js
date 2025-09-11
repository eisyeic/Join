// AddTask Contact Management Functions

// Render contacts into the contact list box for AddTask
window.renderContactsForAddTask = function(contacts, contactListBox) {
  if (!contacts || !contactListBox) return;
  
  contactListBox.innerHTML = '';
  
  Object.keys(contacts).forEach(contactId => {
    const contact = contacts[contactId];
    const li = document.createElement('li');
    li.id = contactId;
    li.innerHTML = createContactListItemTemplate(contact, contactId);
    
    // Add click handler for contact selection
    li.addEventListener('click', () => toggleContactSelection(li, contact, contactId));
    
    contactListBox.appendChild(li);
  });
};

// Handle contact input for filtering
window.onContactInputForAddTask = function(event) {
  const searchTerm = event.target.value.toLowerCase();
  const contactItems = document.querySelectorAll('#contact-list-box li');
  
  contactItems.forEach(item => {
    const contactName = item.textContent.toLowerCase();
    if (contactName.includes(searchTerm)) {
      item.style.display = 'flex';
    } else {
      item.style.display = 'none';
    }
  });
};

// Toggle contact selection state
function toggleContactSelection(li, contact, contactId) {
  const isSelected = li.classList.contains('selected');
  const checkbox = li.querySelector('img');
  const contactInitialsBox = document.querySelector('.contact-initials');
  
  if (isSelected) {
    // Deselect contact
    li.classList.remove('selected');
    checkbox.src = './assets/icons/add_task/check_default.svg';
    removeContactInitial(contactId);
  } else {
    // Select contact
    li.classList.add('selected');
    checkbox.src = './assets/icons/add_task/check_white.svg';
    addContactInitial(contact, contactId);
  }
  
  // Update dataset
  updateSelectedContactsDataset();
  
  // Show/hide initials box
  const selectedContacts = document.querySelectorAll('#contact-list-box li.selected');
  if (selectedContacts.length > 0) {
    contactInitialsBox?.classList.remove('d-none');
  } else {
    contactInitialsBox?.classList.add('d-none');
  }
  
  // Apply capping
  if (window.applyAssignedInitialsCap) {
    window.applyAssignedInitialsCap();
  }
}

// Add contact initial to the initials box
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

// Remove contact initial from the initials box
function removeContactInitial(contactId) {
  const initial = document.querySelector(`.contact-initials [data-contact-id="${contactId}"]`);
  if (initial) {
    initial.remove();
  }
}

// Update the selected contacts dataset
function updateSelectedContactsDataset() {
  const selectedLis = document.querySelectorAll('#contact-list-box li.selected');
  const selectedIds = Array.from(selectedLis).map(li => li.id);
  const assignedSelectBox = document.getElementById('assigned-select-box');
  
  if (assignedSelectBox) {
    assignedSelectBox.dataset.selected = JSON.stringify(selectedIds);
  }
}

// Helper function to get initials from name
function getInitials(name) {
  if (!name) return '';
  return name.split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}