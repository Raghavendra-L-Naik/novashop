
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
      throw new Error(
        "Unauthorized. Please log in again."
      );
    }

    if (response.status === 409) {
      throw new Error(
        "Conflict: account already exists or stock changed."
      );
    }

    throw new Error(
      `Request failed with status ${response.status}`
    );
  }

  return response.json();
}
