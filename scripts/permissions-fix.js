// Block unload/beforeunload events due to Permissions Policy
const originalAddEventListener = window.addEventListener;
const originalRemoveEventListener = window.removeEventListener;

// Override addEventListener to block unload events
window.addEventListener = function (type, listener, options) {
  if (type === 'unload' || type === 'beforeunload') {
    return; // Silently ignore
  }
  return originalAddEventListener.call(this, type, listener, options);
};

// Override removeEventListener for consistency
window.removeEventListener = function (type, listener, options) {
  if (type === 'unload' || type === 'beforeunload') {
    return; // Silently ignore
  }
  return originalRemoveEventListener.call(this, type, listener, options);
};

// Block onunload and onbeforeunload properties
Object.defineProperty(window, 'onunload', {
  set: function() { /* ignore */ },
  get: function() { return null; }
});

Object.defineProperty(window, 'onbeforeunload', {
  set: function() { /* ignore */ },
  get: function() { return null; }
});
