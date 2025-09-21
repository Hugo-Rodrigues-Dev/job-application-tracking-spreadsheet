export const getStatusColor = (statut, prochaineAction) => {
  if (statut === 'Refusée') return 'bg-red-100 text-red-800';
  if (statut === 'Entretien' || statut === 'Acceptée') return 'bg-green-100 text-green-800';
  if (statut === 'A Envoyer') return 'bg-blue-100 text-blue-800';
  if (statut === 'En cours') return 'bg-orange-100 text-orange-800';

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

export const getStatusRowColor = (statut) => {
  switch (statut) {
    case 'Refusée':
      return 'bg-red-50 border-l-4 border-red-500';
    case 'Entretien':
    case 'Acceptée':
      return 'bg-green-50 border-l-4 border-green-500';
    case 'En cours':
      return 'bg-orange-50 border-l-4 border-orange-500';
    case 'A Envoyer':
      return 'bg-blue-50 border-l-4 border-blue-500';
    default:
      return '';
  }
};
