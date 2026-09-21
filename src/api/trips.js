import { apiCall } from "./client.js";
import { formatDate } from "../utils/helpers.js";

export { formatDate };

const toUiTrip = (trip) => ({
  id: trip.id,
  schoolId: trip.school_id,
  branchId: trip.branch_id,
  branchName: trip.branch_name,
  busId: trip.bus_id,
  registrationNumber: trip.registration_number,
  routeId: trip.route_id,
  routeName: trip.route_name,
  driverName: trip.driver_name,
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
