export default function RoleCard({ title, count, text, type }) {
  return (
    <div className={`role-card ${type}`}>
      <div className="role-icon">
        <i className="bi bi-person-gear"></i>
      </div>
      <div>
        <strong>{title}</strong>
        <span>{text}</span>
      </div>
      <b>{count}</b>
    </div>
  );
}
