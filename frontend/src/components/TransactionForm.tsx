import { useState } from "react";
import type { SaveTransactionRequest, TransactionType } from "../types";
import { todayString } from "../utils";

interface Props {
  onCreate: (data: SaveTransactionRequest) => Promise<void>;
}

export default function TransactionForm({ onCreate }: Props) {
  const [date, setDate] = useState(todayString());
  const [type, setType] = useState<TransactionType>("Income");
  const [description, setDescription] = useState("");
  const [unitPrice, setUnitPrice] = useState("0");
  const [busy, setBusy] = useState(false);

  function reset() {
    setDate(todayString());
    setType("Income");
    setDescription("");
    setUnitPrice("0");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await onCreate({
        transactionDate: date,
        type,
        description,
        unitPrice: Number(unitPrice) || 0,
      });
      reset();
    } catch {
      // ข้อความ error แสดงที่ App แล้ว — คงค่าในฟอร์มไว้
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-header">
        <strong>เพิ่มรายการ</strong>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit} onReset={reset}>
          <div className="row">
            <div className="col-md-2 mb-3">
              <label className="form-label">วันที่</label>
              <input
                type="date"
                className="form-control"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="col-md-2 mb-3">
              <label className="form-label">ประเภท</label>
              <select
                className="form-select"
                value={type}
                onChange={(e) => setType(e.target.value as TransactionType)}
              >
                <option value="Income">รายรับ</option>
                <option value="Expense">รายจ่าย</option>
              </select>
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">รายการ</label>
              <input
                type="text"
                className="form-control"
                placeholder="เช่น เงินเดือน"
                maxLength={200}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="row">
            <div className="col-md-3 mb-3">
              <label className="form-label">ราคาต่อหน่วย</label>
              <input
                type="number"
                className="form-control"
                min={0}
                step={0.01}
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary me-2" disabled={busy}>
            บันทึกรายการ
          </button>
          <button type="reset" className="btn btn-secondary">
            ล้างข้อมูล
          </button>
        </form>
      </div>
    </div>
  );
}
