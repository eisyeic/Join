import {
  getDatabase,
  ref,
  onValue,
  update,
  get
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { app, auth } from "../firebase.js";

const db = getDatabase(app);
onAuthStateChanged(auth, handleAuthChange);

window.loadTasksFromFirebase = function loadTasksFromFirebase() {
  const tasksRef = ref(db, "tasks");
  onValue(tasksRef, (snapshot) => {
    const tasks = snapshot.val() || {};
    renderAllColumns(tasks);
  });
}

window.updateTaskColumn = function updateTaskColumn(taskId, newColumnId) {
  const dbRef = ref(db, `tasks/${taskId}`);
  const newColumnValue = DOM_TO_LOGICAL[newColumnId] || "todo";
  return update(dbRef, { column: newColumnValue, movedAt: Date.now() }).catch(
    (err) => console.error("Fehler beim Aktualisieren der Spalte:", err)
  );
}

window.fetchTask = async function fetchTask(taskId) {
  const snap = await get(ref(db, `tasks/${taskId}`));
  if (!snap.exists()) return null;
  const task = snap.val();
  task.id = taskId;
  return task;
}

window.normalizeSubtasks = async function normalizeSubtasks(taskId, task) {
  if (!task || typeof task !== 'object') return;
  const src = task.subtasks;

  // Coerce Firebase shapes to an array
  let arr;
  if (Array.isArray(src)) arr = src;
  else if (src && typeof src === 'object') arr = Object.values(src);
  else arr = [];

  // Normalize to { name, checked }
  const normalized = arr.map((st) => {
    if (typeof st === 'string') return { name: st, checked: false };
    return { name: String(st?.name ?? ''), checked: !!st?.checked };
  });

  // Persist normalized structure and reflect on local object
  await update(ref(db, `tasks/${taskId}`), { subtasks: normalized });
  task.subtasks = normalized;
}

function handleAuthChange(user) {
  if (window.updateUserInitials) window.updateUserInitials(user);
}

window.updateSubtaskStatus = async function updateSubtaskStatus(taskId, subtaskIndex, isChecked) {
  const taskRef = ref(db, `tasks/${taskId}`);
  const snap = await get(taskRef);
  const task = snap.val();
  if (!task?.subtasks?.[subtaskIndex]) return;
  const updated = task.subtasks.map((st, i) =>
    i === subtaskIndex
      ? { ...(typeof st === "string" ? { name: st } : st), checked: isChecked }
      : st
  );
  await update(taskRef, { subtasks: updated });
}

/**
 * Remove a task and its category mirrors.
 * @param {string} taskId
 * @returns {Promise<void>}
 */
window.deleteTaskFromDatabase = async function(taskId) {
  if (!taskId) throw new Error("Missing taskId");
  const RTDB = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js");
  const { app } = await import("../firebase.js");
  const db = RTDB.getDatabase(app);
  await RTDB.remove(RTDB.ref(db, `tasks/${taskId}`));
};
