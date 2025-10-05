const APPLICATIONS_STORAGE_KEY = 'job-tracker/applications';
const COMPANIES_STORAGE_KEY = 'job-tracker/company-categories';

const isBrowser = () => typeof window !== 'undefined' && !!window.localStorage;

export const loadApplications = () => {
  if (!isBrowser()) return null;

  try {
    const stored = window.localStorage.getItem(APPLICATIONS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.warn('Unable to load applications from localStorage:', error);
    return null;
  }
};

export const saveApplications = (applications) => {
  if (!isBrowser()) return;

  try {
    window.localStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(applications));
  } catch (error) {
    console.warn('Unable to save applications to localStorage:', error);
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

export const loadCompanyCategories = () => {
  if (!isBrowser()) return null;

  try {
    const stored = window.localStorage.getItem(COMPANIES_STORAGE_KEY);
    return stored ? sanitizeCategories(JSON.parse(stored)) : null;
  } catch (error) {
    console.warn('Unable to load companies from localStorage:', error);
    return null;
  }
};

export const saveCompanyCategories = (categories) => {
  if (!isBrowser()) return;

  try {
    window.localStorage.setItem(
      COMPANIES_STORAGE_KEY,
      JSON.stringify(sanitizeCategories(categories)),
    );
  } catch (error) {
    console.warn('Unable to save companies to localStorage:', error);
  }
};
