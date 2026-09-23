import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import PageTitle from "../../components/PageTitle.jsx";
import DataTable from "../../components/DataTable.jsx";
import BranchUserModal from "./BranchUserModal.jsx";
import AccessRestricted from "../../components/AccessRestricted.jsx";
import { isPermissionDenied } from "../../utils/errors.js";
import { useDebouncedLoading } from "../../hooks/useDebouncedLoading.js";
import { getUsers } from "../../api/users.js";

export default function BranchUsers() {
  const { me } = useOutletContext();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState("All branches");
  const [roleFilter, setRoleFilter] = useState("All roles");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load users on mount
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    getUsers()
      .then((usersData) => {
        if (!isMounted) return;
        setUsers(usersData);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const reloadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const usersData = await getUsers();
      setUsers(usersData);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const branchOptions = [
    ...new Set(users.map((user) => user.branchName).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b));

  const roleOptions = [
    ...new Set(users.flatMap((user) => user.roleNames)),
  ].sort((a, b) => a.localeCompare(b));

  const isFilterActive =
    searchQuery.trim() !== "" ||
    branchFilter !== "All branches" ||
    roleFilter !== "All roles" ||
    statusFilter !== "All";

  const handleClear = () => {
    setSearchQuery("");
    setBranchFilter("All branches");
    setRoleFilter("All roles");
    setStatusFilter("All");
  };

  const filteredUsers = users.filter((user) => {
    const search = searchQuery.trim().toLowerCase();
    const matchesSearch =
      search === "" ||
      user.fullName.toLowerCase().includes(search) ||
      (user.email ? user.email.toLowerCase().includes(search) : false);

    const matchesBranch =
      branchFilter === "All branches" || user.branchName === branchFilter;

    const matchesRole =
      roleFilter === "All roles" || user.roleNames.includes(roleFilter);

    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "Active" ? user.isActive : !user.isActive);

    return matchesSearch && matchesBranch && matchesRole && matchesStatus;
  });

  const openCreate = () => {
    setIsModalOpen(true);
  };

  const showLoading = useDebouncedLoading(loading, 250);

  if (isPermissionDenied(error)) {
    return (
      <>
        <PageTitle
          title="Branch Users"
          description="Manage branch users and their access permissions."
        />
        <AccessRestricted resource="branch users" onRetry={reloadUsers} />
      </>
    );
  }


  return (
    <>
      <PageTitle
        title="Branch Users"
        description="Manage branch users and their access permissions."
        button="+ Create User"
        onButtonClick={openCreate}
      />

      <div className="filter-card admin-filter">
        <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end" }}>
          {me.branch_id === null && (
            <div className="filter-group">
              <label>Branch:</label>
              <select
                value={branchFilter}
                onChange={(event) => setBranchFilter(event.target.value)}
              >
                <option value="All branches">All branches</option>
                {branchOptions.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="filter-group">
            <label>Role:</label>
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
            >
              <option value="All roles">All roles</option>
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Status:</label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="All">All</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
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
          placeholder="Search branch users..."
          disabled={Boolean(error)}
        />
      </div>

      {error ? (
        <div className="table-state-card">
          <div className="state-icon-badge danger">
            <i className="bi bi-exclamation-triangle"></i>
          </div>
          <h3>Unable to load branch users</h3>
          <p>{error.message}</p>
          <button
            type="button"
            className="state-action-btn secondary"
            onClick={reloadUsers}
          >
            <i className="bi bi-arrow-clockwise"></i>
            <span>Retry</span>
          </button>
        </div>
      ) : loading ? (
        <div className="table-card">
          <div className="table-empty">
            <span>Loading…</span>
          </div>
        </div>
      ) : users.length === 0 && !isFilterActive ? (
        <div className="table-state-card">
          <div className="state-icon-badge neutral">
            <i className="bi bi-people"></i>
          </div>
          <h3>No branch users found</h3>
          <p>Get started by adding the first user to your school branches.</p>
          <button
            type="button"
            className="state-action-btn primary"
            onClick={openCreate}
          >
            <i className="bi bi-plus-lg"></i>
            <span>+ Create User</span>
          </button>
        </div>
      ) : (
        <DataTable
          headers={[
            { label: "Name", sortKey: "fullName" },
            "Phone",
            "Email",
            { label: "Branch", sortKey: "branchName" },
            { label: "Roles", sortKey: "roleNames" },
          ]}
          className="users-table-card"
          rows={filteredUsers.map((user) => [
            <strong key={`name-${user.id}`}>{user.fullName}</strong>,
            user.phoneNumber ? (
              user.phoneNumber
            ) : (
              <span key={`phone-${user.id}`} className="muted-cell">
                -
              </span>
            ),
            user.email ? (
              user.email
            ) : (
              <span key={`email-${user.id}`} className="muted-cell">
                -
              </span>
            ),
            user.branchName ? (
              user.branchName
            ) : (
              <span key={`branch-${user.id}`} className="muted-cell">
                School-Admin
              </span>
            ),
            user.roleNames.length > 0 ? (
              user.roleNames.join(", ")
            ) : (
              <span key={`roles-${user.id}`} className="muted-cell">
                —
              </span>
            ),
          ])}
          sortValues={filteredUsers.map((user) => [
            user.fullName,
            null,
            null,
            user.branchName,
            user.roleNames.join(", "),
          ])}
          withoutFilter={false}
          itemLabel="users"
          totalCount={users.length}
        />
      )}

      {isModalOpen && (
        <BranchUserModal
          isOpen={isModalOpen}
          me={me}
          onClose={() => setIsModalOpen(false)}
          onSaved={reloadUsers}
        />
      )}
    </>
  );
}
