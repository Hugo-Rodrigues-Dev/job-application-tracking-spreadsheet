import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supportedLanguages, translations } from './translations';

const LanguageContext = createContext(null);
const STORAGE_KEY = 'job-tracker-language';
const DEFAULT_LANGUAGE = 'fr';

const resolveInitialLanguage = () => {
  if (typeof window === 'undefined') {
    return DEFAULT_LANGUAGE;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && supportedLanguages.includes(stored)) {
    return stored;
  }

  const navigatorLanguage = window.navigator?.language?.slice(0, 2).toLowerCase();
  if (navigatorLanguage && supportedLanguages.includes(navigatorLanguage)) {
    return navigatorLanguage;
  }

  return DEFAULT_LANGUAGE;
};

const getNestedValue = (source, path) => {
  return path.split('.').reduce((acc, segment) => {
    if (acc && typeof acc === 'object' && segment in acc) {
      return acc[segment];
    }
    return undefined;
  }, source);
};

const formatTemplate = (template, params = {}) => {
  if (typeof template !== 'string') return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    if (params[key] === undefined || params[key] === null) return `{${key}}`;
    return String(params[key]);
  });
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(resolveInitialLanguage);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  const setLanguageSafe = useCallback((nextLanguage) => {
    if (!supportedLanguages.includes(nextLanguage)) return;
    setLanguage(nextLanguage);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage((prev) => (prev === 'fr' ? 'en' : 'fr'));
  }, []);

  const translate = useCallback(
    (key, params) => {
      const dictionary = translations[language] || translations[DEFAULT_LANGUAGE];
      const value = getNestedValue(dictionary, key);

      if (value !== undefined) {
        return formatTemplate(value, params);
      }

      if (language !== DEFAULT_LANGUAGE) {
        const fallbackValue = getNestedValue(translations[DEFAULT_LANGUAGE], key);
        if (fallbackValue !== undefined) {
          return formatTemplate(fallbackValue, params);
        }
      }

      return key;
    },
    [language],
  );

  const translateFromGroup = useCallback(
    (group, item, params) => {
      const groupDictionary = translations[language]?.[group];
      const defaultDictionary = translations[DEFAULT_LANGUAGE]?.[group];

      if (groupDictionary && item in groupDictionary) {
        return formatTemplate(groupDictionary[item], params);
      }
      if (defaultDictionary && item in defaultDictionary) {
        return formatTemplate(defaultDictionary[item], params);
      }
      return item;
    },
    [language],
  );

  const contextValue = useMemo(() => {
    const dictionary = translations[language] || translations[DEFAULT_LANGUAGE];

    return {
      language,
      languageName: dictionary.languageName,
      availableLanguages: supportedLanguages,
      setLanguage: setLanguageSafe,
      toggleLanguage,
      t: translate,
      translateStatus: (status) => translateFromGroup('statuses', status),
      translateType: (type) => translateFromGroup('types', type),
    };
  }, [language, setLanguageSafe, toggleLanguage, translate, translateFromGroup]);

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
