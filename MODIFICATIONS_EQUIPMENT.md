# Modifications à faire pour equipment/route.ts

## Résumé des changements
Pour que les clients ne voient pas "Client: [ID]" dans leurs rapports, il faut ajouter le paramètre `isClientUser` et filtrer l'affichage du client.

## Modifications à effectuer:

### 1. Ligne ~131-135 (case 'pdf'):
**AVANT:**
```typescript
      case 'pdf':
        return await generatePDFReport(reportData, fontBuffer, {
          title: 'Rapport des Équipements',
          user: user.first_name || user.email,
          filters: { clientId, status, type, dateFrom, dateTo }
        });
```

**APRÈS:**
```typescript
      case 'pdf':
        return await generatePDFReport(reportData, fontBuffer, {
          title: 'Rapport des Équipements',
          user: user.first_name || user.email,
          filters: { clientId, status, type, dateFrom, dateTo },
          isClientUser: !checker.canViewAllData()
        });
```

### 2. Ligne ~137-141 (case 'excel'):
**AVANT:**
```typescript
      case 'excel':
        return await generateExcelReport(reportData, {
          title: 'Rapport des Équipements',
          user: user.first_name || user.email,
          filters: { clientId, status, type, dateFrom, dateTo }
        });
```

**APRÈS:**
```typescript
      case 'excel':
        return await generateExcelReport(reportData, {
          title: 'Rapport des Équipements',
          user: user.first_name || user.email,
          filters: { clientId, status, type, dateFrom, dateTo },
          isClientUser: !checker.canViewAllData()
        });
```

### 3. Ligne ~205-211 (interface generateExcelReport):
**AVANT:**
```typescript
async function generateExcelReport(
  data: EquipmentReportData[],
  options: {
    title: string;
    user: string;
    filters: Record<string, string | null>;
  }
): Promise<NextResponse> {
```

**APRÈS:**
```typescript
async function generateExcelReport(
  data: EquipmentReportData[],
  options: {
    title: string;
    user: string;
    filters: Record<string, string | null>;
    isClientUser?: boolean;
  }
): Promise<NextResponse> {
```

### 4. Ligne ~400-417 (filtres Excel):
**AVANT:**
```typescript
  if (Object.values(options.filters).some(v => v)) {
    statsSheet.addRow([]);
    statsSheet.addRow(['Filtres appliqués']).font = { bold: true, size: 14 };
    
    const filterLabels: Record<string, string> = {
      clientId: 'Client',
      status: 'Statut',
      type: 'Type',
      dateFrom: 'Date de début (obsolescence)',
      dateTo: 'Date de fin (obsolescence)'
    };

    Object.entries(options.filters).forEach(([key, value]) => {
      if (value) {
        statsSheet.addRow([filterLabels[key], value]);
      }
    });
  }
```

**APRÈS:**
```typescript
  const filtersToShow = Object.entries(options.filters).filter(([key, value]) => {
    if (!value) return false;
    if (key === 'clientId' && options.isClientUser) return false;
    return true;
  });

  if (filtersToShow.length > 0) {
    statsSheet.addRow([]);
    statsSheet.addRow(['Filtres appliqués']).font = { bold: true, size: 14 };
    
    const filterLabels: Record<string, string> = {
      clientId: 'Client',
      status: 'Statut',
      type: 'Type',
      dateFrom: 'Date de début (obsolescence)',
      dateTo: 'Date de fin (obsolescence)'
    };

    filtersToShow.forEach(([key, value]) => {
      statsSheet.addRow([filterLabels[key], value]);
    });
  }
```

### 5. Ligne ~431-438 (interface generatePDFReport):
**AVANT:**
```typescript
async function generatePDFReport(
  data: EquipmentReportData[], 
  fontBuffer: Buffer,
  options: {
    title: string;
    user: string;
    filters: Record<string, string | null>;
  }
): Promise<NextResponse> {
```

**APRÈS:**
```typescript
async function generatePDFReport(
  data: EquipmentReportData[], 
  fontBuffer: Buffer,
  options: {
    title: string;
    user: string;
    filters: Record<string, string | null>;
    isClientUser?: boolean;
  }
): Promise<NextResponse> {
```

### 6. Ligne ~492-507 (filtres PDF):
**AVANT:**
```typescript
    if (Object.values(options.filters).some(v => v)) {
      doc.fontSize(14).fillColor(colors.text).text('Filtres appliqués:', { underline: true });
      doc.moveDown(0.3);
      Object.entries(options.filters).forEach(([key, value]) => {
        if (value) {
          const filterLabels: Record<string, string> = {
            clientId: 'Client',
            status: 'Statut',
            type: 'Type',
            dateFrom: 'Date de début (obsolescence)',
            dateTo: 'Date de fin (obsolescence)'
          };
          doc.fontSize(10).fillColor(colors.secondary).text(`${filterLabels[key]}: ${value}`);
        }
      });
      doc.moveDown(1);
    }
```

**APRÈS:**
```typescript
    const filtersToShow = Object.entries(options.filters).filter(([key, value]) => {
      if (!value) return false;
      if (key === 'clientId' && options.isClientUser) return false;
      return true;
    });

    if (filtersToShow.length > 0) {
      doc.fontSize(14).fillColor(colors.text).text('Filtres appliqués:', { underline: true });
      doc.moveDown(0.3);
      const filterLabels: Record<string, string> = {
        clientId: 'Client',
        status: 'Statut',
        type: 'Type',
        dateFrom: 'Date de début (obsolescence)',
        dateTo: 'Date de fin (obsolescence)'
      };
      filtersToShow.forEach(([key, value]) => {
        doc.fontSize(10).fillColor(colors.secondary).text(`${filterLabels[key]}: ${value}`);
      });
      doc.moveDown(1);
    }
```

## Résultat
Après ces modifications:
- ✅ Le fichier `licenses/route.ts` est déjà corrigé
- ⏳ Le fichier `equipment/route.ts` nécessite ces modifications
- ✅ La page de rapports affiche maintenant la somme des valeurs licences + équipements

Quand un client génère un rapport, la ligne "Client: [ID]" ne s'affichera plus dans les documents PDF et Excel.
