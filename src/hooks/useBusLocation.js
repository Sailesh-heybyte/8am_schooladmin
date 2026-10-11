import { useEffect, useState } from "react";
import { openBusLocationStream } from "../api/tracking.js";

export function useBusLocation(busId) {
  const [live, setLive] = useState({ status: "connecting", location: null, error: "" });

  useEffect(() => {
    const update = (changes) => setLive((current) => ({ ...current, ...changes }));

    const stream = openBusLocationStream(busId, {
      onOpen: () => update({ status: "waiting", error: "" }),
      onLocation: (location) => update({ status: "live", location, error: "" }),
      onNoTrip: () => update({ status: "no_trip", error: "" }),
      onError: ({ gaveUp, message }) => {
        // gaveUp = server answered with an error (403, 404, 500...) → library stops for good
        // otherwise the connection just dropped → library reconnects by itself
        if (gaveUp) update({ status: "error", error: message || "Live tracking is unavailable." });
        else update({ status: "reconnecting" });
      },
    });

    return () => stream.close();
  }, [busId]);

  return live;
}