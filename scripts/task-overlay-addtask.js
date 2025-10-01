/**
 * @file Task Overlay Add-Task - Add-Task overlay functionality
 */

const overlay = document.getElementById("overlay-add-task");
const overlayContent = document.querySelector(".add-task-overlay-content");

function showOverlayElement() {
  overlay.classList.remove("d-none");
}

function startSlideInAnimation() {
  overlayContent.classList.remove("slide-out");
  overlayContent.classList.add("slide-in");
}

function getCancelButton() {
  return document.getElementById("cancel-button");
}

function clickCancelButton() {
  const cancelBtn = getCancelButton();
  if (cancelBtn) {
    cancelBtn.click();
  }
}

function addTemplateReadyListener() {
  document.addEventListener(
    "addtask:template-ready",
    () => getCancelButton()?.click(),
    { once: true }
  );
}

function resetForm() {
  const cancelBtn = getCancelButton();
  if (cancelBtn) {
    clickCancelButton();
  } else {
    addTemplateReadyListener();
  }
}

function startSlideOutAnimation() {
  overlayContent.classList.remove("slide-in");
  overlayContent.classList.add("slide-out");
}

function completeOverlayClose() {
  overlay.classList.add("d-none");
  overlayContent.classList.remove("slide-out");
}

function createAnimationEndHandler() {
  return function handler() {
    completeOverlayClose();
    overlayContent.removeEventListener("animationend", handler);
  };
}

function addAnimationEndListener() {
  const handler = createAnimationEndHandler();
  overlayContent.addEventListener("animationend", handler);
}

function openOverlay() {
  showOverlayElement();
  startSlideInAnimation();
  resetForm();
}

function closeOverlay() {
  startSlideOutAnimation();
  addAnimationEndListener();
}

function isOverlayHidden() {
  return overlay.classList.contains("d-none");
}

function toggleOverlayVisibility() {
  if (isOverlayHidden()) {
    openOverlay();
  } else {
    closeOverlay();
  }
}

window.toggleAddTaskBoard = function () {
  toggleOverlayVisibility();
  moveFormBackToAside();
};

function getFormSource() {
  return document.querySelector(".edit-addtask .addtask-wrapper");
}

function getFormDestination() {
  return document.querySelector(".addtask-aside-clone");
}

function areFormMoveElementsValid(src, dst) {
  return src !== null && dst !== null;
}

function moveFormElement(src, dst) {
  dst.replaceChildren(src);
}

function moveFormBackToAside() {
  const src = getFormSource();
  const dst = getFormDestination();
  
  if (areFormMoveElementsValid(src, dst)) {
    moveFormElement(src, dst);
  }
}

function hideEditWrapper() {
  document.querySelector(".edit-addtask-wrapper")?.classList.add("d-none");
}

function showTaskOverlayContent() {
  document.getElementById("task-overlay-content")?.classList.remove("d-none");
}

function isBackdropClick(e) {
  return e.target === overlay;
}

function isOverlayVisible() {
  return !overlay.classList.contains("d-none");
}

function shouldHandleBackdropClick(e) {
  return isBackdropClick(e) && isOverlayVisible();
}

function resetOverlayToDefault() {
  hideEditWrapper();
  showTaskOverlayContent();
}

function onOverlayBackdropClick(e) {
  if (!shouldHandleBackdropClick(e)) return;
  
  resetOverlayToDefault();
  window.toggleAddTaskBoard();
}

function setupOverlayListener() {
  overlay?.addEventListener("click", onOverlayBackdropClick);
}

(function initTaskOverlayAddTask() {
  setupOverlayListener();
}());