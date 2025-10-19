import { localStorageDataSource } from './sources/localStorageDataSource';
import { apiDataSource } from './sources/apiDataSource';

const dataSources = {
  local: localStorageDataSource,
  api: apiDataSource,
};

let activeDataSource = localStorageDataSource;

const generateLocalId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const configureDataSource = (type) => {
  const key = typeof type === 'string' ? type.trim().toLowerCase() : '';
  if (key && dataSources[key]) {
    activeDataSource = dataSources[key];
  } else {
    activeDataSource = localStorageDataSource;
    if (key && !dataSources[key]) {
      console.warn(`Unknown data source "${type}", falling back to localStorage`);
    }
  }
};

export const getActiveDataSourceType = () => activeDataSource.type;

const ensureApplicationId = (application) => {
  if (application?.id) return application;
  if (activeDataSource.type === 'local') {
    return { ...application, id: generateLocalId() };
  }
  return application;
};

export const listApplications = async () => {
  const applications = await activeDataSource.listApplications();
  return Array.isArray(applications) ? applications : [];
};

export const getApplication = async (id) => {
  return activeDataSource.getApplication(id);
};

export const createApplication = async (application) => {
  const payload = ensureApplicationId(application);
  return activeDataSource.createApplication(payload);
};

export const updateApplication = async (id, updates) => {
  if (!id) throw new Error('Missing application id for update');
  const result = await activeDataSource.updateApplication(id, updates);

  if (result || activeDataSource.type !== 'local') return result;

  // Local fallback in case update failed because record was missing.
  const applications = await listApplications();
  const index = applications.findIndex((application) => String(application.id) === String(id));
  if (index === -1) return null;

  const updated = { ...applications[index], ...updates };
  applications[index] = updated;
  await activeDataSource.replaceApplications(applications);
  return updated;
};

export const deleteApplication = async (id) => {
  if (!id) throw new Error('Missing application id for deletion');
  return activeDataSource.deleteApplication(id);
};

export const replaceApplications = async (applications) => {
  const payload = Array.isArray(applications) ? applications : [];
  return activeDataSource.replaceApplications(payload);
};

export const listCompanyCategories = async () => {
  const categories = await activeDataSource.listCompanyCategories();
  return Array.isArray(categories) ? categories : [];
};

export const saveCompanyCategories = async (categories) => {
  const sanitized = Array.isArray(categories) ? categories : [];
  return activeDataSource.saveCompanyCategories(sanitized);
};
