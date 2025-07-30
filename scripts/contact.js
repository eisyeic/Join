// ===== GLOBAL VARIABLES =====

// Color index for contact icons
let colorIndex = 0;

// ===== UTILITY FUNCTIONS =====

// Function for initials - globally available
window.getInitials = function (name) {
  const words = name.split(" ");
  const firstInitial = words[0] ? words[0][0].toUpperCase() : "";
  const secondInitial = words[1] ? words[1][0].toUpperCase() : "";
  return firstInitial + secondInitial;
};

// ===== OVERLAY TOGGLE FUNCTIONS =====

// Clear add form inputs
function clearAddFormInputs() {
  $("name-new-contact").value = "";
  $("email-new-contact").value = "";
  $("phone-new-contact").value = "";
}

// Open add contact overlay
function openAddContact() {
  $("contact-overlay-close-add").classList.remove("d-none");
  clearAddFormInputs();
}

// Close add contact overlay
function closeAddContact() {
  $("contact-overlay-close-add").classList.add("d-none");
  clearAddFormInputs();
}

// Toggle add contact overlay (ohne clearing)
function toggleAddContact() {
  $("contact-overlay-close-add").classList.toggle("d-none");
}

// Toggle edit contact overlay
function toggleEditContact() {
  $("contact-overlay-close-edit").classList.toggle("d-none");
}

// Show contact details
function showContactDetails(name, email, phone, colorIndex, id) {
  currentContact = { name, email, phone, colorIndex, id };
  const detailSection = document.getElementById("contact-details");

  getContactDeteails(name, email, phone, colorIndex, id, detailSection);
  detailSection.classList.remove("d-none");

  if (window.innerWidth <= 900) {
    $("contact-details").classList.add("mobile-visible");
    $("add-new-contact-container").style.display = "none";

    getNewLayoutDetails(name, email, phone, colorIndex, detailSection);
  }
}

// Remove details mobile Back
function detailsMobileBack() {
  $("contact-details").classList.remove("mobile-visible");
  $("contact-details").style.display = "none";
  $("add-new-contact-container").style.display = "block";
}

function addDetailsMobileNavbar() {
  $("single-person-content-mobile-navbar").classList.remove("d-none");
}

function removeDetailsMobileNavbar(event) {
  if (event) {
    event.stopPropagation();
  } else {
    $("single-person-content-mobile-navbar").classList.add("d-none");
  }
}

// ===== EDIT CONTACT FUNCTIONS =====

// Get edit form elements
function getEditFormElements() {
  return {
    nameInput: $("edit-name-input"),
    emailInput: $("edit-email-input"),
    phoneInput: $("edit-phone-input"),
    iconImg: $("edit-icon-img"),
    iconText: $("edit-icon-text"),
  };
}

// Populate edit form with current contact data
function populateEditForm(elements) {
  elements.nameInput.value = currentContact.name;
  elements.emailInput.value = currentContact.email;
  elements.phoneInput.value = currentContact.phone;
  elements.iconImg.src = `./assets/general_elements/icons/color${currentContact.colorIndex}.svg`;
  elements.iconText.textContent = getInitials(currentContact.name);
}

// Load Contact Data into Edit Form
function openEditContact() {
  const elements = getEditFormElements();
  populateEditForm(elements);
  toggleEditContact();
}

// ===== SAVE CONTACT FUNCTIONS =====

// Get updated contact data from form
function getUpdatedContactData() {
  currentContact.name = $("edit-name-input").value;
  currentContact.email = $("edit-email-input").value;
  currentContact.phone = $("edit-phone-input").value;
}

// Update contact in Firebase and refresh display
function updateContactInFirebase() {
  import(
    "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js"
  ).then(({ getDatabase, ref, update }) => {
    import("./firebase.js").then(({ app }) => {
      const db = getDatabase(app);
      const contactRef = ref(db, `contacts/${currentContact.id}`);

      update(contactRef, {
        name: currentContact.name,
        email: currentContact.email,
        phone: currentContact.phone,
      }).then(() => {
        showContactDetails(
          currentContact.name,
          currentContact.email,
          currentContact.phone,
          currentContact.colorIndex
        );
        toggleEditContact();
      });
    });
  });
}

// Function to save edited contact data
function saveEditedContact() {
  getUpdatedContactData();
  updateContactInFirebase();
}

// ===== INPUT VALIDATION =====

// Validate phone input - only numbers, +, -, (), spaces
function validatePhoneInput(event) {
  const allowedChars = /[0-9+\-() ]/;
  if (
    !allowedChars.test(event.key) &&
    !["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight"].includes(
      event.key
    )
  ) {
    event.preventDefault();
  }
}

// ===== EVENT LISTENERS =====

// Add event listeners to phone inputs
document.addEventListener("DOMContentLoaded", function () {
  $("edit-phone-input").addEventListener("keydown", validatePhoneInput);
  $("phone-new-contact").addEventListener("keydown", validatePhoneInput);
});

// Delete contact and return to contact list
function deleteContactAndGoBack(event) {
  event.stopPropagation();
  deleteContact();
  detailsMobileBack();
}
