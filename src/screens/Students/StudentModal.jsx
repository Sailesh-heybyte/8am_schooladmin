import { useState, useEffect } from "react";
import { createStudent, updateStudent } from "../../api/students.js";
import { getParents } from "../../api/parents.js";
import { useBranches } from "../../context/BranchesContext.jsx";
import TypeAhead from "../../components/TypeAhead.jsx";
import "../Roles/RoleModal.scss";

const ALERT_MINUTE_OPTIONS = [5, 10, 15, 20, 25, 30].map((minutes) => ({
  value: String(minutes),
  label: `${minutes} minutes`,
}));

export default function StudentModal({
  isOpen,
  student = null,
  me,
  onClose,
  onSaved,
}) {
  const isEditMode = Boolean(student?.id);
  const isPinned = Boolean(me.branch_id);

  const [fullName, setFullName] = useState("");
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [branchId, setBranchId] = useState("");
  const [homeLatitude, setHomeLatitude] = useState("");
  const [homeLongitude, setHomeLongitude] = useState("");
  const [homeAddress, setHomeAddress] = useState("");
  const [amNotifyLeadMinutes, setAmNotifyLeadMinutes] = useState("15");
  const [pmNotifyLeadMinutes, setPmNotifyLeadMinutes] = useState("15");
  const [isActive, setIsActive] = useState(true);
  const [parentId, setParentId] = useState("");
  const [relationship, setRelationship] = useState("");
  const [parents, setParents] = useState([]);
  const [parentsLoading, setParentsLoading] = useState(false);
  const [parentsError, setParentsError] = useState("");
  const { branches, branchesLoading, branchesError, loadBranches } =
    useBranches();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    if (student) {
      setFullName(student.fullName || "");
      setAdmissionNumber(student.admissionNumber || "");
      setBranchId(student.branchId || "");
      setHomeLatitude(
        student.homeLatitude !== null && student.homeLatitude !== undefined
          ? String(student.homeLatitude)
          : "",
      );
      setHomeLongitude(
        student.homeLongitude !== null && student.homeLongitude !== undefined
          ? String(student.homeLongitude)
          : "",
      );
      setIsActive(Boolean(student.isActive));
      setHomeAddress(student.homeAddress !== null ? student.homeAddress : "");
      setAmNotifyLeadMinutes(
        student.amNotifyLeadMinutes !== null
          ? String(student.amNotifyLeadMinutes)
          : "",
      );
      setPmNotifyLeadMinutes(
        student.pmNotifyLeadMinutes !== null
          ? String(student.pmNotifyLeadMinutes)
          : "",
      );
      setParentId("");
      setRelationship("");
    } else {
      setFullName("");
      setAdmissionNumber("");
      setBranchId(isPinned ? me.branch_id : "");
      setHomeLatitude("");
      setHomeLongitude("");
      setHomeAddress("");
      setAmNotifyLeadMinutes("15");
      setPmNotifyLeadMinutes("15");
      setIsActive(true);
      setParentId("");
      setRelationship("");
    }
    setError("");
    setIsSubmitting(false);
  }, [isOpen, student, isPinned, me.branch_id]);

  useEffect(() => {
    if (!isOpen || isEditMode) return;

    if (!isPinned) {
      loadBranches();
    }
    setParentsLoading(true);
    setParentsError("");

    getParents()
      .then((data) => {
        setParents(data);
      })
      .catch((err) => {
        setParentsError(err.message || "Failed to load parents.");
      })
      .finally(() => {
        setParentsLoading(false);
      });
  }, [isOpen, isEditMode, isPinned, loadBranches]);

  if (!isOpen) return null;

  const parentOptions = parents.map((p) => ({
    value: p.id,
    label: p.phone ? `${p.fullName} · ${p.phone}` : p.fullName,
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) {
      setError("Full Name is required.");
      return;
    }

    if (!admissionNumber.trim()) {
      setError("Admission Number is required.");
      return;
    }

    if (!isEditMode && !isPinned && !branchId) {
      setError("Please select a branch.");
      return;
    }

    if (!isEditMode) {
      if (!parentId || !parentId.trim()) {
        setError("Please select a parent.");
        return;
      }
    }

    if (!amNotifyLeadMinutes) {
      setError("Please choose the morning alert time.");
      return;
    }
    if (!pmNotifyLeadMinutes) {
      setError("Please choose the evening alert time.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditMode) {
        await updateStudent(student.id, {
          fullName: fullName.trim(),
          admissionNumber: admissionNumber.trim(),
          homeLatitude:
            homeLatitude.trim() !== "" ? Number(homeLatitude) : undefined,
          homeLongitude:
            homeLongitude.trim() !== "" ? Number(homeLongitude) : undefined,
          homeAddress: homeAddress.trim(),
          amNotifyLeadMinutes,
          pmNotifyLeadMinutes,
          isActive,
        });
      } else {
        await createStudent({
          fullName: fullName.trim(),
          admissionNumber: admissionNumber.trim(),
          branchId: isPinned ? me.branch_id : branchId,
          homeLatitude:
            homeLatitude.trim() !== "" ? Number(homeLatitude) : undefined,
          homeLongitude:
            homeLongitude.trim() !== "" ? Number(homeLongitude) : undefined,
          homeAddress: homeAddress.trim(),
          amNotifyLeadMinutes,
          pmNotifyLeadMinutes,
          parentId: parentId.trim(),
          relationship: relationship.trim(),
        });
      }

      if (onSaved) {
        await onSaved();
      }
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save student. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSaveDisabled =
    isSubmitting ||
    (!isEditMode && !isPinned && branchesLoading) ||
    (!isEditMode && !isPinned && Boolean(branchesError)) ||
    (!isEditMode && parentsLoading);

  const requestClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  return (
    <div className="add-user-overlay">
      <div className="add-user-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="add-user-header">
          <div>
            <h2>{isEditMode ? "Edit Student" : "Add Student"}</h2>
            <p>
              {isEditMode
                ? "Update student information and status."
                : "Register a new student in your school."}
            </p>
          </div>
          <button
            type="button"
            className="add-user-close"
            onClick={requestClose}
            disabled={isSubmitting}
          >
            <i className="bi bi-x"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="add-user-body">
            <div className="form-section">
              <h3 className="form-section-title">Student Details</h3>

              <div className="form-row">
                <div className="form-field" style={{ flex: 1, width: "100%" }}>
                  <label htmlFor="student-fullname">Full Name *</label>
                  <input
                    id="student-fullname"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Aarav K. Nair"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-field" style={{ flex: 1, width: "100%" }}>
                  <label htmlFor="student-admission">Admission Number *</label>
                  <input
                    id="student-admission"
                    type="text"
                    value={admissionNumber}
                    onChange={(e) => setAdmissionNumber(e.target.value)}
                    placeholder="ADM-2026-001"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="form-row">
                {isEditMode ? (
                  <div className="form-field" style={{ flex: 1, width: "100%" }}>
                    <label htmlFor="student-branch">Branch</label>
                    <input
                      id="student-branch"
                      type="text"
                      value={student.branchName || "Not assigned"}
                      readOnly
                      disabled
                    />
                    <span
                      className="roles-message"
                      style={{ marginTop: "0.25rem", display: "block" }}
                    >
                      A student cannot be moved between branches.
                    </span>
                  </div>
                ) : !isPinned ? (
                  <div className="form-field" style={{ flex: 1, width: "100%" }}>
                    <label htmlFor="student-branch">Branch *</label>
                    <TypeAhead
                      options={branches.map((b) => ({ value: b.id, label: b.branchName }))}
                      value={branchId}
                      onChange={setBranchId}
                      placeholder="Select a branch..."
                      disabled={isSubmitting || branchesLoading || Boolean(branchesError)}
                      loading={branchesLoading}
                      emptyMessage="No branches available"
                      noMatchMessage="No branches found"
                    />
                    {branchesError && (
                      <span
                        className="roles-error"
                        style={{
                          marginTop: "0.25rem",
                          display: "block",
                          color: "#d9534f",
                        }}
                      >
                        {branchesError}
                      </span>
                    )}
                  </div>
                ) : null}
              </div>

              <div className="form-row">
                <div className="form-field" style={{ flex: 1, width: "100%" }}>
                  <label htmlFor="student-lat">Home Latitude</label>
                  <input
                    id="student-lat"
                    type="text"
                    inputMode="decimal"
                    value={homeLatitude}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || /^-?\d*\.?\d*$/.test(val)) {
                        setHomeLatitude(val);
                      }
                    }}
                    placeholder="12.9716"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-field" style={{ flex: 1, width: "100%" }}>
                  <label htmlFor="student-lng">Home Longitude</label>
                  <input
                    id="student-lng"
                    type="text"
                    inputMode="decimal"
                    value={homeLongitude}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || /^-?\d*\.?\d*$/.test(val)) {
                        setHomeLongitude(val);
                      }
                    }}
                    placeholder="77.5946"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field role-description-field">
                  <label htmlFor="student-address">Home Address</label>
                  <input
                    id="student-address"
                    type="text"
                    value={homeAddress}
                    onChange={(e) => setHomeAddress(e.target.value)}
                    placeholder="12-3-45, Tilak Road, Rajahmundry"
                    disabled={isSubmitting}
                  />
                  <span
                    className="roles-message"
                    style={{ marginTop: "0.25rem", display: "block" }}
                  >
                    Optional — parents can also set home location and address in
                    the parent app.
                  </span>
                </div>
              </div>

              <div className="form-row">
                <div className="form-field role-description-field">
                  <label>
                    Morning alert (minutes before pickup) *
                  </label>
                  <TypeAhead
                    options={ALERT_MINUTE_OPTIONS}
                    value={amNotifyLeadMinutes}
                    onChange={setAmNotifyLeadMinutes}
                    placeholder="Choose minutes"
                    disabled={isSubmitting}
                    noMatchMessage="Choose 5, 10, 15, 20, 25 or 30"
                  />
                </div>

                <div className="form-field role-description-field">
                  <label>
                    Evening alert (minutes before drop) *
                  </label>
                  <TypeAhead
                    options={ALERT_MINUTE_OPTIONS}
                    value={pmNotifyLeadMinutes}
                    onChange={setPmNotifyLeadMinutes}
                    placeholder="Choose minutes"
                    disabled={isSubmitting}
                    noMatchMessage="Choose 5, 10, 15, 20, 25 or 30"
                  />
                </div>
              </div>

              {isEditMode && (
                <div className="form-row" style={{ marginTop: "1rem" }}>
                  <div
                    className="form-field"
                    style={{ flex: 1, width: "100%" }}
                  >
                    <label
                      htmlFor="student-active"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        id="student-active"
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        disabled={isSubmitting}
                        style={{ width: "1.1rem", height: "1.1rem" }}
                      />
                      <span>Active Student</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {!isEditMode && (
              <div className="form-section">
                <h3 className="form-section-title">Parents</h3>
                <span
                  className="roles-message"
                  style={{
                    marginTop: "-0.35rem",
                    marginBottom: "0.85rem",
                    display: "block",
                  }}
                >
                  At least one parent is required.
                </span>

                <div className="form-row">
                  <div
                    className="form-field"
                    style={{ flex: 2, width: "100%" }}
                  >
                    <label>Parent *</label>
                    <TypeAhead
                      options={parentOptions}
                      value={parentId}
                      onChange={(val) => setParentId(val)}
                      placeholder={
                        parentsLoading
                          ? "Loading parents..."
                          : "Select a parent..."
                      }
                      disabled={isSubmitting || parentsLoading}
                      loading={parentsLoading}
                      emptyMessage="No parents available"
                      noMatchMessage="No parents found"
                    />
                    {parentsError && (
                      <span
                        className="roles-error"
                        style={{
                          marginTop: "0.25rem",
                          display: "block",
                          color: "#d9534f",
                        }}
                      >
                        {parentsError}
                      </span>
                    )}
                  </div>

                  <div
                    className="form-field"
                    style={{ flex: 1, width: "100%" }}
                  >
                    <label htmlFor="student-relationship">Relationship</label>
                    <TypeAhead
                      options={[
                        { value: "father", label: "Father" },
                        { value: "mother", label: "Mother" },
                        { value: "guardian", label: "Guardian" },
                      ]}
                      value={relationship}
                      onChange={setRelationship}
                      placeholder="Not specified"
                      disabled={isSubmitting}
                      noMatchMessage="No options found"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {error && <div className="add-user-error">{error}</div>}

          <div className="add-user-footer">
            <button
              type="button"
              className="modal-cancel"
              onClick={requestClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="modal-save"
              disabled={isSaveDisabled}
            >
              {isSubmitting
                ? isEditMode
                  ? "Saving..."
                  : "Adding..."
                : isEditMode
                  ? "Save Changes"
                  : "Add Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
