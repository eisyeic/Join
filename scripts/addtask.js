/* eslint-disable no-undef */
/**
 * @file Add-Task UI interactions: datepicker, priorities, categories,
 *       assigned contacts dropdown, and subtask CRUD. JSDoc-annotated.
 *
 * Expected globals:
 *  - $: (id: string) => HTMLElement       // shorthand for getElementById
 *  - renderSubtasks: () => void           // renders the current subtask list
 *  - flatpickr                            // datepicker library
 */


/** @type {string[]} */
window.subtasks = Array.isArray(window.subtasks) ? window.subtasks : [];
// Alias auf dieselbe Array-Instanz – NICHT neu zuweisen!
let subtasks = window.subtasks;


window.SubtaskIO = window.SubtaskIO || {
  set(index, value) { subtasks[index] = value; },
  remove(index) { subtasks.splice(index, 1); },
  rerender() { renderSubtasks(); addEditEvents(); }
};

/** @typedef {'urgent' | 'medium' | 'low'} Priority */

/** Current selected priority. @type {Priority} */
let selectedPriority = "medium";

/**
 * Initialize flatpickr on #datepicker.
 * Clears error styles after a valid selection.
 * flatpickr onChange signature: (selectedDates: Date[], dateStr: string, instance)
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

/** Open the datepicker when clicking the wrapper area. */
$("datepicker-wrapper").addEventListener("click", () => {
  document.querySelector("#datepicker")?.click();
});

/**
 * Priority buttons: set active state and update `selectedPriority`.
 * Requires buttons with .priority-button and exactly one of:
 *  - .urgent-button, .medium-button, .low-button
 */
document.querySelectorAll(".priority-button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".priority-button").forEach((btn) => {
      btn.classList.remove("active");
    });
    button.classList.add("active");
    selectedPriority = button.classList.contains("urgent-button")
      ? "urgent"
      : button.classList.contains("medium-button")
      ? "medium"
      : "low";
  });
});

/**
 * Reset priority selection visually and logically to "medium".
 * Re-applies active state to .medium-button if present.
 */
function resetPrioritySelection() {
  document
    .querySelectorAll(".priority-button")
    .forEach((btn) => btn.classList.remove("active"));
  selectedPriority = /** @type {Priority} */ ("medium");
  const mediumButton = document.querySelector(".medium-button");
  if (mediumButton) mediumButton.classList.add("active");
}

/** Box that shows initials of assigned contacts (uses a class selector once). */
const contactInitialsBox = document.querySelector(".contact-initials");

/**
 * Toggle contact list on clicking the assigned-select box.
 * Manages arrow icon states and initials visibility based on selection.
 */
$("assigned-select-box").addEventListener("click", () => {
  $("contact-list-box").classList.toggle("d-none");

  const isListVisible = !$("contact-list-box").classList.contains("d-none");
  $("assigned-icon").classList.add("arrow-up");
  $("assigned-icon").classList.remove("arrow-down");

  if (!isListVisible) {
    $("assigned-icon").classList.remove("arrow-up");
    $("assigned-icon").classList.add("arrow-down");

    const selectedContacts =
      $("contact-list-box").querySelectorAll("li.selected");
    if (selectedContacts.length > 0) {
      contactInitialsBox?.classList.remove("d-none");
    } else {
      contactInitialsBox?.classList.add("d-none");
    }
  } else {
    contactInitialsBox?.classList.add("d-none");
  }
});

/**
 * Category selection: click on a list item sets the label, closes dropdown,
 * and clears error styles.
 */
