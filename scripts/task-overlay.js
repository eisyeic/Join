import {
  getDatabase,
  update,
  ref,
  get,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { renderSubtasks } from "./template.modul.js";
import { getLabelClass } from "./board.js";

const db = getDatabase();
const TASK_CATEGORIES = ['toDo', 'inProgress', 'awaitFeedback', 'done'];
let currentTask = null;

// Displays the task overlay with detailed information
window.showTaskOverlay = async function (taskId) {
  try {
    const db = getDatabase();
    const taskRef = ref(db, `tasks/${taskId}`);
    const snapshot = await get(taskRef);
    const task = snapshot.val();
    if (!task) return;

    task.id = taskId;
    currentTask = task;
    await normalizeSubtasks(taskId, task);
    // Build the overlay DOM before filling values
    createTaskOverlayTemplate();
    fillTaskOverlay(task);
    
    // Properly defined delete button reference
    const deleteBtn = $("delete-task-btn");
    if (deleteBtn) {
      deleteBtn.onclick = async () => {
        try {
          await deleteTaskFromDatabase(taskId);
          hideOverlay();
        } catch (error) {
          console.error("Error deleting task:", error);
        }
      };
    }
    const bg = $("task-overlay-bg");
    const overlay = $("task-overlay");
    if (!bg || !overlay) return;
    
    bg.classList.remove("d-none");
    overlay.classList.remove("animate-out");
    overlay.classList.add("animate-in");
  } catch (error) {
    console.error("Error showing task overlay:", error);
  }
};

// hide task overlay animated
window.hideOverlay = function() {
  const bg = $("task-overlay-bg");
  const overlay = $("task-overlay");
  if (!bg || !overlay) return;
  
  overlay.classList.remove("animate-in");
  overlay.classList.add("animate-out");
  setTimeout(() => {
    bg.classList.add("d-none");
    overlay.classList.remove("animate-out");
  }, 300);
};

// fill task
function fillTaskOverlay(task) {
  renderCategory(task.category);
  renderTitleDescDate(task);
  renderPriority(task.priority);
  renderOverlayAssignedContacts(task);
  renderSubtasks(task);
  setupSubtaskListeners(task);
}

// render category of task
function renderCategory(category) {
  const el = $("overlay-user-story");
  if (!el) {
    console.warn("[renderCategory] overlay-user-story not found");
    return;
  }
  el.textContent = category || "";
  el.className = "";
  el.classList.add(getLabelClass(category));
}

// render all task data
function renderTitleDescDate(task) {
  $("overlay-title").innerHTML = task.title || "";
  $("overlay-description").textContent = task.description || "";
  $("overlay-due-date").textContent = task.dueDate || "";
}

// render priority in task overlay
export function renderPriority(priority) {
  const icons = {
    urgent: "./assets/icons/board/Urgent.svg",
    medium: "./assets/icons/board/Medium.svg",
    low: "./assets/icons/board/Low.svg",
  };
  $("overlay-priority-text").textContent = capitalize(priority);
  $("overlay-priority-icon").src = icons[priority] || "";
}

// capitalize first letter function
function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
}

// subtask listener
function setupSubtaskListeners(task) {
  task.subtasks?.forEach((_, i) => {
    const checkbox = $(`subtask${i}`);
    const label = checkbox?.nextElementSibling;
    const img = label?.querySelector("img");
    if (checkbox && label && img) {
      attachSubtaskEvents(checkbox, label, img, task.id, i);
    }
  });
}

// subtasks checkbox events
function attachSubtaskEvents(checkbox, label, img, taskId, i) {
  const updateImage = () => {
    const hover = label.matches(":hover");
    const basePath = "./assets/icons/add_task/";
    let icon;
    if (checkbox.checked) {
      icon = hover ? "checked_hover.svg" : "check_checked.svg";
    } else {
      icon = hover ? "check_default_hover.svg" : "check_default.svg";
    }
    img.src = basePath + icon;
  };

  checkbox.addEventListener("change", () => {
    label.classList.toggle("checked", checkbox.checked);
    updateImage();
    updateSubtaskStatus(taskId, i, checkbox.checked);
  });
  label.addEventListener("mouseenter", updateImage);
  label.addEventListener("mouseleave", updateImage);
}

