// src/utils/notifications.js

export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
};

export const showSystemNotification = async ({ title, body, icon, onClick }) => {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications");
    return;
  }

  if (Notification.permission !== "granted") {
    const granted = await requestNotificationPermission();
    if (!granted) {
      console.log("Notification permission denied");
      return;
    }
  }

  if (document.hasFocus()) {
    console.log("Window is focused, skipping notification");
    return;
  }

  try {
    const notification = new Notification(title, {
      body,
      icon: icon || "/favicon.ico",
      badge: "/favicon.ico",
      tag: "chat-notification",
      requireInteraction: false,
      silent: false,
    });

    if (onClick) {
      notification.onclick = () => {
        onClick();
        notification.close();
      };
    }

    setTimeout(() => notification.close(), 5000);
  } catch (error) {
    console.error("Failed to show notification:", error);
  }
};