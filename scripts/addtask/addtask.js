

if (typeof window.selectedPriority === 'undefined') window.selectedPriority = 'medium';

function resetPrioritySelection() {
  document.querySelectorAll(".priority-button").forEach((btn) => btn.classList.remove("active"));
  window.selectedPriority = 'medium';
  const mediumButton = document.querySelector(".medium-button");
  if (mediumButton) mediumButton.classList.add("active");
  const mediumRadio = document.querySelector('input[name="priority"][value="medium"]');
  if (mediumRadio) mediumRadio.checked = true;
}

function bindOnce(el, type, handler, key) {
  if (!el) return;
  const mark = `bound-${type}-${key || ''}`.replace(/[^a-z0-9_-]/gi, '_');
  const attr = `data-${mark}`;
  if (el.getAttribute && el.getAttribute(attr) === '1') return;
  el.addEventListener(type, handler);
  if (el.setAttribute) el.setAttribute(attr, '1');
}

function bindAddTaskEvents() {
  bindPriorityButtons();
  bindAssignedToggle();
  bindCategorySelection();
  bindCategoryToggle();
  bindOutsideClosers();
  bindSubInputToggle();
  bindSubListHover();
  bindTitleInputClear();
  bindCancelButton();
  bindSubtaskAdd();
  bindSubInputEnter();
  bindSubClear();
  bindSubPlus();
  bindSubListSaveClick();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => document.addEventListener('addtask:template-ready', bindAddTaskEvents, { once: true }));
} else {
  document.addEventListener('addtask:template-ready', bindAddTaskEvents, { once: true });
}

document.addEventListener('pointerdown', (event) => {
  const target = (event.target);
  const editingItems = document.querySelectorAll('.subtask-item.editing');
  const hadEditing = editingItems.length > 0;
  editingItems.forEach((subtaskItem) => {
    if (!subtaskItem.contains(target)) {
      const saveBtn = subtaskItem.querySelector('.subtask-save-icon');
      if (saveBtn) window.saveEditedSubtask((saveBtn));
    }
  });
  if (!hadEditing) {
    const subInput = (document.getElementById('sub-input'));
    if (subInput && subInput.value.trim() && !subInput.contains(target)) {
      const funcBox = document.getElementById('subtask-func-btn');
      if (!funcBox || !funcBox.contains(target)) {
        document.getElementById('sub-check')?.click();
      }
    }
  }
}, true);

{ const el = $('overlay-add-task'); if (el) setupDropdownOutsideCloseIn(el); }
{ const el = $('task-overlay');     if (el) setupDropdownOutsideCloseIn(el); }

window.clearAddTask = function clearAddTask() {
  document.getElementById('cancel-button')?.click();
};


(function installClearOnOverlayClose(){
  const overlay = document.getElementById('overlay-add-task');
  if (!overlay) return;
  if (overlay.__clearOnCloseInstalled) return;
  const onClosed = () => clearAddTask();
  const mo = new MutationObserver(() => {
    if (overlay.classList.contains('d-none')) onClosed();
  });
  mo.observe(overlay, { attributes: true, attributeFilter: ['class'] });
  overlay.__clearOnCloseInstalled = true;
  overlay.addEventListener('addtask:closed', onClosed);
})();

const editWrapper = document.querySelector('#task-overlay .edit-addtask-wrapper');
if (editWrapper) setupDropdownOutsideCloseIn(editWrapper);

(function injectAddTaskTemplate() {
  const render = (root = document) => {
    const container = root.querySelector(".addtask-wrapper");
    if (!container) return false;
    if (container.dataset.rendered === "1" || container.childElementCount > 0)
      return true;
    container.innerHTML = getAddtaskTemplate();
    container.dataset.rendered = "1";
    document.dispatchEvent(new CustomEvent("addtask:template-ready"));
    return true;
  };
  if (!render()) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", render, { once: true });
    } else {
      render();
    }
  }
})();


function getAddtaskTemplate() {
  return `
    ${getTaskMainTemplate()}
    ${getPriorityTemplate()}
    ${getAssignedTemplate()}
    ${getCategoryTemplate()}
    ${getSubtasksTemplate()}
  `;
}


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
    category: (document.getElementById("category-select")?.querySelector("span")?.textContent) || "Select task category",
    priority: getSelectedPriority(),
    subtasks: subtasks.map((name) => ({ name, checked: false })),
  };
}

function finishCreateFlow() {
  setTimeout(() => {
    hideBanner();
    document.getElementById("cancel-button")?.click();
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

function collectFormData() {
  const base = baseTaskFromForm();
  return {
    ...base,
    assignedContacts: getAssignedContactsFromUI(),
    editingId: getEditingId(),
  };
}