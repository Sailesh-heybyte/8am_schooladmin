import { apiCall } from "./client.js";

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString();
};

function hasValue(val) {
  if (val === undefined || val === null) return false;
  if (typeof val === "string" && val.trim() === "") return false;
  return true;
}

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
  routeName: route.name,
  busId: route.bus_id,
  isActive: Boolean(route.is_active),
  createdAt: formatDate(route.created_at),
  stops: (route.stops ?? []).map(toUiRouteStop),
});

const toApiRoute = (route) => ({
  name: route.routeName,
  branch_id: route.branchId,
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
