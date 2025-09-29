const MIN_SEARCH_CHARS = 3;
let currentSearchTerm = "";

function getAddTaskOverlay(){ return document.getElementById('overlay-add-task'); }
function getAddTaskOverlayContent(){ return document.querySelector('.add-task-overlay-content'); }

function onBoardDomContentLoaded() {
  initDnDListeners();
  loadTasksFromFirebase();
  setupSearchHandlers();
}

async function showTaskOverlay(taskId) {
  try {
    const task = await fetchTask(taskId);
    if (!task) return;
    normalizeSubtasks(taskId, task);
    fillTaskOverlay(task);
    wireEditButton(task);
    wireDeleteButton(taskId);
    showOverlayUI();
  } catch (err) {
    console.error("Error showing task overlay:", err);
  }
};

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

function showOverlayUI() {
  const bg = $("task-overlay-bg");
  const overlay = $("task-overlay");
  if (!bg || !overlay) return;
  bg.classList.remove("d-none");
  overlay.classList.remove("animate-out");
  overlay.classList.add("animate-in");
}

function openOverlay() {
  const overlay = getAddTaskOverlay();
  const overlayContent = getAddTaskOverlayContent();
  if (!overlay || !overlayContent) return;
  overlay.classList.remove('d-none');
  overlayContent.classList.remove('slide-out');
  overlayContent.classList.add('slide-in');
  const cancelBtn = document.getElementById('cancel-button');
  if (cancelBtn) cancelBtn.click();
  else document.addEventListener('addtask:template-ready', () => document.getElementById('cancel-button')?.click(), { once: true });
}

function closeOverlay() {
  const overlay = getAddTaskOverlay();
  const overlayContent = getAddTaskOverlayContent();
  if (!overlay || !overlayContent) return;
  overlayContent.classList.remove('slide-in');
  overlayContent.classList.add('slide-out');
  overlayContent.addEventListener('animationend', function handler(){
    overlay.classList.add('d-none');
    overlayContent.classList.remove('slide-out');
    overlayContent.removeEventListener('animationend', handler);
  });
}

function toggleAddTaskBoard() {
  const overlay = getAddTaskOverlay();
  if (!overlay) return;
  if (overlay.classList.contains('d-none')) openOverlay();
  else closeOverlay();
  moveFormBackToAside();
};

function moveFormBackToAside() {
  const src = document.querySelector(".edit-addtask .addtask-wrapper");
  const dst = document.querySelector(".addtask-aside-clone");
  if (src && dst) dst.replaceChildren(src);
}

function onEditTaskBtnClick() {
  $("task-overlay-content").classList.toggle("d-none");
  document.querySelector(".edit-addtask-wrapper").classList.toggle("d-none");
  const src = document.querySelector(".addtask-aside-clone .addtask-wrapper");
  const dst = document.querySelector(".edit-addtask");
  if (src && dst) dst.replaceChildren(src);
}

function wireEditButton(task) {
  const btn = $("edit-task-btn");
  if (!btn) return;
  btn.onclick = () => openEditInsideOverlay(task);
}

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


// search handler
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

function debounce(fn, wait = 200) {
  let t;
  return ((...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  });
}

document.addEventListener("DOMContentLoaded", onBoardDomContentLoaded);
document.addEventListener("addtask:template-ready", () => {
  const btn = document.getElementById("edit-task-btn");
  if (btn && !btn.dataset.bound) {
    btn.addEventListener("click", onEditTaskBtnClick);
    btn.dataset.bound = "1";
  }
});