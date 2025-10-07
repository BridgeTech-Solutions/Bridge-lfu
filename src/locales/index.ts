'use client'

export type SupportedLanguage = 'fr' | 'en'

export type TranslationTree = {
  [key: string]: string | TranslationTree
}

const translations: Record<SupportedLanguage, TranslationTree> = {
  fr: {
    settings: {
      title: 'Paramètres',
      subtitle: 'Gérez vos préférences personnelles et paramètres de notification',
      adminLink: 'Configuration avancée',
      adminLinkHint: 'Ouvrir la configuration avancée',
      tabs: {
        info: 'Informations',
        preferences: 'Préférences',
        notifications: 'Notifications',
      },
      info: {
        title: "Informations de l'application",
        description: "Informations générales sur l'application",
        appNameLabel: "Nom de l'application",
        versionLabel: 'Version',
        descriptionLabel: 'Description',
        defaultName: 'Bridge LFU',
        defaultVersion: '1.0.0',
      },
      notifications: {
        title: 'Notifications',
        description: 'Gérez vos préférences de notifications',
        emailLabel: 'Notifications par email',
        emailDescription: 'Recevoir les notifications importantes par email',
        noteTitle: 'Note',
        note: 'Les autres paramètres de notification (alertes, rapports, etc.) sont disponibles dans la section "Notifications" du menu principal.',
      },
      preferences: {
        title: 'Préférences personnelles',
        description: "Personnalisez votre expérience d'utilisation",
        themeLabel: 'Thème',
        themeOptions: {
          system: 'Système',
          light: 'Clair',
          dark: 'Sombre',
        },
        languageLabel: 'Langue',
        languageOptions: {
          fr: 'Français',
          en: 'English',
        },
        itemsPerPageLabel: 'Éléments par page',
        resetButton: 'Réinitialiser les préférences',
      },
      advancedAccessRequired: 'Accès administrateur requis',
      advancedAccessDescription: 'Vous devez être administrateur pour accéder à cette page.',
      loading: 'Chargement en cours...',
    },
    sidebar: {
      sections: {
        general: 'Général',
        management: 'Gestion',
        support: 'Support',
      },
      items: {
        dashboard: 'Tableau de bord',
        myCompany: 'Mon entreprise',
        clients: 'Clients',
        clientsList: 'Liste des clients',
        clientsCreate: 'Ajouter un client',
        licenses: 'Licences',
        licensesList: 'Liste des licences',
        licensesCreate: 'Ajouter une licence',
        equipment: 'Équipements',
        equipmentList: 'Liste des équipements',
        equipmentCreate: 'Ajouter un équipement',
        notifications: 'Notifications',
        reports: 'Rapports',
        users: 'Utilisateurs',
        usersList: 'Liste des utilisateurs',
        usersCreate: 'Ajouter un utilisateur',
        help: 'Aide',
        settings: 'Paramètres',
        expandSection: 'Déplier la section',
        collapseSection: 'Replier la section',
        equipmentTypes: 'Types d\'équipement',
      },
    },
    header: {
      notifications: {
        title: 'Notifications',
        unreadSingular: 'non lue',
        unreadPlural: 'non lues',
        empty: 'Aucune notification non lue',
        viewAll: 'Voir toutes les notifications',
        actions: {
          markAllAsRead: 'Tout marquer comme lu',
          markAsRead: 'Marquer comme lue',
          markAsUnread: 'Marquer comme non lue',
          delete: 'Supprimer',
        },
        messages: {
          markSuccessPrefix: 'Notification marquée comme',
          statusRead: 'lue',
          statusUnread: 'non lue',
          markError: 'Erreur lors de la mise à jour de la notification',
          deleteSuccess: 'Notification supprimée',
          deleteError: 'Erreur lors de la suppression',
          markAllSuccess: 'Toutes les notifications marquées comme lues',
          markAllError: 'Erreur lors de la mise à jour',
        },
        types: {
          licenseExpiry: 'Licence',
          equipmentObsolescence: 'Équipement',
          newUnverifiedUser: 'Utilisateur',
          general: 'Général',
        },
        time: {
          justNow: "À l'instant",
          minutes: 'Il y a {{count}} minute',
          minutesPlural: 'Il y a {{count}} minutes',
          hours: 'Il y a {{count}} heure',
          hoursPlural: 'Il y a {{count}} heures',
          days: 'Il y a {{count}} jour',
          daysPlural: 'Il y a {{count}} jours',
        },
      },
      user: {
        profile: 'Mon profil',
        settings: 'Paramètres',
        signOut: 'Se déconnecter',
        signOutError: 'Erreur lors de la déconnexion',
        roles: {
          admin: 'Administrateur',
          technicien: 'Technicien',
          client: 'Client',
          unverified: 'Non vérifié',
        },
      },
    },
    dashboard: {
      title: 'Tableau de bord',
      overview: {
        subtitle: "Vue d'ensemble de votre {{context}}",
        context: {
          platform: 'plateforme',
          account: 'compte',
        },
      },
      errors: {
        loading: 'Erreur lors du chargement',
      },
      stats: {
        totalClients: 'Total clients',
        activeLicenses: 'Licences actives',
        activeLicensesSubtitle: '{{count}} expirées',
        activeEquipment: 'Équipements actifs',
        activeEquipmentSubtitle: '{{count}} obsolètes',
        criticalAlerts: 'Alertes critiques',
        criticalAlertsSubtitle: '{{count}} avertissements',
        trendComparison: 'vs mois dernier',
      },
      charts: {
        equipmentByType: 'Répartition des équipements par type',
        licenseStatus: 'Statut des licences',
        upcomingExpirations: 'Expirations à venir (6 mois)',
        equipmentStatus: 'Statut des équipements',
        expirationsSeries: 'Expirations',
      },
      alerts: {
        title: 'Alertes récentes',
        viewAll: 'Voir tout',
        emptyTitle: 'Tout va bien !',
        emptyDescription: 'Aucune alerte critique à signaler',
        systemLabel: 'Alerte système',
        badgeCritical: 'Critique',
        badgeWarning: 'Attention',
        clientLabel: 'Client',
      },
      quickActions: {
        title: 'Actions rapides',
        newClient: 'Nouveau client',
        newLicense: 'Nouvelle licence',
        newEquipment: 'Nouvel équipement',
        reports: 'Générer un rapport',
      },
      clientSummary: {
        title: 'Mes données',
        licenses: 'Licences',
        equipment: 'Équipements',
        alerts: 'Alertes',
        totalValue: 'Valeur totale',
      },
    },
    clients: {
      title: 'Gestion des clients',
      subtitle: 'Gérez votre portefeuille client efficacement',
      button: 'Nouveau client',
      stats: {
        total: 'Total clients',
        sectors: 'Secteurs',
        recent: 'Clients récents',
        recentDescription: '30 derniers jours',
      },
      filters: {
        title: 'Recherche et filtres',
        description: 'Trouvez rapidement le client que vous recherchez',
        searchPlaceholder: 'Rechercher par nom de client...',
        sectorPlaceholder: "Secteur d'activité",
        allSectors: 'Tous les secteurs',
      },
      errors: {
        loadingTitle: 'Erreur de chargement',
        loadingDescription: 'Une erreur est survenue lors du chargement des clients ou des secteurs.',
      },
      pagination: {
        range: 'Affichage de {{start}} à {{end}} sur {{total}} clients',
      },
      table: {
        toastSuccess: 'Client supprimé avec succès',
        toastError: 'Erreur : {{message}}',
        deleteError: 'Erreur lors de la suppression :',
        confirmMessage: 'Êtes-vous sûr de vouloir supprimer le client "{{name}}" ?',
        confirmWarning: 'Cette action supprimera également toutes les licences et équipements associés.',
        emptyTitle: 'Aucun client trouvé',
        emptyDescription: 'Commencez par ajouter votre premier client pour voir apparaître vos données ici.',
        emptyButton: 'Ajouter un client',
        columns: {
          client: 'Client',
          contact: 'Contact',
          sector: 'Secteur',
          location: 'Localisation',
          created: 'Création',
          actions: 'Actions',
        },
        actions: {
          openMenu: 'Ouvrir le menu',
          view: 'Voir les détails',
          edit: 'Modifier',
          delete: 'Supprimer',
        },
      },
      detail: {
        notFound: {
          title: 'Client introuvable',
          description: "Le client demandé n'existe pas ou vous n'avez pas les permissions pour le consulter.",
          button: 'Retour',
        },
        header: {
          back: 'Retour',
          edit: 'Modifier',
          sectorFallback: 'Secteur non spécifié',
        },
        contactCard: {
          title: 'Informations de contact',
          description: 'Coordonnées et informations principales',
          email: 'Email',
          phone: 'Téléphone',
          contact: 'Contact principal',
          address: 'Adresse',
          fieldFallback: 'Non renseigné',
          addressFallback: 'Non renseignée',
        },
        statsCard: {
          title: 'Statistiques',
          licenses: 'Licences',
          equipment: 'Équipements',
        },
        infoCard: {
          title: 'Informations',
          created: 'Créé le',
          updated: 'Dernière mise à jour',
        },
        tabs: {
          licenses: 'Licences',
          equipment: 'Équipements',
          licensesWithCount: 'Licences ({{count}})',
          equipmentWithCount: 'Équipements ({{count}})',
          licensesEmpty: 'Aucune licence enregistrée',
          equipmentEmpty: 'Aucun équipement enregistré',
          viewAllLicenses: 'Voir toutes les licences ({{count}})',
          viewAllEquipment: 'Voir tous les équipements ({{count}})',
        },
        licenseItem: {
          description: '{{editor}} • {{expiry}}',
          expiry: 'Expire le {{date}}',
          unknownEditor: 'Éditeur inconnu',
          cost: '{{amount}} FCFA',
        },
        equipmentItem: {
          description: '{{type}} • {{brand}} {{model}}',
          obsolescence: 'Obsolescence prévue le {{date}}',
          unknownType: 'Type inconnu',
          unknownBrand: 'Marque inconnue',
          cost: '{{amount}} FCFA',
        },
        licenseStatus: {
          active: 'Actif',
          expired: 'Expiré',
          about_to_expire: 'Expire bientôt',
          actif: 'Actif',
          unknown: '{{status}}',
        },
        equipmentStatus: {
          actif: 'Actif',
          obsolete: 'Obsolète',
          bientot_obsolete: 'Bientôt obsolète',
          en_maintenance: 'En maintenance',
          retire: 'Retiré',
          unknown: '{{status}}',
        },
      },
      form: {
        back: 'Retour',
        loading: 'Chargement du client...',
        permission: {
          create: "Vous n'avez pas les permissions nécessaires pour créer un client.",
          edit: "Vous n'avez pas les permissions nécessaires pour modifier un client.",
        },
        headings: {
          createTitle: 'Nouveau client',
          editTitle: 'Modifier le client',
          createSubtitle: 'Ajoutez un nouveau client à votre portefeuille',
          editSubtitle: 'Modifiez les informations du client',
        },
        sections: {
          general: {
            title: 'Informations générales',
            description: 'Renseignez les informations principales du client',
            fields: {
              name: {
                label: 'Nom du client *',
                placeholder: 'Ex: TechCorp SARL',
                description: "Nom de l'entreprise ou de l'organisation",
              },
              sector: {
                label: "Secteur d'activité",
                placeholder: 'Sélectionnez un secteur',
              },
              country: {
                label: 'Pays',
                placeholder: 'Cameroun',
              },
            },
          },
          contact: {
            title: 'Informations de contact',
            description: 'Coordonnées du contact principal',
            fields: {
              contactPerson: {
                label: 'Contact principal',
                placeholder: 'Ex: Jean Dupont',
              },
              contactEmail: {
                label: 'Email',
                placeholder: 'contact@exemple.com',
              },
              contactPhone: {
                label: 'Téléphone',
                placeholder: 'Ex: +237 6XX XX XX XX',
                description: 'Format: +237 6XXXXXXXX ou 6XXXXXXXX',
              },
            },
          },
          address: {
            title: 'Adresse',
            description: 'Adresse physique du client',
            fields: {
              address: {
                label: 'Adresse complète',
                placeholder: 'Ex: 123 Rue de la Technologie, Quartier des Affaires',
              },
              city: {
                label: 'Ville',
                placeholder: 'Ex: Douala',
              },
              postalCode: {
                label: 'Code postal',
                placeholder: 'Ex: BP 1234',
              },
            },
          },
        },
        actions: {
          cancel: 'Annuler',
          create: 'Créer le client',
          update: 'Enregistrer les modifications',
          creating: 'Création...',
          updating: 'Modification...',
        },
        notifications: {
          createSuccess: 'Client créé avec succès !',
          errorDefault: 'Une erreur est survenue lors de la sauvegarde',
        },
        options: {
          sectors: {
            informatique: 'Informatique',
            sante: 'Santé',
            education: 'Éducation',
            finance: 'Finance',
            commerce: 'Commerce',
            industrie: 'Industrie',
            services: 'Services',
            agriculture: 'Agriculture',
            transport: 'Transport',
            telecommunications: 'Télécommunications',
            energie: 'Énergie',
            immobilier: 'Immobilier',
            tourisme: 'Tourisme',
            autre: 'Autre',
          },
        },
      },

    },
    equipmentTypes: {
      title: 'Types d\'équipement',
      subtitle: 'Gérez les différents types d\'équipements de votre système',
      stats: {
        total: 'Total',
        active: 'Actifs',
        inactive: 'Inactifs',
      },
      search: {
        placeholder: 'Rechercher un type...',
      },
      buttons: {
        showInactive: 'Afficher inactifs',
        hideInactive: 'Masquer inactifs',
        newType: 'Nouveau type',
      },
      table: {
        columns: {
          name: 'Nom',
          code: 'Code',
          description: 'Description',
          status: 'Statut',
          actions: 'Actions',
        },
        empty: 'Aucun type trouvé',
        actions: {
          edit: 'Modifier',
          disable: 'Désactiver',
          delete: 'Supprimer',
        },
      },
      status: {
        active: 'Actif',
        inactive: 'Inactif',
      },
      modal: {
        createTitle: 'Nouveau type',
        editTitle: 'Modifier le type',
        fields: {
          name: {
            label: 'Nom',
            placeholder: 'PC / Ordinateur',
            required: '*',
          },
          code: {
            label: 'Code',
            placeholder: 'PC',
            required: '*',
          },
          description: {
            label: 'Description',
            placeholder: 'Description du type d\'équipement',
          },
          icon: {
            label: 'Icône',
            placeholder: 'Sélectionner une icône',
          },
          isActive: 'Type actif',
        },
        actions: {
          cancel: 'Annuler',
          save: 'Enregistrer',
          saving: 'Enregistrement...',
        },
      },
      confirmations: {
        disable: 'Êtes-vous sûr de vouloir désactiver le type "{{name}}" ?',
        delete: 'Êtes-vous sûr de vouloir supprimer définitivement le type "{{name}}" ?',
      },
    },
  },
  en: {
    settings: {
      title: 'Settings',
      subtitle: 'Manage your personal preferences and notification options',
      adminLink: 'Advanced configuration',
      adminLinkHint: 'Open advanced configuration',
      tabs: {
        info: 'Information',
        preferences: 'Preferences',
        notifications: 'Notifications',
      },
      info: {
        title: 'Application information',
        description: 'General information about the application',
        appNameLabel: 'Application name',
        versionLabel: 'Version',
        descriptionLabel: 'Description',
        defaultName: 'Bridge LFU',
        defaultVersion: '1.0.0',
      },
      notifications: {
        title: 'Notifications',
        description: 'Manage your notification preferences',
        emailLabel: 'Email notifications',
        emailDescription: 'Receive important notifications by email',
        noteTitle: 'Note',
        note: 'Additional notification settings (alerts, reports, etc.) are available in the "Notifications" section of the main menu.',
      },
      preferences: {
        title: 'Personal preferences',
        description: 'Customize your user experience',
        themeLabel: 'Theme',
        themeOptions: {
          system: 'System',
          light: 'Light',
          dark: 'Dark',
        },
        languageLabel: 'Language',
        languageOptions: {
          fr: 'French',
          en: 'English',
        },
        itemsPerPageLabel: 'Items per page',
        resetButton: 'Reset preferences',
      },
      advancedAccessRequired: 'Administrator access required',
      advancedAccessDescription: 'You must be an administrator to access this page.',
      loading: 'Loading...',
    },
    sidebar: {
      sections: {
        general: 'General',
        management: 'Management',
        support: 'Support',
      },
      items: {
        dashboard: 'Dashboard',
        myCompany: 'My company',
        clients: 'Clients',
        clientsList: 'Clients list',
        clientsCreate: 'Add a client',
        licenses: 'Licenses',
        licensesList: 'Licenses list',
        licensesCreate: 'Add a license',
        equipment: 'Equipment',
        equipmentList: 'Equipment list',
        equipmentCreate: 'Add equipment',
        notifications: 'Notifications',
        reports: 'Reports',
        users: 'Users',
        usersList: 'Users list',
        usersCreate: 'Add a user',
        help: 'Help',
        settings: 'Settings',
        expandSection: 'Expand section',
        collapseSection: 'Collapse section',
        equipmentTypes: 'Equipment types',
      },
    },
    header: {
      notifications: {
        title: 'Notifications',
        unreadSingular: 'unread',
        unreadPlural: 'unread',
        empty: 'No unread notifications',
        viewAll: 'View all notifications',
        actions: {
          markAllAsRead: 'Mark all as read',
          markAsRead: 'Mark as read',
          markAsUnread: 'Mark as unread',
          delete: 'Delete',
        },
        messages: {
          markSuccessPrefix: 'Notification marked as',
          statusRead: 'read',
          statusUnread: 'unread',
          markError: 'Error while updating the notification',
          deleteSuccess: 'Notification deleted',
          deleteError: 'Error while deleting the notification',
          markAllSuccess: 'All notifications marked as read',
          markAllError: 'Error while updating notifications',
        },
        types: {
          licenseExpiry: 'License',
          equipmentObsolescence: 'Equipment',
          newUnverifiedUser: 'User',
          general: 'General',
        },
        time: {
          justNow: 'Just now',
          minutes: '{{count}} minute ago',
          minutesPlural: '{{count}} minutes ago',
          hours: '{{count}} hour ago',
          hoursPlural: '{{count}} hours ago',
          days: '{{count}} day ago',
          daysPlural: '{{count}} days ago',
        },
      },
      user: {
        profile: 'My profile',
        settings: 'Settings',
        signOut: 'Sign out',
        signOutError: 'Error while signing out',
        roles: {
          admin: 'Administrator',
          technicien: 'Technician',
          client: 'Client',
          unverified: 'Unverified',
        },
      },
    },
    dashboard: {
      title: 'Dashboard',
      overview: {
        subtitle: 'Overview of your {{context}}',
        context: {
          platform: 'platform',
          account: 'account',
        },
      },
      errors: {
        loading: 'Error while loading',
      },
      stats: {
        totalClients: 'Total Clients',
        activeLicenses: 'Active Licenses',
        activeLicensesSubtitle: '{{count}} expired',
        activeEquipment: 'Active Equipment',
        activeEquipmentSubtitle: '{{count}} obsolete',
        criticalAlerts: 'Critical Alerts',
        criticalAlertsSubtitle: '{{count}} warnings',
        trendComparison: 'vs last month',
      },
      charts: {
        equipmentByType: 'Equipment distribution by type',
        licenseStatus: 'License status',
        upcomingExpirations: 'Upcoming expirations (6 months)',
        equipmentStatus: 'Equipment status',
        expirationsSeries: 'Expirations',
      },
      alerts: {
        title: 'Recent alerts',
        viewAll: 'View all',
        emptyTitle: 'All clear!',
        emptyDescription: 'No critical alerts to report',
        systemLabel: 'System alert',
        badgeCritical: 'Critical',
        badgeWarning: 'Warning',
        clientLabel: 'Client',
      },
      quickActions: {
        title: 'Quick actions',
        newClient: 'New client',
        newLicense: 'New license',
        newEquipment: 'New equipment',
        reports: 'Generate a report',
      },
      clientSummary: {
        title: 'My data',
        licenses: 'Licenses',
        equipment: 'Equipment',
        alerts: 'Alerts',
        totalValue: 'Total value',
      },
    },
    clients: {
      title: 'Client management',
      subtitle: 'Manage your client portfolio efficiently',
      button: 'New client',
      stats: {
        total: 'Total clients',
        sectors: 'Sectors',
        recent: 'Recent clients',
        recentDescription: 'Last 30 days',
      },
      filters: {
        title: 'Search and filters',
        description: 'Quickly find the client you need',
        searchPlaceholder: 'Search by client name...',
        sectorPlaceholder: 'Industry sector',
        allSectors: 'All sectors',
      },
      errors: {
        loadingTitle: 'Loading error',
        loadingDescription: 'An error occurred while loading clients or sectors.',
      },
      pagination: {
        range: 'Showing {{start}} to {{end}} of {{total}} clients',
      },
      table: {
        toastSuccess: 'Client deleted successfully',
        toastError: 'Error: {{message}}',
        deleteError: 'Error while deleting:',
        confirmMessage: 'Are you sure you want to delete the client "{{name}}"?',
        confirmWarning: 'This action will also delete all associated licenses and equipment.',
        emptyTitle: 'No clients found',
        emptyDescription: 'Start by adding your first client to see your data appear here.',
        emptyButton: 'Add a client',
        columns: {
          client: 'Client',
          contact: 'Contact',
          sector: 'Sector',
          location: 'Location',
          created: 'Created',
          actions: 'Actions',
        },
        actions: {
          openMenu: 'Open menu',
          view: 'View details',
          edit: 'Edit',
          delete: 'Delete',
        },
      },
      detail: {
        notFound: {
          title: 'Client not found',
          description: 'The requested client does not exist or you do not have permission to view it.',
          button: 'Back',
        },
        header: {
          back: 'Back',
          edit: 'Edit',
          sectorFallback: 'Sector not specified',
        },
        contactCard: {
          title: 'Contact information',
          description: 'Main coordinates and details',
          email: 'Email',
          phone: 'Phone',
          contact: 'Primary contact',
          address: 'Address',
          fieldFallback: 'Not provided',
          addressFallback: 'Not provided',
        },
        statsCard: {
          title: 'Statistics',
          licenses: 'Licenses',
          equipment: 'Equipment',
        },
        infoCard: {
          title: 'Information',
          created: 'Created on',
          updated: 'Last updated',
        },
        tabs: {
          licenses: 'Licenses',
          equipment: 'Equipment',
          licensesWithCount: 'Licenses ({{count}})',
          equipmentWithCount: 'Equipment ({{count}})',
          licensesEmpty: 'No licenses recorded',
          equipmentEmpty: 'No equipment recorded',
          viewAllLicenses: 'View all licenses ({{count}})',
          viewAllEquipment: 'View all equipment ({{count}})',
        },
        licenseItem: {
          description: '{{editor}} • {{expiry}}',
          expiry: 'Expires on {{date}}',
          unknownEditor: 'Unknown editor',
          cost: '{{amount}} CFA',
        },
        equipmentItem: {
          description: '{{type}} • {{brand}} {{model}}',
          obsolescence: 'Obsolescence expected on {{date}}',
          unknownType: 'Unknown type',
          unknownBrand: 'Unknown brand',
          cost: '{{amount}} CFA',
        },
        licenseStatus: {
          active: 'Active',
          expired: 'Expired',
          about_to_expire: 'Expiring soon',
          actif: 'Active',
          unknown: '{{status}}',
        },
        equipmentStatus: {
          actif: 'Active',
          obsolete: 'Obsolete',
          bientot_obsolete: 'Soon obsolete',
          en_maintenance: 'Under maintenance',
          retire: 'Retired',
          unknown: '{{status}}',
        },
      },
      form: {
        back: 'Back',
        loading: 'Loading client...',
        permission: {
          create: 'You do not have permission to create a client.',
          edit: 'You do not have permission to edit a client.',
        },
        headings: {
          createTitle: 'New client',
          editTitle: 'Edit client',
          createSubtitle: 'Add a new client to your portfolio',
          editSubtitle: 'Update the client information',
        },
        sections: {
          general: {
            title: 'General information',
            description: 'Provide the main information about the client',
            fields: {
              name: {
                label: 'Client name *',
                placeholder: 'e.g. TechCorp Ltd',
                description: 'Company or organization name',
              },
              sector: {
                label: 'Business sector',
                placeholder: 'Select a sector',
              },
              country: {
                label: 'Country',
                placeholder: 'Cameroon',
              },
            },
          },
          contact: {
            title: 'Contact information',
            description: 'Main contact details',
            fields: {
              contactPerson: {
                label: 'Primary contact',
                placeholder: 'e.g. John Doe',
              },
              contactEmail: {
                label: 'Email',
                placeholder: 'contact@example.com',
              },
              contactPhone: {
                label: 'Phone',
                placeholder: 'e.g. +237 6XX XX XX XX',
                description: 'Format: +237 6XXXXXXXX or 6XXXXXXXX',
              },
            },
          },
          address: {
            title: 'Address',
            description: 'Physical address of the client',
            fields: {
              address: {
                label: 'Full address',
                placeholder: 'e.g. 123 Technology Street, Business District',
              },
              city: {
                label: 'City',
                placeholder: 'e.g. Douala',
              },
              postalCode: {
                label: 'Postal code',
                placeholder: 'e.g. PO Box 1234',
              },
            },
          },
        },
        actions: {
          cancel: 'Cancel',
          create: 'Create client',
          update: 'Save changes',
          creating: 'Creating...',
          updating: 'Updating...',
        },
        notifications: {
          createSuccess: 'Client created successfully!',
          errorDefault: 'An error occurred while saving',
        },
        options: {
          sectors: {
            informatique: 'Information technology',
            sante: 'Healthcare',
            education: 'Education',
            finance: 'Finance',
            commerce: 'Commerce',
            industrie: 'Industry',
            services: 'Services',
            agriculture: 'Agriculture',
            transport: 'Transportation',
            telecommunications: 'Telecommunications',
            energie: 'Energy',
            immobilier: 'Real estate',
            tourisme: 'Tourism',
            autre: 'Other',
          },
        },
      },

    },
    equipmentTypes: {
      title: 'Equipment Types',
      subtitle: 'Manage your system\'s equipment types',
      stats: {
        total: 'Total',
        active: 'Active',
        inactive: 'Inactive',
      },
      search: {
        placeholder: 'Search for a type...',
      },
      buttons: {
        showInactive: 'Show inactive',
        hideInactive: 'Hide inactive',
        newType: 'New type',
      },
      table: {
        columns: {
          name: 'Name',
          code: 'Code',
          description: 'Description',
          status: 'Status',
          actions: 'Actions',
        },
        empty: 'No types found',
        actions: {
          edit: 'Edit',
          disable: 'Disable',
          delete: 'Delete',
        },
      },
      status: {
        active: 'Active',
        inactive: 'Inactive',
      },
      modal: {
        createTitle: 'New type',
        editTitle: 'Edit type',
        fields: {
          name: {
            label: 'Name',
            placeholder: 'PC / Computer',
            required: '*',
          },
          code: {
            label: 'Code',
            placeholder: 'PC',
            required: '*',
          },
          description: {
            label: 'Description',
            placeholder: 'Equipment type description',
          },
          icon: {
            label: 'Icon',
            placeholder: 'Select an icon',
          },
          isActive: 'Active type',
        },
        actions: {
          cancel: 'Cancel',
          save: 'Save',
          saving: 'Saving...',
        },
      },
      confirmations: {
        disable: 'Are you sure you want to disable the type "{{name}}"?',
        delete: 'Are you sure you want to permanently delete the type "{{name}}"?',
      },
    },
  },
}

function getFromPath(tree: TranslationTree, key: string): string | TranslationTree | undefined {
  const segments = key.split('.')
  return segments.reduce<unknown>((acc, segment) => {
    if (acc && typeof acc === 'object' && segment in acc) {
      // @ts-expect-error dynamic access
      return acc[segment]
    }
    return undefined
  }, tree) as string | TranslationTree | undefined
}

export function translate(language: SupportedLanguage, key: string, fallback?: string): string {
  const value = getFromPath(translations[language], key)
  if (typeof value === 'string') {
    return value
  }
  return fallback ?? key
}

export function getLanguageOptions() {
  return translations
}

export const supportedLanguages: SupportedLanguage[] = ['fr', 'en']
