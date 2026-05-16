import { EXIT_CODES } from "../cli/command-registry.js";
import { CliError } from "../cli/errors.js";
import { sanitizeText } from "../utils/masking.js";
import { currencyCodeToIso } from "./currency-map.js";
import type { MonoAccount, MonoClientInfo, MonobankSource, MonoStatementItem } from "./mono-types.js";

export type FetchLike = typeof fetch;

export class MonobankClient {
  constructor(
    private readonly token: string,
    private readonly options: {
      baseUrl?: string;
      fetchFn?: FetchLike;
    } = {}
  ) {}

  async getClientInfo(): Promise<MonoClientInfo> {
    return this.request<MonoClientInfo>("/personal/client-info");
  }

  async getStatement(accountId: string, from: number, to: number): Promise<MonoStatementItem[]> {
    return this.request<MonoStatementItem[]>(
      `/personal/statement/${encodeURIComponent(accountId)}/${from}/${to}`
    );
  }

  private async request<T>(path: string): Promise<T> {
    const fetchFn = this.options.fetchFn ?? fetch;
    const baseUrl = this.options.baseUrl ?? "https://api.monobank.ua";
    const response = await fetchFn(`${baseUrl}${path}`, {
      headers: {
        "X-Token": this.token
      }
    });

    if (!response.ok) {
      const body = sanitizeText(await response.text().catch(() => ""));
      throw new CliError(
        `Monobank request failed: HTTP ${response.status}${body ? ` ${body}` : ""}`,
        EXIT_CODES.EXTERNAL_ERROR
      );
    }

    return (await response.json()) as T;
  }
}

export function flattenMonobankSources(info: MonoClientInfo): MonobankSource[] {
  const sources: MonobankSource[] = [];

  for (const account of info.accounts ?? []) {
    sources.push(toSource(account, false));
  }

  for (const client of info.clients ?? []) {
    for (const account of client.accounts ?? []) {
      sources.push(toSource(account, true, client.name));
    }
  }

  return sources.filter((source) => source.accountId.length > 0);
}

function toSource(account: MonoAccount, isFop: boolean, ownerName?: string): MonobankSource {
  const currencyCode = account.currencyCode ?? 980;
  const currency = currencyCodeToIso(currencyCode);
  const pan = account.maskedPan?.[0];
  const type = account.type ?? (isFop ? "fop" : "account");
  const suffix = pan ? ` ${pan}` : "";
  const owner = ownerName ? `${ownerName} ` : "";

  return {
    accountId: account.id,
    displayName: `${owner}${type.toUpperCase()} ${currency.toUpperCase()}${suffix}`.trim(),
    type,
    currencyCode,
    currency,
    balanceMinor: account.balance,
    maskedPan: pan,
    maskedIban: account.iban,
    isFop
  };
}
