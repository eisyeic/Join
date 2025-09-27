window.subtasks = Array.isArray(window.subtasks) ? window.subtasks : []; 
let subtasks = window.subtasks; 
window.SubtaskIO = window.SubtaskIO || {
  set(index, value) { subtasks[index] = value; },
  remove(index) { subtasks.splice(index, 1); },
  rerender() { renderSubtasks(); }
};

window.selectedPriority = typeof window.selectedPriority === 'string' ? window.selectedPriority : 'medium';

function bindDatepickerClick(){
  const el = $("datepicker-wrapper");
  if (!el) return; 
  if (el.dataset && el.dataset.dpBound === '1') return;
  el.addEventListener("click", () => {
    document.querySelector("#datepicker")?.click();
    $("datepicker-wrapper").style.borderColor = '';
    $("due-date-error").innerHTML = '';
  });
  if (el.dataset) el.dataset.dpBound = '1';
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bindDatepickerClick, { once: true });
} else {
  bindDatepickerClick();
}

document.addEventListener('addtask:template-ready', bindDatepickerClick);


function resetPrioritySelection() {
  document.querySelectorAll(".priority-button").forEach((btn) => btn.classList.remove("active"));
  selectedPriority = ("medium");
  const mediumButton = document.querySelector(".medium-button");
  if (mediumButton) mediumButton.classList.add("active");
}

