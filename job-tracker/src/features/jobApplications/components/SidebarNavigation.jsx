import { LayoutDashboard, BarChart3, CalendarDays, Briefcase, Settings } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageProvider';

const NAV_ITEMS = [
  { key: 'dashboard', icon: LayoutDashboard },
  { key: 'analytics', icon: BarChart3 },
  { key: 'calendar', icon: CalendarDays },
  { key: 'companies', icon: Briefcase },
  { key: 'settings', icon: Settings },
];

const TooltipNavButton = ({ icon, label, isActive, onSelect }) => {
  const IconComponent = icon;
  const base =
    'group relative flex h-12 w-12 items-center justify-center rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900/10';
  const state = isActive
    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
    : 'bg-white/80 text-slate-400 ring-1 ring-slate-200/80 hover:bg-blue-50 hover:text-blue-600';

  return (
    <button
      type="button"
      className={`${base} ${state}`}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
      onClick={onSelect}
    >
      <IconComponent size={22} />
      <span className="pointer-events-none absolute left-full top-1/2 ml-3 -translate-y-1/2 -translate-x-1 rounded-lg bg-slate-900/90 px-3 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100">
        {label}
      </span>
    </button>
  );
};

const SidebarNavigation = ({ activeKey, onSelect }) => {
  const { t } = useLanguage();

  return (
    <aside className="hidden w-24 shrink-0 items-center justify-center bg-transparent lg:flex lg:sticky lg:top-0 lg:h-screen">
      <div className="flex flex-col items-center gap-4 rounded-full bg-white/70 p-4 shadow-xl shadow-blue-500/5 ring-1 ring-slate-200/80 backdrop-blur">
        {NAV_ITEMS.map(({ key, icon }) => (
          <TooltipNavButton
            key={key}
            icon={icon}
            label={t(`navigation.items.${key}`)}
            isActive={activeKey === key}
            onSelect={() => onSelect?.(key)}
          />
        ))}
      </div>
    </aside>
  );
};

export const MobileNavigation = ({ activeKey, onSelect }) => {
  const { t } = useLanguage();

  return (
    <nav className="flex items-center justify-around gap-1 border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur lg:hidden">
      {NAV_ITEMS.map(({ key, icon }) => {
        const IconComponent = icon;
        const isActive = activeKey === key;
        return (
          <button
            key={key}
            type="button"
            className={`flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              isActive ? 'text-blue-600' : 'text-slate-500 hover:text-blue-600'
            }`}
            aria-label={t(`navigation.items.${key}`)}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onSelect?.(key)}
          >
            <IconComponent size={20} />
            <span className="text-[10px] uppercase tracking-wide">{t(`navigation.items.${key}`)}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default SidebarNavigation;
