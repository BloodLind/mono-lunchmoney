import { z } from "zod";
import { DEFAULT_DAILY_AT, DEFAULT_TAG, DEFAULT_TASK_NAME } from "../cli/command-registry.js";

export const hhmmSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Expected time in HH:mm 24-hour format");

export const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected date in YYYY-MM-DD format")
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  }, "Expected a real calendar date");

export const schedulerConfigSchema = z.object({
  enabled: z.boolean().default(false),
  type: z.literal("windows-task-scheduler").default("windows-task-scheduler"),
  dailyAt: hhmmSchema.default(DEFAULT_DAILY_AT),
  taskName: z.string().min(1).default(DEFAULT_TASK_NAME)
});

export const notificationConfigSchema = z.object({
  enabled: z.boolean().default(false),
  notifyOnSuccess: z.boolean().default(false),
  notifyOnFailure: z.boolean().default(true),
  notifyOnPartialFailure: z.boolean().default(true),
  notifyOnLockHeld: z.boolean().default(true)
});

export const accountMappingSchema = z
  .object({
    enabled: z.boolean().default(true),
    monoAccountId: z.string().min(1),
    monoDisplayName: z.string().min(1),
    monoType: z.string().optional(),
    monoCurrencyCode: z.number().int(),
    currency: z.string().min(3),
    lunchMoneyAssetId: z.number().int(),
    lunchMoneyAccountName: z.string().min(1),
    tag: z.string().min(1).default(DEFAULT_TAG),
    externalIdPrefix: z.string().min(1)
  })
  .passthrough();

export const appConfigSchema = z
  .object({
    schemaVersion: z.number().int().positive().default(1),
    lunchMoneyApiVersion: z.literal("v1").default("v1"),
    lookbackDays: z.number().int().min(1).max(31).default(31),
    baselineDate: dateOnlySchema.optional(),
    defaultTag: z.string().min(1).default(DEFAULT_TAG),
    scheduler: schedulerConfigSchema.optional(),
    notifications: notificationConfigSchema.default({
      enabled: false,
      notifyOnSuccess: false,
      notifyOnFailure: true,
      notifyOnPartialFailure: true,
      notifyOnLockHeld: true
    }),
    accounts: z.array(accountMappingSchema).default([])
  })
  .passthrough();

export const schedulerInstallOptionsSchema = z.object({
  dailyAt: hhmmSchema.default(DEFAULT_DAILY_AT),
  taskName: z.string().min(1).default(DEFAULT_TASK_NAME),
  config: z.string().optional()
});

export type SchedulerConfig = z.infer<typeof schedulerConfigSchema>;
export type NotificationConfig = z.infer<typeof notificationConfigSchema>;
export type AccountMapping = z.infer<typeof accountMappingSchema>;
export type AppConfig = z.infer<typeof appConfigSchema>;
export type SchedulerInstallOptions = z.infer<typeof schedulerInstallOptionsSchema>;

export function parseAppConfig(input: unknown): AppConfig {
  return appConfigSchema.parse(input);
}

export function getEnabledAccountMappings(config: AppConfig): AccountMapping[] {
  return config.accounts.filter((account) => account.enabled);
}

export function assertHasEnabledAccountMapping(config: AppConfig): void {
  if (getEnabledAccountMappings(config).length === 0) {
    throw new Error("Config must contain at least one enabled account mapping.");
  }
}
