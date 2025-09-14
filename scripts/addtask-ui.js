/**
 * @file AddTask UI helper functions
 * Small, single-responsibility utilities for avatar capping, DOM readiness,
 * template injection, and Assigned-contacts dropdown behavior.
 *
 * Assumptions:
 * - `$` is a DOM helper that returns an element by id (e.g., $("my-id")).
 * - Global template function `window.getAddtaskTemplate()` may be provided.
 */

// Make functions available globally (backwards compatibility)
window.capAssignedInitialsIn = capAssignedInitialsIn;
window.applyCapToAllInitials = applyCapToAllInitials;
window.applyAssignedInitialsCap = applyAssignedInitialsCap;

// Event wiring (preserve current behavior)
$("assigned-select-box").addEventListener('click', toggleAssignedDropdown);

/**
 * Sort only the chip elements (exclude the +N badge) alphabetically by text content.
 * @param {HTMLElement} container
 * @returns {HTMLElement[]} Sorted chip elements
 */
function sortChips(container) {
  const chips = Array.from(container.children)
    .filter((el) => el.nodeType === 1 && el.getAttribute('data-plus-badge') !== 'true');
  chips.sort((a, b) => a.textContent.localeCompare(b.textContent));
  chips.forEach((el) => container.appendChild(el));
  return chips;
}

/**
 * Ensure (or create) a single "+N" badge element in the container.
 * @param {HTMLElement} container
 * @returns {HTMLElement} The "+N" badge element
 */
function ensurePlusBadge(container) {
  let plus = container.querySelector('[data-plus-badge="true"]');
  if (!plus) {
    plus = document.createElement('div');
    plus.setAttribute('data-plus-badge', 'true');
    plus.className = 'assigned-plus-badge';
  }
  return plus;
}

/**
 * Limit avatars displayed in a container to a maximum and append exactly one +x badge.
 * (Keeps the existing default of 5.)
 * @param {HTMLElement} container
 * @param {number} [max=5]
 * @returns {void}
 */
function capAssignedInitialsIn(container, max = 5) {
  if (!container) return;
  const chips = sortChips(container);
  chips.forEach((el) => el.classList.remove('d-none'));
  let plus = container.querySelector('[data-plus-badge="true"]');

  if (chips.length <= max) {
    plus?.remove?.();
    return;
  }

  // Hide overflow and append/update +N badge
  for (let i = max; i < chips.length; i++) chips[i].classList.add('d-none');
  plus = ensurePlusBadge(container);
  plus.textContent = `+${chips.length - max}`;
  container.appendChild(plus);
}

/**
 * Apply capping to all elements with the .contact-initials class on the page.
 * @param {number} [max=5]
 * @returns {void}
 */
function applyCapToAllInitials(max = 5) {
  document
    .querySelectorAll('.contact-initials')
    .forEach((box) => capAssignedInitialsIn(box, max));
}

/**
 * Run a callback once DOM is ready.
 * @param {() => void} cb
 * @returns {void}
 */
function onDomReady(cb) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cb, { once: true });
  } else {
    cb();
  }
}

/**
 * Setup initials capping on DOM ready.
 * @returns {void}
 */
(function setupInitialsCapping() {
  onDomReady(() => applyCapToAllInitials(5));
})();

/** Default cap fallback if constant is not defined. */
const INITIALS_CAP_FALLBACK = (typeof DEFAULT_INITIALS_CAP !== 'undefined') ? DEFAULT_INITIALS_CAP : 5;

/**
 * Check whether a node is or contains a `.contact-initials` element.
 * @param {Node} n
 * @returns {boolean}
 */
function nodeHasInitials(n) {
  if (n.nodeType !== 1) return false;
  const el = /** @type {Element} */(n);
  return !!(el.matches?.('.contact-initials') || el.querySelector?.('.contact-initials'));
}

/**
 * Determine if any added nodes in a mutation batch include initials containers.
 * @param {MutationRecord[]} records
 * @returns {boolean}
 */
function addedInitialsIn(records) {
  for (const r of records) {
    if (r.type !== 'childList') continue;
    const nodes = Array.from(r.addedNodes);
    if (nodes.some(nodeHasInitials)) return true;
  }
  return false;
}

/**
 * Create a scheduler that batches re-capping into a single rAF tick.
 * @param {number} cap
 * @returns {() => void}
 */
function createCapScheduler(cap) {
  let scheduled = false;
  return function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; applyCapToAllInitials(cap); });
  };
}

/**
 * Build a MutationObserver that triggers the given scheduler.
 * @param {() => void} schedule
 * @returns {MutationObserver}
 */
function makeInitialsObserver(schedule) {
  return new MutationObserver((records) => {
    if (addedInitialsIn(records)) schedule();
  });
}

/**
 * Start observing the document for initials containers and recalc on changes.
 * @returns {void}
 */
(function startInitialsObserver() {
  const schedule = createCapScheduler(INITIALS_CAP_FALLBACK);
  const obs = makeInitialsObserver(schedule);
  obs.observe(document.documentElement, { childList: true, subtree: true });
})();

/**
 * Try to get the AddTask template string from a global provider.
 * @returns {string}
 */
function getAddtaskTemplate() {
  if (typeof window.getAddtaskTemplate === 'function') {
    return window.getAddtaskTemplate();
  }
  // Fallback if templates.js not loaded yet
  return '';
}

/**
 * Replace a template placeholder with its rendered content and dispatch an event.
 * Dispatches `addtask:template-ready` after successful replacement.
 * @returns {void}
 */
