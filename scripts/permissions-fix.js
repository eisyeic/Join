/**
 * @file Override of `window` unload-related events due to Permissions Policy.
 * Prevents registration/removal of `unload` and `beforeunload` event listeners,
 * as well as direct property access to `onunload` and `onbeforeunload`.
 */

/**
 * Applies all necessary permissions fixes to block unload-related events.
 * Overrides window event methods and properties to prevent Permissions Policy violations.
 * @returns {void}
 */
function applyPermissionsFix() {
  const originalAddEventListener = window.addEventListener;
  const originalRemoveEventListener = window.removeEventListener;

  window.addEventListener = function (type, listener, options) {
    if (type === "unload" || type === "beforeunload") {
      return;
    }
    return originalAddEventListener.call(this, type, listener, options);
  };

  window.removeEventListener = function (type, listener, options) {
    if (type === "unload" || type === "beforeunload") {
      return;
    }
    return originalRemoveEventListener.call(this, type, listener, options);
  };

  Object.defineProperty(window, "onunload", {
    set: function () {},
    get: function () {
      return null;
    },
  });

  Object.defineProperty(window, "onbeforeunload", {
    set: function () {},
    get: function () {
      return null;
    },
  });
}

applyPermissionsFix();