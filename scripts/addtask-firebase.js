import { getDatabase, ref, push, set, get } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { app, auth } from "./firebase.js";

let db = getDatabase(app);
let loadedContacts = {};

function waitForElementById(id, timeout = 8000) {
  return new Promise((resolve, reject) => {
    const elNow = document.getElementById(id);
    if (elNow) return resolve(elNow);
    const obs = new MutationObserver(() => {
      const el = document.getElementById(id);
      if (el) { obs.disconnect(); resolve(el); }
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
    if (timeout) setTimeout(() => {
      obs.disconnect();
      const el = document.getElementById(id);
      if (el) resolve(el); else reject(new Error('waitForElementById timeout: #' + id));
    }, timeout);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAddTaskContacts);
} else {
  initAddTaskContacts();
}

async function initAddTaskContacts() {
  try {
    await waitForElementById('contact-list-box');
    loadContactsAndRender();
  } catch (_) {
    // ignore if the page doesn't have the list (e.g., different view)
  }
  // bind search when input appears
  try {
    const input = await waitForElementById('contact-input', 2000);
    if (input && !input._bound) {
      input._bound = true;
      input.addEventListener('input', contactInputHandler);
    }
  } catch (_) {/* optional */}
}


// User initials
onAuthStateChanged(auth, (user) => {
  if (window.updateUserInitials) {
    window.updateUserInitials(user);
  }
});

// load contact onload page
function loadContactsAndRender() {
  const contactListBox = $("contact-list-box") || document.getElementById("contact-list-box");
  if (!contactListBox) {
    console.warn("[addtask-firebase] contact-list-box not found in DOM, skipping render");
    return;
  }
  contactListBox.innerHTML = "";
  get(ref(db, "contacts")).then((snapshot) => {
    if (snapshot && snapshot.exists()) {
      loadedContacts = snapshot.val();
      renderContacts(loadedContacts, contactListBox);
    }
  }).catch((err) => {
    console.error("Failed to load contacts:", err);
  });
}

function contactInputHandler(e) {
  const value = (e?.target?.value || '').trim().toLowerCase();
  const box = $("contact-list-box") || document.getElementById('contact-list-box');
  if (!box) return;
  box.classList.remove('d-none');
  let filtered = {};
  if (!value) {
    Object.assign(filtered, loadedContacts);
  } else {
    for (let id in loadedContacts) {
      const c = loadedContacts[id];
      const parts = (c?.name || '').trim().toLowerCase().split(' ');
      if (parts.some(p => p.startsWith(value))) filtered[id] = c;
    }
  }
  box.innerHTML = '';
  renderContacts(filtered, box);
}
// bind immediately if input is already present
(function(){
  const ci = $("contact-input");
  if (ci && !ci._bound) { ci._bound = true; ci.addEventListener('input', contactInputHandler); }
})();

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
      <div class="contact-initial" style="background-image: url(./assets/icons/contact/color${contact.colorIndex}.svg)">
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
    subtasks: subtasks.map(name => ({ name, checked: false }))
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
  if (!window.location.pathname.endsWith("addtask.html")) {
    window.toggleAddTaskBoard();
  }
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
      const layout = $("layout");
      const slideInBanner = $("slide-in-banner");
      if (layout) layout.style.opacity = "0.3";
      if (slideInBanner) slideInBanner.classList.add("visible");
      setTimeout(() => {
        if (slideInBanner) slideInBanner.classList.remove("visible");
        if (layout) layout.style.opacity = "1";
        $("cancel-button").click();
        if (!window.location.pathname.endsWith("board.html")) {
          window.location.href = "./board.html";
        }
      }, 1200);
    })
    .catch((error) => {
      console.error("Fehler beim Speichern:", error);
    });
}