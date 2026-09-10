import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import PageTitle from "../../components/PageTitle.jsx";
import DataTable from "../../components/DataTable.jsx";
import BranchUserModal from "./BranchUserModal.jsx";
import AccessRestricted, {
  isPermissionDenied,
  useDebouncedLoading,
} from "../../components/AccessRestricted.jsx";
import { getUsers } from "../../api/users.js";

export default function BranchUsers() {
  const { me } = useOutletContext() || {};

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load users on mount
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError("");

    getUsers()
      .then((usersData) => {
        if (!isMounted) return;
        setUsers(usersData);
        console.log("Users", usersData);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || "Failed to load branch users.");
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
    setError("");
    try {
      const usersData = await getUsers();
      setUsers(usersData);
    } catch (err) {
      setError(err.message || "Failed to reload users.");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const nameMatch = (user.fullName || "").toLowerCase().includes(query);
    const emailMatch = (user.email || "").toLowerCase().includes(query);
    return nameMatch || emailMatch;
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

  if (loading && !showLoading) {
    return (
      <>
        <PageTitle
          title="Branch Users"
          description="Manage branch users and their access permissions."
        />
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

      <div className="filter-card search-only">
        <div className="table-search-box">
          <i className="bi bi-search"></i>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search branch users..."
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
          <h3>Unable to load branch users</h3>
          <p>{error}</p>
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
        <div className="table-state-card">
          <div className="state-spinner"></div>
          <p>Loading branch users...</p>
        </div>
      ) : users.length === 0 && !searchQuery ? (
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
          headers={["Name", "Phone", "Email", "Branch", "Roles"]}
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
            user.branchId ? (
              <code key={`branch-${user.id}`}>{user.branchId}</code>
            ) : (
              <span key={`branch-${user.id}`} className="muted-cell">
                Not assigned
              </span>
            ),
            user.roleIds && user.roleIds.length > 0 ? (
              <span key={`roles-${user.id}`}>
                {user.roleIds.map((roleId, idx) => (
                  <span key={roleId || idx}>
                    {idx > 0 ? ", " : null}
                    <code>{roleId}</code>
                  </span>
                ))}
              </span>
            ) : (
              <span key={`roles-${user.id}`} className="muted-cell">
                -
              </span>
            ),
          ])}
          withoutFilter={false}
          footer={`Showing ${filteredUsers.length} of ${users.length} users`}
        />
      )}

      {isModalOpen && (
        <BranchUserModal
          isOpen={isModalOpen}
          schoolId={me?.school_id}
          onClose={() => setIsModalOpen(false)}
          onSaved={reloadUsers}
        />
      )}
    </>
  );
}