(function injectAddTaskTemplate() {
  const render = () => {
    const tpl = document.getElementById('addtask-template');
    if (!tpl || !(tpl instanceof HTMLTemplateElement)) return false;
    const template = getAddtaskTemplate();
    if (!template) return false;
    tpl.innerHTML = template;
    const frag = tpl.content.cloneNode(true);
    tpl.replaceWith(frag);
    document.dispatchEvent(new CustomEvent('addtask:template-ready'));
    return true;
  };
  if (!render()) onDomReady(render);
})();

/**
 * Apply initials capping on the main initials box if present (legacy hook compatibility).
 * @returns {void}
 */
function applyAssignedInitialsCap() {
  const contactInitialsBox = document.querySelector('.contact-initials');
  if (contactInitialsBox) capAssignedInitialsIn(contactInitialsBox, 3);
}

/**
 * Show the assigned contacts list and update the icon state.
 * @returns {void}
 */
function openAssignedList() {
  const list = $("contact-list-box");
  const icon = $("assigned-icon");
  list.classList.remove('d-none');
  icon?.classList.add('arrow-up');
  icon?.classList.remove('arrow-down');
}

/**
 * Hide the assigned contacts list and update the icon state.
 * @returns {void}
 */
function closeAssignedList() {
  const list = $("contact-list-box");
  const icon = $("assigned-icon");
  list.classList.add('d-none');
  icon?.classList.remove('arrow-up');
  icon?.classList.add('arrow-down');
}

/**
 * Show or hide the initials box depending on current selection within the list.
 * @returns {void}
 */
function updateInitialsBoxVisibility() {
  const initialsBox = document.querySelector('.contact-initials');
  const selectedContacts = document.querySelectorAll('#contact-list-box li.selected');
  if (!initialsBox) return;
  if (selectedContacts.length > 0) {
    initialsBox.classList.remove('d-none');
  } else {
    initialsBox.classList.add('d-none');
  }
}

/**
 * Toggle the assigned contacts dropdown. When closing, update initials visibility and cap.
 * @returns {void}
 */
function toggleAssignedDropdown() {
  const list = $("contact-list-box");
  const isListVisible = !list.classList.contains('d-none');
  if (isListVisible) {
    closeAssignedList();
    updateInitialsBoxVisibility();
    applyAssignedInitialsCap();
  } else {
    openAssignedList();
    // Hide initials while the list is open (legacy behavior)
    document.querySelector('.contact-initials')?.classList.add('d-none');
  }
}

// Clear the new-subtask input via the clear (X) icon
$("sub-clear").addEventListener("click", () => {
  $("sub-input").value = "";
  $("subtask-func-btn").classList.add("d-none");
  $("subtask-plus-box").classList.remove("d-none");
});

// Provide a default suggestion on plus click if there are no subtasks yet
$("sub-plus").addEventListener("click", () => {
  if (subtasks.length === 0) {
    $("sub-input").value = "Contact Form";
    $("subtask-plus-box").classList.add("d-none");
    $("subtask-func-btn").classList.remove("d-none");
  }
});

/**
 * Normalize the global subtasks array into a string array.
 * @returns {string[]}
 */
function normalizeSubtasks() {
  const src = (window.subtasks || (typeof subtasks !== 'undefined' ? subtasks : [])) || [];
  return src
    .map((st) => (typeof st === 'string' ? st : st && st.name ? st.name : ''))
    .filter(Boolean);
}

/**
 * Render the editable subtasks list (titles only).
 * @returns {void}
 */
function renderSubtasks() {
  const normalized = normalizeSubtasks();
  try { subtasks = normalized; } catch (_) {}
  window.subtasks = normalized;
  $("subtask-list").innerHTML = buildSubtasksHTML(normalized);
  attachSubtaskHandlers();
}

/**
 * Attach delete handlers to subtask delete icons (delegated per render).
 * @returns {void}
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
 * Close the category dropdown if the click happened outside its elements.
 * @param {MouseEvent} event
 * @returns {void}
 */
function handleCategoryClickOutside(event) {
  const target = event.target;
  const isInsideCategory = $("category-select").contains(target) || $("category-selection").contains(target);
  if (!isInsideCategory) {
    $("category-selection").classList.add("d-none");
    $("category-icon").classList.remove("arrow-up");
    $("category-icon").classList.add("arrow-down");
  }
}

/**
 * Initialize the native date picker widgets if present.
 * @returns {void}
 */
function setupDatePicker() {
  const datePicker = document.getElementById('datepicker');
  const wrapper = document.getElementById('datepicker-wrapper');
  const display = document.getElementById('date-display');
  if (!(datePicker && wrapper && display)) return;
  setDatePickerMin(/** @type {HTMLInputElement} */(datePicker));
  bindDatePickerEvents(/** @type {HTMLInputElement} */(datePicker), wrapper, display);
}

/**
 * Show the confirmation banner and dim overlay.
 * @returns {void}
 */
function showBanner() {
  const overlay = $("overlay-bg");
  const banner = $("slide-in-banner");
  if (overlay) overlay.style.display = "block";
  if (banner) banner.classList.add("visible");
}

/**
 * Hide the confirmation banner and overlay.
 * @returns {void}
 */
function hideBanner() {
  const overlay = $("overlay-bg");
  const banner = $("slide-in-banner");
  if (banner) banner.classList.remove("visible");
  if (overlay) overlay.style.display = "none";
}