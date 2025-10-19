import { Globe2, Sun } from 'lucide-react';
import LanguageToggle from './LanguageToggle';
import ThemeToggle from './ThemeToggle';
import { useLanguage } from '../i18n/LanguageContext';

const SectionCard = ({ icon: Icon, title, description, control }) => (
  <section className="rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-sm transition-colors dark:border-slate-700/80 dark:bg-slate-900/80">
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-3">
        {Icon ? (
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300">
            <Icon size={20} />
          </span>
        ) : null}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{description}</p>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center justify-start md:justify-end">
        {control}
      </div>
    </div>
  </section>
);

const SettingsPanel = () => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white/95 to-blue-50/60 p-6 shadow-sm transition-colors dark:border-slate-700/80 dark:from-slate-900/80 dark:to-slate-900/40">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('settings.title')}</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{t('settings.subtitle')}</p>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <SectionCard
          icon={Sun}
          title={t('settings.appearance.title')}
          description={t('settings.appearance.description')}
          control={<ThemeToggle />}
        />
        <SectionCard
          icon={Globe2}
          title={t('settings.language.title')}
          description={t('settings.language.description')}
          control={<LanguageToggle />}
        />
      </div>
    </div>
  );
};

export default SettingsPanel;
