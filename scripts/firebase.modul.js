import { db, ref, get, set, push, update, onValue } from "./firebase.js";

async function fetchContacts() {
  const snap = await get(ref(db, "contacts"));
  return snap.exists() ? snap.val() : {};
}

async function loadTaskById(id) {
  const snap = await get(ref(db, `tasks/${id}`));
  return snap.exists() ? snap.val() : null;
}

async function createTask(taskData) {
  const tasksRef = ref(db, "tasks");
  const newRef = push(tasksRef);
  const payload = { ...taskData, createdAt: new Date().toISOString() };
  await set(newRef, payload);
}

async function updateTask(taskId, data) {
  const taskRef = ref(db, `tasks/${taskId}`);
  const payload = { ...data, updatedAt: new Date().toISOString() };
  await update(taskRef, payload);
}

function subscribeContacts(callback) {
  const r = ref(db, "contacts");
  const unsub = onValue(r, (snap) => {
    callback(snap.exists() ? snap.val() : {});
  });
  return typeof unsub === "function" ? unsub : () => {};
}

async function deleteTask(taskId) {
  const { remove } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js");
  await remove(ref(db, `tasks/${taskId}`));
}

if (typeof window !== "undefined") {
  window.FirebaseActions = {
    fetchContacts,
    loadTaskById,
    createTask,
    updateTask,
    subscribeContacts,
    deleteTask,
  };
}

(function loadContactsAndRender() {
  const run = () => {
    let contactListBox = $("contact-list-box");
    if (!contactListBox) return;
    contactListBox.innerHTML = "";
    if (typeof FirebaseActions.fetchContacts === "function") {
      FirebaseActions.fetchContacts()
        .then((contacts) => {
          loadedContacts = contacts || {};
          renderContacts(loadedContacts, contactListBox);
        })
        .catch((e) => console.error("Fehler beim Laden der Kontakte:", e));
    } else {
      console.warn("FirebaseActions.fetchContacts ist nicht verfügbar (firebase.modul.js geladen?)");
    }
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  } else {
    run();
  }
})();