export type MonoAccount = {
  id: string;
  sendId?: string;
  balance?: number;
  creditLimit?: number;
  type?: string;
  currencyCode?: number;
  cashbackType?: string;
  maskedPan?: string[];
  iban?: string;
};

export type MonoClientInfo = {
  clientId?: string;
  name?: string;
  webHookUrl?: string;
  permissions?: string;
  accounts?: MonoAccount[];
  jars?: unknown[];
  clients?: Array<{
    clientId?: string;
    name?: string;
    accounts?: MonoAccount[];
  }>;
};

export type MonoStatementItem = {
  id: string;
  time: number;
  description?: string;
  mcc?: number;
  originalMcc?: number;
  hold?: boolean;
  amount: number;
  operationAmount?: number;
  currencyCode?: number;
  commissionRate?: number;
  cashbackAmount?: number;
  balance?: number;
  comment?: string;
  receiptId?: string;
  invoiceId?: string;
  counterEdrpou?: string;
  counterIban?: string;
  counterName?: string;
};

export type MonobankSource = {
  accountId: string;
  displayName: string;
  type?: string;
  currencyCode: number;
  currency: string;
  balanceMinor?: number;
  maskedPan?: string;
  maskedIban?: string;
  isFop?: boolean;
};
