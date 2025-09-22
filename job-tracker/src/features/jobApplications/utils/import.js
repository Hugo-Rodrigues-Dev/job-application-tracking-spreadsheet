import { read, utils, SSF } from 'xlsx';

const HEADER_LOOKUP = {
  entreprise: 'entreprise',
  "nom de l'entreprise": 'entreprise',
  company: 'entreprise',
  poste: 'poste',
  position: 'poste',
  localisation: 'localisation',
  location: 'localisation',
  type: 'type',
  "type d'offre": 'type',
  "date d'envoi": 'dateEnvoi',
  date: 'dateEnvoi',
  statut: 'statut',
  status: 'statut',
  priorité: 'priorite',
  priorite: 'priorite',
  priority: 'priorite',
  "prochaine action": 'prochaineAction',
  followup: 'prochaineAction',
  contacts: 'contacts',
  contact: 'contacts',
  lien: 'lienUrl',
  url: 'lienUrl',
  link: 'lienUrl',
  notes: 'notes',
  commentaires: 'notes',
};

const REQUIRED_FIELDS = ['entreprise', 'localisation', 'poste'];
const normalizeHeaderKey = (header) => header?.toString().trim().toLowerCase();

const normalizeString = (value) =>
  value === undefined || value === null ? '' : value.toString().trim();

const convertToISODate = (value) => {
  if (!value) return '';
  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    const parsed = SSF.parse_date_code(value);
    if (parsed) {
      const date = new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
      if (!Number.isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
  }
  const fromString = new Date(value);
  if (!Number.isNaN(fromString.getTime())) {
    return fromString.toISOString().split('T')[0];
  }
  return normalizeString(value);
};

const mapRowToApplication = (row) => {
  const application = {};
  Object.entries(row).forEach(([header, value]) => {
    const normalizedHeader = normalizeHeaderKey(header);
    const key = HEADER_LOOKUP[normalizedHeader];
    if (!key) return;
    if (key === 'dateEnvoi') {
      application[key] = convertToISODate(value);
      return;
    }
    application[key] = normalizeString(value);
  });
  return application;
};

const isRowEmpty = (application) => {
  return !Object.values(application).some((value) => value && value.toString().trim().length > 0);
};

const hasRequiredFields = (application) =>
  REQUIRED_FIELDS.every((field) => normalizeString(application[field]).length > 0);

export const importApplicationsFromExcel = async (file) => {
  if (!file) throw new Error('No file provided');

  const buffer = await file.arrayBuffer();
  const workbook = read(buffer, { type: 'array' });
  if (!workbook.SheetNames.length) throw new Error('The workbook is empty');

  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!worksheet) throw new Error('Could not read the first worksheet');

  const rows = utils.sheet_to_json(worksheet, { defval: '', raw: false });

  const imported = [];
  let skippedEmpty = 0;
  let skippedMissingFields = 0;

  rows.forEach((row) => {
    const application = mapRowToApplication(row);
    if (isRowEmpty(application)) {
      skippedEmpty += 1;
      return;
    }
    if (!hasRequiredFields(application)) {
      skippedMissingFields += 1;
      return;
    }
    imported.push(application);
  });

  return {
    imported,
    skippedEmpty,
    skippedMissingFields,
  };
};
