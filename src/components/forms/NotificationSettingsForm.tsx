// // components/notifications/NotificationSettingsForm.tsx
// import { NotificationSettings } from '@/types'
// import { Settings } from 'lucide-react'
// import { useState, useEffect } from 'react'

// interface NotificationSettingsFormProps {
//   settings?: NotificationSettings
//   onSave: (settings: {
//     licenseAlertDays: number[]
//     equipmentAlertDays: number[]
//     emailEnabled: boolean
//   }) => void
//   isLoading?: boolean
// }

// export function NotificationSettingsForm({ 
//   settings, 
//   onSave, 
//   isLoading = false 
// }: NotificationSettingsFormProps) {
//   const [formData, setFormData] = useState({
//     license_alert_days: [7, 30],
//     equipment_alert_days: [30, 90],
//     email_enabled: true
//   })

//   useEffect(() => {
//     if (settings) {
//       setFormData({
//         license_alert_days: settings.license_alert_days,
//         equipment_alert_days: settings.equipment_alert_days,
//         email_enabled: settings.email_enabled
//       })
//     }
//   }, [settings])

//   const addAlertDay = (type: 'license' | 'equipment') => {
//     const input = prompt(`Ajouter une alerte ${type === 'license' ? 'licence' : 'équipement'} (nombre de jours entre 1 et 365):`)
    
//     if (input) {
//       const day = parseInt(input)
//       if (!isNaN(day) && day > 0 && day <= 365) {
//         const key = type === 'license' ? 'license_alert_days' : 'equipment_alert_days'
//         const currentDays = formData[key]
        
//         if (!currentDays.includes(day)) {
//           setFormData(prev => ({
//             ...prev,
//             [key]: [...currentDays, day].sort((a, b) => a - b)
//           }))
//         } else {
//           alert('Cette alerte existe déjà')
//         }
//       } else {
//         alert('Veuillez entrer un nombre valide entre 1 et 365')
//       }
//     }
//   }

//   const removeAlertDay = (type: 'license' | 'equipment', day: number) => {
//     const key = type === 'license' ? 'license_alert_days' : 'equipment_alert_days'
//     setFormData(prev => ({
//       ...prev,
//       [key]: prev[key].filter(d => d !== day)
//     }))
//   }

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault()
//     onSave({
//       licenseAlertDays: formData.license_alert_days,
//       equipmentAlertDays: formData.equipment_alert_days,
//       emailEnabled: formData.email_enabled
//     })
//   }

//   return (
//     <div className="bg-white rounded-lg border border-gray-200 p-6">
//       <div className="flex items-center gap-2 mb-6">
//         <Settings className="h-5 w-5 text-gray-700" />
//         <h2 className="text-lg font-semibold text-gray-900">Paramètres des notifications</h2>
//       </div>
      
//       <form onSubmit={handleSubmit} className="space-y-6">
//         {/* Notifications par email */}
//         <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
//           <div>
//             <h3 className="text-sm font-medium text-gray-900">Notifications par email</h3>
//             <p className="text-sm text-gray-600">Recevoir les notifications importantes par email</p>
//           </div>
//           <label className="relative inline-flex items-center cursor-pointer">
//             <input
//               type="checkbox"
//               checked={formData.email_enabled}
//               onChange={(e) => setFormData(prev => ({ ...prev, email_enabled: e.target.checked }))}
//               className="sr-only peer"
//             />
//             <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
//           </label>
//         </div>

//         {/* Alertes licences */}
//         <div>
//           <div className="flex items-center justify-between mb-3">
//             <div>
//               <h3 className="text-sm font-medium text-gray-900">Alertes d'expiration des licences</h3>
//               <p className="text-sm text-gray-600">Recevoir des alertes avant l'expiration des licences</p>
//             </div>
//             <button
//               type="button"
//               onClick={() => addAlertDay('license')}
//               className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
//             >
//               + Ajouter
//             </button>
//           </div>
          
//           <div className="flex flex-wrap gap-2">
//             {formData.license_alert_days.map((day) => (
//               <span
//                 key={day}
//                 className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-800"
//               >
//                 {day} jour{day > 1 ? 's' : ''}
//                 <button
//                   type="button"
//                   onClick={() => removeAlertDay('license', day)}
//                   className="ml-2 text-orange-600 hover:text-orange-800"
//                 >
//                   ×
//                 </button>
//               </span>
//             ))}
//             {formData.license_alert_days.length === 0 && (
//               <span className="text-sm text-gray-500 italic">Aucune alerte configurée</span>
//             )}
//           </div>
//         </div>

//         {/* Alertes équipements */}
//         <div>
//           <div className="flex items-center justify-between mb-3">
//             <div>
//               <h3 className="text-sm font-medium text-gray-900">Alertes d'obsolescence des équipements</h3>
//               <p className="text-sm text-gray-600">Recevoir des alertes avant l'obsolescence des équipements</p>
//             </div>
//             <button
//               type="button"
//               onClick={() => addAlertDay('equipment')}
//               className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
//             >
//               + Ajouter
//             </button>
//           </div>
          
//           <div className="flex flex-wrap gap-2">
//             {formData.equipment_alert_days.map((day) => (
//               <span
//                 key={day}
//                 className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-800"
//               >
//                 {day} jour{day > 1 ? 's' : ''}
//                 <button
//                   type="button"
//                   onClick={() => removeAlertDay('equipment', day)}
//                   className="ml-2 text-red-600 hover:text-red-800"
//                 >
//                   ×
//                 </button>
//               </span>
//             ))}
//             {formData.equipment_alert_days.length === 0 && (
//               <span className="text-sm text-gray-500 italic">Aucune alerte configurée</span>
//             )}
//           </div>
//         </div>

//         {/* Bouton de sauvegarde */}
//         <div className="pt-4 border-t border-gray-200">
//           <button
//             type="submit"
//             disabled={isLoading}
//             className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
//           >
//             {isLoading && (
//               <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
//             )}
//             Sauvegarder les paramètres
//           </button>
//         </div>
//       </form>
//     </div>
//   )
// }