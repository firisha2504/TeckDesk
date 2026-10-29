const API_URL = import.meta.env.VITE_API_URL || '/api';

export async function apiClient(endpoint, { body, ...customConfig } = {}) {
  const token = localStorage.getItem('techdesk_token');

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...customConfig.headers,
  };

  const config = {
    method: body ? 'POST' : 'GET',
    credentials: 'include', // Send HTTP-only cookie automatically
    ...customConfig,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const url = `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  let response;
  try {
    response = await fetch(url, config);
  } catch (netErr) {
    throw new Error('Network error: Unable to connect to TechDesk server.');
  }

  // Handle file blob downloads (e.g. CSV exports)
  const contentType = response.headers.get('content-type');
  if (contentType && (contentType.includes('text/csv') || contentType.includes('application/octet-stream'))) {
    if (!response.ok) {
      throw new Error('Failed to export file');
    }
    return response.blob();
  }

  let data;
  try {
    data = await response.json();
  } catch (err) {
    data = null;
  }

  if (response.ok) {
    return data?.data !== undefined ? data.data : data;
  } else {
    // Evict stale/invalid credentials from local storage on 401
    if (response.status === 401) {
      localStorage.removeItem('techdesk_token');
    }
    const errorMessage =
      data?.message ||
      (data?.errors && data.errors[0]?.message) ||
      response.statusText ||
      'An unexpected error occurred';
    const error = new Error(errorMessage);
    error.statusCode = response.status;
    error.errors = data?.errors || [];
    throw error;
  }
}

export const api = {
  get: (endpoint, config) => apiClient(endpoint, { ...config, method: 'GET' }),
  post: (endpoint, body, config) => apiClient(endpoint, { ...config, method: 'POST', body }),
  patch: (endpoint, body, config) => apiClient(endpoint, { ...config, method: 'PATCH', body }),
  put: (endpoint, body, config) => apiClient(endpoint, { ...config, method: 'PUT', body }),
  delete: (endpoint, config) => apiClient(endpoint, { ...config, method: 'DELETE' }),
  upload: async (endpoint, formData) => {
    const token = localStorage.getItem('techdesk_token');
    const url = `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || 'Upload failed');
    }
    return data?.data || data;
  },
};
