import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Plus,
  Filter,
  Search,
  Download,
  Upload,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { INITIAL_APPLICATIONS } from '../data/initialApplications';
import { STATUS_OPTIONS, TYPE_OPTIONS } from '../constants/options';
import { getStatusColor, getStatusRowColor } from '../utils/styleTokens';
import { loadApplications, saveApplications } from '../utils/storage';
import { exportApplicationsToExcel } from '../utils/export';
import { importApplicationsFromExcel } from '../utils/import';
import Dialog from './Dialog';
import LanguageToggle from './LanguageToggle';
import SidebarNavigation, { MobileNavigation } from './SidebarNavigation';
import AnalyticsDashboard from './AnalyticsDashboard';
import FavoritesOrderingBoard from './FavoritesOrderingBoard';
import { useLanguage } from '../i18n/LanguageProvider';

const STATUS_MIGRATIONS = {
  Envoyée: 'A Envoyer',
  'Offre acceptée': 'Acceptée',
  Relancée: 'En cours',
  Refus: 'Refusée',
};

const normalizeStatus = (statut) => STATUS_MIGRATIONS[statut] || statut;

const STATUS_ORDER = ['Acceptée', 'Entretien', 'En cours', 'A Envoyer', 'Refusée'];
const PAGE_SIZE = 8;

const sortApplications = (applications) =>
  Array.isArray(applications)
    ? [...applications].sort((a, b) => {
        const indexA = STATUS_ORDER.indexOf(a.statut);
        const indexB = STATUS_ORDER.indexOf(b.statut);
        const safeIndexA = indexA === -1 ? STATUS_ORDER.length : indexA;
        const safeIndexB = indexB === -1 ? STATUS_ORDER.length : indexB;

        if (safeIndexA !== safeIndexB) return safeIndexA - safeIndexB;

        return (b.dateEnvoi || '').localeCompare(a.dateEnvoi || '');
      })
    : [];

const normalizeApplications = (applications) =>
  Array.isArray(applications)
    ? applications.map((app) => ({
        ...app,
        statut: normalizeStatus(app.statut),
        favoriteRank:
          typeof app.favoriteRank === 'number'
            ? app.favoriteRank
            : typeof app.preferenceRank === 'number'
              ? app.preferenceRank
              : null,
      }))
    : [];

const createEmptyFormData = () => ({
  entreprise: '',
  localisation: '',
  poste: '',
  type: 'Offre',
  lienUrl: '',
  contacts: '',
  dateEnvoi: new Date().toISOString().split('T')[0],
  statut: 'A Envoyer',
  prochaineAction: '',
  notes: '',
  favoriteRank: null,
});

const ensureFavoriteRanks = (applications) => {
  if (!Array.isArray(applications)) return [];

  const rankedIds = [...applications]
    .map((app) => ({
      id: app.id,
      rank: typeof app.favoriteRank === 'number' ? app.favoriteRank : Number.MAX_SAFE_INTEGER,
    }))
    .sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      return String(a.id).localeCompare(String(b.id));
    })
    .map((entry, index) => [String(entry.id), index]);

  const rankMap = new Map(rankedIds);
  let nextRank = rankMap.size;

  return applications.map((app) => {
    const key = String(app.id);
    if (rankMap.has(key)) {
      return { ...app, favoriteRank: rankMap.get(key) };
    }

    const assignedRank = nextRank;
    nextRank += 1;
    return { ...app, favoriteRank: assignedRank };
  });
};

