import { useRef, useState } from "react";

interface Props {
  onImport: (file: File) => Promise<void>;
}

export default function ImportExcel({ onImport }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = inputRef.current?.files?.[0];
    if (!file) return;

    setBusy(true);
    try {
      await onImport(file);
      if (inputRef.current) inputRef.current.value = "";
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-header">
        <strong>Import Excel</strong>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="row align-items-end">
            <div className="col-md-8">
              <label className="form-label">เลือกไฟล์ Excel</label>
              <input
                ref={inputRef}
                type="file"
                className="form-control"
                accept=".xlsx"
                required
              />
            </div>
            <div className="col-md-4">
              <button type="submit" className="btn btn-success" disabled={busy}>
                {busy ? "กำลัง Import..." : "Import Excel"}
              </button>
            </div>
          </div>
        </form>

        <div className="mt-3">
          <small className="text-muted">
            รูปแบบ Excel: วันที่ | ประเภท | รายการ | ราคาต่อหน่วย |
          </small>
        </div>
      </div>
    </div>
  );
}
