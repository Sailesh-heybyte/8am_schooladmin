import { useState, useEffect } from "react";
import { createParent } from "../../api/parents.js";
import { getBranches } from "../../api/branches.js";
import "../Roles/RoleModal.scss";

export default function ParentModal({
  isOpen,
  schoolId,
  onClose,
  onSaved,
}) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [branchId, setBranchId] = useState("");

  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branchesError, setBranchesError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Reset form when modal opens
  useEffect(() => {
    if (!isOpen) return;

    setFullName("");
    setPhone("");
    setBranchId("");
    setError("");
    setIsSubmitting(false);
  }, [isOpen]);

  // Load branches inside the modal only
  useEffect(() => {
    if (!isOpen) return;

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

    const cleanedPhone = phone.replace(/\D/g, "");
    if (cleanedPhone.length !== 10) {
      setError("Phone number must be exactly 10 digits.");
      return;
    }

    if (!branchId) {
      setError("Please select a branch.");
      return;
    }

    setIsSubmitting(true);

    try {
      await createParent({
        fullName: fullName.trim(),
        phone: `+91-${cleanedPhone}`,
        branchId,
      });

      if (onSaved) {
        await onSaved();
      }
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save parent. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSaveDisabled =
    isSubmitting ||
    branchesLoading ||
    Boolean(branchesError);

  return (
    <div className="add-user-overlay" onMouseDown={onClose}>
      <div
        className="add-user-modal"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="add-user-header">
          <div>
            <h2>Add Parent</h2>
            <p>Register a new parent in your school.</p>
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
              <h3 className="form-section-title">Parent Details</h3>

              <div className="form-row">
                <div className="form-field" style={{ flex: 1, width: "100%" }}>
                  <label htmlFor="parent-fullname">Full Name *</label>
                  <input
                    id="parent-fullname"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. K Vijay"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-field" style={{ flex: 1, width: "100%" }}>
                  <label htmlFor="parent-phone">Phone (10 digits) *</label>
                  <input
                    id="parent-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setPhone(val);
                    }}
                    placeholder="e.g. 9700000002"
                    maxLength={10}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field" style={{ flex: 1, width: "100%" }}>
                  <label htmlFor="parent-branch">Branch *</label>
                  <select
                    id="parent-branch"
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
