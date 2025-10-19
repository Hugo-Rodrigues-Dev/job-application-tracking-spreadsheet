import { apiClient } from './apiClient';

const AUTH_LOGIN_ROUTE = '/api/auth/login';
const AUTH_LOGOUT_ROUTE = '/api/auth/logout';
const AUTH_SESSION_ROUTE = '/api/auth/me';

export const authClient = {
  /**
   * Attempts to authenticate the user. Relies on httpOnly cookies set by the server,
   * so no tokens are ever stored in localStorage or other insecure locations.
   */
  async login(credentials) {
    return apiClient.post(AUTH_LOGIN_ROUTE, credentials);
  },

  /**
   * Ends the current user session. The server is responsible for expiring the cookie.
   */
  async logout() {
    return apiClient.post(AUTH_LOGOUT_ROUTE);
  },

  /**
   * Retrieves the current authenticated session (if any).
   */
  async fetchSession() {
    return apiClient.get(AUTH_SESSION_ROUTE);
  },
};

export default authClient;
