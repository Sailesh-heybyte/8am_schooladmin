import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { searchPlaces } from "../api/geocoding.js";
import "./MapPicker.scss";

const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const DEFAULT_CENTER = [17.004750823000403, 81.79271807527687];
const DEFAULT_ZOOM = 12;
const POINT_ZOOM = 15;
const SEARCH_ZOOM = 17;
// Search starts at this many letters, after this pause in typing.
const SEARCH_MIN_LETTERS = 3;
const SEARCH_DELAY_MS = 350;

// Turns the two text fields into [lat, lng], or null when empty or invalid.
const toPosition = (point) => {
  const lat = Number(point.latitude);
  const lng = Number(point.longitude);
  const isSet =
    point.latitude !== "" &&
    point.latitude !== null &&
    point.longitude !== "" &&
    point.longitude !== null &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180;
  return isSet ? [lat, lng] : null;
};

const round = (value) => Number(value.toFixed(6));

export default function MapPicker({
  points,
  onChange,
  disabled = false,
  mode = "pins",
  pinTone = "",
  initialCenter = null,
}) {
  const isCenterMode = mode === "center";
  const hostRef = useRef(null);
  const leafletRef = useRef(null);
  const mapRef = useRef(null);
  const lineRef = useRef(null);
  const markersRef = useRef({});
  const onChangeRef = useRef(onChange);
  const pointsRef = useRef(points);
  const disabledRef = useRef(disabled);
  const activeKeyRef = useRef(points[0].key);
  // The mode never changes while the map is open.
  const isCenterModeRef = useRef(isCenterMode);
  // Where to open the map when no point is set yet (read once).
  const initialCenterRef = useRef(initialCenter);
  // True while the map is moving because of our own code (not the user),
  // so that move is not reported back into the fields.
  const movingByCodeRef = useRef(false);
  // Last position reported from the map, so it isn't applied back to it.
  const lastReportedRef = useRef(null);

  const [activeKey, setActiveKey] = useState(points[0].key);
  // False until Leaflet has downloaded and the map exists.
  const [isReady, setIsReady] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [highlighted, setHighlighted] = useState(-1);
  const [isListOpen, setIsListOpen] = useState(false);
  // The query that was last sent, so the same search is never repeated.
  const lastQueryRef = useRef("");

  useEffect(() => {
    onChangeRef.current = onChange;
    pointsRef.current = points;
    disabledRef.current = disabled;
    activeKeyRef.current = activeKey;
  });

  // Moves the map without reporting the move as a user choice.
  const moveMapByCode = (move) => {
    movingByCodeRef.current = true;
    move();
  };

  // Keep pins and the line in step with the coordinates (typed or picked).
  const syncMarkers = () => {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!map) return;

    if (isCenterModeRef.current) {
      const position = toPosition(pointsRef.current[0]);
      const last = lastReportedRef.current;
      const cameFromMap =
        position &&
        last &&
        Math.abs(position[0] - last[0]) < 1e-6 &&
        Math.abs(position[1] - last[1]) < 1e-6;
      if (position && !cameFromMap) {
        lastReportedRef.current = position;
        moveMapByCode(() =>
          map.setView(position, map.getZoom(), { animate: false }),
        );
      }
      return;
    }

    const positions = [];
    pointsRef.current.forEach((point, index) => {
      const position = toPosition(point);
      let marker = markersRef.current[point.key];

      if (!position) {
        if (marker) {
          marker.remove();
          delete markersRef.current[point.key];
        }
        return;
      }
      positions.push(position);

      if (!marker) {
        const isSingle = pointsRef.current.length === 1;
        marker = L.marker(position, {
          draggable: !disabledRef.current,
          keyboard: false,
          icon: L.divIcon({
            className: `map-marker ${isSingle ? "map-marker-single" : `map-marker-${index}`}`,
            html: isSingle ? "" : point.label[0],
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          }),
        }).addTo(map);
        marker.on("dragend", () => {
          const { lat, lng } = marker.getLatLng();
          onChangeRef.current(point.key, round(lat), round(lng));
        });
        markersRef.current[point.key] = marker;
      } else {
        marker.setLatLng(position);
        if (disabledRef.current) marker.dragging.disable();
        else marker.dragging.enable();
      }
    });

    lineRef.current.setLatLngs(positions.length > 1 ? positions : []);
  };

  // Create the map when the picker opens, remove it when it closes.
  useEffect(() => {
    let cancelled = false;
    let frame = 0;

    import("leaflet").then(({ default: L }) => {
      if (cancelled) return;
      leafletRef.current = L;
      createMap(L);
    });

    const createMap = (L) => {
      const host = hostRef.current;
      const lineColor = getComputedStyle(host)
        .getPropertyValue("--map-line-color")
        .trim();

      const placed = pointsRef.current.map(toPosition).filter(Boolean);
      const map = L.map(host, {
        center: placed[0] || initialCenterRef.current || DEFAULT_CENTER,
        zoom:
          placed.length || initialCenterRef.current ? POINT_ZOOM : DEFAULT_ZOOM,
      });
      mapRef.current = map;
      L.tileLayer(TILE_URL, { maxZoom: 19, attribution: ATTRIBUTION }).addTo(
        map,
      );

      // Dashed line between points (routes).
      lineRef.current = L.polyline([], {
        color: lineColor,
        weight: 3,
        dashArray: "6 5",
      }).addTo(map);

      if (placed.length > 1) {
        map.fitBounds(placed, { padding: [40, 40], maxZoom: POINT_ZOOM });
      }
      lastReportedRef.current = placed[0] || null;

      // Centre mode: when the user moves the map, the centre is the point.
      map.on("moveend", () => {
        if (movingByCodeRef.current) {
          movingByCodeRef.current = false;
          return;
        }
        if (!isCenterModeRef.current || disabledRef.current) return;
        const center = map.getCenter();
        const lat = round(center.lat);
        const lng = round(center.lng);
        lastReportedRef.current = [lat, lng];
        onChangeRef.current(pointsRef.current[0].key, lat, lng);
      });

      map.on("click", (event) => {
        if (disabledRef.current) return;
        if (isCenterModeRef.current) {
          // Slide the clicked spot under the pin; moveend reports it.
          map.panTo(event.latlng);
          return;
        }
        const key = activeKeyRef.current;
        onChangeRef.current(
          key,
          round(event.latlng.lat),
          round(event.latlng.lng),
        );

        // After placing one point, move on to the next one that is still empty.
        const next = pointsRef.current.find(
          (point) => point.key !== key && !toPosition(point),
        );
        if (next) setActiveKey(next.key);
      });

      // The modal may still be sizing itself; let the map measure again.
      frame = requestAnimationFrame(() => map.invalidateSize());
      // Re-render once, so the effect below draws the pins and line.
      setIsReady(true);
    };

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      if (mapRef.current) mapRef.current.remove();
      mapRef.current = null;
      markersRef.current = {};
    };
  }, []);

  useEffect(() => {
    syncMarkers();
  });

  // Search as you type: waits for a pause, skips short or repeated
  // queries, and cancels a request that is no longer needed.
  useEffect(() => {
    const query = searchText.trim();
    if (query.length < SEARCH_MIN_LETTERS || query === lastQueryRef.current) {
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      lastQueryRef.current = query;
      setIsSearching(true);
      setSearchError("");
      try {
        const center = mapRef.current
          ? mapRef.current.getCenter()
          : { lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1] };
        const places = await searchPlaces(
          query,
          [center.lat, center.lng],
          controller.signal,
        );
        setResults(places);
        setHighlighted(places.length ? 0 : -1);
        setIsListOpen(true);
        if (places.length === 0) setSearchError(`No places found for "${query}".`);
      } catch (err) {
        if (err.name === "AbortError") return;
        lastQueryRef.current = "";
        setResults([]);
        setSearchError("Couldn't search right now. Check your connection and try again.");
      } finally {
        if (!controller.signal.aborted) setIsSearching(false);
      }
    }, SEARCH_DELAY_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchText]);

  // Fly to the chosen place. In centre mode the pin lands on it, so it
  // becomes the point; in pin mode the user then clicks to place a pin.
  const choosePlace = (place) => {
    setIsListOpen(false);
    setSearchText(place.label);
    lastQueryRef.current = place.label;
    const map = mapRef.current;
    if (!map) return;
    const position = [place.lat, place.lng];
    moveMapByCode(() => map.setView(position, SEARCH_ZOOM, { animate: false }));
    if (isCenterMode) {
      const lat = round(place.lat);
      const lng = round(place.lng);
      lastReportedRef.current = [lat, lng];
      onChangeRef.current(points[0].key, lat, lng);
    }
  };

  return (
    <div className="map-picker">
      {points.length > 1 && (
        <div
          className="map-picker-modes"
          role="group"
          aria-label="Point to place"
        >
          {points.map((point, index) => (
            <button
              key={point.key}
              type="button"
              className={`map-picker-mode map-picker-mode-${index} ${
                activeKey === point.key ? "is-active" : ""
              }`}
              onClick={() => setActiveKey(point.key)}
              disabled={disabled}
              aria-pressed={activeKey === point.key}
            >
              <span className="map-picker-dot" aria-hidden="true"></span>
              {toPosition(point) ? `Move ${point.label}` : `Set ${point.label}`}
            </button>
          ))}
        </div>
      )}

      <div className="map-picker-search">
        <div className="map-picker-search-row">
          <input
            type="search"
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setSearchError("");
              if (e.target.value.trim().length < SEARCH_MIN_LETTERS) {
                setResults([]);
                setIsListOpen(false);
                setIsSearching(false);
              }
            }}
            onFocus={() => results.length > 0 && setIsListOpen(true)}
            onBlur={() => setIsListOpen(false)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault();
                if (!results.length) return;
                setIsListOpen(true);
                const step = e.key === "ArrowDown" ? 1 : -1;
                setHighlighted((current) =>
                  (current + step + results.length) % results.length,
                );
              }
              // Enter picks a place; it must never submit the modal's form.
              if (e.key === "Enter") {
                e.preventDefault();
                if (isListOpen && results[highlighted]) {
                  choosePlace(results[highlighted]);
                }
              }
              if (e.key === "Escape" && isListOpen) {
                e.stopPropagation();
                setIsListOpen(false);
              }
            }}
            placeholder="Search a place or address"
            disabled={disabled || !isReady}
            aria-label="Search a place"
            role="combobox"
            aria-expanded={isListOpen && results.length > 0}
            aria-autocomplete="list"
          />
          {isSearching && (
            <span className="map-picker-search-spinner" aria-hidden="true"></span>
          )}
        </div>

        {isListOpen && results.length > 0 && (
          <ul className="map-picker-results" role="listbox">
            {results.map((place, index) => (
              <li key={place.id} role="option" aria-selected={index === highlighted}>
                <button
                  type="button"
                  className={index === highlighted ? "is-highlighted" : ""}
                  // mousedown, so the input's blur doesn't close the list first
                  onMouseDown={(e) => {
                    e.preventDefault();
                    choosePlace(place);
                  }}
                  onMouseEnter={() => setHighlighted(index)}
                >
                  <i className="bi bi-geo-alt" aria-hidden="true"></i>
                  <span>{place.label}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {searchError && <p className="map-picker-search-error">{searchError}</p>}
      </div>

      <div className="map-picker-frame">
        <div ref={hostRef} className="map-picker-map" />
        {!isReady && <div className="map-picker-loading">Loading map…</div>}
        {isCenterMode && isReady && (
          <div
            className={`map-picker-center-pin ${pinTone ? `is-${pinTone}` : ""}`}
            aria-hidden="true"
          >
            <i className="bi bi-geo-alt-fill"></i>
          </div>
        )}
      </div>

      <p className="map-picker-hint">
        {points.length > 1
          ? `Click the map to place the ${
              points.find((point) => point.key === activeKey).label
            } point. Drag a pin to adjust it.`
          : isCenterMode
            ? "Drag the map to put the pin on the stop. You can also click a spot or type the coordinates."
            : "Click the map to place the pin. Drag it to adjust."}
      </p>
    </div>
  );
}
