import { useEffect, useState } from "react";
import TypeAhead from "../../components/TypeAhead.jsx";
import { useBranches } from "../../context/BranchesContext.jsx";
import { importStudents } from "../../api/students.js";
import { readImportFile, downloadCsv } from "../../utils/importFile.js";
import "./StudentImportModal.scss";

const MAX_ROWS = 500;
const ALERT_MINUTES = ["5", "10", "15", "20", "25", "30"];

const COLUMNS = [
  { key: "fullName", label: "Student Name" },
  { key: "admissionNumber", label: "Admission Number" },
  { key: "branchName", label: "Branch" },
  { key: "homeAddress", label: "Home Address" },
  { key: "homeLatitude", label: "Home Latitude" },
  { key: "homeLongitude", label: "Home Longitude" },
  { key: "amNotifyLeadMinutes", label: "Morning Alert (min)" },
  { key: "pmNotifyLeadMinutes", label: "Evening Alert (min)" },
  { key: "parent1Name", label: "Parent 1 Name" },
  { key: "parent1Phone", label: "Parent 1 Phone" },
  { key: "parent1Relationship", label: "Parent 1 Relationship" },
  { key: "parent2Name", label: "Parent 2 Name" },
  { key: "parent2Phone", label: "Parent 2 Phone" },
  { key: "parent2Relationship", label: "Parent 2 Relationship" },
];

const REQUIRED_COLUMNS = [
  "Student Name",
  "Admission Number",
  "Parent 1 Name",
  "Parent 1 Phone",
];

const EXAMPLE_ROW = [
  "Sai Charan", "RJY-101", "Rajahmundry Campus", "Alcot Gardens", "16.98395",
  "81.7792", "15", "15", "Lakshmi Devi", "7745456101", "Mother", "", "", "",
];

const STUDENT_FIELD_LABELS = {
  full_name: "Student name",
  admission_number: "Admission number",
  branch_id: "Branch",
  home_address: "Home address",
  home_latitude: "Home latitude",
  home_longitude: "Home longitude",
  am_notify_lead_minutes: "Morning alert",
  pm_notify_lead_minutes: "Evening alert",
  parents: "Parents",
};

const PARENT_FIELD_LABELS = {
  full_name: "name",
  phone: "phone",
  relationship: "relationship",
};

const sameName = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();

const toTenDigits = (phone) => {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 12 && digits.startsWith("91")
    ? digits.slice(2)
    : digits;
};

const isNumber = (value) => value !== "" && !Number.isNaN(Number(value));

const getParentProblems = (number, name, phone, relationship) => {
  const problems = [];
  if (!name) problems.push(`Parent ${number} name is required.`);
  if (!phone) problems.push(`Parent ${number} phone is required.`);
  if (phone && toTenDigits(phone).length !== 10) {
    problems.push(`Parent ${number} phone must be 10 digits.`);
  }
  if (relationship.length > 64) {
    problems.push(`Parent ${number} relationship is too long (max 64).`);
  }
  return problems;
};

