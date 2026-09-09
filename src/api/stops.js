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

const toUiStop = (stop) => ({
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

const toApiStop = (stop) => ({
  name: stop.stopName,
  latitude: Number(stop.latitude),
  longitude: Number(stop.longitude),
  branch_id: stop.branchId,
});

const toApiStopUpdate = (stop) => {
  const body = {};
  const name = stop.stopName;
  const latitude = stop.latitude;
  const longitude = stop.longitude;
  const isActive = stop.isActive;

  if (hasValue(name)) {
    body.name = name;
  }
  if (hasValue(latitude)) {
    body.latitude = Number(latitude);
  }
  if (hasValue(longitude)) {
    body.longitude = Number(longitude);
  }
  if (typeof isActive === "boolean") {
    body.is_active = isActive;
  }

  return body;
};

export const getStops = async () => {
  const data = await apiCall("/routing/stops");
  return data.map(toUiStop);
};

export const getStop = async (id) => {
  const data = await apiCall(`/routing/stops/${id}`);
  return toUiStop(data);
};

export const createStop = (data) =>
  apiCall("/routing/stops", {
    method: "POST",
    body: toApiStop(data),
  });

export const updateStop = (id, data) =>
  apiCall(`/routing/stops/${id}`, {
    method: "PATCH",
    body: toApiStopUpdate(data),
  });
