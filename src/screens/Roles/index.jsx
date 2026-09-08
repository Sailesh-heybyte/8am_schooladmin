import { useState, useEffect } from "react";
import PageTitle from "../../components/PageTitle.jsx";
import DataTable from "../../components/DataTable.jsx";
import RoleModal from "./RoleModal.jsx";
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

  return (
    <>
      <PageTitle
        title="Roles & Permissions"
        description="Create roles and control exactly what each team member can access."
        button="+ Create Role"
        onButtonClick={openCreate}
      />

      <div className="filter-card search-only">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search roles..."
        />
      </div>

      {error && (
        <div className="roles-error" style={{ margin: "1rem 0", color: "#d9534f" }}>
          {error}
        </div>
      )}

      {loading ? (
        <p className="roles-message" style={{ margin: "1.5rem 0", color: "#667085" }}>
          Loading roles...
        </p>
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
