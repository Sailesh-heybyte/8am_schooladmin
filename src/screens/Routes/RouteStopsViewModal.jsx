import { useState, useEffect } from "react";
import { getRoute } from "../../api/routes.js";
import "../Roles/RoleModal.scss";
import "./RouteStopsViewModal.scss";

const formatCoords = (lat, lng) =>
  lat !== null && lng !== null ? `${lat}, ${lng}` : null;

export default function RouteStopsViewModal({ route, onClose, onManage }) {
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isMounted = true;

    getRoute(route.id)
      .then((detail) => {
        if (isMounted) setStops(detail.stops);
      })
      .catch((err) => {
        if (isMounted) setLoadError(err.message || "Failed to load stops.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [route.id]);

  const start = formatCoords(route.startLat, route.startLng);
  const end = formatCoords(route.endLat, route.endLng);
  const stopCount = `${stops.length} ${stops.length === 1 ? "stop" : "stops"}`;

  return (
    <div className="add-user-overlay" onMouseDown={onClose}>
      <div
        className="add-user-modal route-view-modal"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="add-user-header">
          <div>
            <h2>{route.routeName}</h2>
            <p>
              {route.branchName || "No branch"}
              {!loading && !loadError && ` · ${stopCount}`}
            </p>
          </div>
          <button
            type="button"
            className="add-user-close"
            onClick={onClose}
            aria-label="Close"
          >
            <i className="bi bi-x"></i>
          </button>
        </div>

        <div className="add-user-body">
          {loading ? (
            <p className="route-view-message">Loading stops…</p>
          ) : loadError ? (
            <p className="route-view-message is-error">{loadError}</p>
          ) : (
            <ol className="route-timeline">
              <li className="route-timeline-item is-start">
                <span className="route-timeline-marker">S</span>
                <div className="route-timeline-content">
                  <span className="route-timeline-title">Start point</span>
                  <span className="route-timeline-meta">
                    {start || "Not set"}
                  </span>
                </div>
              </li>

              {stops.length === 0 ? (
                <li className="route-timeline-item is-empty">
                  <span className="route-timeline-marker"></span>
                  <div className="route-timeline-content">
                    <span className="route-timeline-meta">
                      No stops on this route yet.
                    </span>
                  </div>
                </li>
              ) : (
                stops.map((stop, index) => (
                  <li key={stop.id} className="route-timeline-item">
                    <span className="route-timeline-marker">{index + 1}</span>
                    <div className="route-timeline-content">
                      <span className="route-timeline-title">
                        {stop.stopName}
                        {!stop.isActive && (
                          <span className="route-timeline-badge">Inactive</span>
                        )}
                      </span>
                      <span className="route-timeline-meta">
                        {formatCoords(stop.latitude, stop.longitude) ||
                          "No coordinates"}
                      </span>
                    </div>
                  </li>
                ))
              )}

              <li className="route-timeline-item is-end">
                <span className="route-timeline-marker">E</span>
                <div className="route-timeline-content">
                  <span className="route-timeline-title">End point</span>
                  <span className="route-timeline-meta">{end || "Not set"}</span>
                </div>
              </li>
            </ol>
          )}
        </div>

        <div className="add-user-footer">
          <button type="button" className="modal-cancel" onClick={onClose}>
            Close
          </button>
          <button type="button" className="modal-save" onClick={onManage}>
            Manage stops
          </button>
        </div>
      </div>
    </div>
  );
}
