import type { NotificationConfig } from "../config/config.model.js";

export const DEFAULT_NOTIFICATION_CONFIG: NotificationConfig = {
  enabled: false,
  notifyOnSuccess: false,
  notifyOnFailure: true,
  notifyOnPartialFailure: true,
  notifyOnLockHeld: true
};

export function getNotificationConfig(config: Partial<NotificationConfig> | undefined): NotificationConfig {
  return {
    ...DEFAULT_NOTIFICATION_CONFIG,
    ...config
  };
}

export function enableNotifications(options: {
  success?: boolean;
  failureOnly?: boolean;
} = {}): NotificationConfig {
  return {
    ...DEFAULT_NOTIFICATION_CONFIG,
    enabled: true,
    notifyOnSuccess: options.failureOnly ? false : Boolean(options.success)
  };
}

export function disableNotifications(): NotificationConfig {
  return {
    ...DEFAULT_NOTIFICATION_CONFIG,
    enabled: false
  };
}

export function shouldNotify(
  config: Partial<NotificationConfig> | undefined,
  eventType: string
): boolean {
  const notifications = getNotificationConfig(config);
  if (!notifications.enabled) {
    return false;
  }

  switch (eventType) {
    case "sync-success":
      return notifications.notifyOnSuccess;
    case "sync-failure":
      return notifications.notifyOnFailure;
    case "sync-partial-failure":
      return notifications.notifyOnPartialFailure;
    case "lock-held":
      return notifications.notifyOnLockHeld;
    default:
      return false;
  }
}
