/* eslint-disable no-undef */
/**
 * @file Add-Task UI interactions: datepicker, priorities, categories, assigned contacts dropdown, and subtask CRUD. JSDoc-annotated only.
 *
 * Expected globals:
 *  - $: (id: string) => HTMLElement
 *  - renderSubtasks: () => void
 *  - flatpickr
 */
 /** @type {string[]} */ 
window.subtasks = Array.isArray(window.subtasks) ? window.subtasks : []; 
let subtasks = window.subtasks; 
window.SubtaskIO = window.SubtaskIO || {
  set(index, value) { subtasks[index] = value; },
  remove(index) { subtasks.splice(index, 1); },
  rerender() { renderSubtasks(); addEditEvents(); }
};

/** @typedef {'urgent' | 'medium' | 'low'} Priority */
/** @type {Priority} */ 
let selectedPriority = "medium";
/**
 * Initialize flatpickr on #datepicker.
 * @see https://flatpickr.js.org/events/
 */
let picker = flatpickr("#datepicker", {
  minDate: "today",
  dateFormat: "d/m/Y",
  onChange(selectedDates, dateStr) {
    if (selectedDates && selectedDates.length > 0 && dateStr) {
      $("datepicker-wrapper").style.borderColor = "";
      $("due-date-error").innerHTML = "";
    }
  },
});

/**
 * Open the native datepicker by clicking the wrapper.
 */
$("datepicker-wrapper").addEventListener("click", () => {
  document.querySelector("#datepicker")?.click();
});

/**
 * Priority buttons: set active state and update `selectedPriority`.
 */
document.querySelectorAll(".priority-button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".priority-button").forEach((btn) => {
      btn.classList.remove("active");
    });
    button.classList.add("active");
    selectedPriority = button.classList.contains("urgent-button") ? "urgent" : button.classList.contains("medium-button") ? "medium" : "low";
  });
});

/**
 * Reset the entire Add-Task form priority to "medium".
 */
function resetPrioritySelection() {
  document.querySelectorAll(".priority-button").forEach((btn) => btn.classList.remove("active"));
  selectedPriority = /** @type {Priority} */ ("medium");
  const mediumButton = document.querySelector(".medium-button");
  if (mediumButton) mediumButton.classList.add("active");
}

const contactInitialsBox = document.querySelector(".contact-initials"); 
const MAX_VISIBLE_INITIALS = 3;
function applyAssignedInitialsCap() {
  capAssignedInitialsIn(contactInitialsBox, MAX_VISIBLE_INITIALS);
}

window.applyAssignedInitialsCap = applyAssignedInitialsCap;

$("assigned-select-box").addEventListener("click", () => {
  $("contact-list-box").classList.toggle("d-none");
  const isListVisible = !$("contact-list-box").classList.contains("d-none");
  $("assigned-icon").classList.toggle("arrow-up", isListVisible);
  $("assigned-icon").classList.toggle("arrow-down", !isListVisible);
  if (isListVisible) {
    contactInitialsBox?.classList.add("d-none");
  } else {
    const selectedContacts = $("contact-list-box").querySelectorAll("li.selected");
    if (selectedContacts.length > 0) {
      contactInitialsBox?.classList.remove("d-none");
    } else {
      contactInitialsBox?.classList.add("d-none");
    }
    applyAssignedInitialsCap();
  }
});

/**
 * Handle category option clicks and update the select label.
 */
$("category-selection").querySelectorAll("li").forEach((item) => {
  item.addEventListener("click", () => {
    const value = item.getAttribute("data-value") ?? "";
    $("category-select").querySelector("span").textContent = value;
    $("category-selection").classList.add("d-none");
    $("category-icon").classList.remove("arrow-up");
    $("category-icon").classList.add("arrow-down");
    $("category-select").style.borderColor = "";
    $("category-selection-error").innerHTML = "";
  });
});

/**
 * Global click: close dropdowns if clicking outside their areas.
 * @param {MouseEvent} event
 */
document.addEventListener("click", (event) => {
  handleCategoryClickOutside(event);
  handleAssignedClickOutside(event);
});

/**
 * Close category dropdown if the click was outside category elements.
 * @param {MouseEvent} event
 */
function handleCategoryClickOutside(event) {
  const target = /** @type {Node} */ (event.target);
  const isInsideCategory = $("category-select").contains(target) || $("category-selection").contains(target);
  if (!isInsideCategory) {
    $("category-selection").classList.add("d-none");
    $("category-icon").classList.remove("arrow-up");
    $("category-icon").classList.add("arrow-down");
  }
}

