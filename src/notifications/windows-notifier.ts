import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { sanitizeText } from "../utils/masking.js";
import type {
  NotificationAdapter,
  NotificationDeliveryResult,
  NotificationMessage
} from "./notification-types.js";

const execFileAsync = promisify(execFile);

export type NotificationExecutor = (script: string) => Promise<string>;

export class WindowsNotifier implements NotificationAdapter {
  constructor(
    private readonly options: {
      platform?: NodeJS.Platform;
      executor?: NotificationExecutor;
    } = {}
  ) {}

  isSupported(): boolean {
    return (this.options.platform ?? process.platform) === "win32";
  }

  async notify(message: NotificationMessage): Promise<NotificationDeliveryResult> {
    if (!this.isSupported()) {
      return { status: "skipped", reason: "unsupported-platform" };
    }

    const title = sanitizeText(message.title);
    const body = sanitizeText(message.body);
    const script = buildNotificationScript({ ...message, title, body });
    const executor = this.options.executor ?? defaultNotificationExecutor;

    try {
      await executor(script);
      return { status: "delivered" };
    } catch (error) {
      return {
        status: "failed",
        reason: sanitizeText(error instanceof Error ? error.message : String(error))
      };
    }
  }
}

export async function defaultNotificationExecutor(script: string): Promise<string> {
  const { stdout } = await execFileAsync("powershell.exe", [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    script
  ]);
  return stdout;
}

function buildNotificationScript(message: NotificationMessage): string {
  const title = psQuote(message.title);
  const body = psQuote(message.body);
  return [
    "$ErrorActionPreference = 'Stop'",
    "if (Get-Command New-BurntToastNotification -ErrorAction SilentlyContinue) {",
    `New-BurntToastNotification -Text ${title}, ${body} | Out-Null`,
    "} else {",
    `Add-Type -AssemblyName System.Windows.Forms; $n = New-Object System.Windows.Forms.NotifyIcon; $n.Icon = [System.Drawing.SystemIcons]::Information; $n.Visible = $true; $n.BalloonTipTitle = ${title}; $n.BalloonTipText = ${body}; $n.ShowBalloonTip(5000); Start-Sleep -Milliseconds 500; $n.Dispose()`,
    "}"
  ].join("; ");
}

function psQuote(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}
