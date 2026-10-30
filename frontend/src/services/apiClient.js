import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Centralized Axios client instance configured for TechDesk.
 * Supports HTTP-only cookies, Bearer tokens from localStorage, and interceptors.
 */
export const axiosClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor: attach bearer token if present in storage
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('techdesk_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: extract response data & evict stale credentials on 401
axiosClient.interceptors.response.use(
  (response) => {
    const data = response.data;
    return data?.data !== undefined ? data.data : data;
  },
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('techdesk_token');
    }

    let resData = error.response?.data;

    // Handle Blob error response (e.g., when responseType: 'blob' was set on the request)
    if (resData instanceof Blob) {
      try {
        const text = await resData.text();
        resData = JSON.parse(text);
      } catch {
        // text is not JSON, leave resData as is
      }
    }

    const errorMessage =
      resData?.message ||
      (resData?.errors && resData.errors[0]?.message) ||
      error.message ||
      'An unexpected error occurred';

    const customErr = new Error(errorMessage);
    customErr.statusCode = error.response?.status;
    customErr.errors = resData?.errors || [];
    return Promise.reject(customErr);
  }
);

/**
 * Universal API client function preserving backward compatibility.
 */
export async function apiClient(endpoint, { body, method = 'GET', headers = {}, ...customConfig } = {}) {
  const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  try {
    const response = await axiosClient.request({
      url,
      method: body ? (method === 'GET' ? 'POST' : method) : method,
      data: body,
      headers,
      ...customConfig,
    });
    return response;
  } catch (error) {
    throw error;
  }
}

/**
 * Convenience HTTP method wrappers.
 */
export const api = {
  get: (endpoint, config = {}) => apiClient(endpoint, { ...config, method: 'GET' }),
  post: (endpoint, body, config = {}) => apiClient(endpoint, { ...config, method: 'POST', body }),
  patch: (endpoint, body, config = {}) => apiClient(endpoint, { ...config, method: 'PATCH', body }),
  put: (endpoint, body, config = {}) => apiClient(endpoint, { ...config, method: 'PUT', body }),
  delete: (endpoint, config = {}) => apiClient(endpoint, { ...config, method: 'DELETE' }),

  upload: async (endpoint, formData) => {
    const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    try {
      const response = await axiosClient.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  downloadBlob: async (endpoint, config = {}) => {
    const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    try {
      const response = await axiosClient.get(url, {
        responseType: 'blob',
        headers: {
          Accept: 'text/csv, application/json, */*',
          ...config.headers,
        },
        ...config,
      });
      return response;
    } catch (error) {
      throw error;
    }
  },
};
