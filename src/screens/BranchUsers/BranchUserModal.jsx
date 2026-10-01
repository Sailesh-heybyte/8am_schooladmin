import { useState, useEffect } from "react";
import { createUser } from "../../api/users.js";
import { useBranches } from "../../context/BranchesContext.jsx";
import { getRoles } from "../../api/roles.js";
import "../Roles/RoleModal.scss";
import "./BranchUserModal.scss";
import TypeAhead from "../../components/TypeAhead.jsx";

const INITIAL_FORM_DATA = {
  fullName: "",
  email: "",
  phoneNumber: "",
  branchId: "",
  roleIds: [],
  dateOfBirth: "",
  gender: "",
  maritalStatus: "",
  nationality: "",
  joiningDate: "",
  addressLine1: "",
  city: "",
  state: "",
  country: "",
  postalCode: "",
  emergencyName: "",
  emergencyRelationship: "",
  emergencyPhone: "",
  bankName: "",
  bankAccountNumber: "",
  bankIfscCode: "",
  panNumber: "",
  aadhaarNumber: "",
  skills: "",
  notes: "",
};

export default function BranchUserModal({
  isOpen,
  me,
  onClose,
  onSaved,
}) {
  const isPinned = Boolean(me.branch_id);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const { branches, branchesLoading, branchesError, loadBranches } =
    useBranches();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    setFormData({
      ...INITIAL_FORM_DATA,
      branchId: isPinned ? me.branch_id : "",
    });
    setError("");
    setIsSubmitting(false);

    if (!isPinned) {
      loadBranches();
    }

    let isMounted = true;
    setLoading(true);
    setLoadError("");

    getRoles()
      .then((rolesData) => {
        if (!isMounted) return;
        setRoles(rolesData);
      })
      .catch((err) => {
        if (!isMounted) return;
        setLoadError(err.message || "Failed to load roles.");
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, isPinned, me.branch_id, loadBranches]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhoneChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 10);
    setFormData((prev) => ({ ...prev, phoneNumber: raw }));
  };

  const handleEmergencyPhoneChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 10);
    setFormData((prev) => ({ ...prev, emergencyPhone: raw }));
  };

  const handleAadhaarChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 12);
    setFormData((prev) => ({ ...prev, aadhaarNumber: raw }));
  };

  const toggleRole = (roleId) => {
    setFormData((prev) => ({
      ...prev,
      roleIds: prev.roleIds.includes(roleId)
        ? prev.roleIds.filter((id) => id !== roleId)
        : [...prev.roleIds, roleId],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      loading ||
      (!isPinned && branchesLoading) ||
      Boolean(loadError) ||
      (!isPinned && Boolean(branchesError))
    )
      return;
    setError("");

    if (!formData.fullName.trim()) {
      setError("Full Name is required.");
      return;
    }
    if (!formData.email.trim()) {
      setError("Email is required.");
      return;
    }
    if (formData.phoneNumber.length !== 10) {
      setError("Phone number must be exactly 10 digits.");
      return;
    }
    if (!isPinned && !formData.branchId) {
      setError("Please select a branch.");
      return;
    }
    if (formData.roleIds.length === 0) {
      setError("Please select at least one role.");
      return;
    }
    if (formData.emergencyPhone && formData.emergencyPhone.length !== 10) {
      setError("Emergency phone number must be exactly 10 digits.");
      return;
    }
    if (formData.aadhaarNumber && formData.aadhaarNumber.length !== 12) {
      setError("Aadhaar number must be exactly 12 digits.");
      return;
    }

    setIsSubmitting(true);

    try {
      await createUser({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phoneNumber: `+91${formData.phoneNumber.trim()}`,
        branchId: isPinned ? me.branch_id : formData.branchId,
        roleIds: formData.roleIds,

        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        maritalStatus: formData.maritalStatus,
        nationality: formData.nationality.trim(),
        joiningDate: formData.joiningDate,

        addressLine1: formData.addressLine1.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        country: formData.country.trim(),
        postalCode: formData.postalCode.trim(),

        emergencyName: formData.emergencyName.trim(),
        emergencyRelationship: formData.emergencyRelationship.trim(),
        emergencyPhone: formData.emergencyPhone.trim()
          ? `+91${formData.emergencyPhone.trim()}`
          : "",

        bankName: formData.bankName.trim(),
        bankAccountNumber: formData.bankAccountNumber.trim(),
        bankIfscCode: formData.bankIfscCode.trim().toUpperCase(),

        panNumber: formData.panNumber.trim().toUpperCase(),
        aadhaarNumber: formData.aadhaarNumber.trim(),

        skills: formData.skills.trim(),
        notes: formData.notes.trim(),
      });

      if (onSaved) {
        await onSaved();
      }
      onClose();
    } catch (err) {
      setError(
        err.message || "Failed to create branch user. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSaveDisabled =
    isSubmitting ||
    loading ||
    (!isPinned && branchesLoading) ||
    Boolean(loadError) ||
    (!isPinned && Boolean(branchesError));

  const requestClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  return (
    <div className="add-user-overlay">
      <div className="add-user-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="add-user-header">
          <div>
            <h2>Create Branch User</h2>
            <p>Fill in user details and assign them to a branch.</p>
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
              <h3 className="form-section-title">User Information</h3>
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="user-fullname">Full Name *</label>
                  <input
                    id="user-fullname"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleChange("fullName", e.target.value)}
                    placeholder="Asha Menon"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="user-email">Email *</label>
                  <input
                    id="user-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="asha@school.edu"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="user-phone">Phone Number (10 digits) *</label>
                  <input
                    id="user-phone"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={handlePhoneChange}
                    placeholder="9876543210"
                    maxLength={10}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3 className="form-section-title">Branch and Roles</h3>
              {!isPinned && (
                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="user-branch">Branch *</label>
                    <TypeAhead
                      options={branches.map((b) => ({ value: b.id, label: b.branchName }))}
                      value={formData.branchId}
                      onChange={(value) => handleChange("branchId", value)}
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
                  <div className="form-field" />
                  <div className="form-field" />
                </div>
              )}

              <div className="roles-selection-block">
                <label className="roles-label">Assign Roles *</label>
                {loading ? (
                  <p className="roles-message">Loading roles...</p>
                ) : roles.length === 0 ? (
                  <p className="roles-message">No roles available.</p>
                ) : (
                  <div className="roles-grid">
                    {roles.map((role) => {
                      const isChecked = formData.roleIds.includes(role.id);
                      return (
                        <label
                          key={role.id}
                          className={`role-option-card ${isChecked ? "selected" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleRole(role.id)}
                            disabled={isSubmitting || Boolean(loadError)}
                          />
                          <span className="role-option-name">{role.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="form-section">
              <h3 className="form-section-title">Personal Details</h3>
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="user-dob">Date of Birth</label>
                  <input
                    id="user-dob"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) =>
                      handleChange("dateOfBirth", e.target.value)
                    }
                    disabled={isSubmitting}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="user-gender">Gender</label>
                  <TypeAhead
                    options={[
                      { value: "male", label: "Male" },
                      { value: "female", label: "Female" },
                      { value: "other", label: "Other" },
                    ]}
                    value={formData.gender}
                    onChange={(value) => handleChange("gender", value)}
                    placeholder="Select gender..."
                    disabled={isSubmitting}
                    noMatchMessage="No options found"
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="user-marital-status">Marital Status</label>
                  <TypeAhead
                    options={[
                      { value: "single", label: "Single" },
                      { value: "married", label: "Married" },
                      { value: "divorced", label: "Divorced" },
                      { value: "widowed", label: "Widowed" },
                    ]}
                    value={formData.maritalStatus}
                    onChange={(value) => handleChange("maritalStatus", value)}
                    placeholder="Select marital status..."
                    disabled={isSubmitting}
                    noMatchMessage="No options found"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="user-nationality">Nationality</label>
                  <input
                    id="user-nationality"
                    type="text"
                    value={formData.nationality}
                    onChange={(e) =>
                      handleChange("nationality", e.target.value)
                    }
                    placeholder="Indian"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="user-joining-date">Joining Date</label>
                  <input
                    id="user-joining-date"
                    type="date"
                    value={formData.joiningDate}
                    onChange={(e) =>
                      handleChange("joiningDate", e.target.value)
                    }
                    disabled={isSubmitting}
                  />
                </div>
                <div className="form-field" />
              </div>
            </div>

            <div className="form-section">
              <h3 className="form-section-title">Address</h3>
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="user-address-line1">Address Line 1</label>
                  <input
                    id="user-address-line1"
                    type="text"
                    value={formData.addressLine1}
                    onChange={(e) =>
                      handleChange("addressLine1", e.target.value)
                    }
                    placeholder="123 Main St"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="user-city">City</label>
                  <input
                    id="user-city"
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    placeholder="Pune"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="user-state">State</label>
                  <input
                    id="user-state"
                    type="text"
                    value={formData.state}
                    onChange={(e) => handleChange("state", e.target.value)}
                    placeholder="Maharashtra"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="user-country">Country</label>
                  <input
                    id="user-country"
                    type="text"
                    value={formData.country}
                    onChange={(e) => handleChange("country", e.target.value)}
                    placeholder="India"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="user-postal-code">Postal Code</label>
                  <input
                    id="user-postal-code"
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => handleChange("postalCode", e.target.value)}
                    placeholder="411001"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="form-field" />
              </div>
            </div>

            <div className="form-section">
              <h3 className="form-section-title">Emergency Contact</h3>
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="user-emergency-name">Contact Name</label>
                  <input
                    id="user-emergency-name"
                    type="text"
                    value={formData.emergencyName}
                    onChange={(e) =>
                      handleChange("emergencyName", e.target.value)
                    }
                    placeholder="Rahul Menon"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="user-emergency-relationship">
                    Relationship
                  </label>
                  <input
                    id="user-emergency-relationship"
                    type="text"
                    value={formData.emergencyRelationship}
                    onChange={(e) =>
                      handleChange("emergencyRelationship", e.target.value)
                    }
                    placeholder="Brother"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="user-emergency-phone">
                    Emergency Phone (10 digits)
                  </label>
                  <input
                    id="user-emergency-phone"
                    type="tel"
                    value={formData.emergencyPhone}
                    onChange={handleEmergencyPhoneChange}
                    placeholder="9876543210"
                    maxLength={10}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3 className="form-section-title">Bank Details</h3>
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="user-bank-name">Bank Name</label>
                  <input
                    id="user-bank-name"
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => handleChange("bankName", e.target.value)}
                    placeholder="State Bank of India"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="user-bank-account">Account Number</label>
                  <input
                    id="user-bank-account"
                    type="text"
                    value={formData.bankAccountNumber}
                    onChange={(e) =>
                      handleChange("bankAccountNumber", e.target.value)
                    }
                    placeholder="1234567890"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="user-bank-ifsc">IFSC Code</label>
                  <input
                    id="user-bank-ifsc"
                    type="text"
                    value={formData.bankIfscCode}
                    onChange={(e) =>
                      handleChange("bankIfscCode", e.target.value)
                    }
                    placeholder="SBIN0001234"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3 className="form-section-title">Government Details</h3>
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="user-pan">PAN Number</label>
                  <input
                    id="user-pan"
                    type="text"
                    value={formData.panNumber}
                    onChange={(e) => handleChange("panNumber", e.target.value)}
                    placeholder="ABCDE1234F"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="user-aadhaar">
                    Aadhaar Number (12 digits)
                  </label>
                  <input
                    id="user-aadhaar"
                    type="text"
                    value={formData.aadhaarNumber}
                    onChange={handleAadhaarChange}
                    placeholder="12-digit Aadhaar"
                    maxLength={12}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="form-field" />
              </div>
            </div>

            <div className="form-section">
              <h3 className="form-section-title">Additional</h3>
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="user-skills">Skills (comma-separated)</label>
                  <input
                    id="user-skills"
                    type="text"
                    value={formData.skills}
                    onChange={(e) => handleChange("skills", e.target.value)}
                    placeholder="Driving, First Aid"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="user-notes">Notes</label>
                  <input
                    id="user-notes"
                    type="text"
                    value={formData.notes}
                    onChange={(e) => handleChange("notes", e.target.value)}
                    placeholder="Additional notes..."
                    disabled={isSubmitting}
                  />
                </div>
                <div className="form-field" />
              </div>
            </div>
          </div>

          {(loadError || (!isPinned && branchesError)) && (
            <div
              className="roles-error"
              style={{ margin: "0 1.5rem 1rem", color: "#d9534f" }}
            >
              {loadError || branchesError}
            </div>
          )}

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
              {isSubmitting ? "Creating..." : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
