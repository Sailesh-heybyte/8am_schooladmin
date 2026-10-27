import { useEffect, useState } from "react";
import { openBusLocationStream } from "../api/tracking.js";

const NO_TRIP_RECHECK_MS = 30000;
const SILENCE_LIMIT_MS = 45000;
const RETRY_STEPS_MS = [3000, 6000, 12000, 30000];

const STOP_MESSAGES = {
  403: "You don't have permission to track this bus.",
  404: "This bus isn't in your school or branch.",
};

export function useBusLocation(busId) {
  const [live, setLive] = useState({ status: "connecting", location: null, error: "" });

  useEffect(() => {
    let stream = null;
    let retryTimer = null;
    let silenceTimer = null;
    let failures = 0;
    let isStopped = false;

    const update = (changes) => setLive((current) => ({ ...current, ...changes }));

    const closeStream = () => {
      clearTimeout(silenceTimer);
      if (stream) stream.close();
    };

    const retryLater = () => {
      closeStream();
      if (isStopped) return;
      const waitMs = RETRY_STEPS_MS[Math.min(failures, RETRY_STEPS_MS.length - 1)];
      failures += 1;
      update({ status: "reconnecting" });
      retryTimer = setTimeout(connect, waitMs);
    };

    const resetSilenceTimer = () => {
      clearTimeout(silenceTimer);
      silenceTimer = setTimeout(retryLater, SILENCE_LIMIT_MS);
    };

    const connect = () => {
      resetSilenceTimer();
      stream = openBusLocationStream(busId, {
        onOpen: () =>
          setLive((current) =>
            current.status === "no_trip" ? current : { ...current, status: "waiting", error: "" },
          ),
        onAlive: resetSilenceTimer,
        onLocation: (location) => {
          failures = 0;
          update({ status: "live", location, error: "" });
        },
        onNoTrip: () => {
          closeStream();
          failures = 0;
          update({ status: "no_trip", error: "" });
          retryTimer = setTimeout(connect, NO_TRIP_RECHECK_MS);
        },
        onError: (code) => {
          if (STOP_MESSAGES[code]) {
            closeStream();
            update({ status: "error", error: STOP_MESSAGES[code] });
            return;
          }
          retryLater();
        },
      });
    };

    connect();

    return () => {
      isStopped = true;
      clearTimeout(retryTimer);
      closeStream();
    };
  }, [busId]);

  return live;
}