import { useState, useEffect } from "react";
import { addStudentParents } from "../../api/students.js";
import "../Roles/RoleModal.scss";

export default function AddParentModal({ isOpen, student, onClose, onSaved }) {
  const [parentId, setParentId] = useState("");
  const [relationship, setRelationship] = useState("father");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setParentId("");
    setRelationship("father");
    setError("");
    setIsSubmitting(false);
  }, [isOpen, student]);

  if (!isOpen || !student) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!parentId.trim()) {
      setError("Parent ID is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      await addStudentParents(student.id, [
        {
          parentId: parentId.trim(),
          relationship,
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

  const isSaveDisabled = isSubmitting || !parentId.trim();

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
                <div className="form-field" style={{ flex: 1, width: "100%" }}>
                  <label htmlFor="student-name-context">Student</label>
                  <input
                    id="student-name-context"
                    type="text"
                    value={student.fullName}
                    readOnly
                    disabled
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field" style={{ flex: 1, width: "100%" }}>
                  <label htmlFor="add-parent-id">Parent</label>
                  <input
                    id="add-parent-id"
                    type="text"
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field" style={{ flex: 1, width: "100%" }}>
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
