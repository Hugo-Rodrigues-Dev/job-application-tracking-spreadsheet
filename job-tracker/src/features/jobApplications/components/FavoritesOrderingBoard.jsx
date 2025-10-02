import { useState } from 'react';
import { ChevronLeft, GripVertical } from 'lucide-react';
import { getStatusColor, getStatusRowColor } from '../utils/styleTokens';

const findIndexById = (list, id) => list.findIndex((item) => String(item.id) === String(id));

const FavoritesOrderingBoard = ({
  applications,
  onBack,
  onReorder,
  translateStatus,
  translateType,
  t,
}) => {
  const [draggedId, setDraggedId] = useState(null);

  const handleDragStart = (event, id) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(id));
    setDraggedId(id);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'move';
  };

  const applyReorder = (sourceId, targetIndex) => {
    if (!onReorder) return;

    const ordered = [...applications];
    const sourceIndex = findIndexById(ordered, sourceId);
    if (sourceIndex === -1) {
      return;
    }

    const [moved] = ordered.splice(sourceIndex, 1);
    const boundedIndex = Math.max(0, Math.min(targetIndex, ordered.length));
    ordered.splice(boundedIndex, 0, moved);
    onReorder(ordered.map((item) => item.id));
  };

  const handleDropOnRow = (event, targetId) => {
    event.preventDefault();
    event.stopPropagation();
    const sourceId = event.dataTransfer.getData('text/plain');
    const targetIndex = findIndexById(applications, targetId);
    applyReorder(sourceId, targetIndex);
    handleDragEnd();
  };

  const handleDropAtEnd = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const sourceId = event.dataTransfer.getData('text/plain');
    applyReorder(sourceId, applications.length);
    handleDragEnd();
  };

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">{t('favoritesBoard.title')}</h2>
          <p className="mt-1 text-sm text-slate-500">{t('favoritesBoard.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <ChevronLeft size={16} />
            {t('favoritesBoard.backToList')}
          </button>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-12 text-center text-slate-500">
          {t('favoritesBoard.empty')}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white/95">
          <table className="min-w-full" onDragOver={handleDragOver} onDrop={handleDropAtEnd}>
            <thead className="bg-gray-50">
              <tr>
                <th className="w-14 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
                  {t('favoritesBoard.orderLabel')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  {t('table.headers.company')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  {t('table.headers.position')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  {t('filters.typeLabel')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  {t('table.headers.status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  {t('form.labels.location')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {applications.map((application) => {
                const isDragging = String(application.id) === String(draggedId);
                return (
                  <tr
                    key={application.id}
                    draggable
                    onDragStart={(event) => handleDragStart(event, application.id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    onDrop={(event) => handleDropOnRow(event, application.id)}
                    className={`${getStatusRowColor(application.statut)} transition-colors ${
                      isDragging ? 'opacity-75 ring-2 ring-blue-400' : ''
                    }`}
                    aria-grabbed={isDragging}
                  >
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2 text-sm font-medium text-slate-500">
                        <GripVertical size={16} className="text-slate-400" />
                        {(application.favoriteRank ?? 0) + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{application.entreprise}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{application.poste}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {translateType(application.type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex items-center text-xs font-semibold leading-5 rounded-full ${getStatusColor(
                          application.statut,
                          application.prochaineAction,
                        )}`}
                      >
                        {translateStatus(application.statut)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {application.localisation || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default FavoritesOrderingBoard;