const getRowProblems = (row, { needsRowBranch, branchId, admissionCounts, phoneNames }) => {
  const problems = [];

  if (!row.fullName) problems.push("Student name is required.");
  if (!row.admissionNumber) problems.push("Admission number is required.");
  if (row.admissionNumber && admissionCounts[row.admissionNumber] > 1) {
    problems.push("This admission number is repeated in this file.");
  }
  if (needsRowBranch && !branchId) {
    problems.push(
      row.branchName
        ? `Branch "${row.branchName}" was not found.`
        : "Branch is required.",
    );
  }
  if (row.homeLatitude && !isNumber(row.homeLatitude)) {
    problems.push("Home latitude must be a number.");
  }
  if (row.homeLongitude && !isNumber(row.homeLongitude)) {
    problems.push("Home longitude must be a number.");
  }
  if (row.amNotifyLeadMinutes && !ALERT_MINUTES.includes(row.amNotifyLeadMinutes)) {
    problems.push("Morning alert must be 5, 10, 15, 20, 25 or 30.");
  }
  if (row.pmNotifyLeadMinutes && !ALERT_MINUTES.includes(row.pmNotifyLeadMinutes)) {
    problems.push("Evening alert must be 5, 10, 15, 20, 25 or 30.");
  }

  problems.push(
    ...getParentProblems(1, row.parent1Name, row.parent1Phone, row.parent1Relationship),
  );
  if (row.parent2Name || row.parent2Phone || row.parent2Relationship) {
    problems.push(
      ...getParentProblems(2, row.parent2Name, row.parent2Phone, row.parent2Relationship),
    );
  }

  toParents(row).forEach((parent, index) => {
    const names = phoneNames[parent.phone];
    if (names && names.size > 1) {
      problems.push(
        `Parent ${index + 1} phone is used with different names in this file: ${[...names].join(", ")}.`,
      );
    }
  });

  return problems;
};

const toParents = (row) => {
  const parents = [
    {
      fullName: row.parent1Name,
      phone: toTenDigits(row.parent1Phone),
      relationship: row.parent1Relationship,
    },
  ];
  if (row.parent2Name) {
    parents.push({
      fullName: row.parent2Name,
      phone: toTenDigits(row.parent2Phone),
      relationship: row.parent2Relationship,
    });
  }
  return parents;
};

const describeValidationError = (item) => {
  const path = item.loc.slice(3);
  const field = path[path.length - 1];
  if (path[0] === "parents" && typeof path[1] === "number") {
    const label = PARENT_FIELD_LABELS[field] || field;
    return `Parent ${path[1] + 1} ${label}: ${item.msg}`;
  }
  return `${STUDENT_FIELD_LABELS[field] || field}: ${item.msg}`;
};

