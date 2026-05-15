# Provider Adapter Contracts

## Token Provider

```ts
export type ProviderTokens = {
  monoToken: string;
  lunchMoneyToken: string;
};

export function resolveProviderTokens(env?: NodeJS.ProcessEnv): ProviderTokens;
```

**Rules**:

- Read `MONO_TOKEN` and `LUNCHMONEY_TOKEN`.
- Throw a user-facing error when either is missing.
- Never print or return sanitized placeholder values as real tokens.

## Monobank Client

```ts
export interface MonoClient {
  getClientInfo(): Promise<MonoClientInfo>;
  getStatement(accountId: string, from: number, to: number): Promise<MonoStatementItem[]>;
}
```

**HTTP contract**:

- Base URL: `https://api.monobank.ua`.
- Auth header: `X-Token: <MONO_TOKEN>`.
- `getClientInfo`: `GET /personal/client-info`.
- `getStatement`: `GET /personal/statement/{account}/{from}/{to}`.

**Behavior rules**:

- Do not log request headers.
- Convert non-2xx responses into typed provider errors with sanitized messages.
- Treat `401`, `403`, and `429` as external provider failures.

## Statement Fetcher

```ts
export interface StatementFetcher {
  fetchAll(accountId: string, from: number, to: number): Promise<MonoStatementItem[]>;
}
```

**Rules**:

- The requested window must not exceed 31 days plus 1 hour.
- Statement requests must be sequential.
- Wait at least 60 seconds between statement endpoint calls.
- If a page returns exactly 500 items, set the next `to` to oldest returned
  transaction time minus one second.
- Deduplicate returned items by Monobank transaction id before mapping.

## Budget Provider

```ts
export type BudgetAccount = {
  id: number;
  name: string;
  currency: string;
  typeName?: string;
  institutionName?: string;
  balance?: string;
};

export type CreateBudgetAccountInput = {
  name: string;
  currency: string;
  balance?: string;
  typeName: "cash" | "credit";
  institutionName?: string;
};

export type ImportTransactionsInput = {
  transactions: LunchMoneyInsertTransaction[];
  applyRules: false;
  skipDuplicates: true;
  checkForRecurring: false;
  debitAsNegative: true;
  skipBalanceUpdate: true;
};

export type ImportTransactionsResult = {
  submitted: number;
  inserted?: number;
  duplicatesOrIgnored?: number;
};

export interface BudgetProvider {
  listAccounts(): Promise<BudgetAccount[]>;
  createAccount(input: CreateBudgetAccountInput): Promise<BudgetAccount>;
  importTransactions(input: ImportTransactionsInput): Promise<ImportTransactionsResult>;
}
```

**Rules**:

- First implementation uses Lunch Money API v1 only.
- Commands depend on `BudgetProvider`, not on Lunch Money-specific field names.
- A later v2 migration must be isolated to a new provider adapter.

## Lunch Money v1 Adapter

**HTTP contract**:

- Base URL: `https://dev.lunchmoney.app`.
- Auth header: `Authorization: Bearer <LUNCHMONEY_TOKEN>`.
- Account listing: `GET /v1/assets`.
- Account creation: `POST /v1/assets`.
- Transaction import: `POST /v1/transactions`.

**Transaction import body**:

```json
{
  "transactions": [],
  "apply_rules": false,
  "skip_duplicates": true,
  "check_for_recurring": false,
  "debit_as_negative": true,
  "skip_balance_update": true
}
```

**Transaction item rules**:

- `asset_id` must be set.
- `plaid_account_id` must not be set.
- `status` must be `uncleared`.
- `external_id` must be deterministic and at most 75 characters.
- `tags` must contain the configured tag as a string.
- `notes` must be compact and at most 350 characters.
- Batch size must not exceed 500 transactions.

## Mapper Contract

```ts
export function mapMonoToLunchMoney(
  tx: MonoStatementItem,
  account: AccountMapping
): LunchMoneyInsertTransaction;
```

**Rules**:

- Use transaction timestamp converted to local `YYYY-MM-DD`.
- Convert minor-unit Monobank amounts to decimal strings.
- Select payee from `description`, then `counterName`, then `comment`, then
  `Monobank transaction`.
- Build notes as semicolon-separated key/value pairs.
- Include mapping's Lunch Money asset id and configured tag.
- Never mutate input transaction or account mapping.