$("category-selection")
  .querySelectorAll("li")
  .forEach((item) => {
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

/** Close open dropdowns (category, contacts) when clicking outside. */
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
  const isInsideCategory =
    $("category-select").contains(target) ||
    $("category-selection").contains(target);

  if (!isInsideCategory) {
    $("category-selection").classList.add("d-none");
    $("category-icon").classList.remove("arrow-up");
    $("category-icon").classList.add("arrow-down");
  }
}

/**
 * Close assigned contacts dropdown if the click was outside assigned elements.
 * Also toggles initials based on whether items are selected.
 * @param {MouseEvent} event
 */
function handleAssignedClickOutside(event) {
  const target = /** @type {Node} */ (event.target);
  const isInsideAssigned =
    $("assigned-select-box").contains(target) ||
    $("contact-list-box").contains(target);

  if (!isInsideAssigned) {
    $("contact-list-box").classList.add("d-none");

    const selectedContacts = document.querySelectorAll(
      "#contact-list-box li.selected"
    );

    if (selectedContacts.length > 0) {
      contactInitialsBox?.classList.remove("d-none");
    } else {
      contactInitialsBox?.classList.add("d-none");
    }

    $("assigned-icon").classList.remove("arrow-up");
    $("assigned-icon").classList.add("arrow-down");
  }
}

/** Toggle the category dropdown when clicking the select. */
$("category-select").addEventListener("click", () => {
  $("category-selection").classList.toggle("d-none");
  $("category-icon").classList.toggle("arrow-down");
  $("category-icon").classList.toggle("arrow-up");
});

/** Show/hide subtask action buttons based on the new-subtask input content. */
$("sub-input").addEventListener("input", function () {
  if (this.value !== "") {
    $("subtask-plus-box").classList.add("d-none");
    $("subtask-func-btn").classList.remove("d-none");
  } else {
    $("subtask-plus-box").classList.remove("d-none");
    $("subtask-func-btn").classList.add("d-none");
  }
});

/** Reveal subtask action buttons on hover over a subtask item. */
$("subtask-list").addEventListener("mouseover", (event) => {
  const item = event.target.closest(".subtask-item");
  item?.querySelector(".subtask-func-btn")?.classList.remove("d-none");
});

/** Hide subtask action buttons when leaving a subtask item. */
$("subtask-list").addEventListener("mouseout", (event) => {
  const item = event.target.closest(".subtask-item");
  item?.querySelector(".subtask-func-btn")?.classList.add("d-none");
});

/** Clear title input error styles while typing. */
$("addtask-title").addEventListener("input", function () {
  this.style.borderColor = "";
  $("addtask-error").innerHTML = "";
});

/**
 * Reset the entire Add-Task form:
 * title, description, date, category, subtasks, contacts, priority, error messages.
 */
$("cancel-button").addEventListener("click", () => {
  $("addtask-title").value = "";
  $("addtask-title").style.borderColor = "";
  $("addtask-error").innerHTML = "";
  $("addtask-textarea").value = "";

  // Reset date (prefer flatpickr if available)
  try {
    picker.clear();
  } catch {
    $("datepicker").value = "";
  }
  $("datepicker-wrapper").style.borderColor = "";
  $("due-date-error").innerHTML = "";

  // Reset category
  $("category-select").querySelector("span").textContent = "Select task category";
  $("category-select").style.borderColor = "";
  $("category-selection-error").innerHTML = "";

  // Reset subtasks
  subtasks.length = 0;
  $("sub-input").value = "";
  $("subtask-func-btn").classList.add("d-none");
  $("subtask-plus-box").classList.remove("d-none");
  renderSubtasks();

  // Reset assigned contacts
  clearAssignedContacts();
  const asb = $("assigned-select-box");
  if (asb) asb.dataset.selected = "[]";
  $("contact-list-box").classList.add("d-none");

  // Reset priority
  resetPrioritySelection();
});

/** Remove all selected contacts and clear the initials box. */
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
 * Call after each re-render.
 */
function addEditEvents() {
  document.querySelectorAll(".subtask-edit-icon").forEach((editBtn) => {
    editBtn.addEventListener("click", () => enterEditMode(editBtn));
  });
}
window.addEditEvents = addEditEvents;

/**
 * Put a subtask item into edit mode and bind Enter-to-save.
 * @param {HTMLElement} editBtn - The clicked pencil icon inside a .subtask-item.
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
 * @param {HTMLElement} item - The .subtask-item container.
 * @param {HTMLInputElement} input - The edit input inside the item.
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
 * Bind Enter key to save subtask edit (listener removed after first trigger).
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

/** Add a new subtask from the input via the check icon click. */
$("sub-check").addEventListener("click", () => {
  const subtaskText = $("sub-input").value.trim();
  if (!subtaskText) return;

  subtasks.push(subtaskText);
  $("sub-input").value = "";
  $("subtask-func-btn").classList.add("d-none");
  $("subtask-plus-box").classList.remove("d-none");
  renderSubtasks();
});

/** Add a new subtask by pressing Enter while typing in the new-subtask input. */
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
 * Removes the item from the array, re-renders, and rebinds edit handlers.
 * Should be called after renderSubtasks().
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

/** Clear the new-subtask input via the clear (X) icon. */
$("sub-clear").addEventListener("click", () => {
  $("sub-input").value = "";
  $("subtask-func-btn").classList.add("d-none");
  $("subtask-plus-box").classList.remove("d-none");
});

/**
 * Provide a default suggestion on plus click if there are no subtasks yet.
 * (Uses "Contact Form" as example text.)
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
 * @param {HTMLElement} saveBtn - The clicked save icon inside a .subtask-item.
 */
function saveEditedSubtask(saveBtn) {
  const item = saveBtn.closest(".subtask-item");
  if (!item) return;

  const index = Number(item.getAttribute("data-index"));
  const input = item.querySelector(".subtask-edit-input");
  if (!Number.isFinite(index) || !input) return;

  const newValue = /** @type {HTMLInputElement} */ (input).value.trim();

  if (!newValue) {
    // Leer -> Subtask löschen
    subtasks.splice(index, 1);
  } else {
    // Inhalt -> Subtask aktualisieren
    subtasks[index] = newValue;
  }

  renderSubtasks();
  addEditEvents();
}
window.saveEditedSubtask = saveEditedSubtask;


/** Delegate clicks on save icons inside the subtask list to save the edit. */
$("subtask-list").addEventListener("click", (event) => {
  if (event.target.classList?.contains("subtask-save-icon")) {
    saveEditedSubtask(/** @type {HTMLElement} */ (event.target));
  }
});

/** Save subtask edits when clicking outside of an item in edit mode. */
document.addEventListener(
  "pointerdown",
  (event) => {
    document.querySelectorAll(".subtask-item.editing").forEach((subtaskItem) => {
      if (!subtaskItem.contains(/** @type {Node} */ (event.target))) {
        const saveBtn = subtaskItem.querySelector(".subtask-save-icon");
        if (saveBtn) window.saveEditedSubtask(/** @type {HTMLElement} */ (saveBtn));
      }
    });
  },
  true
);



/**
 * Replace a <template id="addtask-template"> with its rendered content as soon
 * as it is available. Dispatches 'addtask:template-ready' afterward.
 * Falls back to DOMContentLoaded if the template is not yet present.
 * Self-invoking IIFE for isolation.
 */
(function injectAddTaskTemplate() {
  /**
   * Render the template if present.
   * Expects a function getAddtaskTemplate(): string (provided externally).
   * @returns {boolean} true if rendered; otherwise false
   */
  const render = () => {
    const tpl = document.getElementById("addtask-template");
    if (!tpl || !(tpl instanceof HTMLTemplateElement)) return false;
    // Replaces the template content – getAddtaskTemplate must return HTML.
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

