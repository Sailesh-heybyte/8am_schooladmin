import { useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import busIcon from "../../assets/bus-marker-cropped.png";

const STYLE_URL = "https://tiles.openfreemap.org/styles/bright";
const DEFAULT_CENTER = [81.7927, 17.0047];
const BUS_ZOOM = 16;
const TURN_MS = 600;
const toMarkerHeading = (heading) => ((heading != null ? heading : 0) - 90);

const between = (from, to, progress) => from + (to - from) * progress;

const turnBetween = (fromAngle, toAngle, progress) => {
  const difference = ((toAngle - fromAngle + 540) % 360) - 180;
  return fromAngle + difference * progress;
};

export default function LiveBusMap({ location, isLive }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const moveRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      import("maplibre-gl"),
      import("maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url"),
    ]).then(([maplibregl, { default: workerUrl }]) => {
      if (cancelled) return;
      maplibregl.setWorkerUrl(workerUrl);

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: STYLE_URL,
        center: DEFAULT_CENTER,
        zoom: 13,
        attributionControl: { compact: true },
      });
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }));

      const element = document.createElement("img");
      element.src = busIcon;
      element.alt = "";
      element.className = "live-bus-marker";
      markerRef.current = new maplibregl.Marker({
        element,
        rotationAlignment: "map",
        subpixelPositioning: true,
      });

      mapRef.current = map;
      setIsReady(true);
    });

    return () => {
      cancelled = true;
      if (mapRef.current) mapRef.current.remove();
      mapRef.current = null;
      markerRef.current = null;
      moveRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!isReady || !location) return;
    const map = mapRef.current;
    const marker = markerRef.current;
    const target = [location.longitude, location.latitude];
    const now = performance.now();
    const previous = moveRef.current;

    if (!previous) {
      const initialHeading = toMarkerHeading(location.heading);
      marker.setLngLat(target).setRotation(initialHeading).addTo(map);
      map.jumpTo({ center: target, zoom: BUS_ZOOM });
      moveRef.current = {
        from: target,
        to: target,
        fromHeading: initialHeading,
        toHeading: initialHeading,
        startedAt: now,
        duration: 1,
      };
      return;
    }

    const current = marker.getLngLat();
    moveRef.current = {
      from: [current.lng, current.lat],
      to: target,
      fromHeading: marker.getRotation(),
      toHeading: toMarkerHeading(location.heading),
      startedAt: now,
      duration: Math.min(Math.max(now - previous.startedAt, 500), 5000),
    };
  }, [location, isReady]);

  useEffect(() => {
    if (!isReady) return;
    let frameId;

    const drawFrame = (now) => {
      const move = moveRef.current;
      if (move) {
        const progress = Math.min((now - move.startedAt) / move.duration, 1);
        const turnProgress = Math.min((now - move.startedAt) / TURN_MS, 1);
        const position = [
          between(move.from[0], move.to[0], progress),
          between(move.from[1], move.to[1], progress),
        ];
        markerRef.current.setLngLat(position);
        markerRef.current.setRotation(turnBetween(move.fromHeading, move.toHeading, turnProgress));
        if (progress < 1) mapRef.current.setCenter(position);
      }
      frameId = requestAnimationFrame(drawFrame);
    };

    frameId = requestAnimationFrame(drawFrame);
    return () => cancelAnimationFrame(frameId);
  }, [isReady]);

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.getElement().classList.toggle("is-stale", !isLive);
    }
  }, [isLive, isReady]);

  return (
    <div className="live-map-wrap">
      <div ref={containerRef} className="live-map" />
    </div>
  );
}
