import { useState, useEffect } from "react";

export function useDebouncedLoading(loading, delay = 250) {
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    if (!loading) {
      setShowLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      setShowLoading(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [loading, delay]);

  return showLoading;
}
