import { useState } from 'react';
import { Plus, Edit, Trash2, ExternalLink } from 'lucide-react';

const EMPTY_COMPANY_FORM = { name: '', website: '', notes: '' };

const normalizeWebsite = (website) => {
  if (!website) return '';
  try {
    const hasProtocol = /^(https?:)?\/\//i.test(website);
    const url = new URL(hasProtocol ? website : `https://${website}`);
    return url.href.replace(/\/$/, '');
  } catch {
    return website.trim();
  }
};

const CompaniesBoard = ({
  categories,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
  onAddCompany,
  onUpdateCompany,
  onRemoveCompany,
  t,
}) => {
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [categoryDraft, setCategoryDraft] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [categoryEditDraft, setCategoryEditDraft] = useState('');
  const [activeCompanyForm, setActiveCompanyForm] = useState(null);
  const [companyDraft, setCompanyDraft] = useState(EMPTY_COMPANY_FORM);
  const [companyFormError, setCompanyFormError] = useState('');

  const handleCreateCategory = (event) => {
    event.preventDefault();
    const name = categoryDraft.trim();
    if (!name) return;
    const result = onAddCategory?.(name);
    if (result !== false) {
      setCategoryDraft('');
      setIsAddingCategory(false);
    }
  };

  const handleRenameCategory = (event) => {
    event.preventDefault();
    if (!editingCategoryId) return;
    const name = categoryEditDraft.trim();
    if (!name) return;
    const result = onRenameCategory?.(editingCategoryId, name);
    if (result !== false) {
      setEditingCategoryId(null);
      setCategoryEditDraft('');
    }
  };

  const openCompanyForm = (categoryId, company = null) => {
    if (!categoryId) return;
    setCompanyFormError('');
    setActiveCompanyForm({ categoryId, companyId: company?.id || null });
    setCompanyDraft(
      company
        ? {
            name: company.name || '',
            website: company.website || '',
            notes: company.notes || '',
          }
        : EMPTY_COMPANY_FORM,
    );
  };

  const handleCancelCompanyForm = () => {
    setActiveCompanyForm(null);
    setCompanyDraft(EMPTY_COMPANY_FORM);
    setCompanyFormError('');
  };

  const handleSubmitCompany = (event) => {
    event.preventDefault();
    if (!activeCompanyForm) return;

    const name = companyDraft.name.trim();
    if (!name) {
      setCompanyFormError(t('companies.errors.missingCompanyName'));
      return;
    }

    const payload = {
      name,
      website: normalizeWebsite(companyDraft.website.trim()),
      notes: companyDraft.notes.trim(),
    };

    const isEditing = Boolean(activeCompanyForm.companyId);
    const result = isEditing
      ? onUpdateCompany?.(activeCompanyForm.categoryId, activeCompanyForm.companyId, payload)
      : onAddCompany?.(activeCompanyForm.categoryId, payload);

    if (result !== false) {
      handleCancelCompanyForm();
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm transition-colors">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('companies.title')}</h1>
          <p className="mt-2 max-w-2xl text-gray-600">{t('companies.subtitle')}</p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          {isAddingCategory ? (
            <form onSubmit={handleCreateCategory} className="flex w-full gap-2 sm:w-auto">
              <input
                autoFocus
                type="text"
                value={categoryDraft}
                onChange={(event) => setCategoryDraft(event.target.value)}
                placeholder={t('companies.newCategoryPlaceholder')}
                className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  <Plus size={16} />
                  {t('companies.actions.add')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCategoryDraft('');
                    setIsAddingCategory(false);
                  }}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingCategory(true)}
              className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              <Plus size={18} />
              {t('companies.actions.addCategory')}
            </button>
          )}
          <p className="text-xs text-gray-500">{t('companies.help.addCategory')}</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {categories.map((category) => {
          const isEditingCategory = editingCategoryId === category.id;
          const isEditingCompany =
            activeCompanyForm && activeCompanyForm.categoryId === category.id;

          return (
            <div
              key={category.id}
              className="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                {isEditingCategory ? (
                  <form onSubmit={handleRenameCategory} className="flex flex-1 gap-2">
                    <input
                      autoFocus
                      type="text"
                      value={categoryEditDraft}
                      onChange={(event) => setCategoryEditDraft(event.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                    >
                      {t('companies.actions.save')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategoryId(null);
                        setCategoryEditDraft('');
                      }}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
                    >
                      {t('common.cancel')}
                    </button>
                  </form>
                ) : (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{category.displayName}</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      {t('companies.labels.count', { count: category.companies.length })}
                    </p>
                  </div>
                )}
                {!isEditingCategory && (
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategoryId(category.id);
                        setCategoryEditDraft(category.displayName || '');
                      }}
                      className="rounded-full border border-gray-200 p-2 text-gray-500 transition-colors hover:bg-gray-50 hover:text-blue-600"
                      aria-label={t('companies.actions.rename')}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteCategory?.(category)}
                      className="rounded-full border border-gray-200 p-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
                      aria-label={t('companies.actions.deleteCategory')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-4 flex-1 space-y-3">
                {category.companies.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 p-4 text-sm text-gray-500">
                    {t('companies.emptyCategory')}
                  </p>
                ) : (
                  category.companies.map((company) => (
                    <div
                      key={company.id}
                      className="group flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white/80 p-4 transition-shadow hover:shadow-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-base font-semibold text-gray-900">
                            {company.name}
                          </h3>
                          {company.website ? (
                            <a
                              href={company.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100"
                            >
                              <ExternalLink size={14} />
                              {t('companies.actions.visitWebsite')}
                            </a>
                          ) : null}
                        </div>
                        {company.notes ? (
                          <p className="mt-2 text-sm text-gray-600 break-words">{company.notes}</p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => openCompanyForm(category.id, company)}
                          className="rounded-full border border-gray-200 p-2 text-gray-500 transition-colors hover:bg-gray-50 hover:text-blue-600"
                          aria-label={t('companies.actions.editCompany')}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemoveCompany?.(category, company)}
                          className="rounded-full border border-gray-200 p-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
                          aria-label={t('companies.actions.deleteCompany')}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {isEditingCompany ? (
                <form onSubmit={handleSubmitCompany} className="mt-5 space-y-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      {t('companies.form.companyLabel')}
                    </label>
                    <input
                      type="text"
                      value={companyDraft.name}
                      onChange={(event) => setCompanyDraft((prev) => ({ ...prev, name: event.target.value }))}
                      placeholder={t('companies.form.companyPlaceholder')}
                      className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      {t('companies.form.websiteLabel')}
                    </label>
                    <input
                      type="url"
                      value={companyDraft.website}
                      onChange={(event) => setCompanyDraft((prev) => ({ ...prev, website: event.target.value }))}
                      placeholder={t('companies.form.websitePlaceholder')}
                      className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">{t('companies.help.websiteHint')}</p>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      {t('companies.form.notesLabel')}
                    </label>
                    <textarea
                      rows={2}
                      value={companyDraft.notes}
                      onChange={(event) => setCompanyDraft((prev) => ({ ...prev, notes: event.target.value }))}
                      placeholder={t('companies.form.notesPlaceholder')}
                      className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {companyFormError ? (
                    <p className="text-sm text-red-600">{companyFormError}</p>
                  ) : null}
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleCancelCompanyForm}
                      className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      type="submit"
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                    >
                      {activeCompanyForm.companyId
                        ? t('companies.actions.updateCompany')
                        : t('companies.actions.saveCompany')}
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => openCompanyForm(category.id)}
                  className="mt-5 flex items-center justify-center gap-2 rounded-lg border border-dashed border-blue-300 px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50"
                >
                  <Plus size={16} />
                  {t('companies.actions.addCompany')}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default CompaniesBoard;
