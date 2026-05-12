/**
 * Notification Service for Clinical Guideline Updates
 * Manages alerts for favorited hubs when their protocols/guidelines update
 */

const NOTIFICATIONS_STORAGE_KEY = 'notrya_guideline_notifications_sent';

export const notificationService = {
  /**
   * Trigger a guideline update notification for a specific hub
   * @param {string} hubRoute - The route of the hub (e.g., '/SepsisHub')
   * @param {Object} options - Configuration options
   */
  triggerGuidelineAlert: (hubRoute, options = {}) => {
    const {
      title = 'Clinical Guideline Updated',
      message = 'A protocol you follow has been updated with new evidence.',
      hubName = 'Unknown Hub',
      updateType = 'protocol_update', // 'protocol_update', 'evidence_update', 'urgent_revision'
    } = options;

    // Check if browser supports notifications
    if (!('Notification' in window)) {
      console.log('Notifications not supported by this browser');
      return false;
    }

    // Request permission if needed
    if (Notification.permission === 'granted') {
      showBrowserNotification(title, message, hubRoute, hubName);
      return true;
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          showBrowserNotification(title, message, hubRoute, hubName);
        }
      });
      return true;
    }

    return false;
  },

  /**
   * Record that a notification was sent to avoid duplicates
   */
  recordNotificationSent: (hubRoute, timestamp = Date.now()) => {
    try {
      const sent = JSON.parse(localStorage.getItem(NOTIFICATIONS_STORAGE_KEY) || '{}');
      sent[hubRoute] = timestamp;
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(sent));
    } catch (e) {
      console.error('Failed to record notification:', e);
    }
  },

  /**
   * Get timestamp of last notification for a hub
   */
  getLastNotificationTime: (hubRoute) => {
    try {
      const sent = JSON.parse(localStorage.getItem(NOTIFICATIONS_STORAGE_KEY) || '{}');
      return sent[hubRoute] || null;
    } catch (e) {
      console.error('Failed to get notification history:', e);
      return null;
    }
  },

  /**
   * Clear notification history
   */
  clearNotificationHistory: (hubRoute) => {
    try {
      const sent = JSON.parse(localStorage.getItem(NOTIFICATIONS_STORAGE_KEY) || '{}');
      if (hubRoute) {
        delete sent[hubRoute];
      } else {
        localStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
      }
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(sent));
    } catch (e) {
      console.error('Failed to clear notification history:', e);
    }
  },
};

/**
 * Show browser notification
 */
function showBrowserNotification(title, message, hubRoute, hubName) {
  const notification = new Notification(title, {
    body: message,
    icon: '🚨',
    tag: `guideline-${hubRoute}`,
    requireInteraction: false,
  });

  notification.onclick = () => {
    // Focus window and navigate to hub
    window.focus();
    // This could be extended to actually navigate if needed
  };

  notification.onshow = () => {
    notificationService.recordNotificationSent(hubRoute);
  };

  // Auto-close after 8 seconds
  setTimeout(() => notification.close(), 8000);
}

/**
 * Hook to use notification service in React components
 * Usage: const { triggerAlert } = useGuidelineNotifications();
 */
export function useGuidelineNotifications() {
  return {
    triggerAlert: (hubRoute, options) =>
      notificationService.triggerGuidelineAlert(hubRoute, options),
    recordSent: (hubRoute) =>
      notificationService.recordNotificationSent(hubRoute),
    getLastTime: (hubRoute) =>
      notificationService.getLastNotificationTime(hubRoute),
    clearHistory: (hubRoute) =>
      notificationService.clearNotificationHistory(hubRoute),
  };
}