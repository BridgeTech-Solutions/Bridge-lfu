# Script pour corriger les en-têtes Excel dans les rapports

$licensesFile = "c:\Users\cruzj\Desktop\nextjs\bridge-lfu\src\app\api\reports\licenses\route.ts"
$equipmentFile = "c:\Users\cruzj\Desktop\nextjs\bridge-lfu\src\app\api\reports\equipment\route.ts"

Write-Host "Correction du fichier licenses..." -ForegroundColor Cyan

# Lire le contenu du fichier licenses
$content = Get-Content $licensesFile -Raw -Encoding UTF8

# Remplacer la section problématique pour licenses
$oldPattern = @'
  worksheet.columns = [
    { header: 'Nom de la licence', key: 'name', width: 30 },
    { header: 'Éditeur', key: 'editor', width: 20 },
    { header: 'Client', key: 'client_name', width: 25 },
    { header: 'Version', key: 'version', width: 15 },
    { header: 'Date d\'expiration', key: 'expiry_date', width: 18 },
    { header: 'Statut', key: 'status', width: 18 },
    { header: 'Coût (FCFA)', key: 'cost', width: 15 },
    { header: 'Jours restants', key: 'days_until_expiry', width: 15 },
    { header: 'Date de création', key: 'created_at', width: 18 }
  ];

  worksheet.mergeCells('A1:I1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = options.title;
  titleCell.font = { size: 18, bold: true, color: { argb: '2563eb' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'f8fafc' }
  };

  worksheet.mergeCells('A2:I2');
  const infoCell = worksheet.getCell('A2');
  infoCell.value = `Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')} par ${options.user}`;
  infoCell.font = { size: 10, italic: true, color: { argb: '64748b' } };
  infoCell.alignment = { horizontal: 'center' };

  worksheet.addRow([]);

  const headerRow = worksheet.getRow(4);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '2563eb' }
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 25;
'@

$newPattern = @'
  // Définir les largeurs de colonnes sans les en-têtes automatiques
  worksheet.columns = [
    { key: 'name', width: 30 },
    { key: 'editor', width: 20 },
    { key: 'client_name', width: 25 },
    { key: 'version', width: 15 },
    { key: 'expiry_date', width: 18 },
    { key: 'status', width: 18 },
    { key: 'cost', width: 15 },
    { key: 'days_until_expiry', width: 15 },
    { key: 'created_at', width: 18 }
  ];

  // Ligne 1: Titre
  worksheet.mergeCells('A1:I1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = options.title;
  titleCell.font = { size: 18, bold: true, color: { argb: '2563eb' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'f8fafc' }
  };

  // Ligne 2: Informations de génération
  worksheet.mergeCells('A2:I2');
  const infoCell = worksheet.getCell('A2');
  infoCell.value = `Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')} par ${options.user}`;
  infoCell.font = { size: 10, italic: true, color: { argb: '64748b' } };
  infoCell.alignment = { horizontal: 'center' };

  // Ligne 3: Vide
  worksheet.addRow([]);

  // Ligne 4: En-têtes de colonnes
  const headerRow = worksheet.addRow([
    'Nom de la licence',
    'Éditeur',
    'Client',
    'Version',
    'Date d\'expiration',
    'Statut',
    'Coût (FCFA)',
    'Jours restants',
    'Date de création'
  ]);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '2563eb' }
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 25;
'@

$content = $content -replace [regex]::Escape($oldPattern), $newPattern

# Corriger aussi le ySplit
$content = $content -replace "views: \[\{ state: 'frozen', xSplit: 0, ySplit: 3 \}\]", "views: [{ state: 'frozen', xSplit: 0, ySplit: 4 }]"

# Sauvegarder le fichier licenses
Set-Content $licensesFile -Value $content -Encoding UTF8 -NoNewline

Write-Host "✓ Fichier licenses corrigé" -ForegroundColor Green

Write-Host "`nCorrection du fichier equipment..." -ForegroundColor Cyan

# Lire le contenu du fichier equipment
$content2 = Get-Content $equipmentFile -Raw -Encoding UTF8

