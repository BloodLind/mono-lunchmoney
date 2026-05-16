import { sanitizeText } from "../utils/masking.js";
import type { NotificationEvent, NotificationMessage } from "./notification-types.js";

export function buildNotificationMessage(event: NotificationEvent): NotificationMessage {
  const subject = event.sourceCommand === "backfill" ? "backfill" : "sync";
  const severity = severityForEvent(event.type);
  const title = `Mono Lunch Money ${subject} ${titleSuffix(event.type)}`;
  const bodyParts = [event.summary, event.details, event.logPath ? `Logs: ${event.logPath}` : undefined]
    .filter(Boolean)
    .map((part) => sanitizeText(part));

  return {
    title: sanitizeText(title),
    body: bodyParts.join("\n").slice(0, 500),
    severity
  };
}

function severityForEvent(type: NotificationEvent["type"]): NotificationMessage["severity"] {
  switch (type) {
    case "sync-success":
      return "info";
    case "sync-partial-failure":
    case "lock-held":
      return "warning";
    case "sync-failure":
    case "notification-failure":
      return "error";
  }
}

function titleSuffix(type: NotificationEvent["type"]): string {
  switch (type) {
    case "sync-success":
      return "completed";
    case "sync-partial-failure":
      return "completed with failures";
    case "lock-held":
      return "already running";
    case "sync-failure":
      return "failed";
    case "notification-failure":
      return "notification failed";
  }
}
