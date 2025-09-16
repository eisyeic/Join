/**
 * @file Override of `window` unload-related events due to Permissions Policy.
 * Prevents registration/removal of `unload` and `beforeunload` event listeners,
 * as well as direct property access to `onunload` and `onbeforeunload`.
 */

/** Original reference to window.addEventListener */
const originalAddEventListener = window.addEventListener;
/** Original reference to window.removeEventListener */
const originalRemoveEventListener = window.removeEventListener;

/**
 * Overrides `window.addEventListener` to block `unload` and `beforeunload` events.
 * @param {string} type - The event type.
 * @param {EventListenerOrEventListenerObject} listener - The listener to add.
 * @param {boolean|AddEventListenerOptions} [options] - Options for the listener.
 * @returns {void|unknown} Returns nothing for blocked events, otherwise delegates to the original addEventListener.
 */
window.addEventListener = function (type, listener, options) {
  if (type === "unload" || type === "beforeunload") {
    return; // Block
  }
  return originalAddEventListener.call(this, type, listener, options);
};

/**
 * Overrides `window.removeEventListener` to ensure consistency with blocked events.
 * @param {string} type - The event type.
 * @param {EventListenerOrEventListenerObject} listener - The listener to remove.
 * @param {boolean|EventListenerOptions} [options] - Options for the listener.
 * @returns {void|unknown} Returns nothing for blocked events, otherwise delegates to the original removeEventListener.
 */
window.removeEventListener = function (type, listener, options) {
  if (type === "unload" || type === "beforeunload") {
    return; // Block
  }
  return originalRemoveEventListener.call(this, type, listener, options);
};

/**
 * Blocks direct access to `window.onunload`.
 * @property {null} onunload - Getter always returns `null`; setter is ignored.
 */
Object.defineProperty(window, "onunload", {
  set: function () {
    /* ignore */
  },
  get: function () {
    return null;
  },
});

/**
 * Blocks direct access to `window.onbeforeunload`.
 * @property {null} onbeforeunload - Getter always returns `null`; setter is ignored.
 */
Object.defineProperty(window, "onbeforeunload", {
  set: function () {
    /* ignore */
  },
  get: function () {
    return null;
  },
});