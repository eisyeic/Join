import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { app } from "./firebase.js";

const db = getDatabase(app);

async function showAllTasks() {
  try {
    const tasksRef = ref(db, "tasks");
    const snapshot = await get(tasksRef);
    
    if (snapshot.exists()) {
      const tasks = snapshot.val();
      console.log("=== ALLE TASKS IN FIREBASE ===");
      console.log(tasks);
      
      // Zähle Tasks nach Status
      let todoCount = 0;
      let inProgressCount = 0;
      let awaitingFeedbackCount = 0;
      let doneCount = 0;
      let urgentCount = 0;
      
      for (let taskId in tasks) {
        const task = tasks[taskId];
        console.log(`Task: ${task.title} - Status: ${task.column} - Priority: ${task.priority}`);
        
        if (task.column === 'todo') todoCount++;
        if (task.column === 'in-progress') inProgressCount++;
        if (task.column === 'awaiting-feedback') awaitingFeedbackCount++;
        if (task.column === 'done') doneCount++;
        if (task.priority === 'urgent') urgentCount++;
      }
      
      console.log("=== TASK STATISTIKEN ===");
      console.log(`To-Do: ${todoCount}`);
      console.log(`In Progress: ${inProgressCount}`);
      console.log(`Awaiting Feedback: ${awaitingFeedbackCount}`);
      console.log(`Done: ${doneCount}`);
      console.log(`Urgent: ${urgentCount}`);
      console.log(`Total: ${Object.keys(tasks).length}`);
      
    } else {
      console.log("Keine Tasks in Firebase gefunden");
    }
  } catch (error) {
    console.error("Fehler beim Laden der Tasks:", error);
  }
}

// Automatisch beim Laden ausführen
showAllTasks();