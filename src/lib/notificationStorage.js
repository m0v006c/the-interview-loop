const key = (userId) => `til_notifs_${userId}`;

export function loadNotifications(userId) {
  if (!userId) return [];
  try { return JSON.parse(localStorage.getItem(key(userId)) || "[]"); }
  catch { return []; }
}

export function saveNotifications(userId, notifications) {
  if (!userId) return;
  try { localStorage.setItem(key(userId), JSON.stringify(notifications)); }
  catch {}
}
