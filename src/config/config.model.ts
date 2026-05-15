import { z } from "zod";
import { DEFAULT_DAILY_AT, DEFAULT_TAG, DEFAULT_TASK_NAME } from "../cli/command-registry.js";

export const hhmmSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Expected time in HH:mm 24-hour format");

export const schedulerConfigSchema = z.object({
  enabled: z.boolean().default(false),
  type: z.literal("windows-task-scheduler").default("windows-task-scheduler"),
  dailyAt: hhmmSchema.default(DEFAULT_DAILY_AT),
  taskName: z.string().min(1).default(DEFAULT_TASK_NAME)
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
    defaultTag: z.string().min(1).default(DEFAULT_TAG),
    scheduler: schedulerConfigSchema.optional(),
    accounts: z.array(accountMappingSchema).default([])
  })
  .passthrough();

export const schedulerInstallOptionsSchema = z.object({
  dailyAt: hhmmSchema.default(DEFAULT_DAILY_AT),
  taskName: z.string().min(1).default(DEFAULT_TASK_NAME),
  config: z.string().optional()
});

export type SchedulerConfig = z.infer<typeof schedulerConfigSchema>;
export type AccountMapping = z.infer<typeof accountMappingSchema>;
export type AppConfig = z.infer<typeof appConfigSchema>;
export type SchedulerInstallOptions = z.infer<typeof schedulerInstallOptionsSchema>;

export function parseAppConfig(input: unknown): AppConfig {
  return appConfigSchema.parse(input);
}
