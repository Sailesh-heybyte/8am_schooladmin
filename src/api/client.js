const BASE_URL = import.meta.env.VITE_API_URL;

let refreshPromise = null;

async function doRefresh() {
  if (!refreshPromise) {
    const { refreshAccessToken } = await import("./auth.js");
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

function buildRequest(options) {
  const token = localStorage.getItem("school_access_token");

  return {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token && !options.skipAuth
        ? { Authorization: `Bearer ${token}` }
        : {}),
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  };
}

async function parseErrorMessage(response) {
  const fallback = `Request failed: ${response.status}`;

  try {
    const data = await response.json();
    if (!data) return fallback;

    if (typeof data.message === "string" && data.message.trim()) {
      return data.message.trim();
    }
    if (typeof data.detail === "string" && data.detail.trim()) {
      return data.detail.trim();
    }
    if (typeof data.error === "string" && data.error.trim()) {
      return data.error.trim();
    }

    if (Array.isArray(data.detail) && data.detail.length > 0) {
      const messages = data.detail
        .map((err) => {
          if (typeof err === "string") return err;
          const loc = Array.isArray(err.loc)
            ? err.loc.filter((l) => l !== "body").join(".")
            : "";
          const msg = err.msg || err.message || "";
          return loc ? `${loc}: ${msg}` : msg;
        })
        .filter(Boolean);
      if (messages.length > 0) return messages.join("; ");
    }

    if (Array.isArray(data.errors) && data.errors.length > 0) {
      const messages = data.errors
        .map((err) => (typeof err === "string" ? err : err.msg || err.message))
        .filter(Boolean);
      if (messages.length > 0) return messages.join("; ");
    }

    if (
      data.errors &&
      typeof data.errors === "object" &&
      !Array.isArray(data.errors)
    ) {
      const messages = Object.entries(data.errors)
        .map(([field, errs]) => {
          const fieldMsgs = Array.isArray(errs) ? errs.join(", ") : String(errs);
          return `${field}: ${fieldMsgs}`;
        })
        .filter(Boolean);
      if (messages.length > 0) return messages.join("; ");
    }
  } catch {
    // Non-JSON response or parse failure, fallback used
  }

  return fallback;
}

export async function apiCall(path, options = {}) {
  let response = await fetch(`${BASE_URL}${path}`, buildRequest(options));

  if (response.status === 401 && !options.skipAuth && !options.isRetry) {
    try {
      await doRefresh();
    } catch {
      localStorage.removeItem("school_access_token");
      localStorage.removeItem("school_refresh_token");
      window.location.reload();
      throw new Error("Session expired");
    }

    response = await fetch(
      `${BASE_URL}${path}`,
      buildRequest({ ...options, isRetry: true }),
    );
  }

  if (!response.ok) {
    const errorMessage = await parseErrorMessage(response);
    console.error("API error", response.status, errorMessage);
    throw new Error(errorMessage);
  }

  return response.json();
}
