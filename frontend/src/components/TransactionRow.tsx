import { useState } from "react";
import type {
  SaveTransactionRequest,
  Transaction,
  TransactionType,
} from "../types";
import { formatDate, formatNumber } from "../utils";

interface Props {
  item: Transaction;
  onSave: (id: number, data: SaveTransactionRequest) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onToggle: (id: number) => Promise<void>;
}

export default function TransactionRow({
  item,
  onSave,
  onDelete,
  onToggle,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  // ค่าที่กำลังแก้ไข (ยกเลิก = ทิ้งค่าเหล่านี้)
  const [date, setDate] = useState(item.transactionDate);
  const [type, setType] = useState<TransactionType>(item.type);
  const [description, setDescription] = useState(item.description);
  const [unitPrice, setUnitPrice] = useState(String(item.unitPrice));

  function startEdit() {
    setDate(item.transactionDate);
    setType(item.type);
    setDescription(item.description);
    setUnitPrice(String(item.unitPrice));
    setEditing(true);
  }

  async function handleSave() {
    setBusy(true);
    try {
      await onSave(item.id, {
        transactionDate: date,
        type,
        description,
        unitPrice: Number(unitPrice) || 0,
      });
      setEditing(false);
    } catch {
      // แสดง error ที่ App แล้ว — อยู่ในโหมดแก้ไขต่อ
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("ต้องการลบรายการนี้หรือไม่?")) return;
    setBusy(true);
    try {
      await onDelete(item.id);
    } catch {
      setBusy(false);
    }
  }

  async function handleToggle() {
    setBusy(true);
    try {
      await onToggle(item.id);
    } finally {
      setBusy(false);
    }
  }

  return (
    <tr className={item.isDisabled ? "disabled-row" : ""}>
      <td className="text-center">
        <input
          type="checkbox"
          className="form-check-input"
          checked={item.isDisabled}
          disabled={busy}
          onChange={handleToggle}
        />
      </td>

      <td>
        {editing ? (
          <input
            type="date"
            className="form-control"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        ) : (
          formatDate(item.transactionDate)
        )}
      </td>

      <td>
        {editing ? (
          <select
            className="form-select"
            value={type}
            onChange={(e) => setType(e.target.value as TransactionType)}
          >
            <option value="Income">รายรับ</option>
            <option value="Expense">รายจ่าย</option>
          </select>
        ) : item.type === "Income" ? (
          <span className="badge bg-success">รายรับ</span>
        ) : (
          <span className="badge bg-danger">รายจ่าย</span>
        )}
      </td>

      <td>
        {editing ? (
          <input
            type="text"
            className="form-control"
            maxLength={200}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        ) : (
          item.description
        )}
      </td>

      <td className="text-end">
        {editing ? (
          <input
            type="number"
            className="form-control"
            min={0}
            step={0.01}
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
          />
        ) : (
          formatNumber(item.unitPrice)
        )}
      </td>

      <td>
        {editing ? (
          <>
            <button
              type="button"
              className="btn btn-sm btn-success me-1"
              disabled={busy}
              onClick={handleSave}
            >
              บันทึก
            </button>
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              disabled={busy}
              onClick={() => setEditing(false)}
            >
              ยกเลิก
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="btn btn-sm btn-warning me-1"
              disabled={busy}
              onClick={startEdit}
            >
              แก้ไข
            </button>
            <button
              type="button"
              className="btn btn-sm btn-danger"
              disabled={busy}
              onClick={handleDelete}
            >
              ลบ
            </button>
          </>
        )}
      </td>
    </tr>
  );
}
