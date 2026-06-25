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

export type LunchMoneyInsertTransaction = {
  date: string;
  amount: string;
  currency: string;
  payee: string;
  asset_id: number;
  status: "uncleared";
  external_id: string;
  tags: string[];
  notes?: string;
};

export type ImportTransactionsInput = {
  transactions: LunchMoneyInsertTransaction[];
  applyRules: false;
  skipDuplicates: true;
  checkForRecurring: false;
  debitAsNegative: true;
  skipBalanceUpdate: boolean;
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
