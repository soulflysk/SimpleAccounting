interface Props {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  disabled?: boolean;
  onChange: (page: number) => void;
}

function buildPages(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "...")[] = [1];
  if (current > 4) pages.push("...");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 3) pages.push("...");
  pages.push(total);
  return pages;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  disabled,
  onChange,
}: Props) {
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="d-flex justify-content-between align-items-center mt-3">
      <div className="text-muted">
        แสดง {start} - {end} จากทั้งหมด {totalItems} รายการ
      </div>

      {totalPages > 1 && (
        <nav aria-label="Transaction pagination">
          <ul className="pagination mb-0">
            <li className={`page-item ${currentPage <= 1 ? "disabled" : ""}`}>
              <button
                type="button"
                className="page-link"
                disabled={disabled || currentPage <= 1}
                onClick={() => onChange(currentPage - 1)}
              >
                ก่อนหน้า
              </button>
            </li>

            {buildPages(currentPage, totalPages).map((p, i) =>
              p === "..." ? (
                <li key={`gap-${i}`} className="page-item disabled">
                  <span className="page-link">…</span>
                </li>
              ) : (
                <li
                  key={p}
                  className={`page-item ${p === currentPage ? "active" : ""}`}
                >
                  <button
                    type="button"
                    className="page-link"
                    disabled={disabled}
                    onClick={() => onChange(p)}
                  >
                    {p}
                  </button>
                </li>
              )
            )}

            <li
              className={`page-item ${
                currentPage >= totalPages ? "disabled" : ""
              }`}
            >
              <button
                type="button"
                className="page-link"
                disabled={disabled || currentPage >= totalPages}
                onClick={() => onChange(currentPage + 1)}
              >
                ถัดไป
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}
