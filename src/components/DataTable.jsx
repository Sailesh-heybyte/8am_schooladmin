import { useState, useEffect } from "react";
import emptySearchIcon from "../assets/emptySearch.png";
import "./DataTable.scss";

const PAGE_SIZE = 10;

function compareValues(a, b, direction) {
  const aEmpty = a === null || a === undefined || a === "";
  const bEmpty = b === null || b === undefined || b === "";

  if (aEmpty && bEmpty) return 0;
  if (aEmpty) return 1;
  if (bEmpty) return -1;

  let comparison;
  if (typeof a === "number" && typeof b === "number") {
    comparison = a - b;
  } else if (typeof a === "boolean" && typeof b === "boolean") {
    comparison = a === b ? 0 : a ? 1 : -1;
  } else {
    comparison = String(a).toLowerCase().localeCompare(String(b).toLowerCase());
  }

  return direction === "desc" ? -comparison : comparison;
}

export default function DataTable({
  headers,
  rows,
  sortValues,
  footer,
  itemLabel,
  totalCount,
  withoutFilter = true,
  onRowClick,
  className = "",
}) {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ index: null, direction: null });

  const hasValidSortValues =
    Array.isArray(sortValues) && sortValues.length === rows.length;

  useEffect(() => {
    setPage(1);
  }, [rows.length]);

  useEffect(() => {
    setPage(1);
  }, [sort.index, sort.direction]);

  const handleSortClick = (columnIndex) => {
    setSort((prev) => {
      if (prev.index !== columnIndex) {
        return { index: columnIndex, direction: "asc" };
      }
      if (prev.direction === "asc") {
        return { index: columnIndex, direction: "desc" };
      }
      return { index: null, direction: null };
    });
  };

  const sortedIndices = (() => {
    const indices = Array.from({ length: rows.length }, (_, i) => i);
    if (!hasValidSortValues || sort.index === null || !sort.direction) {
      return indices;
    }
    return indices.sort((indexA, indexB) => {
      const valA = sortValues[indexA][sort.index];
      const valB = sortValues[indexB][sort.index];
      return compareValues(valA, valB, sort.direction);
    });
  })();

  const totalPages = Math.ceil(sortedIndices.length / PAGE_SIZE);
  const currentPage = Math.min(page, Math.max(totalPages, 1));
  const visibleIndices = sortedIndices.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const renderFooterText = () => {
    if (footer) {
      return footer;
    }
    if (itemLabel) {
      if (rows.length === 0) {
        return `No ${itemLabel}`;
      }
      const start = (currentPage - 1) * PAGE_SIZE + 1;
      const end = Math.min(currentPage * PAGE_SIZE, rows.length);
      const filtered =
        totalCount !== undefined &&
        totalCount !== null &&
        totalCount !== rows.length
          ? ` (filtered from ${totalCount})`
          : "";
      return `Showing ${start}–${end} of ${rows.length} ${itemLabel}${filtered}`;
    }
    return `Showing ${visibleIndices.length} of ${rows.length}`;
  };

  const showFooter = Boolean(footer || itemLabel || rows.length > 0);

  return (
    <div
      className={`table-card ${withoutFilter ? "without-filter" : ""} ${className}`}
    >
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              {headers.map((header, index) => {
                const isSortable =
                  hasValidSortValues &&
                  typeof header === "object" &&
                  header !== null &&
                  Boolean(header.sortKey);
                const label =
                  typeof header === "object" && header !== null
                    ? header.label
                    : header;
                const headerKey =
                  typeof header === "object" && header !== null
                    ? header.label || header.sortKey || index
                    : header;

                return (
                  <th key={headerKey}>
                    {isSortable ? (
                      <button
                        type="button"
                        className={`sort-header-btn ${
                          sort.index === index && sort.direction
                            ? "is-sorted"
                            : ""
                        }`}
                        onClick={() => handleSortClick(index)}
                      >
                        <span>{label}</span>
                        <i
                          className={`bi ${
                            sort.index === index
                              ? sort.direction === "asc"
                                ? "bi-chevron-up"
                                : sort.direction === "desc"
                                  ? "bi-chevron-down"
                                  : "bi-chevron-expand"
                              : "bi-chevron-expand"
                          }`}
                        />
                      </button>
                    ) : (
                      label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              visibleIndices.map((originalIndex) => {
                const row = rows[originalIndex];
                return (
                  <tr
                    key={originalIndex}
                    className={onRowClick ? "table-row-clickable" : ""}
                    onClick={(event) => {
                      if (
                        onRowClick &&
                        !event.target.closest("button, a, input, select")
                      ) {
                        onRowClick(originalIndex);
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
                );
              })
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
      {showFooter && (
        <div className="pagination">
          <span>{renderFooterText()}</span>
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
