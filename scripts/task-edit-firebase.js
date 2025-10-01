/**
 * @file task-edit-firebase.js
 * @description Firebase integration for task editing
 */

/**
 * Imports Firebase RTDB module
 */
async function importFirebaseRTDB() {
  return await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js');
}

/**
 * Imports Firebase app
 */
async function importFirebaseApp() {
  return await import('./firebase.js');
}

/**
 * Gets Firebase database instance
 */
function getFirebaseDatabase(RTDB, app) {
  return RTDB.getDatabase(app);
}

/**
 * Creates task reference
 */
function createTaskReference(RTDB, db, taskId) {
  return RTDB.ref(db, `tasks/${taskId}`);
}

/**
 * Fetches task snapshot
 */
async function fetchTaskSnapshot(RTDB, taskRef) {
  return await RTDB.get(taskRef);
}

/**
 * Extracts task data from snapshot
 */
function extractTaskData(snapshot) {
  return snapshot.exists() ? snapshot.val() : null;
}

/**
 * Handles task loading error
 */
function handleTaskLoadError(e) {
  console.error('Failed to load task', e);
  return null;
}

/**
 * Loads task data from Firebase
 */
async function loadTaskFromFirebase(taskId) {
  const RTDB = await importFirebaseRTDB();
  const { app } = await importFirebaseApp();
  const db = getFirebaseDatabase(RTDB, app);
  const taskRef = createTaskReference(RTDB, db, taskId);
  const snapshot = await fetchTaskSnapshot(RTDB, taskRef);
  return extractTaskData(snapshot);
}

/**
 * Load a task by ID from Firebase RTDB
 */
async function loadTaskById(taskId) {
  try {
    return await loadTaskFromFirebase(taskId);
  } catch (e) {
    return handleTaskLoadError(e);
  }
}

/**
 * Validates task ID for deletion
 */
function validateTaskIdForDeletion(taskId) {
  if (!taskId) throw new Error("Missing taskId");
}

/**
 * Removes task from Firebase
 */
async function removeTaskFromFirebase(RTDB, db, taskId) {
  const taskRef = createTaskReference(RTDB, db, taskId);
  await RTDB.remove(taskRef);
}

/**
 * Performs task deletion from Firebase
 */
async function performTaskDeletionFromFirebase(taskId) {
  const RTDB = await importFirebaseRTDB();
  const { app } = await importFirebaseApp();
  const db = getFirebaseDatabase(RTDB, app);
  await removeTaskFromFirebase(RTDB, db, taskId);
}

/**
 * Delete a task from Firebase RTDB
 */
window.deleteTaskFromDatabase = async function(taskId) {
  validateTaskIdForDeletion(taskId);
  await performTaskDeletionFromFirebase(taskId);
};

export { loadTaskById };