// normalize subtasks
async function normalizeSubtasks(taskId, task) {
  if (!Array.isArray(task.subtasks)) return;
  const normalized = task.subtasks.map(st => 
    typeof st === "string" ? { name: st, checked: false } : st
  );
  await update(ref(db, `tasks/${taskId}`), { subtasks: normalized });
  task.subtasks = normalized;
}

// update subtasks
export async function updateSubtaskStatus(taskId, subtaskIndex, isChecked) {
  const taskRef = ref(db, `tasks/${taskId}`);
  const snapshot = await get(taskRef);
  const task = snapshot.val();
  
  if (task?.subtasks?.[subtaskIndex]) {
    const updatedSubtasks = task.subtasks.map((st, i) => 
      i === subtaskIndex ? { ...(typeof st === "string" ? { name: st } : st), checked: isChecked } : st
    );
    await update(taskRef, { subtasks: updatedSubtasks });
  }
}

// Deletes a task from all database locations
async function deleteTaskFromDatabase(taskId) {
  const updates = { [`tasks/${taskId}`]: null };
  TASK_CATEGORIES.forEach(category => {
    updates[`${category}Tasks/${taskId}`] = null;
  });
  await update(ref(db), updates);
}

// max 50 letter length displayed
export function truncateDescription(text) {
  const MAX_LENGTH = 50;
  if (text.length <= MAX_LENGTH) {
    return text;
  }
  let truncated = text.substr(0, MAX_LENGTH);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > 0) {
    truncated = truncated.substr(0, lastSpace);
  }
  return truncated + '...';
}

window.toggleEditTaskBoard = function() {
  if (currentTask) {
    getEditTaskBoardTemplate(currentTask);
    // Hydrate the edit UI (contacts like in addtask.html)
    requestAnimationFrame(() => initEditAssignedContacts(currentTask));
  }
}

window.saveEditedTask = async function() {
  if (!currentTask) return;
  
  const categoryText = $("edit-category-select").querySelector('span').textContent;
  const updatedTask = {
    title: $("edit-task-title").value,
    description: $("edit-task-textarea").value,
    dueDate: $("edit-datepicker").value,
    priority: document.querySelector('.priority-button.active')?.dataset.priority || currentTask.priority,
    category: categoryText === 'Select task category' ? currentTask.category : categoryText
  };
  
  if (currentTask.assignedTo) updatedTask.assignedTo = currentTask.assignedTo;
  if (currentTask.subtasks) updatedTask.subtasks = currentTask.subtasks;
  
  try {
    await update(ref(db, `tasks/${currentTask.id}`), updatedTask);
    Object.assign(currentTask, updatedTask);
    createTaskOverlayTemplate();
    fillTaskOverlay(currentTask);
  } catch (error) {
    console.error("Error saving task:", error);
  }
}

window.closedEditedTaskOverlay = function() {
  if (!currentTask) return;
  
  createTaskOverlayTemplate();
  fillTaskOverlay(currentTask);
}

function createTaskOverlayTemplate() {
  $("task-overlay-content").innerHTML = /*html*/ `
    <div class="label-exit-box">
      <span id="overlay-user-story">User Story...</span>
      <img onclick="hideOverlay()" id="task-overlay-exit-button" class="overlay-exit-button" src="./assets/icons/board/exit_default.svg" alt="close overlay" />
    </div>
    <div class="task-overlay-title" id="overlay-title"></div>
    <div class="task-text" id="overlay-description"></div>
    <div class="due-date-box">
      <b>Due date:</b><span id="overlay-due-date"></span>
    </div>
    <div class="priority-box">
      <b>Priority:</b>
      <div class="priority">
        <span id="overlay-priority-text"></span>
        <img id="overlay-priority-icon" src="" alt="" />
      </div>
    </div>
    <div class="assigned-to">
      <b>Assigned to:</b>
      <div id="overlay-members" class="members"></div>
    </div>
    <div id="overlay-subtasks" class="subtasks-check-box"></div>
    <div class="delete-edit-box">
      <div class="button-box-delete" id="delete-task-btn">
        <img class="icon-hover-filter" src="./assets/icons/board/delete_default.svg" alt="Delete" />
        <span>Delete</span>
      </div>
      <div class="vertical-spacer"></div>
      <div class="button-box-edit" id="edit-task-btn" onclick="toggleEditTaskBoard()">
        <img class="icon-hover-filter" src="./assets/icons/board/edit_default.svg" alt="Edit" />
        <span>Edit</span>
      </div>
    </div>
  `;
}

