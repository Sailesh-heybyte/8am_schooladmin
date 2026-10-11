import { apiStream } from "./client.js";

const toUiLocation = (location) => ({
  latitude: location.latitude,
  longitude: location.longitude,
  timestampIso: location.timestamp,
  speed: location.speed,
  heading: location.heading,
});

export const getBusLocationStream = (busId, { signal, onOpen, onAlive, onLocation, onNoTrip }) =>
  apiStream(`/tracking/buses/${busId}/school-events`, {
    signal,
    onOpen,
    onAlive,
    onMessage: (message) => {
      if (message.type === "location") onLocation(toUiLocation(message.data));
      if (message.type === "no_active_trip") onNoTrip();
    },
  });
