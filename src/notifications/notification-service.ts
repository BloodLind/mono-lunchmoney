import type { NotificationConfig } from "../config/config.model.js";
import { formatFailureRecord, type LogWriter } from "../logging/logger.js";
import { sanitizeText } from "../utils/masking.js";
import { shouldNotify } from "./notification-config.js";
import { buildNotificationMessage } from "./notification-message.js";
import type {
  NotificationAdapter,
  NotificationDeliveryResult,
  NotificationEvent
} from "./notification-types.js";

export async function handleNotificationEvent(input: {
  config: Partial<NotificationConfig> | undefined;
  event: NotificationEvent;
  adapter: NotificationAdapter;
  logger: LogWriter;
}): Promise<NotificationDeliveryResult | undefined> {
  if (!shouldNotify(input.config, input.event.type)) {
    return undefined;
  }

  try {
    const result = await input.adapter.notify(buildNotificationMessage(input.event));
    if (result.status === "skipped") {
      await input.logger.error(
        formatFailureRecord({
          source: "notifications",
          message: `Notification skipped: ${result.reason ?? "unknown reason"}`
        })
      );
    }
    if (result.status === "failed") {
      await input.logger.error(
        formatFailureRecord({
          source: "notifications",
          message: `Notification failed: ${result.reason ?? "unknown reason"}`
        })
      );
    }
    return result;
  } catch (error) {
    const reason = sanitizeText(error instanceof Error ? error.message : String(error));
    await input.logger.error(
      formatFailureRecord({
        source: "notifications",
        message: `Notification failed: ${reason}`
      })
    );
    return { status: "failed", reason };
  }
}