const JobApplicationTracker = () => {
  const { t, translateStatus, translateType, language } = useLanguage();
  const [applications, setApplications] = useState(() => {
    const storedApplications = loadApplications();
    if (storedApplications && Array.isArray(storedApplications)) {
      const normalized = ensureFavoriteRanks(sortApplications(normalizeApplications(storedApplications)));
      saveApplications(normalized);
      return normalized;
    }

    const seededApplications = ensureFavoriteRanks(
      sortApplications(normalizeApplications(INITIAL_APPLICATIONS)),
    );
    saveApplications(seededApplications);
    return seededApplications;
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeView, setActiveView] = useState('table');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState({ statut: '', type: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortMode, setSortMode] = useState('status');
  const [formData, setFormData] = useState(createEmptyFormData);
  const [initialFormSnapshot, setInitialFormSnapshot] = useState(createEmptyFormData);
  const [currentPage, setCurrentPage] = useState(1);
  const [isImporting, setIsImporting] = useState(false);
  const [dialog, setDialog] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (activeTab !== 'dashboard') {
      setActiveView('table');
    }
  }, [activeTab]);

  const closeDialog = useCallback(() => setDialog(null), []);

  const openDialog = useCallback(
    (config) => {
      setDialog({
        ...config,
        actions: (config.actions || []).map((action) => ({
          ...action,
          onClick: async () => {
            if (!action.keepOpen) {
              closeDialog();
            }
            await action.onClick?.();
          },
        })),
      });
    },
    [closeDialog, setDialog],
  );

  const initializeForm = useCallback((data = {}) => {
    const defaults = createEmptyFormData();
    const normalized = { ...defaults, ...data };
    setFormData(normalized);
    setInitialFormSnapshot(normalized);
  }, [setFormData, setInitialFormSnapshot]);

  const resetForm = useCallback(() => {
    initializeForm();
  }, [initializeForm]);

  const closeForm = useCallback(() => {
    resetForm();
    setEditingId(null);
    setShowForm(false);
  }, [resetForm, setEditingId, setShowForm]);

  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(initialFormSnapshot);
  }, [formData, initialFormSnapshot]);

  const isFavoritesBoard = activeView === 'favoritesBoard';

  useEffect(() => {
    if (isFavoritesBoard && applications.length === 0) {
      setActiveView('table');
    }
  }, [isFavoritesBoard, applications.length]);

  const persistApplications = useCallback((updater) => {
    setApplications((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (!Array.isArray(next)) return prev;
      const normalized = sortApplications(normalizeApplications(next));
      const ranked = ensureFavoriteRanks(normalized);
      saveApplications(ranked);
      return ranked;
    });
  }, []);

  const handleFavoritesReorder = useCallback(
    (orderedIds) => {
      if (!Array.isArray(orderedIds)) return;

      persistApplications((prev) => {
        const existing = Array.isArray(prev) ? prev : [];
        const idToRank = new Map(orderedIds.map((id, index) => [String(id), index]));

        return existing.map((app) => {
          const mappedRank = idToRank.get(String(app.id));
          if (typeof mappedRank === 'number') {
            return { ...app, favoriteRank: mappedRank };
          }

          return {
            ...app,
            favoriteRank: typeof app.favoriteRank === 'number' ? app.favoriteRank : null,
          };
        });
      });
    },
    [persistApplications],
  );

  const favoritesComparator = useCallback((a, b) => {
    const rankA = typeof a.favoriteRank === 'number' ? a.favoriteRank : Number.MAX_SAFE_INTEGER;
    const rankB = typeof b.favoriteRank === 'number' ? b.favoriteRank : Number.MAX_SAFE_INTEGER;
    if (rankA !== rankB) return rankA - rankB;
    return (a.entreprise || '').localeCompare(b.entreprise || '', undefined, { sensitivity: 'base' });
  }, []);

  const favoritesOrderedApplications = useMemo(() => {
    if (!Array.isArray(applications)) return [];

    return [...applications]
      .map((app) => ({
        ...app,
        favoriteRank: typeof app.favoriteRank === 'number' ? app.favoriteRank : Number.MAX_SAFE_INTEGER,
      }))
      .sort(favoritesComparator)
      .map((app, index) => ({
        ...app,
        favoriteRank: index,
      }));
  }, [applications, favoritesComparator]);

  const handleOpenFavoritesBoard = useCallback(() => setActiveView('favoritesBoard'), []);
  const handleCloseFavoritesBoard = useCallback(() => setActiveView('table'), []);

  const executeSave = useCallback(() => {
    if (editingId) {
      persistApplications((prev) =>
        prev.map((app) =>
          app.id === editingId
            ? { ...formData, id: editingId, favoriteRank: app.favoriteRank }
            : app,
        ),
      );
    } else {
      persistApplications((prev) => {
        const existing = Array.isArray(prev) ? prev : [];
        const nextRank =
          existing.reduce(
            (max, app) => (typeof app.favoriteRank === 'number' ? Math.max(max, app.favoriteRank) : max),
            -1,
          ) + 1;

        return [...existing, { ...formData, id: Date.now(), favoriteRank: nextRank }];
      });
    }
    closeForm();
  }, [editingId, formData, persistApplications, closeForm]);

  const applyImport = useCallback(
    (mode, data) => {
      if (!data) return;

      const { applications: importedApplications, summary = {} } = data;
      const { skippedEmpty = 0, skippedMissingFields = 0 } = summary;

      if (mode === 'replace') {
        const rankedApplications = importedApplications.map((app, index) => ({
          ...app,
          favoriteRank:
            typeof app.favoriteRank === 'number' ? app.favoriteRank : index,
        }));
        persistApplications(rankedApplications);
      } else {
        persistApplications((prev) => {
          const existing = Array.isArray(prev) ? prev : [];
          const startRank =
            existing.reduce(
              (max, app) => (typeof app.favoriteRank === 'number' ? Math.max(max, app.favoriteRank) : max),
              -1,
            ) + 1;

          const rankedApplications = importedApplications.map((app, index) => ({
            ...app,
            favoriteRank:
              typeof app.favoriteRank === 'number' ? app.favoriteRank : startRank + index,
          }));

          return [...existing, ...rankedApplications];
        });
      }

      setCurrentPage(1);

      const summaryKeyBase = mode === 'replace' ? 'import.replaceSummary' : 'import.appendSummary';
      const summaryKey = `${summaryKeyBase}${importedApplications.length > 1 ? 'Plural' : 'Singular'}`;
      const actionDescription = t(summaryKey, { count: importedApplications.length });

      const details = [actionDescription];
      if (skippedMissingFields) {
        details.push(
          t(skippedMissingFields > 1 ? 'import.skipMissingPlural' : 'import.skipMissing', {
            count: skippedMissingFields,
          }),
        );
      }
      if (skippedEmpty) {
        details.push(
          t(skippedEmpty > 1 ? 'import.skipEmptyPlural' : 'import.skipEmpty', {
            count: skippedEmpty,
          }),
        );
      }

      openDialog({
        title: t('import.completedTitle'),
        description: details.join(' '),
        actions: [{ label: t('common.ok'), intent: 'primary' }],
      });
    },
    [persistApplications, openDialog, t],
  );

  const handleImport = async (event) => {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const { imported, skippedEmpty, skippedMissingFields } = await importApplicationsFromExcel(file);

      if (!imported.length) {
        openDialog({
          title: t('import.incompleteTitle'),
          description: t('import.incompleteDescription'),
          actions: [{ label: t('common.ok'), intent: 'primary' }],
        });
        return;
      }

      const timestamp = Date.now();
      const importedApplications = imported.map((app, index) => {
        const defaults = createEmptyFormData();
        return {
          ...defaults,
          ...app,
          id: timestamp + index,
          type: app.type || defaults.type,
          statut: app.statut || defaults.statut,
          dateEnvoi: app.dateEnvoi || defaults.dateEnvoi,
        };
      });

      const nextImport = {
        applications: importedApplications,
        summary: { skippedEmpty, skippedMissingFields },
      };

      const infoParts = [
        t(importedApplications.length > 1 ? 'import.readyPlural' : 'import.readySingular', {
          count: importedApplications.length,
        }),
      ];
      if (skippedMissingFields) {
        infoParts.push(
          t(skippedMissingFields > 1 ? 'import.skipMissingPlural' : 'import.skipMissing', {
            count: skippedMissingFields,
          }),
        );
      }
      if (skippedEmpty) {
        infoParts.push(
          t(skippedEmpty > 1 ? 'import.skipEmptyPlural' : 'import.skipEmpty', {
            count: skippedEmpty,
          }),
        );
      }

      openDialog({
        title: t('import.confirmTitle'),
        description: infoParts.join(' '),
        actions: [
          {
            label: t('common.cancel'),
            intent: 'secondary',
          },
          {
            label: t('import.appendAction'),
            intent: 'primary',
            onClick: () => applyImport('append', nextImport),
          },
          {
            label: t('import.replaceAction'),
            intent: 'danger',
            onClick: () => applyImport('replace', nextImport),
          },
        ],
      });
    } catch (error) {
      console.error('Import failed', error);
      openDialog({
        title: t('import.failedTitle'),
        description: error.message || t('import.unexpectedError'),
        actions: [{ label: t('common.ok'), intent: 'primary' }],
      });
    } finally {
      setIsImporting(false);
      input.value = '';
    }
  };

  const handleSubmit = () => {
    if (!formData.entreprise || !formData.localisation || !formData.poste) {
      openDialog({
        title: t('form.validation.missingRequiredTitle'),
        description: t('form.validation.missingRequiredDescription'),
        actions: [{ label: t('common.ok'), intent: 'primary' }],
      });
      return;
    }

    const isEditing = Boolean(editingId);
    const confirmTitle = isEditing ? t('form.confirm.updateTitle') : t('form.confirm.saveTitle');
    const confirmDescription = isEditing
      ? t('form.confirm.updateDescription')
      : t('form.confirm.saveDescription');
    const confirmActionLabel = isEditing ? t('form.update') : t('form.save');
    openDialog({
      title: confirmTitle,
      description: confirmDescription,
      actions: [
        { label: t('common.cancel'), intent: 'secondary' },
        {
          label: confirmActionLabel,
          intent: 'primary',
          onClick: executeSave,
        },
      ],
    });
  };

  const handleEdit = (application) => {
    initializeForm({ ...application, statut: normalizeStatus(application.statut) });
    setEditingId(application.id);
    setShowForm(true);
  };

  const handleDelete = (application) => {
    openDialog({
      title: t('form.deleteDialog.title'),
      description: t('form.deleteDialog.description', {
        role: application.poste,
        company: application.entreprise,
      }),
      actions: [
        { label: t('form.deleteDialog.keep'), intent: 'secondary' },
        {
          label: t('form.deleteDialog.remove'),
          intent: 'danger',
          onClick: () => {
            persistApplications((prev) => prev.filter((app) => app.id !== application.id));
            if (editingId === application.id) {
              closeForm();
            }
          },
        },
      ],
    });
  };

  const handleCancelForm = () => {
    if (!hasUnsavedChanges) {
      closeForm();
      return;
    }

    const isEditing = Boolean(editingId);
    const title = isEditing ? t('form.cancelDialog.editTitle') : t('form.cancelDialog.createTitle');
    const description = isEditing
      ? t('form.cancelDialog.editDescription')
      : t('form.cancelDialog.createDescription');
    const confirmLabel = isEditing
      ? t('form.cancelDialog.discardChanges')
      : t('form.cancelDialog.abandon');
    openDialog({
      title,
      description,
      actions: [
        { label: t('form.cancelDialog.continueEditing'), intent: 'secondary' },
        {
          label: confirmLabel,
          intent: 'danger',
          onClick: () => {
            closeForm();
          },
        },
      ],
    });
  };

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchesSearch =
        !searchTerm ||
        app.entreprise.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.poste.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.localisation.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = !filters.statut || app.statut === filters.statut;
      const matchesType = !filters.type || app.type === filters.type;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [applications, filters, searchTerm]);

  const sortedFilteredApplications = useMemo(() => {
    if (sortMode === 'favorites') {
      return [...filteredApplications].sort(favoritesComparator);
    }
    return sortApplications(filteredApplications);
  }, [filteredApplications, sortMode, favoritesComparator]);

  const totalPages = Math.max(1, Math.ceil(sortedFilteredApplications.length / PAGE_SIZE));

  const paginatedApplications = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return sortedFilteredApplications.slice(startIndex, startIndex + PAGE_SIZE);
  }, [sortedFilteredApplications, currentPage]);

  const analyticsData = useMemo(() => {
    const statusCounts = {};
    const typeCounts = {};

    STATUS_ORDER.forEach((status) => {
      statusCounts[status] = 0;
    });
    TYPE_OPTIONS.forEach((type) => {
      typeCounts[type] = 0;
    });

    const timelineWindowDays = 30;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const timelineStart = new Date(today);
    timelineStart.setDate(timelineStart.getDate() - (timelineWindowDays - 1));

    const timelineDailyCounts = new Map();
    const timelineWeeklyCounts = new Map();

    const thresholdDate = new Date(today);
    thresholdDate.setDate(thresholdDate.getDate() - 30);

    let recentActivity = 0;

    const toIsoDayKey = (date) => date.toISOString().split('T')[0];
    const getWeekStart = (date) => {
      const result = new Date(date);
      const day = result.getDay();
      const offset = day === 0 ? 6 : day - 1;
      result.setDate(result.getDate() - offset);
      result.setHours(0, 0, 0, 0);
      return result;
    };

    applications.forEach((application) => {
      const normalizedStatus = normalizeStatus(application.statut);
      statusCounts[normalizedStatus] = (statusCounts[normalizedStatus] ?? 0) + 1;

      if (application.type) {
        typeCounts[application.type] = (typeCounts[application.type] ?? 0) + 1;
      }

      if (application.dateEnvoi) {
        const parsedDate = new Date(application.dateEnvoi);
        if (!Number.isNaN(parsedDate.valueOf())) {
          parsedDate.setHours(0, 0, 0, 0);

          if (parsedDate >= timelineStart) {
            const dayKey = toIsoDayKey(parsedDate);
            timelineDailyCounts.set(dayKey, (timelineDailyCounts.get(dayKey) ?? 0) + 1);

            const weekStart = getWeekStart(parsedDate);
            const weekKey = toIsoDayKey(weekStart);
            timelineWeeklyCounts.set(weekKey, (timelineWeeklyCounts.get(weekKey) ?? 0) + 1);
          }

          if (parsedDate >= thresholdDate) {
            recentActivity += 1;
          }
        }
      }
    });

    const knownStatuses = new Set(STATUS_ORDER);
    const statusDistribution = [
      ...STATUS_ORDER.map((status) => ({
        key: status,
        label: translateStatus(status),
        value: statusCounts[status] ?? 0,
      })),
      ...Object.entries(statusCounts)
        .filter(([status]) => !knownStatuses.has(status))
        .map(([status, value]) => ({
          key: status,
          label: translateStatus(status),
          value,
        })),
    ].filter((entry) => entry.value > 0 || knownStatuses.has(entry.key));

    const knownTypes = new Set(TYPE_OPTIONS);
    const typeDistribution = [
      ...TYPE_OPTIONS.map((type) => ({
        key: type,
        label: translateType(type),
        value: typeCounts[type] ?? 0,
      })),
      ...Object.entries(typeCounts)
        .filter(([type]) => !knownTypes.has(type))
        .map(([type, value]) => ({
          key: type,
          label: translateType(type),
          value,
        })),
    ];

    const locale = language === 'fr' ? 'fr-FR' : 'en-US';
    const dailyFormatter = new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short' });
    const weeklyFormatter = new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short' });

    const dailyTimeline = [];
    const iterDay = new Date(timelineStart);
    while (iterDay <= today) {
      const dayKey = toIsoDayKey(iterDay);
      dailyTimeline.push({
        key: dayKey,
        label: dailyFormatter.format(iterDay),
        value: timelineDailyCounts.get(dayKey) ?? 0,
      });
      iterDay.setDate(iterDay.getDate() + 1);
    }

    const weeklyTimeline = [];
    const firstWeekStart = getWeekStart(timelineStart);
    const lastWeekStart = getWeekStart(today);
    const iterWeek = new Date(firstWeekStart);
    while (iterWeek <= lastWeekStart) {
      const weekKey = toIsoDayKey(iterWeek);
      weeklyTimeline.push({
        key: weekKey,
        label: t('analytics.timelineControls.weekLabel', {
          date: weeklyFormatter.format(iterWeek),
        }),
        value: timelineWeeklyCounts.get(weekKey) ?? 0,
      });
      iterWeek.setDate(iterWeek.getDate() + 7);
    }

    const total = applications.length;
    const accepted = statusCounts.Acceptée ?? 0;
    const interviews = statusCounts.Entretien ?? 0;
    const openCount = (statusCounts['A Envoyer'] ?? 0) + (statusCounts['En cours'] ?? 0);
    const positiveRate = total ? Math.round(((accepted + interviews) / total) * 100) : 0;

    return {
      summary: {
        total,
        openCount,
        positiveRate,
        recentActivity,
        interviews,
        accepted,
      },
      statusDistribution,
      typeDistribution,
      timeline: {
        daily: dailyTimeline,
        weekly: weeklyTimeline,
      },
    };
  }, [applications, language, t, translateStatus, translateType]);

  const handleNavigationSelect = useCallback(
    (key) => {
      if (key === 'dashboard' || key === 'analytics') {
        setActiveTab(key);
        return;
      }

      openDialog({
        title: t('navigation.comingSoonTitle'),
        description: t('navigation.hint'),
        actions: [{ label: t('common.ok'), intent: 'primary' }],
      });
    },
    [openDialog, t],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchTerm, sortMode]);

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  return (
    <>
      <div className="min-h-screen bg-slate-100 lg:flex">
        <SidebarNavigation activeKey={activeTab} onSelect={handleNavigationSelect} />
        <div className="flex-1">
          <MobileNavigation activeKey={activeTab} onSelect={handleNavigationSelect} />
          <div className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
            <div className="space-y-6">
              {activeTab === 'dashboard' ? (
                <>
                  <section className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h1 className="text-3xl font-bold text-gray-900">{t('header.title')}</h1>
                        <p className="mt-2 text-gray-600">{t('header.subtitle')}</p>
                      </div>
                      <div className="flex items-center justify-end gap-3">
                        <LanguageToggle />
                        <button
                          onClick={() => {
                            resetForm();
                            setEditingId(null);
                            setShowForm(true);
                          }}
                          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                        >
                          <Plus size={20} />
                          {t('actions.newApplication')}
                        </button>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-xl bg-blue-50 p-4">
                        <div className="text-2xl font-bold text-blue-600">{applications.length}</div>
                        <div className="text-sm text-blue-600">{t('stats.total')}</div>
                      </div>
                      <div className="rounded-xl bg-green-50 p-4">
                        <div className="text-2xl font-bold text-green-600">
                          {applications.filter((app) => app.statut === 'Entretien' || app.statut === 'Acceptée').length}
                        </div>
                        <div className="text-sm text-green-600">{t('stats.interviewsAccepted')}</div>
                      </div>
                      <div className="rounded-xl bg-orange-50 p-4">
                        <div className="text-2xl font-bold text-orange-600">
                          {applications.filter((app) => app.statut === 'En cours').length}
                        </div>
                        <div className="text-sm text-orange-600">{t('stats.inProgress')}</div>
                      </div>
                      <div className="rounded-xl bg-red-50 p-4">
                        <div className="text-2xl font-bold text-red-600">
                          {applications.filter((app) => app.statut === 'Refusée').length}
                        </div>
                        <div className="text-sm text-red-600">{t('stats.rejected')}</div>
                      </div>
                    </div>
                  </section>

                  {isFavoritesBoard ? (
                    <section className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm">
                      <FavoritesOrderingBoard
                        applications={favoritesOrderedApplications}
                        onBack={handleCloseFavoritesBoard}
                        onReorder={handleFavoritesReorder}
                        translateStatus={translateStatus}
                        translateType={translateType}
                        t={t}
                      />
                    </section>
                  ) : (
                    <>
                      <section className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                          <div className="relative flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                              type="text"
                              placeholder={t('search.placeholder')}
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="w-full rounded-lg border border-gray-200 px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept=".xlsx,.xls,.csv"
                              onChange={handleImport}
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isImporting}
                              className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Upload size={18} />
                              {isImporting ? t('actions.importing') : t('actions.import')}
                            </button>
                            <button
                              onClick={() => exportApplicationsToExcel(applications)}
                              className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-gray-600 transition-colors hover:bg-gray-50"
                            >
                              <Download size={18} />
                              {t('actions.export')}
                            </button>
                          </div>
                        </div>

                    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">{t('filters.statusLabel')}</label>
                        <div className="relative">
                          <Filter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                          <select
                            value={filters.statut}
                            onChange={(e) => setFilters((prev) => ({ ...prev, statut: e.target.value }))}
                            className="w-full rounded-lg border border-gray-200 px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">{t('filters.statusAll')}</option>
                            {STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>
                                {translateStatus(status)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">{t('filters.typeLabel')}</label>
                        <div className="relative">
                          <Filter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                          <select
                            value={filters.type}
                            onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
                                className="w-full rounded-lg border border-gray-200 px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">{t('filters.typeAll')}</option>
                                {TYPE_OPTIONS.map((type) => (
                                  <option key={type} value={type}>
                                    {translateType(type)}
                                  </option>
                                ))}
                              </select>
                        </div>
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={() => {
                            setFilters({ statut: '', type: '' });
                            setSearchTerm('');
                          }}
                          className="w-full rounded-lg border border-gray-200 px-4 py-2 text-gray-600 transition-colors hover:bg-gray-50"
                        >
                          {t('actions.resetFilters')}
                        </button>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm">
                    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        {t('sorting.label')}
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSortMode('status')}
                          aria-pressed={sortMode === 'status'}
                          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                            sortMode === 'status'
                              ? 'border-blue-500 bg-blue-500 text-white shadow-sm'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600'
                          }`}
                        >
                          {t('sorting.status')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSortMode('favorites')}
                          aria-pressed={sortMode === 'favorites'}
                          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                            sortMode === 'favorites'
                              ? 'border-blue-500 bg-blue-500 text-white shadow-sm'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600'
                          }`}
                        >
                          {t('sorting.favorites')}
                        </button>
                      </div>
                    </div>
                    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white/95">
                      <table className="min-w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  {t('table.headers.company')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  {t('table.headers.position')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  {t('table.headers.status')}
                                </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {t('table.headers.nextAction')}
                            </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  {t('table.headers.actions')}
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {paginatedApplications.map((application) => (
                                <tr key={application.id} className={getStatusRowColor(application.statut)}>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{application.entreprise}</div>
                                    <div className="text-sm text-gray-500">{application.localisation}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{application.poste}</div>
                                    <div className="text-sm text-gray-500">{translateType(application.type)}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(application.statut, application.prochaineAction)}`}>
                                      {translateStatus(application.statut)}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {application.prochaineAction || '—'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex justify-end gap-2">
                                      <button
                                        onClick={() => handleEdit(application)}
                                        className="text-blue-600 hover:text-blue-900"
                                        aria-label={t('actions.editApplication')}
                                      >
                                        <Edit size={18} />
                                      </button>
                                      <button
                                        onClick={() => handleDelete(application)}
                                        className="text-red-600 hover:text-red-900"
                                        aria-label={t('actions.deleteApplication')}
                                      >
                                        <Trash2 size={18} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          {filteredApplications.length === 0 && (
                            <div className="p-8 text-center text-gray-500">
                              {t('table.emptyState')}
                            </div>
                          )}
                        </div>

                        {filteredApplications.length > 0 && (
                          <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <p className="text-sm text-gray-600">
                              {t('pagination.pageIndicator', { current: currentPage, total: totalPages })}
                            </p>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={handleOpenFavoritesBoard}
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                              >
                                {t('actions.openFavoritesBoard')}
                              </button>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setCurrentPage(1)}
                                  disabled={currentPage === 1}
                                  className="rounded border border-gray-200 p-2 text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                  aria-label={t('pagination.first')}
                                >
                                  <ChevronsLeft size={16} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                  disabled={currentPage === 1}
                                  className="rounded border border-gray-200 p-2 text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                  aria-label={t('pagination.previous')}
                                >
                                  <ChevronLeft size={16} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                  disabled={currentPage === totalPages}
                                  className="rounded border border-gray-200 p-2 text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                  aria-label={t('pagination.next')}
                                >
                                  <ChevronRight size={16} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setCurrentPage(totalPages)}
                                  disabled={currentPage === totalPages}
                                  className="rounded border border-gray-200 p-2 text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                  aria-label={t('pagination.last')}
                                >
                                  <ChevronsRight size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </section>
                    </>
                  )}
                </>
              ) : (
                <AnalyticsDashboard data={analyticsData} />
              )}
            </div>
          </div>
        </div>
      </div>
      <Dialog
        open={showForm}
        title={editingId ? t('form.titleEdit') : t('form.titleNew')}
        onClose={handleCancelForm}
        size="xl"
        actions={[
          {
            label: t('form.cancel'),
            intent: 'secondary',
            onClick: handleCancelForm,
          },
          {
            label: editingId ? t('form.update') : t('form.save'),
            intent: 'primary',
            onClick: handleSubmit,
          },
        ]}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.labels.company')}</label>
            <input
              type="text"
              value={formData.entreprise}
              onChange={(e) => setFormData({ ...formData, entreprise: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('form.placeholders.company')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.labels.position')}</label>
            <input
              type="text"
              value={formData.poste}
              onChange={(e) => setFormData({ ...formData, poste: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('form.placeholders.position')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.labels.location')}</label>
            <input
              type="text"
              value={formData.localisation}
              onChange={(e) => setFormData({ ...formData, localisation: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('form.placeholders.location')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.labels.type')}</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {translateType(type)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.labels.sentDate')}</label>
            <input
              type="date"
              value={formData.dateEnvoi}
              onChange={(e) => setFormData({ ...formData, dateEnvoi: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.labels.status')}</label>
            <select
              value={formData.statut}
              onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {translateStatus(status)}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.labels.nextAction')}</label>
            <input
              type="text"
              value={formData.prochaineAction}
              onChange={(e) => setFormData({ ...formData, prochaineAction: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('form.placeholders.nextAction')}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.labels.link')}</label>
            <input
              type="url"
              value={formData.lienUrl}
              onChange={(e) => setFormData({ ...formData, lienUrl: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('form.placeholders.link')}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.labels.contacts')}</label>
            <textarea
              rows={2}
              value={formData.contacts}
              onChange={(e) => setFormData({ ...formData, contacts: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('form.placeholders.contacts')}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.labels.notes')}</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('form.placeholders.notes')}
            />
          </div>
        </div>
      </Dialog>
      <Dialog
        open={Boolean(dialog)}
        title={dialog?.title}
        description={dialog?.description}
        actions={dialog?.actions}
        onClose={closeDialog}
      />
    </>
  );
};

export default JobApplicationTracker;
