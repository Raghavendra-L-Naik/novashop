
const API_URL = "http://localhost:8080";

export async function apiRequest(path, options = {}) {
  const token = sessionStorage.getItem("novashop-token");

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? {
        Authorization: `Bearer ${token}`
      } : {}),
      ...options.headers
    }
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Session expired or unauthorized. Log in again.");
    }

    if (response.status === 403) {
      throw new Error("You don't have permission to do that.");
    }

    throw new Error(`Request failed: HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}
