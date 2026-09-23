import { useState, useEffect, useMemo } from "react";
import PageTitle from "../../components/PageTitle.jsx";
import DataTable from "../../components/DataTable.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import DirectionBadge from "../../components/DirectionBadge.jsx";
import TripDetailsModal from "./TripDetailsModal.jsx";
import AccessRestricted from "../../components/AccessRestricted.jsx";
import { isPermissionDenied } from "../../utils/errors.js";
import { useDebouncedLoading } from "../../hooks/useDebouncedLoading.js";
import { getTrips } from "../../api/trips.js";

const formatTime = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? "-" : d.toLocaleTimeString();
};

export default function Trips() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [direction, setDirection] = useState("");
  const [status, setStatus] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
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
        setError(err);
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
    setError(null);
    try {
      const data = await getTrips();
      setTrips(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTrips = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return trips.filter((trip) => {
      if (query) {
        const busMatch = (trip.busId || "").toLowerCase().includes(query);
        const routeMatch = (trip.routeId || "").toLowerCase().includes(query);
        const routeNameMatch = (trip.routeName || "").toLowerCase().includes(query);
        const regMatch = (trip.registrationNumber || "").toLowerCase().includes(query);
        const driverMatch = (trip.driverName || "").toLowerCase().includes(query);
        if (
          !busMatch &&
          !routeMatch &&
          !routeNameMatch &&
          !regMatch &&
          !driverMatch
        )
          return false;
      }

      if (direction && trip.direction !== direction) {
        return false;
      }

      if (status && trip.status !== status) {
        return false;
      }

      if (selectedDate && trip.tripDate !== selectedDate) {
        return false;
      }

      return true;
    });
  }, [trips, searchQuery, direction, status, selectedDate]);

  const hasActiveFilters = Boolean(
    searchQuery || direction || status || selectedDate
  );

  const handleClearFilters = () => {
    setSearchQuery("");
    setDirection("");
    setStatus("");
    setSelectedDate("");
  };

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

      <div className="filter-card">
        <div className="filter-group">
          <input
            id="trip-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by bus or route ID..."
          />
        </div>

        <div className="filter-group">
          <select
            id="trip-direction"
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
          >
            <option value="">All directions</option>
            <option value="AM_PICKUP">Morning pickup</option>
            <option value="PM_DROP">Evening drop</option>
          </select>
        </div>

        <div className="filter-group">
          <select
            id="trip-status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="ended">Ended</option>
          </select>
        </div>

        <div className="filter-group">
          <input
            id="trip-date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            className="secondary-button"
            onClick={handleClearFilters}
          >
            Clear filters
          </button>
        )}
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
        <p
          className="roles-message"
          style={{ margin: "1.5rem 0", color: "#667085" }}
        >
          Loading trips...
        </p>
      ) : trips.length === 0 ? (
        <div className="branch-empty-card">
          <i className="bi bi-clock-history"></i>
          <h3>No trips found</h3>
          <p>Trips started by drivers will appear here.</p>
        </div>
      ) : filteredTrips.length === 0 ? (
        <div className="branch-empty-card">
          <i className="bi bi-funnel"></i>
          <h3>No matching trips found</h3>
          <p>
            No trips match your filter criteria. Try adjusting or clearing your
            filters.
          </p>
          <button
            type="button"
            className="branch-empty-action"
            onClick={handleClearFilters}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <DataTable
          headers={[
            { label: "Date", sortKey: "tripDate" },
            "Direction",
            { label: "Bus Number", sortKey: "registrationNumber" },
            { label: "Route", sortKey: "routeName" },
            { label: "Started", sortKey: "startedAt" },
            { label: "Status", sortKey: "status" },
            "Actions",
          ]}
          className="users-table-card"
          rows={filteredTrips.map((trip) => [
            <strong key={`date-${trip.id}`}>{trip.tripDate}</strong>,
            <DirectionBadge
              key={`direction-${trip.id}`}
              direction={trip.direction}
            />,
            <span key={`bus-${trip.id}`}>{trip.registrationNumber}</span>,
            <span key={`route-${trip.id}`}>{trip.routeName}</span>,
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
          sortValues={filteredTrips.map((trip) => [
            trip.tripDate,
            null,
            trip.registrationNumber,
            trip.routeName,
            trip.startedAt,
            trip.status,
            null,
          ])}
          withoutFilter={false}
          itemLabel="trips"
          totalCount={trips.length}
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

