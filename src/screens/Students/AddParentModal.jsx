import { useState, useEffect } from "react";
import { addStudentParents } from "../../api/students.js";
import { getParents } from "../../api/parents.js";
import TypeAhead from "../../components/TypeAhead.jsx";
import "../Roles/RoleModal.scss";

export default function AddParentModal({ isOpen, student, onClose, onSaved }) {
  const [parentId, setParentId] = useState("");
  const [relationship, setRelationship] = useState("");
  const [parents, setParents] = useState([]);
  const [parentsLoading, setParentsLoading] = useState(false);
  const [parentsError, setParentsError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !student) return;
    setParentId("");
    setRelationship("");
    setError("");
    setIsSubmitting(false);
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
  }, [isOpen, student]);

  if (!isOpen || !student) return null;

  const linkedParentIds = new Set(
    (student.parents || []).map((p) => p.parentId)
  );

  const parentOptions = parents
    .filter((p) => !linkedParentIds.has(p.id))
    .map((p) => ({
      value: p.id,
      label: p.phone ? `${p.fullName} · ${p.phone}` : p.fullName,
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!parentId || !parentId.trim()) {
      setError("Please select a parent.");
      return;
    }

    setIsSubmitting(true);

    try {
      await addStudentParents(student.id, [
        {
          parentId: parentId.trim(),
          relationship: relationship.trim(),
        },
      ]);

      if (onSaved) {
        await onSaved();
      }
      onClose();
    } catch (err) {
      setError(err.message || "Failed to add parent. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSaveDisabled =
    isSubmitting || !parentId || !parentId.trim() || parentsLoading;

  return (
    <div className="add-user-overlay" onMouseDown={onClose}>
      <div
        className="add-user-modal"
        style={{ width: "36rem" }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="add-user-header">
          <div>
            <h2>Add Parent</h2>
            <p>Link a parent or guardian to {student.fullName}.</p>
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
              <h3 className="form-section-title">Parent Contact</h3>

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
                  <label htmlFor="add-parent-relationship">Relationship</label>
                  <select
                    id="add-parent-relationship"
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    disabled={isSubmitting}
                  >
                    <option value="father">Father</option>
                    <option value="mother">Mother</option>
                    <option value="guardian">Guardian</option>
                  </select>
                </div>
              </div>
            </div>
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
              {isSubmitting ? "Adding..." : "Add Parent"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
