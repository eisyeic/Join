import {
  getDatabase,
  ref,
  onValue,
  update,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { app, auth } from "./firebase.js";
import { createTaskElement } from "./template.modul.js";

const db = getDatabase(app);
const columnMap = {
  todo: "to-do-column",
  inProgress: "in-progress-column", 
  awaitFeedback: "await-feedback-column",
  done: "done-column",
};

const DOM_TO_LOGICAL = {
  "to-do-column": "todo",
  "in-progress-column": "inProgress",
  "await-feedback-column": "awaitFeedback",
  "done-column": "done",
};

const placeholderTexts = {
  "to-do-column": "No tasks to do",
  "in-progress-column": "No tasks in progressing",
  "await-feedback-column": "No tasks await feedback", 
  "done-column": "No tasks done",
};

let IS_DRAGGING = false;

function initBoard() {
  onAuthStateChanged(auth, (user) => {
    if (window.updateUserInitials) window.updateUserInitials(user);
  });
  
  document.querySelectorAll(".task-list").forEach(list => {
    list.addEventListener("dragenter", (e) => {
      if (IS_DRAGGING) { e.preventDefault(); highlightColumn(list); }
    });
    list.addEventListener("dragover", (e) => {
      if (IS_DRAGGING) { 
        e.preventDefault(); 
        if (e.dataTransfer) e.dataTransfer.dropEffect = "move"; 
        highlightColumn(list); 
      }
    });
    list.addEventListener("dragleave", (e) => {
      const elUnder = document.elementFromPoint(e.clientX, e.clientY);
      if (!elUnder || !list.contains(elUnder)) list.classList.remove("highlight-column");
    });
  });
  
  onValue(ref(db, "tasks"), (snapshot) => {
    const tasks = snapshot.val() || {};
    Object.values(columnMap).forEach(id => $(id).innerHTML = "");
    Object.keys(tasks)
      .sort((a, b) => (tasks[a].movedAt || 0) - (tasks[b].movedAt || 0))
      .forEach(taskId => {
        const task = tasks[taskId];
        const el = createTaskElement(task, taskId);
        if (!el.id) el.id = String(taskId);
        el.setAttribute("draggable", "true");
        el.addEventListener("dragstart", onTaskDragStart);
        $(columnMap[task.column] || "to-do-column").appendChild(el);
      });
    Object.values(columnMap).forEach(checkAndShowPlaceholder);
  });
  
  const input = $("search-input");
  if (input) {
    const run = () => {
      const term = (input.value || "").toLowerCase().trim();
      document.querySelectorAll(".ticket").forEach(task => {
        const title = task.querySelector(".ticket-title")?.textContent.toLowerCase() || "";
        const desc = task.querySelector(".ticket-text")?.textContent.toLowerCase() || "";
        const matches = title.includes(term) || desc.includes(term);
        task.style.display = (matches || term.length < 3) ? "" : "none";
      });
      Object.values(columnMap).forEach(checkAndShowPlaceholder);
    };
    input.addEventListener("input", debounce(run, 200));
    input.addEventListener("keypress", (e) => e.key === "Enter" && run());
    $("search-btn")?.addEventListener("click", run);
  }
}

document.addEventListener("DOMContentLoaded", initBoard);

function checkAndShowPlaceholder(columnId) {
  const column = $(columnId);
  const existing = column.querySelector(".no-tasks");
  const taskCount = Array.from(column.children)
    .filter(el => !el.classList.contains("no-tasks")).length;
  
  if (taskCount === 0 && !existing) {
    const ph = document.createElement("div");
    ph.classList.add("no-tasks");
    ph.textContent = placeholderTexts[columnId] || "No tasks";
    column.appendChild(ph);
  } else if (taskCount > 0 && existing) {
    existing.remove();
  }
}

function onTaskDragStart(e) {
  const id = e.currentTarget?.id || e.target.id;
  if (id && e.dataTransfer) {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  }
  IS_DRAGGING = true;
  e.currentTarget?.addEventListener("dragend", () => {
    IS_DRAGGING = false;
    document.querySelectorAll(".task-list").forEach(el => el.classList.remove("highlight-column"));
  }, { once: true });
}

function highlightColumn(el) {
  document.querySelectorAll(".task-list").forEach(n => n.classList.remove("highlight-column"));
  el.classList.add("highlight-column");
}

window.drag = onTaskDragStart;

window.drop = function(event) {
  event.preventDefault();
  const taskId = event.dataTransfer?.getData("text/plain");
  const taskElement = taskId ? document.getElementById(taskId) : null;
  const newColumn = event.currentTarget.closest?.(".task-list") || event.currentTarget;
  const oldColumn = taskElement?.parentElement;
  
  if (taskId && taskElement && newColumn && oldColumn) {
    newColumn.appendChild(taskElement);
    taskElement.dataset.column = DOM_TO_LOGICAL[newColumn.id];
    
    update(ref(db, `tasks/${taskId}`), { 
      column: DOM_TO_LOGICAL[newColumn.id] || "todo", 
      movedAt: Date.now() 
    }).catch(err => console.error("Update error:", err));
    
    checkAndShowPlaceholder(oldColumn.id);
    checkAndShowPlaceholder(newColumn.id);
  }
  
  IS_DRAGGING = false;
  document.querySelectorAll(".task-list").forEach(el => el.classList.remove("highlight-column"));
};

function debounce(fn, wait = 200) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

export function renderAssignedInitials(contacts = []) {
  if (!Array.isArray(contacts) || !contacts.length) return "";
  
  const maxShown = 3;
  const positions = ["first-initial", "second-initial", "third-initial"];
  
  return contacts.slice(0, maxShown).map((c, idx) => {
    const pos = positions[idx] || "";
    const overflow = contacts.length > maxShown ? contacts.length - (maxShown - 1) : 0;
    
    if (overflow && idx === maxShown - 1) {
      return `<div class="initial-circle ${pos} initial-circle--more" title="+${overflow}">+${overflow}</div>`;
    }
    
    const colorIdx = Number.isFinite(c?.colorIndex) ? c.colorIndex : 1;
    const initials = c?.initials || "";
    const title = c?.name || initials;
    return `<div class="initial-circle ${pos}" style="background-image: url(./assets/general_elements/icons/color${colorIdx}.svg)" title="${title}">${initials}</div>`;
  }).join("");
}