export default function StudentImportModal({ me, onClose, onImported }) {
  const isPinned = Boolean(me.branch_id);
  const { branches, branchesLoading, branchesError, loadBranches } = useBranches();

  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState([]);
  const [hasBranchColumn, setHasBranchColumn] = useState(false);
  const [allBranchId, setAllBranchId] = useState("");
  const [serverErrors, setServerErrors] = useState({});
  const [error, setError] = useState("");
  const [editingRow, setEditingRow] = useState(null);
  const [isReading, setIsReading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!isPinned) loadBranches();
  }, [isPinned, loadBranches]);

  const needsRowBranch = !isPinned && hasBranchColumn;
  const needsAllBranch = !isPinned && !hasBranchColumn;
  const branchOptions = branches.map((b) => ({ value: b.id, label: b.branchName }));

  const admissionCounts = {};
  rows.forEach((row) => {
    admissionCounts[row.admissionNumber] =
      (admissionCounts[row.admissionNumber] || 0) + 1;
  });

  const phoneNames = {};
  rows.forEach((row) => {
    toParents(row).forEach((parent) => {
      if (!parent.phone || !parent.fullName) return;
      if (!phoneNames[parent.phone]) phoneNames[parent.phone] = new Set();
      phoneNames[parent.phone].add(parent.fullName);
    });
  });

  const findBranchId = (name) => {
    const branch = branches.find((b) => sameName(b.branchName, name));
    return branch ? branch.id : "";
  };

  const getRowBranchId = (row) => row.branchId || findBranchId(row.branchName);

  const rowProblems = rows.map((row) =>
    getRowProblems(row, {
      needsRowBranch,
      branchId: getRowBranchId(row),
      admissionCounts,
      phoneNames,
    }),
  );
  const problemCount = rowProblems.filter((list) => list.length > 0).length;

  let blockReason = "";
  if (rows.length === 0) blockReason = "There are no students to import.";
  else if (rows.length > MAX_ROWS) blockReason = `A file can have at most ${MAX_ROWS} students.`;
  else if (needsAllBranch && !allBranchId) blockReason = "Choose the branch for these students.";
  else if (problemCount > 0) blockReason = "Fix the rows marked in red first.";

  const handleFile = async (event) => {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file) return;

    setError("");
    setServerErrors({});
    setIsReading(true);
    try {
      const { headers, records } = await readImportFile(file);
      const missing = REQUIRED_COLUMNS.filter(
        (label) => !headers.includes(label.toLowerCase()),
      );
      if (missing.length > 0) {
        setError(`This file is missing columns: ${missing.join(", ")}. Use the template.`);
        return;
      }

      const newRows = records.map((record, index) => {
        const row = { key: `${Date.now()}-${index}` };
        COLUMNS.forEach(({ key, label }) => {
          row[key] = record[label.toLowerCase()] || "";
        });
        row.branchId = "";
        return row;
      });

      setFileName(file.name);
      setRows(newRows);
      setHasBranchColumn(newRows.some((row) => row.branchName));
    } catch (err) {
      setError(err.message || "Couldn't read this file.");
    } finally {
      setIsReading(false);
    }
  };

  const removeRow = (key) => {
    setRows((current) => current.filter((row) => row.key !== key));
  };

  const saveEditedRow = (editedRow) => {
    setRows((current) =>
      current.map((row) => (row.key === editedRow.key ? editedRow : row)),
    );
    setServerErrors((current) => ({ ...current, [editedRow.key]: [] }));
    setEditingRow(null);
  };

  const handleImport = async () => {
    setError("");
    setServerErrors({});
    setIsImporting(true);

    const students = rows.map((row) => ({
      fullName: row.fullName,
      admissionNumber: row.admissionNumber,
      branchId: isPinned
        ? me.branch_id
        : needsRowBranch
          ? getRowBranchId(row)
          : allBranchId,
      homeAddress: row.homeAddress,
      homeLatitude: row.homeLatitude,
      homeLongitude: row.homeLongitude,
      amNotifyLeadMinutes: row.amNotifyLeadMinutes,
      pmNotifyLeadMinutes: row.pmNotifyLeadMinutes,
      parents: toParents(row),
    }));

    try {
      const counts = await importStudents(students);
      setResult(counts);
      onImported();
    } catch (err) {
      const errorsByRow = {};
      const addError = (index, message) => {
        const row = rows[index];
        if (!row) return;
        errorsByRow[row.key] = [...(errorsByRow[row.key] || []), message];
      };

      if (err.status === 400 && Array.isArray(err.detail)) {
        err.detail.forEach((item) => addError(item.row - 1, item.reason));
      } else if (err.status === 422 && Array.isArray(err.detail)) {
        err.detail.forEach((item) => {
          if (item.loc[1] === "students" && typeof item.loc[2] === "number") {
            addError(item.loc[2], describeValidationError(item));
          }
        });
      }

      if (Object.keys(errorsByRow).length > 0) {
        setServerErrors(errorsByRow);
        setError("Nothing was imported. Fix the rows marked in red and import again.");
      } else {
        setError(err.message || "Import failed. Nothing was saved.");
      }
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    downloadCsv(
      "students-import-template.csv",
      COLUMNS.map((column) => column.label),
      [EXAMPLE_ROW],
    );
  };

  const close = () => {
    if (!isImporting) onClose();
  };

  if (result) {
    return (
      <div className="add-user-overlay" onMouseDown={onClose}>
        <div className="add-user-modal import-modal is-small" onMouseDown={(e) => e.stopPropagation()}>
          <div className="add-user-header">
            <div>
              <h2>Import complete</h2>
              <p>The student list has been refreshed.</p>
            </div>
          </div>
          <div className="add-user-body">
            <ul className="import-result">
              <li><strong>{result.studentsCreated}</strong> students added</li>
              <li><strong>{result.parentsCreated}</strong> new parent logins created</li>
              <li><strong>{result.parentsLinked}</strong> existing parents linked</li>
            </ul>
          </div>
          <div className="add-user-footer">
            <button type="button" className="modal-save" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (editingRow) {
    return (
      <ImportRowForm
        row={{ ...editingRow, branchId: getRowBranchId(editingRow) }}
        showBranch={needsRowBranch}
        branchOptions={branchOptions}
        onCancel={() => setEditingRow(null)}
        onSave={saveEditedRow}
      />
    );
  }

  return (
    <div className="add-user-overlay" onMouseDown={close}>
      <div className="add-user-modal import-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="add-user-header">
          <div>
            <h2>Import students</h2>
            <p>Upload a .csv or .xlsx file. Students and their parents are added together.</p>
          </div>
          <button type="button" className="add-user-close" onClick={close} disabled={isImporting}>
            <i className="bi bi-x"></i>
          </button>
        </div>

        <div className="add-user-body">
          <div className="import-toolbar">
            <label className={`secondary-button import-file-button ${isImporting ? "is-disabled" : ""}`}>
              <i className="bi bi-upload"></i>
              {isReading ? "Reading..." : fileName ? "Choose another file" : "Choose file"}
              <input
                type="file"
                accept=".csv,.xlsx"
                onChange={handleFile}
                disabled={isImporting || isReading}
              />
            </label>
            <button type="button" className="secondary-button" onClick={downloadTemplate}>
              <i className="bi bi-download"></i> Download template
            </button>
            {fileName && (
              <span className="import-summary">
                {fileName} · {rows.length} {rows.length === 1 ? "student" : "students"}
                {problemCount > 0 && (
                  <span className="import-summary-problems"> · {problemCount} with problems</span>
                )}
              </span>
            )}
          </div>

          {needsAllBranch && rows.length > 0 && (
            <div className="import-branch">
              <label>Import all students into branch *</label>
              <TypeAhead
                options={branchOptions}
                value={allBranchId}
                onChange={setAllBranchId}
                placeholder="Select a branch..."
                disabled={isImporting || branchesLoading || Boolean(branchesError)}
                loading={branchesLoading}
                emptyMessage="No branches available"
                noMatchMessage="No branches found"
              />
              {branchesError && <span className="import-row-problem">{branchesError}</span>}
            </div>
          )}

          {rows.length === 0 ? (
            <div className="import-empty">
              <p>Required columns: {REQUIRED_COLUMNS.join(", ")}.</p>
              <p>
                Optional: Branch, Home Address, Home Latitude, Home Longitude, Morning Alert
                (min), Evening Alert (min), Parent 1 Relationship, and Parent 2 Name / Phone /
                Relationship.
              </p>
              <p>Alerts must be 5, 10, 15, 20, 25 or 30 (default 15). Phone: 10 digits.</p>
            </div>
          ) : (
            <div className="import-table-wrap">
              <table className="import-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Student</th>
                    <th>Admission No.</th>
                    {needsRowBranch && <th>Branch</th>}
                    <th>Parent 1</th>
                    <th>Parent 2</th>
                    <th>Check</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => {
                    const problems = [
                      ...rowProblems[index],
                      ...(serverErrors[row.key] || []),
                    ];
                    return (
                      <tr key={row.key} className={problems.length > 0 ? "has-problems" : ""}>
                        <td>{index + 1}</td>
                        <td>{row.fullName || "-"}</td>
                        <td>{row.admissionNumber || "-"}</td>
                        {needsRowBranch && <td>{row.branchName || "-"}</td>}
                        <td>
                          {row.parent1Name || "-"}
                          <span className="import-sub">{row.parent1Phone}</span>
                        </td>
                        <td>
                          {row.parent2Name || "-"}
                          <span className="import-sub">{row.parent2Phone}</span>
                        </td>
                        <td>
                          {problems.length === 0 ? (
                            <span className="import-row-ok">
                              <i className="bi bi-check-circle-fill"></i> Ready
                            </span>
                          ) : (
                            problems.map((problem) => (
                              <span key={problem} className="import-row-problem">
                                {problem}
                              </span>
                            ))
                          )}
                        </td>
                        <td className="import-actions">
                          <button
                            type="button"
                            title="Edit row"
                            onClick={() => setEditingRow(row)}
                            disabled={isImporting}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            type="button"
                            title="Remove row"
                            onClick={() => removeRow(row.key)}
                            disabled={isImporting}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {error && <div className="add-user-error">{error}</div>}

        <div className="add-user-footer">
          {rows.length > 0 && blockReason && !error && (
            <span className="import-block-reason">{blockReason}</span>
          )}
          <button type="button" className="modal-cancel" onClick={close} disabled={isImporting}>
            Cancel
          </button>
          <button
            type="button"
            className="modal-save"
            onClick={handleImport}
            disabled={Boolean(blockReason) || isImporting}
          >
            {isImporting
              ? "Importing..."
              : `Import ${rows.length} ${rows.length === 1 ? "student" : "students"}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function ImportRowForm({ row, showBranch, branchOptions, onCancel, onSave }) {
  const [form, setForm] = useState(row);

  const setField = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
  };

  const setBranch = (branchId) => {
    const option = branchOptions.find((o) => o.value === branchId);
    setForm((current) => ({
      ...current,
      branchId,
      branchName: option ? option.label : current.branchName,
    }));
  };

  const trimAll = (values) =>
    Object.fromEntries(
      Object.entries(values).map(([key, value]) => [
        key,
        typeof value === "string" ? value.trim() : value,
      ]),
    );

  const field = (key, label, placeholder = "") => (
    <div className="form-field">
      <label htmlFor={`import-${key}`}>{label}</label>
      <input
        id={`import-${key}`}
        type="text"
        value={form[key]}
        onChange={setField(key)}
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <div className="add-user-overlay" onMouseDown={onCancel}>
      <div className="add-user-modal import-modal is-small" onMouseDown={(e) => e.stopPropagation()}>
        <div className="add-user-header">
          <div>
            <h2>Edit row</h2>
            <p>Changes apply to the preview only. Nothing is saved until you import.</p>
          </div>
          <button type="button" className="add-user-close" onClick={onCancel}>
            <i className="bi bi-x"></i>
          </button>
        </div>

        <div className="add-user-body">
          <div className="form-section">
            <h3 className="form-section-title">Student</h3>
            <div className="form-row">
              {field("fullName", "Student Name *")}
              {field("admissionNumber", "Admission Number *")}
            </div>
            {showBranch && (
              <div className="form-row">
                <div className="form-field">
                  <label>Branch *</label>
                  <TypeAhead
                    options={branchOptions}
                    value={form.branchId}
                    onChange={setBranch}
                    placeholder="Select a branch..."
                    emptyMessage="No branches available"
                    noMatchMessage="No branches found"
                  />
                </div>
              </div>
            )}
            <div className="form-row">
              {field("homeAddress", "Home Address")}
              {field("homeLatitude", "Home Latitude", "16.98395")}
              {field("homeLongitude", "Home Longitude", "81.7792")}
            </div>
            <div className="form-row">
              {field("amNotifyLeadMinutes", "Morning Alert (min)", "15")}
              {field("pmNotifyLeadMinutes", "Evening Alert (min)", "15")}
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Parent 1</h3>
            <div className="form-row">
              {field("parent1Name", "Name *")}
              {field("parent1Phone", "Phone (10 digits) *")}
              {field("parent1Relationship", "Relationship")}
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Parent 2 (optional)</h3>
            <div className="form-row">
              {field("parent2Name", "Name")}
              {field("parent2Phone", "Phone (10 digits)")}
              {field("parent2Relationship", "Relationship")}
            </div>
          </div>
        </div>

        <div className="add-user-footer">
          <button type="button" className="modal-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="modal-save" onClick={() => onSave(trimAll(form))}>
            Save row
          </button>
        </div>
      </div>
    </div>
  );
}
