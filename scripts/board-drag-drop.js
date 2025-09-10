// Board drag and drop functionality

// Flag indicating a drag operation is in progress
let IS_DRAGGING = false;

// DragStart handler for task cards
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

// Optional global dragstart used by inline HTML attributes
window.drag = onTaskDragStart;

// Wires drag hover listeners to all drop targets (.task-list)
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

// Applies highlight to the given drop target and clears it on others
function highlightColumn(el) {
  document
    .querySelectorAll(".task-list")
    .forEach((n) => n.classList.remove("highlight-column"));
  el.classList.add("highlight-column");
}

// Removes highlight from a single drop target
function unhighlightColumn(el) {
  el.classList.remove("highlight-column");
}

// Clears highlight from all drop targets
function resetColumnBackgrounds() {
  document
    .querySelectorAll(".task-list")
    .forEach((el) => el.classList.remove("highlight-column"));
}

// DOM → logical column id map
const DOM_TO_LOGICAL = {
  "to-do-column": "todo",
  "in-progress-column": "inProgress",
  "await-feedback-column": "awaitFeedback",
  "done-column": "done",
};

// Drop handler - moves the card in the DOM, updates Firebase, and maintains placeholders
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
  
  // Call external update function if available
  if (typeof window.updateTaskColumn === 'function') {
    window.updateTaskColumn(taskId, newColumn.id);
  }
  
  // Update placeholders
  if (typeof window.checkAndShowPlaceholder === 'function') {
    window.checkAndShowPlaceholder(oldColumn.id);
    window.checkAndShowPlaceholder(newColumn.id);
  }
  
  IS_DRAGGING = false;
  resetColumnBackgrounds();
};

export { 
  onTaskDragStart, 
  initDnDListeners, 
  highlightColumn, 
  unhighlightColumn, 
  resetColumnBackgrounds,
  DOM_TO_LOGICAL 
};