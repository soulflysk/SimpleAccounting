import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import ImportExcel from "./components/ImportExcel";
import Pagination from "./components/Pagination";
import SummaryCards from "./components/SummaryCards";
import TransactionForm from "./components/TransactionForm";
import TransactionRow from "./components/TransactionRow";
import type {
  PagedTransactions,
  SaveTransactionRequest,
  Summary,
} from "./types";

const emptySummary: Summary = { totalIncome: 0, totalExpense: 0, balance: 0 };

function pageFromUrl(): number {
  const value = new URLSearchParams(window.location.search).get("pageNumber");
  const page = parseInt(value ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

export default function App() {
  const [data, setData] = useState<PagedTransactions | null>(null);
  const [page, setPage] = useState(pageFromUrl());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    kind: "success" | "danger";
    text: string;
  } | null>(null);

  const summary = data?.summary ?? emptySummary;

  const load = useCallback(async (pageNumber: number) => {
    setLoading(true);
    try {
      const result = await api.getPage(pageNumber);
      setData(result);
      // server อาจปรับเลขหน้า (เช่น เกินจำนวนหน้า)
      setPage(result.pageNumber);
    } catch (e) {
      setMessage({ kind: "danger", text: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ปุ่ม Back/Forward ของ browser
  useEffect(() => {
    function onPopState() {
      load(pageFromUrl());
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [load]);

  function changePage(next: number) {
    const url = new URL(window.location.href);
    url.searchParams.set("pageNumber", String(next));
    window.history.pushState({ pageNumber: next }, "", url);
    load(next);
  }

  // helper: แสดง error แล้ว throw ต่อให้ component ลูกรู้ว่าไม่สำเร็จ
  async function run<T>(action: () => Promise<T>): Promise<T> {
    setMessage(null);
    try {
      return await action();
    } catch (e) {
      setMessage({ kind: "danger", text: (e as Error).message });
      throw e;
    }
  }

  async function handleCreate(request: SaveTransactionRequest) {
    await run(() => api.create(request));
    setMessage({ kind: "success", text: "บันทึกรายการเรียบร้อยแล้ว" });
    changePage(1); // รายการใหม่เรียงอยู่หน้าแรก
  }

  async function handleSave(id: number, request: SaveTransactionRequest) {
    const result = await run(() => api.update(id, request));
    setData((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.map((x) =>
              x.id === id ? result.transaction : x
            ),
            summary: result.summary,
          }
        : prev
    );
  }

  async function handleToggle(id: number) {
    const result = await run(() => api.toggleDisabled(id));
    setData((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.map((x) =>
              x.id === id ? result.transaction : x
            ),
            summary: result.summary,
          }
        : prev
    );
  }

  async function handleDelete(id: number) {
    await run(() => api.remove(id));
    setMessage({ kind: "success", text: "ลบรายการเรียบร้อยแล้ว" });
    await load(page);
  }

  async function handleImport(file: File) {
    try {
      const result = await run(() => api.importExcel(file));
      setMessage({
        kind: "success",
        text: `Import สำเร็จ ${result.imported} รายการ`,
      });
      await load(1);
    } catch {
      /* error แสดงแล้ว */
    }
  }

  return (
    <div className="container-fluid mt-4 mb-5">
      <ImportExcel onImport={handleImport} />

      <h2 className="mb-4">โปรแกรมรายรับ - รายจ่าย</h2>

      {message && (
        <div
          className={`alert alert-${message.kind} alert-dismissible`}
          role="alert"
        >
          {message.text}
          <button
            type="button"
            className="btn-close"
            aria-label="Close"
            onClick={() => setMessage(null)}
          />
        </div>
      )}

      <SummaryCards summary={summary} />

      <TransactionForm onCreate={handleCreate} />

      <div className="card shadow-sm">
        <div className="card-header">
          <strong>รายการทั้งหมด</strong>
        </div>
        <div className="card-body">
          <div
            className="table-responsive"
            style={{ opacity: loading ? 0.5 : 1 }}
          >
            <table className="table table-bordered table-hover">
              <thead className="table-light">
                <tr>
                  <th className="text-center">ไม่รวม</th>
                  <th>วันที่</th>
                  <th>ประเภท</th>
                  <th>รายการ</th>
                  <th className="text-end">ราคาต่อหน่วย</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((item) => (
                  <TransactionRow
                    key={item.id}
                    item={item}
                    onSave={handleSave}
                    onDelete={handleDelete}
                    onToggle={handleToggle}
                  />
                ))}
                {data && data.items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-muted">
                      ยังไม่มีรายการ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {data && (
            <Pagination
              currentPage={data.pageNumber}
              totalPages={data.totalPages}
              totalItems={data.totalItems}
              pageSize={data.pageSize}
              disabled={loading}
              onChange={changePage}
            />
          )}
        </div>
      </div>
    </div>
  );
}
