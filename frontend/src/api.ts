import type {
  ImportResult,
  PagedTransactions,
  SaveTransactionRequest,
  Summary,
  TransactionResult,
} from "./types";

// dev: ใช้ proxy ของ Vite (/api) | production: ตั้ง VITE_API_URL เช่น https://api.example.com
const BASE = (import.meta.env.VITE_API_URL ?? "") + "/api/transactions";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      message = body?.message ?? body?.title ?? message;
    } catch {
      /* ไม่ใช่ JSON */
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: body === undefined ? undefined : JSON.stringify(body),
});

export const api = {
  getPage: (pageNumber: number) =>
    request<PagedTransactions>(`${BASE}?pageNumber=${pageNumber}`),

  create: (data: SaveTransactionRequest) =>
    request<TransactionResult>(BASE, json("POST", data)),

  update: (id: number, data: SaveTransactionRequest) =>
    request<TransactionResult>(`${BASE}/${id}`, json("PUT", data)),

  remove: (id: number) => request<Summary>(`${BASE}/${id}`, json("DELETE")),

  toggleDisabled: (id: number) =>
    request<TransactionResult>(`${BASE}/${id}/toggle-disabled`, json("POST")),

  importExcel: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<ImportResult>(`${BASE}/import`, {
      method: "POST",
      body: form,
    });
  },
};
