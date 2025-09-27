import {
  getDatabase,
  ref,
  onValue,
  update,
  get
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { app, auth } from "../firebase.js";

const MIN_SEARCH_CHARS = 3;
let currentSearchTerm = "";
const db = getDatabase(app);

function debounce(fn, wait = 200) {
  let t;
  return /** @type {F} */ ((...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  });
}

const columnMap = {
  todo: "to-do-column",
  inProgress: "in-progress-column",
  awaitFeedback: "await-feedback-column",
  done: "done-column",
};

onAuthStateChanged(auth, handleAuthChange);

function handleAuthChange(user) {
  if (window.updateUserInitials) window.updateUserInitials(user);
}

function loadTasksFromFirebase() {
  const tasksRef = ref(db, "tasks");
  onValue(tasksRef, (snapshot) => {
    const tasks = snapshot.val() || {};
    renderAllColumns(tasks);
  });
}

function renderAllColumns(tasks) {
  clearAllColumns();
  const sortedIds = getSortedTaskIds(tasks);
  sortedIds.forEach((taskId) => renderTask(tasks[taskId], taskId));
  Object.keys(columnMap).forEach((k) => checkAndShowPlaceholder(columnMap[k]));
}

function clearAllColumns() {
  for (const key in columnMap) $(columnMap[key]).innerHTML = "";
}

function getSortedTaskIds(tasks) {
  return Object.keys(tasks).sort(
    (a, b) => (tasks[a].movedAt || 0) - (tasks[b].movedAt || 0)
  );
}

function renderTask(task, taskId) {
  const targetColumnId = columnMap[task.column] || "to-do-column";
  const columnElement = $(targetColumnId);
  const taskElement = createTaskElement(task, taskId);

  if (!taskElement.id) taskElement.id = String(taskId);
  taskElement.setAttribute("draggable", "true");
  taskElement.addEventListener("dragstart", onTaskDragStart);

  columnElement.appendChild(taskElement);
}

const placeholderTexts = {
  "to-do-column": "No tasks to do",
  "in-progress-column": "No tasks in progressing",
  "await-feedback-column": "No tasks await feedback",
  "done-column": "No tasks done",
};

function checkAndShowPlaceholder(columnId) {
  const column = $(columnId);
  const taskCards = Array.from(column.children).filter(
    (el) => !el.classList.contains("no-tasks")
  );
  const existing = column.querySelector(".no-tasks");
  if (taskCards.length === 0 && !existing) {
    const ph = document.createElement("div");
    ph.classList.add("no-tasks");
    ph.textContent = placeholderTexts[columnId] || "No tasks";
    column.appendChild(ph);
  } else if (taskCards.length > 0 && existing) {
    existing.remove();
  }
}

let IS_DRAGGING = false;

function onTaskDragStart(e) {
  const id = e.currentTarget?.id || /** @type {HTMLElement} */(e.target).id;
  if (id) {
    e.dataTransfer?.setData("text/plain", id);
    e.dataTransfer?.setData("text", id);
  }
  if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
  IS_DRAGGING = true;
  e.currentTarget?.addEventListener(
    "dragend",
    () => {
      IS_DRAGGING = false;
      resetColumnBackgrounds();
    },
    { once: true }
  );
}

window.drag = onTaskDragStart;

function initDnDListeners() {
  document.querySelectorAll(".task-list").forEach((list) => {
    list.addEventListener("dragenter", (e) => {
      if (!IS_DRAGGING) return;
      e.preventDefault();
      highlightColumn(list);
    });
    list.addEventListener("dragover", (e) => {
      if (!IS_DRAGGING) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
      highlightColumn(list);
    });
    list.addEventListener("dragleave", (e) => {
      const elUnder = document.elementFromPoint(e.clientX, e.clientY);
      if (elUnder && list.contains(elUnder)) return;
      unhighlightColumn(list);
    });
  });
}

function highlightColumn(el) {
  document
    .querySelectorAll(".task-list")
    .forEach((n) => n.classList.remove("highlight-column"));
  el.classList.add("highlight-column");
}

function unhighlightColumn(el) {
  el.classList.remove("highlight-column");
}

function resetColumnBackgrounds() {
  document
    .querySelectorAll(".task-list")
    .forEach((el) => el.classList.remove("highlight-column"));
}

const LOGICAL_TO_DOM = {
  todo: "to-do-column",
  inProgress: "in-progress-column",
  awaitFeedback: "await-feedback-column",
  review: "await-feedback-column",
  done: "done-column",
};

const DOM_TO_LOGICAL = {
  "to-do-column": "todo",
  "in-progress-column": "inProgress",
  "await-feedback-column": "awaitFeedback",
  "done-column": "done",
};

window.drop = function handleDrop(event) {
  event.preventDefault();
  const taskId =
    event.dataTransfer?.getData("text/plain") ||
    event.dataTransfer?.getData("text");
  if (!taskId) return;
  const taskElement = document.getElementById(taskId);
  const newColumn = (event.currentTarget).closest(".task-list") || (event.currentTarget);
  const oldColumn = taskElement?.parentElement;
  if (!taskElement || !newColumn || !oldColumn) return;
  newColumn.appendChild(taskElement);
  taskElement.dataset.column =
    DOM_TO_LOGICAL[newColumn.id] || taskElement.dataset.column;
  updateTaskColumn(taskId, newColumn.id);
  checkAndShowPlaceholder(oldColumn.id);
  checkAndShowPlaceholder(newColumn.id);
  IS_DRAGGING = false;
  resetColumnBackgrounds();
};

function updateTaskColumn(taskId, newColumnId) {
  const dbRef = ref(db, `tasks/${taskId}`);
  const newColumnValue = DOM_TO_LOGICAL[newColumnId] || "todo";
  return update(dbRef, { column: newColumnValue, movedAt: Date.now() }).catch(
    (err) => console.error("Fehler beim Aktualisieren der Spalte:", err)
  );
}

function normalizeAssignedContacts(ac) {
  if (Array.isArray(ac)) return ac;
  if (ac && typeof ac === "object") return Object.values(ac);
  return [];
}

function initialsFromName(name) {
  if (!name) return "";
  return String(name)
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function renderAssignedInitials(contacts = []) {
  const maxShown = 3;
  const list = normalizeAssignedContacts(contacts);
  if (!list.length) return "";
  const shown = list.slice(0, maxShown);
  const hasOverflow = list.length > maxShown;
  const overflowCount = calcOverflow(list.length, maxShown);
  const ctx = { hasOverflow, overflowCount, maxShown };
  return shown
    .map((c, idx) => {
      const initials = (c && c.initials) ? c.initials : initialsFromName(c?.name || c?.id || "");
      const colorIndex = Number.isFinite(c?.colorIndex) ? c.colorIndex : 0;
      // Pass a **new object** to the renderer to avoid mutating the task's data
      const safeContact = { initials, colorIndex, name: c?.name || "" };
      return renderChip(safeContact, idx, ctx);
    })
    .join("");
}


function calcOverflow(len, maxShown) {
  return len > maxShown ? len - (maxShown - 1) : 0;
}

function getPositionClass(idx) {
  return ["first-initial", "second-initial", "third-initial"][idx] || "";
}

function renderOverflowBadge(count, positionClass) {
  return `
    <div class="initial-circle ${positionClass} initial-circle--more" title="+${count}">
      +${count}
    </div>
  `;
}

function renderInitialCircle(c, positionClass) {
  const colorIdx = Number.isFinite(c?.colorIndex) ? c.colorIndex : 0;
  const initials = c?.initials || "";
  const title = c?.name || initials;
  return `
    <div class="initial-circle ${positionClass}"
         style="background-image: url(./assets/icons/contact/color${colorIdx}.svg)"
         title="${title}">
      ${initials}
    </div>
  `;
}

function renderChip(c, idx, ctx) {
  const pos = getPositionClass(idx);
  if (ctx.hasOverflow && idx === ctx.maxShown - 1) {
    return renderOverflowBadge(ctx.overflowCount, pos);
  }
  return renderInitialCircle(c, pos);
}

document.addEventListener("DOMContentLoaded", onBoardDomContentLoaded);
function onBoardDomContentLoaded() {
  initDnDListeners();
  loadTasksFromFirebase();
  setupSearchHandlers();
}

function setupSearchHandlers() {
  const searchInput = $("search-input");
  const searchButton = $("search-btn");
  if (!searchInput) return;
  const run = () => {
    const term = (searchInput.value || "").toLowerCase().trim();
    if (term.length >= MIN_SEARCH_CHARS) {
      currentSearchTerm = term;
      filterTasks(term);
    } else {
      currentSearchTerm = "";
      filterTasks(currentSearchTerm);
    }
  };
  const debouncedRun = debounce(run, 200);
  searchInput.addEventListener("input", debouncedRun);
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") run();
  });
  searchButton?.addEventListener("click", run);
}

