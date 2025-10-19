const APPLICATIONS_STORAGE_KEY = 'job-tracker/applications';
const COMPANIES_STORAGE_KEY = 'job-tracker/company-categories';

const isBrowser = () => typeof window !== 'undefined' && !!window.localStorage;

const safeParse = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn('Failed to parse localStorage payload', error);
    return fallback;
  }
};

const readArrayFromStorage = (key) => {
  if (!isBrowser()) return [];

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = safeParse(raw, []);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn(`Unable to read ${key} from localStorage`, error);
    return [];
  }
};

const writeToStorage = (key, value) => {
  if (!isBrowser()) return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Unable to write ${key} to localStorage`, error);
  }
};

const sanitizeCategories = (categories) =>
  Array.isArray(categories)
    ? categories
        .filter((category) => category && typeof category === 'object')
        .map((category) => ({
          id: String(category.id ?? ''),
          labelKey: category.labelKey ? String(category.labelKey) : undefined,
          customName: category.customName ? String(category.customName) : undefined,
          companies: Array.isArray(category.companies)
            ? category.companies
                .filter((company) => company && typeof company === 'object')
                .map((company) => ({
                  id: String(company.id ?? ''),
                  name: String(company.name ?? ''),
                  website: company.website ? String(company.website) : '',
                  notes: company.notes ? String(company.notes) : '',
                }))
            : [],
        }))
    : [];

export const localStorageDataSource = {
  type: 'local',

  async listApplications() {
    return readArrayFromStorage(APPLICATIONS_STORAGE_KEY);
  },

  async getApplication(id) {
    const applications = await this.listApplications();
    return applications.find((application) => String(application.id) === String(id)) ?? null;
  },

  async createApplication(application) {
    const applications = await this.listApplications();
    const record = { ...application };
    applications.push(record);
    writeToStorage(APPLICATIONS_STORAGE_KEY, applications);
    return record;
  },

  async updateApplication(id, updates) {
    const applications = await this.listApplications();
    const index = applications.findIndex((application) => String(application.id) === String(id));
    if (index === -1) {
      return null;
    }

    const updated = { ...applications[index], ...updates };
    applications[index] = updated;
    writeToStorage(APPLICATIONS_STORAGE_KEY, applications);
    return updated;
  },

  async deleteApplication(id) {
    const applications = await this.listApplications();
    const next = applications.filter((application) => String(application.id) !== String(id));
    writeToStorage(APPLICATIONS_STORAGE_KEY, next);
    return next;
  },

  async replaceApplications(applications) {
    const next = Array.isArray(applications) ? [...applications] : [];
    writeToStorage(APPLICATIONS_STORAGE_KEY, next);
    return next;
  },

  async listCompanyCategories() {
    const stored = readArrayFromStorage(COMPANIES_STORAGE_KEY);
    return sanitizeCategories(stored);
  },

  async saveCompanyCategories(categories) {
    const sanitized = sanitizeCategories(categories);
    writeToStorage(COMPANIES_STORAGE_KEY, sanitized);
    return sanitized;
  },
};
