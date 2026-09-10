import { useState, useEffect } from "react";
import PageTitle from "../../components/PageTitle.jsx";
import DataTable from "../../components/DataTable.jsx";
import RoleModal from "./RoleModal.jsx";
import AccessRestricted, {
  isPermissionDenied,
  useDebouncedLoading,
} from "../../components/AccessRestricted.jsx";
import { getRoles } from "../../api/roles.js";

export default function Roles() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roleToEdit, setRoleToEdit] = useState(null);

  const fetchRoles = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getRoles();
      setRoles(data);
    } catch (err) {
      setError(err.message || "Could not load roles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const filteredRoles = roles.filter((role) =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const openCreate = () => {
    setRoleToEdit(null);
    setIsModalOpen(true);
  };

  const openEdit = (role) => {
    setRoleToEdit(role);
    setIsModalOpen(true);
  };

  const showLoading = useDebouncedLoading(loading, 250);

  if (isPermissionDenied(error)) {
    return (
      <>
        <PageTitle
          title="Roles & Permissions"
          description="Create roles and control exactly what each team member can access."
        />
        <AccessRestricted resource="roles" onRetry={fetchRoles} />
      </>
    );
  }

  if (loading && !showLoading) {
    return (
      <>
        <PageTitle
          title="Roles & Permissions"
          description="Create roles and control exactly what each team member can access."
        />
      </>
    );
  }

  return (
    <>
      <PageTitle
        title="Roles & Permissions"
        description="Create roles and control exactly what each team member can access."
        button="+ Create Role"
        onButtonClick={openCreate}
      />

      <div className="filter-card search-only">
        <div className="table-search-box">
          <i className="bi bi-search"></i>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search roles..."
            disabled={Boolean(error)}
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              title="Clear search"
              onClick={() => setSearchQuery("")}
            >
              <i className="bi bi-x"></i>
            </button>
          )}
        </div>
      </div>

      {error ? (
        <div className="table-state-card">
          <div className="state-icon-badge danger">
            <i className="bi bi-exclamation-triangle"></i>
          </div>
          <h3>Unable to load roles</h3>
          <p>{error}</p>
          <button
            type="button"
            className="state-action-btn secondary"
            onClick={fetchRoles}
          >
            <i className="bi bi-arrow-clockwise"></i>
            <span>Retry</span>
          </button>
        </div>
      ) : loading ? (
        <div className="table-state-card">
          <div className="state-spinner"></div>
          <p>Loading roles...</p>
        </div>
      ) : roles.length === 0 && !searchQuery ? (
        <div className="table-state-card">
          <div className="state-icon-badge neutral">
            <i className="bi bi-shield-lock"></i>
          </div>
          <h3>No roles found</h3>
          <p>Get started by creating the first role for your school team.</p>
          <button
            type="button"
            className="state-action-btn primary"
            onClick={openCreate}
          >
            <i className="bi bi-plus-lg"></i>
            <span>+ Create Role</span>
          </button>
        </div>
      ) : (
        <DataTable
          headers={["Role", "Type", "Actions"]}
          className="roles-table-card"
          rows={filteredRoles.map((role) => [
            <button
              key={`role-name-${role.id}`}
              type="button"
              className="table-link"
              onClick={() => openEdit(role)}
            >
              {role.name}
            </button>,
            "School",
            <div key={`role-actions-${role.id}`} className="action-buttons">
              <button
                type="button"
                className="action-icon"
                title="Edit permissions"
                onClick={() => openEdit(role)}
              >
                <i className="bi bi-pencil"></i>
              </button>
            </div>,
          ])}
          withoutFilter={false}
          footer={`Showing ${filteredRoles.length} of ${roles.length} roles`}
        />
      )}

      {isModalOpen && (
        <RoleModal
          isOpen={isModalOpen}
          role={roleToEdit}
          onClose={() => setIsModalOpen(false)}
          onSaved={fetchRoles}
        />
      )}
    </>
  );
}
