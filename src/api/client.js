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

function endSession() {
  localStorage.removeItem("school_access_token");
  localStorage.removeItem("school_refresh_token");
  window.location.reload();
}

async function send(url, init) {
  try {
    return await fetch(url, init);
  } catch (err) {
    throw new Error(
      "Can't reach the server. Check your connection and try again.",
      { cause: err },
    );
  }
}

async function refreshAfter401() {
  const refreshTokenBefore = localStorage.getItem("school_refresh_token");
  try {
    await doRefresh();
  } catch (err) {
    const otherTabRefreshed =
      localStorage.getItem("school_refresh_token") !== refreshTokenBefore;
    if (!otherTabRefreshed) {
      if (err.status >= 400 && err.status < 500) {
        endSession();
        throw new Error("Session expired", { cause: err });
      }
      throw err;
    }
  }
}

export async function apiCall(path, options = {}) {
  let response = await send(`${BASE_URL}${path}`, buildRequest(options));

  if (response.status === 401 && !options.skipAuth && !options.isRetry) {
    await refreshAfter401();

    response = await send(
      `${BASE_URL}${path}`,
      buildRequest({ ...options, isRetry: true }),
    );

    if (response.status === 401) {
      endSession();
      throw new Error("Session expired");
    }
  }

  if (!response.ok) {
    const body = await response.clone().json().catch(() => null);
    const errorMessage = await parseErrorMessage(response);
    console.error("API error", response.status, errorMessage);
    const error = new Error(errorMessage);
    error.status = response.status;
    error.detail = body ? body.detail : null;
    throw error;
  }

  return response.json();
}

function readTokenPayload() {
  const token = localStorage.getItem("school_access_token");
  const payload = token.split(".")[1];
  const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "=",
  );
  return JSON.parse(atob(padded));
}

export function getTokenPermissions() {
  if (!localStorage.getItem("school_access_token")) return [];
  return readTokenPayload().permissions;
}

export function getTokenExpiresAtMs() {
  return readTokenPayload().exp * 1000;
}

export async function refreshSession() {
  return doRefresh();
}

function buildStreamRequest(signal) {
  return {
    headers: {
      Accept: "text/event-stream",
      Authorization: `Bearer ${localStorage.getItem("school_access_token")}`,
    },
    signal,
  };
}

export async function apiStream(path, { signal, onOpen, onAlive, onMessage }) {
  let response = await send(`${BASE_URL}${path}`, buildStreamRequest(signal));

  if (response.status === 401) {
    await refreshAfter401();
    response = await send(`${BASE_URL}${path}`, buildStreamRequest(signal));
    if (response.status === 401) {
      endSession();
      throw new Error("Session expired");
    }
  }

  if (!response.ok) {
    const error = new Error(await parseErrorMessage(response));
    error.status = response.status;
    throw error;
  }

  onOpen();

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let leftover = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) return;
    onAlive();

    const text = leftover + value.replace(/\r\n/g, "\n");
    const events = text.split("\n\n");
    leftover = events.pop();

    events.forEach((event) => {
      const dataLine = event.split("\n").find((line) => line.startsWith("data:"));
      if (dataLine) onMessage(JSON.parse(dataLine.slice(5)));
    });
  }
}
