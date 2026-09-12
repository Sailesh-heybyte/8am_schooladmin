import { useState, useEffect } from "react";
import StatusBadge from "../../components/StatusBadge.jsx";
import DirectionBadge from "../../components/DirectionBadge.jsx";
import { getTrip } from "../../api/trips.js";
import "../SchoolAdmin/popups/ProfileModal.scss";

const formatDateTime = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? "-" : d.toLocaleString();
};

export default function TripDetailsModal({ isOpen = true, tripId, onClose }) {
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !tripId) return;

    let isMounted = true;

    getTrip(tripId)
      .then((data) => {
        if (!isMounted) return;
        setTrip(data);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || "Failed to load trip details.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, tripId]);

  if (!isOpen || !tripId) return null;

  const renderBody = () => {
    if (loading) {
      return (
        <div className="profile-modal-body">
          <p className="empty-permissions">Loading trip details...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="profile-modal-body">
          <div className="add-user-error" style={{ color: "#d9534f" }}>
            {error}
          </div>
        </div>
      );
    }

    if (!trip) return null;

    return (
      <div className="profile-modal-body">
        {/* Trip Group */}
        <div className="profile-section">
          <h3 className="profile-section-title">Trip</h3>
          <div className="profile-account-grid">
            <div className="profile-field">
              <span className="field-label">Date</span>
              <strong className="field-value">{trip.tripDate}</strong>
            </div>

            <div className="profile-field">
              <span className="field-label">Direction</span>
              <div style={{ marginTop: "0.15rem" }}>
                <DirectionBadge direction={trip.direction} />
              </div>
            </div>

            <div className="profile-field">
              <span className="field-label">Status</span>
              <div style={{ marginTop: "0.15rem" }}>
                <StatusBadge status={trip.status} />
              </div>
            </div>
          </div>
        </div>

        {/* Timing Group */}
        <div className="profile-section">
          <h3 className="profile-section-title">Timing</h3>
          <div className="profile-account-grid">
            <div className="profile-field">
              <span className="field-label">Started At</span>
              <span className="field-value">
                {formatDateTime(trip.startedAt)}
              </span>
            </div>

            <div className="profile-field">
              <span className="field-label">Ended At</span>
              <span className="field-value">
                {trip.endedAt === null
                  ? "In progress"
                  : formatDateTime(trip.endedAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Assignment Group */}
        <div className="profile-section">
          <h3 className="profile-section-title">Assignment</h3>
          <div className="profile-account-grid">
            <div className="profile-field">
              <span className="field-label">Bus ID</span>
              <span className="field-value">
                <code>{trip.busId}</code>
              </span>
            </div>

            <div className="profile-field">
              <span className="field-label">Route ID</span>
              <span className="field-value">
                <code>{trip.routeId}</code>
              </span>
            </div>

            <div className="profile-field">
              <span className="field-label">Branch ID</span>
              <span className="field-value">
                <code>{trip.branchId}</code>
              </span>
            </div>
          </div>
        </div>

        {/* Record Group */}
        <div className="profile-section">
          <h3 className="profile-section-title">Record</h3>
          <div className="profile-account-grid">
            <div className="profile-field">
              <span className="field-label">Driver Name</span>
              <span className="field-value">
                <code>{trip.startedByUserId}</code>
              </span>
            </div>

            <div className="profile-field profile-field-wide">
              <span className="field-label">Created At</span>
              <span className="field-value">
                {formatDateTime(trip.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="profile-modal-overlay" onMouseDown={onClose}>
      <div
        className="profile-modal"
        style={{ width: "36rem" }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="profile-modal-header">
          <div>
            <h2>Trip Details</h2>
            <p>View trip details and execution timing.</p>
          </div>
          <button
            type="button"
            className="profile-modal-close"
            onClick={onClose}
          >
            <i className="bi bi-x"></i>
          </button>
        </div>

        {renderBody()}

        <div className="profile-modal-footer">
          <button type="button" className="modal-cancel" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