/**
 * Close assigned contacts dropdown if the click was outside assigned elements.
 * @param {MouseEvent} event
 */
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


/**
 * Toggle the category dropdown when clicking the select.
 */
$("category-select").addEventListener("click", () => {
  $("category-selection").classList.toggle("d-none");
  $("category-icon").classList.toggle("arrow-down");
  $("category-icon").classList.toggle("arrow-up");
});

/**
 * Toggle subtask input action buttons based on content presence.
 */
$("sub-input").addEventListener("input", function () {
  if (this.value !== "") {
    $("subtask-plus-box").classList.add("d-none");
    $("subtask-func-btn").classList.remove("d-none");
  } else {
    $("subtask-plus-box").classList.remove("d-none");
    $("subtask-func-btn").classList.add("d-none");
  }
});

/**
 * Reveal subtask controls on hover.
 */
$("subtask-list").addEventListener("mouseover", (event) => {
  const item = event.target.closest(".subtask-item");
  item?.querySelector(".subtask-func-btn")?.classList.remove("d-none");
});

/**
 * Hide subtask controls when leaving the item.
 */
$("subtask-list").addEventListener("mouseout", (event) => {
  const item = event.target.closest(".subtask-item");
  item?.querySelector(".subtask-func-btn")?.classList.add("d-none");
});

/**
 * Clear title error styles on user input.
 */
$("addtask-title").addEventListener("input", function () {
  this.style.borderColor = "";
  $("addtask-error").innerHTML = "";
});

/**
 * Reset the entire Add Task form to defaults.
 */
$("cancel-button").addEventListener("click", () => {
  $("addtask-title").value = "";
  $("addtask-title").style.borderColor = "";
  $("addtask-error").innerHTML = "";
  $("addtask-textarea").value = "";
  try { picker.clear(); } catch { $("datepicker").value = ""; }
  $("datepicker-wrapper").style.borderColor = "";
  $("due-date-error").innerHTML = "";
  $("category-select").querySelector("span").textContent = "Select task category";
  $("category-select").style.borderColor = "";
  $("category-selection-error").innerHTML = "";
  subtasks.length = 0;
  $("sub-input").value = "";
  $("subtask-func-btn").classList.add("d-none");
  $("subtask-plus-box").classList.remove("d-none");
  renderSubtasks();
  clearAssignedContacts();
  const asb = $("assigned-select-box");
  if (asb) asb.dataset.selected = "[]";
  $("contact-list-box").classList.add("d-none");
  resetPrioritySelection();
});

/**
 * Remove all selected contacts and clear the initials box.
 */
function clearAssignedContacts() {
  document.querySelectorAll("#contact-list-box li.selected").forEach((li) => {
    li.classList.remove("selected");
    const checkboxIcon = li.querySelectorAll("img")[0];
    if (checkboxIcon) checkboxIcon.src = "./assets/icons/add_task/check_default.svg";
  });
  contactInitialsBox?.classList.add("d-none");
  if (contactInitialsBox) contactInitialsBox.innerHTML = "";
}

/**
 * Attach edit click listeners for all subtask edit icons.
 */
function addEditEvents() {
  document.querySelectorAll(".subtask-edit-icon").forEach((editBtn) => {
    editBtn.addEventListener("click", () => enterEditMode(editBtn));
  });
}
window.addEditEvents = addEditEvents;

/**
 * Put a subtask item into edit mode and bind Enter-to-save.
 * @param {HTMLElement} editBtn
 */
function enterEditMode(editBtn) {
  const item = editBtn.closest(".subtask-item");
  const input = item?.querySelector(".subtask-edit-input");
  if (!item || !input) return;
  showEditFields(item, /** @type {HTMLInputElement} */ (input));
  setupEnterKeyToSave(/** @type {HTMLInputElement} */ (input), item);
}
window.enterEditMode = enterEditMode;

/**
 * Reveal edit input fields of a subtask item and focus the input.
 * @param {HTMLElement} item
 * @param {HTMLInputElement} input
 */
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

/**
 * Bind Enter key to save subtask edit.
 * @param {HTMLInputElement} input
 * @param {HTMLElement} item
 */
function setupEnterKeyToSave(input, item) {
  const handler = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const saveBtn = item.querySelector(".subtask-save-icon");
      if (saveBtn) saveEditedSubtask(/** @type {HTMLElement} */ (saveBtn));
      input.removeEventListener("keydown", handler);
    }
  };
  input.addEventListener("keydown", handler);
}

/**
 * Add a subtask via the check icon.
 */
