'use client'

import EquipmentDetailPage from "@/components/pages/EquipmentDetailPage";
import { useParams } from 'next/navigation'

export default function Page() {
  const params = useParams()
  const equipmentId = params.id as string
  return <EquipmentDetailPage equipmentId={equipmentId} />
}
