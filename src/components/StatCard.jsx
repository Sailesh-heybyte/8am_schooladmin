export default function StatCard({ icon, title, value, footer, type }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${type}`}>{icon}</div>
      <div className="stat-info">
        <span>{title}</span>
        <strong>{value}</strong>
        {footer && <small>{footer}</small>}
      </div>
    </div>
  );
}
