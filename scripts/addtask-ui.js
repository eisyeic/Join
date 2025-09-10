// AddTask UI helper functions

// Limit avatars displayed in a container to a maximum and append exactly one +x badge
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

// Apply capping to all elements with the contact-initials class on the page
function applyCapToAllInitials(max = 5) {
  document.querySelectorAll('.contact-initials').forEach(box => capAssignedInitialsIn(box, max));
}

// Setup initials capping on DOM ready
function setupInitialsCapping() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => applyCapToAllInitials(5));
  } else {
    applyCapToAllInitials(5);
  }
}

// Initialize add task UI
function initAddTaskUI() {
  setupInitialsCapping();
}

initAddTaskUI();

// Observe the DOM and re-apply initials capping when contact-initials nodes are added
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

// Get the addtask template from templates.js
function getAddtaskTemplate() {
  if (typeof window.getAddtaskTemplate === 'function') {
    return window.getAddtaskTemplate();
  }
  // Fallback if templates.js not loaded yet
  return '';
}

// Replace a template with its rendered content and dispatch 'addtask:template-ready'
(function injectAddTaskTemplate() {
  const render = () => {
    const tpl = document.getElementById("addtask-template");
    if (!tpl || !(tpl instanceof HTMLTemplateElement)) return false;
    const template = getAddtaskTemplate();
    if (!template) return false;
    tpl.innerHTML = template;
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

// Make functions available globally
window.capAssignedInitialsIn = capAssignedInitialsIn;
window.applyCapToAllInitials = applyCapToAllInitials;