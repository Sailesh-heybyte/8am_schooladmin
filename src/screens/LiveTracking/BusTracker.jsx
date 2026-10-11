import { useEffect } from "react";
import LiveBusMap from "./LiveBusMap.jsx";
import { useBusLocation } from "../../hooks/useBusLocation.js";
import { useBusRoute } from "../../hooks/useBusRoute.js";

const STATUS_LABELS = {
  connecting: "Connecting…",
  waiting: "Trip started, waiting for GPS",
  live: "Live",
  no_trip: "No active trip",
  reconnecting: "Reconnecting…",
  error: "Unavailable",
};

const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

export default function BusTracker({ bus, onClose }) {
  const { status, location, error } = useBusLocation(bus.id);
  const busRoute = useBusRoute(bus.id);

  let routeText = "Loading route…";
  if (busRoute.status === "none") routeText = "No route assigned";
  if (busRoute.status === "error") routeText = "Couldn't load the route";
  if (busRoute.status === "ready") routeText = busRoute.route.routeName;

  useEffect(() => {
    const closeOnEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div className="bus-tracker">
      <div className="bus-tracker-bar">
        <button type="button" className="bus-tracker-back" onClick={onClose}>
          <i className="bi bi-arrow-left"></i>
        </button>
        <div className="bus-tracker-title">
          <h2>{bus.busName}</h2>
          <p>
            {bus.registrationNumber} · {routeText}
          </p>
        </div>
        <span className={`live-status is-${status}`}>{STATUS_LABELS[status]}</span>
      </div>

      <div className="bus-tracker-body">
        <LiveBusMap
          location={location}
          isLive={status === "live"}
          routePath={busRoute.path}
          routePoints={busRoute.points}
        />

        {!location && (
          <div className="live-map-message">
            <p>{status === "error" ? error : STATUS_LABELS[status]}</p>
          </div>
        )}

        {location && (
          <div className="live-info-card">
            <p className="live-info-speed">{Math.round(location.speed)} km/h</p>
            <p className="live-info-time">Updated {formatTime(location.timestampIso)}</p>
            {busRoute.status === "ready" && busRoute.path && !busRoute.isRoadPath && (
              <p className="live-info-note">Road map unavailable, showing straight lines</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}