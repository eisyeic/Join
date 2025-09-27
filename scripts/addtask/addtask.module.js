import { getDatabase, ref, get, onValue, push, set, update } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { app } from "../firebase.js";
const db = getDatabase(app);

let loadedContacts = {};
const FirebaseActions = (window.FirebaseActions ||= {});

window.mapContact = function mapContact(id) {
  const c = loadedContacts[id] || {};
  const initials = c.initials || (c.name ? c.name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase() : "");
  return { id, name: c.name || String(id), colorIndex: c.colorIndex ?? 1, initials };
}

window.createTask = async function createTask(taskData) {
  const tasksRef = ref(db, "tasks");
  const newRef = push(tasksRef);
  const payload = { ...taskData, createdAt: new Date().toISOString() };
  await set(newRef, payload);
  return newRef.key;
}

window.updateTask = async function updateTask(taskId, data) {
  const taskRef = ref(db, `tasks/${taskId}`);
  const payload = { ...data, updatedAt: new Date().toISOString() };
  await update(taskRef, payload);
}

window.deleteTask = async function deleteTask(taskId) {
  const { remove } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js");
  await remove(ref(db, `tasks/${taskId}`));
}

window.fetchContacts = async function fetchContacts() {
  const snap = await get(ref(db, "contacts"));
  const data = snap.exists() ? snap.val() : {};
  loadedContacts = data || {};
  window.loadedContacts = loadedContacts;
  try {
    document.dispatchEvent(new CustomEvent("addtask:contacts-loaded", { detail: { contacts: loadedContacts } }));
  } catch {}
  return loadedContacts;
}

window.subscribeContacts = function subscribeContacts(callback) {
  const r = ref(db, "contacts");
  const unsub = onValue(r, (snap) => {
    const data = snap.exists() ? snap.val() : {};
    loadedContacts = data || {};
    window.loadedContacts = loadedContacts;
    try {
      document.dispatchEvent(new CustomEvent("addtask:contacts-loaded", { detail: { contacts: loadedContacts } }));
    } catch {}
    if (typeof callback === "function") callback(loadedContacts);
  });
  return typeof unsub === "function" ? unsub : () => {};
}

window.loadTaskById = async function loadTaskById(id) {
  const snap = await get(ref(db, `tasks/${id}`));
  return snap.exists() ? snap.val() : null;
}

window.sendTaskToFirebase = function sendTaskToFirebase(taskData) {
  createTask(taskData)
    .then(() => { showBanner(); finishCreateFlow(); })
    .catch((e) => console.error("Fehler beim Speichern:", e));
}

window.updateTaskInFirebase = function updateTaskInFirebase(taskId, taskData) {
  const toSave = {
    column: taskData.column,
    title: taskData.title,
    description: taskData.description,
    dueDate: taskData.dueDate,
    category: taskData.category,
    priority: taskData.priority,
    assignedContacts: taskData.assignedContacts,
    subtasks: taskData.subtasks,
    updatedAt: new Date().toISOString(),
  };
  updateTask(taskId, toSave)
    .then(() => { showBanner(); finishUpdateFlow(); })
    .catch((e) => console.error("Fehler beim Aktualisieren:", e));
}

window.handleCreateClick = function handleCreateClick() {
  const data = collectFormData();
  if (!validateFormData(data)) return;
  sendTaskToFirebase(data);
  if (!window.location.pathname.endsWith("addtask.html")) window.toggleAddTaskBoard();
}

window.handleEditOkClick = async function handleEditOkClick() {
  const taskData = collectFormData();
  if (!validateFormData(taskData)) return;
  const taskId = getEditingId();
  if (!taskId) return sendTaskToFirebase(taskData);
  try {
    if (typeof FirebaseActions.loadTaskById === "function") {
      const oldTask = await FirebaseActions.loadTaskById(taskId);
      if (oldTask) taskData.column = oldTask.column ?? taskData.column;
    }
  } catch (e) { console.warn("Konnte alten Task nicht laden:", e); }
  updateTaskInFirebase(taskId, taskData);
}

if (typeof window !== "undefined") {
  const api = (window.FirebaseActions ||= {});
  Object.assign(api, {
    fetchContacts,
    subscribeContacts,
    createTask,
    updateTask,
    deleteTask,
    loadTaskById,
  });
}