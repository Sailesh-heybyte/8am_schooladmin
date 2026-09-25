import { apiCall } from "./client.js";
import { formatDate, hasValue } from "../utils/helpers.js";

const toUiBus = (bus) => ({
  id: bus.id,
  schoolId: bus.school_id,
  branchId: bus.branch_id ?? null,
  branchName: bus.branch_name,
  busName: bus.name,
  registrationNumber: bus.registration_number,
  capacity: Number(bus.capacity),
  driverId: bus.driver_id ?? null,
  driverName: bus.driver_name,
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
  const name = bus.busName;
  const regNumber = bus.registrationNumber;
  const capacity = bus.capacity;

  if (hasValue(name)) {
    body.name = name;
  }
  if (hasValue(regNumber)) {
    body.registration_number = regNumber;
  }
  if (hasValue(capacity)) {
    body.capacity = Number(capacity);
  }

  return body;
};

export const getBuses = async () => {
  const data = await apiCall("/fleet/buses");
  return data.map(toUiBus);
};

export const getBus = async (id) => {
  const data = await apiCall(`/fleet/buses/${id}`);
  return toUiBus(data);
};

export const createBus = (data) =>
  apiCall("/fleet/buses", {
    method: "POST",
    body: toApiBus(data),
  });

export const updateBus = (id, data) =>
  apiCall(`/fleet/buses/${id}`, {
    method: "PATCH",
    body: toApiBusUpdate(data),
  });

export const assignDriver = async (busId, driverId) => {
  const data = await apiCall(`/fleet/buses/${busId}/assign-driver`, {
    method: "POST",
    body: { driver_id: driverId },
  });
  return toUiBus(data);
};

export const unassignDriver = async (busId) => {
  const data = await apiCall(`/fleet/buses/${busId}/unassign-driver`, {
    method: "POST",
  });
  return toUiBus(data);
};