function filterTasks(searchTerm) {
  const allTasks = document.querySelectorAll(".ticket");
  filterTaskVisibility(allTasks, searchTerm);
  updateAllPlaceholders();
}

function filterTaskVisibility(tasks, searchTerm) {
  tasks.forEach((taskEl) => {
    const title =
      taskEl.querySelector(".ticket-title")?.textContent.toLowerCase() || "";
    const description =
      taskEl.querySelector(".ticket-text")?.textContent.toLowerCase() || "";
    const matches = title.includes(searchTerm) || description.includes(searchTerm);
    (taskEl).style.display =
      matches || searchTerm === "" ? "" : "none";
  });
}

function updateAllPlaceholders() {
  for (const key in columnMap) updatePlaceholderForColumn(columnMap[key]);
}

function updatePlaceholderForColumn(columnId) {
  const column = document.getElementById(columnId);
  const visibleTasks = Array.from(column.querySelectorAll(".ticket")).filter(
    (el) => (el).style.display !== "none"
  );
  const placeholder = column.querySelector(".no-tasks");
  if (visibleTasks.length === 0 && !placeholder) {
    const ph = document.createElement("div");
    ph.classList.add("no-tasks");
    ph.textContent = placeholderTexts[columnId] || "No tasks";
    column.appendChild(ph);
  } else if (visibleTasks.length > 0 && placeholder) {
    placeholder.remove();
  }
}

