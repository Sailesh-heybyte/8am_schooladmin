import { useState, useEffect } from "react";
import {
  getPermissions,
  getSchoolRole,
  createRole,
  updateSchoolRolePermissions,
} from "../../api/roles.js";
import "./RoleModal.scss";

export default function RoleModal({ isOpen, role, onClose, onSaved }) {
  const isEditMode = Boolean(role && role.id);

  const [name, setName] = useState(role ? role.name : "");
  const [permissionsList, setPermissionsList] = useState([]);
  const [checkedCodenames, setCheckedCodenames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRoleLoaded, setIsRoleLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmZeroWarning, setConfirmZeroWarning] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoading(true);
    setError("");
    setConfirmZeroWarning(false);

    if (isEditMode) {
      setName(role.name);
      setCheckedCodenames([]);
      setIsRoleLoaded(false);

      Promise.all([getPermissions(), getSchoolRole(role.id)])
        .then(([perms, roleDetail]) => {
          if (!isMounted) return;
          setPermissionsList(perms);
          setName(roleDetail.name);
          setCheckedCodenames(roleDetail.permissionCodenames);
          setIsRoleLoaded(true);
        })
        .catch((err) => {
          if (!isMounted) return;
          setError(err.message || "Failed to load role details.");
        })
        .finally(() => {
          if (isMounted) {
            setIsLoading(false);
          }
        });
    } else {
      setName("");
      setCheckedCodenames([]);
      setIsRoleLoaded(true);

      getPermissions()
        .then((perms) => {
          if (!isMounted) return;
          setPermissionsList(perms);
        })
        .catch((err) => {
          if (!isMounted) return;
          setError(err.message || "Failed to load permissions list.");
        })
        .finally(() => {
          if (isMounted) {
            setIsLoading(false);
          }
        });
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, isEditMode, role]);

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
        await updateSchoolRolePermissions(role.id, checkedCodenames);
      } else {
        await createRole({
          name: name.trim(),
          permissionCodenames: checkedCodenames,
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

  const isSaveDisabled =
    isSubmitting ||
    isLoading ||
    (isEditMode && !isRoleLoaded) ||
    Boolean(error);

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
                    disabled={isSaveDisabled}
                  >
                    {allSelected ? "Deselect All" : "Select All"}
                  </button>
                  <span>{`${checkedCodenames.length} selected`}</span>
                </div>
              </div>

              {isLoading ? (
                <p className="roles-message" style={{ margin: "1rem 0" }}>
                  Loading permissions...
                </p>
              ) : (!isEditMode || isRoleLoaded) && !error ? (
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
              ) : null}
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
              disabled={isSaveDisabled}
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