function bindAddTaskEvents() {
  const on = (el, type, handler, key) => {
    if (!el) return;
    const mark = `bound-${type}-${key || ''}`.replace(/[^a-z0-9_-]/gi, '_');
    const attr = `data-${mark}`;
    if (el.getAttribute(attr) === '1') return; 
    el.addEventListener(type, handler);
    el.setAttribute(attr, '1');
  };

  // Priority buttons
  document.querySelectorAll('.priority-button').forEach((button) => {
    const handler = () => {
      document.querySelectorAll('.priority-button').forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      window.selectedPriority =
        button.classList.contains('urgent-button') ? 'urgent' :
        button.classList.contains('medium-button') ? 'medium' : 'low';
    };
    button.addEventListener('click', handler);
  });

  // Assigned dropdown toggle
  on($("assigned-select-box"), 'click', () => {
    const list = $("contact-list-box");
    if (!list) return;
    list.classList.toggle('d-none');
    const isListVisible = !list.classList.contains('d-none');
    $("assigned-icon")?.classList.toggle('arrow-up', isListVisible);
    $("assigned-icon")?.classList.toggle('arrow-down', !isListVisible);
    const initialsBox = document.querySelector('.contact-initials');
    if (isListVisible) {
      initialsBox?.classList.add('d-none');
    } else {
      const selectedContacts = list.querySelectorAll('li.selected');
      if (selectedContacts.length > 0) initialsBox?.classList.remove('d-none');
      else initialsBox?.classList.add('d-none');
      if (typeof applyAssignedInitialsCap === 'function') applyAssignedInitialsCap();
    }
  }, 'assigned');

  // Category list selection
  const catPanel = $("category-selection");
  if (catPanel) {
    catPanel.querySelectorAll('li').forEach((item) => {
      const handler = () => {
        const value = item.getAttribute('data-value') ?? '';
        const span = $("category-select")?.querySelector('span');
        if (span) span.textContent = value;
        catPanel.classList.add('d-none');
        $("category-icon")?.classList.remove('arrow-up');
        $("category-icon")?.classList.add('arrow-down');
        const cs = $("category-select"); if (cs) cs.style.borderColor = '';
        $("category-selection-error") && ($("category-selection-error").innerHTML = '');
      };
      item.addEventListener('click', handler);
    });
  }

  // Category select toggle
  on($("category-select"), 'click', () => {
    const panel = $("category-selection");
    const icon = $("category-icon");
    if (!panel || !icon) return;
    panel.classList.toggle('d-none');
    icon.classList.toggle('arrow-down');
    icon.classList.toggle('arrow-up');
  }, 'category');

  // Outside closers
  const outsideHandler = (event) => {
    const t = event.target;
    const catSel = $("category-select"), catPanel2 = $("category-selection");
    if (catSel && catPanel2) {
      const inCat = catSel.contains(t) || catPanel2.contains(t);
      if (!inCat) {
        catPanel2.classList.add('d-none');
        $("category-icon")?.classList.remove('arrow-up');
        $("category-icon")?.classList.add('arrow-down');
      }
    }
    const asSel = $("assigned-select-box"), asList = $("contact-list-box");
    if (asSel && asList) {
      const inAs = asSel.contains(t) || asList.contains(t);
      if (!inAs) {
        asList.classList.add('d-none');
        if (typeof applyAssignedInitialsCap === 'function') applyAssignedInitialsCap();
        const selected = document.querySelectorAll('#contact-list-box li.selected');
        const initialsBox = document.querySelector('.contact-initials');
        if (initialsBox) initialsBox.classList.toggle('d-none', selected.length === 0);
        $("assigned-icon")?.classList.remove('arrow-up');
        $("assigned-icon")?.classList.add('arrow-down');
      }
    }
  };
  document.removeEventListener('click', outsideHandler);
  document.addEventListener('click', outsideHandler);

  // Subtask input toggles
  on($("sub-input"), 'input', function () {
    const plus = $("subtask-plus-box");
    const func = $("subtask-func-btn");
    if (!plus || !func) return;
    if (this.value !== '') { plus.classList.add('d-none'); func.classList.remove('d-none'); }
    else { plus.classList.remove('d-none'); func.classList.add('d-none'); }
  }, 'sub-input');

  // Hover show/hide subtask func buttons
  const subList = $("subtask-list");
  on(subList, 'mouseover', (event) => {
    const item = event.target.closest('.subtask-item');
    item?.querySelector('.subtask-func-btn')?.classList.remove('d-none');
  }, 'sub-hover');
  on(subList, 'mouseout', (event) => {
    const item = event.target.closest('.subtask-item');
    item?.querySelector('.subtask-func-btn')?.classList.add('d-none');
  }, 'sub-out');

  // Title input (clear error)
  on($("addtask-title"), 'input', function () {
    this.style.borderColor = '';
    $("addtask-error") && ($("addtask-error").innerHTML = '');
  }, 'title');

  // Cancel button
  on($("cancel-button"), 'click', () => {
    $("addtask-title").value = '';
    $("addtask-title").style.borderColor = '';
    $("addtask-error").innerHTML = '';
    $("addtask-textarea").value = '';
    try { picker.clear(); } catch { $("datepicker").value = ''; }
    $("datepicker-wrapper").style.borderColor = '';
    $("due-date-error").innerHTML = '';
    $("category-select").querySelector('span').textContent = 'Select task category';
    $("category-select").style.borderColor = '';
    $("category-selection-error").innerHTML = '';
    subtasks.length = 0;
    $("sub-input").value = '';
    $("subtask-func-btn").classList.add('d-none');
    $("subtask-plus-box").classList.remove('d-none');
    renderSubtasks();
    clearAssignedContacts();
    const asb = $("assigned-select-box"); if (asb) asb.dataset.selected = '[]';
    $("contact-list-box").classList.add('d-none');
    resetPrioritySelection();
  }, 'cancel');

  // Subtask actions
  on($("sub-check"), 'click', () => {
    const subtaskText = $("sub-input")?.value.trim();
    if (!subtaskText) return;
    subtasks.push(subtaskText);
    $("sub-input").value = '';
    $("subtask-func-btn").classList.add('d-none');
    $("subtask-plus-box").classList.remove('d-none');
    renderSubtasks();
  }, 'subcheck');

  on($("sub-input"), 'keydown', function (event) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const subtaskText = this.value.trim();
    if (!subtaskText) return;
    subtasks.push(subtaskText);
    this.value = '';
    $("subtask-func-btn").classList.add('d-none');
    $("subtask-plus-box").classList.remove('d-none');
    renderSubtasks();
  }, 'subenter');

  on($("sub-clear"), 'click', () => {
    $("sub-input").value = '';
    $("subtask-func-btn").classList.add('d-none');
    $("subtask-plus-box").classList.remove('d-none');
  }, 'subclear');

  on($("sub-plus"), 'click', () => {
    if (subtasks.length === 0) {
      $("sub-input").value = 'Contact Form';
      $("subtask-plus-box").classList.add('d-none');
      $("subtask-func-btn").classList.remove('d-none');
    }
  }, 'subplus');

  on($("subtask-list"), 'click', (event) => {
    if (event.target.classList?.contains('subtask-save-icon')) {
      saveEditedSubtask((event.target));
    }
  }, 'sublist');
}

// Bind everything once the template is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => document.addEventListener('addtask:template-ready', bindAddTaskEvents, { once: true }));
} else {
  document.addEventListener('addtask:template-ready', bindAddTaskEvents, { once: true });
}