$("sub-check").addEventListener("click", () => {
  const subtaskText = $("sub-input").value.trim();
  if (!subtaskText) return;
  subtasks.push(subtaskText);
  $("sub-input").value = "";
  $("subtask-func-btn").classList.add("d-none");
  $("subtask-plus-box").classList.remove("d-none");
  renderSubtasks();
});

/**
 * Add a subtask when pressing Enter in the input.
 */
$("sub-input").addEventListener("keydown", function (event) {
  if (event.key !== "Enter") return;
  event.preventDefault();
  const subtaskText = this.value.trim();
  if (!subtaskText) return;
  subtasks.push(subtaskText);
  this.value = "";
  $("subtask-func-btn").classList.add("d-none");
  $("subtask-plus-box").classList.remove("d-none");
  renderSubtasks();
});

/**
 * Attach delete click listeners for all .subtask-delete-icon after a render.
 * (Note: if unused elsewhere, consider delegated click handlers.)
 */
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

/**
 * Clear the new-subtask input via the clear (X) icon.
 */
$("sub-clear").addEventListener("click", () => {
  $("sub-input").value = "";
  $("subtask-func-btn").classList.add("d-none");
  $("subtask-plus-box").classList.remove("d-none");
});

/**
 * Provide a default suggestion on plus click if there are no subtasks yet.
 */
$("sub-plus").addEventListener("click", () => {
  if (subtasks.length === 0) {
    $("sub-input").value = "Contact Form";
    $("subtask-plus-box").classList.add("d-none");
    $("subtask-func-btn").classList.remove("d-none");
  }
});

/**
 * Persist an edited subtask triggered by clicking the save icon.
 * @param {HTMLElement} saveBtn
 */
function saveEditedSubtask(saveBtn) {
  const item = saveBtn.closest(".subtask-item");
  if (!item) return;
  const index = Number(item.getAttribute("data-index"));
  const input = item.querySelector(".subtask-edit-input");
  if (!Number.isFinite(index) || !input) return;
  const newValue = /** @type {HTMLInputElement} */ (input).value.trim();
  if (!newValue) {
    subtasks.splice(index, 1);
  } else {
    subtasks[index] = newValue;
  }
  renderSubtasks();
  addEditEvents();
}
window.saveEditedSubtask = saveEditedSubtask;

/**
 * Delegated save click for subtask items.
 */
$("subtask-list").addEventListener("click", (event) => {
  if (event.target.classList?.contains("subtask-save-icon")) {
    saveEditedSubtask(/** @type {HTMLElement} */ (event.target));
  }
});

/**
 * Auto-save editing subtask when clicking outside its bounds.
 */
/**
 * Auto-save editing subtask when clicking outside its bounds.
 * Zusätzlich: Wenn außerhalb von #sub-input geklickt wird und es Text gibt,
 * den #sub-check-Button auslösen (aber nicht während eines Edit-Modus).
 */
document.addEventListener('pointerdown', (event) => {
  const target = /** @type {Node} */ (event.target);
  const editingItems = document.querySelectorAll('.subtask-item.editing');
  const hadEditing = editingItems.length > 0;
  editingItems.forEach((subtaskItem) => {
    if (!subtaskItem.contains(target)) {
      const saveBtn = subtaskItem.querySelector('.subtask-save-icon');
      if (saveBtn) window.saveEditedSubtask(/** @type {HTMLElement} */ (saveBtn));
    }
  });
  if (!hadEditing) {
    const subInput = /** @type {HTMLInputElement|null} */ (document.getElementById('sub-input'));
    if (subInput && subInput.value.trim() && !subInput.contains(target)) {
      const funcBox = document.getElementById('subtask-func-btn');
      if (!funcBox || !funcBox.contains(target)) {
        document.getElementById('sub-check')?.click();
      }
    }
  }
}, true);


/**
 * Replace a <template id="addtask-template"> with its rendered content and dispatch 'addtask:template-ready'.
 */
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

/**
 * Limit avatars displayed in a container to a maximum and append exactly one "+x" badge. Idempotent.
 * @param {HTMLElement} container
 * @param {number} [max=5]
 */
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

/**
 * Apply capping to all elements with the ".contact-initials" class on the page.
 * @param {number} [max=5]
 */
function applyCapToAllInitials(max = 5) {
  document.querySelectorAll('.contact-initials').forEach(box => capAssignedInitialsIn(box, max));
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => applyCapToAllInitials(5));
} else {
  applyCapToAllInitials(5);
}

/**
 * Observe the DOM and re-apply initials capping when ".contact-initials" nodes are added.
 */
(function observeInitials() {
  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; applyCapToAllInitials(5); });
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
