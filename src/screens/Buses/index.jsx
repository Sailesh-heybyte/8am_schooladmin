import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import PageTitle from "../../components/PageTitle.jsx";
import DataTable from "../../components/DataTable.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import BusModal from "./BusModal.jsx";
import { getBuses } from "../../api/buses.js";

export default function Buses() {
  const { me } = useOutletContext() || {};

  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [busToEdit, setBusToEdit] = useState(null);

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
    </>
  );
}
