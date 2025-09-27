import { renderAssignedInitials } from "./board/board.js";
import { renderSubtaskProgress, getLabelClass } from "./board/task-overlay.js";

let currentMoveOverlay = null;
let moveOverlayCleanup = null;
function truncateForCard(text, max = 50) {
  const s = (text || "").trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut) + "…";
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

function resolveContacts(task){
  return Array.isArray(task?.assignedContacts) ? task.assignedContacts : [];
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

export function createTaskElement(task, taskId) {
  const ticket = document.createElement("div");
  ticket.classList.add("ticket");
  ticket.id = taskId; ticket.draggable = true; ticket.setAttribute("ondragstart","drag(event)");
  if (task.column) ticket.dataset.column = task.column;
  ticket.innerHTML = buildTicketHTML(task, taskId);
  initPlusMinus(ticket, taskId);
  return ticket;
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

function getCurrentColumnForTicket(ticketEl){
  if (ticketEl?.dataset?.column) return ticketEl.dataset.column;
  const colEl = ticketEl.closest("[data-column]") || ticketEl.closest(".column");
  if (colEl) return (colEl).dataset?.column || (colEl).id || "";
  return "";
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
