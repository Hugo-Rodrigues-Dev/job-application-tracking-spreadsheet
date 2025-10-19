const DEFAULT_TIMEOUT_MS = 10000;

const buildUrl = (baseURL, path, params) => {
  const url = new URL(path, baseURL || window.location.origin);
  if (params && typeof params === 'object') {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      url.searchParams.append(key, String(value));
    });
  }
  return url.toString();
};

const parseResponseBody = async (response) => {
  const contentType = response.headers.get('content-type');

  if (contentType && contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch (error) {
      console.warn('Unable to parse JSON response', error);
      return null;
    }
  }

  // Attempt to read plain text for non-JSON payloads.
  try {
    return await response.text();
  } catch (error) {
    console.warn('Unable to parse text response', error);
    return null;
  }
};

const handleUnauthorized = () => {
  if (typeof window === 'undefined') return;
  if (window.location.pathname === '/login') return;
  window.location.assign('/login');
};

const request = async (method, path, options = {}) => {
  const {
    baseURL = import.meta?.env?.VITE_API_URL || '',
    data,
    headers = {},
    params,
    timeout = DEFAULT_TIMEOUT_MS,
    withCredentials = true,
  } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, timeout);

  const url = buildUrl(baseURL, path, params);

  const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
  const effectiveHeaders = new Headers(headers);
  if (data && !isFormData && !effectiveHeaders.has('Content-Type')) {
    effectiveHeaders.set('Content-Type', 'application/json');
  }

  try {
    const response = await fetch(url, {
      method,
      headers: effectiveHeaders,
      credentials: withCredentials ? 'include' : 'same-origin',
      body: data
        ? isFormData
          ? data
          : JSON.stringify(data)
        : undefined,
      signal: controller.signal,
    });

    clearTimeout(timer);

    const payload = await parseResponseBody(response);

    if (!response.ok) {
      if (response.status === 401) {
        handleUnauthorized();
      }

      const error = new Error('API request failed');
      error.response = {
        status: response.status,
        data: payload,
      };
      throw error;
    }

    return { data: payload, status: response.status };
  } catch (error) {
    clearTimeout(timer);
    if (error.name === 'AbortError') {
      const timeoutError = new Error(`API request timed out after ${timeout}ms`);
      timeoutError.cause = error;
      throw timeoutError;
    }
    throw error;
  }
};

export const apiClient = {
  request,
  get: (path, options) => request('GET', path, options),
  post: (path, data, options) => request('POST', path, { ...options, data }),
  put: (path, data, options) => request('PUT', path, { ...options, data }),
  patch: (path, data, options) => request('PATCH', path, { ...options, data }),
  delete: (path, options) => request('DELETE', path, options),
};

export default apiClient;
