import type { Summary } from "../types";
import { formatNumber } from "../utils";

export default function SummaryCards({ summary }: { summary: Summary }) {
  return (
    <div className="row mb-4">
      <div className="col-md-4">
        <div className="card shadow-sm">
          <div className="card-body">
            <h6>รายรับทั้งหมด</h6>
            <h3 className="text-success">{formatNumber(summary.totalIncome)}</h3>
            <span>บาท</span>
          </div>
        </div>
      </div>

      <div className="col-md-4">
        <div className="card shadow-sm">
          <div className="card-body">
            <h6>รายจ่ายทั้งหมด</h6>
            <h3 className="text-danger">{formatNumber(summary.totalExpense)}</h3>
            <span>บาท</span>
          </div>
        </div>
      </div>

      <div className="col-md-4">
        <div className="card shadow-sm">
          <div className="card-body">
            <h6>คงเหลือ</h6>
            <h3>{formatNumber(summary.balance)}</h3>
            <span>บาท</span>
          </div>
        </div>
      </div>
    </div>
  );
}