window.onTaskColumnChanged = function (taskId, targetLogical) {
  const taskEl = document.getElementById(String(taskId));
  if (!taskEl) return;
  const oldColumnEl = taskEl.closest(".task-list") || taskEl.parentElement;
  const newDomId = LOGICAL_TO_DOM[targetLogical] || targetLogical;
  const newColumnEl = document.getElementById(newDomId);
  if (!newColumnEl || !oldColumnEl) return;
  newColumnEl.appendChild(taskEl);
  taskEl.dataset.column =
    DOM_TO_LOGICAL[newColumnEl.id] || taskEl.dataset.column;
  updateTaskColumn(String(taskId), newColumnEl.id);
  checkAndShowPlaceholder(oldColumnEl.id);
  checkAndShowPlaceholder(newColumnEl.id);
  resetColumnBackgrounds();
};

function createTaskElement(task, taskId) {
  const ticket = document.createElement("div");
  ticket.classList.add("ticket");
  ticket.id = taskId; ticket.draggable = true; ticket.setAttribute("ondragstart","drag(event)");
  if (task.column) ticket.dataset.column = task.column;
  ticket.innerHTML = buildTicketHTML(task, taskId);
  initPlusMinus(ticket, taskId);
  return ticket;
}

function buildTicketHTML(task, taskId) {
  const labelClass = getLabelClass(task.category);
  const desc = task.description || "";
  const truncated = truncateForCard(desc, 50);
  const initials = task.assignedContacts ? renderAssignedInitials(task.assignedContacts) : "";
  return `
    <div class="ticket-content" onclick="showTaskOverlay('${taskId}')">
      <div class="label-box">
        <div class="label ${labelClass}">${task.category ?? ""}</div>
        <img class="plus-minus-img" src="./assets/icons/board/plusminus.svg" alt="plus/minus" draggable="false" role="button" aria-label="Weitere Optionen">
      </div>
      <div class="frame">
        <div class="ticket-title">${task.title ?? ""}</div>
        <div class="ticket-text">${truncated}</div>
      </div>
      ${task.subtasks?.length ? renderSubtaskProgress(task.subtasks) : ""}
      <div class="initials-icon-box">
        <div class="initials">${initials}</div>
        <img src="./assets/icons/board/${task.priority}.svg" alt="${task.priority}">
      </div>
    </div>`;
}

/**
 * Maps a task category to a CSS class for labels.
 * @param {string} category
 * @returns {string}
 */
export function getLabelClass(category) {
  return (
    {
      "User Story": "user-story",
      "Technical task": "technical-task",
    }[category] || ""
  );
}

function truncateForCard(text, max = 50) {
  const s = (text || "").trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut) + "…";
}

/**
 * Renders a subtask progress bar and label.
 * @param {{checked:boolean}[]} subtasks
 * @returns {string}
 */
function renderSubtaskProgress(subtasks) {
  const total = subtasks.length;
  const done = subtasks.filter((st) => st.checked).length;
  const percentage = total ? Math.round((done / total) * 100) : 0;
  return `
    <div class="subtasks-box">
      <div class="progressbar">
        <div class="progressbar-inlay" style="width: ${percentage}%"></div>
      </div>
      ${done}/${total} Subtasks
    </div>
  `;
}

function getCurrentColumnForTicket(ticketEl){
  if (ticketEl?.dataset?.column) return ticketEl.dataset.column;
  const colEl = ticketEl.closest("[data-column]") || ticketEl.closest(".column");
  if (colEl) return (colEl).dataset?.column || (colEl).id || "";
  return "";
}

