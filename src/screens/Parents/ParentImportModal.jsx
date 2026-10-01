import { useEffect } from "react";
import ImportModal from "../../components/ImportModal.jsx";
import { useBranches } from "../../context/BranchesContext.jsx";
import { cell, missingColumns, toTenDigitPhone } from "../../utils/csv.js";

const PARENT_TEMPLATE = [
  ["full_name", "phone", "branch"],
  ["Priya Rao", "9876543210", "QA Main Campus"],
];

const PARENT_PREVIEW_HEADERS = ["Full name", "Phone", "Branch"];

const checkParentFile = (headers, rows, { isPinned, branches }) => {
  const required = isPinned ? ["full_name", "phone"] : ["full_name", "phone", "branch"];
  const missing = missingColumns(headers, required);
  if (missing.length > 0) {
    return {
      fileError: `Missing columns: ${missing.join(", ")}. Download the template and keep its first row as it is.`,
      rows: [],
    };
  }

  const branchByName = new Map(
    branches.map((branch) => [branch.branchName.trim().toLowerCase(), branch]),
  );
  const firstRowByPhone = new Map();

  return {
    fileError: "",
    rows: rows.map(({ record, rowNumber }) => {
      const problems = [];
      const fullName = cell(record, "full_name");
      const rawPhone = cell(record, "phone");
      const phone = toTenDigitPhone(rawPhone);
      const branchText = cell(record, "branch");
      let branch = null;

      if (record.__parsed_extra) {
        problems.push("Too many columns. Check for extra commas.");
      }
      if (!fullName) problems.push("Full name is missing.");
      if (!rawPhone) {
        problems.push("Phone is missing.");
      } else if (phone.length !== 10) {
        problems.push("Phone must be 10 digits.");
      } else if (firstRowByPhone.has(phone)) {
        problems.push(`Same phone as row ${firstRowByPhone.get(phone)}.`);
      } else {
        firstRowByPhone.set(phone, rowNumber);
      }

      if (!isPinned) {
        if (!branchText) {
          problems.push("Branch is missing.");
        } else {
          branch = branchByName.get(branchText.toLowerCase()) || null;
          if (!branch) problems.push(`Unknown branch "${branchText}".`);
        }
      }

      return {
        rowNumber,
        record,
        problems,
        cells: [fullName, phone || rawPhone, isPinned ? "Your branch" : branchText],
        data: {
          rowNumber,
          fullName,
          phone,
          branchId: branch ? branch.id : null,
        },
      };
    }),
  };
};

export default function ParentImportModal({ me, onClose }) {
  const isPinned = Boolean(me.branch_id);
  const { branches, branchesLoading, branchesError, loadBranches } = useBranches();

  useEffect(() => {
    if (!isPinned) loadBranches();
  }, [isPinned, loadBranches]);

  return (
    <ImportModal
      title="Import Parents"
      description="Add many parents at once from a CSV file."
      note={
        isPinned
          ? "The branch column is ignored: every parent is added to your branch."
          : ""
      }
      itemLabel="parents"
      templateFileName="parents-template.csv"
      templateRows={PARENT_TEMPLATE}
      previewHeaders={PARENT_PREVIEW_HEADERS}
      isPreparing={
        !isPinned && (branchesLoading || (branches.length === 0 && !branchesError))
      }
      prepareError={isPinned ? "" : branchesError}
      checkFile={(headers, rows) =>
        checkParentFile(headers, rows, { isPinned, branches })
      }
      onClose={onClose}
    />
  );
}
