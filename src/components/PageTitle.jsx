export default function PageTitle({
  title,
  description,
  button,
  onButtonClick,
  disabled = false,
}) {
  return (
    <div className="page-title">
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {button && (
        <button
          className="primary-button"
          onClick={onButtonClick}
          disabled={disabled}
        >
          {button}
        </button>
      )}
    </div>
  );
}
