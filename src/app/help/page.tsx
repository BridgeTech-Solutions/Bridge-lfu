import type { Metadata } from 'next'
import Link from 'next/link'
import {
  AlertTriangle,
  Bell,
  ClipboardCheck,
  FileText,
  Headset,
  LayoutDashboard,
  LifeBuoy,
  PhoneCall,
  Server,
  Settings,
  Shield,
  Users,
  Wrench
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export const metadata: Metadata = {
  title: "Centre d'aide | Bridge LFU",
  description:
    'Guide utilisateur pour comprendre Bridge LFU selon votre rôle : administrateur, technicien ou client.'
}

const quickStartSteps = [
  {
    title: 'Connexion & profil',
    description: 'Ouvrez Bridge LFU avec votre email professionnel puis vérifiez vos informations (nom, rôle, entreprise) dans la rubrique Paramètres.'
  },
  {
    title: 'Identifier les priorités',
    description: 'Selon votre rôle, consultez le Tableau de bord ou la section Mon Entreprise pour repérer licences, équipements et alertes à traiter.'
  },
  {
    title: 'Traiter les actions du jour',
    description: 'Suivez la checklist de votre rôle ci-dessous afin de maintenir les données à jour et informer les équipes concernées.'
  }
]

const roleGuides = [
  {
    id: 'admin-guide',
    title: 'Administrateur',
    icon: Shield,
    description:
      'Pilote la configuration globale : création des entreprises clientes, gestion des utilisateurs internes, supervision du parc et des rapports.',
    responsibilities: [
      'Enregistrer les nouveaux clients et mettre à jour leurs informations.',
      'Créer des utilisateurs, attribuer les rôles et vérifier les accès.',
      'Assurer la conformité des licences et planifier les renouvellements.',
      'Superviser l’état du parc matériel et la stratégie de maintenance.'
    ],
    checklist: [
      'Chaque matin : parcourir le Tableau de bord et les alertes critiques.',
      'Valider ou mettre à jour les licences et équipements traités la veille.',
      'Générer un rapport si un audit ou un comité est prévu.',
      'Vérifier les notifications non lues et informer les interlocuteurs concernés.'
    ],
    links: [
      { label: 'Tableau de bord', href: '/dashboard' },
      { label: 'Clients', href: '/clients' },
      { label: 'Licences', href: '/licenses' },
      { label: 'Équipements', href: '/equipment' },
      { label: 'Utilisateurs', href: '/users' },
      { label: 'Rapports', href: '/reports' },
      { label: 'Paramètres', href: '/settings' }
    ]
  },
  {
    id: 'technicien-guide',
    title: 'Technicien',
    icon: Wrench,
    description:
      'Opère les interventions quotidiennes : suivi des licences et équipements, maintien des alertes à jour, assistance aux clients.',
    responsibilities: [
      'Mettre à jour les fiches licences après chaque renouvellement ou incident.',
      'Suivre les équipements en maintenance et consigner les dates clés.',
      'Répondre aux notifications techniques et informer les clients impactés.',
      'Préparer les exports demandés par l’équipe de pilotage.'
    ],
    checklist: [
      'Consulter le Tableau de bord puis la liste Licences pour identifier les urgences.',
      'Actualiser le statut et les notes d’un équipement après intervention.',
      'Marquer les notifications traitées comme lues pour éviter les doublons.',
      'Exporter un rapport si un client demande un récapitulatif détaillé.'
    ],
    links: [
      { label: 'Tableau de bord', href: '/dashboard' },
      { label: 'Licences', href: '/licenses' },
      { label: 'Équipements', href: '/equipment' },
      { label: 'Notifications', href: '/notifications' },
      { label: 'Rapports', href: '/reports' }
    ]
  },
  {
    id: 'client-guide',
    title: 'Client (responsable d’entreprise)',
    icon: Users,
    description:
      'Suit les actifs de son entreprise : dates de renouvellement, équipements déployés, alertes reçues par email ou via l’application.',
    responsibilities: [
      'Consulter « Mon Entreprise » pour vérifier le matériel et les licences en cours.',
      'Transmettre les documents nécessaires (factures, contrats) à l’équipe support.',
      'Valider la réception d’un équipement ou d’une licence nouvellement installée.',
      'Tenir à jour les contacts de référence afin de recevoir les alertes au bon endroit.'
    ],
    checklist: [
      'Dans Mon Entreprise : surveiller les licences qui expirent bientôt.',
      'Informer BridgeTech d’un changement via la page Notifications ou par email.',
      'Mettre à jour les coordonnées de l’entreprise pour garantir la bonne réception des alertes.',
      'Télécharger un rapport si la direction demande un état des lieux.'
    ],
    links: [
      { label: 'Mon Entreprise', href: '/my-company' },
      { label: 'Notifications', href: '/notifications' },
      { label: 'Rapports personnalisés', href: '/reports' }
    ]
  }
]

const featureGuides = [
  {
    id: 'dashboard',
    title: 'Tableau de bord',
    icon: LayoutDashboard,
    audience: 'Tous les rôles',
    purpose:
      'Centralise les indicateurs clés : alertes critiques, actifs en fin de vie, état général du parc.',
    steps: [
      'Ouvrez le Tableau de bord pour voir en un coup d’œil les urgences et éléments récents.',
      'Cliquez sur une carte pour accéder directement à la liste détaillée correspondante.',
      'Utilisez les informations pour planifier vos interventions ou informer votre équipe.'
    ],
    href: '/dashboard'
  },
  {
    id: 'licenses',
    title: 'Licences',
    icon: Shield,
    audience: 'Administrateur, Technicien',
    purpose:
      'Suivi complet des licences logicielles : dates d’achat, renouvellement, statut et pièces jointes.',
    steps: [
      'Filtrez par statut (Active, Bientôt expirée, Expirée) pour prioriser vos actions.',
      'Ajoutez ou mettez à jour les informations depuis les boutons « Nouvelle licence » ou « Modifier ».',
      'Exportez la liste en Excel/CSV pour la partager lors d’un audit ou d’une réunion.'
    ],
    href: '/licenses'
  },
  {
    id: 'equipment',
    title: 'Équipements',
    icon: Server,
    audience: 'Administrateur, Technicien, Client',
    purpose:
      'Inventaire du matériel avec statut d’obsolescence, localisation, coûts et documents de suivi.',
    steps: [
      'Utilisez les filtres (statut, client, type) pour identifier les équipements à surveiller.',
      'Rafraîchissez les statuts après une maintenance via le bouton « Rafraîchir statuts ».',
      'Exportez ou imprimez la liste pour vos interventions sur site.'
    ],
    href: '/equipment'
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: Bell,
    audience: 'Tous les rôles',
    purpose:
      'Suivre les alertes envoyées par Bridge LFU (licences à renouveler, matériel obsolète, nouveaux accès).',
    steps: [
      'Utilisez les onglets « Toutes », « Non lues » ou « Paramètres » pour rester organisé.',
      'Marquez une notification comme lue une fois l’action réalisée afin d’éviter les doublons.',
      'Ajustez vos préférences (emails, délais de rappel) dans l’onglet Paramètres.'
    ],
    href: '/notifications'
  },
  {
    id: 'reports',
    title: 'Rapports & exports',
    icon: FileText,
    audience: 'Administrateur, Technicien',
    purpose:
      'Préparer des synthèses pour la direction, les clients ou les auditeurs.',
    steps: [
      'Sélectionnez le type de rapport (Licences ou Équipements) et affinez avec dates, statut ou client.',
      'Générez le rapport puis téléchargez-le au format souhaité (Excel, CSV, PDF, JSON).',
      'Utilisez les « Rapports rapides » pour obtenir en quelques clics les éléments critiques.'
    ],
    href: '/reports'
  },
  {
    id: 'settings',
    title: 'Paramètres personnels',
    icon: Settings,
    audience: 'Tous les rôles',
    purpose:
      'Personnaliser votre expérience : langue, thème, préférences de notifications, nombre d’éléments affichés.',
    steps: [
      'Adaptez l’interface à votre confort (clair/sombre, langue française ou anglaise).',
      'Activez les alertes email si vous devez suivre les échéances sans vous connecter.',
      'Réinitialisez vos préférences à tout moment avec le bouton dédié.'
    ],
    href: '/settings'
  }
]

const faq = [
  {
    question: 'Je ne vois que l’onglet « Mon Entreprise ». Est-ce normal ?',
    answer:
      'Oui. Votre rôle « Client » limite l’accès aux informations de votre propre entreprise pour protéger les autres organisations. Contactez votre administrateur si vous devez étendre votre périmètre.'
  },
  {
    question: 'Comment savoir qui doit traiter une alerte ?',
    answer:
      'Ouvrez la notification pour lire le message associé et vérifier le type d’alerte. Si nécessaire, contactez votre administrateur ou technicien référent pour confirmer la prise en charge, puis marquez la notification comme lue.'
  },
  {
    question: 'Puis-je être averti·e avant l’expiration d’une licence ?',
    answer:
      'Oui. Dans Notifications > Paramètres, activez les alertes email. Les administrateurs peuvent configurer une politique d’anticipation pour toute l’organisation.'
  },
  {
    question: 'Que faire si une information est incorrecte ?',
    answer:
      'Corrigez-la directement si vous disposez des droits d’édition. Sinon, contactez l’administrateur ou le technicien via email ou en créant une notification dédiée.' 
  }
]

const supportChannels = [
  {
    title: 'Service support BridgeTech Solutions',
    description: 'Pour tout incident technique ou demande de formation, contactez-nous par email ou téléphone.',
    actions: [
      {
        label: 'Écrire au support',
        href: 'mailto:support@bridgetech.co',
        style: 'primary'
      },
      {
        label: 'Appeler le support',
        href: 'tel:+237000000000',
        style: 'outline'
      }
    ]
  },
  {
    title: 'Remonter une demande interne',
    description:
      'Informez votre administrateur ou technicien référent en créant une notification interne ou en lui envoyant un message direct.',
    actions: [
      {
        label: 'Ouvrir les notifications',
        href: '/notifications',
        style: 'outline'
      }
    ]
  }
]

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40">
      <div className="max-w-6xl mx-auto px-6 py-12 space-y-12">
        <header className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
            <LifeBuoy className="h-4 w-4" />
            Centre d&apos;aide Bridge LFU
          </div>
          <h1 className="text-4xl font-bold text-slate-900">Utiliser Bridge LFU selon votre rôle</h1>
          <p className="text-base text-slate-600 max-w-3xl mx-auto">
            Ce guide s’adresse aux utilisateurs finaux. Il présente les bonnes pratiques à adopter que vous soyez administrateur, technicien ou responsable côté client.
          </p>
        </header>

        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="px-6 py-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">Prise en main rapide</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickStartSteps.map((step, index) => (
                <Card key={step.title} className="h-full border border-slate-200">
                  <CardHeader className="pb-2">
                    <Badge variant="outline" className="mb-2">Étape {index + 1}</Badge>
                    <CardTitle className="text-base text-slate-900">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 leading-relaxed">{step.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="roles" className="space-y-6">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Guides par rôle</Badge>
            <h2 className="text-2xl font-bold text-slate-900">Choisissez votre parcours</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {roleGuides.map((guide) => {
              const GuideIcon = guide.icon
              return (
                <Card key={guide.id} id={guide.id} className="h-full border border-slate-200 shadow-sm">
                  <CardHeader className="space-y-2">
                    <div className="flex items-center gap-3">
                      <GuideIcon className="h-6 w-6 text-blue-600" />
                      <CardTitle className="text-lg text-slate-900">{guide.title}</CardTitle>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{guide.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">Responsabilités majeures</p>
                      <ul className="mt-2 space-y-2 text-sm text-slate-700">
                        {guide.responsibilities.map((item) => (
                          <li key={item} className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">Checklist quotidienne</p>
                      <ul className="mt-2 space-y-2 text-sm text-slate-700">
                        {guide.checklist.map((item) => (
                          <li key={item} className="flex items-start gap-2">
                            <ClipboardCheck className="h-4 w-4 text-emerald-500 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">Écrans à connaître</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {guide.links.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                          >
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        <Separator />

        <section id="features" className="space-y-6">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">Fonctionnalités</Badge>
            <h2 className="text-2xl font-bold text-slate-900">Comprendre chaque module</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {featureGuides.map((feature) => {
              const FeatureIcon = feature.icon
              return (
                <Card key={feature.id} id={feature.id} className="h-full border border-slate-200 shadow-sm">
                  <CardHeader className="space-y-2">
                    <div className="flex items-center gap-3">
                      <FeatureIcon className="h-6 w-6 text-blue-600" />
                      <CardTitle className="text-xl text-slate-900">{feature.title}</CardTitle>
                    </div>
                    <Badge variant="secondary" className="w-fit">{feature.audience}</Badge>
                    <p className="text-sm text-slate-600 leading-relaxed">{feature.purpose}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Comment faire</p>
                    <ul className="space-y-2 text-sm text-slate-700">
                      {feature.steps.map((step) => (
                        <li key={step} className="flex items-start gap-2">
                          <LifeBuoy className="h-4 w-4 text-blue-500 mt-0.5" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={feature.href}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                    >
                      Ouvrir {feature.title}
                    </Link>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        <Separator />

        <section id="faq" className="space-y-6">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">FAQ</Badge>
            <h2 className="text-2xl font-bold text-slate-900">Questions fréquentes</h2>
          </div>
          <div className="space-y-4">
            {faq.map((item) => (
              <Card key={item.question} className="border border-slate-200 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-slate-900">{item.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator />

        <section id="support" className="space-y-6">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200">Assistance</Badge>
            <h2 className="text-2xl font-bold text-slate-900">Besoin d’aide supplémentaire ?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {supportChannels.map((channel) => (
              <Card key={channel.title} className="h-full border border-slate-200 shadow-sm">
                <CardHeader className="space-y-2">
                  <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
                    {channel.title.includes('BridgeTech') ? (
                      <Headset className="h-5 w-5 text-blue-600" />
                    ) : (
                      <PhoneCall className="h-5 w-5 text-blue-600" />
                    )}
                    {channel.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-600">
                  <p>{channel.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {channel.actions.map((action) => (
                      <Link
                        key={action.href}
                        href={action.href}
                        className={
                          action.style === 'primary'
                            ? 'inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-blue-700'
                            : 'inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100'
                        }
                      >
                        {action.label}
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
