import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import PageTitle from "../../components/PageTitle.jsx";
import DataTable from "../../components/DataTable.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import DriverModal from "./DriverModal.jsx";
import { getDrivers } from "../../api/drivers.js";

export default function Drivers() {
  const { me } = useOutletContext() || {};

  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [driverToEdit, setDriverToEdit] = useState(null);

  // Load drivers on mount. This is the ONLY request this screen makes on page load.
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError("");

    getDrivers()
      .then((data) => {
        if (!isMounted) return;
        setDrivers(data);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || "Failed to load drivers.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const reloadDrivers = async () => {
    try {
      const data = await getDrivers();
      setDrivers(data);
    } catch (err) {
      setError(err.message || "Failed to reload drivers.");
    }
  };

  const filteredDrivers = drivers.filter((driver) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const nameMatch = (driver.fullName || "").toLowerCase().includes(query);
    const phoneMatch = (driver.phone || "").toLowerCase().includes(query);
    const licenseMatch = (driver.licenseNumber || "")
      .toLowerCase()
      .includes(query);
    return nameMatch || phoneMatch || licenseMatch;
  });

  const openCreate = () => {
    setDriverToEdit(null);
    setIsModalOpen(true);
  };

  const openEdit = (driver) => {
    setDriverToEdit(driver);
    setIsModalOpen(true);
  };

  return (
    <>
      <PageTitle
        title="Drivers"
        description="Manage school drivers and licenses."
        button="+ Add Driver"
        onButtonClick={openCreate}
      />

      <div className="filter-card search-only">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by driver name, phone or license..."
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
          Loading drivers...
        </p>
      ) : drivers.length === 0 && !searchQuery ? (
        <div className="branch-empty-card">
          <i className="bi bi-person-badge"></i>
          <h3>No drivers found</h3>
          <p>Get started by adding the first driver to your school.</p>
          <button
            type="button"
            className="branch-empty-action"
            onClick={openCreate}
          >
            + Add Driver
          </button>
        </div>
      ) : (
        <DataTable
          headers={[
            "Name",
            "Phone",
            "License Number",
            "License Expiry",
            "Branch",
            "Status",
            "Actions",
          ]}
          className="users-table-card"
          rows={filteredDrivers.map((driver) => [
            <strong key={`name-${driver.id}`}>{driver.fullName}</strong>,
            driver.phone || (
              <span key={`phone-${driver.id}`} className="muted-cell">
                -
              </span>
            ),
            driver.licenseNumber || (
              <span key={`lic-${driver.id}`} className="muted-cell">
                -
              </span>
            ),
            driver.licenseExpiry || (
              <span key={`exp-${driver.id}`} className="muted-cell">
                -
              </span>
            ),
            // Raw branch_id shown until backend returns branch_name directly
            driver.branchId ? (
              <code key={`branch-${driver.id}`}>{driver.branchId}</code>
            ) : (
              <span key={`branch-${driver.id}`} className="muted-cell">
                Not assigned
              </span>
            ),
            <StatusBadge
              key={`status-${driver.id}`}
              status={driver.isActive ? "Active" : "Inactive"}
            />,
            <div key={`actions-${driver.id}`} className="action-buttons">
              <button
                type="button"
                className="action-icon"
                title="Edit driver"
                onClick={() => openEdit(driver)}
              >
                <i className="bi bi-pencil"></i>
              </button>
            </div>,
          ])}
          withoutFilter={false}
          footer={`Showing ${filteredDrivers.length} of ${drivers.length} drivers`}
        />
      )}

      {isModalOpen && (
        <DriverModal
          isOpen={isModalOpen}
          driver={driverToEdit}
          schoolId={me?.school_id}
          onClose={() => setIsModalOpen(false)}
          onSaved={reloadDrivers}
        />
      )}
    </>
  );
}
