import { useEffect, useState } from "react";
import { getRoutes, getRoute } from "../api/routes.js";
import { getRoadPath } from "../api/directions.js";

const hasPoint = (lat, lng) => lat !== null && lng !== null;

const loadBusRoute = async (busId) => {
  const routes = await getRoutes();
  const assigned = routes.find((route) => route.busId === busId && route.isActive);
  if (!assigned) return { status: "none", route: null, points: [], path: null, isRoadPath: false };

  const route = await getRoute(assigned.id);
  const stops = route.stops
    .filter((stop) => hasPoint(stop.latitude, stop.longitude))
    .sort((a, b) => a.sequence - b.sequence);

  const points = [
    ...(hasPoint(route.startLat, route.startLng)
      ? [{ kind: "start", name: "Start", lng: route.startLng, lat: route.startLat }]
      : []),
    ...stops.map((stop) => ({
      kind: "stop",
      name: stop.stopName,
      lng: stop.longitude,
      lat: stop.latitude,
    })),
    ...(hasPoint(route.endLat, route.endLng)
      ? [{ kind: "end", name: "End", lng: route.endLng, lat: route.endLat }]
      : []),
  ];

  if (points.length < 2) {
    return { status: "ready", route, points, path: null, isRoadPath: false };
  }

  const straightPath = points.map((point) => [point.lng, point.lat]);
  try {
    const path = await getRoadPath(straightPath);
    return { status: "ready", route, points, path, isRoadPath: true };
  } catch {
    return { status: "ready", route, points, path: straightPath, isRoadPath: false };
  }
};

export function useBusRoute(busId) {
  const [busRoute, setBusRoute] = useState({
    status: "loading",
    route: null,
    points: [],
    path: null,
    isRoadPath: false,
  });

  useEffect(() => {
    let cancelled = false;

    loadBusRoute(busId)
      .then((result) => {
        if (!cancelled) setBusRoute(result);
      })
      .catch((err) => {
        if (!cancelled) {
          setBusRoute({
            status: "error",
            route: null,
            points: [],
            path: null,
            isRoadPath: false,
            error: err.message,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [busId]);

  return busRoute;
}
