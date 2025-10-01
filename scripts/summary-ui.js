/**
 * @file summary-ui.js
 * @description UI updates and user interface management for Summary Board
 */
import { getInitials, getGreeting, $ } from "./summary-core.js";

/**
 * Gets desktop deadline element
 */
function getDesktopDeadlineElement() {
  return $("urgent-deadline");
}

/**
 * Gets mobile deadline element
 */
function getMobileDeadlineElement() {
  return $("urgent-deadline-mobile");
}

/**
 * Sets deadline text on element
 */
function setDeadlineText(element, text) {
  element.textContent = text;
}

/**
 * Updates deadline element if it exists
 */
function updateDeadlineElement(element, displayDate) {
  if (element) setDeadlineText(element, displayDate);
}

/**
 * Writes the earliest urgent deadline into the UI
 */
function updateUrgentDeadline(earliestDate) {
  const desktopDeadline = getDesktopDeadlineElement();
  const mobileDeadline = getMobileDeadlineElement();
  const displayDate = formatUrgentDate(earliestDate);

  updateDeadlineElement(desktopDeadline, displayDate);
  updateDeadlineElement(mobileDeadline, displayDate);
}

/**
 * Checks if date is null or undefined
 */
function isNullDate(date) {
  return !date;
}

/**
 * Gets month name from date
 */
function getMonthName(date) {
  return date.toLocaleDateString('en-US', { month: 'long' });
}

/**
 * Gets day from date
 */
function getDay(date) {
  return date.getDate();
}

/**
 * Gets year from date
 */
function getYear(date) {
  return date.getFullYear();
}

/**
 * Formats date components into display string
 */
function formatDateComponents(month, day, year) {
  return `${month} ${day}, ${year}`;
}

/**
 * Formats a Date as "Month D, YYYY", or returns "Nothing" if null
 */
function formatUrgentDate(date) {
  if (isNullDate(date)) return "Nothing";
  
  const month = getMonthName(date);
  const day = getDay(date);
  const year = getYear(date);
  return formatDateComponents(month, day, year);
}

/**
 * Gets desktop counter elements
 */
function getDesktopCounterElements() {
  return {
    todo: $("task-to-do-text"),
    inProgress: $("task-in-progress-text"),
    awaitFeedback: $("task-awaiting-feedback-text"),
    done: $("task-done-text"),
    urgent: $("task-urgent-text"),
    total: $("task-on-board-text")
  };
}

/**
 * Gets mobile counter elements
 */
function getMobileCounterElements() {
  return {
    todo: $("task-to-do-text-mobile"),
    inProgress: $("task-in-progress-text-mobile"),
    awaitFeedback: $("task-awaiting-feedback-text-mobile"),
    done: $("task-done-text-mobile"),
    urgent: $("task-urgent-text-mobile"),
    total: $("task-on-board-text-mobile")
  };
}

/**
 * Animates counters for element set
 */
function animateCounterSet(elements, counts) {
  for (const key in counts) {
    animateCounter(elements[key], counts[key]);
  }
}

/**
 * Updates and animates task counters for desktop and mobile widgets
 */
function updateTaskCountElements(counts) {
  const elements = getDesktopCounterElements();
  const mobileElements = getMobileCounterElements();
  
  animateCounterSet(elements, counts);
  animateCounterSet(mobileElements, counts);
}

/**
 * Validates counter animation parameters
 */
function isValidCounterAnimation(element, target) {
  return element !== null && !isNaN(target);
}

/**
 * Clears existing counter interval
 */
function clearExistingInterval(element) {
  if (element.counterInterval) {
    clearInterval(element.counterInterval);
  }
}

/**
 * Updates counter display
 */
function updateCounterDisplay(element, value) {
  element.textContent = value;
}

/**
 * Completes counter animation
 */
function completeCounterAnimation(element, target) {
  clearInterval(element.counterInterval);
  updateCounterDisplay(element, target);
}

/**
 * Creates counter animation interval
 */
function createCounterInterval(element, target, maxFakeCount, delay) {
  let current = 0;
  element.counterInterval = setInterval(() => {
    updateCounterDisplay(element, current);
    current++;
    if (current > maxFakeCount) {
      completeCounterAnimation(element, target);
    }
  }, delay);
}

/**
 * Animates a numeric counter from 0 up to its target value
 */
function animateCounter(element, target) {
  if (!isValidCounterAnimation(element, target)) return;
  
  const maxFakeCount = 9;
  const delay = 10;
  
  clearExistingInterval(element);
  createCounterInterval(element, target, maxFakeCount, delay);
}

/**
 * Gets user display name or default
 */
function getUserDisplayName(user) {
  return user.displayName || "User";
}

/**
 * Gets user interface elements
 */
function getUserInterfaceElements() {
  return {
    username: $("username"),
    greeting: $("greeting"),
    initials: $("person-icon-header-text")
  };
}

/**
 * Checks if user has valid name
 */
function hasValidUserName(name) {
  return name !== "User";
}

/**
 * Sets username text
 */
function setUsernameText(element, name) {
  element.textContent = name;
}

/**
 * Formats greeting text
 */
function formatGreetingText(greeting) {
  return greeting + ",";
}

/**
 * Sets greeting styles
 */
function setGreetingStyles(element) {
  element.style.fontSize = "48px";
  element.style.fontWeight = "400";
}

/**
 * Updates greeting element
 */
function updateGreetingElement(element, greeting) {
  element.textContent = formatGreetingText(greeting);
  setGreetingStyles(element);
}

/**
 * Updates user initials if function available
 */
function updateInitialsIfAvailable(element, user) {
  if (element && window.updateUserInitials) {
    window.updateUserInitials(user);
  }
}

/**
 * Projects the user's name, greeting, and initials into the UI
 */
function updateUserInterface(user) {
  const name = getUserDisplayName(user);
  const greeting = getGreeting();
  const elements = getUserInterfaceElements();
  
  if (elements.username && hasValidUserName(name)) {
    setUsernameText(elements.username, name);
    
    if (elements.greeting) {
      updateGreetingElement(elements.greeting, greeting);
    }
    
    updateInitialsIfAvailable(elements.initials, user);
  }
}

export { updateTaskCountElements, updateUrgentDeadline, updateUserInterface };