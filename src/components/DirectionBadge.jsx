export default function DirectionBadge({ direction }) {
  if (direction === "AM_PICKUP") {
    return (
      <span className="direction-badge am-pickup">
        <i className="bi bi-sun-fill" />
        <span>Morning pickup</span>
      </span>
    );
  }

  if (direction === "PM_DROP") {
    return (
      <span className="direction-badge pm-drop">
        <i className="bi bi-moon-stars-fill" />
        <span>Evening Drop</span>
      </span>
    );
  }

  return (
    <span className="direction-badge default">
      <span>{direction || "-"}</span>
    </span>
  );
}
