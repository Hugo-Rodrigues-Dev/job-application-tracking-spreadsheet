import { X } from 'lucide-react';

const intentClasses = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'border border-gray-200 text-gray-700 hover:bg-gray-50',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
};

const Dialog = ({ open, title, description, actions = [], onClose }) => {
  if (!open) return null;

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose?.();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4"
      onMouseDown={handleOverlayClick}
    >
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl" role="dialog" aria-modal="true">
        <div className="flex items-start justify-between gap-6 border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            {description ? <p className="mt-2 text-sm text-gray-600">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-600"
            aria-label="Fermer le dialogue"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex flex-wrap justify-end gap-3 px-6 py-4">
          {actions.map((action) => {
            const intentClass = intentClasses[action.intent || 'secondary'] || intentClasses.secondary;
            return (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${intentClass} ${
                  action.disabled ? 'opacity-60 cursor-not-allowed' : ''
                }`}
                disabled={action.disabled}
              >
                {action.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dialog;
