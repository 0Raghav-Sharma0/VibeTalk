// Ask browser for permission
export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) return;

  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }
};

// Show a system notification
export const showSystemNotification = ({ title, body, icon, onClick }) => {
  if (Notification.permission !== "granted") return;

  const n = new Notification(title, {
    body,
    icon: icon || "/logo.png",
  });

  if (onClick) {
    n.onclick = () => {
      window.focus();
      onClick();
    };
  }
};
