import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import MapPicker from "../../components/MapPicker.jsx";
import "./RoutePointPicker.scss";

export default function RoutePointPicker({
  step,
  initialLat,
  initialLng,
  initialCenter,
  stepLabel,
  onConfirm,
  onBack,
}) {
  const [lat, setLat] = useState(initialLat);
  const [lng, setLng] = useState(initialLng);
  const isStart = step === "start";
  const hasPoint = lat !== "" && lng !== "";

  const onBackRef = useRef(onBack);
  useEffect(() => {
    onBackRef.current = onBack;
  });
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onBackRef.current();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return createPortal(
    <div className="route-point-picker" role="dialog" aria-modal="true">
      <div className="route-point-picker-top">
        <button
          type="button"
          className="route-point-picker-back"
          onClick={onBack}
          aria-label="Back"
        >
          <i className="bi bi-arrow-left"></i>
        </button>
        <span className={`route-point-dot is-${step}`} aria-hidden="true"></span>
        <h2>{isStart ? "Set start point" : "Set end point"}</h2>
        {stepLabel && (
          <span className="route-point-picker-step">{stepLabel}</span>
        )}
      </div>

      <div className="route-point-picker-map">
        <MapPicker
          points={[
            {
              key: step,
              label: isStart ? "Start" : "End",
              latitude: lat,
              longitude: lng,
            },
          ]}
          onChange={(key, newLat, newLng) => {
            setLat(String(newLat));
            setLng(String(newLng));
          }}
          mode="center"
          pinTone={step}
          initialCenter={initialCenter}
        />
      </div>

      <div className="route-point-picker-sheet">
        <div className="route-point-picker-info">
          <strong>{hasPoint ? `${lat}, ${lng}` : "Pin not placed yet"}</strong>
          <span>
            Search a place, then drag the map to put the pin exactly on the
            spot.
          </span>
        </div>
        <button
          type="button"
          className="primary-button route-point-picker-confirm"
          onClick={() => onConfirm(lat, lng)}
          disabled={!hasPoint}
        >
          {isStart ? "Confirm start point" : "Confirm end point"}
        </button>
      </div>
    </div>,
    document.body,
  );
}
