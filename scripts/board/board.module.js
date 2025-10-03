import {
  getDatabase,
  ref,
  onValue,
  update,
  get,
  remove
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { app, auth } from "../firebase.js";

const MIN_SEARCH_CHARS = 3;
let currentSearchTerm = "";
const db = getDatabase(app);

function debounce(fn, wait = 200) {
  let t;
  return ((...args) => {
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
  for (const key in columnMap) document.getElementById(columnMap[key]).innerHTML = "";
}

function getSortedTaskIds(tasks) {
  return Object.keys(tasks).sort(
    (a, b) => (tasks[a].movedAt || 0) - (tasks[b].movedAt || 0)
  );
}

function renderTask(task, taskId) {
  const targetColumnId = columnMap[task.column] || "to-do-column";
  const columnElement = document.getElementById(targetColumnId);
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
  const column = document.getElementById(columnId);
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
    list.addEventListener("drop", handleDrop);
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

const DOM_TO_LOGICAL = Object.fromEntries(Object.entries(columnMap).map(([k, v]) => [v, k]));

function handleDrop(event) {
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
}

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
  const searchInput = document.getElementById("search-input");
  const searchButton = document.getElementById("search-btn");
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
  const newDomId = columnMap[targetLogical] || targetLogical;
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
  ticket.id = taskId;
  ticket.draggable = true;
  if (task.column) ticket.dataset.column = task.column;
  ticket.innerHTML = buildTicketHTML(task, taskId);
  const content = ticket.querySelector('.ticket-content');
  if (content) content.addEventListener('click', () => showTaskOverlay(String(taskId)));
  ticket.addEventListener('dragstart', onTaskDragStart);
  initPlusMinus(ticket, taskId);
  return ticket;
}

function buildTicketHTML(task, taskId) {
  const labelClass = getLabelClass(task.category);
  const desc = task.description || "";
  const truncated = truncateForCard(desc, 50);
  const initials = task.assignedContacts ? renderAssignedInitials(task.assignedContacts) : "";
  return `
    <div class="ticket-content">
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
  const btn = (ticket.querySelector(".plus-minus-img"));
  if (!btn) return;
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const col = getCurrentColumnForTicket(ticket);
    openMoveOverlay(btn, taskId, col);
  });
  ["mousedown","touchstart","dragstart"].forEach((t)=>btn.addEventListener(t,(e)=>e.stopPropagation(),{passive:true}));
}

function renderCategory(category) {
  const el = document.getElementById("overlay-user-story");
  el.textContent = category || "";
  el.className = "";
  el.classList.add(getLabelClass(category));
}

function fillTaskOverlay(task) {
  renderCategory(task.category);
  renderTitleDescDate(task);
  renderPriority(task.priority);
  renderAssignedContacts(task);
  renderSubtasks(task);
  setupSubtaskListeners(task);
}

async function showTaskOverlay(taskId) {
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
}

async function fetchTask(taskId) {
  const snap = await get(ref(db, `tasks/${taskId}`));
  if (!snap.exists()) return null;
  const task = snap.val();
  task.id = taskId;
  return task;
}

window.hideOverlay = function () {
  const bg = document.getElementById("task-overlay-bg");
  const overlay = document.getElementById("task-overlay");
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
  const container = document.getElementById("overlay-subtasks");
  if (task.subtasks && task.subtasks.length) container.innerHTML = toSubtasksHtml(task.subtasks);
  else renderNoSubtasks(container);
}

function renderTitleDescDate(task) {
  document.getElementById("overlay-title").innerHTML = task.title || "";
  document.getElementById("overlay-description").textContent = task.description || "";
  document.getElementById("overlay-due-date").textContent = formatDueDateDisplay(task.dueDate);
}

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

export function renderPriority(priority) {
  const icons = {
    urgent: "./assets/icons/board/Urgent.svg",
    medium: "./assets/icons/board/Medium.svg",
    low: "./assets/icons/board/Low.svg",
  };
  document.getElementById("overlay-priority-text").textContent = capitalize(priority);
  const priIcon = document.getElementById("overlay-priority-icon");
  if (priIcon) priIcon.src = icons[priority] || "";
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
}

function setupSubtaskListeners(task) {
  const pairs =
    getPairsByDataIndex() || getPairsByIdPattern() || /** @type {any[]} */ ([]);
  pairs.forEach(({ checkbox, label, img, idx }) => {
    if (checkbox && label) attachSubtaskEvents(checkbox, label, img, task.id, idx);
  });
}

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
      document.querySelector(`label[for="${checkbox.id}"]`) || (checkbox.nextElementSibling);
    const img = label ? label.querySelector("img") : null;
    out.push({ checkbox, label, img, idx });
  });
  return out;
}

function getPairsByIdPattern() {
  const boxes = document.querySelectorAll('input[type="checkbox"][id^="subtask"]');
  if (!boxes.length) return null;
  const out = [];
  boxes.forEach((checkbox) => {
    const m = (checkbox.id || "").match(/(\d+)$/);
    if (!m) return;
    const idx = parseInt(m[1], 10);
    const label =
      document.querySelector(`label[for="${checkbox.id}"]`) || (checkbox.nextElementSibling);
    const img = label ? label.querySelector("img") : null;
    out.push({ checkbox, label, img, idx });
  });
  return out;
}

function wireEditButton(task) {
  const btn = document.getElementById("edit-task-btn");
  if (!btn) return;
  btn.onclick = () => openEditInsideOverlay(task);
}

function wireDeleteButton(taskId) {
  const btn = document.getElementById("delete-task-btn");
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

function showOverlayUI() {
  const bg = document.getElementById("task-overlay-bg");
  const overlay = document.getElementById("task-overlay");
  if (!bg || !overlay) return;
  bg.classList.remove("d-none");
  overlay.classList.remove("animate-out");
  overlay.classList.add("animate-in");
}

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

async function deleteTaskFromDatabase(taskId) {
  const taskRef = ref(db, `tasks/${taskId}`);
  await remove(taskRef);
}

function openOverlay() {
  overlay.classList.remove("d-none");
  overlayContent.classList.remove("slide-out");
  overlayContent.classList.add("slide-in");
  const cancelBtn = document.getElementById("cancel-button");
  if (cancelBtn) cancelBtn.click();
  else
    document.addEventListener(
      "addtask:template-ready",
      () => document.getElementById("cancel-button")?.click(),
      { once: true }
    );
}

function closeOverlay() {
  overlayContent.classList.remove("slide-in");
  overlayContent.classList.add("slide-out");
  overlayContent.addEventListener("animationend", function handler() {
    overlay.classList.add("d-none");
    overlayContent.classList.remove("slide-out");
    overlayContent.removeEventListener("animationend", handler);
  });
}

window.toggleAddTaskBoard = function () {
  if (overlay.classList.contains("d-none")) openOverlay();
  else closeOverlay();
  moveFormBackToAside();
};

function moveFormBackToAside() {
  const src = document.querySelector(".edit-addtask .addtask-wrapper");
  const dst = document.querySelector(".addtask-aside-clone");
  if (src && dst) dst.replaceChildren(src);
}

const _editBtn = document.getElementById("edit-task-btn");
if (_editBtn) _editBtn.addEventListener("click", onEditTaskBtnClick);
function onEditTaskBtnClick() {
  document.getElementById("task-overlay-content").classList.toggle("d-none");
  document.querySelector(".edit-addtask-wrapper").classList.toggle("d-none");
  const src = document.querySelector(".addtask-aside-clone .addtask-wrapper");
  const dst = document.querySelector(".edit-addtask");
  if (src && dst) dst.replaceChildren(src);
}

const overlay = document.getElementById("overlay-add-task");
const overlayContent = document.querySelector(".add-task-overlay-content");

overlay?.addEventListener("click", onOverlayBackdropClick);

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

function switchToEditView() {
  const taskContent = document.getElementById("task-overlay-content");
  const editWrap = document.querySelector(".edit-addtask-wrapper");
  taskContent?.classList.add("d-none");
  editWrap?.classList.remove("d-none");
}

function openEditInsideOverlay(task) {
  switchToEditView();
  moveFormIntoEdit();
  markEditingId(task);
  populateEditForm(task);
  if (typeof window.applyAssignedInitialsCap === "function") {
    queueMicrotask(() => applyAssignedInitialsCap());
  }
  setTimeout(() => {
    populateEditForm(task);
    if (typeof window.applyAssignedInitialsCap === "function") {
      applyAssignedInitialsCap();
    }
  }, 0);
  syncAssignedSelectionToList();
  if (typeof window.addEditEvents === "function") window.addEditEvents();
}

function setCategorySelection(task) {
  const sel = document.getElementById("category-select");
  const span = sel ? sel.querySelector("span") : null;
  if (span) span.textContent = task.category || "Select task category";
  if (sel) sel.dataset.value = task.category || "";
}

function setPriorityButtons(task) {
  document.querySelectorAll(".prio-buttons .priority-button")
    .forEach((b) => b.classList.remove("active"));
  const map = { urgent: ".urgent-button", medium: ".medium-button", low: ".low-button" };
  const key = (task.priority || "medium").toLowerCase();
  document.querySelector(map[key] || ".medium-button")?.classList.add("active");
}

function setAssignedContactsUI(task) {
  const assigned = Array.isArray(task.assignedContacts)
    ? task.assignedContacts
    : Array.isArray(task.assigned)
    ? task.assigned
    : [];
  const initialsBox = document.getElementById("contact-initials");
  const selectBox = document.getElementById("assigned-select-box");
  if (initialsBox) updateInitialsBox(initialsBox, assigned);
  if (selectBox) selectBox.dataset.selected = JSON.stringify(assigned.map((p) => p.id).filter(Boolean));
}

function populateEditForm(task) {
  if (typeof window.enterAddTaskEditMode === "function") {
    try {
      window.enterAddTaskEditMode(task);
      return;
    } catch (e) {
      console.warn("enterAddTaskEditMode failed, using fallback", e);
    }
  }
  populateEditFormFallback(task);
}

function moveFormIntoEdit() {
  const src =
    document.querySelector(".addtask-aside-clone .addtask-wrapper") ||
    document.querySelector(".edit-addtask .addtask-wrapper");
  const dst = document.querySelector(".edit-addtask");
  if (src && dst && src.parentElement !== dst) dst.replaceChildren(src);
}

function markEditingId(task) {
  const wrap = document.querySelector(".addtask-wrapper");
  if (wrap && task?.id) wrap.dataset.editingId = String(task.id);
}

function populateEditFormFallback(task) {
  if (!task) return;
  markEditingId(task);
  setTitleAndDescription(task);
  setDueDateField(task);
  setCategorySelection(task);
  setPriorityButtons(task);
  setAssignedContactsUI(task);
  setSubtasksArray(task);
}

function setTitleAndDescription(task) {
  const titleEl = document.getElementById("addtask-title");
  const descEl = document.getElementById("addtask-textarea");
  if (titleEl) (titleEl).value = task.title || "";
  if (descEl) (descEl).value = task.description || "";
}

function setDueDateField(task) {
  const dateEl = document.getElementById("datepicker");
  if (!dateEl) return;

  const d = task.dueDate ? new Date(task.dueDate) : null;
  if (d && !Number.isNaN(d.getTime())) {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = String(d.getFullYear());
    (dateEl).value = `${yyyy}-${mm}-${dd}`;
  } else {
    (dateEl).value = task.dueDate || "";
  }
}

function syncAssignedSelectionToList() {
  const list = document.getElementById("contact-list-box");
  const selectBox = document.getElementById("assigned-select-box");
  if (!list || !selectBox) return;
  let ids = [];
  try {
    ids = JSON.parse(selectBox.dataset.selected || "[]") || [];
  } catch {}
  const idSet = new Set(ids);
  list.querySelectorAll("li").forEach((li) => {
    const img = li.querySelector("img");
    const isSel = idSet.has(li.id);
    li.classList.toggle("selected", isSel);
    if (img)
      img.src = isSel
        ? "./assets/icons/add_task/check_white.svg"
        : "./assets/icons/add_task/check_default.svg";
  });
}

function updateInitialsBox(box, assigned) {
  if (!assigned.length) {
    box.classList.add("d-none");
    box.innerHTML = "";
    return;
  }
  const html = assigned
    .map((p) => {
      const name = p.name || "";
      const ini =
        (p.initials && String(p.initials).trim()) ||
        (name ? name.trim().split(/\s+/).map((x) => x[0]).join("").slice(0, 2).toUpperCase() : "");
      const color = typeof p.colorIndex === "number" ? p.colorIndex : 1;
      return `<div class="contact-initial" style="background-image: url(../assets/icons/contact/color${color}.svg)">${ini}</div>`;
    })
    .join("");
  box.innerHTML = html;
  box.classList.remove("d-none");
}

function setSubtasksArray(task) {
  const listEl = document.getElementById("subtask-list");
  if (listEl) listEl.innerHTML = "";
  if (!Array.isArray(task?.subtasks) || task.subtasks.length === 0) {
    if (!Array.isArray(window.subtasks)) window.subtasks = [];
    else window.subtasks.length = 0;
    if (typeof window.renderSubtasks === "function") window.renderSubtasks();
    if (typeof window.addEditEvents === "function") window.addEditEvents();
    return;
  }
  try {
    const list = (Array.isArray(task.subtasks) ? task.subtasks : [])
      .map((st) => {
        if (typeof st === "string") return { name: st, checked: false };
        return { name: st?.name || "", checked: !!st?.checked };
      })
      .filter((st) => st.name);
    if (!Array.isArray(window.subtasks)) window.subtasks = [];
    window.subtasks.length = 0;
    window.subtasks.push(...list);
    if (typeof window.renderSubtasks === "function") window.renderSubtasks();
    if (typeof window.addEditEvents === "function") window.addEditEvents();
  } catch {}
}
