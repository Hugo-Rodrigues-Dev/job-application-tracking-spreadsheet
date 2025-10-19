import { useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useLanguage } from '../i18n/LanguageContext';

const STATUS_COLORS = {
  'A Envoyer': '#3b82f6',
  'En cours': '#f97316',
  Entretien: '#22c55e',
  Acceptée: '#16a34a',
  Refusée: '#ef4444',
  default: '#475569',
};

const TYPE_COLORS = {
  Offre: '#6366f1',
  Spontanée: '#0ea5e9',
  default: '#1f2937',
};

const ChartSection = ({ title, description, height = 320, className = '', children }) => (
  <section
    className={`rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm transition-colors ${className}`.trim()}
  >
    <header className="mb-4">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
    </header>
    <div className="h-64 w-full" style={{ height }}>
      {children}
    </div>
  </section>
);

const EmptyState = ({ message }) => (
  <div className="flex h-full items-center justify-center rounded-2xl bg-slate-50 text-sm text-slate-500">
    {message}
  </div>
);

const AnalyticsDashboard = ({ data }) => {
  const { t } = useLanguage();

  const { summary, statusDistribution, typeDistribution, timeline } = data;

  const hasApplications = summary.total > 0;
  const [timelineScale, setTimelineScale] = useState('daily');
  const timelineData = timeline?.[timelineScale] ?? [];

  const tooltipLabelFormatter = (label) => label;
  const tooltipFormatter = (value) => [value, t('analytics.tooltip.applications')];

  return (
    <>
      <section className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white to-blue-50/40 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('analytics.title')}</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">{t('analytics.subtitle')}</p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{t('analytics.summary.totalApplications')}</p>
            <p className="mt-2 text-3xl font-bold text-blue-600">{summary.total}</p>
            <p className="mt-2 text-xs text-slate-500">{t('analytics.summary.totalHint')}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{t('analytics.summary.openPipeline')}</p>
            <p className="mt-2 text-3xl font-bold text-emerald-600">{summary.openCount}</p>
            <p className="mt-2 text-xs text-slate-500">
              {t('analytics.summary.openPipelineHint', {
                count: summary.openCount,
              })}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{t('analytics.summary.positiveRate')}</p>
            <p className="mt-2 text-3xl font-bold text-emerald-600">{summary.positiveRate}%</p>
            <p className="mt-2 text-xs text-slate-500">
              {t('analytics.summary.positiveRateHint', {
                interviews: summary.interviews,
                accepted: summary.accepted,
              })}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{t('analytics.summary.last30Days')}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{summary.recentActivity}</p>
            <p className="mt-2 text-xs text-slate-500">{t('analytics.summary.last30DaysHint')}</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 xl:auto-rows-fr">
        <ChartSection
          className="xl:col-span-1"
          height={260}
          title={t('analytics.charts.statusDistribution.title')}
          description={t('analytics.charts.statusDistribution.description')}
        >
          {hasApplications ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" stroke="#475569" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} stroke="#475569" tickLine={false} axisLine={false} />
                <Tooltip labelFormatter={tooltipLabelFormatter} formatter={tooltipFormatter} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {statusDistribution.map((entry) => (
                    <Cell key={entry.key} fill={STATUS_COLORS[entry.key] || STATUS_COLORS.default} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message={t('analytics.emptyState')} />
          )}
        </ChartSection>

        <ChartSection
          className="xl:col-span-1"
          height={260}
          title={t('analytics.charts.typeBreakdown.title')}
          description={t('analytics.charts.typeBreakdown.description')}
        >
          {hasApplications ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={typeDistribution}
                layout="vertical"
                margin={{ top: 10, bottom: 10, left: 0, right: 10 }}
                barCategoryGap="45%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" allowDecimals={false} stroke="#475569" tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="label" stroke="#475569" tickLine={false} axisLine={false} width={120} />
                <Tooltip formatter={tooltipFormatter} />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={18}>
                  {typeDistribution.map((entry) => (
                    <Cell key={entry.key} fill={TYPE_COLORS[entry.key] || TYPE_COLORS.default} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message={t('analytics.emptyState')} />
          )}
        </ChartSection>

        <ChartSection
          className="xl:col-span-2"
          title={t('analytics.charts.timeline.title')}
          description={t('analytics.charts.timeline.description')}
          height={360}
        >
          <div className="flex h-full flex-col">
            <div className="mb-3 flex justify-end gap-2">
              {[
                { key: 'daily', label: t('analytics.timelineControls.daily') },
                { key: 'weekly', label: t('analytics.timelineControls.weekly') },
              ].map((option) => {
                const isActive = timelineScale === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setTimelineScale(option.key)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      isActive
                        ? 'border-blue-500 bg-blue-500 text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            <div className="flex-1">
              {hasApplications && timelineData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData}>
                    <defs>
                      <linearGradient id="applicationsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.7} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" stroke="#475569" tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} stroke="#475569" tickLine={false} axisLine={false} />
                    <Tooltip labelFormatter={tooltipLabelFormatter} formatter={tooltipFormatter} />
                    <Area type="monotone" dataKey="value" stroke="#2563eb" fill="url(#applicationsGradient)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message={t('analytics.emptyTimeline')} />
              )}
            </div>
          </div>
        </ChartSection>
      </div>
    </>
  );
};

export default AnalyticsDashboard;
