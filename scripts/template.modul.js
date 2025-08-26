import {
  getLabelClass,
  renderSubtaskProgress,
  renderAssignedInitials,
} from "./board.js";

import { truncateDescription } from "./task-overlay.js";

let _currentMoveOverlay = null;
let _moveOverlayCleanup = null;

// create task template
export function createTaskElement(task, taskId) {
  let labelClass = getLabelClass(task.category);
  let ticket = document.createElement("div");
  ticket.classList.add("ticket");
  ticket.setAttribute("id", taskId);
  ticket.setAttribute("draggable", "true");
  ticket.setAttribute("ondragstart", "drag(event)");
  if (task.column) {
    ticket.dataset.column = task.column; // z. B. "todo" | "inProgress" | "review" | "done"
  }

  // Beschreibung kürzen wenn nötig
  const truncatedDescription = truncateDescription(task.description || "");

  ticket.innerHTML = `
    <div class="ticket-content" onclick="showTaskOverlay('${taskId}')">
      <div class="label-box">  
        <div class="label ${labelClass}">${task.category}</div>
        <img
          class="plus-minus-img"
          src="./assets/icons/board/plusminus.svg"
          alt="plus/minus"
          draggable="false"
          role="button"
          aria-label="Weitere Optionen"
        >
      </div>
      <div class="frame">
        <div class="ticket-title">${task.title}</div>
        <div class="ticket-text">${truncatedDescription}</div>
      </div>
      ${
        task.subtasks && task.subtasks.length > 0
          ? renderSubtaskProgress(task.subtasks)
          : ""
      }
      <div class="initials-icon-box">
        <div class="initials">
          ${
            task.assignedContacts
              ? renderAssignedInitials(task.assignedContacts)
              : ""
          }
        </div>
        <img src="./assets/icons/board/${task.priority}.svg" alt="${task.priority}">
      </div>
    </div>
  `;

  // --- Stop propagation + Move-Overlay öffnen ---
  const plusMinus = ticket.querySelector(".plus-minus-img");
  if (plusMinus) {
    plusMinus.addEventListener("click", (e) => {
      e.stopPropagation();
      const currentColumn = getCurrentColumnForTicket(ticket);
      openMoveOverlay(plusMinus, taskId, currentColumn);
    });
    plusMinus.addEventListener("mousedown", (e) => e.stopPropagation());
    plusMinus.addEventListener("touchstart", (e) => e.stopPropagation(), { passive: true });
    plusMinus.addEventListener("dragstart", (e) => e.preventDefault());
  }
  // --- Ende: Stop propagation / Overlay ---

  return ticket;
}

// render contacts in task overlay
// overlay.js / board.js – wo deine Funktion aktuell liegt
export function renderAssignedContacts(task) {
  const contacts = Array.isArray(task?.assignedContacts) ? task.assignedContacts : [];

  // wartet bis der Container im DOM ist (max. ~15 Frames)
  const waitAndRender = (tries = 15) => {
    const container = document.getElementById("overlay-members");
    if (!container) {
      if (tries > 0) requestAnimationFrame(() => waitAndRender(tries - 1));
      return;
    }

    container.innerHTML = contacts.map((c) => {
      const colorIdx = Number.isFinite(c?.colorIndex) ? c.colorIndex : 0;
      const initials = c?.initials || "";
      const name = c?.name || initials;

      return `
        <div class="member">
          <div class="initial-circle"
               style="background-image:url(../assets/icons/contact/color${colorIdx}.svg)">
            ${initials}
          </div>
          <span>${name}</span>
        </div>
      `;
    }).join("");
  };

  waitAndRender();
}

// Optional (macht die Funktion auch global aufrufbar, falls showTaskOverlay auf window zugreift)
window.renderAssignedContacts = renderAssignedContacts;



