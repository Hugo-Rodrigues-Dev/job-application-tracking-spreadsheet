export const getStatusColor = (statut, prochaineAction) => {
  if (statut === 'Refus') return 'bg-red-100 text-red-800';
  if (statut === 'Entretien' || statut === 'Offre acceptée') return 'bg-green-100 text-green-800';

  if (prochaineAction && prochaineAction.includes('relancer')) {
    const dateMatch = prochaineAction.match(/(\d{2}\/\d{2}\/\d{4})/);
    if (dateMatch) {
      const relanceDate = new Date(dateMatch[1].split('/').reverse().join('-'));
      const today = new Date();
      const diffTime = relanceDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 3 && diffDays >= 0) return 'bg-orange-100 text-orange-800';
    }
  }

  return 'bg-gray-100 text-gray-800';
};

export const getPriorityColor = (priorite) => {
  switch (priorite) {
    case 'Haute':
      return 'bg-red-50 border-l-4 border-red-500';
    case 'Moyenne':
      return 'bg-yellow-50 border-l-4 border-yellow-500';
    case 'Basse':
      return 'bg-green-50 border-l-4 border-green-500';
    default:
      return '';
  }
};
