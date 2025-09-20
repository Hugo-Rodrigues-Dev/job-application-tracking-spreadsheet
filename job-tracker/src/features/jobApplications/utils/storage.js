const STORAGE_KEY = 'job-tracker/applications';

const isBrowser = () => typeof window !== 'undefined' && !!window.localStorage;

export const loadApplications = () => {
  if (!isBrowser()) return null;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.warn('Unable to load applications from localStorage:', error);
    return null;
  }
};

export const saveApplications = (applications) => {
  if (!isBrowser()) return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
  } catch (error) {
    console.warn('Unable to save applications to localStorage:', error);
  }
};

