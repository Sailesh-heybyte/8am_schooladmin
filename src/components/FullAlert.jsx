import StatusBadge from "./StatusBadge.jsx";

export default function FullAlert({ alert }) {
  return (
    <div className="full-alert">
      <div className={`full-alert-icon ${alert[4].toLowerCase()}`}>!</div>
      <div className="full-alert-content">
        <strong>{alert[0]}</strong>
        <span>
          {alert[1]} • {alert[3]} • {alert[2]}
        </span>
      </div>
      <StatusBadge status={alert[4]} />
      <button className="table-action">View</button>
    </div>
  );
}
