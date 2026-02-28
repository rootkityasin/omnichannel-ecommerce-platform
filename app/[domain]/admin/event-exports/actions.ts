"use server";

import { getEventsByDuration } from "@/app/actions/event";

export async function fetchEventsByDuration(days: number) {
  return getEventsByDuration(days);
}
