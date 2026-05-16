import type { NotificationConfig } from "../config/config.model.js";

export type NotificationSeverity = "info" | "warning" | "error";

export type NotificationMessage = {
  title: string;
  body: string;
  severity: NotificationSeverity;
};

export type NotificationDeliveryResult = {
  status: "delivered" | "skipped" | "failed";
  reason?: string;
};

export type NotificationEventType =
  | "sync-success"
  | "sync-failure"
  | "sync-partial-failure"
  | "lock-held"
  | "notification-failure";

export type NotificationEvent = {
  type: NotificationEventType;
  sourceCommand: "sync" | "backfill" | "scheduler" | "config";
  quiet: boolean;
  summary: string;
  details?: string;
  logPath?: string;
  occurredAt: Date;
};

export interface NotificationAdapter {
  isSupported(): boolean;
  notify(message: NotificationMessage): Promise<NotificationDeliveryResult>;
}

export type { NotificationConfig };
