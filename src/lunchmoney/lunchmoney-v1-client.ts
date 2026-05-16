import { EXIT_CODES } from "../cli/command-registry.js";
import { CliError } from "../cli/errors.js";
import { sanitizeText } from "../utils/masking.js";
import type { BudgetProvider } from "./budget-provider.js";
import type {
  BudgetAccount,
  CreateBudgetAccountInput,
  ImportTransactionsInput,
  ImportTransactionsResult,
  LunchMoneyInsertTransaction
} from "./lunchmoney-types.js";

type FetchLike = typeof fetch;

export class LunchMoneyV1Client implements BudgetProvider {
  constructor(
    private readonly token: string,
    private readonly options: {
      baseUrl?: string;
      fetchFn?: FetchLike;
    } = {}
  ) {}

  async listAccounts(): Promise<BudgetAccount[]> {
    const response = await this.request<unknown>("/v1/assets");
    const assets = Array.isArray(response) ? response : (response as { assets?: unknown[] }).assets ?? [];
    return assets.map((asset) => toBudgetAccount(asset as Record<string, unknown>));
  }

  async createAccount(input: CreateBudgetAccountInput): Promise<BudgetAccount> {
    const response = await this.request<unknown>("/v1/assets", {
      method: "POST",
      body: JSON.stringify({
        type_name: input.typeName,
        name: input.name,
        balance: input.balance,
        currency: input.currency,
        institution_name: input.institutionName
      })
    });
    const asset = (response as { asset?: unknown }).asset ?? response;
    return toBudgetAccount(asset as Record<string, unknown>);
  }

  async importTransactions(input: ImportTransactionsInput): Promise<ImportTransactionsResult> {
    let inserted = 0;
    let submitted = 0;

    for (const transactions of chunkTransactions(input.transactions, 500)) {
      submitted += transactions.length;
      const response = await this.request<Record<string, unknown>>("/v1/transactions", {
        method: "POST",
        body: JSON.stringify({
          transactions,
          apply_rules: input.applyRules,
          skip_duplicates: input.skipDuplicates,
          check_for_recurring: input.checkForRecurring,
          debit_as_negative: input.debitAsNegative,
          skip_balance_update: input.skipBalanceUpdate
        })
      });
      inserted += inferInsertedCount(response, transactions.length);
    }

    return {
      submitted,
      inserted,
      duplicatesOrIgnored: Math.max(0, submitted - inserted)
    };
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const fetchFn = this.options.fetchFn ?? fetch;
    const baseUrl = this.options.baseUrl ?? "https://dev.lunchmoney.app";
    const response = await fetchFn(`${baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        ...init.headers
      }
    });

    if (!response.ok) {
      const body = sanitizeText(await response.text().catch(() => ""));
      throw new CliError(
        `Lunch Money request failed: HTTP ${response.status}${body ? ` ${body}` : ""}`,
        EXIT_CODES.EXTERNAL_ERROR
      );
    }

    return (await response.json()) as T;
  }
}

export function chunkTransactions(
  transactions: LunchMoneyInsertTransaction[],
  chunkSize = 500
): LunchMoneyInsertTransaction[][] {
  const chunks: LunchMoneyInsertTransaction[][] = [];
  for (let index = 0; index < transactions.length; index += chunkSize) {
    chunks.push(transactions.slice(index, index + chunkSize));
  }
  return chunks;
}

function toBudgetAccount(asset: Record<string, unknown>): BudgetAccount {
  return {
    id: Number(asset.id ?? asset.asset_id),
    name: String(asset.name ?? ""),
    currency: String(asset.currency ?? "").toLowerCase(),
    typeName: typeof asset.type_name === "string" ? asset.type_name : undefined,
    institutionName:
      typeof asset.institution_name === "string" ? asset.institution_name : undefined,
    balance: asset.balance === undefined ? undefined : String(asset.balance)
  };
}

function inferInsertedCount(response: Record<string, unknown>, fallback: number): number {
  if (typeof response.inserted === "number") {
    return response.inserted;
  }
  if (typeof response.inserted_count === "number") {
    return response.inserted_count;
  }
  if (Array.isArray(response.transaction_ids)) {
    return response.transaction_ids.length;
  }
  if (Array.isArray(response.ids)) {
    return response.ids.length;
  }
  return fallback;
}