function initPlusMinus(ticket, taskId) {
  const btn = /** @type {HTMLImageElement|null} */(ticket.querySelector(".plus-minus-img"));
  if (!btn) return;
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const col = getCurrentColumnForTicket(ticket);
    openMoveOverlay(btn, taskId, col);
  });
  ["mousedown","touchstart","dragstart"].forEach((t)=>btn.addEventListener(t,(e)=>e.stopPropagation(),{passive:true}));
}

/**
 * Render category label and class on overlay.
 * @param {string} category
 * @returns {void}
 */
function renderCategory(category) {
  const el = $("overlay-user-story");
  el.textContent = category || "";
  el.className = "";
  el.classList.add(getLabelClass(category));
}

/**
 * Render all overlay sections for a task.
 * @param {any} task
 * @returns {void}
 */
function fillTaskOverlay(task) {
  renderCategory(task.category);
  renderTitleDescDate(task);
  renderPriority(task.priority);
  renderAssignedContacts(task);
  renderSubtasks(task);
  setupSubtaskListeners(task);
}

/**
 * Open the task overlay for a given task id.
 * @param {string} taskId
 * @returns {Promise<void>}
 */
window.showTaskOverlay = async function (taskId) {
  try {
    const task = await fetchTask(taskId);
    if (!task) return;
    await normalizeSubtasks(taskId, task);
    fillTaskOverlay(task);
    wireEditButton(task);
    wireDeleteButton(taskId);
    showOverlayUI();
  } catch (err) {
    console.error("Error showing task overlay:", err);
  }
};

/**
 * Fetch a task by id and attach its id on the object.
 * @param {string} taskId
 * @returns {Promise<any|null>}
 */
async function fetchTask(taskId) {
  const snap = await get(ref(db, `tasks/${taskId}`));
  if (!snap.exists()) return null;
  const task = snap.val();
  task.id = taskId;
  return task;
}

/** @type {readonly string[]} */
const TASK_CATEGORIES = ["toDo", "inProgress", "awaitFeedback", "done"];



/**
 * Hide the task overlay with animation.
 * @returns {void}
 */
window.hideOverlay = function () {
  const bg = $("task-overlay-bg");
  const overlay = $("task-overlay");
  if (!bg || !overlay) return;
  document.querySelector(".edit-addtask-wrapper")?.classList.add("d-none");
  document.getElementById("task-overlay-content")?.classList.remove("d-none");
  overlay.classList.remove("animate-in");
  overlay.classList.add("animate-out");
  setTimeout(() => {
    bg.classList.add("d-none");
    overlay.classList.remove("animate-out");
  }, 300);
};



function renderAssignedContacts(task) {
  const contacts = resolveContacts(task);
  retryUntilFound("overlay-members", (container)=>{
    renderContactsTo((container), contacts);
  });
}

function resolveContacts(task){
  const list = normalizeAssignedContacts(task?.assignedContacts);
  return list.map((c) => {
    const out = { ...c };
    if (!out.initials) out.initials = initialsFromName(out.name || out.id || "");
    if (!Number.isFinite(out.colorIndex)) out.colorIndex = 0;
    return out;
  });
}

function retryUntilFound(id, fn, tries=15){
  const el = document.getElementById(id);
  if (el) return fn(el);
  if (tries<=0) return;
  requestAnimationFrame(()=>retryUntilFound(id, fn, tries-1));
}

function renderContactsTo(container, contacts){
  container.innerHTML = contacts.map((c)=>{
    const idx = Number.isFinite(c?.colorIndex)?c.colorIndex:0;
    const initials = c?.initials||"";
    const name = c?.name||initials;
    return `<div class="member"><div class="initial-circle" style="background-image:url(../assets/icons/contact/color${idx}.svg)">${initials}</div><span>${name}</span></div>`;
  }).join("");
}

function toSubtasksHtml(subtasks){
  return `<b>Subtasks:</b><div class="subtasks-container">${subtasks.map((s,i)=>{
    const chk = s.checked?"checked":"";
    const id = `subtask${i}`;
    const icon = s.checked?"./assets/icons/add_task/check_checked.svg":"./assets/icons/add_task/check_default.svg";
    const cls = s.checked?"checked":"";
    return `<div class="subtask"><input type="checkbox" id="${id}" ${chk} style="display:none"/><label for="${id}" class="${cls}"><img src="${icon}" />${s.name}</label></div>`;
  }).join("")}</div>`;
}

function renderNoSubtasks(container){ container.innerHTML = "<b>no subtasks</b>"; }

function renderSubtasks(task) {
  const container = ($("overlay-subtasks"));
  if (task.subtasks && task.subtasks.length) container.innerHTML = toSubtasksHtml(task.subtasks);
  else renderNoSubtasks(container);
}





