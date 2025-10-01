/**
 * @file summary-tasks.js
 * @description Task management and counting logic for Summary Board
 */
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { app } from "./firebase.js";
import { updateTaskCountElements, updateUrgentDeadline } from "./summary-ui.js";

const db = getDatabase(app);

/**
 * Creates Firebase tasks reference
 */
function createTasksReference() {
  return ref(db, "tasks");
}

/**
 * Updates earliest urgent date if newer
 */
function updateEarliestDate(current, newDate) {
  return !current || newDate < current ? newDate : current;
}

/**
 * Processes all tasks and computes statistics
 */
function processAllTasks(tasks) {
  const counts = initializeCounts();
  let earliestUrgentDate = null;
  
  if (tasks) {
    for (const taskId in tasks) {
      const task = tasks[taskId];
      processTask(task, counts, (date) => {
        earliestUrgentDate = updateEarliestDate(earliestUrgentDate, date);
      });
    }
  }
  
  return { counts, earliestUrgentDate };
}

/**
 * Updates UI with task statistics
 */
function updateTaskUI(counts, earliestUrgentDate) {
  updateTaskCountElements(counts);
  updateUrgentDeadline(earliestUrgentDate);
}

/**
 * Handles Firebase snapshot data
 */
function handleTasksSnapshot(snapshot) {
  const tasks = snapshot.val();
  const { counts, earliestUrgentDate } = processAllTasks(tasks);
  updateTaskUI(counts, earliestUrgentDate);
}

/**
 * Subscribes to Firebase tasks, computes counters and the earliest urgent date
 */
function loadTaskCounts() {
  const tasksRef = createTasksReference();
  onValue(tasksRef, handleTasksSnapshot);
}

/**
 * Creates the initial counters object
 */
function initializeCounts() {
  return {
    todo: 0,
    inProgress: 0,
    awaitFeedback: 0,
    done: 0,
    urgent: 0,
    total: 0
  };
}

/**
 * Increments total task count
 */
function incrementTotalCount(counts) {
  counts.total++;
}

/**
 * Updates column-specific counters
 */
function updateColumnCounts(task, counts) {
  if (task.column === 'todo') counts.todo++;
  if (task.column === 'inProgress') counts.inProgress++;
  if (task.column === 'awaitFeedback') counts.awaitFeedback++;
  if (task.column === 'done') counts.done++;
}

/**
 * Checks if task is urgent priority
 */
function isUrgentTask(task) {
  return task.priority === 'urgent';
}

/**
 * Processes urgent task date
 */
function processUrgentTaskDate(task, updateEarliestDate) {
  if (task.dueDate) {
    const taskDate = parseTaskDate(task.dueDate);
    if (taskDate) updateEarliestDate(taskDate);
  }
}

/**
 * Processes urgent task
 */
function processUrgentTask(task, counts, updateEarliestDate) {
  counts.urgent++;
  processUrgentTaskDate(task, updateEarliestDate);
}

/**
 * Updates counters for a single task and tracks the earliest urgent due date
 */
function processTask(task, counts, updateEarliestDate) {
  incrementTotalCount(counts);
  updateColumnCounts(task, counts);
  
  if (isUrgentTask(task)) {
    processUrgentTask(task, counts, updateEarliestDate);
  }
}

/**
 * Splits date string into components
 */
function splitDateString(dateStr) {
  return dateStr.split('/');
}

/**
 * Converts DD/MM/YYYY to MM/DD/YYYY format
 */
function formatDateForJS(day, month, year) {
  return `${month}/${day}/${year}`;
}

/**
 * Creates Date object from formatted string
 */
function createDateObject(formattedDate) {
  return new Date(formattedDate);
}

/**
 * Validates Date object
 */
function isValidDate(date) {
  return !isNaN(date);
}

/**
 * Parses a date string in DD/MM/YYYY format to a Date object
 */
function parseTaskDate(dateStr) {
  const [day, month, year] = splitDateString(dateStr);
  const correctedDate = formatDateForJS(day, month, year);
  const taskDate = createDateObject(correctedDate);
  return isValidDate(taskDate) ? taskDate : null;
}

export { loadTaskCounts };