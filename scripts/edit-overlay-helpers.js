/** 
 * @file Main entry point for edit overlay helpers.
 * Re-exports all functions from modular helper files.
 */

// Re-export all date-related functions
export {
  ddmmyyyyToISO,
  isoToDDMMYYYY,
  ensureDateHandlersBound,
  bindDateFocus,
  bindDateBlur,
  bindDateWrapperClick,
  observeDisplayToSyncInput,
  syncFromDisplayToInput,
  resolveIsoFromRaw,
  applyDateUIState,
  computeDateStrings,
  applyDateInput
} from './date-helpers.js';

// Re-export all initials/contact-related functions
export {
  getAssignedArray,
  renderInitials,
  hideInitialsBox,
  initialsHtmlFromPerson,
  computedInitials,
  defaultContactResolver,
  getSelectedIdsFromList,
  renderInitialsAuto,
  watchAssignedSelection,
  applyAssignedInitialsCap
} from './initials-helpers.js';

// Re-export all selection/subtask-related functions
export {
  normalizeSubtasks,
  ensureGlobalSubtasks,
  overwriteGlobalSubtasks,
  renderSubtasksIfAny,
  getSelectedIds,
  toggleLiSelected
} from './selection-helpers.js';