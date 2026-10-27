import { useEffect } from "react";
import LiveBusMap from "./LiveBusMap.jsx";
import { useBusLocation } from "../../hooks/useBusLocation.js";

const STATUS_LABELS = {
  connecting: "Connecting…",
  waiting: "Trip started, waiting for GPS",
  live: "Live",
  no_trip: "No active trip",
  reconnecting: "Reconnecting…",
  error: "Unavailable",
};

export default function BusTracker({ bus, onClose }) {
  const { status, location, error } = useBusLocation(bus.id);

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
          <p>{bus.registrationNumber}</p>
        </div>
        <span className={`live-status is-${status}`}>{STATUS_LABELS[status]}</span>
      </div>

      <div className="bus-tracker-body">
        <LiveBusMap location={location} isLive={status === "live"} />

        {!location && (
          <div className="live-map-message">
            <p>{status === "error" ? error : STATUS_LABELS[status]}</p>
          </div>
        )}

        {location && (
          <div className="live-info-card">
            <p className="live-info-speed">{Math.round(location.speed)} km/h</p>
          </div>
        )}
      </div>
    </div>
  );
}