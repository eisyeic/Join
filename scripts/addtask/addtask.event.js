document.addEventListener('addtask:template-ready', bindDatepickerClick);

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

// --- Priority ---
function bindPriorityButtons() {
  document.querySelectorAll('.priority-button').forEach((btn) => {
    bindOnce(btn, 'click', () => handlePriorityClick(btn), 'prio');
  });
}
function handlePriorityClick(button) {
  document.querySelectorAll('.priority-button').forEach(b => b.classList.remove('active'));
  button.classList.add('active');
  window.selectedPriority = button.classList.contains('urgent-button') ? 'urgent'
    : button.classList.contains('medium-button') ? 'medium' : 'low';
}

// --- Category selection ---
function onCategoryItemClick(e) {
  const li = e.currentTarget;
  const v = li.getAttribute('data-value') ?? '';
  const span = $("category-select")?.querySelector('span');
  if (span) span.textContent = v;
  $("category-selection")?.classList.add('d-none');
  $("category-icon")?.classList.remove('arrow-up');
  $("category-icon")?.classList.add('arrow-down');
  const cs = $("category-select"); if (cs) cs.style.borderColor = '';
  const err = $("category-selection-error"); if (err) err.innerHTML = '';
}

function bindCategorySelection() {
  const panel = $("category-selection");
  if (!panel) return;
  panel.querySelectorAll('li').forEach((li) => li.addEventListener('click', onCategoryItemClick));
}
function toggleCategoryPanel() {
  const panel = $("category-selection"), icon = $("category-icon");
  if (!panel || !icon) return;
  panel.classList.toggle('d-none');
  icon.classList.toggle('arrow-down');
  icon.classList.toggle('arrow-up');
}
function bindCategoryToggle() {
  bindOnce($("category-select"), 'click', toggleCategoryPanel, 'category');
}

// --- Outside closers ---
function closeCategoryIfOutside(t) {
  const sel = $("category-select"), panel = $("category-selection");
  if (!sel || !panel) return;
  const inside = sel.contains(t) || panel.contains(t);
  if (!inside) {
    panel.classList.add('d-none');
    $("category-icon")?.classList.remove('arrow-up');
    $("category-icon")?.classList.add('arrow-down');
  }
}

function outsideHandler(e) {
  const t = e.target;
  closeCategoryIfOutside(t);
  closeAssignedIfOutside(t);
}
function bindOutsideClosers() {
  document.removeEventListener('click', outsideHandler);
  document.addEventListener('click', outsideHandler);
}

// --- Subtasks ---
function onSubInputToggle() {
  const plus = $("subtask-plus-box"), func = $("subtask-func-btn");
  if (!plus || !func) return;
  const show = this.value !== '';
  plus.classList.toggle('d-none', show);
  func.classList.toggle('d-none', !show);
}
function bindSubInputToggle() {
  bindOnce($("sub-input"), 'input', onSubInputToggle, 'sub-input');
}
function bindSubListHover() {
  const list = $("subtask-list");
  bindOnce(list, 'mouseover', (e) => e.target.closest('.subtask-item')?.querySelector('.subtask-func-btn')?.classList.remove('d-none'), 'sub-over');
  bindOnce(list, 'mouseout', (e) => e.target.closest('.subtask-item')?.querySelector('.subtask-func-btn')?.classList.add('d-none'), 'sub-out');
}
function onTitleInputClear() {
  this.style.borderColor = '';
  const err = $("addtask-error"); if (err) err.innerHTML = '';
}
function bindTitleInputClear() {
  bindOnce($("addtask-title"), 'input', onTitleInputClear, 'title');
}
function onCancelClick() {
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
  subtasks.length = 0; $("sub-input").value = '';
  $("subtask-func-btn").classList.add('d-none');
  $("subtask-plus-box").classList.remove('d-none');
  renderSubtasks(); clearAssignedContacts();
  const asb = $("assigned-select-box"); if (asb) asb.dataset.selected = '[]';
  $("contact-list-box").classList.add('d-none');
  resetPrioritySelection();
}
function bindCancelButton() {
  bindOnce($("cancel-button"), 'click', onCancelClick, 'cancel');
}
function onSubCheckClick() {
  const v = $("sub-input")?.value.trim();
  if (!v) return;
  subtasks.push(v);
  $("sub-input").value = '';
  $("subtask-func-btn").classList.add('d-none');
  $("subtask-plus-box").classList.remove('d-none');
  renderSubtasks();
}
function bindSubtaskAdd() {
  bindOnce($("sub-check"), 'click', onSubCheckClick, 'subcheck');
}
function onSubInputEnter(e) {
  if (e.key !== 'Enter') return;
  e.preventDefault();
  const v = this.value.trim(); if (!v) return;
  subtasks.push(v); this.value = '';
  $("subtask-func-btn").classList.add('d-none');
  $("subtask-plus-box").classList.remove('d-none');
  renderSubtasks();
}
function bindSubInputEnter() {
  bindOnce($("sub-input"), 'keydown', onSubInputEnter, 'subenter');
}
function onSubClearClick() {
  $("sub-input").value = '';
  $("subtask-func-btn").classList.add('d-none');
  $("subtask-plus-box").classList.remove('d-none');
}
function bindSubClear() {
  bindOnce($("sub-clear"), 'click', onSubClearClick, 'subclear');
}
function onSubPlusClick() {
  if (subtasks.length !== 0) return;
  $("sub-input").value = 'Contact Form';
  $("subtask-plus-box").classList.add('d-none');
  $("subtask-func-btn").classList.remove('d-none');
}
function bindSubPlus() {
  bindOnce($("sub-plus"), 'click', onSubPlusClick, 'subplus');
}
function onSubListSaveClick(e) {
  if (!e.target.classList?.contains('subtask-save-icon')) return;
  saveEditedSubtask((e.target));
}
function bindSubListSaveClick() {
  bindOnce($("subtask-list"), 'click', onSubListSaveClick, 'sublist');
}