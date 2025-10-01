/**
 * @file summary-animations.js
 * @description Animation logic for Summary Board mobile interface
 */

/**
 * Checks if device is mobile
 */
function isMobileDevice() {
  return window.innerWidth <= 900;
}

/**
 * Runs all mobile animations
 */
function runMobileAnimations() {
  animateDashboardHeader();
  animateTaskDashboardMobile();
}

/**
 * Runs mobile-only intro animations
 */
function initMobileAnimations() {
  if (!isMobileDevice()) return;
  runMobileAnimations();
}

/**
 * Gets dashboard header element
 */
function getDashboardHeader() {
  return document.querySelector('.dashboard-header');
}

/**
 * Sets header transition style
 */
function setHeaderTransition(header) {
  header.style.transition = 'transform 1s ease';
}

/**
 * Sets header transform style
 */
function setHeaderTransform(header) {
  header.style.transform = 'translateY(-25vh)';
}

/**
 * Applies header animation styles
 */
function applyHeaderAnimationStyles(header) {
  setHeaderTransition(header);
  setHeaderTransform(header);
}

/**
 * Executes header animation
 */
function executeHeaderAnimation() {
  const header = getDashboardHeader();
  if (header) {
    applyHeaderAnimationStyles(header);
  }
}

/**
 * Slides the dashboard header upward
 */
function animateDashboardHeader() {
  setTimeout(executeHeaderAnimation, 1800);
}

/**
 * Gets mobile dashboard element
 */
function getMobileDashboard() {
  return document.querySelector('.task-dashboard-mobile');
}

/**
 * Sets mobile dashboard transition
 */
function setMobileDashboardTransition(dashboard) {
  dashboard.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
}

/**
 * Sets mobile dashboard transform
 */
function setMobileDashboardTransform(dashboard) {
  dashboard.style.transform = 'translateY(0)';
}

/**
 * Sets mobile dashboard opacity
 */
function setMobileDashboardOpacity(dashboard) {
  dashboard.style.opacity = '1';
}

/**
 * Applies mobile dashboard animation styles
 */
function applyMobileDashboardStyles(dashboard) {
  setMobileDashboardTransition(dashboard);
  setMobileDashboardTransform(dashboard);
  setMobileDashboardOpacity(dashboard);
}

/**
 * Executes mobile dashboard animation
 */
function executeMobileDashboardAnimation() {
  const dashboardMobile = getMobileDashboard();
  if (dashboardMobile) {
    applyMobileDashboardStyles(dashboardMobile);
  }
}

/**
 * Fades and slides in the mobile task dashboard
 */
function animateTaskDashboardMobile() {
  setTimeout(executeMobileDashboardAnimation, 2100);
}

export { initMobileAnimations };