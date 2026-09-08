import { apiCall } from "./client.js";

export async function login(identifier, password) {
  const data = await apiCall("/iam/login", {
    method: "POST",
    body: { identifier, password },
    skipAuth: true,
  });

  localStorage.setItem("school_access_token", data.access_token);
  localStorage.setItem("school_refresh_token", data.refresh_token);
  return data;
}

export async function refreshAccessToken() {
  const refresh_token = localStorage.getItem("school_refresh_token");

  if (!refresh_token) {
    throw new Error("No refresh token");
  }

  const data = await apiCall("/iam/refresh", {
    method: "POST",
    body: { refresh_token },
    skipAuth: true,
  });

  localStorage.setItem("school_access_token", data.access_token);

  if (data.refresh_token) {
    localStorage.setItem("school_refresh_token", data.refresh_token);
  }

  return data.access_token;
}

export async function logout() {
  const refresh_token = localStorage.getItem("school_refresh_token");

  try {
    if (refresh_token) {
      await apiCall("/iam/logout", {
        method: "POST",
        body: { refresh_token },
      });
    }
  } catch (err) {
    console.error("Logout request failed", err);
  }

  localStorage.removeItem("school_access_token");
  localStorage.removeItem("school_refresh_token");
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