import {
  getDatabase,
  ref,
  get,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

window.showTaskOverlay = async function showTaskOverlay(taskId) {
  const db = getDatabase();
  const taskRef = ref(db, `tasks/${taskId}`);
  const snapshot = await get(taskRef);
  const task = snapshot.val();

  if (!task) return;

  // show overlay
  $("task-overlay-bg").classList.toggle("d-none");

  // hide overlay
  window.hideOverlay = function () {
    $("task-overlay-bg").classList.toggle("d-none");
  };

  // fill overlay
const categoryEl = $("overlay-user-story");
categoryEl.textContent = task.category || "";
categoryEl.className = ""; 
categoryEl.classList.add(getLabelClass(task.category));
function getLabelClass(category) {
  if (category === "User Story") return "user-story";
  if (category === "Technical task") return "technical-task";
  return "";
}

  $("overlay-title").innerHTML = task.title || "";
  $("overlay-description").textContent = task.description || "";
  $("overlay-due-date").textContent = task.dueDate || "";

  // Priority
  const priorityIcon =
    {
      urgent: "./assets/icons/board/Urgent.svg",
      medium: "./assets/icons/board/Medium.svg",
      low: "./assets/icons/board/Low.svg",
    }[task.priority] || "";

  $("overlay-priority-text").textContent = capitalize(task.priority);
  $("overlay-priority-icon").src = priorityIcon;

  // Assigned contacts
  const membersContainer = $("overlay-members");
  membersContainer.innerHTML = "";
  task.assignedContacts?.forEach((contact) => {
    membersContainer.innerHTML += `
      <div class="member">
        <div class="member">
            <div class="initial-circle" 
                style="background-image: url(../assets/icons/contact/color${contact.colorIndex}.svg)">
            ${contact.initials}
         </div>
            <span>${contact.name}</span>
        </div>
      </div>
    `;
  });

  // Subtasks
  const subtasksContainer = $("overlay-subtasks");
  subtasksContainer.innerHTML = "<b>Subtasks:</b>";
  task.subtasks?.forEach((title, index) => {
    subtasksContainer.innerHTML += `
      <div class="subtask">
        <input type="checkbox" id="subtask${index}" style="display: none"/>
        <label for="subtask${index}">
          <img src="./assets/icons/add_task/check_default.svg" alt="" />
          ${title}
        </label>
      </div>
    `;
  });
};

// capitalaize first letter
function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}


