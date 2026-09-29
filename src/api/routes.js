import { apiCall } from "./client.js";
import { formatDate, hasValue } from "../utils/helpers.js";

const toUiRouteStop = (stop) => ({
  id: stop.id,
  schoolId: stop.school_id,
  branchId: stop.branch_id,
  stopName: stop.name,
  latitude:
    stop.latitude !== null && stop.latitude !== undefined
      ? Number(stop.latitude)
      : null,
  longitude:
    stop.longitude !== null && stop.longitude !== undefined
      ? Number(stop.longitude)
      : null,
  routeId: stop.route_id,
  sequence: stop.sequence,
  isActive: Boolean(stop.is_active),
  createdAt: formatDate(stop.created_at),
});

const toUiRoute = (route) => ({
  id: route.id,
  schoolId: route.school_id,
  branchId: route.branch_id,
  branchName: route.branch_name,
  routeName: route.name,
  busId: route.bus_id,
  registrationNumber: route.registration_number,
  startLat: route.start_lat,
  startLng: route.start_lng,
  endLat: route.end_lat,
  endLng: route.end_lng,
  isActive: Boolean(route.is_active),
  createdAt: formatDate(route.created_at),
  stops: (route.stops ?? []).map(toUiRouteStop),
});

const toApiRoute = (route) => ({
  name: route.routeName,
  branch_id: route.branchId,
  start_lat: route.startLat,
  start_lng: route.startLng,
  end_lat: route.endLat,
  end_lng: route.endLng,
});

const toApiRouteUpdate = (route) => {
  const body = {};
  const name = route.routeName;
  const isActive = route.isActive;

  if (hasValue(name)) {
    body.name = name;
  }
  if (typeof isActive === "boolean") {
    body.is_active = isActive;
  }
  if (typeof route.startLat === "number") {
    body.start_lat = route.startLat;
  }
  if (typeof route.startLng === "number") {
    body.start_lng = route.startLng;
  }
  if (typeof route.endLat === "number") {
    body.end_lat = route.endLat;
  }
  if (typeof route.endLng === "number") {
    body.end_lng = route.endLng;
  }

  return body;
};

export const getRoutes = async () => {
  const data = await apiCall("/routing/routes");
  return data.map(toUiRoute);
};

export const getRoute = async (id) => {
  const data = await apiCall(`/routing/routes/${id}`);
  return toUiRoute(data);
};

export const createRoute = async (data) => {
  const res = await apiCall("/routing/routes", {
    method: "POST",
    body: toApiRoute(data),
  });
  return toUiRoute(res);
};

export const updateRoute = async (id, data) => {
  const res = await apiCall(`/routing/routes/${id}`, {
    method: "PATCH",
    body: toApiRouteUpdate(data),
  });
  return toUiRoute(res);
};

export const assignBus = async (routeId, busId) => {
  const data = await apiCall(`/routing/routes/${routeId}/assign-bus`, {
    method: "POST",
    body: { bus_id: busId },
  });
  return toUiRoute(data);
};

export const unassignBus = async (routeId) => {
  const data = await apiCall(`/routing/routes/${routeId}/unassign-bus`, {
    method: "POST",
  });
  return toUiRoute(data);
};

export const addStopToRoute = async (routeId, stopId) => {
  const data = await apiCall(`/routing/routes/${routeId}/stops`, {
    method: "POST",
    body: { stop_id: stopId },
  });
  return toUiRoute(data);
};

export const reorderRouteStops = async (routeId, stopIds) => {
  const data = await apiCall(`/routing/routes/${routeId}/stops/order`, {
    method: "PATCH",
    body: { stop_ids: stopIds },
  });
  return toUiRoute(data);
};

export const removeStopFromRoute = async (routeId, stopId) => {
  const data = await apiCall(`/routing/routes/${routeId}/stops/${stopId}`, {
    method: "DELETE",
  });
  return toUiRoute(data);
};
