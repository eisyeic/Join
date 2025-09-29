let IS_DRAGGING = false;

window.drag = onTaskDragStart;


const DOM_TO_LOGICAL = {
  "to-do-column": "todo",
  "in-progress-column": "inProgress",
  "await-feedback-column": "awaitFeedback",
  "done-column": "done",
};

const LOGICAL_TO_DOM = {
  todo: "to-do-column",
  inProgress: "in-progress-column",
  awaitFeedback: "await-feedback-column",
  review: "await-feedback-column",
  done: "done-column",
};

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

function getCurrentColumnForTicket(ticketEl){
  if (ticketEl?.dataset?.column) return ticketEl.dataset.column;
  const colEl = ticketEl.closest("[data-column]") || ticketEl.closest(".column");
  if (colEl) return (colEl).dataset?.column || (colEl).id || "";
  return "";
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