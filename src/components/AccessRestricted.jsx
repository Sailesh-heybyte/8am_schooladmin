export default function AccessRestricted({
  resource = "this section",
  title = "Access Restricted",
  message,
  onRetry,
}) {
  const displayMessage =
    message ||
    `You do not have permission to view ${resource} for this school. Please contact your system administrator.`;

  return (
    <div className="table-state-card standalone">
      <div className="state-icon-badge danger">
        <i className="bi bi-shield-lock"></i>
      </div>
      <h3>{title}</h3>
      <p>{displayMessage}</p>
      {onRetry && (
        <button
          type="button"
          className="state-action-btn secondary"
          onClick={onRetry}
        >
          <i className="bi bi-arrow-clockwise"></i>
          <span>Retry</span>
        </button>
      )}
    </div>
  );
}
