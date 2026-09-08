import { useState, useEffect } from "react";
import { createDriver, updateDriver } from "../../api/drivers.js";
import { getBranches } from "../../api/branches.js";
import "../Roles/RoleModal.scss";

export default function DriverModal({
  isOpen,
  driver = null,
  schoolId,
  onClose,
  onSaved,
}) {
  const isEditMode = Boolean(driver?.id);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseExpiry, setLicenseExpiry] = useState("");
  const [branchId, setBranchId] = useState("");

  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branchesError, setBranchesError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Prefill every field from driver prop in edit mode, reset in create mode
  useEffect(() => {
    if (!isOpen) return;

    if (driver) {
      setFullName(driver.fullName || "");
      // API sends "+91-9800000001". Strip everything except the last 10 digits for input display
      const rawPhone = driver.phone || "";
      const plainPhone = rawPhone.replace(/\D/g, "").slice(-10);
      setPhone(plainPhone);
      // Raw YYYY-MM-DD string passed directly to date input unformatted
      setLicenseNumber(driver.licenseNumber || "");
      setLicenseExpiry(driver.licenseExpiry || "");
      setBranchId(driver.branchId || "");
    } else {
      setFullName("");
      setPhone("");
      setLicenseNumber("");
      setLicenseExpiry("");
      setBranchId("");
    }
    setError("");
    setIsSubmitting(false);
  }, [isOpen, driver]);

  // Load branches inside the modal only for create mode
  useEffect(() => {
    if (!isOpen) return;
    if (driver) return; // Skip fetch entirely in edit mode

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

    if (!licenseNumber.trim()) {
      setError("License Number is required.");
      return;
    }

    if (!licenseExpiry) {
      setError("License Expiry date is required.");
      return;
    }

    if (!isEditMode && !branchId) {
      setError("Please select a branch.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditMode) {
        // Do NOT send branchId on update
        await updateDriver(driver.id, {
          fullName: fullName.trim(),
          phone: `+91-${cleanedPhone}`,
          licenseNumber: licenseNumber.trim(),
          licenseExpiry,
        });
      } else {
        await createDriver({
          fullName: fullName.trim(),
          phone: `+91-${cleanedPhone}`,
          branchId,
          licenseNumber: licenseNumber.trim(),
          licenseExpiry,
        });
      }

      if (onSaved) {
        await onSaved();
      }
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save driver. Please try again.");
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
      <div
        className="add-user-modal"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="add-user-header">
          <div>
            <h2>{isEditMode ? "Edit Driver" : "Add Driver"}</h2>
            <p>
              {isEditMode
                ? "Update driver information and license details."
                : "Add a new driver to your school."}
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
              <h3 className="form-section-title">Driver Details</h3>

              <div className="form-row">
                <div className="form-field" style={{ flex: 1, width: "100%" }}>
                  <label htmlFor="driver-fullname">Full Name *</label>
                  <input
                    id="driver-fullname"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ravi Kumar"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-field" style={{ flex: 1, width: "100%" }}>
                  <label htmlFor="driver-phone">Phone (10 digits) *</label>
                  <input
                    id="driver-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setPhone(val);
                    }}
                    placeholder="e.g. 9800000001"
                    maxLength={10}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field" style={{ flex: 1, width: "100%" }}>
                  <label htmlFor="driver-licensenumber">
                    License Number *
                  </label>
                  <input
                    id="driver-licensenumber"
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="e.g. DL-2020-111"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-field" style={{ flex: 1, width: "100%" }}>
                  <label htmlFor="driver-licenseexpiry">
                    License Expiry *
                  </label>
                  <input
                    id="driver-licenseexpiry"
                    type="date"
                    value={licenseExpiry}
                    onChange={(e) => setLicenseExpiry(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field" style={{ flex: 1, width: "100%" }}>
                  {isEditMode ? (
                    <>
                      <label htmlFor="driver-branch">Branch</label>
                      <input
                        id="driver-branch"
                        type="text"
                        value={driver.branchId || "Not assigned"}
                        readOnly
                        disabled
                      />
                      <span
                        className="roles-message"
                        style={{ marginTop: "0.25rem", display: "block" }}
                      >
                        A driver cannot be moved between branches.
                      </span>
                    </>
                  ) : (
                    <>
                      <label htmlFor="driver-branch">Branch *</label>
                      <select
                        id="driver-branch"
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
              {isSubmitting
                ? isEditMode
                  ? "Saving..."
                  : "Adding..."
                : isEditMode
                  ? "Save Changes"
                  : "Add Driver"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
