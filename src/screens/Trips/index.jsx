import { useState, useEffect } from "react";
import PageTitle from "../../components/PageTitle.jsx";
import DataTable from "../../components/DataTable.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import DirectionBadge from "../../components/DirectionBadge.jsx";
import TripDetailsModal from "./TripDetailsModal.jsx";
import AccessRestricted, {
  isPermissionDenied,
  useDebouncedLoading,
} from "../../components/AccessRestricted.jsx";
import { getTrips } from "../../api/trips.js";

const formatTime = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? "-" : d.toLocaleTimeString();
};

export default function Trips() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTripId, setSelectedTripId] = useState(null);

  // Load trips on mount. This is the ONLY request this screen makes on page load.
  useEffect(() => {
    let isMounted = true;

    getTrips()
      .then((data) => {
        if (!isMounted) return;
        setTrips(data);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || "Failed to load trips.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const reloadTrips = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getTrips();
      setTrips(data);
    } catch (err) {
      setError(err.message || "Failed to reload trips.");
    } finally {
      setLoading(false);
    }
  };

  const filteredTrips = trips.filter((trip) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const busMatch = trip.busId.toLowerCase().includes(query);
    const routeMatch = trip.routeId.toLowerCase().includes(query);
    return busMatch || routeMatch;
  });

  const showLoading = useDebouncedLoading(loading, 250);

  if (isPermissionDenied(error)) {
    return (
      <>
        <PageTitle
          title="Trips"
          description="View driver trips and transport runs."
        />
        <AccessRestricted resource="trips" onRetry={reloadTrips} />
      </>
    );
  }

  if (loading && !showLoading) {
    return (
      <>
        <PageTitle
          title="Trips"
          description="View driver trips and transport runs."
        />
      </>
    );
  }

  return (
    <>
      <PageTitle
        title="Trips"
        description="View driver trips and transport runs."
      />

      <div className="filter-card search-only">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by bus or route ID..."
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
          Loading trips...
        </p>
      ) : trips.length === 0 && !searchQuery ? (
        <div className="branch-empty-card">
          <i className="bi bi-clock-history"></i>
          <h3>No trips found</h3>
          <p>Trips started by drivers will appear here.</p>
        </div>
      ) : (
        <DataTable
          headers={[
            "Date",
            "Direction",
            "Bus",
            "Route",
            "Started",
            "Status",
            "Actions",
          ]}
          className="users-table-card"
          rows={filteredTrips.map((trip) => [
            <strong key={`date-${trip.id}`}>{trip.tripDate}</strong>,
            <DirectionBadge
              key={`direction-${trip.id}`}
              direction={trip.direction}
            />,
            <code key={`bus-${trip.id}`}>{trip.busId}</code>,
            <code key={`route-${trip.id}`}>{trip.routeId}</code>,
            <span key={`started-${trip.id}`}>
              {formatTime(trip.startedAt)}
            </span>,
            <StatusBadge key={`status-${trip.id}`} status={trip.status} />,
            <div key={`actions-${trip.id}`} className="action-buttons">
              <button
                type="button"
                className="action-icon"
                title="View details"
                onClick={() => setSelectedTripId(trip.id)}
              >
                <i className="bi bi-eye"></i>
              </button>
            </div>,
          ])}
          withoutFilter={false}
          footer={`Showing ${filteredTrips.length} of ${trips.length} trips`}
        />
      )}

      {Boolean(selectedTripId) && (
        <TripDetailsModal
          isOpen={Boolean(selectedTripId)}
          tripId={selectedTripId}
          onClose={() => setSelectedTripId(null)}
        />
      )}
    </>
  );
}
