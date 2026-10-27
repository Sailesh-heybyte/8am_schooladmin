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

const createAuthFetch = (onAlive) => async (url, init) => {
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
  if (!response.ok) return response;

  const watchBytes = new TransformStream({
    transform(chunk, controller) {
      onAlive();
      controller.enqueue(chunk);
    },
  });
  return new Response(response.body.pipeThrough(watchBytes), {
    status: response.status,
    headers: response.headers,
  });
};

export const openBusLocationStream = (
  busId,
  { onOpen, onAlive, onLocation, onNoTrip, onError },
) => {
  const stream = new EventSource(`${BASE_URL}/tracking/buses/${busId}/school-events`, {
    fetch: createAuthFetch(onAlive),
  });
  stream.addEventListener("open", onOpen);
  stream.addEventListener("location", (event) => {
    onLocation(toUiLocation(JSON.parse(event.data).data));
  });
  stream.addEventListener("no_active_trip", onNoTrip);
  stream.addEventListener("error", (event) => onError(event.code));
  return stream;
};