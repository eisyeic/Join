let loadedContacts = {};
// Hoisted DOM references (assigned when used)
let elContactListBox;          // #contact-list-box
let elAssignedSelectBox;       // #assigned-select-box
let elAssignedIcon;            // #assigned-icon
let elContactInitials;         // .contact-initials container

document.addEventListener('addtask:contacts-loaded', (e) => {
  loadedContacts = (e?.detail && e.detail.contacts) || {};
  try { maybeRenderContacts(); } catch {}
});

function maybeRenderContacts() {
  elContactListBox = document.getElementById('contact-list-box');
  if (!elContactListBox) return;
  elContactListBox.innerHTML = '';
  let data = loadedContacts || {};
  if (Object.keys(data).length) {
    renderContacts(data, elContactListBox);
  }
}

function onContactInput(e) {
  const value = String(e.target.value || "").trim().toLowerCase();
  elContactListBox = document.getElementById("contact-list-box");
  elContactListBox.classList.remove("d-none");
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
  elContactListBox.innerHTML = "";
  renderContacts(filtered, elContactListBox);
}

function renderContacts(contacts, container) {
  Object.entries(contacts)
    .sort(([, a], [, b]) => a.name.localeCompare(b.name, "de", { sensitivity: "base" }))
    .forEach(([id, contact]) => {
      const li = createContactListItem(contact, id);
      container.appendChild(li);
    });
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
  const selectedLis = document.querySelectorAll("#contact-list-box li.selected");
  elContactInitials = document.getElementById("contact-initials");
  if (!elContactInitials) return;
  elContactInitials.innerHTML = "";

  selectedLis.forEach((li) => {
    const initialsEl = li.querySelector(".contact-initial");
    if (initialsEl) elContactInitials.appendChild(initialsEl.cloneNode(true));
  });
}

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

function toggleAssignedList() {
  elContactListBox = document.getElementById('contact-list-box');
  if (!elContactListBox) return;
  elContactListBox.classList.toggle('d-none');
  const visible = !elContactListBox.classList.contains('d-none');
  elAssignedIcon = document.getElementById('assigned-icon');
  elAssignedIcon?.classList.toggle('arrow-up', visible);
  elAssignedIcon?.classList.toggle('arrow-down', !visible);
  elContactInitials = document.querySelector('.contact-initials');
  if (visible) elContactInitials?.classList.add('d-none');
  else handleAssignedInitials(elContactListBox, elContactInitials);
}

function handleAssignedInitials(list, box) {
  const sel = list.querySelectorAll('li.selected');
  if (box) box.classList.toggle('d-none', sel.length === 0);
  if (typeof applyAssignedInitialsCap === 'function') applyAssignedInitialsCap();
}

function bindAssignedToggle() {
  elAssignedSelectBox = document.getElementById('assigned-select-box');
  bindOnce(elAssignedSelectBox, 'click', toggleAssignedList, 'assigned');
}

function closeAssignedIfOutside(t) {
  elAssignedSelectBox = document.getElementById('assigned-select-box');
  elContactListBox = document.getElementById('contact-list-box');
  if (!elAssignedSelectBox || !elContactListBox) return;
  const inside = elAssignedSelectBox.contains(t) || elContactListBox.contains(t);
  if (inside) return;
  elContactListBox.classList.add('d-none');
  handleAssignedInitials(elContactListBox, document.querySelector('.contact-initials'));
  elAssignedIcon = document.getElementById('assigned-icon');
  elAssignedIcon?.classList.remove('arrow-up');
  elAssignedIcon?.classList.add('arrow-down');
}

function clearAssignedContacts() {
  document.querySelectorAll("#contact-list-box li.selected").forEach((li) => {
    li.classList.remove("selected");
    const checkboxIcon = li.querySelectorAll("img")[0];
    if (checkboxIcon) checkboxIcon.src = "./assets/icons/add_task/check_default.svg";
  });
  elContactInitials = document.getElementById('contact-initials');
  if (elContactInitials) {
    elContactInitials.classList.add('d-none');
    elContactInitials.innerHTML = '';
  }
}