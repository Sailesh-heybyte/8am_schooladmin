import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import PageTitle from "../../components/PageTitle.jsx";
import DataTable from "../../components/DataTable.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import TypeAhead from "../../components/TypeAhead.jsx";
import BusModal from "./BusModal.jsx";
import AssignDriverModal from "./AssignDriverModal.jsx";
import AccessRestricted from "../../components/AccessRestricted.jsx";
import { isPermissionDenied } from "../../utils/errors.js";
import { useDebouncedLoading } from "../../hooks/useDebouncedLoading.js";
import { getBuses, unassignDriver } from "../../api/buses.js";

export default function Buses() {
  const { me } = useOutletContext();

  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [driverFilter, setDriverFilter] = useState("");

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
    setError(null);

    getBuses()
      .then((data) => {
        if (!isMounted) return;
        setBuses(data);
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

  const reloadBuses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBuses();
      setBuses(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
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

  const branchOptions = [
    ...new Set(buses.map((bus) => bus.branchName).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b));

  const isFilterActive =
    searchQuery.trim() !== "" ||
    branchFilter !== "" ||
    statusFilter !== "" ||
    driverFilter !== "";

  const handleClear = () => {
    setSearchQuery("");
    setBranchFilter("");
    setStatusFilter("");
    setDriverFilter("");
  };

  const filteredBuses = buses.filter((bus) => {
    const search = searchQuery.trim().toLowerCase();
    const matchesSearch =
      search === "" ||
      bus.busName.toLowerCase().includes(search) ||
      (bus.registrationNumber
        ? bus.registrationNumber.toLowerCase().includes(search)
        : false);

    const matchesBranch =
      branchFilter === "" || bus.branchName === branchFilter;

    const matchesStatus =
      statusFilter === "" ||
      (statusFilter === "Active" ? bus.isActive : !bus.isActive);

    const matchesDriver =
      driverFilter === "" ||
      (driverFilter === "Driver assigned"
        ? Boolean(bus.driverId)
        : !bus.driverId);

    return matchesSearch && matchesBranch && matchesStatus && matchesDriver;
  });

  const openCreate = () => {
    setBusToEdit(null);
    setIsModalOpen(true);
  };

  const openEdit = (bus) => {
    setBusToEdit(bus);
    setIsModalOpen(true);
  };

  const showLoading = useDebouncedLoading(loading, 250);

  if (isPermissionDenied(error)) {
    return (
      <>
        <PageTitle
          title="Buses"
          description="Manage school buses and fleet assignments."
        />
        <AccessRestricted resource="buses" onRetry={reloadBuses} />
      </>
    );
  }


  return (
    <>
      <PageTitle
        title="Buses"
        description="Manage school buses and fleet assignments."
        button="+ Add Bus"
        onButtonClick={openCreate}
      />

      <div className="filter-card admin-filter">
        <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end" }}>
          {me.branch_id === null && (
            <div className="filter-group">
              <label>Branch:</label>
              <TypeAhead
                options={branchOptions.map((branch) => ({ value: branch, label: branch }))}
                value={branchFilter}
                onChange={setBranchFilter}
                placeholder="All branches"
                emptyMessage="No branches available"
                noMatchMessage="No branches found"
              />
            </div>
          )}

          <div className="filter-group">
            <label>Status:</label>
            <TypeAhead
              options={[
                { value: "Active", label: "Active" },
                { value: "Inactive", label: "Inactive" },
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="All"
              noMatchMessage="No statuses found"
            />
          </div>

          <div className="filter-group">
            <label>Driver:</label>
            <TypeAhead
              options={[
                { value: "Driver assigned", label: "Driver assigned" },
                { value: "No driver", label: "No driver" },
              ]}
              value={driverFilter}
              onChange={setDriverFilter}
              placeholder="All"
              noMatchMessage="No options found"
            />
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
          type="search"
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
          {error.message}
        </div>
      )}

      {loading ? (
        <div className="table-card">
          <div className="table-empty">
            <span>{showLoading ? "Loading…" : ""}</span>
          </div>
        </div>
      ) : buses.length === 0 && !isFilterActive ? (
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
            { label: "Bus Name", sortKey: "busName" },
            { label: "Registration", sortKey: "registrationNumber" },
            { label: "Capacity", sortKey: "capacity" },
            { label: "Driver", sortKey: "driverName" },
            { label: "Branch", sortKey: "branchName" },
            { label: "Status", sortKey: "isActive" },
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
            bus.driverId ? (
              bus.driverName
            ) : (
              <span key={`driver-${bus.id}`} className="muted-cell">
                No driver
              </span>
            ),
            bus.branchName ? (
              bus.branchName
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
          sortValues={filteredBuses.map((bus) => [
            bus.busName,
            bus.registrationNumber,
            bus.capacity,
            bus.driverName,
            bus.branchName,
            bus.isActive,
            null,
          ])}
          withoutFilter={false}
          itemLabel="buses"
          totalCount={buses.length}
        />
      )}

      {isModalOpen && (
        <BusModal
          isOpen={isModalOpen}
          bus={busToEdit}
          me={me}
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
