import {
  getDatabase,
  update,
  ref,
  get,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { renderAssignedContacts, renderSubtasks } from "./template.modul.js";
import { getLabelClass } from "./board.js";

const db = getDatabase();
const TASK_CATEGORIES = ['toDo', 'inProgress', 'awaitFeedback', 'done'];

// Displays the task overlay with detailed information
window.showTaskOverlay = async function (taskId) {
  try {
    const db = getDatabase();
    const taskRef = ref(db, `tasks/${taskId}`);
    const snapshot = await get(taskRef);
    const task = snapshot.val();
    if (!task) return;

    task.id = taskId;
    await normalizeSubtasks(taskId, task);
    fillTaskOverlay(task);
    
    // --- Edit button opens inline edit and preloads the form ---
    const editBtn = $("edit-task-btn");
    if (editBtn) {
      editBtn.onclick = () => {
        openEditInsideOverlay(task);
      };
    }
    
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
  
  document.querySelector('.edit-addtask-wrapper')?.classList.add('d-none'); 
  document.getElementById('task-overlay-content')?.classList.remove('d-none');
  
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
  renderAssignedContacts(task);
  renderSubtasks(task);
  setupSubtaskListeners(task);
}

// render category of task
function renderCategory(category) {
  const el = $("overlay-user-story");
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
  // Prefer elements that declare their index explicitly
  let pairs = [];
  const nodesWithData = document.querySelectorAll('[data-subtask-index]');
  if (nodesWithData.length) {
    nodesWithData.forEach((el) => {
      const idx = parseInt(el.getAttribute('data-subtask-index'), 10);
      const checkbox = el.matches('input[type="checkbox"]') ? el : el.querySelector('input[type="checkbox"]');
      if (!checkbox || Number.isNaN(idx)) return;
      let label = document.querySelector(`label[for="${checkbox.id}"]`) || checkbox.nextElementSibling;
      let img = label ? label.querySelector('img') : null;
      pairs.push({ checkbox, label, img, idx });
    });
  } else {
    // Fallback to id pattern: subtask0, subtask-0, etc.
    const checkboxes = document.querySelectorAll('input[type="checkbox"][id^="subtask"]');
    checkboxes.forEach((checkbox) => {
      const id = checkbox.id || '';
      const num = id.match(/(\d+)$/);
      const idx = num ? parseInt(num[1], 10) : undefined;
      if (idx === undefined) return;
      let label = document.querySelector(`label[for="${checkbox.id}"]`) || checkbox.nextElementSibling;
      let img = label ? label.querySelector('img') : null;
      pairs.push({ checkbox, label, img, idx });
    });
  }

  pairs.forEach(({ checkbox, label, img, idx }) => {
    if (checkbox && label) {
      attachSubtaskEvents(checkbox, label, img, task.id, idx);
    }
  });
}

// Switch overlay to inline edit mode and preload the Add Task form with this task
function openEditInsideOverlay(task) {
  // 1) Switch views: hide task view, show edit view inside overlay
  const taskContent = document.getElementById('task-overlay-content');
  const editWrap = document.querySelector('.edit-addtask-wrapper');
  if (taskContent) taskContent.classList.add('d-none');
  if (editWrap) editWrap.classList.remove('d-none');

  // 2) Move the existing addtask form into the overlay's edit area (if not already there)
  const src = document.querySelector('.addtask-aside-clone .addtask-wrapper') || document.querySelector('.edit-addtask .addtask-wrapper');
  const dst = document.querySelector('.edit-addtask');
  if (src && dst && src.parentElement !== dst) {
    dst.replaceChildren(src);
  }

  // 3) Mark current editing id on the wrapper so save handlers can update
  const wrap = document.querySelector('.addtask-wrapper');
  if (wrap && task && task.id) wrap.dataset.editingId = String(task.id);

  // 4) Populate the form fields (use central helper if present, else local fallback)
  if (typeof window.enterAddTaskEditMode === 'function') {
    try { window.enterAddTaskEditMode(task); } catch (e) { console.warn('enterAddTaskEditMode failed, using fallback', e); populateEditFormFallback(task); }
  } else {
    populateEditFormFallback(task);
  }
  // Run once more on next tick to ensure values after DOM moves/animations
  setTimeout(() => {
    if (typeof window.enterAddTaskEditMode === 'function') {
      try { window.enterAddTaskEditMode(task); } catch(_) { populateEditFormFallback(task); }
    } else {
      populateEditFormFallback(task);
    }
  }, 0);
  // 5) Sync the visual selection in the contact list with preselected IDs
  syncAssignedSelectionToList();
}

function populateEditFormFallback(task) {
  if (!task) return;
  const wrap = document.querySelector('.addtask-wrapper');
  if (wrap && task.id) wrap.dataset.editingId = String(task.id);

  // Title & description
  const titleEl = document.getElementById('addtask-title');
  const descEl = document.getElementById('addtask-textarea');
  if (titleEl) titleEl.value = task.title || '';
  if (descEl) descEl.value = task.description || '';

  // Due date (expects dd/mm/yyyy)
  const dateEl = document.getElementById('datepicker');
  if (dateEl) {
    const d = task.dueDate ? new Date(task.dueDate) : null;
    if (d && !Number.isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = String(d.getFullYear());
      dateEl.value = `${dd}/${mm}/${yyyy}`;
    } else {
      dateEl.value = task.dueDate || '';
    }
  }

  // Category label
  const sel = document.getElementById('category-select');
  const span = sel ? sel.querySelector('span') : null;
  if (span) span.textContent = task.category || 'Select task category';
  if (sel) sel.dataset.value = task.category || '';

  // Priority buttons
  const buttons = document.querySelectorAll('.prio-buttons .priority-button');
  buttons.forEach((b) => b.classList.remove('active'));
  const map = { urgent: '.urgent-button', medium: '.medium-button', low: '.low-button' };
  const selector = map[(task.priority || 'medium').toLowerCase()] || '.medium-button';
  const btn = document.querySelector(selector);
  if (btn) btn.classList.add('active');

  // Assigned contacts (supports task.assignedContacts or task.assigned)
  const assigned = Array.isArray(task.assignedContacts) ? task.assignedContacts : (Array.isArray(task.assigned) ? task.assigned : []);
  const initialsBox = document.getElementById('contact-initials');
  const selectBox = document.getElementById('assigned-select-box');
  if (initialsBox) {
    if (!assigned.length) {
      initialsBox.classList.add('d-none');
      initialsBox.innerHTML = '';
    } else {
      const html = assigned.map((p) => {
        const name = p.name || '';
        const ini = (p.initials && String(p.initials).trim()) || (name ? name.trim().split(/\s+/).map(x => x[0]).join('').slice(0,2).toUpperCase() : '');
        const color = (typeof p.colorIndex === 'number' ? p.colorIndex : 1);
        // Use the same path & structure as in your Add Task list items
        return `<div class="contact-initial" style="background-image: url(../assets/icons/contact/color${color}.svg)">${ini}</div>`;
      }).join('');
      initialsBox.innerHTML = html;
      initialsBox.classList.remove('d-none');
    }
  }
  if (selectBox) {
    const ids = assigned.map((p)=>p.id).filter(Boolean);
    selectBox.dataset.selected = JSON.stringify(ids);
  }

  // Subtasks array (string[] or objects with .name)
  if (Array.isArray(task.subtasks)) {
    try {
      window.subtasks = task.subtasks.map(st => typeof st === 'string' ? st : (st && st.name) ? st.name : '').filter(Boolean);
      if (typeof window.renderSubtasks === 'function') window.renderSubtasks();
    } catch (_) {}
  }
}

function syncAssignedSelectionToList() {
  const list = document.getElementById('contact-list-box');
  const selectBox = document.getElementById('assigned-select-box');
  if (!list || !selectBox) return;
  let ids = [];
  try {
    ids = JSON.parse(selectBox.dataset.selected || '[]') || [];
  } catch (_) { ids = []; }
  const idSet = new Set(ids);

  // Toggle selected classes & checkbox icons according to idSet
  list.querySelectorAll('li').forEach((li) => {
    const img = li.querySelector('img');
    const isSelected = idSet.has(li.id);
    li.classList.toggle('selected', isSelected);
    if (img) {
      img.src = isSelected
        ? './assets/icons/add_task/check_white.svg'
        : './assets/icons/add_task/check_default.svg';
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
    if (img) {
      icon.style.width = "24px";
      icon.style.height = "24px";
    }
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