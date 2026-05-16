import type { BudgetProvider } from "../../src/lunchmoney/budget-provider.js";
import type {
  BudgetAccount,
  CreateBudgetAccountInput,
  ImportTransactionsInput,
  ImportTransactionsResult
} from "../../src/lunchmoney/lunchmoney-types.js";
import type { MonoAccount, MonoClientInfo, MonoStatementItem } from "../../src/monobank/mono-types.js";
import type { StatementClient } from "../../src/monobank/statement-fetcher.js";

export function monoStatementItem(overrides: Partial<MonoStatementItem> = {}): MonoStatementItem {
  return {
    id: "tx-1",
    time: Math.floor(new Date("2026-05-15T10:00:00").getTime() / 1000),
    description: "Coffee",
    amount: -42050,
    currencyCode: 980,
    balance: 100000,
    mcc: 5814,
    hold: false,
    ...overrides
  };
}

export function monoTransferFromIgnoredSource(
  overrides: Partial<MonoStatementItem> = {}
): MonoStatementItem {
  return monoStatementItem({
    id: "transfer-from-ignored-source",
    description: "Transfer from card *2222",
    counterIban: "UA987654321098765432109876543",
    amount: 50000,
    ...overrides
  });
}

export function monoAccount(overrides: Partial<MonoAccount> = {}): MonoAccount {
  return {
    id: "mono-account-1",
    type: "black",
    currencyCode: 980,
    balance: 2543020,
    maskedPan: ["4444******1111"],
    iban: "UA123456789012345678901234567",
    ...overrides
  };
}

export function monoClientInfo(overrides: Partial<MonoClientInfo> = {}): MonoClientInfo {
  return {
    accounts: [monoAccount()],
    ...overrides
  };
}

export function budgetAccount(overrides: Partial<BudgetAccount> = {}): BudgetAccount {
  return {
    id: 111,
    name: "Monobank Black UAH",
    currency: "uah",
    typeName: "cash",
    institutionName: "Monobank",
    balance: "25430.20",
    ...overrides
  };
}

export function fakeStatementClient(pages: MonoStatementItem[][]): StatementClient & { calls: unknown[] } {
  const calls: unknown[] = [];
  return {
    calls,
    async getStatement(accountId: string, from: number, to: number) {
      calls.push({ accountId, from, to });
      return pages.shift() ?? [];
    }
  };
}

export function fakeBudgetProvider(accounts: BudgetAccount[] = [budgetAccount()]): BudgetProvider & {
  created: CreateBudgetAccountInput[];
  imports: ImportTransactionsInput[];
} {
  return {
    created: [],
    imports: [],
    async listAccounts() {
      return accounts;
    },
    async createAccount(input: CreateBudgetAccountInput) {
      this.created.push(input);
      const created = budgetAccount({ id: 222, name: input.name, currency: input.currency });
      accounts.push(created);
      return created;
    },
    async importTransactions(input: ImportTransactionsInput): Promise<ImportTransactionsResult> {
      this.imports.push(input);
      return { submitted: input.transactions.length, inserted: input.transactions.length, duplicatesOrIgnored: 0 };
    }
  };
}
