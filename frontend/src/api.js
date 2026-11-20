
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
    let responseMessage = "";
    const responseBody = await response.text();

    if (responseBody) {
      try {
        const errorBody = JSON.parse(responseBody);
        responseMessage =
          errorBody.detail ||
          errorBody.message ||
          errorBody.error ||
          "";
      } catch {
        responseMessage = responseBody;
      }
    }
    const requestPath = new URL(response.url).pathname;

    if (response.status === 401) {
      throw new Error(
        responseMessage || "Session expired or unauthorized. Log in again."
      );
    }

    if (response.status === 403) {
      throw new Error(
        responseMessage || "You don't have permission to do that."
      );
    }

    throw new Error(
      responseMessage
        ? `${responseMessage} (HTTP ${response.status}, ${requestPath})`
        : `Request failed: HTTP ${response.status} (${requestPath})`
    );
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}
