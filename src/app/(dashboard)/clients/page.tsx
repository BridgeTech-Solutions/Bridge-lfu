import { User, Filter, SearchIcon } from "lucide-react";
import Link from "next/link";
import { ClientsTable } from "@/components/tables/ClientsTable";

export default function GestionClients() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Clients</h1>
          <p className="text-sm text-gray-500">
            Gérez votre portefeuille client efficacement
          </p>
        </div>

        {/* Bouton navigable */}
        <Link href="/clients/new">
          <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-semibold shadow">
            + Nouveau client
          </button>
        </Link>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center justify-between p-4 bg-white shadow rounded hover:shadow-lg transition-shadow">
          <div>
            <p className="text-sm text-gray-500">Total Clients</p>
            <p className="text-2xl font-bold">11</p>
          </div>
          <User className="text-blue-600 w-6 h-6" />
        </div>

        <div className="flex items-center justify-between p-4 bg-white shadow rounded hover:shadow-lg transition-shadow">
          <div>
            <p className="text-sm text-gray-500">Secteurs</p>
            <p className="text-2xl font-bold">8</p>
          </div>
          <Filter className="text-green-600 w-6 h-6" />
        </div>

        <div className="flex items-center justify-between p-4 bg-white shadow rounded hover:shadow-lg transition-shadow">
          <div>
            <p className="text-sm text-gray-500">Page Actuelle</p>
            <p className="text-2xl font-bold">1/2</p>
          </div>
          <SearchIcon className="text-purple-600 w-6 h-6" />
        </div>
      </div>

      {/* Filtres */}
      <div className="p-4 bg-white shadow rounded">
        <h2 className="font-semibold">Recherche et Filtres</h2>
        <p className="text-sm text-gray-500 mb-4">
          Trouvez rapidement le client que vous recherchez
        </p>
        <div className="flex gap-4 flex-wrap">
          <input
            type="text"
            placeholder="Rechercher par nom de client..."
            className="border border-gray-300 rounded px-4 py-2 w-full md:w-3/4"
          />
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 pointer-events-none" />

            <select className="border border-gray-300 rounded pl-10 pr-4 py-3 w-56 text-gray-700">
              <option>Tous les secteurs</option>
              <option>Finance</option>
              <option>Éducation</option>
              <option>Industrie</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tableau des clients */}
      <div className="bg-white shadow rounded p-4">
        <h2 className="font-semibold mb-4">Liste des Clients</h2>
        <ClientsTable />
      </div>
    </div>
  );
}
