import { apiCall } from "./client.js";

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString();
};

const toUiBus = (bus) => ({
  id: bus.id,
  schoolId: bus.school_id,
  branchId: bus.branch_id ?? null,
  busName: bus.name,
  registrationNumber: bus.registration_number,
  capacity: Number(bus.capacity),
  driverId: bus.driver_id ?? null,
  isActive: Boolean(bus.is_active),
  createdAt: formatDate(bus.created_at),
});

const toApiBus = (bus) => ({
  name: bus.busName,
  registration_number: bus.registrationNumber,
  capacity: Number(bus.capacity),
  branch_id: bus.branchId,
});

const toApiBusUpdate = (bus) => {
  const body = {};

  if (bus.busName !== undefined && bus.busName !== null && bus.busName !== "") {
    body.name = bus.busName;
  }
  if (
    bus.registrationNumber !== undefined &&
    bus.registrationNumber !== null &&
    bus.registrationNumber !== ""
  ) {
    body.registration_number = bus.registrationNumber;
  }
  if (bus.capacity !== undefined && bus.capacity !== null && bus.capacity !== "") {
    body.capacity = Number(bus.capacity);
  }

  return body;
};

// GET /api/v1/fleet/buses
// Uses the /fleet prefix rather than /iam endpoints used elsewhere.
export const getBuses = async () => {
  const data = await apiCall("/fleet/buses");
  return data.map(toUiBus);
};

// GET /api/v1/fleet/buses/{id}
// Uses the /fleet prefix rather than /iam endpoints used elsewhere.
export const getBus = async (id) => {
  const data = await apiCall(`/fleet/buses/${id}`);
  return toUiBus(data);
};

// POST /api/v1/fleet/buses
// Uses the /fleet prefix rather than /iam endpoints used elsewhere.
export const createBus = (data) =>
  apiCall("/fleet/buses", {
    method: "POST",
    body: toApiBus(data),
  });

// PATCH /api/v1/fleet/buses/{id}
// Uses the /fleet prefix rather than /iam endpoints used elsewhere.
export const updateBus = (id, data) =>
  apiCall(`/fleet/buses/${id}`, {
    method: "PATCH",
    body: toApiBusUpdate(data),
  });
