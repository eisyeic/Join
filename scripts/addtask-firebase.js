import { getDatabase, ref, push, set, get } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { app, auth } from "./firebase.js";

let db = getDatabase(app);
let loadedContacts = {};

loadContactsAndRender();


// User initials
onAuthStateChanged(auth, (user) => {
  if (window.updateUserInitials) {
    window.updateUserInitials(user);
  }
});


// load contact onload page
function loadContactsAndRender() {
  let contactListBox = $("contact-list-box");
  contactListBox.innerHTML = "";
  get(ref(db, "contacts")).then((snapshot) => {
    if (snapshot.exists()) {
      loadedContacts = snapshot.val();
      renderContacts(loadedContacts, contactListBox);
    }
  });
}

// contact input event listener
let contactInput = $("contact-input");
if (contactInput) {
  contactInput.addEventListener("input", function () {
    let searchValue = this.value.trim().toLowerCase();
    let filtered = {};
    $("contact-list-box").classList.remove("d-none");
    if (searchValue.length === 0) {
      Object.assign(filtered, loadedContacts);
    } else {
      for (let id in loadedContacts) {
        let contact = loadedContacts[id];
        let nameParts = contact.name.trim().toLowerCase().split(" ");
        let matches = nameParts.some((part) => part.startsWith(searchValue));
        if (matches) {
          filtered[id] = contact;
        }
      }
    }
    let contactListBox = $("contact-list-box");
    contactListBox.innerHTML = "";
    renderContacts(filtered, contactListBox);
  });
}

// render contacts
function renderContacts(contacts, container) {
    container.innerHTML = "";
  for (let id in contacts) {
    let contact = contacts[id]; 
    let li = createContactListItem(contact, id);
    container.appendChild(li);
  }
}

// create list element contacts
function createContactListItem(contact, id) {
  let li = document.createElement("li");
  li.id = id;
  li.innerHTML = `
    <div>
      <div class="contact-initial" style="background-image: url(../assets/icons/contact/color${contact.colorIndex}.svg)">
        ${contact.initials}
      </div>
      ${contact.name}
    </div>
    <img src="./assets/icons/add_task/check_default.svg" alt="checkbox" />
  `;
  addContactListItemListener(li);
  return li;
}

// click handler contact list
function addContactListItemListener(li) {
  li.addEventListener("click", () => {
    li.classList.toggle("selected");
    let checkboxIcon = li.querySelector("img");
    let isSelected = li.classList.contains("selected");
    checkboxIcon.src = isSelected
      ? "./assets/icons/add_task/check_white.svg"
      : "./assets/icons/add_task/check_default.svg";
    renderSelectedContactInitials();
  });
}

// render selected contacts
function renderSelectedContactInitials() {
  let selectedLis = document.querySelectorAll("#contact-list-box li.selected");
  let contactInitialsBox = document.getElementById("contact-initials");
  contactInitialsBox.innerHTML = "";
  let initialsToShow = Array.from(selectedLis).slice(0, 3);
  initialsToShow.forEach((li) => {
    let initialsEl = li.querySelector(".contact-initial");
    if (initialsEl) {
      let clone = initialsEl.cloneNode(true);
      contactInitialsBox.appendChild(clone);
    }
  });
}

// collect form data
function collectFormData() {
  let column = "todo";
  let title = $("addtask-title").value.trim();
  let description = $("addtask-textarea").value.trim();
  let dueDate = $("datepicker").value.trim();
  let category = $("category-select").querySelector("span").textContent;
let assignedContacts = Array.from(
  document.querySelectorAll("#contact-list-box li.selected")
).map((li) => {
  let id = li.id; 
  let contact = loadedContacts[id];
  return {
    id,
    name: contact.name,
    colorIndex: contact.colorIndex,
    initials: contact.initials,
  };
});
  return {
    column,
    title,
    description,
    dueDate,
    category,
    priority: selectedPriority,
    assignedContacts,
    subtasks,
  };
}

// validate form addtask
function validateFormData(data) {
  let valid = true;
  $("addtask-error").innerHTML = "";
  $("due-date-error").innerHTML = "";
  $("category-selection-error").innerHTML = "";
  if (!data.title) {
    $("addtask-error").innerHTML = "This field is required";
    $("addtask-title").style.borderColor = "var(--error-color)";
    valid = false;
  }
   if (!data.dueDate) {
    $("due-date-error").innerHTML = "Please select a due date";
    $("datepicker-wrapper").style.borderColor = "var(--error-color)";
    valid = false;
  } 
   if (data.category === "Select task category") {
    $("category-selection-error").innerHTML = "Please choose category";
    $("category-select").style.borderColor = "var(--error-color)";
    valid = false;
  } 
  if (!data.priority) {
    valid = false;
  }
  return valid;
} 

// create button check necessary fields filled
$("create-button").addEventListener("click", handleCreateClick);
function handleCreateClick() {
  let taskData = collectFormData();
  let isValid = validateFormData(taskData);
  if (!isValid) return;
  sendTaskToFirebase(taskData);
}

// send to firebase
function sendTaskToFirebase(taskData) {
  let tasksRef = ref(db, "tasks");
  let newTaskRef = push(tasksRef);

  let task = {
    ...taskData,
    createdAt: new Date().toISOString(),
  };
  set(newTaskRef, task)
    .then(() => {
      clearForm();
      window.location.href = "./board.html";
    })
    .catch((error) => {
      console.error("Fehler beim Speichern:", error);
    });
}

// clear form
function clearForm() {
  $("cancel-button").click();
}