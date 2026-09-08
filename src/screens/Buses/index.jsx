import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import PageTitle from "../../components/PageTitle.jsx";
import DataTable from "../../components/DataTable.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import BusModal from "./BusModal.jsx";
import AssignDriverModal from "./AssignDriverModal.jsx";
import { getBuses, unassignDriver } from "../../api/buses.js";

export default function Buses() {
  const { me } = useOutletContext() || {};

  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [busToEdit, setBusToEdit] = useState(null);
  const [busToAssign, setBusToAssign] = useState(null);
  const [busToUnassign, setBusToUnassign] = useState(null);
  const [isUnassigning, setIsUnassigning] = useState(false);
  const [unassignError, setUnassignError] = useState("");

  // Load buses on mount
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError("");

    getBuses()
      .then((data) => {
        if (!isMounted) return;
        setBuses(data);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || "Failed to load buses.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const reloadBuses = async () => {
    try {
      const data = await getBuses();
      setBuses(data);
    } catch (err) {
      setError(err.message || "Failed to reload buses.");
    }
  };

  const handleConfirmUnassign = async () => {
    if (!busToUnassign) return;
    setIsUnassigning(true);
    setUnassignError("");

    try {
      await unassignDriver(busToUnassign.id);
      setBusToUnassign(null);
      await reloadBuses();
    } catch (err) {
      setUnassignError(err.message || "Failed to unassign driver.");
    } finally {
      setIsUnassigning(false);
    }
  };

  const filteredBuses = buses.filter((bus) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const nameMatch = (bus.busName || "").toLowerCase().includes(query);
    const regMatch = (bus.registrationNumber || "")
      .toLowerCase()
      .includes(query);
    return nameMatch || regMatch;
  });

  const openCreate = () => {
    setBusToEdit(null);
    setIsModalOpen(true);
  };

  const openEdit = (bus) => {
    setBusToEdit(bus);
    setIsModalOpen(true);
  };

  return (
    <>
      <PageTitle
        title="Buses"
        description="Manage school buses and fleet assignments."
        button="+ Add Bus"
        onButtonClick={openCreate}
      />

      <div className="filter-card search-only">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by bus name or registration..."
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
          Loading buses...
        </p>
      ) : buses.length === 0 && !searchQuery ? (
        <div className="branch-empty-card">
          <i className="bi bi-bus-front"></i>
          <h3>No buses found</h3>
          <p>Get started by adding the first bus to your school fleet.</p>
          <button
            type="button"
            className="branch-empty-action"
            onClick={openCreate}
          >
            + Add Bus
          </button>
        </div>
      ) : (
        <DataTable
          headers={[
            "Bus Name",
            "Registration",
            "Capacity",
            "Driver",
            "Branch",
            "Status",
            "Actions",
          ]}
          className="users-table-card"
          rows={filteredBuses.map((bus) => [
            <strong key={`name-${bus.id}`}>{bus.busName}</strong>,
            bus.registrationNumber || (
              <span key={`reg-${bus.id}`} className="muted-cell">
                -
              </span>
            ),
            bus.capacity,
            // Raw driver_id shown until backend returns driver_name directly
            bus.driverId ? (
              <code key={`driver-${bus.id}`}>{bus.driverId}</code>
            ) : (
              <span key={`driver-${bus.id}`} className="muted-cell">
                No driver
              </span>
            ),
            // Raw branch_id shown until backend returns branch_name directly
            bus.branchId ? (
              <code key={`branch-${bus.id}`}>{bus.branchId}</code>
            ) : (
              <span key={`branch-${bus.id}`} className="muted-cell">
                Not assigned
              </span>
            ),
            <StatusBadge
              key={`status-${bus.id}`}
              status={bus.isActive ? "Active" : "Inactive"}
            />,
            <div key={`actions-${bus.id}`} className="action-buttons">
              <button
                type="button"
                className="action-icon"
                title="Edit bus"
                onClick={() => openEdit(bus)}
              >
                <i className="bi bi-pencil"></i>
              </button>
              {bus.driverId ? (
                <button
                  type="button"
                  className="action-icon danger"
                  title="Unassign driver"
                  onClick={() => {
                    setUnassignError("");
                    setBusToUnassign(bus);
                  }}
                >
                  <i className="bi bi-person-dash"></i>
                </button>
              ) : (
                <button
                  type="button"
                  className="action-icon"
                  title="Assign driver"
                  onClick={() => setBusToAssign(bus)}
                >
                  <i className="bi bi-person-plus"></i>
                </button>
              )}
            </div>,
          ])}
          withoutFilter={false}
          footer={`Showing ${filteredBuses.length} of ${buses.length} buses`}
        />
      )}

      {isModalOpen && (
        <BusModal
          isOpen={isModalOpen}
          bus={busToEdit}
          schoolId={me?.school_id}
          onClose={() => setIsModalOpen(false)}
          onSaved={reloadBuses}
        />
      )}

      {Boolean(busToAssign) && (
        <AssignDriverModal
          isOpen={Boolean(busToAssign)}
          bus={busToAssign}
          onClose={() => setBusToAssign(null)}
          onSaved={reloadBuses}
        />
      )}

      {busToUnassign && (
        <div
          className="add-user-overlay"
          onMouseDown={() => !isUnassigning && setBusToUnassign(null)}
        >
          <div
            className="add-user-modal"
            style={{ width: "28rem" }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="add-user-header">
              <div>
                <h2>Unassign Driver</h2>
                <p>{busToUnassign.busName}</p>
              </div>
              <button
                type="button"
                className="add-user-close"
                onClick={() => setBusToUnassign(null)}
                disabled={isUnassigning}
              >
                <i className="bi bi-x"></i>
              </button>
            </div>

            <div className="add-user-body" style={{ padding: "1.25rem" }}>
              <p style={{ margin: 0, color: "#475467", fontSize: "0.9rem" }}>
                Remove this driver from the bus? The driver stays in the system.
              </p>
              {unassignError && (
                <div className="add-user-error" style={{ marginTop: "1rem" }}>
                  {unassignError}
                </div>
              )}
            </div>

            <div className="add-user-footer">
              <button
                type="button"
                className="modal-cancel"
                onClick={() => setBusToUnassign(null)}
                disabled={isUnassigning}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-save"
                style={{ background: "#d9534f", borderColor: "#d9534f" }}
                onClick={handleConfirmUnassign}
                disabled={isUnassigning}
              >
                {isUnassigning ? "Unassigning..." : "Unassign Driver"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
