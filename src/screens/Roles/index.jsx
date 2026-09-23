import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import PageTitle from "../../components/PageTitle.jsx";
import DataTable from "../../components/DataTable.jsx";
import RoleModal from "./RoleModal.jsx";
import AccessRestricted from "../../components/AccessRestricted.jsx";
import { isPermissionDenied } from "../../utils/errors.js";
import { useDebouncedLoading } from "../../hooks/useDebouncedLoading.js";
import { getRoles } from "../../api/roles.js";

export default function Roles() {
  const { me } = useOutletContext();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [scopeFilter, setScopeFilter] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roleToEdit, setRoleToEdit] = useState(null);

  const fetchRoles = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRoles();
      setRoles(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const isFilterActive =
    searchQuery.trim() !== "" || scopeFilter !== "All";

  const handleClear = () => {
    setSearchQuery("");
    setScopeFilter("All");
  };

  const filteredRoles = roles.filter((role) => {
    const search = searchQuery.trim().toLowerCase();
    const matchesSearch =
      search === "" || role.name.toLowerCase().includes(search);

    const matchesScope =
      scopeFilter === "All" ||
      (scopeFilter === "School-wide"
        ? role.branchId === null
        : role.branchId !== null);

    return matchesSearch && matchesScope;
  });

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


  return (
    <>
      <PageTitle
        title="Roles & Permissions"
        description="Create roles and control exactly what each team member can access."
        button="+ Create Role"
        onButtonClick={openCreate}
      />

      <div className="filter-card admin-filter">
        <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end" }}>
          <div className="filter-group">
            <label>Scope:</label>
            <select
              value={scopeFilter}
              onChange={(event) => setScopeFilter(event.target.value)}
            >
              <option value="All">All</option>
              <option value="School-wide">School-wide</option>
              <option value="Branch">Branch</option>
            </select>
          </div>

          {isFilterActive && (
            <button
              type="button"
              className="secondary-button"
              style={{ height: "2.3rem" }}
              onClick={handleClear}
            >
              Clear
            </button>
          )}
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search roles..."
          disabled={Boolean(error)}
        />
      </div>

      {error ? (
        <div className="table-state-card">
          <div className="state-icon-badge danger">
            <i className="bi bi-exclamation-triangle"></i>
          </div>
          <h3>Unable to load roles</h3>
          <p>{error.message}</p>
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
        <div className="table-card">
          <div className="table-empty">
            <span>{showLoading ? "Loading…" : ""}</span>
          </div>
        </div>
      ) : roles.length === 0 && !isFilterActive ? (
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
          headers={[
            { label: "Role", sortKey: "name" },
            { label: "Type", sortKey: "scope" },
            "Actions",
          ]}
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
            role.branchId === null ? "School-wide" : "Branch",
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
          sortValues={filteredRoles.map((role) => [
            role.name,
            role.branchId === null ? "School-wide" : "Branch",
            null,
          ])}
          withoutFilter={false}
          itemLabel="roles"
          totalCount={roles.length}
        />
      )}

      {isModalOpen && (
        <RoleModal
          isOpen={isModalOpen}
          role={roleToEdit}
          me={me}
          onClose={() => setIsModalOpen(false)}
          onSaved={fetchRoles}
        />
      )}
    </>
  );
}
