import { sanitizeText } from "../utils/masking.js";
import type { NotificationEvent, NotificationMessage } from "./notification-types.js";

export function buildNotificationMessage(event: NotificationEvent): NotificationMessage {
  const subject = event.sourceCommand === "backfill" ? "Backfill" : "Sync";
  const severity = severityForEvent(event.type);
  const title = `Mono Lunch Money: ${subject} ${titleSuffix(event.type)}`;
  const bodyParts = [bodyIntro(event), event.details]
    .filter((part): part is string => Boolean(part))
    .map((part) => sanitizeText(part));

  return {
    title: sanitizeText(title),
    body: bodyParts.join("\n").slice(0, 500),
    severity
  };
}

function bodyIntro(event: NotificationEvent): string {
  const subject = event.sourceCommand === "backfill" ? "Backfill" : "Sync";
  switch (event.type) {
    case "sync-started":
      return `${subject} started.`;
    case "sync-success":
      return `${subject} finished successfully.`;
    case "sync-partial-failure":
      return `${subject} finished, but one or more accounts failed.`;
    case "lock-held":
      return `${subject} was skipped because another run is already active.`;
    case "sync-failure":
      return `${subject} failed before it could finish.`;
    case "notification-failure":
      return "Windows notification delivery failed.";
  }
}

function severityForEvent(type: NotificationEvent["type"]): NotificationMessage["severity"] {
  switch (type) {
    case "sync-started":
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
    case "sync-started":
      return "started";
    case "sync-success":
      return "completed";
    case "sync-partial-failure":
      return "completed with failures";
    case "lock-held":
      return "already running";
    case "sync-failure":
      return "failed";
    case "notification-failure":
      return "notification delivery failed";
  }
}
