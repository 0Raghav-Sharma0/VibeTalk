// src/utils/notifications.js
// Unified notification system: toasts when focused, system notifications when not

import toast from "react-hot-toast";

export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    return false;
  }
  if (Notification.permission === "granted") return true;
  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }
  return false;
};

/**
 * Show system (browser) notification when tab is not focused.
 * Used for chat messages, calls, etc.
 */
export const showSystemNotification = async ({ title, body, icon, onClick }) => {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") {
    const granted = await requestNotificationPermission();
    if (!granted) return;
  }
  if (document.hasFocus()) return;

  try {
    const notification = new Notification(title, {
      body,
      icon: icon || "/favicon.ico",
      badge: "/favicon.ico",
      tag: "chitchat-notification",
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

/**
 * Unified notify: toast when focused, system notification when not.
 * Use for important events (new message, user joined, etc.)
 */
export const notify = async ({ title, body, type = "info", onClick }) => {
  if (document.hasFocus()) {
    if (type === "success") toast.success(title);
    else if (type === "error") toast.error(title);
    else toast(title);
  } else {
    await showSystemNotification({ title, body, onClick });
  }
};