export default function PageTitle({
  title,
  description,
  button,
  onButtonClick,
  disabled = false,
  secondaryButton,
  onSecondaryButtonClick,
}) {
  return (
    <div className="page-title">
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <div className="page-title-actions">
        {secondaryButton && (
          <button
            type="button"
            className="secondary-button"
            onClick={onSecondaryButtonClick}
          >
            {secondaryButton}
          </button>
        )}
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
    </div>
  );
}
