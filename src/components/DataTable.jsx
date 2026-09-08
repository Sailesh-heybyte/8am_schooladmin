import { useState } from "react";
import emptySearchIcon from "../assets/emptySearch.png";

const PAGE_SIZE = 10;

export default function DataTable({
  headers,
  rows,
  footer,
  withoutFilter = true,
  onRowClick,
  className = "",
}) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const currentPage = Math.min(page, Math.max(totalPages, 1));
  const visibleRows = rows.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <div
      className={`table-card ${withoutFilter ? "without-filter" : ""} ${className}`}
    >
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              {headers.map((header) => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              visibleRows.map((row, index) => (
                <tr
                  key={index}
                  className={onRowClick ? "table-row-clickable" : ""}
                  onClick={(event) => {
                    if (
                      onRowClick &&
                      !event.target.closest("button, a, input, select")
                    ) {
                      onRowClick((currentPage - 1) * PAGE_SIZE + index);
                    }
                  }}
                >
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className={
                        cellIndex === headers.length - 1 ? "actions-cell" : ""
                      }
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td className="table-empty-cell" colSpan={headers.length}>
                  <div className="table-empty">
                    <img
                      src={emptySearchIcon}
                      alt="No matching records found"
                    />
                    <span>No matching records found.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {(footer || rows.length > PAGE_SIZE) && (
        <div className="pagination">
          <span>
            {footer || `Showing ${visibleRows.length} of ${rows.length}`}
          </span>
          {rows.length > PAGE_SIZE && (
            <div>
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setPage((value) => Math.max(value - 1, 1))}
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                (pageNumber) => (
                  <button
                    type="button"
                    className={currentPage === pageNumber ? "selected" : ""}
                    key={pageNumber}
                    onClick={() => setPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                ),
              )}
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setPage((value) => Math.min(value + 1, totalPages))
                }
              >
                ›
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
