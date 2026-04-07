import Cookies from 'js-cookie';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

async function request<TResponse>(
  url: string,
  config: RequestInit = {}
): Promise<TResponse> {
  const token = Cookies.get('accessToken');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...config.headers,
  };

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...config,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Something went wrong');
  }

  // Handle no content response (e.g., 204 No Content)
  if (response.status === 204) {
    return null as TResponse;
  }

  return response.json();
}

export const api = {
  get: <TResponse>(url: string, config?: RequestInit) =>
    request<TResponse>(url, { method: 'GET', ...config }),

  post: <TResponse, TBody>(url: string, body: TBody, config?: RequestInit) =>
    request<TResponse>(url, { method: 'POST', body: JSON.stringify(body), ...config }),

  put: <TResponse, TBody>(url: string, body: TBody, config?: RequestInit) =>
    request<TResponse>(url, { method: 'PUT', body: JSON.stringify(body), ...config }),

  delete: <TResponse>(url: string, config?: RequestInit) =>
    request<TResponse>(url, { method: 'DELETE', ...config }),
};