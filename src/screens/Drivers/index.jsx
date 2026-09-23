import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import PageTitle from "../../components/PageTitle.jsx";
import DataTable from "../../components/DataTable.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import DriverModal from "./DriverModal.jsx";
import AccessRestricted from "../../components/AccessRestricted.jsx";
import { isPermissionDenied } from "../../utils/errors.js";
import { useDebouncedLoading } from "../../hooks/useDebouncedLoading.js";
import { getDrivers } from "../../api/drivers.js";

export default function Drivers() {
  const { me } = useOutletContext();

  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState("All branches");
  const [statusFilter, setStatusFilter] = useState("All");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [driverToEdit, setDriverToEdit] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    getDrivers()
      .then((data) => {
        if (!isMounted) return;
        setDrivers(data);
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

  const reloadDrivers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDrivers();
      setDrivers(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const branchOptions = [
    ...new Set(drivers.map((driver) => driver.branchName).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b));

  const isFilterActive =
    searchQuery.trim() !== "" ||
    branchFilter !== "All branches" ||
    statusFilter !== "All";

  const handleClear = () => {
    setSearchQuery("");
    setBranchFilter("All branches");
    setStatusFilter("All");
  };

  const filteredDrivers = drivers.filter((driver) => {
    const search = searchQuery.trim().toLowerCase();
    const matchesSearch =
      search === "" ||
      driver.fullName.toLowerCase().includes(search) ||
      (driver.phone ? driver.phone.toLowerCase().includes(search) : false) ||
      (driver.licenseNumber
        ? driver.licenseNumber.toLowerCase().includes(search)
        : false);

    const matchesBranch =
      branchFilter === "All branches" || driver.branchName === branchFilter;

    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "Active" ? driver.isActive : !driver.isActive);

    return matchesSearch && matchesBranch && matchesStatus;
  });

  const openCreate = () => {
    setDriverToEdit(null);
    setIsModalOpen(true);
  };

  const openEdit = (driver) => {
    setDriverToEdit(driver);
    setIsModalOpen(true);
  };

  const showLoading = useDebouncedLoading(loading, 250);

  if (isPermissionDenied(error)) {
    return (
      <>
        <PageTitle
          title="Drivers"
          description="Manage school drivers and licenses."
        />
        <AccessRestricted resource="drivers" onRetry={reloadDrivers} />
      </>
    );
  }


  return (
    <>
      <PageTitle
        title="Drivers"
        description="Manage school drivers and licenses."
        button="+ Add Driver"
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
          placeholder="Search by driver name, phone or license..."
        />
      </div>

      {error && (
        <div
          className="roles-error"
          style={{ margin: "1rem 0", color: "#d9534f" }}
        >
          {error.message}
        </div>
      )}

      {loading ? (
        <div className="table-card">
          <div className="table-empty">
            <span>Loading…</span>
          </div>
        </div>
      ) : drivers.length === 0 && !isFilterActive ? (
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
            { label: "Name", sortKey: "fullName" },
            "Phone",
            { label: "License Number", sortKey: "licenseNumber" },
            { label: "License Expiry", sortKey: "licenseExpiry" },
            { label: "Branch", sortKey: "branchName" },
            { label: "Status", sortKey: "isActive" },
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
            driver.branchName ? (
              driver.branchName
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
          sortValues={filteredDrivers.map((driver) => [
            driver.fullName,
            null,
            driver.licenseNumber,
            driver.licenseExpiry,
            driver.branchName,
            driver.isActive,
            null,
          ])}
          withoutFilter={false}
          itemLabel="drivers"
          totalCount={drivers.length}
        />
      )}

      {isModalOpen && (
        <DriverModal
          isOpen={isModalOpen}
          driver={driverToEdit}
          me={me}
          onClose={() => setIsModalOpen(false)}
          onSaved={reloadDrivers}
        />
      )}
    </>
  );
}
