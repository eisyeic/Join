/* eslint-env browser */
/**
 * @file Removes existing 'unload'/'beforeunload' listeners after DOM ready
 *       and blocks new registrations of those events by monkey-patching
 *       `window.addEventListener`. Prefer 'pagehide' or 'visibilitychange'.
 */

window.addEventListener('DOMContentLoaded', function () {
  /** @type {Array<'unload'|'beforeunload'>} */
  const events = ['unload', 'beforeunload'];
  events.forEach((eventType) => {
    /** @type {{listener: EventListenerOrEventListenerObject}[]|undefined} */
    // @ts-ignore Non-standard DevTools API may be undefined
    const listeners = window.getEventListeners ? window.getEventListeners(window)[eventType] : [];
    if (listeners) {
      listeners.forEach((listener) => {
        window.removeEventListener(eventType, listener.listener);
      });
    }
  });
});

/** @type {Window['addEventListener']} */
const originalAddEventListener = window.addEventListener;

/**
 * Override to block 'unload' and 'beforeunload' listeners.
 * @param {string} type
 * @param {EventListenerOrEventListenerObject} listener
 * @param {boolean|AddEventListenerOptions} [options]
 * @returns {void}
 */
window.addEventListener = function (type, listener, options) {
  if (type === 'unload' || type === 'beforeunload') {
    console.warn(`${type} event blocked due to Permissions Policy. Use 'pagehide' or 'visibilitychange' instead.`);
    return;
  }
  return originalAddEventListener.call(this, type, listener, options);
};
