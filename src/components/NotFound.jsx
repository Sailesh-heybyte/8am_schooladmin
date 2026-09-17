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
        <code
          style={{
            background: "#fef3f2",
            color: "#d92d20",
            border: "1px solid #fecdca",
            padding: "0.15rem 0.35rem",
            borderRadius: "4px",
            fontWeight: "600",
            wordBreak: "break-all",
          }}
        >
          {location.pathname}
        </code>{" "}
        does not exist.
      </p>
      <Link
        to="/dashboard"
        className="state-action-btn primary"
        style={{ textDecoration: "none" }}
      >
        <i className="bi bi-arrow-left"></i>
        <span>Back to Dashboard</span>
      </Link>
    </div>
  );
}
