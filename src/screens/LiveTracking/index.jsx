import { useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import PageTitle from "../../components/PageTitle.jsx";
import DataTable from "../../components/DataTable.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import TypeAhead from "../../components/TypeAhead.jsx";
import AccessRestricted from "../../components/AccessRestricted.jsx";
import BusTracker from "./BusTracker.jsx";
import { isPermissionDenied } from "../../utils/errors.js";
import { useDebouncedLoading } from "../../hooks/useDebouncedLoading.js";
import { getBuses } from "../../api/buses.js";
import "./LiveTracking.scss";

export default function LiveTracking() {
  const { me } = useOutletContext();

  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [driverFilter, setDriverFilter] = useState("");
  const [trackedBus, setTrackedBus] = useState(null);

  useEffect(() => {
    let isMounted = true;

    getBuses()
      .then((data) => {
        if (isMounted) setBuses(data);
      })
      .catch((err) => {
        if (isMounted) setError(err);
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

  const showLoading = useDebouncedLoading(loading, 250);

  const myBuses = useMemo(
    () =>
      buses.filter(
        (bus) => bus.isActive && (me.branch_id === null || bus.branchId === me.branch_id),
      ),
    [buses, me.branch_id],
  );

  const branchOptions = useMemo(
    () =>
      [...new Set(myBuses.map((bus) => bus.branchName).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [myBuses],
  );

  const isFilterActive =
    searchQuery.trim() !== "" || branchFilter !== "" || driverFilter !== "";

  const handleClear = () => {
    setSearchQuery("");
    setBranchFilter("");
    setDriverFilter("");
  };

  const filteredBuses = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();

    return myBuses.filter((bus) => {
      const matchesSearch =
        search === "" ||
        bus.busName.toLowerCase().includes(search) ||
        (bus.registrationNumber
          ? bus.registrationNumber.toLowerCase().includes(search)
          : false) ||
        (bus.driverName ? bus.driverName.toLowerCase().includes(search) : false);

      const matchesBranch =
        branchFilter === "" || bus.branchName === branchFilter;

      const matchesDriver =
        driverFilter === "" ||
        (driverFilter === "Driver assigned"
          ? Boolean(bus.driverId)
          : !bus.driverId);

      return matchesSearch && matchesBranch && matchesDriver;
    });
  }, [myBuses, searchQuery, branchFilter, driverFilter]);

  if (isPermissionDenied(error)) {
    return (
      <>
        <PageTitle
          title="Live Tracking"
          description="Select an active bus to track its location and live trip in real time."
        />
        <AccessRestricted resource="buses" onRetry={reloadBuses} />
      </>
    );
  }

  const isMultiBranch = me.branch_id === null;

  const headers = [
    { label: "Bus Name", sortKey: "busName" },
    { label: "Registration", sortKey: "registrationNumber" },
    { label: "Driver", sortKey: "driverName" },
    ...(isMultiBranch ? [{ label: "Branch", sortKey: "branchName" }] : []),
    { label: "Status", sortKey: "isActive" },
    "Actions",
  ];

  const rows = filteredBuses.map((bus) => {
    const row = [
      <strong key={`name-${bus.id}`}>{bus.busName}</strong>,
      bus.registrationNumber ? (
        <span key={`reg-${bus.id}`}>{bus.registrationNumber}</span>
      ) : (
        <span key={`reg-${bus.id}`} className="muted-cell">
          -
        </span>
      ),
      bus.driverName ? (
        <span key={`driver-${bus.id}`}>{bus.driverName}</span>
      ) : (
        <span key={`driver-${bus.id}`} className="muted-cell">
          No driver
        </span>
      ),
    ];

    if (isMultiBranch) {
      row.push(
        bus.branchName ? (
          <span key={`branch-${bus.id}`}>{bus.branchName}</span>
        ) : (
          <span key={`branch-${bus.id}`} className="muted-cell">
            Not assigned
          </span>
        ),
      );
    }

    row.push(
      <StatusBadge
        key={`status-${bus.id}`}
        status={bus.isActive ? "Active" : "Inactive"}
      />,
    );

    row.push(
      <div key={`actions-${bus.id}`} className="action-buttons">
        <button
          type="button"
          className="track-live-btn"
          title={`Track ${bus.busName}`}
          onClick={(e) => {
            e.stopPropagation();
            setTrackedBus(bus);
          }}
        >
          <i className="bi bi-broadcast"></i>
          <span>Track Live</span>
        </button>
      </div>,
    );

    return row;
  });

  const sortValues = filteredBuses.map((bus) => {
    const values = [
      bus.busName,
      bus.registrationNumber || "",
      bus.driverName || "",
    ];
    if (isMultiBranch) {
      values.push(bus.branchName || "");
    }
    values.push(bus.isActive);
    values.push(null);
    return values;
  });

  return (
    <>
      <PageTitle
        title="Live Tracking"
        description="Select an active bus to track its location and live trip in real time."
      />

      <div className="filter-card admin-filter">
        <div className="filter-row">
          {isMultiBranch && (
            <div className="filter-group">
              <label>Branch:</label>
              <TypeAhead
                options={branchOptions.map((branch) => ({
                  value: branch,
                  label: branch,
                }))}
                value={branchFilter}
                onChange={setBranchFilter}
                placeholder="All branches"
                emptyMessage="No branches available"
                noMatchMessage="No branches found"
              />
            </div>
          )}

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
          placeholder="Search by bus name, registration or driver..."
        />
      </div>

      {error && (
        <div className="table-state-card">
          <div className="state-icon-badge danger">
            <i className="bi bi-exclamation-triangle"></i>
          </div>
          <h3>Couldn't load buses</h3>
          <p>{error.message}</p>
          <button
            type="button"
            className="state-action-btn secondary"
            onClick={reloadBuses}
          >
            <i className="bi bi-arrow-clockwise"></i>
            <span>Retry</span>
          </button>
        </div>
      )}

      {error && buses.length === 0 ? null : loading && buses.length === 0 ? (
        <div className="table-card">
          <div className="table-empty">
            <span>{showLoading ? "Loading…" : ""}</span>
          </div>
        </div>
      ) : myBuses.length === 0 && !isFilterActive ? (
        <div className="branch-empty-card">
          <i className="bi bi-bus-front"></i>
          <h3>No active buses found</h3>
          <p>There are no active buses available for live tracking.</p>
        </div>
      ) : filteredBuses.length === 0 ? (
        <div className="branch-empty-card">
          <i className="bi bi-funnel"></i>
          <h3>No matching buses found</h3>
          <p>
            No buses match your filter criteria. Try adjusting or clearing your
            filters.
          </p>
          <button
            type="button"
            className="branch-empty-action"
            onClick={handleClear}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <DataTable
          headers={headers}
          rows={rows}
          sortValues={sortValues}
          className="users-table-card"
          itemLabel="buses"
          totalCount={myBuses.length}
          withoutFilter={false}
          onRowClick={(index) => setTrackedBus(filteredBuses[index])}
        />
      )}

      {trackedBus && (
        <BusTracker bus={trackedBus} onClose={() => setTrackedBus(null)} />
      )}
    </>
  );
}