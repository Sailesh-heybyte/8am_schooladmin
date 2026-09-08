export default function StatusBadge({ status }) {
  const normalized = String(status)
    .toLowerCase()
    .replaceAll(" ", "-")
    .replaceAll("/", "-");
  return (
    <span className={`status ${normalized}`}>
      <span className="status-dot" />
      <p>{status}</p>
    </span>
  );
}
