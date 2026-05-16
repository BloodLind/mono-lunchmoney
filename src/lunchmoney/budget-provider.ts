import type {
  BudgetAccount,
  CreateBudgetAccountInput,
  ImportTransactionsInput,
  ImportTransactionsResult
} from "./lunchmoney-types.js";

export interface BudgetProvider {
  listAccounts(): Promise<BudgetAccount[]>;
  createAccount(input: CreateBudgetAccountInput): Promise<BudgetAccount>;
  importTransactions(input: ImportTransactionsInput): Promise<ImportTransactionsResult>;
}
