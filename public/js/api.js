// Tiny API client + auth-token storage shared by every page.

const TOKEN_KEY = 'sm_token';
const USER_KEY = 'sm_user';

const Auth = {
  get token() {
    return localStorage.getItem(TOKEN_KEY);
  },
  get user() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY));
    } catch {
      return null;
    }
  },
  set(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  update(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  get isAuthed() {
    return Boolean(this.token);
  },
};

// Core request helper. Adds JSON + Bearer headers, parses JSON, and on 401
// clears the session and bounces to the login page (per spec).
async function api(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && Auth.token) headers.Authorization = `Bearer ${Auth.token}`;

  let res;
  try {
    res = await fetch('/api' + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Network error — is the server running?');
  }

  if (res.status === 401) {
    Auth.clear();
    const onAuthPage = /\/(login|register)\.html$/.test(location.pathname);
    if (!onAuthPage) location.href = '/login.html';
    throw new Error('Unauthorized');
  }

  let data = null;
  if (res.status !== 204) {
    data = await res.json().catch(() => null);
  }
  if (!res.ok) {
    throw new Error((data && data.error) || `Request failed (${res.status})`);
  }
  return data;
}

// Convenience verbs.
const API = {
  get: (p, opts) => api(p, { ...opts, method: 'GET' }),
  post: (p, body, opts) => api(p, { ...opts, method: 'POST', body }),
  put: (p, body, opts) => api(p, { ...opts, method: 'PUT', body }),
  del: (p, opts) => api(p, { ...opts, method: 'DELETE' }),
};
