export type TransactionType = "Income" | "Expense";

export interface Transaction {
  id: number;
  transactionDate: string; // yyyy-MM-dd
  type: TransactionType;
  description: string;
  unitPrice: number;
  totalAmount: number;
  isDisabled: boolean;
}

export interface Summary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface PagedTransactions {
  items: Transaction[];
  pageNumber: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  summary: Summary;
}

export interface TransactionResult {
  transaction: Transaction;
  summary: Summary;
}

export interface ImportResult {
  imported: number;
  summary: Summary;
}

export interface SaveTransactionRequest {
  transactionDate: string;
  type: TransactionType;
  description: string;
  unitPrice: number;
}
