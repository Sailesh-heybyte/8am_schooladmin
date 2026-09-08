import { apiCall } from "./client.js";

const ACCESS_TOKEN_KEY = "school_access_token";
const REFRESH_TOKEN_KEY = "school_refresh_token";

export async function login(identifier, password) {
  const data = await apiCall("/iam/login", {
    method: "POST",
    skipAuth: true,
    body: { identifier, password },
  });

  if (data?.access_token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
  }
  if (data?.refresh_token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
  }

  return data;
}

export async function refreshAccessToken() {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  const data = await apiCall("/iam/refresh", {
    method: "POST",
    skipAuth: true,
    body: { refresh_token: refreshToken },
  });

  if (data?.access_token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
  }
  if (data?.refresh_token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
  }

  return data;
}

export async function logout() {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  try {
    if (refreshToken) {
      await apiCall("/iam/logout", {
        method: "POST",
        skipAuth: true,
        body: { refresh_token: refreshToken },
      });
    }
  } catch (error) {
    console.error("Logout request failed:", error);
  } finally {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

export async function getMe() {
  return apiCall("/iam/me");
}

export async function changePassword(currentPassword, newPassword) {
  return apiCall("/iam/change-password", {
    method: "POST",
    body: {
      current_password: currentPassword,
      new_password: newPassword,
    },
  });
}
