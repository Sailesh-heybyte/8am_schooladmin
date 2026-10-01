import { useEffect, useState } from "react";
import ImportModal from "../../components/ImportModal.jsx";
import { useBranches } from "../../context/BranchesContext.jsx";
import { getParents } from "../../api/parents.js";
import { cell, missingColumns, toTenDigitPhone } from "../../utils/csv.js";

const ALERT_MINUTES = ["5", "10", "15", "20", "25", "30"];

const STUDENT_TEMPLATE = [
  [
    "full_name",
    "admission_number",
    "branch",
    "am_notify_lead_minutes",
    "pm_notify_lead_minutes",
    "home_address",
    "home_latitude",
    "home_longitude",
    "parent1_phone",
    "parent1_relationship",
    "parent2_phone",
    "parent2_relationship",
  ],
  [
    "Vijay Karri",
    "ADM-QA-04",
    "QA Main Campus",
    "15",
    "15",
    "QA Home 1",
    "17.6868",
    "83.2185",
    "9876543210",
    "mother",
    "",
    "",
  ],
];

const STUDENT_PREVIEW_HEADERS = [
  "Full name",
  "Admission no.",
  "Branch",
  "Parents",
  "Alerts (AM / PM)",
];

const checkMinutes = (value, label, problems) => {
  if (!value) problems.push(`${label} alert is missing.`);
  else if (!ALERT_MINUTES.includes(value)) {
    problems.push(`${label} alert must be 5, 10, 15, 20, 25 or 30.`);
  }
};

const checkCoordinate = (value, label, limit, problems) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number < -limit || number > limit) {
    problems.push(`${label} must be a number between -${limit} and ${limit}.`);
  }
};

