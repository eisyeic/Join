const placeholderTexts = {
  "to-do-column": "No tasks to do",
  "in-progress-column": "No tasks in progressing",
  "await-feedback-column": "No tasks await feedback",
  "done-column": "No tasks done",
};

const columnMap = {
  todo: "to-do-column",
  inProgress: "in-progress-column",
  awaitFeedback: "await-feedback-column",
  done: "done-column",
};

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

function renderAssignedInitials(contacts = []) {
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
      const safeContact = { initials, colorIndex, name: c?.name || "" };
      return renderChip(safeContact, idx, ctx);
    })
    .join("");
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

function getLabelClass(category) {
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