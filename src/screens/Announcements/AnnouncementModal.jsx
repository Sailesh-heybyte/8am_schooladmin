import { useState, useEffect } from "react";
import "../Roles/RoleModal.scss";
import { getRoutes } from "../../api/routes.js";
import { createAnnouncement } from "../../api/announcements.js";

export default function AnnouncementModal({ me, onClose, onSaved }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [routes, setRoutes] = useState([]);
  const [selectedRouteIds, setSelectedRouteIds] = useState([]);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(true);
  const [routesLoaded, setRoutesLoaded] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isPinned = Boolean(me.branch_id);

  useEffect(() => {
    let isMounted = true;

    getRoutes()
      .then((data) => {
        if (!isMounted) return;
        setRoutes(data);
        setRoutesLoaded(true);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message);
      })
      .finally(() => {
        if (isMounted) setIsLoadingRoutes(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const requestClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const toggleRoute = (id) => {
    setSelectedRouteIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const allSelected =
    routes.length > 0 && selectedRouteIds.length === routes.length;

  const toggleSelectAll = () => {
    setSelectedRouteIds(allSelected ? [] : routes.map((route) => route.id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!body.trim()) {
      setError("Message is required.");
      return;
    }
    if (selectedRouteIds.length === 0) {
      setError("Select at least one route.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createAnnouncement({
        title: title.trim(),
        body: body.trim(),
        routeIds: selectedRouteIds,
      });
      await onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-user-overlay">
      <div
        className="add-user-modal role-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="add-user-header">
          <div>
            <h2>Add Announcement</h2>
            <p>Parents on the selected routes will receive this message.</p>
          </div>
          <button
            type="button"
            className="add-user-close"
            onClick={requestClose}
            disabled={isSubmitting}
          >
            <i className="bi bi-x"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="add-user-body">
            <div className="form-section">
              <h3 className="form-section-title">Announcement</h3>
              <div className="form-row">
                <div className="form-field role-description-field">
                  <label htmlFor="announcement-title">Title</label>
                  <input
                    id="announcement-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Route delay"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field role-description-field">
                  <label htmlFor="announcement-body">Message</label>
                  <textarea
                    id="announcement-body"
                    rows={4}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Buses on this route will run 30 minutes late this morning."
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="permission-heading">
                <h3 className="form-section-title">Send to routes</h3>
                <div className="permission-actions">
                  <button
                    type="button"
                    className="select-all-btn"
                    onClick={toggleSelectAll}
                    disabled={isSubmitting || !routesLoaded || routes.length === 0}
                  >
                    {allSelected ? "Deselect All" : "Select All"}
                  </button>
                  <span>{`${selectedRouteIds.length} selected`}</span>
                </div>
              </div>

              {isLoadingRoutes ? (
                <p className="roles-message">Loading routes...</p>
              ) : routesLoaded && routes.length === 0 ? (
                <p className="roles-message">
                  No routes yet. Create a route first.
                </p>
              ) : routesLoaded ? (
                <div className="permission-list">
                  {routes.map((route) => (
                    <label className="permission-option" key={route.id}>
                      <input
                        type="checkbox"
                        checked={selectedRouteIds.includes(route.id)}
                        onChange={() => toggleRoute(route.id)}
                        disabled={isSubmitting}
                      />
                      <span>
                        {isPinned
                          ? route.routeName
                          : `${route.routeName} (${route.branchName})`}
                      </span>
                    </label>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {error && <div className="add-user-error">{error}</div>}

          <div className="add-user-footer">
            <button
              type="button"
              className="modal-cancel"
              onClick={requestClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="modal-save"
              disabled={isSubmitting || !routesLoaded}
            >
              {isSubmitting ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
