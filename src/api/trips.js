import { apiCall } from "./client.js";

export const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString();
};

const toUiTrip = (trip) => ({
  id: trip.id,
  schoolId: trip.school_id,
  branchId: trip.branch_id,
  busId: trip.bus_id,
  routeId: trip.route_id,
  direction: trip.direction,
  status: trip.status,
  tripDate: trip.trip_date,
  startedAt: trip.started_at,
  endedAt: trip.ended_at,
  startedByUserId: trip.started_by_user_id,
  createdAt: trip.created_at,
});

// GET /trips
export const getTrips = async () => {
  const data = await apiCall("/trips");
  return data.map(toUiTrip);
};

// GET /trips/{trip_id}
export const getTrip = async (id) => {
  const data = await apiCall(`/trips/${id}`);
  return toUiTrip(data);
};
