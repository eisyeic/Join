// Toggle Add Task Overlay
function toggleAddTaskBoard() {
    $("overlay-add-task").classList.toggle("d-none");
}

function showTaskOverlay() {
    $("task-overlay-bg").classList.remove("d-none");
}

function hideTaskOverlay() {
    $("task-overlay-bg").classList.add("d-none");
}