// render subtasks in task overlay
export function renderSubtasks(task) {
  let container = $("overlay-subtasks");
  if (task.subtasks && task.subtasks.length > 0) {
    let subtasksHtml = "";
    task.subtasks.forEach((subtask, i) => {
      let checked = subtask.checked ? "checked" : "";
      let checkboxId = `subtask${i}`;
      let iconSrc = subtask.checked
        ? "./assets/icons/add_task/check_checked.svg"
        : "./assets/icons/add_task/check_default.svg";
      let labelClass = subtask.checked ? "checked" : "";
      subtasksHtml += `
        <div class="subtask">
          <input type="checkbox" id="${checkboxId}" ${checked} style="display: none"/>
          <label for="${checkboxId}" class="${labelClass}">
            <img src="${iconSrc}" />
            ${subtask.name}
          </label>
        </div>
      `;
    });
    container.innerHTML = `<b>Subtasks:</b><div class="subtasks-container">${subtasksHtml}</div>`;
  } else {
    container.innerHTML = "<b>no subtasks</b>";
  }
}

/* ===========================
   Move-Overlay + Reorder/Move-Logik
   =========================== */

function openMoveOverlay(anchorEl, taskId, currentColumn) {
  // Toggle fürs gleiche Ticket
  if (_currentMoveOverlay && _currentMoveOverlay.dataset.taskId === String(taskId)) {
    closeMoveOverlay();
    return;
  }
  closeMoveOverlay();

  const overlay = document.createElement("div");
  overlay.className = "move-overlay";
  overlay.setAttribute("role", "menu");
  overlay.dataset.taskId = taskId;

  // --- dynamischer Inhalt ---
  const items = [];
  items.push(`<div>Move to</div>`); // nur Überschrift

  const targets = getMoveTargetsFor(currentColumn);
  targets.forEach(t => {
    items.push(`<span data-col="${t.col}" role="menuitem">${t.label}</span>`);
  });

  overlay.innerHTML = items.join("\n");



  // Interne Klicks nicht nach außen blubbern
  overlay.addEventListener("mousedown", (e) => e.stopPropagation());
  overlay.addEventListener("touchstart", (e) => e.stopPropagation(), { passive: true });
  overlay.addEventListener("click", (e) => {
    e.stopPropagation();
    const target = e.target;
    if (!(target instanceof Element)) return;

    const action = target.getAttribute("data-action");
    const col = target.getAttribute("data-col");

    if (action === "up") moveTaskUp(taskId);
    else if (action === "down") moveTaskDown(taskId);
    else if (col) moveTaskToColumn(taskId, col);

    closeMoveOverlay();
  });

  // An body hängen + initial positionieren (wie gehabt)
  overlay.style.position = "absolute";
  overlay.style.visibility = "hidden";
  overlay.style.top = "0px";
  overlay.style.left = "0px";
  overlay.style.zIndex = "9999";
  document.body.appendChild(overlay);

  positionOverlayTopLeft(anchorEl, overlay); // deine vorhandene Funktion
  overlay.style.visibility = "visible";
  overlay.tabIndex = -1;
  overlay.focus?.();

  // Outside-Klick / ESC / Scroll/Resize -> schließen (wie gehabt)
  const onDocClick = (ev) => { if (!overlay.contains(ev.target)) closeMoveOverlay(); };
  const onKey = (ev) => { if (ev.key === "Escape") closeMoveOverlay(); };
  const onScrollOrResize = () => closeMoveOverlay();

  document.addEventListener("click", onDocClick, { capture: true });
  document.addEventListener("keydown", onKey);
  window.addEventListener("scroll", onScrollOrResize, { passive: true });
  window.addEventListener("resize", onScrollOrResize);

  _moveOverlayCleanup = () => {
    document.removeEventListener("click", onDocClick, { capture: true });
    document.removeEventListener("keydown", onKey);
    window.removeEventListener("scroll", onScrollOrResize);
    window.removeEventListener("resize", onScrollOrResize);
  };

  _currentMoveOverlay = overlay;
}


function closeMoveOverlay() {
  if (_currentMoveOverlay) {
    _currentMoveOverlay.remove();
    _currentMoveOverlay = null;
  }
  if (_moveOverlayCleanup) {
    _moveOverlayCleanup();
    _moveOverlayCleanup = null;
  }
}

// NEU: Overlay exakt auf die linke obere Ecke des Buttons setzen
function positionOverlayTopLeft(anchorEl, overlay) {
  const rect = anchorEl.getBoundingClientRect();
  const left = window.scrollX + rect.left;
  const top = window.scrollY + rect.top;
  overlay.style.left = `${left}px`;
  overlay.style.top = `${top}px`;
}

