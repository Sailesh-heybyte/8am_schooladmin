import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import PageTitle from "../../components/PageTitle.jsx";
import DataTable from "../../components/DataTable.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import ParentModal from "./ParentModal.jsx";
import ParentDetailsModal from "./ParentDetailsModal.jsx";
import { getParents, setParentActive } from "../../api/parents.js";

export default function Parents() {
  const { me } = useOutletContext() || {};

  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [parentToToggle, setParentToToggle] = useState(null);
  const [isToggling, setIsToggling] = useState(false);
  const [toggleError, setToggleError] = useState("");
  const [openMenuParentId, setOpenMenuParentId] = useState(null);
  const [parentForDetails, setParentForDetails] = useState(null);

  // Load parents on mount. This is the ONLY request this screen makes on page load.
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError("");

    getParents()
      .then((data) => {
        if (!isMounted) return;
        setParents(data);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || "Failed to load parents.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Close the three-dot action menu when clicking anywhere outside
  useEffect(() => {
    if (!openMenuParentId) return;

    const handleClickOutside = (e) => {
      if (!e.target.closest(".actions-menu-container")) {
        setOpenMenuParentId(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openMenuParentId]);

  const reloadParents = async () => {
    try {
      const data = await getParents();
      setParents(data);
    } catch (err) {
      setError(err.message || "Failed to reload parents.");
    }
  };

  const handleConfirmToggle = async () => {
    if (!parentToToggle) return;
    setIsToggling(true);
    setToggleError("");

    try {
      await setParentActive(parentToToggle.id, !parentToToggle.isActive);
      setParentToToggle(null);
      await reloadParents();
    } catch (err) {
      setToggleError(err.message || "Failed to update parent status.");
    } finally {
      setIsToggling(false);
    }
  };

  const filteredParents = parents.filter((parent) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const nameMatch = (parent.fullName || "").toLowerCase().includes(query);
    const phoneMatch = (parent.phone || "").toLowerCase().includes(query);
    return nameMatch || phoneMatch;
  });

  const openCreate = () => {
    setIsModalOpen(true);
  };

  return (
    <>
      <PageTitle
        title="Parents"
        description="Manage parents and guardians."
        button="+ Add Parent"
        onButtonClick={openCreate}
      />

      <div className="filter-card search-only">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by parent name or phone..."
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
          Loading parents...
        </p>
      ) : parents.length === 0 && !searchQuery ? (
        <div className="branch-empty-card">
          <i className="bi bi-people"></i>
          <h3>No parents found</h3>
          <p>Get started by adding the first parent to your school.</p>
          <button
            type="button"
            className="branch-empty-action"
            onClick={openCreate}
          >
            + Add Parent
          </button>
        </div>
      ) : (
        <DataTable
          headers={["Name", "Phone", "Branch", "Status", "Actions"]}
          className="users-table-card"
          rows={filteredParents.map((parent) => [
            <strong key={`name-${parent.id}`}>{parent.fullName}</strong>,
            parent.phone || (
              <span key={`phone-${parent.id}`} className="muted-cell">
                -
              </span>
            ),
            // Raw branch_id shown until backend returns branch_name directly
            parent.branchId ? (
              <code key={`branch-${parent.id}`}>{parent.branchId}</code>
            ) : (
              <span key={`branch-${parent.id}`} className="muted-cell">
                Not assigned
              </span>
            ),
            <StatusBadge
              key={`status-${parent.id}`}
              status={parent.isActive ? "Active" : "Inactive"}
            />,
            <div
              key={`actions-${parent.id}`}
              className="actions-menu-container"
            >
              <button
                type="button"
                className="action-icon"
                title="Actions"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuParentId((prev) =>
                    prev === parent.id ? null : parent.id,
                  );
                }}
              >
                <i className="bi bi-three-dots-vertical"></i>
              </button>

              {openMenuParentId === parent.id && (
                <div className="actions-dropdown-menu">
                  <button
                    type="button"
                    className="dropdown-item"
                    onClick={() => {
                      setOpenMenuParentId(null);
                      setParentForDetails(parent);
                    }}
                  >
                    <i className="bi bi-eye"></i>
                    <span>View details</span>
                  </button>
                  {parent.isActive ? (
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={() => {
                        setOpenMenuParentId(null);
                        setToggleError("");
                        setParentToToggle(parent);
                      }}
                    >
                      <i className="bi bi-toggle-on"></i>
                      <span>Deactivate parent</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={() => {
                        setOpenMenuParentId(null);
                        setToggleError("");
                        setParentToToggle(parent);
                      }}
                    >
                      <i className="bi bi-toggle-off"></i>
                      <span>Activate parent</span>
                    </button>
                  )}
                </div>
              )}
            </div>,
          ])}
          withoutFilter={false}
          footer={`Showing ${filteredParents.length} of ${parents.length} parents`}
        />
      )}

      {isModalOpen && (
        <ParentModal
          isOpen={isModalOpen}
          schoolId={me?.school_id}
          onClose={() => setIsModalOpen(false)}
          onSaved={reloadParents}
        />
      )}

      {Boolean(parentForDetails) && (
        <ParentDetailsModal
          isOpen={Boolean(parentForDetails)}
          parentId={parentForDetails?.id}
          onClose={() => setParentForDetails(null)}
        />
      )}

      {parentToToggle && (
        <div
          className="add-user-overlay"
          onMouseDown={() => !isToggling && setParentToToggle(null)}
        >
          <div
            className="add-user-modal"
            style={{ width: "28rem" }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="add-user-header">
              <div>
                <h2>
                  {parentToToggle.isActive
                    ? "Deactivate Parent"
                    : "Activate Parent"}
                </h2>
                <p>{parentToToggle.fullName}</p>
              </div>
              <button
                type="button"
                className="add-user-close"
                onClick={() => setParentToToggle(null)}
                disabled={isToggling}
              >
                <i className="bi bi-x"></i>
              </button>
            </div>

            <div className="add-user-body" style={{ padding: "1.25rem" }}>
              <p style={{ margin: 0, color: "#475467", fontSize: "0.9rem" }}>
                {parentToToggle.isActive
                  ? "Deactivate this parent? They will stay linked to their students but the account will be inactive."
                  : "Activate this parent?"}
              </p>
              {toggleError && (
                <div className="add-user-error" style={{ marginTop: "1rem" }}>
                  {toggleError}
                </div>
              )}
            </div>

            <div className="add-user-footer">
              <button
                type="button"
                className="modal-cancel"
                onClick={() => setParentToToggle(null)}
                disabled={isToggling}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-save"
                style={
                  parentToToggle.isActive
                    ? { background: "#d9534f", borderColor: "#d9534f" }
                    : undefined
                }
                onClick={handleConfirmToggle}
                disabled={isToggling}
              >
                {isToggling
                  ? parentToToggle.isActive
                    ? "Deactivating..."
                    : "Activating..."
                  : parentToToggle.isActive
                    ? "Deactivate Parent"
                    : "Activate Parent"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
