function normalizeSubtasks(input) {
  if (!input || typeof input === "undefined") return [];
  return input
    .map((st) => (typeof st === "string" ? st : st && st.name ? st.name : ""))
    .filter(Boolean);
}

function renderSubtaskList(list) {
  document.getElementById("subtask-list").innerHTML = list
    .map((subtask, index) => getSubtaskItemTemplate(subtask, index))
    .join("");
}

function renderSubtasks() {
  let normalized = normalizeSubtasks(subtasks);
  subtasks = normalized;
  renderSubtaskList(normalized);
  addEditEvents();
  deleteEvent();
}

function addEditEvents() {
  document.querySelectorAll(".subtask-edit-icon").forEach((editBtn) => {
    editBtn.addEventListener("click", () => enterEditMode(editBtn));
  });
}

function enterEditMode(editBtn) {
  let item = editBtn.closest(".subtask-item");
  let input = item?.querySelector(".subtask-edit-input");
  if (!item || !input) return;
  showEditFields(item, (input));
  setupEnterKeyToSave((input), item);
}

function showEditFields(item, input) {
  item.querySelector(".subtask-text")?.classList.add("d-none");
  input.classList.remove("d-none");
  input.classList.add("active");
  input.focus();
  input.select();
  item.classList.add("editing");
  item.querySelector(".first-spacer")?.classList.add("d-none");
  item.querySelector(".second-spacer")?.classList.remove("d-none");
  item.querySelector(".subtask-edit-icon")?.classList.add("d-none");
  item.querySelector(".subtask-save-icon")?.classList.remove("d-none");
}

function setupEnterKeyToSave(input, item) {
  let handler = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const saveBtn = item.querySelector(".subtask-save-icon");
      if (saveBtn) saveEditedSubtask((saveBtn));
      input.removeEventListener("keydown", handler);
    }
  };
  input.addEventListener("keydown", handler);
}

function deleteEvent() {
  document.querySelectorAll(".subtask-delete-icon").forEach((deleteBtn) => {
    deleteBtn.addEventListener("click", () => {
      const item = deleteBtn.closest(".subtask-item");
      if (!item) return;
      const index = Number(item.getAttribute("data-index"));
      if (Number.isFinite(index)) {
        subtasks.splice(index, 1);
        renderSubtasks();
      }
    });
  });
}

function saveEditedSubtask(saveBtn) {
  let item = saveBtn.closest(".subtask-item");
  if (!item) return;
  let index = Number(item.getAttribute("data-index"));
  let input = item.querySelector(".subtask-edit-input");
  if (!Number.isFinite(index) || !input) return;
  let newValue = (input).value.trim();
  if (!newValue) {
    subtasks.splice(index, 1);
  } else {
    subtasks[index] = newValue;
  }
  renderSubtasks();
}

window.subtasks = Array.isArray(window.subtasks) ? window.subtasks : []; 
let subtasks = window.subtasks; 
window.SubtaskIO = window.SubtaskIO || {
  set(index, value) { subtasks[index] = value; },
  remove(index) { subtasks.splice(index, 1); },
  rerender() { renderSubtasks(); }
};