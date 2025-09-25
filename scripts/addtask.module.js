let loadedContacts = {};
let currentEditingTaskId = "";
const FirebaseActions = (window.FirebaseActions ||= {});

// Safe `$` fallback if global helper isn't loaded yet
const $ = (typeof window.$ === 'function') ? window.$ : (id) => document.getElementById(id);

window.setCurrentEditingTaskId = function (id) {
  currentEditingTaskId = id || "";
  const wrapper = document.querySelector('.addtask-wrapper');
  if (wrapper) wrapper.dataset.editingId = currentEditingTaskId;
};

window.getCurrentEditingTaskId = function () {
  return currentEditingTaskId;
};

function getEditingId() {
  return (
    currentEditingTaskId ||
    (typeof window.getCurrentEditingTaskId === "function"
      ? window.getCurrentEditingTaskId()
      : "") ||
    document.querySelector(".addtask-wrapper")?.dataset.editingId ||
    ""
  );
}

function mapContact(id) {
  const c = loadedContacts[id] || {};
  const initials = c.initials || (c.name ? c.name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase() : "");
  return { id, name: c.name || String(id), colorIndex: c.colorIndex ?? 1, initials };
}

function getIdsFromDataset() {
  try {
    const raw = $("assigned-select-box")?.dataset.selected || "[]";
    const ids = JSON.parse(raw);
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
}

function getAssignedContactsFromUI() {
  const selectedLis = document.querySelectorAll("#contact-list-box li.selected");
  if (selectedLis.length > 0) return Array.from(selectedLis, li => mapContact(li.id));
  const ids = getIdsFromDataset();
  return ids.map(mapContact);
}

function bindDynamicElements() {
  const contactInput = $("contact-input");
  if (contactInput && !contactInput.dataset.bound) {
    contactInput.addEventListener("input", onContactInput);
    contactInput.dataset.bound = "1";
  }

  const createBtn = $("create-button");
  if (createBtn && !createBtn.dataset.bound) {
    createBtn.addEventListener("click", handleCreateClick);
    createBtn.dataset.bound = "1";
  }

  const okBtn = $("ok-button");
  if (okBtn && !okBtn.dataset.bound) {
    okBtn.addEventListener("click", handleEditOkClick);
    okBtn.dataset.bound = "1";
  }

  const editOkBtn = $("edit-ok-button");
  if (editOkBtn && !editOkBtn.dataset.bound) {
    editOkBtn.addEventListener("click", handleEditOkClick);
    editOkBtn.dataset.bound = "1";
  }
}

function maybeRenderContacts() {
  const box = $("contact-list-box");
  if (!box) return; // Template noch nicht da
  box.innerHTML = "";
  if (loadedContacts && Object.keys(loadedContacts).length) {
    renderContacts(loadedContacts, box);
  }
}

function baseTaskFromForm() {
  return {
    column: "todo",
    title: $("addtask-title").value.trim(),
    description: $("addtask-textarea").value.trim(),
    dueDate: $("datepicker").value.trim(),
    category: $("category-select").querySelector("span").textContent,
    priority: selectedPriority,
    subtasks: subtasks.map((name) => ({ name, checked: false })),
  };
}

function showBanner() {
  const overlay = $("overlay-bg");
  const banner = $("slide-in-banner");
  if (overlay) overlay.style.display = "block";
  if (banner) banner.classList.add("visible");
}

function hideBanner() {
  const overlay = $("overlay-bg");
  const banner = $("slide-in-banner");
  if (banner) banner.classList.remove("visible");
  if (overlay) overlay.style.display = "none";
}

function finishCreateFlow() {
  setTimeout(() => {
    hideBanner();
    $("cancel-button").click();
    if (!window.location.pathname.endsWith("board.html")) {
      window.location.href = "./board.html";
    }
  }, 1200);
}

function finishUpdateFlow() {
  setTimeout(() => {
    hideBanner();
    document.querySelector(".edit-addtask-wrapper")?.classList.add("d-none");
    document.getElementById("task-overlay-content")?.classList.remove("d-none");
    if (typeof window.hideOverlay === "function") window.hideOverlay();
    else if (!window.location.pathname.endsWith("board.html")) window.location.href = "./board.html";
  }, 900);
}

function resetFormErrors() {
  $("addtask-error").innerHTML = "";
  $("due-date-error").innerHTML = "";
  $("category-selection-error").innerHTML = "";
}

function setError(msgId, borderId, msg) {
  $(msgId).innerHTML = msg;
  if (borderId) $(borderId).style.borderColor = "var(--error-color)";
}

function onContactInput(e) {
  const value = String(e.target.value || "").trim().toLowerCase();
  const listBox = $("contact-list-box");
  listBox.classList.remove("d-none");
  const filtered = {};
  if (value.length === 0) {
    Object.assign(filtered, loadedContacts);
  } else {
    for (const id in loadedContacts) {
      const contact = loadedContacts[id];
      const nameParts = String(contact.name || "").trim().toLowerCase().split(" ");
      if (nameParts.some((part) => part.startsWith(value))) {
        filtered[id] = contact;
      }
    }
  }
  listBox.innerHTML = "";
  renderContacts(filtered, listBox);
}

function renderContacts(contacts, container) {
  for (const id in contacts) {
    const contact = contacts[id];
    const li = createContactListItem(contact, id);
    container.appendChild(li);
  }
}

function createContactListItem(contact, id) {
  let li = document.createElement("li");
  li.id = id;
  li.innerHTML = `
    <div>
      <div class="contact-initial" style="background-image: url(../assets/icons/contact/color${contact.colorIndex}.svg)">
        ${contact.initials}
      </div>
      ${contact.name}
    </div>
    <img src="./assets/icons/add_task/check_default.svg" alt="checkbox" />
  `;
  addContactListItemListener(li);
  return li;
}

function addContactListItemListener(li) {
  li.addEventListener("click", () => {
    li.classList.toggle("selected");
    let checkboxIcon = li.querySelector("img");
    let isSelected = li.classList.contains("selected");
    checkboxIcon.src = isSelected
      ? "./assets/icons/add_task/check_white.svg"
      : "./assets/icons/add_task/check_default.svg";
    renderSelectedContactInitials();
  });
}

function renderSelectedContactInitials() {
  let selectedLis = document.querySelectorAll("#contact-list-box li.selected");
  let contactInitialsBox = document.getElementById("contact-initials");
  contactInitialsBox.innerHTML = "";
  
  selectedLis.forEach((li) => {
    let initialsEl = li.querySelector(".contact-initial");
    if (initialsEl) {
      let clone = initialsEl.cloneNode(true);
      contactInitialsBox.appendChild(clone);
    }
  });
}

function collectFormData() {
  const base = baseTaskFromForm();
  return {
    ...base,
    assignedContacts: getAssignedContactsFromUI(),
    editingId: getEditingId(),
  };
}

function validateTitle(data) {
  if (!data.title) {
    setError("addtask-error", "addtask-title", "This field is required");
    return false;
  }
  return true;
}

function validateDueDate(data) {
  if (!data.dueDate) {
    setError("due-date-error", "datepicker-wrapper", "Please select a due date");
    return false;
  }
  return true;
}

function validateCategory(data) {
  if (data.category === "Select task category") {
    setError("category-selection-error", "category-select", "Please choose category");
    return false;
  }
  return true;
}

function validatePriority(data) {
  return !!data.priority;
}

function validateFormData(data) {
  resetFormErrors();
  let ok = true;
  ok = validateTitle(data) && ok;
  ok = validateDueDate(data) && ok;
  ok = validateCategory(data) && ok;
  ok = validatePriority(data) && ok;
  return ok;
}

async function handleEditOkClick() {
  const taskData = collectFormData();
  if (!validateFormData(taskData)) return;
  const taskId = getEditingId();
  if (!taskId) return sendTaskToFirebase(taskData);
  try {
    if (typeof FirebaseActions.loadTaskById === "function") {
      const oldTask = await FirebaseActions.loadTaskById(taskId);
      if (oldTask) taskData.column = oldTask.column ?? taskData.column;
    }
  } catch (e) { console.warn("Konnte alten Task nicht laden:", e); }
  updateTaskInFirebase(taskId, taskData);
}
window.handleEditOkClick = handleEditOkClick;

function handleCreateClick() {
  const data = collectFormData();
  if (!validateFormData(data)) return;
  sendTaskToFirebase(data);
  if (!window.location.pathname.endsWith("addtask.html")) window.toggleAddTaskBoard();
}

function sendTaskToFirebase(taskData) {
  if (typeof FirebaseActions.createTask !== "function") {
    return console.error("FirebaseActions.createTask ist nicht verfügbar");
  }
  FirebaseActions.createTask(taskData)
    .then(() => { showBanner(); finishCreateFlow(); })
    .catch((e) => console.error("Fehler beim Speichern:", e));
}

function updateTaskInFirebase(taskId, taskData) {
  const toSave = {
    column: taskData.column,
    title: taskData.title,
    description: taskData.description,
    dueDate: taskData.dueDate,
    category: taskData.category,
    priority: taskData.priority,
    assignedContacts: taskData.assignedContacts,
    subtasks: taskData.subtasks,
    updatedAt: new Date().toISOString(),
  };
  if (typeof FirebaseActions.updateTask !== "function") {
    return console.error("FirebaseActions.updateTask ist nicht verfügbar");
  }
  FirebaseActions.updateTask(taskId, toSave)
    .then(() => { showBanner(); finishUpdateFlow(); })
    .catch((e) => console.error("Fehler beim Aktualisieren:", e));
}

(function loadContactsAndRender() {
  const fetchContacts = () => {
    if (typeof FirebaseActions.fetchContacts === "function") {
      FirebaseActions.fetchContacts()
        .then((contacts) => {
          loadedContacts = contacts || {};
          maybeRenderContacts();
        })
        .catch((e) => console.error("Fehler beim Laden der Kontakte:", e));
    } else {
      console.warn("FirebaseActions.fetchContacts ist nicht verfügbar (firebase.module.js geladen?)");
    }
  };

  const init = () => {
    bindDynamicElements();
    maybeRenderContacts();
    // Falls noch nicht geladen, laden
    if (!loadedContacts || !Object.keys(loadedContacts).length) fetchContacts();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  // Nachträgliches Einfügen des Templates abfangen
  document.addEventListener("addtask:template-ready", () => {
    bindDynamicElements();
    maybeRenderContacts();
  });
})();