# Remplacer la section problématique pour equipment
$oldPattern2 = @'
  // 1. Ajout de la colonne 'days_until_end_of_sale' et ajustement de la largeur des autres colonnes
  worksheet.columns = [
    { header: 'Nom de l\'équipement', key: 'name', width: 30 },
    { header: 'Type', key: 'type', width: 15 },
    { header: 'Marque', key: 'brand', width: 18 },
    { header: 'Modèle', key: 'model', width: 20 },
    { header: 'N° série', key: 'serial_number', width: 20 }, // Ajout de la colonne N° série
    { header: 'Client', key: 'client_name', width: 25 },
    { header: 'Date d\'achat', key: 'purchase_date', width: 18 },
    { header: 'Date obsolescence', key: 'estimated_obsolescence_date', width: 20 },
    { header: 'Fin de vente', key: 'end_of_sale', width: 18 },
    { header: 'Statut', key: 'status', width: 18 },
    { header: 'Coût (FCFA)', key: 'cost', width: 15 },
    { header: 'Jours restants (Obsol.)', key: 'days_until_obsolescence', width: 18 },
    { header: 'Jours restants (Fin Vente)', key: 'days_until_end_of_sale', width: 18 } // Ajout de la colonne Jours restants (Fin Vente)
  ];

  // 2. Fusion des cellules du titre et des informations pour la nouvelle largeur (A1:M1 et A2:M2)
  const totalColumns = worksheet.columns.length;
  const lastColumnLetter = String.fromCharCode(65 + totalColumns - 1); // 65 est 'A'
  
  worksheet.mergeCells(`A1:${lastColumnLetter}1`);
  const titleCell = worksheet.getCell('A1');
  titleCell.value = options.title;
  titleCell.font = { size: 18, bold: true, color: { argb: '059669' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'f8fafc' }
  };

  worksheet.mergeCells(`A2:${lastColumnLetter}2`);
  const infoCell = worksheet.getCell('A2');
  infoCell.value = `Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')} par ${options.user}`;
  infoCell.font = { size: 10, italic: true, color: { argb: '64748b' } };
  infoCell.alignment = { horizontal: 'center' };

  worksheet.addRow([]); // Ligne vide

  const headerRow = worksheet.getRow(4);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '059669' }
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  headerRow.height = 40; // Augmentation de la hauteur pour le texte wrappé
'@

$newPattern2 = @'
  // Définir les largeurs de colonnes sans les en-têtes automatiques
  worksheet.columns = [
    { key: 'name', width: 30 },
    { key: 'type', width: 15 },
    { key: 'brand', width: 18 },
    { key: 'model', width: 20 },
    { key: 'serial_number', width: 20 },
    { key: 'client_name', width: 25 },
    { key: 'purchase_date', width: 18 },
    { key: 'estimated_obsolescence_date', width: 20 },
    { key: 'end_of_sale', width: 18 },
    { key: 'status', width: 18 },
    { key: 'cost', width: 15 },
    { key: 'days_until_obsolescence', width: 18 },
    { key: 'days_until_end_of_sale', width: 18 }
  ];

  // Calculer la dernière colonne pour les fusions
  const totalColumns = worksheet.columns.length;
  const lastColumnLetter = String.fromCharCode(65 + totalColumns - 1); // 65 est 'A'
  
  // Ligne 1: Titre
  worksheet.mergeCells(`A1:${lastColumnLetter}1`);
  const titleCell = worksheet.getCell('A1');
  titleCell.value = options.title;
  titleCell.font = { size: 18, bold: true, color: { argb: '059669' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'f8fafc' }
  };

  // Ligne 2: Informations de génération
  worksheet.mergeCells(`A2:${lastColumnLetter}2`);
  const infoCell = worksheet.getCell('A2');
  infoCell.value = `Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')} par ${options.user}`;
  infoCell.font = { size: 10, italic: true, color: { argb: '64748b' } };
  infoCell.alignment = { horizontal: 'center' };

  // Ligne 3: Vide
  worksheet.addRow([]);

  // Ligne 4: En-têtes de colonnes
  const headerRow = worksheet.addRow([
    'Nom de l\'équipement',
    'Type',
    'Marque',
    'Modèle',
    'N° série',
    'Client',
    'Date d\'achat',
    'Date obsolescence',
    'Fin de vente',
    'Statut',
    'Coût (FCFA)',
    'Jours restants (Obsol.)',
    'Jours restants (Fin Vente)'
  ]);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '059669' }
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  headerRow.height = 40;
'@

$content2 = $content2 -replace [regex]::Escape($oldPattern2), $newPattern2

# Corriger aussi le ySplit pour equipment
$content2 = $content2 -replace "views: \[\{ state: 'frozen', xSplit: 0, ySplit: 3 \}\]", "views: [{ state: 'frozen', xSplit: 0, ySplit: 4 }]"

# Sauvegarder le fichier equipment
Set-Content $equipmentFile -Value $content2 -Encoding UTF8 -NoNewline

Write-Host "✓ Fichier equipment corrigé" -ForegroundColor Green

Write-Host "`n✓ Correction terminee avec succes!" -ForegroundColor Green
Write-Host "`nLes en-tetes de tableau Excel sont maintenant visibles dans les deux fichiers de rapports." -ForegroundColor Cyan
