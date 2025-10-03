import { utils, writeFile } from 'xlsx';

const EXPORT_COLUMNS = [
  ['Entreprise', 'entreprise'],
  ['Poste', 'poste'],
  ['Localisation', 'localisation'],
  ['Type', 'type'],
  ["Date d'envoi", 'dateEnvoi'],
  ['Statut', 'statut'],
  ['Prochaine action', 'prochaineAction'],
  ['Contacts', 'contacts'],
  ['Lien', 'lienUrl'],
  ['Notes', 'notes'],
];

const sanitizeValue = (value) => {
  if (value === null || value === undefined || value === '') return '';
  return value;
};

export const exportApplicationsToExcel = (applications) => {
  const safeApplications = Array.isArray(applications) ? applications : [];

  const rows = safeApplications.map((app) =>
    EXPORT_COLUMNS.map(([, key]) => sanitizeValue(app[key])),
  );

  const worksheetData = [EXPORT_COLUMNS.map(([label]) => label), ...rows];
  const worksheet = utils.aoa_to_sheet(worksheetData);
  const workbook = utils.book_new();

  utils.book_append_sheet(workbook, worksheet, 'Candidatures');
  writeFile(workbook, 'job-applications.xlsx');
};
