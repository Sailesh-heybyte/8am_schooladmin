import { useState, useEffect } from "react";
import { createStudent, updateStudent } from "../../api/students.js";
import { getBranches } from "../../api/branches.js";
import "../Roles/RoleModal.scss";

export default function StudentModal({
  isOpen,
  student = null,
  schoolId,
  onClose,
  onSaved,
}) {
  const isEditMode = Boolean(student?.id);

  const [fullName, setFullName] = useState("");
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [branchId, setBranchId] = useState("");
  const [homeLatitude, setHomeLatitude] = useState("");
  const [homeLongitude, setHomeLongitude] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [parentId, setParentId] = useState("");
  const [relationship, setRelationship] = useState("father");

  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branchesError, setBranchesError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Prefill every field from student prop in edit mode, reset in create mode
  useEffect(() => {
    if (!isOpen) return;

    if (student) {
      setFullName(student.fullName || "");
      setAdmissionNumber(student.admissionNumber || "");
      setBranchId(student.branchId || "");
      // A null latitude or longitude must prefill as an empty string, never as 0
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
      setParentId("");
      setRelationship("father");
    } else {
      setFullName("");
      setAdmissionNumber("");
      setBranchId("");
      setHomeLatitude("");
      setHomeLongitude("");
      setIsActive(true);
      setParentId("");
      setRelationship("father");
    }
    setError("");
    setIsSubmitting(false);
  }, [isOpen, student]);

  // Load branches inside the modal only for create mode
  useEffect(() => {
    if (!isOpen) return;
    if (student) return; // Skip fetch entirely in edit mode

    let isMounted = true;
    setBranchesLoading(true);
    setBranchesError("");

    const branchesRequest = schoolId
      ? getBranches(schoolId)
      : Promise.resolve([]);

    branchesRequest
      .then((data) => {
        if (!isMounted) return;
        setBranches(data);
      })
      .catch((err) => {
        if (!isMounted) return;
        setBranchesError(err.message || "Failed to load branches.");
      })
      .finally(() => {
        if (isMounted) {
          setBranchesLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, schoolId]);

  if (!isOpen) return null;

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

    if (!isEditMode && !branchId) {
      setError("Please select a branch.");
      return;
    }

    if (!isEditMode) {
      if (!parentId.trim()) {
        setError("Parent ID is required.");
        return;
      }
      if (!relationship || !relationship.trim()) {
        setError("Please select a relationship.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (isEditMode) {
        // Do NOT send branchId or parents on update
        await updateStudent(student.id, {
          fullName: fullName.trim(),
          admissionNumber: admissionNumber.trim(),
          homeLatitude:
            homeLatitude.trim() !== "" ? Number(homeLatitude) : undefined,
          homeLongitude:
            homeLongitude.trim() !== "" ? Number(homeLongitude) : undefined,
          isActive,
        });
      } else {
        await createStudent({
          fullName: fullName.trim(),
          admissionNumber: admissionNumber.trim(),
          branchId,
          homeLatitude:
            homeLatitude.trim() !== "" ? Number(homeLatitude) : undefined,
          homeLongitude:
            homeLongitude.trim() !== "" ? Number(homeLongitude) : undefined,
          parents: [
            {
              parentId: parentId.trim(),
              relationship,
            },
          ],
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
    (!isEditMode && branchesLoading) ||
    (!isEditMode && Boolean(branchesError));

  return (
    <div className="add-user-overlay" onMouseDown={onClose}>
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
            onClick={onClose}
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
                    placeholder="e.g. Aarav K. Nair"
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
                    placeholder="e.g. ADM-2026-001"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field" style={{ flex: 1, width: "100%" }}>
                  {isEditMode ? (
                    <>
                      <label htmlFor="student-branch">Branch</label>
                      <input
                        id="student-branch"
                        type="text"
                        value={student.branchId || "Not assigned"}
                        readOnly
                        disabled
                      />
                      <span
                        className="roles-message"
                        style={{ marginTop: "0.25rem", display: "block" }}
                      >
                        A student cannot be moved between branches.
                      </span>
                    </>
                  ) : (
                    <>
                      <label htmlFor="student-branch">Branch *</label>
                      <select
                        id="student-branch"
                        value={branchId}
                        onChange={(e) => setBranchId(e.target.value)}
                        required
                        disabled={
                          isSubmitting ||
                          branchesLoading ||
                          Boolean(branchesError)
                        }
                      >
                        {branchesLoading ? (
                          <option value="" disabled>
                            Loading branches...
                          </option>
                        ) : (
                          <>
                            <option value="">Select a branch...</option>
                            {branches.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.branchName}
                              </option>
                            ))}
                          </>
                        )}
                      </select>
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
                    </>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-field" style={{ flex: 1, width: "100%" }}>
                  <label htmlFor="student-lat">Home Latitude</label>
                  <input
                    id="student-lat"
                    type="number"
                    step="any"
                    value={homeLatitude}
                    onChange={(e) => setHomeLatitude(e.target.value)}
                    placeholder="e.g. 12.9716"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-field" style={{ flex: 1, width: "100%" }}>
                  <label htmlFor="student-lng">Home Longitude</label>
                  <input
                    id="student-lng"
                    type="number"
                    step="any"
                    value={homeLongitude}
                    onChange={(e) => setHomeLongitude(e.target.value)}
                    placeholder="e.g. 77.5946"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <span
                className="roles-message"
                style={{ marginTop: "0.25rem", display: "block" }}
              >
                Optional. Used to find the nearest bus stop.
              </span>

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
                <h3 className="form-section-title">Guardian</h3>
                <span
                  className="roles-message"
                  style={{
                    marginTop: "-0.35rem",
                    marginBottom: "0.85rem",
                    display: "block",
                  }}
                >
                  At least one guardian is required.
                </span>

                <div className="form-row">
                  <div
                    className="form-field"
                    style={{ flex: 1, width: "100%" }}
                  >
                    <label htmlFor="add-parent-id">Parent</label>
                    <input
                      id="add-parent-id"
                      type="text"
                      value={parentId}
                      onChange={(e) => setParentId(e.target.value)}
                      placeholder="e.g. f8512064-4b0b-471c-bf60-5ef7c610baa0"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div
                    className="form-field"
                    style={{ flex: 1, width: "100%" }}
                  >
                    <label htmlFor="add-parent-relationship">
                      Relationship *
                    </label>
                    <select
                      id="add-parent-relationship"
                      value={relationship}
                      onChange={(e) => setRelationship(e.target.value)}
                      required
                      disabled={isSubmitting}
                    >
                      <option value="father">Father</option>
                      <option value="mother">Mother</option>
                      <option value="guardian">Guardian</option>
                      <option value="other">Other</option>
                    </select>
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
              onClick={onClose}
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
