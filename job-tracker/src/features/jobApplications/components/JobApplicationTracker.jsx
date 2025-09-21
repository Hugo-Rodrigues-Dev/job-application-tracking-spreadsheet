import { useCallback, useMemo, useState } from 'react';
import { Plus, Filter, Search, Download, Edit, Trash2 } from 'lucide-react';
import { INITIAL_APPLICATIONS } from '../data/initialApplications';
import { STATUS_OPTIONS, TYPE_OPTIONS, PRIORITY_OPTIONS } from '../constants/options';
import { getStatusColor, getStatusRowColor } from '../utils/styleTokens';
import { loadApplications, saveApplications } from '../utils/storage';

const createEmptyFormData = () => ({
  entreprise: '',
  localisation: '',
  poste: '',
  type: 'Offre',
  lienUrl: '',
  contacts: '',
  dateEnvoi: new Date().toISOString().split('T')[0],
  statut: 'Envoyée',
  prochaineAction: '',
  priorite: 'Moyenne',
  notes: '',
});

const JobApplicationTracker = () => {
  const [applications, setApplications] = useState(() => {
    const storedApplications = loadApplications();
    if (storedApplications && Array.isArray(storedApplications)) {
      return storedApplications;
    }

    saveApplications(INITIAL_APPLICATIONS);
    return INITIAL_APPLICATIONS;
  });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState({ statut: '', priorite: '', type: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState(createEmptyFormData);

  const persistApplications = useCallback((updater) => {
    setApplications((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveApplications(next);
      return next;
    });
  }, []);

  const resetForm = () => {
    setFormData(createEmptyFormData());
  };

  const handleSubmit = () => {
    if (!formData.entreprise || !formData.localisation || !formData.poste) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (editingId) {
      persistApplications((prev) =>
        prev.map((app) => (app.id === editingId ? { ...formData, id: editingId } : app)),
      );
      setEditingId(null);
    } else {
      persistApplications((prev) => [...prev, { ...formData, id: Date.now() }]);
    }

    resetForm();
    setShowForm(false);
  };

  const handleEdit = (application) => {
    setFormData(application);
    setEditingId(application.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    persistApplications((prev) => prev.filter((app) => app.id !== id));
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

  return (
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
                {applications.filter((app) => app.statut === 'Entretien' || app.statut === 'Offre acceptée').length}
              </div>
              <div className="text-sm text-green-600">Entretiens/Offres</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {applications.filter((app) => app.statut === 'En cours' || app.statut === 'Relancée').length}
              </div>
              <div className="text-sm text-orange-600">En cours</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {applications.filter((app) => app.statut === 'Refus').length}
              </div>
              <div className="text-sm text-red-600">Refus</div>
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
            <button className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 flex items-center gap-2 hover:bg-gray-50">
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
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                  setEditingId(null);
                }}
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
              {filteredApplications.map((application) => (
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
                        onClick={() => handleDelete(application.id)}
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
      </div>
    </div>
  );
};

export default JobApplicationTracker;
