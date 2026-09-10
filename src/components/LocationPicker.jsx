import { useState, useEffect, useRef } from "react";
import { Loader, setOptions, importLibrary } from "@googlemaps/js-api-loader";

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const LAT = 17.004750823000403;
const LNG = 81.79271807527687;
const DEFAULT_ZOOM = 12;
const DETAIL_ZOOM = 19;

// 1. Create the Loader at MODULE level, outside the component, so the Maps script
// loads once per page rather than once per modal open.
let loaderInstance = null;
if (API_KEY) {
  try {
    loaderInstance = new Loader({
      apiKey: API_KEY,
      version: "weekly",
    });
  } catch {
    // Fallback for @googlemaps/js-api-loader v2+ functional API
    if (typeof window !== "undefined") {
      setOptions({ key: API_KEY, v: "weekly" });
    }
  }
}

let googleMapsPromise = null;
function loadGoogleMaps() {
  if (!API_KEY) {
    return Promise.reject(new Error("Google Maps API key is missing."));
  }
  if (window.google?.maps?.Map) {
    return Promise.resolve(window.google);
  }
  if (!googleMapsPromise) {
    const promise =
      loaderInstance && typeof loaderInstance.load === "function"
        ? loaderInstance.load().then(() => window.google)
        : importLibrary("maps").then(() => window.google);

    googleMapsPromise = promise.catch((err) => {
      googleMapsPromise = null;
      throw err;
    });
  }
  return googleMapsPromise;
}

function isValidCoordinate(lat, lng) {
  if (lat === "" || lat === null || lat === undefined) return false;
  if (lng === "" || lng === null || lng === undefined) return false;
  const nLat = Number(lat);
  const nLng = Number(lng);
  return (
    !isNaN(nLat) &&
    !isNaN(nLng) &&
    nLat >= -90 &&
    nLat <= 90 &&
    nLng >= -180 &&
    nLng <= 180
  );
}

export default function LocationPicker({
  latitude,
  longitude,
  onChange,
  disabled = false,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const idleListenerRef = useRef(null);
  const lastEmittedRef = useRef(null);
  const initialEmittedRef = useRef(false);

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Initialize Map
  useEffect(() => {
    let isMounted = true;

    loadGoogleMaps()
      .then((google) => {
        if (!isMounted || !mapContainerRef.current) return;

        const hasInitialCoords = isValidCoordinate(latitude, longitude);
        const startLat = hasInitialCoords ? Number(latitude) : LAT;
        const startLng = hasInitialCoords ? Number(longitude) : LNG;
        const startZoom = hasInitialCoords ? DETAIL_ZOOM : DEFAULT_ZOOM;

        const map = new google.maps.Map(mapContainerRef.current, {
          center: { lat: startLat, lng: startLng },
          zoom: startZoom,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: disabled ? "none" : "auto",
        });

        mapInstanceRef.current = map;

        // If coordinates were empty, call onChange ONCE with default coordinates
        // so inputs are never empty while the pin is visibly sitting somewhere.
        if (!hasInitialCoords && !initialEmittedRef.current) {
          initialEmittedRef.current = true;
          lastEmittedRef.current = { lat: LAT, lng: LNG };
          onChangeRef.current?.(LAT, LNG);
        } else if (hasInitialCoords) {
          lastEmittedRef.current = {
            lat: Number(Number(latitude).toFixed(6)),
            lng: Number(Number(longitude).toFixed(6)),
          };
        }

        // 4. On the map's "idle" event, read map.getCenter() and call onChange(lat, lng)
        // rounded to 6 decimal places. Only listen to "idle" (never "center_changed" or "drag").
        const idleListener = map.addListener("idle", () => {
          const center = map.getCenter();
          if (!center) return;

          const lat = Number(center.lat().toFixed(6));
          const lng = Number(center.lng().toFixed(6));

          // Check if coordinate matches what we already emitted to avoid redundant triggers
          const last = lastEmittedRef.current;
          if (
            last &&
            Math.abs(last.lat - lat) < 0.000001 &&
            Math.abs(last.lng - lng) < 0.000001
          ) {
            return;
          }

          lastEmittedRef.current = { lat, lng };
          onChangeRef.current?.(lat, lng);
        });

        idleListenerRef.current = idleListener;
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || "Failed to load Google Maps.");
        setLoading(false);
      });

    // 8. Clean up on unmount: remove the idle listener with google.maps.event.clearInstanceListeners
    return () => {
      isMounted = false;
      if (mapInstanceRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(mapInstanceRef.current);
      }
      mapInstanceRef.current = null;
      idleListenerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update gesture handling when disabled changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setOptions({
        gestureHandling: disabled ? "none" : "auto",
      });
    }
  }, [disabled]);

  // 5. GUARD AGAINST A FEEDBACK LOOP.
  // Compare incoming props against lastEmittedRef. If they match, skip recentering.
  // Only recentre when the change came from outside (user typed in input or external change).
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!isValidCoordinate(latitude, longitude)) return;

    const numLat = Number(Number(latitude).toFixed(6));
    const numLng = Number(Number(longitude).toFixed(6));
    const last = lastEmittedRef.current;

    // If incoming prop matches what the map just emitted, skip recentering!
    if (
      last &&
      Math.abs(last.lat - numLat) < 0.000001 &&
      Math.abs(last.lng - numLng) < 0.000001
    ) {
      return;
    }

    // Change came from outside (e.g. typing in input)
    lastEmittedRef.current = { lat: numLat, lng: numLng };
    map.setCenter({ lat: numLat, lng: numLng });
  }, [latitude, longitude]);

  return (
    <div style={{ width: "100%", margin: "0.25rem 0 0.5rem" }}>
      {/* Map Wrapper with relative positioning */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "16rem",
          border: "0.05rem solid #e7eaf0",
          borderRadius: "0.45rem",
          overflow: "hidden",
          background: "#f8fafc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {loading && (
          <div
            style={{
              position: "absolute",
              zIndex: 2,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              color: "#667085",
              fontSize: "0.75rem",
              fontWeight: 500,
            }}
          >
            <i className="bi bi-hourglass-split"></i>
            <span>Loading map...</span>
          </div>
        )}

        {error && (
          <div
            style={{
              padding: "1rem",
              textAlign: "center",
              color: "#667085",
              fontSize: "0.72rem",
            }}
          >
            <i
              className="bi bi-geo-alt"
              style={{
                display: "block",
                fontSize: "1.5rem",
                color: "#98a2b3",
                marginBottom: "0.35rem",
              }}
            ></i>
            <span>{error} Manual coordinate inputs below remain usable.</span>
          </div>
        )}

        {/* Map Container */}
        <div
          ref={mapContainerRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: error ? "none" : "block",
          }}
        />

        {/* 2. Centre Pin Overlay */}
        {!error && !loading && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -100%)",
              pointerEvents: "none",
              color: "#155eef",
              fontSize: "2.2rem",
              lineHeight: 1,
              zIndex: 10,
              filter: "drop-shadow(0 0.15rem 0.25rem rgba(16, 24, 40, 0.25))",
            }}
            aria-hidden="true"
          >
            <i className="bi bi-geo-alt-fill"></i>
          </div>
        )}
      </div>

      {/* 6. Under the map caption */}
      {!error && (
        <p
          style={{
            margin: "0.35rem 0 0",
            color: "#667085",
            fontSize: "0.68rem",
            lineHeight: 1.4,
          }}
        >
          Drag the map to move the pin.
        </p>
      )}
    </div>
  );
}