function renderOverlayAssignedContacts(task) {
  const container = $("overlay-members");
  if (!container) return;

  const assigned = Array.isArray(task?.assignedTo) ? task.assignedTo : [];
  if (assigned.length === 0) {
    container.innerHTML = "<span class=\"no-assignees\">—</span>";
    return;
  }

  const html = assigned.map((c) => {
    const name = c?.name || "";
    const initials = (c?.initials && c.initials.trim()) || initialsFromName(name);
    const colorIndex = colorIndexFromContact(c);
    return `
      <div class="member">
        <div class="contact-person-icon small">
          <img src="./assets/general_elements/icons/color${colorIndex}.svg" alt="" />
          <p>${initials}</p>
        </div>
        <span class="member-name">${name}</span>
      </div>
    `;
  }).join("");

  container.innerHTML = html;
}

function initialsFromName(name) {
  if (!name) return "";
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function colorIndexFromContact(contact) {
  // Try existing colorIndex; else derive a stable 1..15 from id or name
  let idx = contact?.colorIndex;
  if (idx && Number.isFinite(+idx)) return +idx;
  const key = contact?.id || contact?.name || "X";
  const code = String(key).charCodeAt(0) || 0;
  return (code % 15) + 1;
}

// ========= Edit Mode: Assigned Contacts (render like addtask.html) =========
(function(){
  const COLOR_MAP = {
    1: "#FF7A00", 2: "#9327FF", 3: "#6E52FF", 4: "#FF4646", 5: "#FFBB2B",
    6: "#1FD7C1", 7: "#462F8A", 8: "#29ABE2", 9: "#FF7A00", 10: "#9327FF",
    11: "#6E52FF", 12: "#FF4646", 13: "#FFBB2B", 14: "#1FD7C1", 15: "#462F8A"
  };

  function colorHexByIndex(idx) {
    const n = Number(idx);
    if (Number.isFinite(n) && COLOR_MAP[n]) return COLOR_MAP[n];
    return COLOR_MAP[((String(idx || "X").charCodeAt(0) || 0) % 15) + 1];
  }

  function renderEditContactsList(box, contacts) {
    if (!box) return;
    if (!Array.isArray(contacts) || contacts.length === 0) {
      box.innerHTML = '<li class="no-contacts">No contacts</li>';
      return;
    }
    box.innerHTML = contacts.map(c => {
      const name = c?.name || '';
      const initials = (c?.initials && c.initials.trim()) || initialsFromName(name);
      const bg = colorHexByIndex(c?.colorIndex);
      const id = c?.id ? String(c.id) : '';
      return `
        <li data-id="${id}">
          <div>
            <div class="contact-initial" style="background-color: ${bg};">${initials}</div>
            ${name}
          </div>
          <img src="./assets/icons/add_task/check_default.svg" alt="Check Box" />
        </li>
      `;
    }).join('');
  }

  function preselectAssigned(listBox, contacts, assigned) {
    if (!Array.isArray(assigned) || assigned.length === 0) return;
    const byId = new Map((contacts||[]).filter(c => c.id != null).map(c => [String(c.id), c]));
    assigned.forEach(a => {
      const id = a?.id != null ? String(a.id) : null;
      let li = null;
      if (id && listBox.querySelector(`li[data-id="${CSS.escape(id)}"]`)) {
        li = listBox.querySelector(`li[data-id="${CSS.escape(id)}"]`);
      } else if (a?.name) {
        li = Array.from(listBox.querySelectorAll('li')).find(x => x.textContent.trim().includes(a.name));
      }
      if (li) {
        li.classList.add('selected');
        const img = li.querySelector('img');
        if (img) img.src = './assets/icons/add_task/check_white.svg';
      }
    });
  }

  function collectSelected(listBox, contacts) {
    const byId = new Map((contacts||[]).filter(c => c.id != null).map(c => [String(c.id), c]));
    return Array.from(listBox.querySelectorAll('li.selected')).map(li => {
      const id = li.getAttribute('data-id');
      const name = li.textContent.trim();
      const base = (id && byId.get(String(id))) || (contacts||[]).find(c => c.name === name) || { name };
      const initials = (base.initials && base.initials.trim()) || initialsFromName(base.name);
      const colorIndex = base.colorIndex || colorIndexFromContact({ id: base.id, name: base.name });
      return { id: base.id, name: base.name, initials, colorIndex };
    });
  }

  function updateEditInitials(listBox, initialsBox) {
    if (!initialsBox) return;
    const selectedInitials = Array.from(listBox.querySelectorAll('li.selected .contact-initial'));
    if (selectedInitials.length === 0) {
      initialsBox.classList.add('d-none');
      initialsBox.innerHTML = '';
      return;
    }
    initialsBox.innerHTML = selectedInitials.map(el => el.outerHTML).join('');
    initialsBox.classList.remove('d-none');
  }

  window.initEditAssignedContacts = function(task) {
    const listBox = document.getElementById('edit-contact-list-box');
    const selectBox = document.getElementById('edit-assigned-select-box');
    const arrow = document.getElementById('edit-assigned-icon');
    const searchInput = document.getElementById('edit-contact-input');
    if (!listBox || !selectBox) return;

    // Ensure initials box exists inside the select box
    let initialsBox = document.getElementById('edit-contact-initials');
    if (!initialsBox) {
      initialsBox = document.createElement('div');
      initialsBox.id = 'edit-contact-initials';
      initialsBox.className = 'contact-initials d-none';
      const before = arrow || selectBox.lastChild;
      selectBox.insertBefore(initialsBox, before);
    }

    const contacts = (window.loadedContacts && Array.isArray(window.loadedContacts)) ? window.loadedContacts : [];
    renderEditContactsList(listBox, contacts);
    preselectAssigned(listBox, contacts, task?.assignedTo || []);
    updateEditInitials(listBox, initialsBox);

    // Toggle dropdown on arrow click (like addtask behavior you use)
    if (arrow) {
      arrow.addEventListener('click', (e) => {
        e.stopPropagation();
        listBox.classList.toggle('d-none');
      });
    }

    // Filter by search
    if (searchInput) {
      searchInput.addEventListener('input', function() {
        const term = this.value.toLowerCase();
        Array.from(listBox.querySelectorAll('li')).forEach(li => {
          if (li.classList.contains('no-contacts')) return;
          const text = li.textContent.toLowerCase();
          li.style.display = text.includes(term) ? 'flex' : 'none';
        });
        // Open list while searching
        listBox.classList.remove('d-none');
      });
      searchInput.addEventListener('focus', function() {
        listBox.classList.remove('d-none');
      });
    }

    // Select / deselect contacts (event delegation)
    listBox.addEventListener('click', (e) => {
      const li = e.target.closest('li');
      if (!li || li.classList.contains('no-contacts')) return;
      li.classList.toggle('selected');
      const img = li.querySelector('img');
      if (img) img.src = li.classList.contains('selected')
        ? './assets/icons/add_task/check_white.svg'
        : './assets/icons/add_task/check_default.svg';
      updateEditInitials(listBox, initialsBox);
      // keep currentTask in sync so saveEditedTask persists it
      if (window.currentTask) {
        window.currentTask.assignedTo = collectSelected(listBox, contacts);
      }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (evt) => {
      const inside = selectBox.contains(evt.target) || listBox.contains(evt.target);
      if (!inside) listBox.classList.add('d-none');
    });
  }
})();
// ========= /Edit Mode: Assigned Contacts =========