import { useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import busIcon from "../../assets/bus-marker-cropped.png";
import busStopPin from "../../assets/bus-stop-pin.png";
import { lineString, point } from "@turf/helpers";
import { nearestPointOnLine } from "@turf/nearest-point-on-line";
import { distance } from "@turf/distance";

const STYLE_URL = "https://tiles.openfreemap.org/styles/bright";
const DEFAULT_CENTER = [81.7927, 17.0047];
const BUS_ZOOM = 16;
const TURN_MS = 600;
const SPLIT_EVERY_MS = 150;
const MAX_OFF_ROUTE_METRES = 100;
const toMarkerHeading = (heading) => ((heading != null ? heading : 0) - 90);

const EMPTY_LINE = { type: "FeatureCollection", features: [] };

const toLine = (path) => ({
  type: "Feature",
  geometry: { type: "LineString", coordinates: path },
});

const buildPointElement = (point) => {
  if (point.kind === "stop") {
    const img = document.createElement("img");
    img.src = busStopPin;
    img.alt = point.name;
    img.className = "live-stop-pin";
    img.title = point.name;
    return img;
  }
  const element = document.createElement("div");
  element.className = `live-route-point is-${point.kind}`;
  element.title = point.name;
  return element;
};

const between = (from, to, progress) => from + (to - from) * progress;

const turnBetween = (fromAngle, toAngle, progress) => {
  const difference = ((toAngle - fromAngle + 540) % 360) - 180;
  return fromAngle + difference * progress;
};

export default function LiveBusMap({ location, isLive, routePath, routePoints }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const moveRef = useRef(null);
  const followRef = useRef(true);
  const libraryRef = useRef(null);
  const hasFittedRouteRef = useRef(false);
  const routePathRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [hasRouteLayer, setHasRouteLayer] = useState(false);
  const [isFollowing, setIsFollowing] = useState(true);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      import("maplibre-gl"),
      import("maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url"),
    ]).then(([maplibregl, { default: workerUrl }]) => {
      if (cancelled) return;
      maplibregl.setWorkerUrl(workerUrl);
      libraryRef.current = maplibregl;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: STYLE_URL,
        center: DEFAULT_CENTER,
        zoom: 13,
        attributionControl: { compact: true },
      });
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }));
      const stopFollowing = () => {
        followRef.current = false;
        setIsFollowing(false);
      };
      map.on("mousedown", stopFollowing);
      map.on("touchstart", stopFollowing);
      map.on("wheel", stopFollowing);
      map.on("load", () => {
        const styles = getComputedStyle(containerRef.current);
        const routeColor = styles.getPropertyValue("--route-color").trim();
        const doneColor = styles.getPropertyValue("--route-done-color").trim();
        map.addSource("route-done", { type: "geojson", data: EMPTY_LINE });
        map.addLayer({
          id: "route-done",
          type: "line",
          source: "route-done",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": doneColor, "line-width": 4 },
        });
        map.addSource("route", { type: "geojson", data: EMPTY_LINE });
        map.addLayer({
          id: "route",
          type: "line",
          source: "route",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": routeColor, "line-width": 4 },
        });
        setHasRouteLayer(true);
      });

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
      if (!hasFittedRouteRef.current) map.jumpTo({ center: target, zoom: BUS_ZOOM });
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
    const targetHeading = toMarkerHeading(location.heading);
    moveRef.current = {
      from: [current.lng, current.lat],
      to: target,
      fromHeading: marker.getRotation(),
      toHeading: targetHeading,
      startedAt: now,
      duration: Math.min(Math.max(now - previous.startedAt, 500), 5000),
    };
  }, [location, isReady]);

  useEffect(() => {
    if (!isReady) return;
    let frameId;
    let lastSplitAt = 0;

    const updateRouteSplit = () => {
      const path = routePathRef.current;
      if (!path || !moveRef.current || !mapRef.current.getSource("route")) return;

      const { lng, lat } = markerRef.current.getLngLat();
      const route = lineString(path);
      const bus = point([lng, lat]);
      const busOnRoute = nearestPointOnLine(route, bus);

      if (distance(bus, busOnRoute, { units: "meters" }) > MAX_OFF_ROUTE_METRES) {
        mapRef.current.getSource("route").setData(route);
        mapRef.current.getSource("route-done").setData(EMPTY_LINE);
        return;
      }

      // cut the route where the bus is: everything before = done (grey), after = ahead (blue)
      const cutAt = Math.min(busOnRoute.properties.segmentIndex, path.length - 2);
      const cutPoint = busOnRoute.geometry.coordinates;
      mapRef.current.getSource("route").setData(toLine([cutPoint, ...path.slice(cutAt + 1)]));
      mapRef.current.getSource("route-done").setData(toLine([...path.slice(0, cutAt + 1), cutPoint]));
    };

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
        if (followRef.current && progress < 1) mapRef.current.setCenter(position);
      }
      if (now - lastSplitAt > SPLIT_EVERY_MS) {
        updateRouteSplit();
        lastSplitAt = now;
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

  useEffect(() => {
    if (!hasRouteLayer || !routePath) return undefined;
    const map = mapRef.current;
    const maplibregl = libraryRef.current;

    routePathRef.current = routePath;
    map.getSource("route").setData(toLine(routePath));

    const pointMarkers = routePoints.map((point) => {
      const isStop = point.kind === "stop";
      return new maplibregl.Marker({
        element: buildPointElement(point),
        anchor: isStop ? "bottom" : "center",
      })
        .setLngLat([point.lng, point.lat])
        .addTo(map);
    });

    if (!hasFittedRouteRef.current) {
      hasFittedRouteRef.current = true;
      followRef.current = false;
      setIsFollowing(false);
      const bounds = new maplibregl.LngLatBounds();
      routePath.forEach((point) => bounds.extend(point));
      if (moveRef.current) bounds.extend(markerRef.current.getLngLat());
      map.fitBounds(bounds, { padding: 80, maxZoom: BUS_ZOOM, duration: 0 });
    }

    return () => {
      routePathRef.current = null;
      pointMarkers.forEach((pointMarker) => pointMarker.remove());
      if (mapRef.current) {
        map.getSource("route").setData(EMPTY_LINE);
        map.getSource("route-done").setData(EMPTY_LINE);
      }
    };
  }, [routePath, routePoints, hasRouteLayer]);

  const recenter = () => {
    const marker = markerRef.current;
    followRef.current = true;
    setIsFollowing(true);
    mapRef.current.easeTo({ center: marker.getLngLat(), zoom: BUS_ZOOM });
  };

  return (
    <div className="live-map-wrap">
      <div ref={containerRef} className="live-map" />
      {location && !isFollowing && (
        <button type="button" className="live-recenter" onClick={recenter}>
          <i className="bi bi-crosshair"></i>
          <span>Follow bus</span>
        </button>
      )}
    </div>
  );
}
