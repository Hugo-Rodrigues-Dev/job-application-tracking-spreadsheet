import { useLanguage } from '../i18n/LanguageProvider';

const LanguageToggle = () => {
  const { language, toggleLanguage, t } = useLanguage();
  const isFrench = language === 'fr';

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className="relative inline-flex items-center gap-2 rounded-full border border-blue-200 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 px-3 py-1.5 shadow-inner transition-all duration-300 hover:from-blue-500/20 hover:to-purple-500/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      aria-label={t('switcher.ariaLabel')}
    >
      <span
        className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors duration-300 ${
          isFrench ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
        }`}
      >
        {t('switcher.french')}
      </span>
      <span
        className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors duration-300 ${
          !isFrench ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600'
        }`}
      >
        {t('switcher.english')}
      </span>
    </button>
  );
};

export default LanguageToggle;
