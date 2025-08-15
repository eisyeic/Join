import { getDatabase, ref, push, set, get } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { app, auth } from "./firebase.js";

let db = getDatabase(app);
let loadedContacts = {};

// Handles user authentication state changes
onAuthStateChanged(auth, (user) => {
  if (window.updateUserInitials) {
    window.updateUserInitials(user);
  }
});

// Loads contacts from Firebase and renders them
function loadContactsAndRender() {
  const contactListBox = getContactListBox();
  if (!contactListBox) return;
  
  contactListBox.innerHTML = "";
  get(ref(db, "contacts"))
    .then(handleContactsSnapshot)
    .catch(handleContactsError);
}

// Gets contact list box element
function getContactListBox() {
  const box = $("contact-list-box");
  if (!box) {
    console.warn("[addtask-firebase] contact-list-box not found in DOM");
  }
  return box;
}

// Handles contacts snapshot from Firebase
function handleContactsSnapshot(snapshot) {
  if (snapshot && snapshot.exists()) {
    loadedContacts = snapshot.val();
    const contactListBox = getContactListBox();
    if (contactListBox) window.renderContacts(loadedContacts, contactListBox);
  }
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

// Handles contacts loading error
function handleContactsError(err) {
  console.error("Failed to load contacts:", err);
}

// Sends task data to Firebase
function sendTaskToFirebase(taskData) {
  const tasksRef = ref(db, "tasks");
  const newTaskRef = push(tasksRef);
  const task = {
    ...taskData,
    createdAt: new Date().toISOString(),
  };
  
  set(newTaskRef, task)
    .then(() => window.handleTaskSaveSuccess())
    .catch(error => console.error("Fehler beim Speichern:", error));
}

// Export functions for use in addtask.js
window.loadContactsAndRender = loadContactsAndRender;
window.sendTaskToFirebase = sendTaskToFirebase;
window.loadedContacts = loadedContacts;