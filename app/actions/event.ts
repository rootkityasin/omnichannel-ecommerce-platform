"use server";

import { prisma } from "@/lib/prisma";
import { logActionRequest } from "@/lib/actionLogger";

export async function getEventsByDuration(days: number) {
  await logActionRequest({ actionName: "getEventsByDuration" });
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  try {
    const startMs = process.env.PERF_LOG === "true" ? Date.now() : 0;
    const events = await prisma.trackingEvent.findMany({
      where: {
        createdAt: {
          gte: cutoffDate,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10000,
    });
    if (events.length === 10000) {
      console.warn(
        "Event export truncated to 10,000 rows. Narrow the date range for full export.",
      );
    }
    if (process.env.PERF_LOG === "true") {
      const { heapUsed, rss } = process.memoryUsage();
      console.info(
        `[Perf] getEventsByDuration days=${days} count=${events.length} ms=${Date.now() - startMs} heapMB=${Math.round(heapUsed / 1024 / 1024)} rssMB=${Math.round(rss / 1024 / 1024)}`,
      );
    }
    return events;
  } catch (error) {
    console.error("Error fetching events:", error);
    return [];
  }
}
