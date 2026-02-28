import { headers } from "next/headers";

type ActionLogInput = {
  actionId?: string | null;
  actionName?: string;
  extra?: Record<string, unknown>;
};

export async function logActionRequest({
  actionId,
  actionName,
  extra,
}: ActionLogInput) {
  if (process.env.ACTION_LOG !== "true") return;
  const allowlist = process.env.ACTION_LOG_ALLOWLIST
    ? process.env.ACTION_LOG_ALLOWLIST.split(",").map((value) => value.trim())
    : null;
  if (allowlist && actionName && !allowlist.includes(actionName)) return;
  try {
    const reqHeaders = await headers();
    const actionHeader = reqHeaders.get("next-action");
    const url =
      reqHeaders.get("x-forwarded-host") && reqHeaders.get("x-forwarded-proto")
        ? `${reqHeaders.get("x-forwarded-proto")}://${reqHeaders.get("x-forwarded-host")}${reqHeaders.get("x-pathname") || ""}`
        : reqHeaders.get("x-url") || reqHeaders.get("referer") || "";
    const userAgent = reqHeaders.get("user-agent") || "";
    const resolvedActionId = actionId || actionHeader;
    console.warn(
      `[ActionLog] ${actionName || "unknown"} id=${resolvedActionId || "unknown"} url=${url} ua=${userAgent}`,
      extra || {},
    );
  } catch (error) {
    console.warn("[ActionLog] failed to read headers", error);
  }
}
