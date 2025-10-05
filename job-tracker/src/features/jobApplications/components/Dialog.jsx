import { X } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageProvider';

const intentClasses = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'border border-gray-200 text-gray-700 hover:bg-gray-50',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
};

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

const Dialog = ({
  open,
  title,
  description,
  actions = [],
  onClose,
  children,
  size = 'md',
}) => {
  const { t } = useLanguage();

  if (!open) return null;

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose?.();
    }
  };

  const resolvedSize = sizeClasses[size] || sizeClasses.md;
  const hasChildren = Boolean(children);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 sm:p-6"
      onMouseDown={handleOverlayClick}
    >
      <div
        className={`w-full ${resolvedSize} rounded-xl bg-white shadow-xl flex max-h-[calc(100vh-2rem)] flex-col`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex shrink-0 items-start justify-between gap-6 border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            {description && !children ? (
              <p className="mt-2 text-sm text-gray-600">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-600"
            aria-label={t('aria.closeDialog')}
          >
            <X size={20} />
          </button>
        </div>
        {hasChildren ? (
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {description ? (
              <p className="mb-4 text-sm text-gray-600">{description}</p>
            ) : null}
            {children}
          </div>
        ) : null}
        {actions.length ? (
          <div className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-gray-100 px-6 py-4">
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
        ) : null}
      </div>
    </div>
  );
};

export default Dialog;
