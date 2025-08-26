// Fix für Permissions Policy Violation: unload is not allowed
// Diese Datei behebt das Problem mit unload Event Listeners

// Entfernen aller unload/beforeunload Event Listeners
window.addEventListener('DOMContentLoaded', function() {
  // Alle bestehenden unload/beforeunload Listener entfernen
  const events = ['unload', 'beforeunload'];
  events.forEach(eventType => {
    // Alle Listener für diese Events entfernen
    const listeners = window.getEventListeners ? window.getEventListeners(window)[eventType] : [];
    if (listeners) {
      listeners.forEach(listener => {
        window.removeEventListener(eventType, listener.listener);
      });
    }
  });
});

// Überschreiben der addEventListener Methode für unload/beforeunload
const originalAddEventListener = window.addEventListener;
window.addEventListener = function(type, listener, options) {
  if (type === 'unload' || type === 'beforeunload') {
    console.warn(`${type} event blocked due to Permissions Policy. Use 'pagehide' or 'visibilitychange' instead.`);
    return;
  }
  return originalAddEventListener.call(this, type, listener, options);
};