const contactInitialsBox = document.querySelector(".contact-initials"); 
const MAX_VISIBLE_INITIALS = 3;
function applyAssignedInitialsCap() {
  // Cap all current initials containers consistently
  applyCapToAllInitials(MAX_VISIBLE_INITIALS);
}

window.applyAssignedInitialsCap = applyAssignedInitialsCap;



function handleCategoryClickOutside(event) {
  const target = /** @type {Node} */ (event.target);
  const isInsideCategory = $("category-select").contains(target) || $("category-selection").contains(target);
  if (!isInsideCategory) {
    $("category-selection").classList.add("d-none");
    $("category-icon").classList.remove("arrow-up");
    $("category-icon").classList.add("arrow-down");
  }
}

function handleAssignedClickOutside(event) {
  const target = /** @type {Node} */ (event.target);
  const isInsideAssigned = $("assigned-select-box").contains(target) || $("contact-list-box").contains(target);
  if (!isInsideAssigned) {
    $("contact-list-box").classList.add("d-none");
    applyAssignedInitialsCap();
    const selectedContacts = document.querySelectorAll("#contact-list-box li.selected");
    if (selectedContacts.length > 0) {
      contactInitialsBox?.classList.remove("d-none");
    } else {
      contactInitialsBox?.classList.add("d-none");
    }
    $("assigned-icon").classList.remove("arrow-up");
    $("assigned-icon").classList.add("arrow-down");
  }
}


function clearAssignedContacts() {
  document.querySelectorAll("#contact-list-box li.selected").forEach((li) => {
    li.classList.remove("selected");
    const checkboxIcon = li.querySelectorAll("img")[0];
    if (checkboxIcon) checkboxIcon.src = "./assets/icons/add_task/check_default.svg";
  });
  contactInitialsBox?.classList.add("d-none");
  if (contactInitialsBox) contactInitialsBox.innerHTML = "";
}

function addEditEvents() {
  document.querySelectorAll(".subtask-edit-icon").forEach((editBtn) => {
    editBtn.addEventListener("click", () => enterEditMode(editBtn));
  });
}
window.addEditEvents = addEditEvents;

function enterEditMode(editBtn) {
  const item = editBtn.closest(".subtask-item");
  const input = item?.querySelector(".subtask-edit-input");
  if (!item || !input) return;
  showEditFields(item, (input));
  setupEnterKeyToSave((input), item);
}
window.enterEditMode = enterEditMode;

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
  const handler = (e) => {
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
        addEditEvents();
      }
    });
  });
}


function saveEditedSubtask(saveBtn) {
  const item = saveBtn.closest(".subtask-item");
  if (!item) return;
  const index = Number(item.getAttribute("data-index"));
  const input = item.querySelector(".subtask-edit-input");
  if (!Number.isFinite(index) || !input) return;
  const newValue = (input).value.trim();
  if (!newValue) {
    subtasks.splice(index, 1);
  } else {
    subtasks[index] = newValue;
  }
  renderSubtasks();
  addEditEvents();
}
window.saveEditedSubtask = saveEditedSubtask;


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

(function injectAddTaskTemplate() {
  const render = () => {
    const tpl = document.getElementById("addtask-template");
    if (!tpl || !(tpl instanceof HTMLTemplateElement)) return false;
    tpl.innerHTML = getAddtaskTemplate();
    const frag = tpl.content.cloneNode(true);
    tpl.replaceWith(frag);
    document.dispatchEvent(new CustomEvent("addtask:template-ready"));
    return true;
  };
  if (!render()) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", render);
    } else {
      render();
    }
  }
})();

function capAssignedInitialsIn(container, max = 5) {
  if (!container) return;
  const chips = Array.from(container.children).filter(el => el.nodeType === 1 && el.getAttribute('data-plus-badge') !== 'true');
  chips.forEach(el => el.classList.remove('d-none'));
  let plus = container.querySelector('[data-plus-badge="true"]');
  if (chips.length <= max) {
    plus?.remove();
    return;
  }
  for (let i = max; i < chips.length; i++) chips[i].classList.add('d-none');
  if (!plus) {
    plus = document.createElement('div');
    plus.setAttribute('data-plus-badge', 'true');
    plus.className = 'assigned-plus-badge';
  }
  plus.textContent = `+${chips.length - max}`;
  container.appendChild(plus);
}

function applyCapToAllInitials(max = 5) {
  document.querySelectorAll('.contact-initials').forEach(box => capAssignedInitialsIn(box, max));
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => applyCapToAllInitials(MAX_VISIBLE_INITIALS));
} else {
  applyCapToAllInitials(MAX_VISIBLE_INITIALS);
}

