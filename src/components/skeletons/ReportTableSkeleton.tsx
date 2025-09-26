import React from 'react';

// Composant de base pour un bloc de chargement animé
function Skeleton({ className }: { className?: string }) {
  // Utilise les classes Tailwind pour le fond gris, les coins arrondis et l'animation 'pulse'
  return <div className={`bg-gray-200 rounded animate-pulse ${className}`} />;
}

// ----------------------------------------------------------------------------------

/**
 * Composant Skeleton pour le tableau d'aperçu du rapport.
 * Simule la structure des lignes et colonnes en attente du chargement des données.
 * @param count - Nombre de lignes à afficher (défaut: 5)
 * @param columns - Nombre de colonnes à simuler (défaut: 7)
 */
function ReportTableSkeleton({ count = 5, columns = 7 }: { count?: number, columns?: number }) {
  const skeletonRows = Array.from({ length: count }).map((_, rowIndex) => (
    <tr key={rowIndex}>
      {/* Génère les cellules pour chaque colonne */}
      {Array.from({ length: columns }).map((_, colIndex) => (
        <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
          {/*
            La première colonne (index 0) est plus large pour simuler le nom/titre.
            Les autres sont de largeur moyenne.
          */}
          <Skeleton 
            className={`h-4 ${colIndex === 0 ? 'w-3/4' : 'w-1/2'}`} 
          />
        </td>
      ))}
    </tr>
  ));

  // Simule les en-têtes pour les deux types de rapports pour une flexibilité maximale
  const getHeaderTitles = (cols: number) => {
    // Si c'est pour les licences (7 colonnes max)
    if (cols >= 7) {
        return ['Nom', 'Éditeur', 'Client', 'Expiration', 'Statut', 'Coût', 'Jours restants'];
    } 
    // Si c'est pour les équipements (6 colonnes max avec client)
    if (cols >= 6) {
        return ['Nom', 'Type', 'Marque', 'Client', 'Statut', 'Obsolescence'];
    }
    // Par défaut
    return Array.from({ length: cols }, (_, i) => `Colonne ${i + 1}`);
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {/* Affiche les titres génériques ou spécifiques basés sur le nombre de colonnes */}
            {getHeaderTitles(columns).slice(0, columns).map((title, index) => (
                <th 
                    key={index} 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                    {title}
                </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {skeletonRows}
        </tbody>
      </table>
    </div>
  );
}

export { ReportTableSkeleton, Skeleton }; // Exportez les deux composants