/**
 * Render title, description and due date.
 * @param {{title?:string,description?:string,dueDate?:string|number|Date}} task
 * @returns {void}
 */
function renderTitleDescDate(task) {
  $("overlay-title").innerHTML = task.title || "";
  $("overlay-description").textContent = task.description || "";
  $("overlay-due-date").textContent = formatDueDateDisplay(task.dueDate);
}

/**
 * Formats a date-like value for overlay display as dd.mm.yyyy.
 * Accepts ISO (yyyy-mm-dd or ISO datetime), dd/mm/yyyy, timestamps, or Date.
 * Returns empty string if value is missing.
 * @param {string|number|Date|undefined|null} raw
 * @returns {string}
 */
function formatDueDateDisplay(raw) {
  if (raw == null || raw === "") return "";
  let d = null;

  const isValidDate = (x) => x instanceof Date && !Number.isNaN(x.getTime());

  if (raw instanceof Date) {
    d = raw;
  } else if (typeof raw === "number") {
    d = new Date(raw);
  } else if (typeof raw === "string") {
    const s = raw.trim();
    // dd/mm/yyyy
    const mDMY = s.match(/^([0-3]?\d)\/(0?\d|1[0-2])\/(\d{4})$/);
    if (mDMY) {
      const dd = parseInt(mDMY[1], 10);
      const mm = parseInt(mDMY[2], 10) - 1;
      const yyyy = parseInt(mDMY[3], 10);
      d = new Date(yyyy, mm, dd);
    } else if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
      // yyyy-mm-dd or ISO datetime
      const [y, m, day] = s.slice(0, 10).split("-").map((n) => parseInt(n, 10));
      d = new Date(y, m - 1, day);
    } else {
      d = new Date(s);
    }
  }

  if (!isValidDate(d)) return String(raw);

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getFullYear());
  return `${dd}.${mm}.${yyyy}`;
}

/**
 * Render priority text + icon on overlay.
 * @param {"urgent"|"medium"|"low"|string} priority
 * @returns {void}
 */
export function renderPriority(priority) {
  const icons = {
    urgent: "./assets/icons/board/Urgent.svg",
    medium: "./assets/icons/board/Medium.svg",
    low: "./assets/icons/board/Low.svg",
  };
  $("overlay-priority-text").textContent = capitalize(priority);
  $("overlay-priority-icon").src = icons[priority] || "";
}

/**
 * Capitalize first letter of a string.
 * @param {string} str
 * @returns {string}
 */
function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
}

/**
 * Attach subtask checkbox listeners and visuals.
 * @param {{id:string,subtasks?:any[]}} task
 * @returns {void}
 */
function setupSubtaskListeners(task) {
  const pairs =
    getPairsByDataIndex() || getPairsByIdPattern() || /** @type {any[]} */ ([]);
  pairs.forEach(({ checkbox, label, img, idx }) => {
    if (checkbox && label) attachSubtaskEvents(checkbox, label, img, task.id, idx);
  });
}

/**
 * Find checkbox/label/img pairs via data-subtask-index.
 * @returns {{checkbox:HTMLInputElement,label:HTMLLabelElement,img:HTMLImageElement|null,idx:number}[]|null}
 */
function getPairsByDataIndex() {
  const nodes = document.querySelectorAll("[data-subtask-index]");
  if (!nodes.length) return null;
  const out = [];
  nodes.forEach((el) => {
    const idx = parseInt(el.getAttribute("data-subtask-index") || "", 10);
    const checkbox =
      el.matches('input[type="checkbox"]') ? el : el.querySelector('input[type="checkbox"]');
    if (!checkbox || Number.isNaN(idx)) return;
    const label =
      document.querySelector(`label[for="${checkbox.id}"]`) ||
      /** @type {HTMLLabelElement} */ (checkbox.nextElementSibling);
    const img = label ? label.querySelector("img") : null;
    out.push({ checkbox, label, img, idx });
  });
  return out;
}

/**
 * Find checkbox/label/img pairs via id pattern (subtaskN).
 * @returns {{checkbox:HTMLInputElement,label:HTMLLabelElement,img:HTMLImageElement|null,idx:number}[]|null}
 */
function getPairsByIdPattern() {
  const boxes = document.querySelectorAll('input[type="checkbox"][id^="subtask"]');
  if (!boxes.length) return null;
  const out = [];
  boxes.forEach((checkbox) => {
    const m = (checkbox.id || "").match(/(\d+)$/);
    if (!m) return;
    const idx = parseInt(m[1], 10);
    const label =
      document.querySelector(`label[for="${checkbox.id}"]`) ||
      /** @type {HTMLLabelElement} */ (checkbox.nextElementSibling);
    const img = label ? label.querySelector("img") : null;
    out.push({ checkbox, label, img, idx });
  });
  return out;
}

