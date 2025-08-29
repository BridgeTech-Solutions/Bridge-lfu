'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Edit, Trash2, Upload, Calendar, DollarSign, Key,
  AlertTriangle, CheckCircle, XCircle, Clock, FileText, Download
} from 'lucide-react';

export default function LicenseDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [license, setLicense] = useState<any>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState('other');
  const [uploading, setUploading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  useEffect(() => {
    fetch(`/api/licenses/${id}`).then(res => res.json()).then(setLicense);
    fetch(`/api/licenses/${id}/attachments`).then(res => res.json()).then(setAttachments);
  }, [id]);

  const formatDate = (date: string) =>
    date ? new Date(date).toLocaleDateString('fr-FR') : '—';

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' }).format(amount);

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const getDaysUntilExpiry = (date: string) => {
    const expiry = new Date(date).getTime();
    const today = Date.now();
    return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  };
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('file_type', fileType);

    const res = await fetch(`/api/licenses/${id}/attachments`, {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const newAttachment = await res.json();
      setAttachments(prev => [newAttachment, ...prev]);
      setSelectedFile(null);
      setFileType('other');
      setShowUploadDialog(false);
    }

    setUploading(false);
  };

  if (!license) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <XCircle className="w-10 h-10 mb-2 text-red-500" />
        <p className="text-lg font-semibold">Licence non trouvée</p>
        <button
          onClick={() => router.push('/licenses')}
          className="mt-4 px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
        >
          Retour aux licences
        </button>
      </div>
    );
  }

  const daysUntilExpiry = getDaysUntilExpiry(license.expiry_date);

  return (
    <div className="p-6 space-y-6 relative">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-black"
          >
            <ArrowLeft size={16} />
            Retour
          </button>
          <div>
            <h1 className="text-2xl font-bold">{license.name}</h1>
            <p className="text-gray-500">
              {license.editor} • Version {license.version} • Statut : {license.status}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowUploadDialog(true)} className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
            <Upload size={16} className="inline-block mr-1" />
            Ajouter un fichier
          </button>
          <button onClick={() => router.push(`/licenses/${id}/edit`)} className="px-3 py-1.5 border rounded text-sm">
            <Edit size={16} className="inline-block mr-1" />
            Modifier
          </button>
        </div>
      </div>
      {/* Grille principale */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations générales */}
          <div className="border rounded p-6 bg-white space-y-4">
            <h2 className="text-lg font-semibold text-gray-700">Informations générales</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div><strong>Nom :</strong> {license.name}</div>
              <div><strong>Éditeur :</strong> {license.editor}</div>
              <div><strong>Version :</strong> {license.version}</div>
              <div><strong>Client :</strong> {license.client_name || '—'}</div>
              <div><strong>Créé par :</strong> {license.created_by_name || '—'}</div>
              <div><strong>Statut :</strong> {license.status}</div>
              {license.license_key && (
                <div className="md:col-span-2">
                  <strong>Clé :</strong>
                  <div className="mt-1 p-2 bg-gray-50 rounded border font-mono text-sm">{license.license_key}</div>
                </div>
              )}
              {license.description && (
                <div className="md:col-span-2">
                  <strong>Description :</strong>
                  <p className="whitespace-pre-wrap mt-1">{license.description}</p>
                </div>
              )}
            </div>
          </div>
          {/* Pièces jointes */}
          <section className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
  <div className="flex items-center justify-between">
    <h2 className="text-lg font-semibold text-gray-700">
      Pièces jointes ({attachments.length})
    </h2>
    <button
      onClick={() => setShowUploadDialog(true)}
      className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 text-sm"
    >
      <Upload size={16} />
      Ajouter un fichier
    </button>
  </div>

  {attachments.length === 0 ? (
    <p className="text-sm text-gray-500">Aucune pièce jointe pour cette licence.</p>
  ) : (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm border">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left p-2 whitespace-nowrap">Nom</th>
            <th className="text-left p-2 whitespace-nowrap">Type</th>
            <th className="text-left p-2 whitespace-nowrap">Taille</th>
            <th className="text-left p-2 whitespace-nowrap">Ajouté par</th>
            <th className="text-left p-2 whitespace-nowrap">Date</th>
            <th className="text-left p-2 whitespace-nowrap">Actions</th>
          </tr>
        </thead>
        <tbody>
          {attachments.map(att => (
            <tr key={att.id} className="border-t">
              <td className="p-2 max-w-[200px] truncate">{att.file_name}</td>
              <td className="p-2">{att.file_type}</td>
              <td className="p-2">{formatFileSize(att.file_size)}</td>
              <td className="p-2">{att.uploaded_by_profile?.first_name || '—'}</td>
              <td className="p-2">{formatDate(att.created_at)}</td>
              <td className="p-2">
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => window.open(`/api/licenses/${id}/attachments/${att.id}/download`, '_blank')}
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    onClick={() => {
                      fetch(`/api/licenses/${id}/attachments/${att.id}`, { method: 'DELETE' })
                        .then(() => setAttachments(prev => prev.filter(a => a.id !== att.id)));
                    }}
                    className="text-red-600 hover:underline flex items-center gap-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</section>

        </div>
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Dates importantes */}
          <div className="border rounded p-6 bg-white space-y-4">
            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <Calendar size={18} />
              Dates importantes
            </h2>
            <p><strong>Achat :</strong> {formatDate(license.purchase_date)}</p>
            <p><strong>Expiration :</strong> {formatDate(license.expiry_date)}</p>
            <p><strong>Création :</strong> {formatDate(license.created_at)}</p>
            {license.updated_at !== license.created_at && (
              <p><strong>Modifiée :</strong> {formatDate(license.updated_at)}</p>
            )}
            {daysUntilExpiry !== null && (
              <p className={`text-sm ${
                daysUntilExpiry < 0 ? 'text-red-600' :
                daysUntilExpiry <= 7 ? 'text-orange-600' :
                daysUntilExpiry <= 30 ? 'text-yellow-600' :
                'text-green-600'
              }`}>
                {daysUntilExpiry < 0
                  ? `Expirée depuis ${Math.abs(daysUntilExpiry)} jours`
                  : `Expire dans ${daysUntilExpiry} jours`}
              </p>
            )}
          </div>

          {/* Informations financières */}
          <div className="border rounded p-6 bg-white space-y-4">
            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <DollarSign size={18} />
              Informations financières
            </h2>
            <p><strong>Coût total :</strong> {formatCurrency(license.cost)}</p>
            {license.purchase_date && license.expiry_date && (
              <>
                <p><strong>Durée :</strong> {
                  Math.ceil((new Date(license.expiry_date).getTime() - new Date(license.purchase_date).getTime()) / (1000 * 60 * 60 * 24))
                } jours</p>
                <p><strong>Coût/jour :</strong> {
                  formatCurrency(
                    license.cost /
                    Math.ceil((new Date(license.expiry_date).getTime() - new Date(license.purchase_date).getTime()) / (1000 * 60 * 60 * 24))
                  )
                }</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Fenêtre centrée d’ajout de fichier */}
      {showUploadDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Ajouter une pièce jointe</h2>
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Fichier</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                  onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                  className="mt-1 w-full border rounded px-3 py-2"
                />
                {selectedFile && (
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type de fichier</label>
                <select
                  value={fileType}
                  onChange={e => setFileType(e.target.value)}
                  className="mt-1 w-full border rounded px-3 py-2"
                >
                  <option value="contract">Contrat</option>
                  <option value="invoice">Facture</option>
                  <option value="certificate">Certificat</option>
                  <option value="manual">Manuel</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadDialog(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-black"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!selectedFile || uploading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {uploading ? 'Ajout en cours...' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
