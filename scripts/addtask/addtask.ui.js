let currentEditingTaskId = "";

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

let loadedContacts = {};

document.addEventListener('addtask:contacts-loaded', (e) => {
  loadedContacts = (e?.detail && e.detail.contacts) || {};
  try { maybeRenderContacts(); } catch {}
});

function getIdsFromDataset() {
  try {
    const raw = document.getElementById("assigned-select-box")?.dataset.selected || "[]";
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
  const contactInput = document.getElementById("contact-input");
  if (contactInput && !contactInput.dataset.bound) {
    contactInput.addEventListener("input", onContactInput);
    contactInput.dataset.bound = "1";
  }

  const createBtn = document.getElementById("create-button");
  if (createBtn && !createBtn.dataset.bound) {
    createBtn.addEventListener("click", handleCreateClick);
    createBtn.dataset.bound = "1";
  }

  const okBtn = document.getElementById("ok-button");
  if (okBtn && !okBtn.dataset.bound) {
    okBtn.addEventListener("click", handleEditOkClick);
    okBtn.dataset.bound = "1";
  }

  const editOkBtn = document.getElementById("edit-ok-button");
  if (editOkBtn && !editOkBtn.dataset.bound) {
    editOkBtn.addEventListener("click", handleEditOkClick);
    editOkBtn.dataset.bound = "1";
  }
}

function maybeRenderContacts() {
  const box = document.getElementById('contact-list-box');
  if (!box) return;
  box.innerHTML = '';
  const data = loadedContacts || {};
  if (Object.keys(data).length) {
    renderContacts(data, box);
  }
}

function onContactInput(e) {
  const value = String(e.target.value || "").trim().toLowerCase();
  const listBox = document.getElementById("contact-list-box");
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

const PRIORITY_DEFAULT = "medium";

function getSelectedPriority() {
  try {
    if (typeof window.selectedPriority === 'function') return window.selectedPriority();
    if (typeof window.selectedPriority === 'string' && window.selectedPriority) return window.selectedPriority;
  } catch {}
  const checked = document.querySelector('input[name="priority"]:checked');
  if (checked && checked.value) return String(checked.value).toLowerCase();
  const activeBtn = document.querySelector('.priority-btn.active, .priority-button.active');
  if (activeBtn) {
    const v = (activeBtn.dataset.priority || activeBtn.getAttribute('data-priority') || '').toLowerCase();
    if (v) return v;
  }
  return PRIORITY_DEFAULT;
}

function baseTaskFromForm() {
  return {
    column: "todo",
    title: document.getElementById("addtask-title").value.trim(),
    description: document.getElementById("addtask-textarea").value.trim(),
    dueDate: document.getElementById("datepicker").value.trim(),
    category: document.getElementById("category-select").querySelector("span").textContent,
    priority: getSelectedPriority(),
    subtasks: subtasks.map((name) => ({ name, checked: false })),
  };
}

function finishCreateFlow() {
  setTimeout(() => {
    hideBanner();
    document.getElementById("cancel-button").click();
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
  document.getElementById("addtask-error").innerHTML = "";
  document.getElementById("due-date-error").innerHTML = "";
  document.getElementById("category-selection-error").innerHTML = "";
}

function setError(msgId, borderId, msg) {
  document.getElementById(msgId).innerHTML = msg;
  if (borderId) document.getElementById(borderId).style.borderColor = "var(--error-color)";
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









(function loadContactsAndRender() {
  let bootstrapped = false;

  function uiAvailable() {
    return !!document.getElementById('contact-list-box');
  }

  function init() {
    if (!uiAvailable()) return;
    if (bootstrapped) return;
    bootstrapped = true;

    bindDynamicElements();
    maybeRenderContacts();

    if (!loadedContacts || !Object.keys(loadedContacts).length) {
      const api = window.FirebaseActions;
      const loader = api && typeof api.fetchContacts === 'function'
        ? api.fetchContacts()
        : Promise.resolve({});
      loader
        .then((contacts) => {
          loadedContacts = contacts || {};
          maybeRenderContacts();
        })
        .catch((e) => console.error('Fehler beim Laden der Kontakte:', e));
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
  document.addEventListener('addtask:template-ready', init);
})();