/**
 * Wire the edit button inside overlay.
 * @param {any} task
 * @returns {void}
 */
function wireEditButton(task) {
  const btn = $("edit-task-btn");
  if (!btn) return;
  btn.onclick = () => openEditInsideOverlay(task);
}

/**
 * Wire the delete button inside overlay.
 * @param {string} taskId
 * @returns {void}
 */
function wireDeleteButton(taskId) {
  const btn = $("delete-task-btn");
  if (!btn) return;
  btn.onclick = async () => {
    try {
      await deleteTaskFromDatabase(taskId);
      hideOverlay();
    } catch (e) {
      console.error("Error deleting task:", e);
    }
  };
}

/**
 * Show overlay background and animate in.
 * @returns {void}
 */
function showOverlayUI() {
  const bg = $("task-overlay-bg");
  const overlay = $("task-overlay");
  if (!bg || !overlay) return;
  bg.classList.remove("d-none");
  overlay.classList.remove("animate-out");
  overlay.classList.add("animate-in");
}

/**
 * Attach subtask checkbox listeners for status and icon.
 * @param {HTMLInputElement} checkbox
 * @param {HTMLLabelElement} label
 * @param {HTMLImageElement|null} img
 * @param {string} taskId
 * @param {number} index
 * @returns {void}
 */
function attachSubtaskEvents(checkbox, label, img, taskId, index) {
  const updateImage = () => {
    if (!img) return;
    const hover = label.matches(":hover");
    const p = "./assets/icons/add_task/";
    img.src = checkbox.checked
      ? p + (hover ? "checked_hover.svg" : "check_checked.svg")
      : p + (hover ? "check_default_hover.svg" : "check_default.svg");
  };
  checkbox.addEventListener("change", () => {
    label.classList.toggle("checked", checkbox.checked);
    updateImage();
    updateSubtaskStatus(taskId, index, checkbox.checked);
  });
  label.addEventListener("mouseenter", updateImage);
  label.addEventListener("mouseleave", updateImage);
}

/**
 * Ensure subtasks are normalized to {name,checked} shape.
 * @param {string} taskId
 * @param {{subtasks?:any[]}} task
 * @returns {Promise<void>}
 */
async function normalizeSubtasks(taskId, task) {
  if (!Array.isArray(task.subtasks)) return;
  const normalized = task.subtasks.map((st) =>
    typeof st === "string" ? { name: st, checked: false } : st
  );
  await update(ref(db, `tasks/${taskId}`), { subtasks: normalized });
  task.subtasks = normalized;
}

/**
 * Update a single subtask's checked status.
 * @param {string} taskId
 * @param {number} subtaskIndex
 * @param {boolean} isChecked
 * @returns {Promise<void>}
 */
