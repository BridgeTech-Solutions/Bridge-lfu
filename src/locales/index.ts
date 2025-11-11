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
    users: {
      roles: {
        admin: 'Administrateur',
        technicien: 'Technicien',
        client: 'Client',
        unverified: 'Non vérifié',
      },
      list: {
        header: {
          title: 'Gestion des utilisateurs',
          subtitle: 'Gérer les comptes utilisateurs et leurs permissions',
        },
        actions: {
          new: 'Nouvel utilisateur',
        },
        stats: {
          total: 'Total utilisateurs',
          pending: 'En attente',
          admins: 'Administrateurs',
          technicians: 'Techniciens',
          clients: 'Clients',
        },
        filters: {
          searchPlaceholder: 'Rechercher par nom, email ou entreprise...',
          roleAll: 'Tous les rôles',
          roleUnverified: 'Non vérifiés',
          roleAdmin: 'Administrateurs',
          roleTechnician: 'Techniciens',
          roleClient: 'Clients',
        },
        table: {
          headers: {
            user: 'Utilisateur',
            contact: 'Contact',
            role: 'Rôle',
            client: 'Client associé',
            created: 'Créé le',
            actions: 'Actions',
          },
          empty: 'Aucun utilisateur trouvé',
          errors: {
            load: 'Erreur lors du chargement des utilisateurs',
            retry: 'Réessayer',
          }
        },
        dialogs: {
          createTitle: 'Créer un nouvel utilisateur',
          editTitle: "Modifier l'utilisateur",
          validateTitle: "Valider l'utilisateur",
          deleteConfirm: "Êtes-vous sûr de vouloir supprimer l'utilisateur \"{{name}}\" ? Cette action est irréversible.",
        },
        form: {
          firstName: 'Prénom *',
          lastName: 'Nom *',
          email: 'Email *',
          phone: 'Téléphone',
          company: 'Entreprise',
          password: 'Mot de passe *',
          role: 'Rôle',
          client: 'Client associé *',
          clientPlaceholder: 'Sélectionner un client',
          onlyAdminsEditEmail: "Seuls les administrateurs peuvent modifier l'email",
          onlyAdminsEditRole: 'Seuls les administrateurs peuvent modifier le rôle',
          cancel: 'Annuler',
          save: 'Enregistrer',
          creating: 'Création...',
          create: 'Créer',
          validating: 'Validation...',
          validate: 'Valider',
        },
        validateNotice: {
          title: "Validation d'utilisateur",
          text: 'Validez {{firstName}} {{lastName}} ({{email}})'
        },
        notAssigned: 'Non assigné',
      }
    },
    licenses: {
      header: {
        title: 'Licences',
        subtitle: 'Gestion des licences logicielles et matérielles',
      },
      actions: {
        export: 'Exporter',
        exporting: 'Export en cours...',
        new: 'Nouvelle licence',
        reload: 'Recharger les données',
      },
      exportMenu: {
        excel: 'Exporter en Excel (.xlsx)',
        csv: 'Exporter en CSV',
        json: 'Exporter en JSON'
      },
      stats: {
        total: 'Total',
        active: 'Actives',
        aboutToExpire: 'Bientôt expirées',
        expired: 'Expirées',
      },
      filters: {
        searchPlaceholder: 'Rechercher une licence...',
        searchLabel: 'Recherche',
        statusPlaceholder: 'Filtrer par statut',
        statusLabel: 'Statut',
        statusAll: 'Tous les statuts',
        statusActive: 'Actives',
        statusAboutToExpire: 'Bientôt expirées',
        statusExpired: 'Expirées',
        statusCancelled: 'Annulées',
        clientPlaceholder: 'Filtrer par client',
        clientLabel: 'Client',
        clientAll: 'Tous les clients',
        editorPlaceholder: 'Éditeur...',
        editorLabel: 'Éditeur',
        typePlaceholder: 'Type de licence',
        typeLabel: 'Type de licence',
        typeAll: 'Tous les types',
        loading: 'Chargement...',
        showFiltersButton: 'Afficher les filtres',
        hideFiltersButton: 'Masquer les filtres',
        filtersToggle: 'Filtres',
        expiryDateStartPlaceholder: 'Date début expiration',
        expiryDateEndPlaceholder: 'Date fin expiration',
        expiryDateStartLabel: 'Date début expiration',
        expiryDateEndLabel: 'Date fin expiration',
        expiryDateSectionTitle: 'Période d&apos;expiration',
        expiryDateSectionDescription: 'Filtrer les licences par date d&apos;expiration',
        resetButton: 'Réinitialiser'
      },
      table: {
        title: 'Liste des licences',
        loading: 'Chargement...',
        emptyTitle: 'Aucune licence',
        emptyDescription: 'Commencez par ajouter votre première licence.',
        emptyFiltered: 'Aucune licence ne correspond aux critères de recherche.',
        columns: {
          name: 'Nom',
          client: 'Client',
          editor: 'Éditeur',
          version: 'Version',
          type: 'Type',
          expiryDate: "Date d'expiration",
          cost: 'Coût',
          status: 'Statut',
          actions: 'Actions'
        }
      },
      actionsMenu: {
        open: 'Ouvrir le menu',
        actions: 'Actions',
        view: 'Voir les détails',
        edit: 'Modifier',
        delete: 'Supprimer',
        cancel: 'Annuler',
        reactivate: 'Réactiver'
      },
      status: {
        active: 'Active',
        expired: 'Expirée',
        about_to_expire: 'Bientôt expirée',
        cancelled: 'Annulée',
        unknown: 'Inconnu'
      },
      relativeExpiry: {
        expiredDays: 'Expirée depuis {{days}} jours',
        expireToday: "Expire aujourd'hui",
        expireTomorrow: 'Expire demain',
        expireInDays: 'Expire dans {{days}} jours'
      },
      confirms: {
        delete: 'Êtes-vous sûr de vouloir supprimer la licence "{{name}}" ? Cette action est irréversible.',
        cancel: 'Êtes-vous sûr de vouloir annuler la licence "{{name}}" ?',
        reactivate: 'Êtes-vous sûr de vouloir réactiver la licence "{{name}}" ?'
      },
      errors: {
        loadTitle: 'Erreur de chargement',
        loadDescription: 'Une erreur est survenue lors de la récupération des licences.'
      },
      pagination: {
        info: 'Affichage',
      }
      ,
      form: {
        header: {
          back: 'Retour',
          createTitle: 'Nouvelle licence',
          editTitle: 'Modifier la licence',
          createSubtitle: 'Créer une nouvelle licence logicielle ou matérielle',
          editSubtitle: 'Modifier les informations de la licence',
        },
        sections: {
          mainInfo: 'Informations principales',
          datesAndCosts: 'Dates et coûts',
          description: 'Description',
        },
        fields: {
          name: {
            label: 'Nom de la licence *',
            placeholder: 'Ex: Microsoft Office 365',
          },
          supplierId: {
            label: 'Éditeur/Fournisseur',
            placeholder: 'Sélectionner un fournisseur',
            none: 'Aucun',
          },
          clientId: {
            label: 'Client *',
            placeholder: 'Sélectionner un client',
          },
          version: {
            label: 'Version',
            placeholder: 'Ex: 2023',
          },
          licenseKey: {
            label: 'Clé de licence',
            placeholder: 'Clé de licence (masquée)'
          },
          typeId: {
            label: 'Type de licence',
            placeholder: 'Sélectionner un type',
          },
          purchaseDate: {
            label: "Date d'achat",
          },
          expiryDate: {
            label: "Date d'expiration *",
          },
          cost: {
            label: 'Coût (FCFA)',
            placeholder: '0.00',
          },
          description: {
            label: 'Description (optionnel)',
            placeholder: 'Informations complémentaires sur la licence...'
          }
        },
        alerts: {
          expired: 'Cette licence est déjà expirée',
          expiresInOne: 'Cette licence expire demain',
          expiresIn: 'Cette licence expire dans {{days}} jours',
        },
        actions: {
          cancel: 'Annuler',
          creating: 'Création...',
          updating: 'Modification...',
          create: 'Créer la licence',
          save: 'Enregistrer les modifications'
        },
        toasts: {
          created: 'Licence créée avec succès.',
          updated: 'Licence mise à jour avec succès.',
          submitError: 'Une erreur est survenue lors de la soumission.',
          keyVisible: 'Clé de licence visible pendant 60 secondes.'
        },
        validation: {
          name: {
            required: 'Le nom est obligatoire'
          },
          expiryDate: {
            required: "La date d'expiration est obligatoire"
          },
          clientId: {
            required: 'Le client est obligatoire'
          },
        }
      }
      ,
      detail: {
        back: 'Retour',
        actions: {
          edit: 'Modifier',
          delete: 'Supprimer',
          hide: 'Masquer',
          show: 'Afficher',
          addFile: 'Ajouter un fichier'
        },
        sections: {
          generalInfo: 'Informations générales',
          attachments: 'Pièces jointes',
          importantDates: 'Dates importantes',
          financialInfo: 'Informations financières',
          quickActions: 'Actions rapides'
        },
        fields: {
          name: 'Nom',
          status: 'Statut',
          editor: 'Éditeur',
          version: 'Version',
          licenseType: 'Type de licence',
          client: 'Client',
          createdBy: 'Créé par',
          licenseKey: 'Clé de licence',
          description: 'Description',
          purchaseDate: "Date d'achat",
          expiryDate: "Date d'expiration",
          createdAt: 'Créé le',
          updatedAt: 'Modifié le',
          totalCost: 'Coût total',
          licenseDuration: 'Durée de la licence',
          costPerDay: 'Coût par jour'
        },
        tableHeaders: {
          fileName: 'Nom du fichier',
          type: 'Type',
          size: 'Taille',
          uploadedBy: 'Ajouté par',
          date: 'Date',
          actions: 'Actions'
        },
        fileTypes: {
          contract: 'Contrat',
          invoice: 'Facture',
          certificate: 'Certificat',
          manual: 'Manuel',
          other: 'Autre'
        },
        fileSizes: {
          bytes: 'octets',
          kb: 'Ko',
          mb: 'Mo',
          gb: 'Go'
        },
        expiryAlert: {
          expired: 'Expirée depuis',
          expiresIn: 'Expire dans',
          days: 'jours'
        },
        license: 'la licence',
        keyDialog: {
          title: 'Révéler la clé de licence',
          description: 'Entrez votre mot de passe pour révéler la clé de licence.',
          fields: {
            password: 'Mot de passe'
          },
          actions: {
            cancel: 'Annuler',
            show: 'Afficher'
          }
        },
        deleteDialog: {
          title: 'Confirmer la suppression',
          description: 'Êtes-vous sûr de vouloir supprimer cette licence ? Cette action est irréversible.'
        },
        uploadDialog: {
          title: 'Ajouter une pièce jointe',
          description: 'Sélectionnez un fichier à ajouter à cette licence.',
          fields: {
            file: 'Fichier',
            fileType: 'Type de fichier'
          },
          actions: {
            cancel: 'Annuler',
            add: 'Ajouter'
          }
        },
        emptyState: {
          noAttachments: 'Aucune pièce jointe',
          noFilesAdded: 'Aucun fichier n\'a été ajouté à cette licence.',
          addFirstFile: 'Ajouter le premier fichier'
        }
      }
    },
    reports: {
      charts: {
        licenseStatusTitle: 'Statuts des Licences',
        equipmentStatusTitle: 'Statuts des Équipements',
        monthlyExpirationsTitle: 'Expirations de Licences par Mois',
      },
      empty: {
        licenseStatus: 'Aucune licence enregistrée. Ajoutez des licences pour visualiser les statuts.',
        equipmentStatus: 'Aucun équipement enregistré. Les statuts apparaîtront après l\'ajout d\'équipements.',
        monthlyExpirations: 'Aucune expiration à venir. Les expirations apparaîtront lorsque des licences auront des dates d\'échéance.',
      },
      generator: {
        title: 'Générateur de Rapports',
        description: 'Configurez et générez des rapports personnalisés au format JSON, CSV, Excel ou PDF',
      },
      ui: {
        headerTitle: 'Rapports et Statistiques',
        headerSubtitle: 'Générez et visualisez des rapports détaillés sur vos licences et équipements au format JSON, CSV, Excel ou PDF.',
        glanceLicenses: 'Total Licences',
        glanceEquipment: 'Total Équipements',
        glanceTotalValue: 'Valeur Totale',
        glanceClients: 'Clients',
        autoDownloadNotice: 'Le fichier {{format}} sera téléchargé automatiquement',
      },
      filters: {
        type: 'Type de rapport',
        typePlaceholder: 'Choisir un type',
        client: 'Client',
        clientPlaceholder: 'Tous les clients',
        status: 'Statut',
        format: 'Format',
        formatPlaceholder: 'Choisir un format',
        dateFrom: 'Date de début',
        dateTo: 'Date de fin',
        licenseType: 'Type de licence',
        equipmentType: 'Type d\'équipement',
        licenseTypePlaceholder: 'Tous les types',
        equipmentTypePlaceholder: 'Tous les types',
      },
      options: {
        typeLicenses: 'Licences',
        typeEquipment: 'Équipements',
        statusAll: 'Tous les statuts',
        clientAll: 'Tous les clients',
        licenseTypeAll: 'Tous les types de licences',
        equipmentTypeAll: 'Tous les types d\'équipements',
        statusLicense: {
          active: 'Actif',
          expired: 'Expiré',
          about_to_expire: 'Bientôt expiré',
        },
        statusEquipment: {
          active: 'Actif',
          obsolete: 'Obsolète',
          bientot_obsolete: 'Bientôt obsolète',
          en_maintenance: 'En maintenance',
          retire: 'Retiré',
        },
        formatJson: 'Aperçu (JSON)',
        formatCsv: 'Téléchargement CSV',
        formatExcel: 'Téléchargement Excel',
        formatPdf: 'Téléchargement PDF',
      },
      actions: {
        reset: 'Réinitialiser',
        generate: 'Générer',
        generating: 'Génération...',
        quickTitle: 'Rapports Rapides',
        quickSubtitle: 'Téléchargez des rapports prédéfinis au format de votre choix',
        quickExpiredLicenses: 'Licences expirées',
        quickObsoleteEquipment: 'Équipements obsolètes',
        quickExpiringSoon: 'Licences qui expirent bientôt',
        btnCsv: 'CSV',
        btnExcel: 'Excel',
        btnPdf: 'PDF',
      },
      tableHeaders: {
        name: 'Nom',
        editor: 'Éditeur',
        client: 'Client',
        expiration: 'Expiration',
        status: 'Statut',
        cost: 'Coût',
        daysUntilExpiry: 'Jours restants',
        type: 'Type',
        brand: 'Marque',
        obsolescence: 'Obsolescence',
        daysUntilObsolescence: 'Jours restants',
      }
    },
    profile: {
      header: {
        title: 'Mon Profil',
        subtitle: 'Gérez vos informations personnelles et vos paramètres de compte.',
      },
      status: {
        notFoundTitle: 'Profil non trouvé',
        notFoundDescription: 'Impossible de charger les informations du profil.',
      },
      cards: {
        personalInfo: {
          title: 'Informations personnelles',
          description: 'Vos informations de base et de contact',
          fields: {
            fullName: 'Nom complet',
            email: 'Email',
            phone: 'Téléphone',
            phoneFallback: 'Non renseigné',
            company: 'Entreprise',
            companyFallback: 'Non renseignée',
          },
        },
        security: {
          title: 'Sécurité',
          description: 'Gérez votre mot de passe et vos paramètres de sécurité',
          passwordLabel: 'Mot de passe',
          maskedValue: '••••••••••••',
        },
        account: {
          title: 'Informations du compte',
          memberSince: 'Membre depuis',
          memberSinceFallback: 'Non disponible',
          client: 'Client associé',
          clientFallback: 'Non associé',
        },
      },
      dialogs: {
        edit: {
          title: 'Modifier le profil',
          description: 'Modifiez vos informations personnelles. Les modifications seront sauvegardées automatiquement.',
          fields: {
            firstName: { label: 'Prénom', placeholder: 'Votre prénom' },
            lastName: { label: 'Nom', placeholder: 'Votre nom' },
            email: { label: 'Email', placeholder: 'votre@email.com' },
            phone: { label: 'Téléphone', placeholder: '+237 6XX XXX XXX' },
            company: { label: 'Entreprise', placeholder: 'Nom de votre entreprise' },
          },
          actions: {
            cancel: 'Annuler',
            save: 'Enregistrer',
            saving: 'Enregistrement...',
          },
        },
        password: {
          title: 'Changer le mot de passe',
          description: 'Saisissez votre mot de passe actuel puis votre nouveau mot de passe.',
          fields: {
            current: { label: 'Mot de passe actuel', placeholder: 'Votre mot de passe actuel' },
            new: { label: 'Nouveau mot de passe', placeholder: 'Au moins 8 caractères' },
            confirm: { label: 'Confirmer le nouveau mot de passe', placeholder: 'Confirmez votre nouveau mot de passe' },
          },
          actions: {
            cancel: 'Annuler',
            submit: 'Changer le mot de passe',
            submitting: 'Modification...',
          },
          validations: {
            mismatch: 'Les mots de passe ne correspondent pas',
            minLength: 'Le mot de passe doit contenir au moins 6 caractères',
          },
        },
      },
      common: {
        edit: 'Modifier',
      },
    },
    notifications: {
      page: {
        title: 'Notifications',
        unreadCount: '{{unread}} non lue{{plural}} sur {{total}} notification{{totalPlural}}',
        tabs: {
          all: 'Toutes ({{count}})',
          unread: 'Non lues ({{count}})',
          settings: 'Paramètres'
        },
        actions: {
          markAllAsRead: 'Tout marquer comme lu',
          filter: 'Filtrer'
        },
        stats: {
          total: 'Total',
          unread: 'Non lues',
          licenses: 'Licences',
          equipment: 'Équipements'
        },
        filters: {
          searchPlaceholder: 'Rechercher dans les notifications...',
          typePlaceholder: 'Tous les types',
          typeOptions: {
            license_expiry: 'Expiration licence',
            equipment_obsolescence: 'Obsolescence équipement',
            new_unverified_user: 'Nouvel utilisateur',
            general: 'Général'
          },
          statusPlaceholder: 'Tous les statuts',
          statusOptions: {
            read: 'Lues',
            unread: 'Non lues'
          }
        },
        list: {
          loading: 'Chargement des notifications...',
          empty: 'Aucune notification',
          emptyDescription: 'Vous n\'avez aucune notification pour le moment.',
          noUnread: 'Aucune notification non lue',
          actions: {
            markAsRead: 'Marquer comme lue',
            markAsUnread: 'Marquer comme non lue',
            delete: 'Supprimer',
            viewDetails: 'Cliquer pour voir les détails'
          },
          types: {
            license_expiry: 'Expiration licence',
            equipment_obsolescence: 'Obsolescence équipement',
            new_unverified_user: 'Nouvel utilisateur',
            general: 'Général'
          },
          time: {
            justNow: "À l'instant",
            minutes: 'Il y a {{count}} minute',
            minutesPlural: 'Il y a {{count}} minutes',
            hours: 'Il y a {{count}} heure',
            hoursPlural: 'Il y a {{count}} heures',
            days: 'Il y a {{count}} jour',
            daysPlural: 'Il y a {{count}} jours'
          }
        },
        pagination: {
          page: 'Page {{current}} sur {{total}}',
          previous: 'Précédent',
          next: 'Suivant'
        },
        settings: {
          title: 'Paramètres des notifications',
          emailLabel: 'Notifications par email',
          emailDescription: 'Recevoir les notifications par email',
          licenseAlertsLabel: 'Alertes d\'expiration des licences',
          licenseAlertsDescription: 'Jours avant expiration pour recevoir une alerte',
          equipmentAlertsLabel: 'Alertes d\'obsolescence des équipements',
          equipmentAlertsDescription: 'Jours avant obsolescence pour recevoir une alerte',
          addButton: '+ Ajouter',
          saveButton: 'Sauvegarder les paramètres',
          saving: 'Sauvegarde...',
          addAlertPrompt: 'Ajouter une alerte {{type}} (nombre de jours):',
          daySuffix: 'jour{{plural}}',
          cancel: 'Annuler'
        }
      }
    },
    equipmentTypes: {                               
      title: 'Gestion des types d\'équipement',
      subtitle: 'Gérez les différentes catégories d\'équipement',
      stats: {
        total: 'Total types',
        active: 'Actifs',
        inactive: 'Inactifs',
      },
      search: {
        placeholder: 'Rechercher par nom, site ou contact...',
      },
      buttons: {
        showInactive: 'Afficher les inactifs',
        hideInactive: 'Masquer les inactifs',
        newType: 'Nouveau type',
      },
      table: {
        columns: {
          name: 'Type',
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
        createTitle: 'Créer un type',
        editTitle: 'Modifier le type',
        description: 'Gérez les informations du type d\'équipement.',
        fields: {
          name: {
            label: 'Nom',
            required: '(obligatoire)',
            placeholder: 'Nom du type',
          },
          code : {
            label: 'Code',
            required: '(obligatoire)',
            placeholder: 'Code du type',
          },
          description: {
            label: 'Description',
            placeholder: 'Description du type',
          },
          icon: {
            label: 'Icône',
            placeholder: 'Icône du type',
          },
          isActive: 'Type actif',
        },
         actions: {
            cancel: 'Annuler',
            save: 'Enregistrer',
            create: 'Créer',
            saving: 'Enregistrement...',
         } ,
      },
      confirmations: {
        disable: 'Voulez-vous désactiver le type "{{name}}" ? Il pourra être réactivé plus tard.',
        delete: 'Voulez-vous supprimer définitivement le type "{{name}}" ? Cette action est irréversible.',
      },
    },
    equipmentBrands: {
      title: 'Gestion des marques',
      subtitle: 'Gérez les fabricants et marques d\'équipement',
      stats: {
        total: 'Total marques',
        active: 'Actives',
        inactive: 'Inactives',
      },
      search: {
        placeholder: 'Rechercher par nom, site ou contact...',
      },
      buttons: {
        showInactive: 'Afficher les inactives',
        hideInactive: 'Masquer les inactives',
        newBrand: 'Nouvelle marque',
      },
      table: {
        columns: {
          name: 'Marque',
          contact: 'Contact',
          website: 'Site web',
          status: 'Statut',
          actions: 'Actions',
        },
        empty: 'Aucune marque trouvée',
        actions: {
          edit: 'Modifier',
          disable: 'Désactiver',
          delete: 'Supprimer',
        },
      },
      status: {
        active: 'Active',
        inactive: 'Inactive',
      },
      modal: {
        createTitle: 'Créer une marque',
        editTitle: 'Modifier la marque',
        description: 'Gérez les informations du fabricant ou fournisseur de la marque.',
        fields: {
          name: {
            label: 'Nom',
            required: '(obligatoire)',
            placeholder: 'Nom de la marque',
          },
          website: {
            label: 'Site web',
            placeholder: 'https://example.com',
          },
          supportEmail: {
            label: 'Email support',
            placeholder: 'support@example.com',
          },
          supportPhone: {
            label: 'Téléphone support',
            placeholder: '+237612345678',
          },
          notes: {
            label: 'Notes',
            placeholder: 'Informations supplémentaires...',
          },
          isActive: {
            label: 'Marque active',
          },
        },
        actions: {
          cancel: 'Annuler',
          save: 'Enregistrer',
          create: 'Créer',
          saving: 'Enregistrement...',
        },
      },
      confirmations: {
        disable: 'Voulez-vous désactiver la marque "{{name}}" ? Elle pourra être réactivée plus tard.',
        delete: 'Voulez-vous supprimer définitivement la marque "{{name}}" ? Cette action est irréversible.',
      },
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
        licenseSuppliers: 'Éditeurs & Fournisseurs',
        licenseTypes: 'Types de licences',
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
        equipmentBrands: 'Marques d\'équipement',
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
        upcomingExpirations: 'Expirations à venir (12 mois)',
        equipmentStatus: 'Statut des équipements',
        expirationsSeries: 'Expirations',
        empty: {
          equipmentByType: "Aucun équipement enregistré. Ajoutez des équipements pour voir la répartition par type.",
          licenseStatus: "Aucune licence enregistrée. Ajoutez des licences pour visualiser les statuts.",
          upcomingExpirations: "Aucune expiration à venir. Les expirations apparaîtront lorsque des licences auront des dates d'échéance.",
          equipmentStatus: "Aucun équipement enregistré. Les statuts apparaîtront après l'ajout d'équipements.",
          equipmentObsolescence: 'Aucune obsolescence prévue pour les 12 prochains mois.'

        }
      },
      clientFilter: {
        label: 'Filtrer par client :',
        placeholder: 'Sélectionner un client',
        allClients: 'Tous les clients'
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
      licenseTypes: {
        title: 'Gestion des types de licence',
        subtitle: 'Gérez les différentes catégories de licence',
        loading: 'Chargement...',
        stats: {
          total: 'Total des types',
          active: 'Actifs',
          inactive: 'Inactifs',
        },
        search: {
          placeholder: 'Rechercher par nom, code ou description...',
        },
        buttons: {
          showInactive: 'Afficher les inactifs',
          hideInactive: 'Masquer les inactifs',
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
            view: 'Voir',
            edit: 'Modifier',
            delete: 'Supprimer',
          },
        },
        status: {
          active: 'Actif',
          inactive: 'Inactif',
        },
        dialogs: {
          create: {
            title: 'Créer un type de licence',
            description: 'Créez un nouveau type de licence pour organiser vos licences.',
          },
          edit: {
            title: 'Modifier le type de licence',
            description: 'Modifiez les informations du type de licence.',
          },
          delete: {
            title: 'Confirmer la suppression',
            description: 'Êtes-vous sûr de vouloir supprimer ce type de licence ? Cette action est irréversible.',
            cancel: 'Annuler',
            confirm: 'Supprimer',
          },
        },
        form: {
          name: {
            label: 'Nom',
            placeholder: 'Ex: Logiciel',
          },
          code: {
            label: 'Code',
            placeholder: 'Ex: SOFTWARE',
          },
          description: {
            label: 'Description',
            placeholder: 'Description du type de licence', 
          },
          isActive: 'Type actif',
          actions: {
            cancel: 'Annuler',
            create: 'Créer',
            save: 'Enregistrer',
          },
          'name.placeholder': 'Ex: Logiciel',
          'code.placeholder': 'Ex: SOFTWARE',
          'description.placeholder': 'Description du type de licence',
        },
        messages: {
          createSuccess: 'Type de licence créé avec succès',
          updateSuccess: 'Type de licence modifié avec succès',
          deleteSuccess: 'Type de licence supprimé avec succès',
          createError: 'Erreur lors de la création',
          updateError: 'Erreur lors de la modification',
          deleteError: 'Erreur lors de la suppression',
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
    equipment: {
      list: {
        title: 'Équipements',
        subtitle: 'Gestion des équipements informatiques',
        count: '({{count}} équipement{{plural}})',
        actions: {
          refresh: 'Rafraîchir statuts',
          export: 'Exporter',
          exporting: 'Export en cours...',
          exportExcel: 'Exporter en Excel (.xlsx)',
          exportCsv: 'Exporter en CSV',
          exportJson: 'Exporter en JSON',
          create: 'Nouvel équipement',
        },
        stats: {
          total: { title: 'Total équipements', description: 'Équipements suivis' },
          maintenance: { title: 'En maintenance', description: 'Interventions en cours' },
          soonObsolete: { title: 'Bientôt obsolètes', description: 'À surveiller prochainement' },
          totalCost: { title: 'Coût total estimé', description: 'Somme déclarée des équipements' },
        },
        search: {
          placeholder: 'Rechercher par nom, marque, modèle...',
          filters: 'Filtres',
          reset: 'Réinitialiser',
        },
        filters: {
          type: {
            label: 'Type',
            all: 'Tous les types',
          },
          brand: {
            label: 'Marque',
            all: 'Toutes les marques',
          },
          status: {
            label: 'Statut',
            options: {
              actif: 'Actif',
              en_maintenance: 'En maintenance',
              bientot_obsolete: 'Bientôt obsolète',
              obsolete: 'Obsolète',
              retire: 'Retiré',
            },
          },
          client: {
            label: 'Client',
            all: 'Tous les clients',
          },
          clear: 'Réinitialiser',
          obsolescenceStartLabel: 'Date début obsolescence',
          obsolescenceEndLabel: 'Date fin obsolescence', 
          obsolescenceStartPlaceholder: 'Date début obsolescence',
          obsolescenceEndPlaceholder: 'Date fin obsolescence',
          obsolescenceSectionTitle: 'Période d\'obsolescence',
          obsolescenceSectionDescription: 'Filtrer les équipements par date d&apos;obsolescence',
        },
        table: {
          headers: {
            equipment: 'Équipement',
            type: 'Type',
            status: 'Statut',
            client: 'Client',
            obsolescence: 'Obsolescence',
            cost: 'Coût',
            actions: 'Actions',
          },
          dropdown: { view: 'Voir détails', edit: 'Modifier', delete: 'Supprimer' },
          empty: {
            title: 'Aucun équipement trouvé',
            descriptionNoFilters: 'Commencez par ajouter votre premier équipement.',
            descriptionFiltered: 'Aucun équipement ne correspond à vos critères de recherche.',
            action: 'Créer un équipement',
          },
        },
        pagination: {
          summary: 'Affichage de {{start}} à {{end}} sur {{total}} résultats',
          previous: 'Précédent',
          next: 'Suivant',
          page: 'Page {{page}} sur {{total}}',
        },
        deleteDialog: {
          title: 'Confirmer la suppression',
          description: 'Êtes-vous sûr de vouloir supprimer l\'équipement « {{name}} » ? Cette action est irréversible.',
          cancel: 'Annuler',
          confirm: 'Supprimer',
          deleting: 'Suppression...',
        },
        errors: {
          load: 'Erreur lors du chargement des équipements',
          retry: 'Réessayer',
        },
      },
      form: {
        header: {
          back: 'Retour',
          createTitle: 'Nouvel équipement',
          editTitle: "Modifier l'équipement",
          createSubtitle: 'Créez un nouvel équipement',
          editSubtitle: "Modifiez les informations de l'équipement",
        },
        sections: {
          main: 'Informations générales',
          dates: 'Dates importantes',
          client: 'Client *',
          finance: 'Informations financières',
        },
        fields: {
          name: { label: 'Nom *', placeholder: "Nom de l'équipement" },
          type: { label: 'Type *', placeholder: 'Sélectionner un type', empty: 'Aucun type disponible' },
          brand: { label: 'Marque *', placeholder: 'Sélectionner une marque', empty: 'Aucune marque disponible' },
          model: { label: 'Modèle', placeholder: "Modèle de l'équipement" },
          serial: { label: 'Numéro de série', placeholder: 'Numéro de série' },
          location: { label: 'Emplacement', placeholder: 'Emplacement physique' },
          status: { label: 'Statut' },
          description: { label: 'Description', placeholder: "Description détaillée de l'équipement" },
          purchaseDate: { label: "Date d'achat" },
          warrantyEnd: { label: 'Fin de garantie' },
          obsolescence: { label: 'Obsolescence estimée' },
          endOfSale: { label: 'Fin de commercialisation' },
          client: { label: 'Client *', placeholder: 'Sélectionner un client', empty: 'Aucun client disponible' },
          cost: { label: 'Coût (FCFA)', placeholder: '0.00' },
        },
        actions: {
          saving: 'Enregistrement...',
          save: 'Enregistrer les modifications',
          create: "Créer l'équipement",
          cancel: 'Annuler',
        },
      },
      status: {
        actif: 'Actif',
        en_maintenance: 'En maintenance',
        bientot_obsolete: 'Bientôt obsolète',
        obsolete: 'Obsolète',
        retire: 'Retiré',
        default: '{{status}}',
      },
      detail: {
        back: 'Retour',
        actions: {
          markActive: 'Marquer actif',
          markMaintenance: 'Mettre en maintenance',
          edit: 'Modifier',
          delete: 'Supprimer',
        },
        deleteAlert: {
          description: 'Êtes-vous sûr de vouloir supprimer cet équipement ? Cette action est irréversible.',
          confirm: 'Confirmer la suppression',
          cancel: 'Annuler',
        },
        infoCard: { title: 'Informations générales' },
        fields: {
          name: 'Nom',
          type: 'Type',
          status: 'Statut',
          serialNumber: 'Numéro de série',
          brand: 'Marque',
          model: 'Modèle',
          location: 'Emplacement',
          cost: 'Coût',
          description: 'Description',
        },
        attachments: {
          title: 'Pièces jointes',
          loading: 'Chargement...',
          add: 'Ajouter un fichier',
          emptyTitle: 'Aucune pièce jointe',
          emptyDescription: 'Aucun fichier n\'a été ajouté à cet équipement.',
          emptyAction: 'Ajouter le premier fichier',
          table: {
            fileName: 'Nom du fichier',
            type: 'Type',
            size: 'Taille',
            addedBy: 'Ajouté par',
            date: 'Date',
            actions: 'Actions',
            types: {
              invoice: 'Facture',
              manual: 'Manuel',
              warranty: 'Garantie',
              spec: 'Spécification',
              other: 'Autre',
            },
          },
          download: 'Télécharger',
          delete: 'Supprimer',
        },
        dates: {
          title: 'Dates importantes',
          purchase: 'Date d\'achat',
          warranty: 'Fin de garantie',
          obsolescence: 'Obsolescence estimée',
          obsolescenceIn: 'Dans {{days}} jours',
          obsolescencePast: 'Déjà obsolète',
          endOfSale: 'Fin de commercialisation',
        },
        client: { title: 'Client', email: 'Email' },
        traceability: {
          title: 'Informations de traçabilité',
          createdBy: 'Créé par',
          createdAt: 'Créé le',
          updatedAt: 'Modifié le',
        },
        uploadDialog: {
          title: 'Ajouter une pièce jointe',
          description: 'Sélectionnez un fichier à ajouter à cet équipement. Formats acceptés : PDF, images, documents Office.',
          fileLabel: 'Fichier',
          fileTypeLabel: 'Type de fichier',
          typeOptions: {
            invoice: 'Facture',
            manual: 'Manuel',
            warranty: 'Garantie',
            spec: 'Spécification technique',
            other: 'Autre',
          },
          cancel: 'Annuler',
          submit: 'Ajouter',
          submitting: 'Upload...',
        },
      },
    },
    licenseSuppliers: {
      title: 'Éditeurs & Fournisseurs',
      subtitle: 'Gérez les fournisseurs de licences',
      stats: {
        total: 'Total fournisseurs',
        active: 'Actifs',
        inactive: 'Inactifs',
      },
      search: {
        placeholder: 'Rechercher un fournisseur...',
      },
      buttons: {
        showInactive: 'Afficher inactifs',
        hideInactive: 'Masquer inactifs',
        newSupplier: 'Nouveau fournisseur',
      },
      table: {
        columns: {
          name: 'Nom',
          contact: 'Contact',
          details: 'Détails',
          status: 'Statut',
          actions: 'Actions',
        },
        actions: {
          edit: 'Modifier',
          disable: 'Désactiver',
          delete: 'Supprimer',
        },
        empty: 'Aucun fournisseur trouvé',
      },
      status: {
        active: 'Actif',
        inactive: 'Inactif',
      },
      confirmations: {
        disable: 'Êtes-vous sûr de vouloir désactiver le fournisseur "{{name}}" ? Cela le retirera de la liste des choix.',
        delete: 'Le fournisseur "{{name}}" est déjà inactif. Voulez-vous le supprimer définitivement ? Cette action est irréversible.',
      },
      modal: {
        createTitle: 'Nouveau fournisseur',
        editTitle: 'Modifier le fournisseur',
        description: 'Remplissez les informations du fournisseur',
        fields: {
          name: {
            label: 'Nom du fournisseur',
            required: '*',
            placeholder: 'Ex : Microsoft',
          },
          contactEmail: {
            label: 'Email de contact',
            placeholder: 'contact@fournisseur.com',
          },
          contactPhone: {
            label: 'Téléphone',
            placeholder: 'Ex : +237 6XX XX XX XX',
          },
          website: {
            label: 'Site web',
            placeholder: 'https://www.exemple.com',
          },
          address: {
            label: 'Adresse',
            placeholder: 'Adresse postale complète',
          },
          notes: {
            label: 'Notes',
            placeholder: 'Informations complémentaires (comptes clients, interlocuteurs...)',
          },
          status: {
            label: 'Statut',
            active: 'Actif',
            inactive: 'Inactif'
          },
          isActive: 'Fournisseur actif',
        },
        actions: {
          cancel: 'Annuler',
          save: 'Enregistrer',
          saving: 'Enregistrement...',
        },
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
    users: {
      roles: {
        admin: 'Administrator',
        technicien: 'Technician',
        client: 'Client',
        unverified: 'Unverified',
      },
      list: {
        header: {
          title: 'User management',
          subtitle: 'Manage user accounts and their permissions',
        },
        actions: {
          new: 'New user',
        },
        stats: {
          total: 'Total users',
          pending: 'Pending',
          admins: 'Administrators',
          technicians: 'Technicians',
          clients: 'Clients',
        },
        filters: {
          searchPlaceholder: 'Search by name, email or company...',
          roleAll: 'All roles',
          roleUnverified: 'Unverified',
          roleAdmin: 'Administrators',
          roleTechnician: 'Technicians',
          roleClient: 'Clients',
        },
        table: {
          headers: {
            user: 'User',
            contact: 'Contact',
            role: 'Role',
            client: 'Linked client',
            created: 'Created',
            actions: 'Actions',
          },
          empty: 'No users found',
          errors: {
            load: 'Error while loading users',
            retry: 'Retry',
          }
        },
        dialogs: {
          createTitle: 'Create a new user',
          editTitle: 'Edit user',
          validateTitle: 'Validate user',
          deleteConfirm: 'Are you sure you want to delete the user "{{name}}"? This action cannot be undone.',
        },
        form: {
          firstName: 'First name *',
          lastName: 'Last name *',
          email: 'Email *',
          phone: 'Phone',
          company: 'Company',
          password: 'Password *',
          role: 'Role',
          client: 'Linked client *',
          clientPlaceholder: 'Select a client',
          onlyAdminsEditEmail: 'Only administrators can edit the email',
          onlyAdminsEditRole: 'Only administrators can edit the role',
          cancel: 'Cancel',
          save: 'Save',
          creating: 'Creating...',
          create: 'Create',
          validating: 'Validating...',
          validate: 'Validate',
        },
        validateNotice: {
          title: 'User validation',
          text: 'Validate {{firstName}} {{lastName}} ({{email}})'
        },
        notAssigned: 'Not assigned',
      },
      detail: {
        notFound: {
          title: 'User not found',
          description: 'The requested user does not exist or you do not have permission to view it.'
        },
        backToList: 'Back to list',
        back: 'Back',
        edit: 'Edit',
        tabs: {
          profile: 'Profile',
          permissions: 'Permissions',
          activity: 'Activity'
        },
        sections: {
          personalInfo: 'Personal information',
          status: 'Status',
          permissions: 'Permissions and access',
          activityLog: 'Activity log'
        },
        fields: {
          firstName: 'First name',
          lastName: 'Last name',
          memberSince: 'Member since',
          role: 'Role',
          linkedClient: 'Linked client',
          lastUpdated: 'Last updated'
        },
        activity: {
          activities: 'activities',
          noActivity: 'No activity recorded for this user',
          validationDetails: 'Validation details',
          beforeValidation: 'Before validation',
          afterValidation: 'After validation',
          role: 'Role',
          client: 'Client',
          none: 'None',
          recordId: 'Record ID',
          ipAddress: 'IP address',
          notAvailable: 'Not available',
          browser: 'Browser',
          changesMade: 'Changes made',
          oldValue: 'Old value',
          newValue: 'New value',
          dataCreated: 'Data created',
          dataDeleted: 'Data deleted'
        },
        editDialog: {
          title: 'Edit user'
        }
      }
    },
    licenses: {
      header: {
        title: 'Licenses',
        subtitle: 'Manage software and hardware licenses',
      },
      actions: {
        export: 'Export',
        exporting: 'Export in progress...',
        new: 'New license',
        reload: 'Reload data',
      },
      exportMenu: {
        excel: 'Export to Excel (.xlsx)',
        csv: 'Export to CSV',
        json: 'Export to JSON'
      },
      stats: {
        total: 'Total',
        active: 'Active',
        aboutToExpire: 'Expiring soon',
        expired: 'Expired',
      },
      filters: {
        searchPlaceholder: 'Search a license...',
        searchLabel: 'Search',
        statusPlaceholder: 'Filter by status',
        statusLabel: 'Status',
        statusAll: 'All statuses',
        statusActive: 'Active',
        statusAboutToExpire: 'Expiring soon',
        statusExpired: 'Expired',
        statusCancelled: 'Cancelled',
        clientPlaceholder: 'Filter by client',
        clientLabel: 'Client',
        clientAll: 'All clients',
        editorPlaceholder: 'Editor...',
        editorLabel: 'Editor',
        typePlaceholder: 'License type',
        typeLabel: 'License type',
        typeAll: 'All types',
        loading: 'Loading...',
        showFiltersButton: 'Show filters',
        hideFiltersButton: 'Hide filters',
        filtersToggle: 'Filters',
        expiryDateStartPlaceholder: 'Start expiration date',
        expiryDateEndPlaceholder: 'End expiration date',
        expiryDateStartLabel: 'Start expiration date',
        expiryDateEndLabel: 'End expiration date',
        expiryDateSectionTitle: 'Expiration period',
        expiryDateSectionDescription: 'Filter licenses by expiration date',
        resetButton: 'Reset'
      },
      table: {
        title: 'Licenses list',
        loading: 'Loading...',
        emptyTitle: 'No license',
        emptyDescription: 'Start by adding your first license.',
        emptyFiltered: 'No license matches your search criteria.',
        columns: {
          name: 'Name',
          client: 'Client',
          editor: 'Editor',
          version: 'Version',
          expiryDate: 'Expiration date',
          cost: 'Cost',
          status: 'Status',
          actions: 'Actions'
        }
      },
      actionsMenu: {
        open: 'Open menu',
        actions: 'Actions',
        view: 'View details',
        edit: 'Edit',
        delete: 'Delete',
        cancel: 'Cancel',
        reactivate: 'Reactivate'
      },
      status: {
        active: 'Active',
        expired: 'Expired',
        about_to_expire: 'Expiring soon',
        cancelled: 'Cancelled',
        unknown: 'Unknown'
      },
      relativeExpiry: {
        expiredDays: 'Expired {{days}} days ago',
        expireToday: 'Expires today',
        expireTomorrow: 'Expires tomorrow',
        expireInDays: 'Expires in {{days}} days'
      },
      confirms: {
        delete: 'Are you sure you want to delete the license "{{name}}"? This action cannot be undone.',
        cancel: 'Are you sure you want to cancel the license "{{name}}"?',
        reactivate: 'Are you sure you want to reactivate the license "{{name}}"?'
      },
      errors: {
        loadTitle: 'Loading error',
        loadDescription: 'An error occurred while fetching licenses.'
      },
      pagination: {
        info: 'Showing',
      },
      form: {
        header: {
          back: 'Back',
          createTitle: 'New license',
          editTitle: 'Edit license',
          createSubtitle: 'Create a new software or hardware license',
          editSubtitle: 'Edit license information',
        },
        sections: {
          mainInfo: 'Main information',
          datesAndCosts: 'Dates and costs',
          description: 'Description',
        },
        fields: {
          name: {
            label: 'License name *',
            placeholder: 'e.g. Microsoft Office 365',
          },
          supplierId: {
            label: 'Editor/Supplier',
            placeholder: 'Select a supplier',
            none: 'None',
          },
          version: {
            label: 'Version',
            placeholder: 'e.g. 2023',
          },
          licenseKey: {
            label: 'License key',
            placeholder: 'License key (hidden)'
          },
          typeId: {
            label: 'License type',
            placeholder: 'Select a type',
          },
          clientId: {
            label: 'Client *',
            placeholder: 'Select a client',
          },
          purchaseDate: {
            label: 'Purchase date',
          },
          expiryDate: {
            label: 'Expiration date *',
          },
          cost: {
            label: 'Cost (XAF)',
            placeholder: '0.00',
          },
          description: {
            label: 'Description (optional)',
            placeholder: 'Additional information about the license...'
          }
        },
        alerts: {
          expired: 'This license has already expired',
          expiresInOne: 'This license expires tomorrow',
          expiresIn: 'This license expires in {{days}} days',
        },
        actions: {
          cancel: 'Cancel',
          creating: 'Creating...',
          updating: 'Updating...',
          create: 'Create license',
          save: 'Save changes'
        },
        toasts: {
          created: 'License created successfully.',
          updated: 'License updated successfully.',
          submitError: 'An error occurred during submission.'
        },
        validation: {
          name: {
            required: 'Name is required'
          },
          expiryDate: {
            required: 'Expiration date is required'
          },
          clientId: {
            required: 'Client is required'
          },
          cost: {
            positive: 'Cost must be positive'
          },
          }
      },
      detail: {
        back: 'Back',
        actions: {
          edit: 'Edit',
          delete: 'Delete',
          hide: 'Hide',
          show: 'Show',
          addFile: 'Add file'
        },
        sections: {
          generalInfo: 'General information',
          attachments: 'Attachments',
          importantDates: 'Important dates',
          financialInfo: 'Financial information',
          quickActions: 'Quick actions'
        },
        fields: {
          name: 'Name',
          status: 'Status',
          editor: 'Editor',
          version: 'Version',
          client: 'Client',
          createdBy: 'Created by',
          licenseKey: 'License key',
          description: 'Description',
          purchaseDate: 'Purchase date',
          expiryDate: 'Expiration date',
          createdAt: 'Created on',
          updatedAt: 'Updated on',
          totalCost: 'Total cost',
          licenseDuration: 'License duration',
          costPerDay: 'Cost per day'
        },
        tableHeaders: {
          fileName: 'File name',
          type: 'Type',
          size: 'Size',
          uploadedBy: 'Uploaded by',
          date: 'Date',
          actions: 'Actions'
        },
        fileTypes: {
          contract: 'Contract',
          invoice: 'Invoice',
          certificate: 'Certificate',
          manual: 'Manual',
          other: 'Other'
        },
        fileSizes: {
          bytes: 'bytes',
          kb: 'KB',
          mb: 'MB',
          gb: 'GB'
        },
        expiryAlert: {
          expired: 'Expired',
          expiresIn: 'Expires in',
          days: 'days'
        },
        license: 'license',
        keyDialog: {
          title: 'Reveal license key',
          description: 'Enter your password to reveal the license key.',
          fields: {
            password: 'Password'
          },
          actions: {
            cancel: 'Cancel',
            show: 'Show'
          }
        },
        deleteDialog: {
          title: 'Confirm deletion',
          description: 'Are you sure you want to delete this license? This action cannot be undone.'
        },
        uploadDialog: {
          title: 'Add attachment',
          description: 'Select a file to add to this license.',
          fields: {
            file: 'File',
            fileType: 'File type'
          },
          actions: {
            cancel: 'Cancel',
            add: 'Add'
          }
        },
        emptyState: {
          noAttachments: 'No attachments',
          noFilesAdded: 'No files have been added to this license.',
          addFirstFile: 'Add the first file'
        }
      }
    },
    reports: {
      charts: {
        licenseStatusTitle: 'License Status Overview',
        equipmentStatusTitle: 'Equipment Status Overview',
        monthlyExpirationsTitle: 'Monthly License Expirations',
      },
      empty: {
        licenseStatus: 'No licenses recorded yet. Add licenses to see their status overview.',
        equipmentStatus: 'No equipment recorded yet. Equipment statuses will appear after adding equipment.',
        monthlyExpirations: 'No upcoming expirations. They will appear once licenses have due dates.',
      },
      generator: {
        title: 'Report Generator',
        description: 'Configure and generate custom reports in JSON, CSV, Excel or PDF formats',
      },
      ui: {
        headerTitle: 'Reports and Statistics',
        headerSubtitle: 'Generate and view detailed reports on your licenses and equipment in JSON, CSV, Excel or PDF formats.',
        glanceLicenses: 'Total Licenses',
        glanceEquipment: 'Total Equipment',
        glanceTotalValue: 'Total Value',
        glanceClients: 'Clients',
        autoDownloadNotice: 'The {{format}} file will be downloaded automatically',
      },
      filters: {
        type: 'Report Type',
        typePlaceholder: 'Choose a type',
        client: 'Client',
        clientPlaceholder: 'All clients',
        status: 'Status',
        format: 'Format',
        formatPlaceholder: 'Choose a format',
        dateFrom: 'Start Date',
        dateTo: 'End Date',
        licenseType: 'License Type',
        equipmentType: 'Equipment Type',
        licenseTypePlaceholder: 'All types',
        equipmentTypePlaceholder: 'All types',
      },
      options: {
        typeLicenses: 'Licenses',
        typeEquipment: 'Equipment',
        statusAll: 'All statuses',
        clientAll: 'All clients',
        licenseTypeAll: 'All license types',
        equipmentTypeAll: 'All equipment types',
        statusLicense: {
          active: 'Active',
          expired: 'Expired',
          about_to_expire: 'Expiring soon',
        },
        statusEquipment: {
          active: 'Active',
          obsolete: 'Obsolete',
          bientot_obsolete: 'Soon obsolete',
          en_maintenance: 'Under maintenance',
          retire: 'Retired',
        },
        formatJson: 'Preview (JSON)',
        formatCsv: 'Download CSV',
        formatExcel: 'Download Excel',
        formatPdf: 'Download PDF',
      },
      actions: {
        reset: 'Reset',
        generate: 'Generate',
        generating: 'Generating...',
        quickTitle: 'Quick Reports',
        quickSubtitle: 'Download predefined reports in your preferred format',
        quickExpiredLicenses: 'Expired Licenses',
        quickObsoleteEquipment: 'Obsolete Equipment',
        quickExpiringSoon: 'Licenses Expiring Soon',
        btnCsv: 'CSV',
        btnExcel: 'Excel',
        btnPdf: 'PDF',
      },
      tableHeaders: {
        name: 'Name',
        editor: 'Editor',
        client: 'Client',
        expiration: 'Expiration',
        status: 'Status',
        cost: 'Cost',
        daysUntilExpiry: 'Days Remaining',
        type: 'Type',
        brand: 'Brand',
        obsolescence: 'Obsolescence',
        daysUntilObsolescence: 'Days Remaining',
      },
    },
    profile: {
      header: {
        title: 'My Profile',
        subtitle: 'Manage your personal information and account settings.',
      },
      status: {
        notFoundTitle: 'Profile not found',
        notFoundDescription: 'Unable to load profile information.',
      },
      cards: {
        personalInfo: {
          title: 'Personal information',
          description: 'Your basic details and contact information',
          fields: {
            fullName: 'Full name',
            email: 'Email',
            phone: 'Phone',
            phoneFallback: 'Not provided',
            company: 'Company',
            companyFallback: 'Not provided',
          },
        },
        security: {
          title: 'Security',
          description: 'Manage your password and security settings',
          passwordLabel: 'Password',
          maskedValue: '••••••••••••',
        },
        account: {
          title: 'Account information',
          memberSince: 'Member since',
          memberSinceFallback: 'Not available',
          client: 'Linked client',
          clientFallback: 'Not linked',
        },
      },
      dialogs: {
        edit: {
          title: 'Edit profile',
          description: 'Update your personal information. Changes will be saved automatically.',
          fields: {
            firstName: { label: 'First name', placeholder: 'Your first name' },
            lastName: { label: 'Last name', placeholder: 'Your last name' },
            email: { label: 'Email', placeholder: 'you@example.com' },
            phone: { label: 'Phone', placeholder: '+237 XXX XXX XXX' },
            company: { label: 'Company', placeholder: 'Your company name' },
          },
          actions: {
            cancel: 'Cancel',
            save: 'Save',
            saving: 'Saving...',
          },
        },
        password: {
          title: 'Change password',
          description: 'Enter your current password then your new password.',
          fields: {
            current: { label: 'Current password', placeholder: 'Your current password' },
            new: { label: 'New password', placeholder: 'At least 8 characters' },
            confirm: { label: 'Confirm new password', placeholder: 'Confirm your new password' },
          },
          actions: {
            cancel: 'Cancel',
            submit: 'Change password',
            submitting: 'Updating...',
          },
          validations: {
            mismatch: 'Passwords do not match',
            minLength: 'Password must contain at least 6 characters',
          },
        },
      },
      common: {
        edit: 'Edit',
      },
    },
    notifications: {
      page: {
        title: 'Notifications',
        unreadCount: '{{unread}} unread out of {{total}} notification{{totalPlural}}',
        tabs: {
          all: 'All ({{count}})',
          unread: 'Unread ({{count}})',
          settings: 'Settings'
        },
        actions: {
          markAllAsRead: 'Mark all as read',
          filter: 'Filter'
        },
        stats: {
          total: 'Total',
          unread: 'Unread',
          licenses: 'Licenses',
          equipment: 'Equipment'
        },
        filters: {
          searchPlaceholder: 'Search notifications...',
          typePlaceholder: 'All types',
          typeOptions: {
            license_expiry: 'License expiry',
            equipment_obsolescence: 'Equipment obsolescence',
            new_unverified_user: 'New unverified user',
            general: 'General'
          },
          statusPlaceholder: 'All statuses',
          statusOptions: {
            read: 'Read',
            unread: 'Unread'
          }
        },
        list: {
          loading: 'Loading notifications...',
          empty: 'No notifications',
          emptyDescription: 'You have no notifications at the moment.',
          noUnread: 'No unread notifications',
          actions: {
            markAsRead: 'Mark as read',
            markAsUnread: 'Mark as unread',
            delete: 'Delete',
            viewDetails: 'Click to view details'
          },
          types: {
            license_expiry: 'License expiry',
            equipment_obsolescence: 'Equipment obsolescence',
            new_unverified_user: 'New unverified user',
            general: 'General'
          },
          time: {
            justNow: 'Just now',
            minutes: '{{count}} minute ago',
            minutesPlural: '{{count}} minutes ago',
            hours: '{{count}} hour ago',
            hoursPlural: '{{count}} hours ago',
            days: '{{count}} day ago',
            daysPlural: '{{count}} days ago'
          }
        },
        pagination: {
          page: 'Page {{current}} of {{total}}',
          previous: 'Previous',
          next: 'Next'
        },
        settings: {
          title: 'Notification settings',
          emailLabel: 'Email notifications',
          emailDescription: 'Receive notifications by email',
          licenseAlertsLabel: 'License expiry alerts',
          licenseAlertsDescription: 'Days before expiry to receive an alert',
          equipmentAlertsLabel: 'Equipment obsolescence alerts',
          equipmentAlertsDescription: 'Days before obsolescence to receive an alert',
          addButton: '+ Add',
          saveButton: 'Save settings',
          saving: 'Saving...',
          addAlertPrompt: 'Add {{type}} alert (number of days):',
          daySuffix: 'day{{plural}}',
          cancel: 'Cancel'
        }
      }
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
        licenseSuppliers: 'Editors & Vendors',
        licenseTypes: 'License Types',
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
        equipmentBrands: 'Equipment brands',
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
        upcomingExpirations: 'Upcoming expirations (12 months)',
        equipmentStatus: 'Equipment status',
        expirationsSeries: 'Expirations',
        empty: {
          equipmentByType: 'No equipment recorded yet. Add equipment to see the distribution by type.',
          licenseStatus: 'No licenses recorded yet. Add licenses to see their statuses.',
          upcomingExpirations: 'No upcoming expirations. They will appear once licenses have due dates.',
          equipmentStatus: 'No equipment recorded yet. Statuses will appear after adding equipment.',
          equipmentObsolescence: 'No obsolescence expected in the next 12 months.'

        }
      },
      clientFilter: {
        label: 'Filter by client:',
        placeholder: 'Select a client',
        allClients: 'All clients'
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
      licenseTypes: {
        title: 'License Types Management',
        subtitle: 'Manage the different license categories',
        loading: 'Loading...',
        stats: {
          total: 'Total types',
          active: 'Active',
          inactive: 'Inactive',
        },
        search: {
          placeholder: 'Search by name, code or description...',
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
            view: 'View',
            edit: 'Edit',
            delete: 'Delete',
          },
        },
        status: {
          active: 'Active',
          inactive: 'Inactive',
        },
        dialogs: {
          create: {
            title: 'Create license type',
            description: 'Create a new license type to organize your licenses.',
          },
          edit: {
            title: 'Edit license type',
            description: 'Edit the license type information.',
          },
          delete: {
            title: 'Confirm deletion',
            description: 'Are you sure you want to delete this license type? This action cannot be undone.',
            cancel: 'Cancel',
            confirm: 'Delete',
          },
        },
        form: {
          name: {
            label: 'Name', 
            placeholder: 'Ex: Software', 
          },
          code: {
            label: 'Code', 
            placeholder: 'Ex: SOFTWARE', 
          },
          description: {
            label: 'Description', 
            placeholder: 'Description of the license type', 
          },
          isActive: 'Active type',
          actions: {
            cancel: 'Cancel',
            create: 'Create',
            save: 'Save',
          },
        },
        messages: {
          createSuccess: 'License type created successfully',
          updateSuccess: 'License type updated successfully',
          deleteSuccess: 'License type deleted successfully',
          createError: 'Error creating license type',
          updateError: 'Error updating license type',
          deleteError: 'Error deleting license type',
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
    equipment: {
      list: {
        title: 'Equipment Inventory',
        subtitle: 'Manage the entire IT fleet',
        count: '({{count}} item{{plural}})',
        actions: {
          refresh: 'Refresh statuses',
          export: 'Export',
          exporting: 'Export in progress...',
          exportExcel: 'Export to Excel (.xlsx)',
          exportCsv: 'Export to CSV',
          exportJson: 'Export to JSON',
          create: 'New equipment',
        },
        stats: {
          total: { title: 'Total equipment', description: 'Tracked assets' },
          maintenance: { title: 'Under maintenance', description: 'Ongoing interventions' },
          soonObsolete: { title: 'Soon obsolete', description: 'Monitor closely' },
          totalCost: { title: 'Estimated total cost', description: 'Declared equipment value' },
        },
        search: {
          placeholder: 'Search by name, brand, model...',
          filters: 'Filters',
          reset: 'Clear filters',
        },
        filters: {
          type: {
            label: 'Type',
            all: 'All types'
          },
          brand: {
            label: 'Brand',
            all: 'All brands'
          },
          status: {
            label: 'Status',
            options: {
              actif: 'Active',
              en_maintenance: 'Under maintenance',
              bientot_obsolete: 'Soon obsolete',
              obsolete: 'Obsolete',
              retire: 'Retired',
            },
          },
          client: {
            label: 'Client',
            all: 'All clients'
          },
          clear: 'Reset',
          obsolescenceStartLabel: 'Start obsolescence date',
          obsolescenceEndLabel: 'End obsolescence date',
          obsolescenceStartPlaceholder: 'Start obsolescence date',
          obsolescenceEndPlaceholder: 'End obsolescence date',
          obsolescenceSectionTitle: 'Obsolescence period',
          obsolescenceSectionDescription: 'Filter equipment by obsolescence date',
        },
        table: {
          headers: {
            equipment: 'Equipment',
            type: 'Type',
            status: 'Status',
            client: 'Client',
            obsolescence: 'Obsolescence',
            cost: 'Cost',
            actions: 'Actions',
          },
          dropdown: { view: 'View details', edit: 'Edit', delete: 'Delete' },
          empty: {
            title: 'No equipment found',
            descriptionNoFilters: 'Start by adding your first equipment item.',
            descriptionFiltered: 'No equipment matches your search criteria.',
            action: 'Create equipment',
          },
        },
        pagination: {
          summary: 'Showing {{start}} to {{end}} of {{total}} results',
          previous: 'Previous',
          next: 'Next',
          page: 'Page {{page}} of {{total}}',
        },
        deleteDialog: {
          title: 'Confirm deletion',
          description: 'Are you sure you want to delete equipment “{{name}}”? This action cannot be undone.',
          cancel: 'Cancel',
          confirm: 'Delete',
          deleting: 'Deleting...',
        },
        errors: {
          load: 'Error while loading equipment',
          retry: 'Retry',
        },
      },
      form: {
        header: {
          back: 'Back',
          createTitle: 'New equipment',
          editTitle: 'Edit equipment',
          createSubtitle: 'Create a new equipment item',
          editSubtitle: 'Edit equipment information',
        },
        sections: {
          main: 'General information',
          dates: 'Important dates',
          client: 'Client *',
          finance: 'Financial information',
        },
        fields: {
          name: { label: 'Name *', placeholder: 'Equipment name' },
          type: { label: 'Type *', placeholder: 'Select a type', empty: 'No type available' },
          brand: { label: 'Brand *', placeholder: 'Select a brand', empty: 'No brand available' },
          model: { label: 'Model', placeholder: 'Equipment model' },
          serial: { label: 'Serial number', placeholder: 'Serial number' },
          location: { label: 'Location', placeholder: 'Physical location' },
          status: { label: 'Status' },
          description: { label: 'Description', placeholder: 'Detailed description of the equipment' },
          purchaseDate: { label: 'Purchase date' },
          warrantyEnd: { label: 'End of warranty' },
          obsolescence: { label: 'Estimated obsolescence' },
          endOfSale: { label: 'End of sale' },
          client: { label: 'Client *', placeholder: 'Select a client', empty: 'No client available' },
          cost: { label: 'Cost (XAF)', placeholder: '0.00' },
        },
        actions: {
          saving: 'Saving...',
          save: 'Save changes',
          create: 'Create equipment',
          cancel: 'Cancel',
        },
      },
      status: {
        actif: 'Active',
        en_maintenance: 'Under maintenance',
        bientot_obsolete: 'Soon obsolete',
        obsolete: 'Obsolete',
        retire: 'Retired',
        default: '{{status}}',
      },
      detail: {
        back: 'Back',
        actions: {
          markActive: 'Mark active',
          markMaintenance: 'Set to maintenance',
          edit: 'Edit',
          delete: 'Delete',
        },
        deleteAlert: {
          description: 'Are you sure you want to delete this equipment? This action cannot be undone.',
          confirm: 'Confirm deletion',
          cancel: 'Cancel',
        },
        infoCard: { title: 'General information' },
        fields: {
          name: 'Name',
          type: 'Type',
          status: 'Status',
          serialNumber: 'Serial number',
          brand: 'Brand',
          model: 'Model',
          location: 'Location',
          cost: 'Cost',
          description: 'Description',
        },
        attachments: {
          title: 'Attachments',
          loading: 'Loading...',
          add: 'Add file',
          emptyTitle: 'No attachments',
          emptyDescription: 'No files have been uploaded yet.',
          emptyAction: 'Upload the first file',
          table: {
            fileName: 'File name',
            type: 'Type',
            size: 'Size',
            addedBy: 'Added by',
            date: 'Date',
            actions: 'Actions',
            types: {
              invoice: 'Invoice',
              manual: 'Manual',
              warranty: 'Warranty',
              spec: 'Specification',
              other: 'Other',
            },
          },
          download: 'Download',
          delete: 'Delete',
        },
        dates: {
          title: 'Key dates',
          purchase: 'Purchase date',
          warranty: 'Warranty end',
          obsolescence: 'Estimated obsolescence',
          obsolescenceIn: 'In {{days}} days',
          obsolescencePast: 'Already obsolete',
          endOfSale: 'End of sale',
        },
        client: { title: 'Client', email: 'Email' },
        traceability: {
          title: 'Traceability information',
          createdBy: 'Created by',
          createdAt: 'Created on',
          updatedAt: 'Updated on',
        },
        uploadDialog: {
          title: 'Add attachment',
          description: 'Select a file to attach to this equipment. Accepted formats: PDF, images, Office documents.',
          fileLabel: 'File',
          fileTypeLabel: 'File type',
          typeOptions: {
            invoice: 'Invoice',
            manual: 'Manual',
            warranty: 'Warranty',
            spec: 'Technical specification',
            other: 'Other',
          },
          cancel: 'Cancel',
          submit: 'Add',
          submitting: 'Uploading...',
        },
      },
 
    },
    equipmentTypes: {
      title: 'Equipment types',
      subtitle: 'Manage your system\'s equipment categories',
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
          name: 'Type',
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
        createTitle: 'Create a type',
        editTitle: 'Edit type',
        description: 'Manage the equipment type information.',
        fields: {
          name: {
            label: 'Name',
            required: ' (required)',
            placeholder: 'Type name',
          },
          code: {
            label: 'Code',
            required: ' (required)',
            placeholder: 'Type code',
          },
          description: {
            label: 'Description',
            placeholder: 'Short description of the type',
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
          create: 'Create',
          saving: 'Saving...',
        },
      },
      confirmations: {
        disable: 'Do you want to deactivate the type "{{name}}"? You can reactivate it later.',
        delete: 'Do you want to permanently delete the type "{{name}}"? This action cannot be undone.',
      },
    },
    equipmentBrands: {
      title: 'Gestion des marques',
      subtitle: 'Gérez les fabricants et les marques d\'équipements',
      stats: {
        total: 'Total des marques',
        active: 'Actifs',
        inactive: 'Inactifs',

      },
      search: {
        placeholder: 'Search by name, website or contact...',
      },
      buttons: {
        showInactive: 'Show inactive',
        hideInactive: 'Hide inactive',
        newBrand: 'New brand',
      },
      table: {
        columns: {
          name: 'Brand',
          contact: 'Contact',
          website: 'Website',
          status: 'Status',
          actions: 'Actions',
        },
        empty: 'No brand found',
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
        createTitle: 'Create brand',
        editTitle: 'Edit brand',
        description: 'Manage the manufacturer or supplier information for this brand.',
        fields: {
          name: {
            label: 'Name',
            required: '(required)',
            placeholder: 'Brand name',
          },
          website: {
            label: 'Website',
            placeholder: 'https://example.com',
          },
          supportEmail: {
            label: 'Support email',
            placeholder: 'support@example.com',
          },
          supportPhone: {
            label: 'Support phone',
            placeholder: '+237612345678',
          },
          notes: {
            label: 'Notes',
            placeholder: 'Additional information...',
          },
          isActive: {
            label: 'Active brand',
          },
        },
        actions: {
          cancel: 'Cancel',
          save: 'Save',
          create: 'Create',
          saving: 'Saving...',
        },
      },
      confirmations: {
        disable: 'Do you want to deactivate the brand "{{name}}"? You can reactivate it later.',
        delete: 'Do you want to permanently delete the brand "{{name}}"? This action cannot be undone.',
      },
    },
    licenseSuppliers: {
      title: 'Editors & Vendors',
      subtitle: 'Manage the license suppliers',
      stats: {
        total: 'Total suppliers',
        active: 'Active',
        inactive: 'Inactive',
      },
      search: {
        placeholder: 'Search for a supplier...',
      },
      buttons: {
        showInactive: 'Show inactive',
        hideInactive: 'Hide inactive',
        newSupplier: 'New supplier',
      },
      table: {
        columns: {
          name: 'Name',
          contact: 'Contact',
          details: 'Details',
          status: 'Status',
          actions: 'Actions',
        },
        actions: {
          edit: 'Edit',
          disable: 'Disable',
          delete: 'Delete',
        },
        empty: 'No supplier found',
      },
      status: {
        active: 'Active',
        inactive: 'Inactive',
      },
      confirmations: {
        disable: 'Are you sure you want to deactivate the supplier "{{name}}"? It will no longer appear in lists.',
        delete: 'The supplier "{{name}}" is already inactive. Do you want to delete it permanently? This action cannot be undone.'
      },
      modal: {
        createTitle: 'New supplier',
        editTitle: 'Edit supplier',
        description: 'Fill in the supplier information',
        fields: {
          name: {
            label: 'Supplier name',
            required: '*',
            placeholder: 'e.g. Microsoft',
          },
          contactEmail: {
            label: 'Contact email',
            placeholder: 'contact@supplier.com',
          },
          contactPhone: {
            label: 'Phone',
            placeholder: 'e.g. +237 6XX XX XX XX',
          },
          website: {
            label: 'Website',
            placeholder: 'https://www.example.com',
          },
          address: {
            label: 'Address',
            placeholder: 'Full mailing address',
          },
          notes: {
            label: 'Notes',
            placeholder: 'Additional information (customer accounts, contacts...)',
          },
          status: {
            label: 'Status',
            active: 'Active',
            inactive: 'Inactive'
          },
          isActive: 'Supplier active',
        },
        actions: {
          cancel: 'Cancel',
          save: 'Save',
          submitting: 'Saving...',
        },
      },
    },
  },
};

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

export function translate(language: SupportedLanguage, key: string, fallback?: string, params?: Record<string, string | number>): string {
  const value = getFromPath(translations[language], key)
  let result: string
  
  if (typeof value === 'string') {
    result = value
  } else {
    result = fallback ?? key
  }
  
  // Handle interpolation if params are provided
  if (params) {
    Object.entries(params).forEach(([param, paramValue]) => {
      result = result.replace(new RegExp(`\{\{${param}\}\}`, 'g'), String(paramValue))
    })
  }
  
  return result
}

export function getLanguageOptions() {
  return translations
}

export const supportedLanguages: SupportedLanguage[] = ['fr', 'en']
