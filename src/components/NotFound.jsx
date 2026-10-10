import { useLocation, Link } from "react-router-dom";

export default function NotFound() {
  const location = useLocation();

  return (
    <div className="table-state-card standalone">
      <div className="state-icon-badge danger">
        <i className="bi bi-exclamation-triangle"></i>
      </div>
      <h3>Page Not Found</h3>
      <p>
        The requested path{" "}
        <code className="not-found-path">
          {location.pathname}
        </code>{" "}
        does not exist.
      </p>
      <Link
        to="/dashboard"
        className="state-action-btn primary"
      >
        <i className="bi bi-arrow-left"></i>
        <span>Back to Dashboard</span>
      </Link>
    </div>
  );
}