const checkStudentFile = (headers, rows, { isPinned, branches, parents }) => {
  const required = [
    "full_name",
    "admission_number",
    "am_notify_lead_minutes",
    "pm_notify_lead_minutes",
    "parent1_phone",
    ...(isPinned ? [] : ["branch"]),
  ];
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
  const parentsByPhone = new Map();
  parents.forEach((parent) => {
    const phone = toTenDigitPhone(parent.phone);
    parentsByPhone.set(phone, [...(parentsByPhone.get(phone) || []), parent]);
  });
  const firstRowByAdmission = new Map();

  const checkParent = (rawPhone, label, problems) => {
    const phone = toTenDigitPhone(rawPhone);
    if (phone.length !== 10) {
      problems.push(`${label} phone must be 10 digits.`);
      return null;
    }
    const matches = parentsByPhone.get(phone) || [];
    if (matches.length === 0) {
      problems.push(`No parent with phone ${phone}. Import parents first.`);
      return null;
    }
    if (matches.length > 1) {
      problems.push(`Phone ${phone} matches more than one parent.`);
      return null;
    }
    return phone;
  };

  return {
    fileError: "",
    rows: rows.map(({ record, rowNumber }) => {
      const problems = [];
      const fullName = cell(record, "full_name");
      const admissionNumber = cell(record, "admission_number");
      const branchText = cell(record, "branch");
      const amMinutes = cell(record, "am_notify_lead_minutes");
      const pmMinutes = cell(record, "pm_notify_lead_minutes");
      const homeAddress = cell(record, "home_address");
      const homeLatitude = cell(record, "home_latitude");
      const homeLongitude = cell(record, "home_longitude");
      const parent1Phone = cell(record, "parent1_phone");
      const parent1Relationship = cell(record, "parent1_relationship");
      const parent2Phone = cell(record, "parent2_phone");
      const parent2Relationship = cell(record, "parent2_relationship");
      let branch = null;

      if (record.__parsed_extra) {
        problems.push("Too many columns. Check for extra commas.");
      }
      if (!fullName) problems.push("Full name is missing.");
      if (!admissionNumber) {
        problems.push("Admission number is missing.");
      } else {
        const key = admissionNumber.toLowerCase();
        if (firstRowByAdmission.has(key)) {
          problems.push(`Same admission number as row ${firstRowByAdmission.get(key)}.`);
        } else {
          firstRowByAdmission.set(key, rowNumber);
        }
      }

      if (!isPinned) {
        if (!branchText) {
          problems.push("Branch is missing.");
        } else {
          branch = branchByName.get(branchText.toLowerCase()) || null;
          if (!branch) problems.push(`Unknown branch "${branchText}".`);
        }
      }

      checkMinutes(amMinutes, "Morning", problems);
      checkMinutes(pmMinutes, "Evening", problems);

      if (homeLatitude || homeLongitude) {
        if (!homeLatitude || !homeLongitude) {
          problems.push("Give both home latitude and longitude, or neither.");
        } else {
          checkCoordinate(homeLatitude, "Home latitude", 90, problems);
          checkCoordinate(homeLongitude, "Home longitude", 180, problems);
        }
      }

      const parentPhones = [];
      if (!parent1Phone) {
        problems.push("Parent 1 phone is missing.");
      } else {
        const phone = checkParent(parent1Phone, "Parent 1", problems);
        if (phone) parentPhones.push({ phone, relationship: parent1Relationship });
      }
      if (parent2Phone) {
        const phone = checkParent(parent2Phone, "Parent 2", problems);
        if (phone && parentPhones.some((parent) => parent.phone === phone)) {
          problems.push("Parent 2 has the same phone as parent 1.");
        } else if (phone) {
          parentPhones.push({ phone, relationship: parent2Relationship });
        }
      }

      return {
        rowNumber,
        record,
        problems,
        cells: [
          fullName,
          admissionNumber,
          isPinned ? "Your branch" : branchText,
          [parent1Phone, parent2Phone]
            .filter(Boolean)
            .map((phone, index) => {
              const relationship = index === 0 ? parent1Relationship : parent2Relationship;
              return relationship ? `${phone} (${relationship})` : phone;
            })
            .join(", "),
          amMinutes || pmMinutes ? `${amMinutes || "–"} / ${pmMinutes || "–"}` : "",
        ],
        data: {
          rowNumber,
          fullName,
          admissionNumber,
          branchId: branch ? branch.id : null,
          homeAddress,
          homeLatitude,
          homeLongitude,
          amNotifyLeadMinutes: amMinutes,
          pmNotifyLeadMinutes: pmMinutes,
          parents: parentPhones,
        },
      };
    }),
  };
};

export default function StudentImportModal({ me, onClose }) {
  const isPinned = Boolean(me.branch_id);
  const { branches, branchesLoading, branchesError, loadBranches } = useBranches();
  const [parents, setParents] = useState([]);
  const [parentsLoading, setParentsLoading] = useState(true);
  const [parentsError, setParentsError] = useState("");

  useEffect(() => {
    if (!isPinned) loadBranches();
  }, [isPinned, loadBranches]);

  useEffect(() => {
    let isMounted = true;
    getParents()
      .then((data) => {
        if (isMounted) setParents(data);
      })
      .catch((err) => {
        if (isMounted) setParentsError(err.message);
      })
      .finally(() => {
        if (isMounted) setParentsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const waitingForBranches =
    !isPinned && (branchesLoading || (branches.length === 0 && !branchesError));

  return (
    <ImportModal
      title="Import Students"
      description="Add many students at once from a CSV file and link them to their parents."
      note={`Import parents first: each student's parent phone must match a parent that already exists.${
        isPinned ? " The branch column is ignored: every student is added to your branch." : ""
      }`}
      itemLabel="students"
      templateFileName="students-template.csv"
      templateRows={STUDENT_TEMPLATE}
      previewHeaders={STUDENT_PREVIEW_HEADERS}
      isPreparing={parentsLoading || waitingForBranches}
      prepareError={parentsError || (isPinned ? "" : branchesError)}
      checkFile={(headers, rows) =>
        checkStudentFile(headers, rows, { isPinned, branches, parents })
      }
      onClose={onClose}
    />
  );
}
