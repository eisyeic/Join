const overlay = document.getElementById("overlay-add-task");
const overlayContent = document.querySelector(".add-task-overlay-content");
overlay?.addEventListener("click", onOverlayBackdropClick);
const TASK_CATEGORIES = ["toDo", "inProgress", "awaitFeedback", "done"];


function renderCategory(category) {
  const el = $("overlay-user-story");
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

function renderTitleDescDate(task) {
  $("overlay-title").innerHTML = task.title || "";
  $("overlay-description").textContent = task.description || "";
  $("overlay-due-date").textContent = formatDueDateDisplay(task.dueDate);
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

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
}

function renderPriority(priority) {
  const icons = {
    urgent: "./assets/icons/board/Urgent.svg",
    medium: "./assets/icons/board/Medium.svg",
    low: "./assets/icons/board/Low.svg",
  };
  $("overlay-priority-text").textContent = capitalize(priority);
  $("overlay-priority-icon").src = icons[priority] || "";
}

function onOverlayBackdropClick(e) {
  if (e.target !== overlay || overlay.classList.contains("d-none")) return;
  document.querySelector(".edit-addtask-wrapper")?.classList.add("d-none");
  document.getElementById("task-overlay-content")?.classList.remove("d-none");
  window.toggleAddTaskBoard();
}