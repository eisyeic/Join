function resetFormErrors() {
  const e1 = document.getElementById("addtask-error"); if (e1) e1.innerHTML = "";
  const e2 = document.getElementById("due-date-error"); if (e2) e2.innerHTML = "";
  const e3 = document.getElementById("category-selection-error"); if (e3) e3.innerHTML = "";
}

function setError(msgId, borderId, msg) {
  const msgEl = document.getElementById(msgId);
  if (msgEl) msgEl.innerHTML = msg;
  if (borderId) {
    const borderEl = document.getElementById(borderId);
    if (borderEl) borderEl.style.borderColor = "var(--error-color)";
  }
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