function moveTaskUp(taskId) {
  const ticket = document.getElementById(String(taskId));
  if (!ticket) return;
  const parent = ticket.parentElement;
  if (!parent) return;

  // vorherigen .ticket suchen
  let prev = ticket.previousElementSibling;
  while (prev && !prev.classList.contains("ticket")) {
    prev = prev.previousElementSibling;
  }
  if (prev) {
    parent.insertBefore(ticket, prev);
    // optionaler Hook zum Persistieren
    if (typeof window.onTaskOrderChanged === "function") {
      window.onTaskOrderChanged(parent);
    }
  }
}

function moveTaskDown(taskId) {
  const ticket = document.getElementById(String(taskId));
  if (!ticket) return;
  const parent = ticket.parentElement;
  if (!parent) return;

  // nächsten .ticket suchen
  let next = ticket.nextElementSibling;
  while (next && !next.classList.contains("ticket")) {
    next = next.nextElementSibling;
  }
  if (next) {
    // Swap: next vor ticket setzen => ticket rutscht um 1 nach unten
    parent.insertBefore(next, ticket);
    if (typeof window.onTaskOrderChanged === "function") {
      window.onTaskOrderChanged(parent);
    }
  }
}

function moveTaskToColumn(taskId, targetColumn) {
  const ticket = document.getElementById(String(taskId));
  if (!ticket) return;

  const sourceColumn = getCurrentColumnForTicket(ticket);

  // NEU: Wenn Board-Bridge existiert -> DnD-Mechanik nutzen und HIER beenden
  if (typeof window.onTaskColumnChanged === "function") {
    window.onTaskColumnChanged(taskId, targetColumn);
    return;
  }

  // (Fallback – nur falls Bridge nicht existiert)
  let targetContainer =
    document.querySelector(`[data-column="${targetColumn}"]`) ||
    document.getElementById(targetColumn);

  if (!targetContainer) {
    console.warn(`[moveTaskToColumn] Ziel-Container für "${targetColumn}" nicht gefunden. Erwartet [data-column="${targetColumn}"] oder #${targetColumn}`);
    return;
  }

  targetContainer.appendChild(ticket);
  ticket.dataset.column = targetColumn;

  if (typeof window.onTaskColumnChanged === "function") {
    window.onTaskColumnChanged(taskId, targetColumn, sourceColumn);
  }
}


function getCurrentColumnForTicket(ticketEl) {
  // Priorität: data-column am Ticket
  if (ticketEl?.dataset?.column) return ticketEl.dataset.column;

  // sonst versuchen, am nächstgelegenen Eltern-Container abzuleiten
  const columnEl = ticketEl.closest("[data-column]") || ticketEl.closest(".column");
  if (columnEl) {
    if (columnEl.dataset?.column) return columnEl.dataset.column;
    if (columnEl.id) return columnEl.id;
  }
  return "";
}

/* === Helfer: Spalten normalisieren & Ziele bestimmen === */
function normalizeColumnName(raw) {
  if (!raw) return '';
  const v = String(raw).toLowerCase().replace(/\s+/g, '');
  if (v === 'todo' || v.includes('to-do-column')) return 'todo';
  if (v === 'inprogress' || v.includes('in-progress-column')) return 'inProgress';
  if (v.startsWith('await') || v.includes('review') || v.includes('await-feedback-column')) return 'awaitFeedback';
  if (v === 'done' || v.includes('done-column')) return 'done';
  return raw;
}

function getMoveTargetsFor(currentColumn) {
  const col = normalizeColumnName(currentColumn);
  switch (col) {
    case 'todo':
      return [{ label: 'progressing', col: 'inProgress' }];
    case 'inProgress':
      return [
        { label: 'to-do',     col: 'todo' },
        { label: 'awaiting',  col: 'awaitFeedback' },
      ];
    case 'awaitFeedback':
      return [
        { label: 'progressing', col: 'inProgress' },
        { label: 'done',           col: 'done' },
      ];
    case 'done':
      return [{ label: 'awaiting', col: 'awaitFeedback' }];
    default:
      return [];
  }
}