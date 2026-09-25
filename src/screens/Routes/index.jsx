import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import PageTitle from "../../components/PageTitle.jsx";
import DataTable from "../../components/DataTable.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import TypeAhead from "../../components/TypeAhead.jsx";
import RouteModal from "./RouteModal.jsx";
import RouteStopsModal from "./RouteStopsModal.jsx";
import AssignBusModal from "./AssignBusModal.jsx";
import AccessRestricted from "../../components/AccessRestricted.jsx";
import { isPermissionDenied } from "../../utils/errors.js";
import { useDebouncedLoading } from "../../hooks/useDebouncedLoading.js";
import { getRoutes, unassignBus } from "../../api/routes.js";

export default function Routes() {
  const { me } = useOutletContext();

  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [busFilter, setBusFilter] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [routeToEdit, setRouteToEdit] = useState(null);
  const [routeForStops, setRouteForStops] = useState(null);
  const [routeForAssignBus, setRouteForAssignBus] = useState(null);
  const [routeToUnassign, setRouteToUnassign] = useState(null);
  const [isUnassigning, setIsUnassigning] = useState(false);
  const [unassignError, setUnassignError] = useState("");

  const [openMenuRouteId, setOpenMenuRouteId] = useState(null);

  // Load routes on mount. This is the ONLY request this screen makes on page load.
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    getRoutes()
      .then((data) => {
        if (!isMounted) return;
        setRoutes(data || []);
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

  // Close the three-dot action menu when clicking anywhere outside
  useEffect(() => {
    if (!openMenuRouteId) return;

    const handleClickOutside = (e) => {
      if (!e.target.closest(".actions-menu-container")) {
        setOpenMenuRouteId(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openMenuRouteId]);

  const reloadRoutes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRoutes();
      setRoutes(data || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmUnassign = async () => {
    if (!routeToUnassign) return;
    setIsUnassigning(true);
    setUnassignError("");

    try {
      await unassignBus(routeToUnassign.id);
      setRouteToUnassign(null);
      await reloadRoutes();
    } catch (err) {
      setUnassignError(err.message || "Failed to unassign bus.");
    } finally {
      setIsUnassigning(false);
    }
  };

  const branchOptions = [
    ...new Set(routes.map((route) => route.branchName).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b));

  const isFilterActive =
    searchQuery.trim() !== "" ||
    branchFilter !== "" ||
    statusFilter !== "" ||
    busFilter !== "";

  const handleClear = () => {
    setSearchQuery("");
    setBranchFilter("");
    setStatusFilter("");
    setBusFilter("");
  };

  const filteredRoutes = routes.filter((route) => {
    const search = searchQuery.trim().toLowerCase();
    const matchesSearch =
      search === "" || route.routeName.toLowerCase().includes(search);

    const matchesBranch =
      branchFilter === "" || route.branchName === branchFilter;

    const matchesStatus =
      statusFilter === "" ||
      (statusFilter === "Active" ? route.isActive : !route.isActive);

    const matchesBus =
      busFilter === "" ||
      (busFilter === "Bus assigned" ? Boolean(route.busId) : !route.busId);

    return matchesSearch && matchesBranch && matchesStatus && matchesBus;
  });

  const openCreate = () => {
    setRouteToEdit(null);
    setIsModalOpen(true);
  };

  const openEdit = (route) => {
    setRouteToEdit(route);
    setIsModalOpen(true);
  };

  const showLoading = useDebouncedLoading(loading, 250);

  if (isPermissionDenied(error)) {
    return (
      <>
        <PageTitle
          title="Routes"
          description="Manage school bus routes and stop sequences."
        />
        <AccessRestricted resource="routes" onRetry={reloadRoutes} />
      </>
    );
  }


  return (
    <>
      <PageTitle
        title="Routes"
        description="Manage school bus routes and stop sequences."
        button="+ Add Route"
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
            <label>Bus:</label>
            <TypeAhead
              options={[
                { value: "Bus assigned", label: "Bus assigned" },
                { value: "No bus", label: "No bus" },
              ]}
              value={busFilter}
              onChange={setBusFilter}
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
          placeholder="Search by route name..."
        />
      </div>

      {error ? (
        <div className="table-state-card">
          <div className="state-icon-badge danger">
            <i className="bi bi-exclamation-triangle"></i>
          </div>
          <h3>Unable to load routes</h3>
          <p>{error.message}</p>
          <button
            type="button"
            className="state-action-btn secondary"
            onClick={reloadRoutes}
          >
            <i className="bi bi-arrow-clockwise"></i>
            <span>Retry</span>
          </button>
        </div>
      ) : loading ? (
        <div className="table-card">
          <div className="table-empty">
            <span>{showLoading ? "Loading…" : ""}</span>
          </div>
        </div>
      ) : routes.length === 0 && !isFilterActive ? (
        <div className="table-state-card">
          <div className="state-icon-badge neutral">
            <i className="bi bi-signpost-split"></i>
          </div>
          <h3>No routes found</h3>
          <p>
            Get started by creating the first transport route for your school.
          </p>
          <button
            type="button"
            className="state-action-btn primary"
            onClick={openCreate}
          >
            <i className="bi bi-plus-lg"></i>
            <span>Add Route</span>
          </button>
        </div>
      ) : (
        <DataTable
          headers={[
            { label: "Route Name", sortKey: "routeName" },
            { label: "Bus Number", sortKey: "registrationNumber" },
            { label: "Branch", sortKey: "branchName" },
            { label: "Status", sortKey: "isActive" },
            "Actions",
          ]}
          className="users-table-card"
          rows={filteredRoutes.map((route) => [
            <strong key={`name-${route.id}`}>{route.routeName}</strong>,
            route.registrationNumber ? (
              route.registrationNumber
            ) : (
              <span key={`bus-${route.id}`} className="muted-cell">
                No bus
              </span>
            ),
            route.branchName ? (
              route.branchName
            ) : (
              <span key={`branch-${route.id}`} className="muted-cell">
                Not assigned
              </span>
            ),
            <StatusBadge
              key={`status-${route.id}`}
              status={route.isActive ? "Active" : "Inactive"}
            />,
            <div key={`actions-${route.id}`} className="actions-menu-container">
              <button
                type="button"
                className="action-icon"
                title="Actions"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuRouteId((prev) =>
                    prev === route.id ? null : route.id,
                  );
                }}
              >
                <i className="bi bi-three-dots-vertical"></i>
              </button>

              {openMenuRouteId === route.id && (
                <div className="actions-dropdown-menu">
                  <button
                    type="button"
                    className="dropdown-item"
                    onClick={() => {
                      setOpenMenuRouteId(null);
                      setRouteForStops(route);
                    }}
                  >
                    <i className="bi bi-geo-alt"></i>
                    <span>Manage stops</span>
                  </button>

                  <button
                    type="button"
                    className="dropdown-item"
                    onClick={() => {
                      setOpenMenuRouteId(null);
                      openEdit(route);
                    }}
                  >
                    <i className="bi bi-pencil"></i>
                    <span>Edit</span>
                  </button>

                  {route.busId ? (
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={() => {
                        setOpenMenuRouteId(null);
                        setUnassignError("");
                        setRouteToUnassign(route);
                      }}
                    >
                      <i className="bi bi-bus-front"></i>
                      <span>Unassign bus</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={() => {
                        setOpenMenuRouteId(null);
                        setRouteForAssignBus(route);
                      }}
                    >
                      <i className="bi bi-bus-front"></i>
                      <span>Assign bus</span>
                    </button>
                  )}
                </div>
              )}
            </div>,
          ])}
          sortValues={filteredRoutes.map((route) => [
            route.routeName,
            route.registrationNumber,
            route.branchName,
            route.isActive,
            null,
          ])}
          withoutFilter={false}
          itemLabel="routes"
          totalCount={routes.length}
        />
      )}

      {isModalOpen && (
        <RouteModal
          isOpen={isModalOpen}
          route={routeToEdit}
          me={me}
          onClose={() => setIsModalOpen(false)}
          onSaved={reloadRoutes}
        />
      )}

      {Boolean(routeForStops) && (
        <RouteStopsModal
          isOpen={Boolean(routeForStops)}
          route={routeForStops}
          onClose={() => setRouteForStops(null)}
          onSaved={reloadRoutes}
        />
      )}

      {Boolean(routeForAssignBus) && (
        <AssignBusModal
          isOpen={Boolean(routeForAssignBus)}
          route={routeForAssignBus}
          onClose={() => setRouteForAssignBus(null)}
          onSaved={reloadRoutes}
        />
      )}

      {routeToUnassign && (
        <div
          className="add-user-overlay"
          onMouseDown={() => !isUnassigning && setRouteToUnassign(null)}
        >
          <div
            className="add-user-modal"
            style={{ width: "28rem" }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="add-user-header">
              <div>
                <h2>Unassign Bus</h2>
                <p>{routeToUnassign.routeName}</p>
              </div>
              <button
                type="button"
                className="add-user-close"
                onClick={() => setRouteToUnassign(null)}
                disabled={isUnassigning}
              >
                <i className="bi bi-x"></i>
              </button>
            </div>

            <div className="add-user-body" style={{ padding: "1.25rem" }}>
              <p
                style={{
                  margin: 0,
                  color: "#475467",
                  fontSize: "0.9rem",
                  lineHeight: 1.5,
                }}
              >
                Remove assigned bus from{" "}
                <strong>{routeToUnassign.routeName}</strong>? The bus will
                remain in the system.
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
                onClick={() => setRouteToUnassign(null)}
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
                {isUnassigning ? "Unassigning..." : "Unassign Bus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
