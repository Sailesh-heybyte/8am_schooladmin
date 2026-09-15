import { apiCall } from "./client.js";
import { formatDate } from "../utils/helpers.js";

export { formatDate };

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

export const getTrips = async () => {
  const data = await apiCall("/trips");
  return data.map(toUiTrip);
};

export const getTrip = async (id) => {
  const data = await apiCall(`/trips/${id}`);
  return toUiTrip(data);
};