(function observeInitials() {
  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; applyCapToAllInitials(MAX_VISIBLE_INITIALS); });
  };
  const obs = new MutationObserver(records => {
    for (const r of records) {
      if (r.type !== 'childList') continue;
      if ([...r.addedNodes].some(n => n.nodeType === 1 && (n.matches?.('.contact-initials') || n.querySelector?.('.contact-initials')))) {
        schedule();
        break;
      }
    }
  });
  obs.observe(document.documentElement, { childList: true, subtree: true });
})();

function closeCategoryDropdown(scope) {
  const panel = scope.querySelector('#category-selection');
  const icon = scope.querySelector('#category-icon');
  if (panel) panel.classList.add('d-none');
  if (icon) {
    icon.classList.remove('arrow-up');
    icon.classList.add('arrow-down');
  }
}

function closeAssignedDropdown(scope) {
  const list = scope.querySelector('#contact-list-box');
  const icon = scope.querySelector('#assigned-icon');
  if (list) list.classList.add('d-none');
  if (typeof applyAssignedInitialsCap === 'function') applyAssignedInitialsCap();
  const initialsBox = scope.querySelector('#contact-initials');
  if (initialsBox) {
    const selected = scope.querySelectorAll('#contact-list-box li.selected');
    initialsBox.classList.toggle('d-none', selected.length === 0);
  }
  if (icon) {
    icon.classList.remove('arrow-up');
    icon.classList.add('arrow-down');
  }
}


function setupDropdownOutsideCloseIn(container) {
  if (!container || container.dataset.outsideCloserAttached === '1') return;
  const onClickCapture = (e) => {
    const t = e.target;
    if (!container.contains(t)) return;
    const catSelect = container.querySelector('#category-select'), catPanel = container.querySelector('#category-selection'), asSelect = container.querySelector('#assigned-select-box'), asList = container.querySelector('#contact-list-box');
    const inCat = (catSelect && catSelect.contains(t)) || (catPanel && catPanel.contains(t)), inAs = (asSelect && asSelect.contains(t)) || (asList && asList.contains(t));
    if ((catSelect || catPanel) && !inCat) closeCategoryDropdown(container);
    if ((asSelect || asList) && !inAs) closeAssignedDropdown(container);
  };
  container.addEventListener('click', onClickCapture, { capture: true });
  container.dataset.outsideCloserAttached = '1';
}

function handleSubtaskClickOutside(event, editMode = false) {
  const scope = event.currentTarget || document;
  const subZone = scope.querySelector('.subtask-select');
  if (subZone && subZone.contains(event.target)) return;
  const input = scope.querySelector('#sub-input');
  if (!editMode && input && input.value.trim()) {
    if (typeof window.addSubtask === 'function') window.addSubtask(input.value.trim());
    input.value = '';
  }
  const func = scope.querySelector('#subtask-func-btn');
  const plus = scope.querySelector('#subtask-plus-box');
  if (func) func.classList.add('d-none');
  if (plus) plus.classList.remove('d-none');
  if (input) input.blur();
}

setupDropdownOutsideCloseIn($('overlay-add-task'));

setupDropdownOutsideCloseIn($('task-overlay'));

// Minimal clear: reuse existing Cancel logic
function clearAddTask() {
  document.getElementById('cancel-button')?.click();
}
window.clearAddTask = clearAddTask;

// Run clear when Add Task overlay gets hidden
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
  // Optional: support a custom close event
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


/**
 * Render the editable subtasks list (titles only).
 * Accepts `window.subtasks` or a global `subtasks` and normalizes to string[].
 * Calls external helpers `addEditEvents()` and `deleteEvent()`.
 * @returns {void}
 */
function renderSubtasks() {
  const normalized = (
    window.subtasks || typeof subtasks !== "undefined"
      ? window.subtasks || subtasks
      : []
  )
    .map((st) => (typeof st === "string" ? st : st && st.name ? st.name : ""))
    .filter(Boolean);

  try {
    subtasks = normalized;
  } catch (_) {}
  window.subtasks = normalized;

  $("subtask-list").innerHTML = normalized
    .map((subtask, index) => getSubtaskItemTemplate(subtask, index))
    .join("");
  addEditEvents();
  deleteEvent();
}


function getAddtaskTemplate() {
  return `
    ${getTaskMainTemplate()}
    ${getPriorityTemplate()}
    ${getAssignedTemplate()}
    ${getCategoryTemplate()}
    ${getSubtasksTemplate()}
  `;
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