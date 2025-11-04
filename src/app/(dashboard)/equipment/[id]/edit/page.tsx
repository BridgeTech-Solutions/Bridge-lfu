
// src/app/equipment/[id]/edit/page.tsx
'use client'

import { useParams } from 'next/navigation'
import EquipmentFormPage from '@/components/forms/EquipmentFormPage'
import { useAuthPermissions } from '@/hooks/index'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'

export default function EditEquipmentPageWrapper() {
  const params = useParams()
  const equipmentId = params?.id as string
  const permissions = useAuthPermissions()
  const canUpdateEquipment = permissions.can('update', 'equipment')

  // Logique de permission placée AVANT le composant enfant
  if (!canUpdateEquipment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Vous n&apos;avez pas les permissions pour modifier cet équipement.</AlertDescription>
        </Alert>
      </div>
    )
  }

  // Si l'utilisateur a les permissions, on rend le formulaire
  return <EquipmentFormPage equipmentId={equipmentId} />
}