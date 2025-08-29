'use client';

import { useEffect, useState } from 'react';
import {
  MoreHorizontal,
  Search,
  Pencil,
  Trash2,
  FileDown,
  PlusCircle,
  Layers3,
  BadgeCheck,
  Clock,
  Ban,
  Eye,
  HelpCircle
} from 'lucide-react';
import Link from 'next/link';

export default function LicensesPage() {
  const [licenses, setLicenses] = useState([]);
  const [editors, setEditors] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editorFilter, setEditorFilter] = useState('');

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
    aboutToExpire: 0
  });

  // Charger les licences filtrées
  useEffect(() => {
    const query = new URLSearchParams();
    if (search) query.append('search', search);
    if (statusFilter) query.append('status', statusFilter);
    if (editorFilter) query.append('editor', editorFilter);

    fetch(`/api/licenses?${query.toString()}`)
      .then(res => res.json())
      .then(res => {
        setLicenses(res.data);

        // Calculer les stats dynamiquement
        const total = res.data.length;
        const active = res.data.filter((l: any) => l.status === 'active').length;
        const expired = res.data.filter((l: any) => l.status === 'expired').length;
        const aboutToExpire = res.data.filter((l: any) => l.status === 'about_to_expire').length;
        setStats({ total, active, expired, aboutToExpire });
      });
  }, [search, statusFilter, editorFilter]);

  // Charger les éditeurs distincts
  useEffect(() => {
    fetch('/api/licenses?distinct=editor')
      .then(res => res.json())
      .then(data => {
        const uniqueEditors = Array.from(new Set(data.data.map((l: any) => l.editor)));
        setEditors(uniqueEditors.filter(Boolean));
      });  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Titre */}
      <div>
        <h1 className="text-2xl font-bold">Licences</h1>
        <p className="text-sm text-gray-500">Gestion des licences logicielles et matérielles</p>
      </div>

      {/* Cartes récapitulatives */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        <div className="bg-white border rounded-xl p-4 shadow-sm flex items-center gap-4">
          <Layers3 className="w-6 h-6 text-blue-600" />
          <div>
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-xl font-bold">{stats.total}</p>
          </div>
        </div>
        <div className="bg-white border rounded-xl p-4 shadow-sm flex items-center gap-4">
          <BadgeCheck className="w-6 h-6 text-green-600" />
          <div>
            <p className="text-sm text-gray-500">Actives</p>
            <p className="text-xl font-bold">{stats.active}</p>
          </div>
        </div>
        <div className="bg-white border rounded-xl p-4 shadow-sm flex items-center gap-4">
          <Clock className="w-6 h-6 text-yellow-600" />
          <div>
            <p className="text-sm text-gray-500">Bientôt expirées</p>
            <p className="text-xl font-bold">{stats.aboutToExpire}</p>
          </div>
        </div>
        <div className="bg-white border rounded-xl p-4 shadow-sm flex items-center gap-4">
          <Ban className="w-6 h-6 text-red-600" />
          <div>
            <p className="text-sm text-gray-500">Expirées</p>
            <p className="text-xl font-bold">{stats.expired}</p>
          </div>
        </div>
      </div>

      {/* Boutons d'action */}
      <div className="flex gap-3 justify-end">
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl shadow hover:bg-blue-700 transition">
          <FileDown size={18} />
          <span className="text-sm font-medium">Exporter</span>
        </button>
        <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl shadow hover:bg-green-700 transition">
          <PlusCircle size={18} />
          <span className="text-sm font-medium">Ajouter une licence</span>
        </button>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 w-full rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded bg-white text-sm"
        >
          <option value="">Tous les statuts</option>
          <option value="active">Active</option>
          <option value="expired">Expirée</option>
          <option value="about_to_expire">Bientôt expirée</option>
        </select>

        <select
          value={editorFilter}
          onChange={e => setEditorFilter(e.target.value)}
          className="px-3 py-2 border rounded bg-white text-sm"
        >
          <option value="">Tous les éditeurs</option>
          {editors.sort().map(editor => (
            <option key={editor} value={editor}>{editor}</option>
          ))}
        </select>
      </div>

      {/* Tableau des licences */}
      <div className="overflow-x-auto border rounded-lg">
        {licenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <HelpCircle className="w-10 h-10 mb-2 text-gray-400" />
            <p className="text-sm">Aucune licence trouvée avec les critères actuels.</p>
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-4 py-2 text-left">Nom</th>
                <th className="px-4 py-2 text-left">Éditeur</th>
                <th className="px-4 py-2 text-left">Version</th>
                <th className="px-4 py-2 text-left">Expiration</th>
                <th className="px-4 py-2 text-left">Coût</th>
                <th className="px-4 py-2 text-left">Statut</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {licenses.map((licence: any) => (
                <tr key={licence.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{licence.name}</td>
                  <td className="px-4 py-2">{licence.editor}</td>
                  <td className="px-4 py-2">{licence.version}</td>
                  <td className="px-4 py-2">{licence.expiry_date}</td>
                  <td className="px-4 py-2">{licence.cost} €</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      licence.status === 'active' ? 'bg-green-100 text-green-700' :
                      licence.status === 'expired' ? 'bg-red-100 text-red-700' :
                      licence.status === 'about_to_expire' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {licence.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <button className="p-1 hover:bg-gray-200 rounded" title="Modifier">
                        <Pencil className="w-4 h-4 text-blue-600" />
                      </button>
                      <button className="p-1 hover:bg-gray-200 rounded" title="Supprimer">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                     <Link href={`/licenses/${licence.id}`}>
                        <button className="p-1 hover:bg-gray-200 rounded" title="Voir les détails">
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                      </Link> 
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
