import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import PageTitle from "../../components/PageTitle.jsx";
import DataTable from "../../components/DataTable.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import StopModal from "./StopModal.jsx";
import AccessRestricted, {
  isPermissionDenied,
  useDebouncedLoading,
} from "../../components/AccessRestricted.jsx";
import { getStops } from "../../api/stops.js";
import "../SchoolAdmin/popups/ProfileModal.scss";

function StopDetailsModal({ isOpen, stop, onClose }) {
  if (!isOpen || !stop) return null;

  return (
    <div className="profile-modal-overlay" onMouseDown={onClose}>
      <div
        className="profile-modal"
        style={{ width: "36rem" }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="profile-modal-header">
          <div>
            <h2>Stop Details</h2>
            <p>View stop coordinates, route and branch information.</p>
          </div>
          <button
            type="button"
            className="profile-modal-close"
            onClick={onClose}
          >
            <i className="bi bi-x"></i>
          </button>
        </div>

        <div className="profile-modal-body">
          <div className="profile-section">
            <h3 className="profile-section-title">Stop Information</h3>
            <div className="profile-account-grid">
              <div className="profile-field">
                <span className="field-label">Stop Name</span>
                <strong className="field-value">{stop.stopName || "-"}</strong>
              </div>

              <div className="profile-field">
                <span className="field-label">Latitude</span>
                <span className="field-value">
                  {stop.latitude !== null && stop.latitude !== undefined ? (
                    stop.latitude
                  ) : (
                    <span className="muted-cell">-</span>
                  )}
                </span>
              </div>

              <div className="profile-field">
                <span className="field-label">Longitude</span>
                <span className="field-value">
                  {stop.longitude !== null && stop.longitude !== undefined ? (
                    stop.longitude
                  ) : (
                    <span className="muted-cell">-</span>
                  )}
                </span>
              </div>

              <div className="profile-field">
                <span className="field-label">Route</span>
                <span className="field-value">
                  {stop.routeId ? (
                    <code>{stop.routeId}</code>
                  ) : (
                    <span className="muted-cell">Not on a route</span>
                  )}
                </span>
              </div>

              <div className="profile-field">
                <span className="field-label">Sequence</span>
                <span className="field-value">
                  {stop.sequence !== null && stop.sequence !== undefined ? (
                    stop.sequence
                  ) : (
                    <span className="muted-cell">-</span>
                  )}
                </span>
              </div>

              <div className="profile-field">
                <span className="field-label">Branch</span>
                <span className="field-value">
                  {stop.branchId ? (
                    <code>{stop.branchId}</code>
                  ) : (
                    <span className="muted-cell">Not assigned</span>
                  )}
                </span>
              </div>

              <div className="profile-field">
                <span className="field-label">Status</span>
                <div style={{ marginTop: "0.15rem" }}>
                  <StatusBadge status={stop.isActive ? "Active" : "Inactive"} />
                </div>
              </div>

              <div className="profile-field">
                <span className="field-label">Stop ID</span>
                <span className="field-value">
                  <code>{stop.id}</code>
                </span>
              </div>

              <div className="profile-field">
                <span className="field-label">Created</span>
                <span className="field-value">{stop.createdAt || "-"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-modal-footer">
          <button type="button" className="modal-cancel" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Stops() {
  const { me } = useOutletContext() || {};

  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stopToEdit, setStopToEdit] = useState(null);
  const [stopForDetails, setStopForDetails] = useState(null);
  const [openMenuStopId, setOpenMenuStopId] = useState(null);

  // Load stops on mount. This is the ONLY request this screen makes on page load.
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError("");

    getStops()
      .then((data) => {
        if (!isMounted) return;
        setStops(data);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || "Failed to load stops.");
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
    if (!openMenuStopId) return;

    const handleClickOutside = (e) => {
      if (!e.target.closest(".actions-menu-container")) {
        setOpenMenuStopId(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openMenuStopId]);

  const reloadStops = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getStops();
      setStops(data);
    } catch (err) {
      setError(err.message || "Failed to reload stops.");
    } finally {
      setLoading(false);
    }
  };

  const filteredStops = stops.filter((stop) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (stop.stopName || "").toLowerCase().includes(query);
  });

  const openCreate = () => {
    setStopToEdit(null);
    setIsModalOpen(true);
  };

  const openEdit = (stop) => {
    setStopToEdit(stop);
    setIsModalOpen(true);
  };

  const showLoading = useDebouncedLoading(loading, 250);

  if (isPermissionDenied(error)) {
    return (
      <>
        <PageTitle
          title="Stops"
          description="Manage bus stops and locations."
        />
        <AccessRestricted resource="routing stops" onRetry={reloadStops} />
      </>
    );
  }

  if (loading && !showLoading) {
    return (
      <>
        <PageTitle
          title="Stops"
          description="Manage bus stops and locations."
        />
      </>
    );
  }

  return (
    <>
      <PageTitle
        title="Stops"
        description="Manage bus stops and locations."
        button="+ Add Stop"
        onButtonClick={openCreate}
      />

      <div className="filter-card search-only">
        <div className="table-search-box">
          <i className="bi bi-search"></i>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by stop name..."
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
          <h3>Unable to load stops</h3>
          <p>{error}</p>
          <button
            type="button"
            className="state-action-btn secondary"
            onClick={reloadStops}
          >
            <i className="bi bi-arrow-clockwise"></i>
            <span>Retry</span>
          </button>
        </div>
      ) : loading ? (
        <div className="table-state-card">
          <div className="state-spinner"></div>
          <p>Loading stops...</p>
        </div>
      ) : stops.length === 0 && !searchQuery ? (
        <div className="table-state-card">
          <div className="state-icon-badge neutral">
            <i className="bi bi-geo-alt"></i>
          </div>
          <h3>No stops found</h3>
          <p>Get started by adding the first bus stop to your school.</p>
          <button
            type="button"
            className="state-action-btn primary"
            onClick={openCreate}
          >
            <i className="bi bi-plus-lg"></i>
            <span>Add Stop</span>
          </button>
        </div>
      ) : (
        <DataTable
          headers={[
            "Stop Name",
            "Latitude",
            "Longitude",
            "Route",
            "Branch",
            "Status",
            "Actions",
          ]}
          className="users-table-card"
          rows={filteredStops.map((stop) => [
            <strong key={`name-${stop.id}`}>{stop.stopName}</strong>,
            stop.latitude !== null && stop.latitude !== undefined ? (
              stop.latitude
            ) : (
              <span key={`lat-${stop.id}`} className="muted-cell">
                -
              </span>
            ),
            stop.longitude !== null && stop.longitude !== undefined ? (
              stop.longitude
            ) : (
              <span key={`lng-${stop.id}`} className="muted-cell">
                -
              </span>
            ),
            stop.routeId ? (
              <code key={`route-${stop.id}`}>{stop.routeId}</code>
            ) : (
              <span key={`route-${stop.id}`} className="muted-cell">
                Not on a route
              </span>
            ),
            stop.branchId ? (
              <code key={`branch-${stop.id}`}>{stop.branchId}</code>
            ) : (
              <span key={`branch-${stop.id}`} className="muted-cell">
                Not assigned
              </span>
            ),
            <StatusBadge
              key={`status-${stop.id}`}
              status={stop.isActive ? "Active" : "Inactive"}
            />,
            <div key={`actions-${stop.id}`} className="actions-menu-container">
              <button
                type="button"
                className="action-icon"
                title="Actions"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuStopId((prev) =>
                    prev === stop.id ? null : stop.id,
                  );
                }}
              >
                <i className="bi bi-three-dots-vertical"></i>
              </button>

              {openMenuStopId === stop.id && (
                <div className="actions-dropdown-menu">
                  <button
                    type="button"
                    className="dropdown-item"
                    onClick={() => {
                      setOpenMenuStopId(null);
                      setStopForDetails(stop);
                    }}
                  >
                    <i className="bi bi-eye"></i>
                    <span>View details</span>
                  </button>
                  <button
                    type="button"
                    className="dropdown-item"
                    onClick={() => {
                      setOpenMenuStopId(null);
                      openEdit(stop);
                    }}
                  >
                    <i className="bi bi-pencil"></i>
                    <span>Edit</span>
                  </button>
                </div>
              )}
            </div>,
          ])}
          withoutFilter={false}
          footer={`Showing ${filteredStops.length} of ${stops.length} stops`}
        />
      )}

      {isModalOpen && (
        <StopModal
          isOpen={isModalOpen}
          stop={stopToEdit}
          schoolId={me?.school_id}
          onClose={() => setIsModalOpen(false)}
          onSaved={reloadStops}
        />
      )}

      {Boolean(stopForDetails) && (
        <StopDetailsModal
          isOpen={Boolean(stopForDetails)}
          stop={stopForDetails}
          onClose={() => setStopForDetails(null)}
        />
      )}
    </>
  );
}
