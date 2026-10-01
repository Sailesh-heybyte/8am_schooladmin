import { useMemo, useState } from "react";
import DataTable from "./DataTable.jsx";
import { MAX_IMPORT_ROWS, downloadCsv, readCsvFile } from "../utils/csv.js";
import "../screens/Roles/RoleModal.scss";
import "./ImportModal.scss";

export default function ImportModal({
  title,
  description,
  note,
  itemLabel,
  templateFileName,
  templateRows,
  previewHeaders,
  isPreparing,
  prepareError,
  checkFile,
  onClose,
}) {
  const [fileName, setFileName] = useState("");
  const [fileError, setFileError] = useState("");
  const [checkedRows, setCheckedRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [isReading, setIsReading] = useState(false);
  const [showProblemsOnly, setShowProblemsOnly] = useState(false);

  const problemRows = useMemo(
    () => checkedRows.filter((row) => row.problems.length > 0),
    [checkedRows],
  );
  const readyCount = checkedRows.length - problemRows.length;
  const shownRows = showProblemsOnly ? problemRows : checkedRows;

  const handleFile = async (event) => {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file) return;

    setFileName(file.name);
    setFileError("");
    setCheckedRows([]);
    setShowProblemsOnly(false);

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setFileError("Please choose a .csv file. In Excel: File → Save As → CSV UTF-8.");
      return;
    }

    setIsReading(true);
    try {
      const result = await readCsvFile(file);
      if (result.rows.length === 0) {
        setFileError("The file has no rows below the header.");
        return;
      }
      if (result.rows.length > MAX_IMPORT_ROWS) {
        setFileError(
          `The file has ${result.rows.length} rows. The limit is ${MAX_IMPORT_ROWS} per file; split it into smaller files.`,
        );
        return;
      }
      const checked = checkFile(result.headers, result.rows);
      setHeaders(result.headers);
      setFileError(checked.fileError);
      setCheckedRows(checked.rows);
    } catch {
      setFileError("This file could not be read. Save it again as CSV UTF-8 and retry.");
    } finally {
      setIsReading(false);
    }
  };

  const downloadProblems = () => {
    const baseName = fileName.replace(/\.csv$/i, "");
    downloadCsv(`${baseName}-problems.csv`, [
      ["row", ...headers, "problems"],
      ...problemRows.map((row) => [
        row.rowNumber,
        ...headers.map((header) => row.record[header] ?? ""),
        row.problems.join(" "),
      ]),
    ]);
  };

  return (
    <div className="add-user-overlay">
      <div
        className="add-user-modal import-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="add-user-header">
          <div>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
          <button type="button" className="add-user-close" onClick={onClose}>
            <i className="bi bi-x"></i>
          </button>
        </div>

        <div className="add-user-body">
          <div className="form-section">
            <h3 className="form-section-title">1. Get the template</h3>
            <p className="import-text">
              Fill one row per {itemLabel.replace(/s$/, "")} in Excel, then save
              it as <strong>CSV UTF-8</strong>. Keep the first row as it is.
            </p>
            <button
              type="button"
              className="secondary-button import-action"
              onClick={() => downloadCsv(templateFileName, templateRows)}
            >
              <i className="bi bi-download"></i> Download template
            </button>
            {note && <p className="import-note">{note}</p>}
          </div>

          <div className="form-section">
            <h3 className="form-section-title">2. Upload your file</h3>
            {isPreparing ? (
              <p className="import-text">Getting ready…</p>
            ) : prepareError ? (
              <p className="import-error">{prepareError}</p>
            ) : (
              <label className="secondary-button import-action import-upload">
                <i className="bi bi-upload"></i>{" "}
                {fileName ? "Choose another file" : "Choose CSV file"}
                <input type="file" accept=".csv,text/csv" onChange={handleFile} />
              </label>
            )}
            {fileName && <p className="import-text">File: {fileName}</p>}
            {isReading && <p className="import-text">Reading the file…</p>}
            {fileError && <p className="import-error">{fileError}</p>}
          </div>

          {checkedRows.length > 0 && (
            <div className="form-section">
              <h3 className="form-section-title">3. Check the rows</h3>
              <div className="import-summary">
                <span>{checkedRows.length} rows</span>
                <span className="import-chip is-ready">{readyCount} ready</span>
                <span
                  className={`import-chip ${problemRows.length > 0 ? "is-problem" : ""}`}
                >
                  {problemRows.length} with problems
                </span>
                {problemRows.length > 0 && (
                  <>
                    <label className="permission-option import-toggle">
                      <input
                        type="checkbox"
                        checked={showProblemsOnly}
                        onChange={(e) => setShowProblemsOnly(e.target.checked)}
                      />
                      <span>Show only problems</span>
                    </label>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={downloadProblems}
                    >
                      <i className="bi bi-download"></i> Download problems
                    </button>
                  </>
                )}
              </div>
              <DataTable
                headers={["Row", ...previewHeaders, "Status"]}
                rows={shownRows.map((row) => [
                  row.rowNumber,
                  ...row.cells,
                  row.problems.length === 0 ? (
                    <span key="ok" className="import-ready">Ready</span>
                  ) : (
                    <ul key="problems" className="import-problems">
                      {row.problems.map((problem) => (
                        <li key={problem}>{problem}</li>
                      ))}
                    </ul>
                  ),
                ])}
                itemLabel="rows"
                totalCount={checkedRows.length}
                className="import-table"
              />
            </div>
          )}
        </div>

        <div className="add-user-footer">
          {checkedRows.length > 0 && (
            <span className="import-footer-note">
              {problemRows.length > 0
                ? "Fix the rows with problems and upload the file again."
                : "Importing will be available once the import service is connected."}
            </span>
          )}
          <button type="button" className="modal-cancel" onClick={onClose}>
            Close
          </button>
          <button type="button" className="modal-save" disabled>
            {`Import ${readyCount} ${
              readyCount === 1 ? itemLabel.replace(/s$/, "") : itemLabel
            }`}
          </button>
        </div>
      </div>
    </div>
  );
}
