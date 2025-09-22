// app/Equipment/new/page.tsx - Page de création d'une nouvelle Equipment
'use client'

import EquipmentFormPage from '@/components/forms/EquipmentFormPage'
import { useAuthPermissions } from '@/hooks'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'

export default function NewEquipmentPage() {
  const permissions = useAuthPermissions()
  const canCreateEquipment = permissions.can('create', 'equipment')
  if (!canCreateEquipment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Vous n&apos;avez pas les permissions pour créer un équipement.</AlertDescription>
        </Alert>
      </div>
    )
  }
  // Si l'utilisateur a les permissions, on rend le formulaire
  return <EquipmentFormPage />
}