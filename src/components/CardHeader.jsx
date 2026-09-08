export default function CardHeader({ title, action }) {
  return (
    <div className="card-header">
      <h3>{title}</h3>
      {action && <button className="card-action">{action}</button>}
    </div>
  );
}
