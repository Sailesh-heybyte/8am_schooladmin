import { useState, useEffect } from "react";
import {
  getPermissions,
  createRole,
  assignPermissions,
} from "../../api/roles.js";
import "./RoleModal.scss";

export default function RoleModal({ isOpen, role, onClose, onSaved }) {
  const isEditMode = Boolean(role?.id);

  const [name, setName] = useState(role?.name || "");
  const [permissionsList, setPermissionsList] = useState([]);
  const [checkedCodenames, setCheckedCodenames] = useState([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmZeroWarning, setConfirmZeroWarning] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingPermissions(true);

    getPermissions()
      .then((data) => {
        if (!isMounted) return;
        setPermissionsList(data);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || "Failed to load permissions list.");
      })
      .finally(() => {
        if (isMounted) setIsLoadingPermissions(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    if (role) {
      setName(role.name || "");
      setCheckedCodenames((role.permissions || []).map((p) => p.codename));
    } else {
      setName("");
      setCheckedCodenames([]);
    }
  }, [isOpen, role]);

  if (!isOpen) return null;

  const allSelected =
    permissionsList.length > 0 &&
    permissionsList.every((permission) =>
      checkedCodenames.includes(permission.codename),
    );

  const handleToggleSelectAll = () => {
    setConfirmZeroWarning(false);
    if (allSelected) {
      setCheckedCodenames([]);
    } else {
      setCheckedCodenames(permissionsList.map((p) => p.codename));
    }
  };

  const togglePermission = (codename) => {
    setConfirmZeroWarning(false);
    setCheckedCodenames((prev) =>
      prev.includes(codename)
        ? prev.filter((item) => item !== codename)
        : [...prev, codename],
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    // If zero permissions are checked, warn and require a second click to confirm
    if (checkedCodenames.length === 0 && !confirmZeroWarning) {
      setConfirmZeroWarning(true);
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditMode) {
        await assignPermissions(role.id, checkedCodenames);
      } else {
        await createRole({
          name: name.trim(),
          permissions: checkedCodenames,
        });
      }

      onSaved();
      onClose();
    } catch (err) {
      // Modal stays open on failure, displays inline error
      setError(err.message || "Failed to save role. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-user-overlay" onMouseDown={onClose}>
      <div
        className="add-user-modal role-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="add-user-header">
          <div>
            <h2>{isEditMode ? "Edit Permissions" : "Create Role"}</h2>
            <p>Define a clear access boundary for your team.</p>
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
              <h3 className="form-section-title">Role Information</h3>
              <div className="form-row">
                <div className="form-field role-description-field">
                  <label htmlFor="role-name">Role Name</label>
                  <input
                    id="role-name"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    readOnly={isEditMode}
                    disabled={isEditMode || isSubmitting}
                    placeholder="e.g. Coordinator"
                  />
                  {isEditMode && (
                    <span
                      className="roles-message"
                      style={{ marginTop: "0.25rem", display: "block" }}
                    >
                      Role name cannot be changed after creation.
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="permission-heading">
                <h3 className="form-section-title">Assign Permissions</h3>
                <div className="permission-actions">
                  <button
                    type="button"
                    className="select-all-btn"
                    onClick={handleToggleSelectAll}
                    disabled={isLoadingPermissions || isSubmitting}
                  >
                    {allSelected ? "Deselect All" : "Select All"}
                  </button>
                  <span>{`${checkedCodenames.length} selected`}</span>
                </div>
              </div>

              {isLoadingPermissions ? (
                <p className="roles-message" style={{ margin: "1rem 0" }}>
                  Loading permissions...
                </p>
              ) : (
                <div className="permission-list">
                  {permissionsList.map((permission) => (
                    <label
                      className="permission-option"
                      key={permission.codename}
                    >
                      <input
                        type="checkbox"
                        checked={checkedCodenames.includes(permission.codename)}
                        onChange={() => togglePermission(permission.codename)}
                        disabled={isSubmitting}
                      />
                      <span>{permission.description}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {error && <div className="add-user-error">{error}</div>}

          {confirmZeroWarning && (
            <div className="add-user-error">
              Warning: 0 permissions selected. Saving will remove all
              permissions from this role. Click "
              {isEditMode ? "Save Changes" : "Create Role"}" again to confirm.
            </div>
          )}

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
              disabled={isSubmitting || isLoadingPermissions}
            >
              {isSubmitting
                ? "Saving..."
                : isEditMode
                  ? "Save Changes"
                  : "Create Role"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
