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

const contactInitialsBox = document.querySelector(".contact-initials"); 
const MAX_VISIBLE_INITIALS = 3;
function applyAssignedInitialsCap() {
  applyCapToAllInitials(MAX_VISIBLE_INITIALS);
}

window.applyAssignedInitialsCap = applyAssignedInitialsCap;


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
