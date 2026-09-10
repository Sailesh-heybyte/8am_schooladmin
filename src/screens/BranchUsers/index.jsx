import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import PageTitle from "../../components/PageTitle.jsx";
import DataTable from "../../components/DataTable.jsx";
import BranchUserModal from "./BranchUserModal.jsx";
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
    try {
      const usersData = await getUsers();
      setUsers(usersData);
    } catch (err) {
      setError(err.message || "Failed to reload users.");
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

  return (
    <>
      <PageTitle
        title="Branch Users"
        description="Manage branch users and their access permissions."
        button="+ Create User"
        onButtonClick={openCreate}
      />

      <div className="filter-card search-only">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search branch users..."
        />
      </div>

      {error && (
        <div
          className="roles-error"
          style={{ margin: "1rem 0", color: "#d9534f" }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <p
          className="roles-message"
          style={{ margin: "1.5rem 0", color: "#667085" }}
        >
          Loading branch users...
        </p>
      ) : users.length === 0 && !searchQuery ? (
        <div className="branch-empty-card">
          <i className="bi bi-people"></i>
          <h3>No branch users found</h3>
          <p>Get started by adding the first user to your school branches.</p>
          <button
            type="button"
            className="branch-empty-action"
            onClick={openCreate}
          >
            + Create User
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
