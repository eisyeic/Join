// Build the contact dropdown option template used in Assigned to
function createContactListItemTemplate(contact, id) {
  return `
    <div>
      <div class="contact-initial" style="background-image: url(./assets/general_elements/icons/color${contact.colorIndex}.svg)">
        ${contact.initials}
      </div>
      ${contact.name}
    </div>
    <img src="./assets/icons/add_task/check_default.svg" alt="checkbox" />
  `;
}

// Build plain error message content (used by some components)
function createErrorMessageTemplate(message) {
  return message;
}

if (typeof window !== "undefined") {
  // @ts-ignore make helpers available for legacy inline usage
  window.createContactListItemTemplate = createContactListItemTemplate;
  // @ts-ignore
  window.createErrorMessageTemplate = createErrorMessageTemplate;
}

// Inject the Add-Task template into .addtask-wrapper if empty
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