import { apiClient } from '../../utils/apiClient';

const APPLICATIONS_ROUTE = '/api/applications';
const COMPANY_CATEGORIES_ROUTE = '/api/company-categories';

export const apiDataSource = {
  type: 'api',

  async listApplications() {
    const response = await apiClient.get(APPLICATIONS_ROUTE);
    const data = Array.isArray(response?.data) ? response.data : [];
    return data;
  },

  async getApplication(id) {
    if (!id) return null;
    try {
      const response = await apiClient.get(`${APPLICATIONS_ROUTE}/${id}`);
      return response?.data ?? null;
    } catch (error) {
      if (error?.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  async createApplication(application) {
    const response = await apiClient.post(APPLICATIONS_ROUTE, application);
    return response?.data ?? null;
  },

  async updateApplication(id, updates) {
    if (!id) throw new Error('Missing application id for update');
    const response = await apiClient.put(`${APPLICATIONS_ROUTE}/${id}`, updates);
    return response?.data ?? null;
  },

  async deleteApplication(id) {
    if (!id) throw new Error('Missing application id for deletion');
    await apiClient.delete(`${APPLICATIONS_ROUTE}/${id}`);
    return true;
  },

  async replaceApplications(applications) {
    const response = await apiClient.put(APPLICATIONS_ROUTE, applications);
    const data = Array.isArray(response?.data) ? response.data : [];
    return data;
  },

  async listCompanyCategories() {
    const response = await apiClient.get(COMPANY_CATEGORIES_ROUTE);
    const data = Array.isArray(response?.data) ? response.data : [];
    return data;
  },

  async saveCompanyCategories(categories) {
    const response = await apiClient.put(COMPANY_CATEGORIES_ROUTE, categories);
    const data = Array.isArray(response?.data) ? response.data : [];
    return data;
  },
};
