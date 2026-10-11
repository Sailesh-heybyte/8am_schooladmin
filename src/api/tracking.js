import { EventSource } from "eventsource";
import { endSession, refreshAfter401 } from "./client.js";

const BASE_URL = import.meta.env.VITE_API_URL;

const toUiLocation = (location) => ({
  latitude: location.latitude,
  longitude: location.longitude,
  timestampIso: location.timestamp,
  speed: location.speed,
  heading: location.heading,
});

// The browser's EventSource can't send headers, so we give the library our own fetch.
// It adds the latest token on every (re)connect, and on 401 refreshes it and tries once more.
const authFetch = async (url, init) => {
  const send = () =>
    fetch(url, {
      ...init,
      headers: {
        ...init.headers,
        Authorization: `Bearer ${localStorage.getItem("school_access_token")}`,
      },
    });

  let response = await send();
  if (response.status === 401) {
    await refreshAfter401();
    response = await send();
    if (response.status === 401) endSession();
  }
  return response;
};

export const openBusLocationStream = (busId, { onOpen, onLocation, onNoTrip, onError }) => {
  const stream = new EventSource(`${BASE_URL}/tracking/buses/${busId}/school-events`, {
    fetch: authFetch,
  });

  stream.addEventListener("open", onOpen);

  stream.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.type === "location") onLocation(toUiLocation(message.data));
    if (message.type === "no_active_trip") onNoTrip();
  });

  stream.addEventListener("error", (err) => {
    const gaveUp = stream.readyState === EventSource.CLOSED;
    onError({ gaveUp, message: err.message });
  });

  return stream;
};