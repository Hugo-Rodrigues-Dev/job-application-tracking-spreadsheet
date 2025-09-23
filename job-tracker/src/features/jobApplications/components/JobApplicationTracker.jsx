import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Filter, Search, Download, Upload, Edit, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { INITIAL_APPLICATIONS } from '../data/initialApplications';
import { STATUS_OPTIONS, TYPE_OPTIONS, PRIORITY_OPTIONS } from '../constants/options';
import { getStatusColor, getStatusRowColor } from '../utils/styleTokens';
import { loadApplications, saveApplications } from '../utils/storage';
import { exportApplicationsToExcel } from '../utils/export';
import { importApplicationsFromExcel } from '../utils/import';
import Dialog from './Dialog';

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
  priorite: 'Moyenne',
  notes: '',
});

const JobApplicationTracker = () => {
  const [applications, setApplications] = useState(() => {
    const storedApplications = loadApplications();
    if (storedApplications && Array.isArray(storedApplications)) {
      const normalized = sortApplications(normalizeApplications(storedApplications));
      saveApplications(normalized);
      return normalized;
    }

    const seededApplications = sortApplications(normalizeApplications(INITIAL_APPLICATIONS));
    saveApplications(seededApplications);
    return seededApplications;
  });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState({ statut: '', priorite: '', type: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState(createEmptyFormData);
  const [initialFormSnapshot, setInitialFormSnapshot] = useState(createEmptyFormData);
  const [currentPage, setCurrentPage] = useState(1);
  const [isImporting, setIsImporting] = useState(false);
  const [pendingImport, setPendingImport] = useState(null);
  const [dialog, setDialog] = useState(null);
  const fileInputRef = useRef(null);

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

  const persistApplications = useCallback((updater) => {
    setApplications((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (!Array.isArray(next)) return prev;
      const normalized = sortApplications(normalizeApplications(next));
      saveApplications(normalized);
      return normalized;
    });
  }, []);

  const executeSave = useCallback(() => {
    if (editingId) {
      persistApplications((prev) =>
        prev.map((app) => (app.id === editingId ? { ...formData, id: editingId } : app)),
      );
    } else {
      persistApplications((prev) => [...prev, { ...formData, id: Date.now() }]);
    }
    closeForm();
  }, [editingId, formData, persistApplications, closeForm]);

  const applyImport = useCallback(
    (mode) => {
      if (!pendingImport) return;

      const { applications: importedApplications, summary = {} } = pendingImport;
      const { skippedEmpty = 0, skippedMissingFields = 0 } = summary;

      persistApplications((prev) => {
        if (mode === 'replace') {
          return importedApplications;
        }
        const existing = Array.isArray(prev) ? prev : [];
        return [...existing, ...importedApplications];
      });

      setPendingImport(null);

      const actionDescription =
        mode === 'replace'
          ? `${importedApplications.length} candidature${importedApplications.length > 1 ? 's' : ''} ont remplacé la liste existante.`
          : `${importedApplications.length} candidature${importedApplications.length > 1 ? 's' : ''} ont été ajoutées à votre liste.`;

      const details = [actionDescription];
      if (skippedMissingFields) {
        details.push(
          `${skippedMissingFields} ligne${skippedMissingFields > 1 ? 's' : ''} ignorée${
            skippedMissingFields > 1 ? 's' : ''
          } (champs obligatoires manquants).`,
        );
      }
      if (skippedEmpty) {
        details.push(
          `${skippedEmpty} ligne${skippedEmpty > 1 ? 's' : ''} vide ignorée${skippedEmpty > 1 ? 's' : ''}.`,
        );
      }

      openDialog({
        title: 'Import terminé',
        description: details.join(' '),
        actions: [{ label: 'OK', intent: 'primary' }],
      });
    },
    [pendingImport, persistApplications, openDialog, setPendingImport],
  );

  const handleImport = async (event) => {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setPendingImport(null);
    try {
      const { imported, skippedEmpty, skippedMissingFields } = await importApplicationsFromExcel(file);

      if (!imported.length) {
        openDialog({
          title: 'Import incomplet',
          description: "Aucune candidature valide n'a été trouvée dans ce fichier.",
          actions: [{ label: 'OK', intent: 'primary' }],
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
          priorite: app.priorite || defaults.priorite,
          dateEnvoi: app.dateEnvoi || defaults.dateEnvoi,
        };
      });

      setPendingImport({
        applications: importedApplications,
        summary: { skippedEmpty, skippedMissingFields },
      });

      const infoParts = [
        `${importedApplications.length} candidature${importedApplications.length > 1 ? 's' : ''} prête${
          importedApplications.length > 1 ? 's' : ''
        } à être importée${importedApplications.length > 1 ? 's' : ''}.`,
      ];
      if (skippedMissingFields) {
        infoParts.push(
          `${skippedMissingFields} ligne${skippedMissingFields > 1 ? 's' : ''} ignorée${
            skippedMissingFields > 1 ? 's' : ''
          } pour champs manquants.`,
        );
      }
      if (skippedEmpty) {
        infoParts.push(
          `${skippedEmpty} ligne${skippedEmpty > 1 ? 's' : ''} vide ignorée${skippedEmpty > 1 ? 's' : ''}.`,
        );
      }

      openDialog({
        title: "Confirmer l'import",
        description: infoParts.join(' '),
        actions: [
          {
            label: 'Annuler',
            intent: 'secondary',
            onClick: () => setPendingImport(null),
          },
          {
            label: 'Ajouter à la liste',
            intent: 'primary',
            onClick: () => applyImport('append'),
          },
          {
            label: 'Remplacer la liste',
            intent: 'danger',
            onClick: () => applyImport('replace'),
          },
        ],
      });
    } catch (error) {
      console.error('Import failed', error);
      openDialog({
        title: "Échec de l'import",
        description: error.message || "Une erreur inattendue est survenue pendant l'import.",
        actions: [{ label: 'OK', intent: 'primary' }],
      });
    } finally {
      setIsImporting(false);
      input.value = '';
    }
  };

  const handleSubmit = () => {
    if (!formData.entreprise || !formData.localisation || !formData.poste) {
      openDialog({
        title: 'Champs obligatoires manquants',
        description: 'Veuillez renseigner une entreprise, une localisation et un poste avant de sauvegarder.',
        actions: [{ label: 'OK', intent: 'primary' }],
      });
      return;
    }

    const isEditing = Boolean(editingId);
    openDialog({
      title: isEditing ? 'Confirmer la mise à jour' : 'Enregistrer la candidature ?',
      description: isEditing
        ? 'Les modifications apportées à cette candidature seront enregistrées.'
        : 'Cette candidature sera ajoutée à votre tableau de suivi.',
      actions: [
        { label: 'Annuler', intent: 'secondary' },
        {
          label: isEditing ? 'Mettre à jour' : 'Enregistrer',
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
      title: 'Supprimer cette candidature ?',
      description: `Cette action supprimera définitivement la candidature "${application.poste}" chez ${application.entreprise}.`,
      actions: [
        { label: 'Conserver', intent: 'secondary' },
        {
          label: 'Supprimer',
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
    openDialog({
      title: isEditing ? 'Annuler les modifications ?' : 'Fermer le formulaire ?',
      description: isEditing
        ? 'Les modifications non sauvegardées seront perdues.'
        : 'Les informations saisies seront effacées.',
      actions: [
        { label: 'Continuer la saisie', intent: 'secondary' },
        {
          label: isEditing ? 'Annuler les modifications' : 'Abandonner',
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
      const matchesPriority = !filters.priorite || app.priorite === filters.priorite;
      const matchesType = !filters.type || app.type === filters.type;

      return matchesSearch && matchesStatus && matchesPriority && matchesType;
    });
  }, [applications, filters, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredApplications.length / PAGE_SIZE));

  const paginatedApplications = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredApplications.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredApplications, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchTerm]);

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Suivi des Candidatures</h1>
                <p className="text-gray-600 mt-2">
                  Gérez efficacement vos candidatures de stage et d'emploi
                </p>
              </div>
              <button
                onClick={() => {
                  resetForm();
                  setEditingId(null);
                  setShowForm(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus size={20} />
                Nouvelle candidature
              </button>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{applications.length}</div>
                <div className="text-sm text-blue-600">Total candidatures</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {applications.filter((app) => app.statut === 'Entretien' || app.statut === 'Acceptée').length}
                </div>
                <div className="text-sm text-green-600">Entretiens/Acceptées</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {applications.filter((app) => app.statut === 'En cours').length}
                </div>
                <div className="text-sm text-orange-600">En cours</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {applications.filter((app) => app.statut === 'Refusée').length}
                </div>
                <div className="text-sm text-red-600">Refusées</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Rechercher par entreprise, poste ou localisation"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
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
                className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 flex items-center gap-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload size={18} />
                {isImporting ? 'Import en cours...' : 'Importer'}
              </button>
              <button
                onClick={() => exportApplicationsToExcel(applications)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 flex items-center gap-2 hover:bg-gray-50"
              >
                <Download size={18} />
                Exporter
              </button>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <select
                    value={filters.statut}
                    onChange={(e) => setFilters((prev) => ({ ...prev, statut: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Tous les statuts</option>
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <select
                    value={filters.priorite}
                    onChange={(e) => setFilters((prev) => ({ ...prev, priorite: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Toutes les priorités</option>
                    {PRIORITY_OPTIONS.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Tous les types</option>
                    {TYPE_OPTIONS.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-span-1 flex items-end">
                <button
                  onClick={() => {
                    setFilters({ statut: '', priorite: '', type: '' });
                    setSearchTerm('');
                  }}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Réinitialiser
                </button>
              </div>
            </div>
          </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingId ? 'Modifier une candidature' : 'Nouvelle candidature'}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Entreprise *</label>
                <input
                  type="text"
                  value={formData.entreprise}
                  onChange={(e) => setFormData({ ...formData, entreprise: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nom de l'entreprise"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Poste *</label>
                <input
                  type="text"
                  value={formData.poste}
                  onChange={(e) => setFormData({ ...formData, poste: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Titre du poste"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Localisation *</label>
                <input
                  type="text"
                  value={formData.localisation}
                  onChange={(e) => setFormData({ ...formData, localisation: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ville, Pays"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date d'envoi</label>
                <input
                  type="date"
                  value={formData.dateEnvoi}
                  onChange={(e) => setFormData({ ...formData, dateEnvoi: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <select
                  value={formData.statut}
                  onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prochaine action</label>
                <input
                  type="text"
                  value={formData.prochaineAction}
                  onChange={(e) => setFormData({ ...formData, prochaineAction: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex : Relancer le 15/02"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
                <select
                  value={formData.priorite}
                  onChange={(e) => setFormData({ ...formData, priorite: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {PRIORITY_OPTIONS.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Lien</label>
                <input
                  type="url"
                  value={formData.lienUrl}
                  onChange={(e) => setFormData({ ...formData, lienUrl: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://..."
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Contacts</label>
                <textarea
                  rows={2}
                  value={formData.contacts}
                  onChange={(e) => setFormData({ ...formData, contacts: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nom - email - LinkedIn"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Informations complémentaires"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleCancelForm}
                className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingId ? 'Mettre à jour' : 'Enregistrer'}
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entreprise
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Poste
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priorité
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prochaine action
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedApplications.map((application) => (
                <tr key={application.id} className={getStatusRowColor(application.statut)}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{application.entreprise}</div>
                    <div className="text-sm text-gray-500">{application.localisation}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{application.poste}</div>
                    <div className="text-sm text-gray-500">{application.type}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(application.statut, application.prochaineAction)}`}>
                      {application.statut}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {application.priorite}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {application.prochaineAction || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(application)}
                        className="text-blue-600 hover:text-blue-900"
                        aria-label="Modifier la candidature"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(application)}
                        className="text-red-600 hover:text-red-900"
                        aria-label="Supprimer la candidature"
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
              Aucune candidature ne correspond à vos filtres pour le moment.
            </div>
          )}
        </div>
        {filteredApplications.length > 0 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-600">
              Page {currentPage} sur {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-2 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Première page"
              >
                <ChevronsLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Page précédente"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Page suivante"
              >
                <ChevronRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Dernière page"
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
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
