"use server";

import {
  getNotifications,
  markAsRead,
  clearNotifications,
} from "@/app/actions/notification";

export async function fetchNotifications(limit?: number) {
  return (await getNotifications(limit)) ?? [];
}

export async function markNotificationAsRead(id: string) {
  return markAsRead(id);
}

export async function clearAllNotifications() {
  return clearNotifications();
}