export async function updateSubtaskStatus(taskId, subtaskIndex, isChecked) {
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
 * Opens the Add Task overlay and resets the form.
 * @returns {void}
 */
function openOverlay() {
  overlay.classList.remove("d-none");
  overlayContent.classList.remove("slide-out");
  overlayContent.classList.add("slide-in");
  const cancelBtn = $("cancel-button");
  if (cancelBtn) cancelBtn.click();
  else
    document.addEventListener(
      "addtask:template-ready",
      () => $("cancel-button")?.click(),
      { once: true }
    );
}

/**
 * Closes the Add Task overlay with a slide-out animation.
 * @returns {void}
 */
function closeOverlay() {
  overlayContent.classList.remove("slide-in");
  overlayContent.classList.add("slide-out");
  overlayContent.addEventListener("animationend", function handler() {
    overlay.classList.add("d-none");
    overlayContent.classList.remove("slide-out");
    overlayContent.removeEventListener("animationend", handler);
  });
}
/**
 * Toggles the Add Task overlay visibility.
 * @returns {void}
 */
window.toggleAddTaskBoard = function () {
  if (overlay.classList.contains("d-none")) openOverlay();
  else closeOverlay();
  moveFormBackToAside();
};

/**
 * Moves the add-task form back to the aside placeholder.
 * @returns {void}
 */
function moveFormBackToAside() {
  const src = document.querySelector(".edit-addtask .addtask-wrapper");
  const dst = document.querySelector(".addtask-aside-clone");
  if (src && dst) dst.replaceChildren(src);
}

/**
 * Toggles the task overlay into edit mode and moves the form into place.
 * @returns {void}
 */
$("edit-task-btn").addEventListener("click", onEditTaskBtnClick);
function onEditTaskBtnClick() {
  $("task-overlay-content").classList.toggle("d-none");
  document.querySelector(".edit-addtask-wrapper").classList.toggle("d-none");
  const src = document.querySelector(".addtask-aside-clone .addtask-wrapper");
  const dst = document.querySelector(".edit-addtask");
  if (src && dst) dst.replaceChildren(src);
}

/** Overlay root element. */
const overlay = $("overlay-add-task");
/** Overlay content element. */
const overlayContent = document.querySelector(".add-task-overlay-content");

overlay?.addEventListener("click", onOverlayBackdropClick);
/**
 * Closes the Add Task overlay if the backdrop is clicked.
 * @param {MouseEvent} e
 * @returns {void}
 */
function onOverlayBackdropClick(e) {
  if (e.target !== overlay || overlay.classList.contains("d-none")) return;
  document.querySelector(".edit-addtask-wrapper")?.classList.add("d-none");
  document.getElementById("task-overlay-content")?.classList.remove("d-none");
  window.toggleAddTaskBoard();
}



function openMoveOverlay(anchorEl, taskId, currentColumn) {
  if (currentMoveOverlay && currentMoveOverlay.dataset.taskId === String(taskId)) { closeMoveOverlay(); return; }
  closeMoveOverlay();
  const overlay = createMoveOverlay(taskId, currentColumn);
  attachMoveOverlayHandlers(overlay, taskId);
  placeOverlay(anchorEl, overlay);
  animateOpen(overlay);
  registerGlobalOverlayCleanup(overlay);
  currentMoveOverlay = overlay;
}

let currentMoveOverlay = null;
let moveOverlayCleanup = null;

function createMoveOverlay(taskId, currentColumn){
  const overlay = document.createElement("div");
  overlay.className = "move-overlay";
  overlay.setAttribute("role","menu");
  overlay.dataset.taskId = taskId;
  const order={todo:0,inProgress:1,awaitFeedback:2,done:3};
  const norm=normalizeColumnName(currentColumn);
  const targets=getMoveTargetsFor(currentColumn);
  const body=[`<div class="move-overlay__title">Move to</div>`].concat(targets.map(t=>{
    const dir=(order[t.col]??0)<(order[norm]??0)?"up":"down";
    const icon=dir==="up"?"arrow_upward.svg":"arrow_downward.svg";
    return `<button type="button" class="move-option" data-col="${t.col}" role="menuitem" style="display:flex;align-items:center;gap:8px;background:none;border:none;padding:6px 0;color:inherit;cursor:pointer;text-align:left;width:100%;"><img src="./assets/icons/board/${icon}" alt="" width="16" height="16"><span>${t.label}</span></button>`;
  }));
  overlay.innerHTML = body.join("\n");
  return overlay;
}

function attachMoveOverlayHandlers(overlay, taskId){
  overlay.addEventListener("mousedown", (e)=>e.stopPropagation());
  overlay.addEventListener("touchstart", (e)=>e.stopPropagation(), {passive:true});
  overlay.addEventListener("click", (e)=>{
    e.stopPropagation();
    const trg = e.target instanceof Element ? e.target.closest("[data-col],[data-action]") : null;
    if(!trg) return;
    const action = trg.getAttribute("data-action");
    const col = trg.getAttribute("data-col");
    if (action==="up") moveTaskUp(taskId);
    else if (action==="down") moveTaskDown(taskId);
    else if (col) moveTaskToColumn(taskId, col);
    closeMoveOverlay();
  });
}

function placeOverlay(anchorEl, overlay){
  const M=8, r=anchorEl.getBoundingClientRect();
  document.body.appendChild(overlay);
  overlay.style.display="flex"; overlay.style.visibility="hidden"; overlay.style.position="fixed"; overlay.style.zIndex="9999";
  const { width:ow, height:oh } = overlay.getBoundingClientRect();
  let top=r.top, left=r.right-ow;
  if(left<M) left=M; if(left+ow>innerWidth-M) left=innerWidth-M-ow;
  if(top<M) top=M; if(top+oh>innerHeight-M) top=innerHeight-M-oh;
  overlay.style.left=`${Math.round(left)}px`; overlay.style.top=`${Math.round(top)}px`;
}

function animateOpen(overlay){
  overlay.style.transition="opacity 140ms ease, transform 140ms ease";
  overlay.style.transformOrigin="top right";
  overlay.style.transform="translate(0,0) scale(0.98)";
  overlay.style.opacity="0"; overlay.style.visibility="visible";
  requestAnimationFrame(()=>{ overlay.classList.add("is-open"); overlay.style.opacity="1"; overlay.style.transform="translate(0,0) scale(1)"; });
  overlay.tabIndex=-1; overlay.focus?.();
}

function registerGlobalOverlayCleanup(overlay){
  const onDocClick=(ev)=>{ if(!overlay.contains(ev.target)) closeMoveOverlay(); };
  const onKey=(ev)=>{ if(ev.key==="Escape") closeMoveOverlay(); };
  const onAny=()=>closeMoveOverlay();
  document.addEventListener("click", onDocClick, {capture:true});
  document.addEventListener("keydown", onKey);
  ["scroll","wheel","touchmove"].forEach(t=>document.addEventListener(t,onAny,{capture:true,passive:true}));
  window.addEventListener("resize", onAny);
  moveOverlayCleanup=()=>{
    document.removeEventListener("click", onDocClick, {capture:true});
    document.removeEventListener("keydown", onKey);
    ["scroll","wheel","touchmove"].forEach(t=>document.removeEventListener(t,onAny,{capture:true}));
    window.removeEventListener("resize", onAny);
  };
}

function animateClose(el, after){
  el.style.transform="translate(0,0) scale(0.98)"; el.style.opacity="0"; el.classList.remove("is-open");
  let done=false; const onEnd=()=>{ if(done) return; done=true; el.removeEventListener("transitionend", onEnd); after(); };
  el.addEventListener("transitionend", onEnd, {once:true}); setTimeout(onEnd, 240);
}

function runMoveOverlayCleanup(){ if(moveOverlayCleanup){ moveOverlayCleanup(); moveOverlayCleanup=null; } }

function getSiblingTicket(el, dir){
  let sib = dir==="prev" ? el.previousElementSibling : el.nextElementSibling;
  while (sib && !sib.classList.contains("ticket")) sib = dir==="prev" ? sib.previousElementSibling : sib.nextElementSibling;
  return sib;
}

function notifyOrderChanged(parent){ if (typeof window.onTaskOrderChanged === "function") window.onTaskOrderChanged(parent); }

function findTargetContainer(targetColumn){
  return document.querySelector(`[data-column="${targetColumn}"]`) || document.getElementById(targetColumn);
}




function closeMoveOverlay() {
  if (currentMoveOverlay) {
    const el = currentMoveOverlay; currentMoveOverlay = null;
    animateClose(el, ()=>{ el.remove(); runMoveOverlayCleanup(); });
    return;
  }
  runMoveOverlayCleanup();
}

function moveTaskUp(taskId){
  const ticket = (document.getElementById(String(taskId))); if(!ticket) return;
  const parent = ticket.parentElement; if(!parent) return;
  const prev = (getSiblingTicket(ticket,"prev"));
  if (prev) { parent.insertBefore(ticket, prev); notifyOrderChanged(parent); }
}

function moveTaskDown(taskId){
  const ticket = (document.getElementById(String(taskId))); if(!ticket) return;
  const parent = ticket.parentElement; if(!parent) return;
  const next = (getSiblingTicket(ticket,"next"));
  if (next) { parent.insertBefore(next, ticket); notifyOrderChanged(parent); }
}

function moveTaskToColumn(taskId, targetColumn){
  const ticket = (document.getElementById(String(taskId))); if(!ticket) return;
  const source = getCurrentColumnForTicket(ticket);
  if (typeof window.onTaskColumnChanged === "function") { window.onTaskColumnChanged(taskId, targetColumn); return; }
  const target = (findTargetContainer(targetColumn)); if(!target){ console.warn(`[moveTaskToColumn] Target container for "${targetColumn}" not found.`); return; }
  target.appendChild(ticket); ticket.dataset.column = targetColumn;
  if (typeof window.onTaskColumnChanged === "function") window.onTaskColumnChanged(taskId, targetColumn, source);
}

function normalizeColumnName(raw){
  if(!raw) return ""; const v=String(raw).toLowerCase().replace(/\s+/g,"");
  if(v==="todo"||v.includes("to-do-column")) return "todo";
  if(v==="inprogress"||v.includes("in-progress-column")) return "inProgress";
  if(v.startsWith("await")||v.includes("review")||v.includes("await-feedback-column")) return "awaitFeedback";
  if(v==="done"||v.includes("done-column")) return "done"; return raw;
}

function getMoveTargetsFor(currentColumn){
  const map={ todo:[{label:"progress",col:"inProgress"}], inProgress:[{label:"to-do",col:"todo"},{label:"awaiting",col:"awaitFeedback"}], awaitFeedback:[{label:"progress",col:"inProgress"},{label:"done",col:"done"}], done:[{label:"awaiting",col:"awaitFeedback"}] };
  return map[normalizeColumnName(currentColumn)]||[];
}
