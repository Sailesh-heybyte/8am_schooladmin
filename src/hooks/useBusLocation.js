import { useEffect, useState } from "react";
import { getBusLocationStream } from "../api/tracking.js";

const NO_TRIP_RECHECK_MS = 30000;
const SILENCE_LIMIT_MS = 45000;
const RETRY_STEPS_MS = [3000, 6000, 12000, 30000];

export function useBusLocation(busId) {
  const [live, setLive] = useState({ status: "connecting", location: null, error: "" });

  useEffect(() => {
    let isStopped = false;
    let connection = null;
    let retryTimer = null;
    let silenceTimer = null;

    const update = (changes) => setLive((current) => ({ ...current, ...changes }));

    const resetSilenceTimer = () => {
      clearTimeout(silenceTimer);
      silenceTimer = setTimeout(() => connection.abort(), SILENCE_LIMIT_MS);
    };

    const follow = async (failures) => {
      connection = new AbortController();
      let gotLocation = false;
      let tripOver = false;

      resetSilenceTimer();

      try {
        await getBusLocationStream(busId, {
          signal: connection.signal,
          onOpen: () => {
            resetSilenceTimer();
            if (!gotLocation) update({ status: "waiting", error: "" });
          },
          onAlive: resetSilenceTimer,
          onLocation: (location) => {
            gotLocation = true;
            update({ status: "live", location, error: "" });
          },
          onNoTrip: () => {
            tripOver = true;
            update({ status: "no_trip", error: "" });
          },
        });
      } catch (err) {
        if (!isStopped && (err.status === 403 || err.status === 404)) {
          clearTimeout(silenceTimer);
          update({ status: "error", error: err.message });
          return;
        }
      }

      clearTimeout(silenceTimer);
      if (isStopped) return;

      if (tripOver) {
        retryTimer = setTimeout(() => follow(0), NO_TRIP_RECHECK_MS);
        return;
      }

      const attempt = gotLocation ? 0 : failures;
      const waitMs = RETRY_STEPS_MS[Math.min(attempt, RETRY_STEPS_MS.length - 1)];
      update({ status: "reconnecting" });
      retryTimer = setTimeout(() => follow(attempt + 1), waitMs);
    };

    follow(0);

    return () => {
      isStopped = true;
      clearTimeout(retryTimer);
      clearTimeout(silenceTimer);
      connection.abort();
    };
  }, [busId]);

  return live;
}
