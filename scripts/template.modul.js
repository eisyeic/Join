import {
  getLabelClass,
  renderSubtaskProgress,
  renderAssignedInitials,
} from "./board.js";

import { truncateDescription } from "./task-overlay.js";

let _currentMoveOverlay = null;
let _moveOverlayCleanup = null;

/* ===========================
   Ticket-Template
   =========================== */

export function createTaskElement(task, taskId) {
  let labelClass = getLabelClass(task.category);
  let ticket = document.createElement("div");
  ticket.classList.add("ticket");
  ticket.setAttribute("id", taskId);
  ticket.setAttribute("draggable", "true");
  ticket.setAttribute("ondragstart", "drag(event)");
  if (task.column) {
    ticket.dataset.column = task.column; // "todo" | "inProgress" | "awaitFeedback" | "done"
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
  return ticket;
}

/* ===========================
   Assigned Contacts im Overlay
   =========================== */

export function renderAssignedContacts(task) {
  const contacts = Array.isArray(task?.assignedContacts) ? task.assignedContacts : [];
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

// Optional global verfügbar
window.renderAssignedContacts = renderAssignedContacts;

/* ===========================
   Subtasks im Overlay
   =========================== */

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

  // --- Inhalt mit Richtungs-Icons vor jedem Ziel ---
  const normCurrent = normalizeColumnName(currentColumn);
  const order = { todo: 0, inProgress: 1, awaitFeedback: 2, done: 3 };

  const parts = [];
  parts.push(`<div class="move-overlay__title">Move to</div>`);

  const targets = getMoveTargetsFor(currentColumn);
  targets.forEach(t => {
    const dir = (order[t.col] ?? 0) < (order[normCurrent] ?? 0) ? "up" : "down";
    const iconFile = dir === "up" ? "arrow_upward.svg" : "arrow_downward.svg";

    parts.push(`
      <button type="button"
              class="move-option"
              data-col="${t.col}"
              role="menuitem"
              style="display:flex;align-items:center;gap:8px;background:none;border:none;padding:6px 0;color:inherit;cursor:pointer;text-align:left;width:100%;">
        <img src="./assets/icons/board/${iconFile}" alt="" width="16" height="16">
        <span>${t.label}</span>
      </button>
    `);
  });

  overlay.innerHTML = parts.join("\n");

  // Interne Klicks + Aktionen (delegiert, falls auf img/span geklickt wird)
  overlay.addEventListener("mousedown", (e) => e.stopPropagation());
  overlay.addEventListener("touchstart", (e) => e.stopPropagation(), { passive: true });
  overlay.addEventListener("click", (e) => {
    e.stopPropagation();
    const trg = e.target instanceof Element ? e.target.closest("[data-col],[data-action]") : null;
    if (!trg) return;

    const action = trg.getAttribute("data-action");
    const col = trg.getAttribute("data-col");

    if (action === "up")      moveTaskUp(taskId);
    else if (action === "down") moveTaskDown(taskId);
    else if (col)             moveTaskToColumn(taskId, col);

    closeMoveOverlay();
  });

  // DOM → messen ohne Blinken
  document.body.appendChild(overlay);
  overlay.style.display = "flex";
  overlay.style.visibility = "hidden";
  overlay.style.position = "fixed";
  overlay.style.zIndex = "9999";

  // ZIELPOSITION (top-right des Overlays = top-right des Buttons)
  positionOverlayTopLeft(anchorEl, overlay);

  // In-place Animation (kein translate!)
  overlay.style.transition = "opacity 140ms ease, transform 140ms ease";
  overlay.style.transformOrigin = "top right";
  overlay.style.transform = "translate(0,0) scale(0.98)";
  overlay.style.opacity = "0";

  // Sichtbar machen & sanft einblenden – direkt an der Zielposition
  overlay.style.visibility = "visible";
  requestAnimationFrame(() => {
    overlay.classList.add("is-open");
    overlay.style.opacity = "1";
    overlay.style.transform = "translate(0,0) scale(1)";
  });

  // Fokus optional
  overlay.tabIndex = -1;
  overlay.focus?.();

  // Outside/ESC/Scroll → schließen (auch in verschachtelten Scrollcontainern)
  const onDocClick = (ev) => { if (!overlay.contains(ev.target)) closeMoveOverlay(); };
  const onKey = (ev) => { if (ev.key === "Escape") closeMoveOverlay(); };
  const onAnyScrollOrResize = () => closeMoveOverlay();

  document.addEventListener("click", onDocClick, { capture: true });
  document.addEventListener("keydown", onKey);
  document.addEventListener("scroll", onAnyScrollOrResize, { capture: true, passive: true });
  document.addEventListener("wheel", onAnyScrollOrResize, { capture: true, passive: true });
  document.addEventListener("touchmove", onAnyScrollOrResize, { capture: true, passive: true });
  window.addEventListener("resize", onAnyScrollOrResize);

  _moveOverlayCleanup = () => {
    document.removeEventListener("click", onDocClick, { capture: true });
    document.removeEventListener("keydown", onKey);
    document.removeEventListener("scroll", onAnyScrollOrResize, { capture: true });
    document.removeEventListener("wheel", onAnyScrollOrResize, { capture: true });
    document.removeEventListener("touchmove", onAnyScrollOrResize, { capture: true });
    window.removeEventListener("resize", onAnyScrollOrResize);
  };

  _currentMoveOverlay = overlay;
}


function closeMoveOverlay() {
  if (_currentMoveOverlay) {
    const el = _currentMoveOverlay;
    // in-place ausblenden (keine Positionsänderung)
    el.style.transform = "translate(0,0) scale(0.98)";
    el.style.opacity = "0";
    el.classList.remove("is-open");

    const cleanup = () => {
      el.remove();
      if (_moveOverlayCleanup) {
        _moveOverlayCleanup();
        _moveOverlayCleanup = null;
      }
    };

    let done = false;
    const onEnd = () => {
      if (done) return;
      done = true;
      el.removeEventListener("transitionend", onEnd);
      cleanup();
    };
    el.addEventListener("transitionend", onEnd, { once: true });
    setTimeout(onEnd, 240); // Fallback

    _currentMoveOverlay = null;
    return;
  }
  if (_moveOverlayCleanup) {
    _moveOverlayCleanup();
    _moveOverlayCleanup = null;
  }
}


/**
 * Ausrichtung: top-right des Overlays = top-right des Buttons.
 * FIXED → viewport-relativ (kein scrollX/scrollY addieren).
 * Clamps halten das Overlay im Viewport, ohne “Flug”.
 */
function positionOverlayTopLeft(anchorEl, overlay) {
  const MARGIN = 8;
  const r = anchorEl.getBoundingClientRect();
  const { width: ow, height: oh } = overlay.getBoundingClientRect();

  let top  = r.top;
  let left = r.right - ow;

  // Clamps (können die exakte Eck-Deckung minimal verschieben)
  if (left < MARGIN) left = MARGIN;
  if (left + ow > window.innerWidth - MARGIN) left = window.innerWidth - MARGIN - ow;
  if (top < MARGIN) top = MARGIN;
  if (top + oh > window.innerHeight - MARGIN) top = window.innerHeight - MARGIN - oh;

  overlay.style.left = `${Math.round(left)}px`;
  overlay.style.top  = `${Math.round(top)}px`;
}


/* ===========================
   Reorder / Move
   =========================== */

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

  // Bridge vorhanden? Dann dort persistieren/handlen
  if (typeof window.onTaskColumnChanged === "function") {
    window.onTaskColumnChanged(taskId, targetColumn);
    return;
  }

  // Fallback: DOM verschieben
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

/* ===========================
   Helpers
   =========================== */

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
      return [{ label: 'progress', col: 'inProgress' }];
    case 'inProgress':
      return [
        { label: 'to-do',     col: 'todo' },
        { label: 'awaiting',  col: 'awaitFeedback' },
      ];
    case 'awaitFeedback':
      return [
        { label: 'progress', col: 'inProgress' },
        { label: 'done',        col: 'done' },
      ];
    case 'done':
      return [{ label: 'awaiting', col: 'awaitFeedback' }];
    default:
      return [];
  }
}
