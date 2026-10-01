import { useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { searchPlaces } from "../api/geocoding.js";
import "./MapPicker.scss";

const STYLE_URL = "https://tiles.openfreemap.org/styles/bright";

const DEFAULT_CENTER = [81.79271807527687, 17.004750823000403];
const DEFAULT_ZOOM = 12;
const POINT_ZOOM = 15;
const SEARCH_ZOOM = 17;
const SEARCH_MIN_LETTERS = 3;
const SEARCH_DELAY_MS = 200;

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
  return isSet ? [lng, lat] : null;
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
  const mapRef = useRef(null);
  const libraryRef = useRef(null);
  const markersRef = useRef({});
  const onChangeRef = useRef(onChange);
  const pointsRef = useRef(points);
  const disabledRef = useRef(disabled);
  const activeKeyRef = useRef(points[0].key);
  const isCenterModeRef = useRef(isCenterMode);
  const initialCenterRef = useRef(initialCenter);
  const lastReportedRef = useRef(null);

  const [activeKey, setActiveKey] = useState(points[0].key);
  const [status, setStatus] = useState("loading");
  const isReady = status === "ready";
  const [searchText, setSearchText] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [highlighted, setHighlighted] = useState(-1);
  const [isListOpen, setIsListOpen] = useState(false);
  const lastQueryRef = useRef("");

  useEffect(() => {
    onChangeRef.current = onChange;
    pointsRef.current = points;
    disabledRef.current = disabled;
    activeKeyRef.current = activeKey;
  });

  const syncMarkers = () => {
    const map = mapRef.current;
    const maplibregl = libraryRef.current;
    if (!map || !isReady) return;

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
        map.jumpTo({ center: position });
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
        const element = document.createElement("div");
        element.className = `map-marker ${
          isSingle ? "map-marker-single" : `map-marker-${index}`
        }`;
        element.textContent = isSingle ? "" : point.label[0];
        element.setAttribute("aria-label", point.label);
        marker = new maplibregl.Marker({
          element,
          draggable: !disabledRef.current,
        })
          .setLngLat(position)
          .addTo(map);
        marker.on("dragend", () => {
          const { lat, lng } = marker.getLngLat();
          onChangeRef.current(point.key, round(lat), round(lng));
        });
        markersRef.current[point.key] = marker;
      } else {
        marker.setLngLat(position);
        marker.setDraggable(!disabledRef.current);
      }
    });

    map.getSource("picker-line").setData({
      type: "FeatureCollection",
      features:
        positions.length > 1
          ? [
              {
                type: "Feature",
                geometry: { type: "LineString", coordinates: positions },
              },
            ]
          : [],
    });
  };

  useEffect(() => {
    let cancelled = false;
    const host = hostRef.current;
    const lineColor = getComputedStyle(host)
      .getPropertyValue("--map-line-color")
      .trim();

    Promise.all([
      import("maplibre-gl"),
      import("maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url"),
    ])
      .then(([maplibregl, { default: workerUrl }]) => {
        if (cancelled) return;
        maplibregl.setWorkerUrl(workerUrl);
        libraryRef.current = maplibregl;

        const placed = pointsRef.current.map(toPosition).filter(Boolean);
        const nearby = initialCenterRef.current
          ? [initialCenterRef.current[1], initialCenterRef.current[0]]
          : null;
        const map = new maplibregl.Map({
          container: host,
          style: STYLE_URL,
          center: placed[0] || nearby || DEFAULT_CENTER,
          zoom: placed.length || nearby ? POINT_ZOOM : DEFAULT_ZOOM,
          attributionControl: { compact: true },
        });
        mapRef.current = map;
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }));
        if (isCenterModeRef.current) {
          map.scrollZoom.disable();
          map.scrollZoom.enable({ around: "center" });
          map.touchZoomRotate.disable();
          map.touchZoomRotate.enable({ around: "center" });
          map.doubleClickZoom.disable();
        }
        lastReportedRef.current = placed[0] || null;

        map.on("load", () => {
          if (cancelled) return;
          map.addSource("picker-line", {
            type: "geojson",
            data: { type: "FeatureCollection", features: [] },
          });
          map.addLayer({
            id: "picker-line",
            type: "line",
            source: "picker-line",
            layout: { "line-cap": "round" },
            paint: {
              "line-color": lineColor,
              "line-width": 3,
              "line-dasharray": [2, 1.5],
            },
          });
          if (placed.length > 1) {
            map.fitBounds(
              [
                [Math.min(...placed.map((p) => p[0])), Math.min(...placed.map((p) => p[1]))],
                [Math.max(...placed.map((p) => p[0])), Math.max(...placed.map((p) => p[1]))],
              ],
              { padding: 60, duration: 0, maxZoom: POINT_ZOOM },
            );
          }
          setStatus("ready");
        });

        map.on("error", () => {
          if (!map.loaded()) setStatus("error");
        });

        map.on("moveend", (event) => {
          if (!isCenterModeRef.current || disabledRef.current) return;
          if (!event.originalEvent && !event.fromClick) return;
          const center = map.getCenter();
          const lat = round(center.lat);
          const lng = round(center.lng);
          lastReportedRef.current = [lng, lat];
          onChangeRef.current(pointsRef.current[0].key, lat, lng);
        });

        map.on("click", (event) => {
          if (disabledRef.current) return;
          if (isCenterModeRef.current) {
            map.easeTo({ center: event.lngLat }, { fromClick: true });
            return;
          }
          const key = activeKeyRef.current;
          onChangeRef.current(key, round(event.lngLat.lat), round(event.lngLat.lng));

          const next = pointsRef.current.find(
            (point) => point.key !== key && !toPosition(point),
          );
          if (next) setActiveKey(next.key);
        });
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      if (mapRef.current) mapRef.current.remove();
      mapRef.current = null;
      markersRef.current = {};
    };
  }, []);

  useEffect(() => {
    syncMarkers();
  });

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
          : { lat: DEFAULT_CENTER[1], lng: DEFAULT_CENTER[0] };
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

  const choosePlace = (place) => {
    setIsListOpen(false);
    setSearchText(place.label);
    lastQueryRef.current = place.label;
    const map = mapRef.current;
    if (!map) return;
    map.jumpTo({ center: [place.lng, place.lat], zoom: SEARCH_ZOOM });
    if (isCenterMode) {
      const lat = round(place.lat);
      const lng = round(place.lng);
      lastReportedRef.current = [lng, lat];
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
        {status === "loading" && (
          <div className="map-picker-loading">Loading map…</div>
        )}
        {status === "error" && (
          <div className="map-picker-loading is-error">
            Map unavailable right now. Enter the coordinates below.
          </div>
        )}
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