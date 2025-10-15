-- ==================================================================
-- BRIDGE LFU - STRUCTURE COMPLÈTE DE LA BASE DE DONNÉES SUPABASE
-- Version mise à jour avec accès client limité
-- ==================================================================

-- 1. ACTIVATION DES EXTENSIONS NÉCESSAIRES
-- ==================================================================

-- Extension UUID pour les clés primaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Extension pour les triggers de mise à jour automatique
CREATE EXTENSION IF NOT EXISTS "pgsodium";

-- 2. CRÉATION DES ENUMS (TYPES PERSONNALISÉS)
-- ==================================================================

-- Rôles utilisateurs (mise à jour avec client)
CREATE TYPE user_role AS ENUM ('admin', 'technicien', 'client','unverified');

-- Statuts des équipements
CREATE TYPE equipment_status AS ENUM ('actif', 'en_maintenance', 'obsolete','bientot_obsolete', 'retire');

-- Types d'équipements
CREATE TYPE equipment_type AS ENUM ('pc', 'serveur', 'routeur', 'switch', 'imprimante', 'autre');

-- Statuts des licences
CREATE TYPE license_status AS ENUM ('active', 'expired', 'about_to_expire', 'cancelled');

-- Types de notifications
CREATE TYPE notification_type AS ENUM ('license_expiry', 'equipment_obsolescence', 'general','new_unverified_user');

-- 3. CRÉATION DES TABLES PRINCIPALES
-- ==================================================================

-- Table des clients (créée AVANT profiles pour la référence)
CREATE TABLE public.clients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'Cameroun',
    contact_email TEXT,
    contact_phone TEXT,
    contact_person TEXT,
    sector TEXT, -- Secteur d'activité
    created_by UUID, -- Will be set after profiles table creation
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des profils utilisateurs (étend auth.users de Supabase)
-- MISE À JOUR : Ajout de client_id pour les utilisateurs client
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    role user_role DEFAULT 'client',
    company TEXT,
    phone TEXT,
    client_id UUID REFERENCES public.clients(id), -- NOUVEAU : Lien vers client pour les utilisateurs 'client'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mise à jour de la contrainte foreign key pour created_by dans clients
ALTER TABLE public.clients ADD CONSTRAINT fk_clients_created_by 
FOREIGN KEY (created_by) REFERENCES public.profiles(id);

-- Table des fournisseurs de licences
CREATE TABLE public.license_suppliers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'Cameroun',
    contact_email TEXT,
    contact_phone TEXT,
    contact_person TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des licences
CREATE TABLE public.licenses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    editor TEXT, -- Éditeur/Fournisseur (fallback si pas de fournisseur lié)
    version TEXT,
    license_key TEXT,
    purchase_date DATE,
    expiry_date DATE NOT NULL,
    cost DECIMAL(10,2),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES public.license_suppliers(id),
    status license_status DEFAULT 'active',
    description TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des équipements
CREATE TABLE public.equipment (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    type equipment_type NOT NULL,
    brand TEXT,
    model TEXT,
    serial_number TEXT,
    purchase_date DATE,
    estimated_obsolescence_date DATE,
    actual_obsolescence_date DATE,
    end_of_sale DATE,
    status equipment_status DEFAULT 'actif',
    cost DECIMAL(10,2),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    location TEXT, -- Emplacement physique
    description TEXT,
    warranty_end_date DATE,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des pièces jointes pour les licences
CREATE TABLE public.license_attachments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    license_id UUID REFERENCES public.licenses(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT, -- 'contract', 'invoice', 'certificate', 'manual', 'other'
    file_size BIGINT,
    uploaded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des pièces jointes pour les équipements
CREATE TABLE public.equipment_attachments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    equipment_id UUID REFERENCES public.equipment(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT, -- 'invoice', 'warranty', 'manual', 'other'
    file_size BIGINT,
    uploaded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des notifications
CREATE TABLE public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_id UUID, -- ID de la licence ou équipement concerné
    related_type TEXT, -- 'license' ou 'equipment'
    is_read BOOLEAN DEFAULT FALSE,
    email_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des paramètres de notification
CREATE TABLE public.notification_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    license_alert_days INTEGER[] DEFAULT ARRAY[7, 30], -- Alertes à 7 et 30 jours
    equipment_alert_days INTEGER[] DEFAULT ARRAY[30, 90], -- Alertes à 30 et 90 jours
    email_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Table des logs d'activité
CREATE TABLE public.activity_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL, -- 'create', 'update', 'delete', 'login', etc.
    table_name TEXT NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CRÉATION DES INDEX POUR OPTIMISER LES PERFORMANCES
-- ==================================================================

-- Index sur les pièces jointes
CREATE INDEX idx_license_attachments_license_id ON public.license_attachments(license_id);
CREATE INDEX idx_equipment_attachments_equipment_id ON public.equipment_attachments(equipment_id);

-- Index sur les dates d'expiration des licences
CREATE INDEX idx_licenses_expiry_date ON public.licenses(expiry_date);
CREATE INDEX idx_licenses_client_id ON public.licenses(client_id);
CREATE INDEX idx_licenses_status ON public.licenses(status);

-- Index sur les équipements
CREATE INDEX idx_equipment_client_id ON public.equipment(client_id);
CREATE INDEX idx_equipment_obsolescence_date ON public.equipment(estimated_obsolescence_date);
CREATE INDEX idx_equipment_status ON public.equipment(status);
CREATE INDEX idx_equipment_type ON public.equipment(type);
CREATE INDEX idx_equipment_end_of_sale ON public.equipment(end_of_sale);

-- Index sur les notifications
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);

-- Index sur les clients
CREATE INDEX idx_clients_name ON public.clients(name);

-- Index sur les profils (pour la relation client_id)
CREATE INDEX idx_profiles_client_id ON public.profiles(client_id);
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- 5. CRÉATION DES FONCTIONS UTILITAIRES
-- FONCTION POUR OBTENIR LES STATISTIQUES DE STATUTS
-- ==================================================================
CREATE OR REPLACE FUNCTION get_equipment_status_stats()
RETURNS TABLE (
    status equipment_status,
    count BIGINT,
    percentage NUMERIC
) AS $$
DECLARE
    total_count BIGINT;
BEGIN
    -- Calculer le total (avec gestion du cas vide)
    SELECT COUNT(*) INTO total_count FROM public.equipment;
    
    RETURN QUERY
    SELECT 
        e.status,
        COUNT(*)::BIGINT,
        CASE 
            WHEN total_count = 0 THEN 0.00
            ELSE ROUND((COUNT(*) * 100.0 / total_count), 2)::NUMERIC
        END AS percentage
    FROM public.equipment e
    GROUP BY e.status
    ORDER BY COUNT(*) DESC;
END;
$$ LANGUAGE plpgsql;

-- ==================================================================
-- 5.1. FONCTION POUR CALCULER LE STATUT AUTOMATIQUE DES ÉQUIPEMENTS
-- ==================================================================

CREATE OR REPLACE FUNCTION calculate_equipment_status(
    current_status equipment_status,
    estimated_obsolescence_date DATE,
    end_of_sale DATE DEFAULT NULL,
    actual_obsolescence_date DATE DEFAULT NULL
)
RETURNS equipment_status AS $
BEGIN
    -- Si l'équipement a une date d'obsolescence réelle, il est obsolète
    IF actual_obsolescence_date IS NOT NULL AND actual_obsolescence_date <= CURRENT_DATE THEN
        RETURN 'obsolete';
    END IF;
    
    -- Si l'équipement est retiré manuellement, on garde ce statut
    IF current_status = 'retire' THEN
        RETURN 'retire';
    END IF;
    
    -- Si l'équipement est en maintenance, on garde ce statut (gestion manuelle)
    IF current_status = 'en_maintenance' THEN
        RETURN 'en_maintenance';
    END IF;
    
    -- Vérification de l'obsolescence estimée
    IF estimated_obsolescence_date IS NOT NULL AND estimated_obsolescence_date <= CURRENT_DATE THEN
        RETURN 'obsolete';
    END IF;
    
    -- Vérification si bientôt obsolète (dans les 90 jours)
    IF estimated_obsolescence_date IS NOT NULL AND estimated_obsolescence_date <= CURRENT_DATE + INTERVAL '90 days' THEN
        RETURN 'bientot_obsolete';
    END IF;
    
    -- Vérification de la fin de commercialisation
    IF end_of_sale IS NOT NULL AND end_of_sale <= CURRENT_DATE THEN
        RETURN 'bientot_obsolete'; -- Fin de commercialisation atteinte = bientôt obsolète
    END IF;
    
    -- Vérification si bientôt en fin de commercialisation (dans les 90 jours)
    IF end_of_sale IS NOT NULL AND end_of_sale <= CURRENT_DATE + INTERVAL '90 days' THEN
        RETURN 'bientot_obsolete';
    END IF;
    
    -- Par défaut, l'équipement est actif
    RETURN 'actif';
END;
$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_equipment_status IS 'Fonction calculant automatiquement le statut d''un équipement basé sur ses dates critiques';

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer le statut d'une licence
CREATE OR REPLACE FUNCTION calculate_license_status(expiry_date DATE)
RETURNS license_status AS $$
BEGIN
    IF expiry_date < CURRENT_DATE THEN
        RETURN 'expired';
    ELSIF expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN
        RETURN 'about_to_expire';
    ELSE
        RETURN 'active';
    END IF;
END;
$$ LANGUAGE plpgsql;
-- FONCTION POUR MISE À JOUR BATCH DES STATUTS EXISTANTS
-- ==================================================================

CREATE OR REPLACE FUNCTION refresh_all_equipment_status()
RETURNS TABLE (
    equipment_id UUID,
    equipment_name TEXT,
    old_status equipment_status,
    new_status equipment_status,
    updated BOOLEAN
) AS $
DECLARE
    equipment_record RECORD;
    old_status equipment_status;
    new_status equipment_status;
BEGIN
    FOR equipment_record IN 
        SELECT id, name, status, estimated_obsolescence_date, end_of_sale, actual_obsolescence_date
        FROM public.equipment
    LOOP
        old_status := equipment_record.status;
        
        -- Calcul du nouveau statut
        new_status := calculate_equipment_status(
            equipment_record.status,
            equipment_record.estimated_obsolescence_date,
            equipment_record.end_of_sale,
            equipment_record.actual_obsolescence_date
        );
        
        -- Mise à jour si nécessaire
        IF old_status != new_status THEN
            UPDATE public.equipment 
            SET status = new_status, updated_at = NOW()
            WHERE id = equipment_record.id;
            
            RETURN QUERY SELECT 
                equipment_record.id,
                equipment_record.name,
                old_status,
                new_status,
                TRUE;
        ELSE
            RETURN QUERY SELECT 
                equipment_record.id,
                equipment_record.name,
                old_status,
                new_status,
                FALSE;
        END IF;
    END LOOP;
END;
$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_all_equipment_status() IS 'Fonction pour mettre à jour en batch tous les statuts d''équipements selon leurs dates critiques';

CREATE OR REPLACE FUNCTION refresh_all_license_status()
RETURNS TABLE (
    license_id UUID,
    license_name TEXT,
    old_status license_status,
    new_status license_status,
    updated BOOLEAN
) AS $
DECLARE
    license_record RECORD;
    old_status license_status;
    new_status license_status;
BEGIN
    FOR license_record IN 
        SELECT id, name, status, expiry_date
        FROM public.licenses
    LOOP
        old_status := license_record.status;
        
        -- Calcul du nouveau statut
        new_status := calculate_license_status(
            license_record.expiry_date
        );
        
        -- Mise à jour si nécessaire
        IF old_status != new_status THEN
            UPDATE public.licenses 
            SET status = new_status, updated_at = NOW()
            WHERE id = license_record.id;
            
            RETURN QUERY SELECT 
                license_record.id,
                license_record.name,
                old_status,
                new_status,
                TRUE;
        ELSE
            RETURN QUERY SELECT 
                license_record.id,
                license_record.name,
                old_status,
                new_status,
                FALSE;
        END IF;
    END LOOP;
END;
$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_all_license_status() IS 'Fonction pour mettre à jour en batch tous les statuts de licences selon leur date d''expiration.';
-- Fonction pour créer une notification
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type notification_type,
    p_title TEXT,
    p_message TEXT,
    p_related_id UUID DEFAULT NULL,
    p_related_type TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO public.notifications (user_id, type, title, message, related_id, related_type)
    VALUES (p_user_id, p_type, p_title, p_message, p_related_id, p_related_type)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- 6. CRÉATION DES TRIGGERS
-- ==================================================================

-- Triggers pour updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_licenses_updated_at
    BEFORE UPDATE ON public.licenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_updated_at
    BEFORE UPDATE ON public.equipment
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_settings_updated_at
    BEFORE UPDATE ON public.notification_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour mettre à jour automatiquement le statut des licences
CREATE OR REPLACE FUNCTION update_license_status()
RETURNS TRIGGER AS $$
BEGIN
    NEW.status = calculate_license_status(NEW.expiry_date);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_license_status_trigger
    BEFORE INSERT OR UPDATE ON public.licenses
    FOR EACH ROW
    EXECUTE FUNCTION update_license_status();
-- TRIGGER POUR MISE À JOUR AUTOMATIQUE DU STATUT DES ÉQUIPEMENTS
-- ==================================================================

CREATE OR REPLACE FUNCTION update_equipment_status()
RETURNS TRIGGER AS $
BEGIN
    -- Calcul automatique du nouveau statut
    NEW.status = calculate_equipment_status(
        NEW.status,
        NEW.estimated_obsolescence_date,
        NEW.end_of_sale,
        NEW.actual_obsolescence_date
    );
    
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Création du trigger
CREATE TRIGGER update_equipment_status_trigger
    BEFORE INSERT OR UPDATE ON public.equipment
    FOR EACH ROW
    EXECUTE FUNCTION update_equipment_status();

COMMENT ON TRIGGER update_equipment_status_trigger ON public.equipment IS 'Trigger pour mettre à jour automatiquement le statut des équipements';
-- 7. CRÉATION DES VUES POUR SIMPLIFIER LES REQUÊTES
-- ==================================================================
--  CRÉATION DE LA VUE v_license_durations
-- ==================================================================

CREATE VIEW v_license_durations AS
SELECT 
    id, 
    name, 
    (expiry_date - purchase_date) AS duration_days
FROM public.licenses
WHERE purchase_date IS NOT NULL;

-- Ajout d'un commentaire pour documenter la vue
COMMENT ON VIEW v_license_durations IS 'Vue calculant la durée des licences en jours entre la date d''achat et d''expiration';

-- Vue pour les licences avec informations client
DROP VIEW IF EXISTS v_licenses_with_client;

CREATE VIEW v_licenses_with_client AS
SELECT
  l.*,
  c.name AS client_name,
  c.contact_email AS client_email,
  p.first_name || ' ' || p.last_name AS created_by_name,
  ls.name AS supplier_name
FROM public.licenses l
LEFT JOIN public.clients c ON l.client_id = c.id
LEFT JOIN public.profiles p ON l.created_by = p.id
LEFT JOIN public.license_suppliers ls ON l.supplier_id = ls.id;

-- Vue pour les équipements avec informations client
CREATE VIEW v_equipment_with_client AS
SELECT 
    e.*,
    c.name as client_name,
    c.contact_email as client_email,
    p.first_name || ' ' || p.last_name as created_by_name
FROM public.equipment e
LEFT JOIN public.clients c ON e.client_id = c.id
LEFT JOIN public.profiles p ON e.created_by = p.id;

-- Vue pour le tableau de bord (alertes) - Version complète pour admin/techniciens
CREATE VIEW v_dashboard_alerts AS
SELECT 
    'license' as type,
    l.id,
    l.name as item_name,
    c.name as client_name,
    l.expiry_date as alert_date,
    l.status,
    l.client_id,
    CASE 
        WHEN l.expiry_date < CURRENT_DATE THEN 'expired'
        WHEN l.expiry_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'urgent'
        WHEN l.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'warning'
        ELSE 'normal'
    END as alert_level,
    'license_expiry' as alert_type
FROM public.licenses l
LEFT JOIN public.clients c ON l.client_id = c.id
WHERE l.expiry_date <= CURRENT_DATE + INTERVAL '90 days'

UNION ALL

SELECT 
    'equipment' as type,
    e.id,
    e.name as item_name,
    c.name as client_name,
    e.estimated_obsolescence_date as alert_date,
    e.status::text,
    e.client_id,
    CASE 
        WHEN e.estimated_obsolescence_date < CURRENT_DATE THEN 'expired'
        WHEN e.estimated_obsolescence_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'urgent'
        WHEN e.estimated_obsolescence_date <= CURRENT_DATE + INTERVAL '90 days' THEN 'warning'
        ELSE 'normal'
    END as alert_level,
    'equipment_obsolescence' as alert_type
FROM public.equipment e
LEFT JOIN public.clients c ON e.client_id = c.id
WHERE e.estimated_obsolescence_date <= CURRENT_DATE + INTERVAL '180 days'

UNION ALL

SELECT 
    'equipment' as type,
    e.id,
    e.name as item_name,
    c.name as client_name,
    e.end_of_sale as alert_date,
    e.status::text,
    e.client_id,
    CASE 
        WHEN e.end_of_sale < CURRENT_DATE THEN 'expired'
        WHEN e.end_of_sale <= CURRENT_DATE + INTERVAL '30 days' THEN 'urgent'
        WHEN e.end_of_sale <= CURRENT_DATE + INTERVAL '90 days' THEN 'warning'
        ELSE 'normal'
    END as alert_level,
    'equipment_end_of_sale' as alert_type
FROM public.equipment e
LEFT JOIN public.clients c ON e.client_id = c.id
WHERE e.end_of_sale IS NOT NULL 
AND e.end_of_sale <= CURRENT_DATE + INTERVAL '180 days'

ORDER BY alert_date ASC;

-- NOUVELLE VUE : Tableau de bord spécifique pour les clients
CREATE VIEW v_client_dashboard AS
SELECT 
    'license' as type,
    l.id,
    l.name as item_name,
    l.expiry_date as alert_date,
    l.status,
    CASE 
        WHEN l.expiry_date < CURRENT_DATE THEN 'expired'
        WHEN l.expiry_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'urgent'
        WHEN l.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'warning'
        ELSE 'normal'
    END as alert_level,
    l.client_id,
    'license_expiry' as alert_type
FROM public.licenses l
WHERE l.expiry_date <= CURRENT_DATE + INTERVAL '90 days'

UNION ALL

SELECT 
    'equipment' as type,
    e.id,
    e.name as item_name,
    e.estimated_obsolescence_date as alert_date,
    e.status::text,
    CASE 
        WHEN e.estimated_obsolescence_date < CURRENT_DATE THEN 'expired'
        WHEN e.estimated_obsolescence_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'urgent'
        WHEN e.estimated_obsolescence_date <= CURRENT_DATE + INTERVAL '90 days' THEN 'warning'
        ELSE 'normal'
    END as alert_level,
    e.client_id,
    'equipment_obsolescence' as alert_type
FROM public.equipment e
WHERE e.estimated_obsolescence_date <= CURRENT_DATE + INTERVAL '180 days'

UNION ALL

SELECT 
    'equipment' as type,
    e.id,
    e.name as item_name,
    e.end_of_sale as alert_date,
    e.status::text,
    CASE 
        WHEN e.end_of_sale < CURRENT_DATE THEN 'expired'
        WHEN e.end_of_sale <= CURRENT_DATE + INTERVAL '30 days' THEN 'urgent'
        WHEN e.end_of_sale <= CURRENT_DATE + INTERVAL '90 days' THEN 'warning'
        ELSE 'normal'
    END as alert_level,
    e.client_id,
    'equipment_end_of_sale' as alert_type
FROM public.equipment e
WHERE e.end_of_sale IS NOT NULL 
AND e.end_of_sale <= CURRENT_DATE + INTERVAL '180 days'

ORDER BY alert_date ASC;

-- 8. POLICIES DE SÉCURITÉ RLS (ROW LEVEL SECURITY)
-- ==================================================================

-- Activation de RLS sur toutes les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Policies pour les profils
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- POLICIES MISES À JOUR POUR LES CLIENTS
-- Admins et techniciens peuvent tout voir
CREATE POLICY "Admins and technicians can manage clients" ON public.clients
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'technicien')
        )
    );

-- NOUVEAU : Les clients peuvent voir uniquement leur propre client
CREATE POLICY "Clients can view their own client info" ON public.clients
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'client' 
            AND client_id = clients.id
        )
    );

-- POLICIES MISES À JOUR POUR LES LICENCES
-- Admins et techniciens peuvent tout gérer
CREATE POLICY "Admins and technicians can manage licenses" ON public.licenses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'technicien')
        )
    );

-- NOUVEAU : Les clients peuvent voir uniquement leurs licences
CREATE POLICY "Clients can view their own licenses" ON public.licenses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'client' 
            AND client_id = licenses.client_id
        )
    );

-- POLICIES MISES À JOUR POUR LES ÉQUIPEMENTS
-- Admins et techniciens peuvent tout gérer
CREATE POLICY "Admins and technicians can manage equipment" ON public.equipment
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'technicien')
        )
    );

-- NOUVEAU : Les clients peuvent voir uniquement leurs équipements
CREATE POLICY "Clients can view their own equipment" ON public.equipment
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'client' 
            AND client_id = equipment.client_id
        )
    );

-- POLICIES MISES À JOUR POUR LES PIÈCES JOINTES DES LICENCES
-- Admins et techniciens peuvent tout gérer
CREATE POLICY "Admins and technicians can manage license attachments" ON public.license_attachments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'technicien')
        )
    );

-- NOUVEAU : Les clients peuvent voir leurs pièces jointes de licences
CREATE POLICY "Clients can view their own license attachments" ON public.license_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.licenses l ON p.client_id = l.client_id
            WHERE p.id = auth.uid() 
            AND p.role = 'client' 
            AND l.id = license_attachments.license_id
        )
    );

-- POLICIES MISES À JOUR POUR LES PIÈCES JOINTES DES ÉQUIPEMENTS
-- Admins et techniciens peuvent tout gérer
CREATE POLICY "Admins and technicians can manage equipment attachments" ON public.equipment_attachments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'technicien')
        )
    );

-- NOUVEAU : Les clients peuvent voir leurs pièces jointes d'équipements
CREATE POLICY "Clients can view their own equipment attachments" ON public.equipment_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.equipment e ON p.client_id = e.client_id
            WHERE p.id = auth.uid() 
            AND e.id = equipment_attachments.equipment_id
        )
    );

-- Policies pour les notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" ON public.notifications
    FOR DELETE USING (auth.uid() = user_id);

-- Policies pour les paramètres de notification (inchangées)
CREATE POLICY "Users can manage their own notification settings" ON public.notification_settings
    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all activity logs" ON public.activity_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 9. DONNÉES D'EXEMPLE POUR LES TESTS
-- ==================================================================

-- Insertion de données de test (à adapter selon vos besoins)
INSERT INTO public.clients (name, address, city, postal_code, contact_email, contact_person, sector) VALUES
('TechCorp SARL', '123 Rue de la Technologie', 'Paris', '75001', 'contact@techcorp.fr', 'Jean Dupont', 'Informatique'),
('MediCare Clinic', '456 Avenue de la Santé', 'Lyon', '69000', 'admin@medicare.fr', 'Marie Martin', 'Santé'),
('EduSchool', '789 Boulevard de l''Education', 'Marseille', '13000', 'it@eduschool.fr', 'Pierre Durand', 'Education');

-- 10. FONCTIONS POUR LES RAPPORTS
-- ==================================================================

-- Fonction pour générer un rapport des licences expirées
CREATE OR REPLACE FUNCTION get_expired_licenses_report()
RETURNS TABLE (
    license_id UUID,
    license_name TEXT,
    client_id UUID,
    client_name TEXT,
    supplier_id UUID,
    supplier_name TEXT,
    expiry_date DATE,
    days_expired INTEGER,
    cost DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id,
        l.name,
        l.client_id,
        c.name,
        ls.id,
        ls.name,
        l.expiry_date,
        (CURRENT_DATE - l.expiry_date)::INTEGER,
        l.cost
    FROM public.licenses l
    LEFT JOIN public.clients c ON l.client_id = c.id
    LEFT JOIN public.license_suppliers ls ON l.supplier_id = ls.id
    WHERE l.expiry_date < CURRENT_DATE
    ORDER BY l.expiry_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour générer un rapport des équipements obsolètes
CREATE OR REPLACE FUNCTION get_obsolete_equipment_report()
RETURNS TABLE (
    equipment_name TEXT,
    client_name TEXT,
    type equipment_type,
    brand TEXT,
    model TEXT,
    obsolescence_date DATE,
    days_obsolete INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.name,
        c.name,
        e.type,
        e.brand,
        e.model,
        e.estimated_obsolescence_date,
        (CURRENT_DATE - e.estimated_obsolescence_date)::INTEGER
    FROM public.equipment e
    LEFT JOIN public.clients c ON e.client_id = c.id
    WHERE e.estimated_obsolescence_date < CURRENT_DATE
    ORDER BY e.estimated_obsolescence_date DESC;
END;
$$ LANGUAGE plpgsql;

-- NOUVEAU : Fonction pour générer un rapport client spécifique
CREATE OR REPLACE FUNCTION get_client_licenses_report(client_uuid UUID)
RETURNS TABLE (
    license_id UUID,
    license_name TEXT,
    supplier_id UUID,
    supplier_name TEXT,
    editor TEXT,
    expiry_date DATE,
    status license_status,
    cost DECIMAL(10,2),
    days_until_expiry INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id,
        l.name,
        ls.id,
        ls.name,
        l.editor,
        l.expiry_date,
        l.status,
        l.cost,
        (l.expiry_date - CURRENT_DATE)::INTEGER
    FROM public.licenses l
    LEFT JOIN public.license_suppliers ls ON l.supplier_id = ls.id
    WHERE l.client_id = client_uuid
    ORDER BY l.expiry_date ASC;
END;
$$ LANGUAGE plpgsql;

-- NOUVEAU : Fonction pour générer un rapport équipements client spécifique
CREATE OR REPLACE FUNCTION get_client_equipment_report(client_uuid UUID)
RETURNS TABLE (
    equipment_name TEXT,
    type equipment_type,
    brand TEXT,
    model TEXT,
    status equipment_status,
    obsolescence_date DATE,
    end_of_sale DATE,
    days_until_obsolescence INTEGER,
    days_until_end_of_sale INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.name,
        e.type,
        e.brand,
        e.model,
        e.status,
        e.estimated_obsolescence_date,
        e.end_of_sale,
        (e.estimated_obsolescence_date - CURRENT_DATE)::INTEGER,
        (e.end_of_sale - CURRENT_DATE)::INTEGER
    FROM public.equipment e
    WHERE e.client_id = client_uuid
    ORDER BY 
        COALESCE(e.estimated_obsolescence_date, '2099-12-31'::DATE) ASC,
        COALESCE(e.end_of_sale, '2099-12-31'::DATE) ASC;
END;
$$ LANGUAGE plpgsql;
--  FONCTION UTILITAIRE POUR CALCULER LA DURÉE DE VIE DES LICENCES
-- ==================================================================

CREATE OR REPLACE FUNCTION get_license_duration_stats()
RETURNS TABLE (
    avg_duration_days NUMERIC,
    min_duration_days INTEGER,
    max_duration_days INTEGER,
    total_licenses_with_duration BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ROUND(AVG(expiry_date - purchase_date), 2)::NUMERIC,
        MIN(expiry_date - purchase_date)::INTEGER,
        MAX(expiry_date - purchase_date)::INTEGER,
        COUNT(*)::BIGINT
    FROM public.licenses
    WHERE purchase_date IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_license_duration_stats() IS 'Fonction retournant les statistiques de durée des licences';
-- FONCTION POUR LES ÉQUIPEMENTS APPROCHANT DE LEUR FIN DE COMMERCIALISATION
-- ==================================================================

CREATE OR REPLACE FUNCTION get_equipment_end_of_sale_alerts(alert_days INTEGER DEFAULT 180)
RETURNS TABLE (
    equipment_id UUID,
    equipment_name TEXT,
    client_name TEXT,
    brand TEXT,
    model TEXT,
    end_of_sale DATE,
    days_until_end_of_sale INTEGER,
    alert_level TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.name,
        c.name,
        e.brand,
        e.model,
        e.end_of_sale,
        (e.end_of_sale - CURRENT_DATE)::INTEGER,
        CASE 
            WHEN e.end_of_sale < CURRENT_DATE THEN 'expired'
            WHEN e.end_of_sale <= CURRENT_DATE + INTERVAL '30 days' THEN 'urgent'
            WHEN e.end_of_sale <= CURRENT_DATE + INTERVAL '90 days' THEN 'warning'
            ELSE 'normal'
        END::TEXT
    FROM public.equipment e
    LEFT JOIN public.clients c ON e.client_id = c.id
    WHERE e.end_of_sale IS NOT NULL 
    AND e.end_of_sale <= CURRENT_DATE + INTERVAL '1 day' * alert_days
    ORDER BY e.end_of_sale ASC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_equipment_end_of_sale_alerts(INTEGER) IS 'Fonction retournant les alertes d''équipements approchant de leur fin de commercialisation';

-- 11. CONTRAINTES SUPPLÉMENTAIRES ET VALIDATIONS
-- ==================================================================

-- Contrainte : Un utilisateur avec le rôle 'client' doit avoir un client_id
ALTER TABLE public.profiles ADD CONSTRAINT check_client_role_has_client_id 
CHECK (
    (role = 'client' AND client_id IS NOT NULL) OR 
    (role IN ('admin', 'technicien'))
);

-- Contrainte : Vérifier que les dates sont cohérentes
ALTER TABLE public.licenses ADD CONSTRAINT check_license_dates 
CHECK (purchase_date IS NULL OR expiry_date >= purchase_date);

ALTER TABLE public.equipment ADD CONSTRAINT check_equipment_dates 
CHECK (
    (purchase_date IS NULL OR estimated_obsolescence_date IS NULL OR estimated_obsolescence_date >= purchase_date) AND
    (actual_obsolescence_date IS NULL OR estimated_obsolescence_date IS NULL OR actual_obsolescence_date >= estimated_obsolescence_date)
);
-- Contrainte pour vérifier la cohérence des dates
ALTER TABLE public.equipment ADD CONSTRAINT check_equipment_end_of_sale_dates 
CHECK (
    (purchase_date IS NULL OR end_of_sale IS NULL OR end_of_sale >= purchase_date) AND
    (end_of_sale IS NULL OR estimated_obsolescence_date IS NULL OR estimated_obsolescence_date >= end_of_sale)
);
-- 12. COMMENTAIRES SUR LES TABLES ET COLONNES
-- ==================================================================

COMMENT ON TABLE public.profiles IS 'Table des profils utilisateurs étendant auth.users de Supabase';
COMMENT ON COLUMN public.profiles.client_id IS 'ID du client associé (obligatoire pour les utilisateurs avec le rôle client)';

COMMENT ON TABLE public.clients IS 'Table des clients de Bridge';
COMMENT ON TABLE public.licenses IS 'Table des licences logicielles et matérielles';
COMMENT ON TABLE public.equipment IS 'Table des équipements informatiques';

COMMENT ON VIEW v_client_dashboard IS 'Vue spécifique pour le tableau de bord des clients (accès limité à leurs propres données)';
COMMENT ON VIEW v_dashboard_alerts IS 'Vue complète du tableau de bord pour les administrateurs et techniciens';

ALTER TABLE public.profiles DROP CONSTRAINT check_client_role_has_client_id;
ALTER TABLE public.profiles ADD CONSTRAINT check_client_role_has_client_id 
CHECK (
    (role = 'client' AND client_id IS NOT NULL) OR 
    (role IN ('admin', 'technicien', 'unverified'))
);
-- ==================================================================
-- AJOUT DE LA TABLE POUR LES PARAMÈTRES GLOBAUX DE L'APPLICATION
-- ==================================================================

-- Table des paramètres globaux de l'application
CREATE TABLE public.app_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL, -- Clé du paramètre (ex: 'smtp_host', 'default_theme', etc.)
    value JSONB NOT NULL, -- Valeur du paramètre (format JSON pour flexibilité)
    category TEXT NOT NULL DEFAULT 'general', -- Catégorie (email, ui, alerts, etc.)
    description TEXT, -- Description du paramètre
    is_public BOOLEAN DEFAULT FALSE, -- Si true, accessible aux utilisateurs non-admin
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les recherches
CREATE INDEX idx_app_settings_key ON public.app_settings(key);
CREATE INDEX idx_app_settings_category ON public.app_settings(category);
CREATE INDEX idx_app_settings_is_public ON public.app_settings(is_public);

-- Trigger pour updated_at
CREATE TRIGGER update_app_settings_updated_at
    BEFORE UPDATE ON public.app_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Activation de RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Policies pour les paramètres d'application
-- Les admins peuvent tout gérer
CREATE POLICY "Admins can manage app settings" ON public.app_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Les utilisateurs peuvent voir les paramètres publics
CREATE POLICY "Users can view public app settings" ON public.app_settings
    FOR SELECT USING (is_public = TRUE);

-- Insertion de paramètres par défaut
INSERT INTO public.app_settings (key, value, category, description, is_public) VALUES
('app_name', '"Bridge LFU"', 'general', 'Nom de l''application', true),
('app_version', '"1.0.0"', 'general', 'Version de l''application', true),
('default_theme', '"light"', 'ui', 'Thème par défaut', true),
('default_language', '"fr"', 'ui', 'Langue par défaut', true),
('license_alert_colors', '{"urgent": "#DC2626", "warning": "#F59E0B", "normal": "#10B981"}', 'ui', 'Couleurs des alertes licences', true),
('equipment_alert_colors', '{"urgent": "#DC2626", "warning": "#F59E0B", "normal": "#10B981"}', 'ui', 'Couleurs des alertes équipements', true),
('smtp_enabled', 'false', 'email', 'Activation des emails SMTP', false),
('smtp_host', '""', 'email', 'Serveur SMTP', false),
('smtp_port', '587', 'email', 'Port SMTP', false),
('smtp_user', '""', 'email', 'Utilisateur SMTP', false),
('default_license_alert_days', '[7, 30]', 'alerts', 'Jours d''alerte par défaut pour les licences', false),
('default_equipment_alert_days', '[30, 90]', 'alerts', 'Jours d''alerte par défaut pour les équipements', false),
('max_file_size_mb', '10', 'files', 'Taille maximale des fichiers en MB', false),
('allowed_file_types', '["pdf", "doc", "docx", "jpg", "jpeg", "png"]', 'files', 'Types de fichiers autorisés', false);

COMMENT ON TABLE public.app_settings IS 'Table des paramètres globaux de l''application';
COMMENT ON COLUMN public.app_settings.key IS 'Clé unique du paramètre';
COMMENT ON COLUMN public.app_settings.value IS 'Valeur du paramètre au format JSON';
COMMENT ON COLUMN public.app_settings.category IS 'Catégorie du paramètre (general, ui, email, alerts, files)';
COMMENT ON COLUMN public.app_settings.is_public IS 'Si true, le paramètre est accessible aux utilisateurs non-admin';
-- Fonction SQL optimisée pour calculer les statistiques de notifications
-- À ajouter dans votre base de données Supabase

CREATE OR REPLACE FUNCTION get_notification_stats(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total', COALESCE(SUM(1), 0),
        'unread', COALESCE(SUM(CASE WHEN NOT is_read THEN 1 ELSE 0 END), 0),
        'read', COALESCE(SUM(CASE WHEN is_read THEN 1 ELSE 0 END), 0),
        'by_type', json_build_object(
            'license_expiry', COALESCE(SUM(CASE WHEN type = 'license_expiry' THEN 1 ELSE 0 END), 0),
            'equipment_obsolescence', COALESCE(SUM(CASE WHEN type = 'equipment_obsolescence' THEN 1 ELSE 0 END), 0),
            'general', COALESCE(SUM(CASE WHEN type = 'general' THEN 1 ELSE 0 END), 0),
            'new_unverified_user', COALESCE(SUM(CASE WHEN type = 'new_unverified_user' THEN 1 ELSE 0 END), 0)
        )
    ) INTO result
    FROM public.notifications
    WHERE user_id = user_uuid;
    
    -- Si aucun résultat, retourner des statistiques vides
    IF result IS NULL THEN
        result := json_build_object(
            'total', 0,
            'unread', 0,
            'read', 0,
            'by_type', json_build_object(
                'license_expiry', 0,
                'equipment_obsolescence', 0,
                'general', 0,
                'new_unverified_user', 0
            )
        );
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaire pour documenter la fonction
COMMENT ON FUNCTION get_notification_stats(UUID) IS 'Fonction optimisée pour calculer les statistiques de notifications d''un utilisateur';

-- Optionnel : Fonction pour marquer toutes les notifications comme lues (plus efficace)
CREATE OR REPLACE FUNCTION mark_all_notifications_read(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    updated_count INTEGER;
    result JSON;
BEGIN
    -- Mise à jour et comptage en une seule opération
    WITH updated AS (
        UPDATE public.notifications 
        SET is_read = true 
        WHERE user_id = user_uuid AND is_read = false
        RETURNING id
    )
    SELECT COUNT(*) INTO updated_count FROM updated;
    
    result := json_build_object(
        'message', CASE 
            WHEN updated_count > 0 THEN 
                CASE 
                    WHEN updated_count = 1 THEN '1 notification a été marquée comme lue'
                    ELSE updated_count || ' notifications ont été marquées comme lues'
                END
            ELSE 'Aucune notification non lue trouvée'
        END,
        'updated_count', updated_count
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Politique pour autoriser l'upload de fichiers d'équipement uniquement par les admins et techniciens
CREATE POLICY "Allow admins and technicians to upload equipment files"
ON storage.objects FOR INSERT
WITH CHECK (
  -- 1. Cible le bucket spécifique 'equipment-attachments'
  bucket_id = 'equipment-attachments' 
  -- 2. Vérifie que l'utilisateur actuel (auth.uid()) a le rôle 'admin' ou 'technicien'
  AND auth.uid() IN (
    SELECT id FROM public.profiles WHERE role IN ('admin', 'technicien')
  )
);
-- D'abord, supprimez l'ancienne politique
DROP POLICY IF EXISTS "Admins and technicians can manage license attachments" ON public.license_attachments;

-- Créez la nouvelle politique avec la clause WITH CHECK
CREATE POLICY "Admins and technicians can manage license attachments" ON public.license_attachments
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'technicien')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'technicien')
        )
    );
create policy "Allow admins and technicians to insert attachments"
on public.license_attachments for insert
with check (
  auth.uid() = uploaded_by AND auth.uid() IN (
    SELECT id FROM public.profiles WHERE role IN ('admin', 'technicien')
  )
);
create policy "Allow admins and technicians to read files"
on storage.objects for select
to authenticated -- Cela permet à un utilisateur connecté de vérifier le rôle.
using (
  bucket_id = 'license-attachments' AND auth.uid() IN (
    SELECT id FROM public.profiles WHERE role IN ('admin', 'technicien')
  )
);
CREATE POLICY "Admins and technicians can insert equipment attachments"
ON public.equipment_attachments FOR INSERT
WITH CHECK (
  -- 1. L'utilisateur qui insère le fichier doit être celui enregistré comme 'uploaded_by'
  auth.uid() = uploaded_by 
  -- 2. L'utilisateur doit avoir le rôle 'admin' ou 'technicien'
  AND auth.uid() IN (
    SELECT id FROM public.profiles WHERE role IN ('admin', 'technicien')
  )
);
-- 1. Politique RLS Storage pour les Équipements (Clients)
-- Politique pour permettre aux clients de télécharger les fichiers de licences
CREATE POLICY "Clients can download license files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'license-attachments' 
  AND EXISTS (
    SELECT 1 
    FROM public.license_attachments la
    JOIN public.licenses l ON la.license_id = l.id
    JOIN public.profiles p ON l.client_id = p.client_id
    WHERE 
      p.id = auth.uid() 
      AND p.role = 'client'
      AND storage.objects.name = la.file_url
  )
);
CREATE POLICY "Clients can download equipment files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'equipment-attachments' 
  AND EXISTS (
    SELECT 1 
    FROM public.equipment_attachments ea
    JOIN public.equipment e ON ea.equipment_id = e.id
    JOIN public.profiles p ON e.client_id = p.client_id
    WHERE 
      p.id = auth.uid() 
      AND p.role = 'client'
      AND storage.objects.name = ea.file_url
  )
);
COMMENT ON FUNCTION mark_all_notifications_read(UUID) IS 'Fonction optimisée pour marquer toutes les notifications d''un utilisateur comme lues';
-- Fix pour le statut des licences annulées
-- Modifier les fonctions existantes pour préserver le statut cancelled

-- Étape 1: Modifier la fonction calculate_license_status existante
CREATE OR REPLACE FUNCTION calculate_license_status(expiry_date DATE)
RETURNS license_status AS $$
BEGIN
    -- Calculer le statut basé sur la date d'expiration
    IF expiry_date < CURRENT_DATE THEN
        RETURN 'expired';
    ELSIF expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN
        RETURN 'about_to_expire';
    ELSE
        RETURN 'active';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Étape 2: Modifier la fonction update_license_status pour préserver le statut cancelled
CREATE OR REPLACE FUNCTION update_license_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Si le statut actuel est cancelled, le préserver
    IF NEW.status = 'cancelled' THEN
        -- Conserver le statut cancelled tel quel
        NEW.status = 'cancelled';
    ELSE
        -- Sinon, calculer automatiquement le statut basé sur la date
        NEW.status = calculate_license_status(NEW.expiry_date);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Étape 3: Recréer le trigger (au cas où il aurait été modifié)
DROP TRIGGER IF EXISTS update_license_status_trigger ON public.licenses;
CREATE TRIGGER update_license_status_trigger
    BEFORE INSERT OR UPDATE ON public.licenses
    FOR EACH ROW
    EXECUTE FUNCTION update_license_status();

-- Étape 4: Tester la fonction (optionnel)
-- UPDATE licenses SET status = 'cancelled' WHERE id = 'votre-id-licence';
-- SELECT * FROM licenses WHERE id = 'votre-id-licence';
CREATE OR REPLACE FUNCTION get_client_equipment_report(client_uuid UUID)
RETURNS TABLE (
    equipment_name TEXT,
    type_name TEXT, -- Changement de type : TEXT au lieu de equipment_type
    brand TEXT,
    model TEXT,
    status equipment_status,
    obsolescence_date DATE,
    end_of_sale DATE,
    days_until_obsolescence INTEGER,
    days_until_end_of_sale INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.name,
        et.name, -- Nouvelle jointure pour récupérer le nom du type
        e.brand,
        e.model,
        e.status,
        e.estimated_obsolescence_date,
        e.end_of_sale,
        (e.estimated_obsolescence_date - CURRENT_DATE)::INTEGER,
        (e.end_of_sale - CURRENT_DATE)::INTEGER
    FROM public.equipment e
    -- NOUVEAU : Jointure avec la table des types
    LEFT JOIN public.equipment_types et ON e.type_id = et.id
    WHERE e.client_id = client_uuid
    ORDER BY e.estimated_obsolescence_date ASC;
END;
$$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION get_obsolete_equipment_report()
RETURNS TABLE (
    equipment_name TEXT,
    client_name TEXT,
    type_name TEXT, -- Changement de type : TEXT au lieu de equipment_type
    brand TEXT,
    model TEXT,
    obsolescence_date DATE,
    days_obsolete INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.name,
        c.name,
        et.name, -- Nouvelle jointure pour récupérer le nom du type
        e.brand,
        e.model,
        e.estimated_obsolescence_date,
        (CURRENT_DATE - e.estimated_obsolescence_date)::INTEGER
    FROM public.equipment e
    LEFT JOIN public.clients c ON e.client_id = c.id
    -- NOUVEAU : Jointure avec la table des types
    LEFT JOIN public.equipment_types et ON e.type_id = et.id 
    -- La condition de filtre reste la même
    WHERE e.estimated_obsolescence_date < CURRENT_DATE
    ORDER BY e.estimated_obsolescence_date DESC;
END;
$$ LANGUAGE plpgsql;
-- ==================================================================
-- AJOUT DE LA TABLE EQUIPMENT_TYPES POUR REMPLACER L'ENUM
-- ==================================================================

-- 1. Créer la nouvelle table pour les types d'équipements
CREATE TABLE public.equipment_types (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    code TEXT UNIQUE NOT NULL, -- Code court (ex: 'PC', 'SRV', 'RTR')
    description TEXT,
    icon TEXT, -- Nom de l'icône (pour l'UI)
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Index pour optimiser les recherches
CREATE INDEX idx_equipment_types_code ON public.equipment_types(code);
CREATE INDEX idx_equipment_types_is_active ON public.equipment_types(is_active);
CREATE INDEX idx_equipment_types_name ON public.equipment_types(name);

-- 3. Trigger pour updated_at
CREATE TRIGGER update_equipment_types_updated_at
    BEFORE UPDATE ON public.equipment_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. Insérer les types par défaut (correspondant aux valeurs ENUM actuelles)
INSERT INTO public.equipment_types (name, code, description, icon) VALUES
('PC / Ordinateur', 'PC', 'Ordinateur de bureau ou portable', 'Monitor'),
('Serveur', 'SRV', 'Serveur physique ou virtuel', 'Server'),
('Routeur', 'RTR', 'Équipement de routage réseau', 'Router'),
('Switch', 'SWT', 'Commutateur réseau', 'Network'),
('Imprimante', 'PRT', 'Imprimante ou multifonction', 'Printer'),
('Firewall', 'FWL', 'Pare-feu matériel ou logiciel', 'Shield'),
('Point d''accès WiFi', 'WAP', 'Borne WiFi', 'Wifi'),
('Téléphone IP', 'TEL', 'Téléphonie VoIP', 'Phone'),
('Tablette', 'TAB', 'Tablette tactile', 'Tablet'),
('Autre', 'OTH', 'Autre type d''équipement', 'HelpCircle');

-- 5. Activation de RLS
ALTER TABLE public.equipment_types ENABLE ROW LEVEL SECURITY;

-- 6. Policies RLS pour equipment_types

-- Policy 1: Tout le monde peut lire les types actifs (lecture publique)
CREATE POLICY "Everyone can view active equipment types" 
ON public.equipment_types
FOR SELECT 
USING (is_active = TRUE);

-- Policy 2: Les admins et techniciens peuvent tout voir (même les types inactifs)
CREATE POLICY "Admins and technicians can view all equipment types" 
ON public.equipment_types
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'technicien')
    )
);

-- Policy 3: Les admins et techniciens peuvent créer des types
CREATE POLICY "Admins and technicians can create equipment types" 
ON public.equipment_types
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'technicien')
    )
);

-- Policy 4: Les admins et techniciens peuvent modifier des types
CREATE POLICY "Admins and technicians can update equipment types" 
ON public.equipment_types
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'technicien')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'technicien')
    )
);

-- Policy 5: Les admins et techniciens peuvent supprimer des types (soft delete recommandé)
CREATE POLICY "Admins and technicians can delete equipment types" 
ON public.equipment_types
FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'technicien')
    )
);

-- 7. Modifier la table equipment pour utiliser la nouvelle référence
-- IMPORTANT: À exécuter seulement après avoir migré les données existantes

-- Ajouter la nouvelle colonne type_id
ALTER TABLE public.equipment 
ADD COLUMN type_id UUID REFERENCES public.equipment_types(id);

-- Créer un index sur type_id
CREATE INDEX idx_equipment_type_id ON public.equipment(type_id);

-- 8. Migration des données existantes (mapper l'ancien ENUM vers les nouveaux IDs)
-- Cette requête doit être adaptée selon vos données réelles

UPDATE public.equipment e
SET type_id = (
    SELECT et.id 
    FROM public.equipment_types et 
    WHERE 
        (e.type = 'pc' AND et.code = 'PC') OR
        (e.type = 'serveur' AND et.code = 'SRV') OR
        (e.type = 'routeur' AND et.code = 'RTR') OR
        (e.type = 'switch' AND et.code = 'SWT') OR
        (e.type = 'imprimante' AND et.code = 'PRT') OR
        (e.type = 'autre' AND et.code = 'OTH')
    LIMIT 1
);

-- 9. Après vérification que toutes les données sont migrées:
-- Rendre type_id obligatoire
ALTER TABLE public.equipment 
ALTER COLUMN type_id SET NOT NULL;

-- 10. (Optionnel) Supprimer l'ancienne colonne type après migration complète
-- ATTENTION: À faire seulement quand vous êtes sûr que tout fonctionne
-- ALTER TABLE public.equipment DROP COLUMN type;
-- DROP TYPE equipment_type;

-- 11. Mettre à jour la vue v_equipment_with_client
DROP VIEW IF EXISTS v_equipment_with_client;
CREATE VIEW v_equipment_with_client AS
SELECT 
    e.*,
    et.name as type_name,
    et.code as type_code,
    et.icon as type_icon,
    c.name as client_name,
    c.contact_email as client_email,
    p.first_name || ' ' || p.last_name as created_by_name
FROM public.equipment e
LEFT JOIN public.equipment_types et ON e.type_id = et.id
LEFT JOIN public.clients c ON e.client_id = c.id
LEFT JOIN public.profiles p ON e.created_by = p.id;

-- 12. Commentaires pour documentation
COMMENT ON TABLE public.equipment_types IS 'Table des types d''équipements (remplace l''ENUM equipment_type)';
COMMENT ON COLUMN public.equipment_types.code IS 'Code court unique pour identifier le type';
COMMENT ON COLUMN public.equipment_types.icon IS 'Nom de l''icône à utiliser dans l''interface (lucide-react)';
COMMENT ON COLUMN public.equipment_types.is_active IS 'Indique si le type est actif et utilisable';
COMMENT ON COLUMN public.equipment.type_id IS 'Référence vers le type d''équipement (remplace la colonne type)';

-- 13. Fonction utilitaire pour obtenir les statistiques par type
CREATE OR REPLACE FUNCTION get_equipment_stats_by_type()
RETURNS TABLE (
    type_id UUID,
    type_name TEXT,
    type_code TEXT,
    total_count BIGINT,
    active_count BIGINT,
    obsolete_count BIGINT,
    percentage NUMERIC
) AS $$
DECLARE
    total_equipment BIGINT;
BEGIN
    SELECT COUNT(*) INTO total_equipment FROM public.equipment;
    
    RETURN QUERY
    SELECT 
        et.id,
        et.name,
        et.code,
        COUNT(e.id)::BIGINT AS total_count,
        COUNT(e.id) FILTER (WHERE e.status = 'actif')::BIGINT AS active_count,
        COUNT(e.id) FILTER (WHERE e.status = 'obsolete')::BIGINT AS obsolete_count,
        CASE 
            WHEN total_equipment = 0 THEN 0.00
            ELSE ROUND((COUNT(e.id) * 100.0 / total_equipment), 2)::NUMERIC
        END AS percentage
    FROM public.equipment_types et
    LEFT JOIN public.equipment e ON et.id = e.type_id
    WHERE et.is_active = TRUE
    GROUP BY et.id, et.name, et.code
    ORDER BY total_count DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_equipment_stats_by_type() IS 'Fonction retournant les statistiques d''équipements par type';


-- 2. Déclencheur updated_at identique aux autres tables
CREATE TRIGGER update_license_suppliers_updated_at
    BEFORE UPDATE ON public.license_suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3. Index usuels
CREATE INDEX idx_license_suppliers_name
    ON public.license_suppliers (LOWER(name));

CREATE INDEX idx_license_suppliers_is_active
    ON public.license_suppliers (is_active);

-- 4. Colonne de relation dans licenses
ALTER TABLE public.licenses
    ADD COLUMN supplier_id UUID REFERENCES public.license_suppliers(id);

-- Optionnel : conserver l’ancien champ texte mais forcer l’un ou l’autre
ALTER TABLE public.licenses
    ADD CONSTRAINT licenses_supplier_presence_chk
    CHECK (
        supplier_id IS NOT NULL
        OR editor IS NOT NULL
    );

-- 5. RLS
ALTER TABLE public.license_suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and technicians manage suppliers"
    ON public.license_suppliers
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
              AND role IN ('admin', 'technicien')
        )
    );

CREATE POLICY "Clients can view active suppliers"
    ON public.license_suppliers
    FOR SELECT
    USING (
        is_active = TRUE
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
              AND role = 'client'
        )
    );

-- 6. Vue pratique (optionnel)
CREATE VIEW v_license_suppliers AS
SELECT
    s.*,
    p.first_name || ' ' || p.last_name AS created_by_name
FROM public.license_suppliers s
LEFT JOIN public.profiles p ON s.created_by = p.id;

-- 1. Index d’unicité pour éviter les doublons d’orthographe
CREATE UNIQUE INDEX IF NOT EXISTS uq_license_suppliers_name
    ON public.license_suppliers (LOWER(name));

-- 2. Insérer les fournisseurs uniques (adapter contacts si disponibles)
INSERT INTO public.license_suppliers (name, created_by)
VALUES
    ('Microsoft', NULL),
    ('Bel Solutions', NULL),
    ('Mon Éditeur', NULL),
    ('Nagia', NULL),
    ('MicroSoft', NULL),  -- Gardé distinct si vous voulez suivre la casse exacte
    ('eat', NULL),
    ('juan', NULL)
ON CONFLICT (LOWER(name)) DO NOTHING;

-- 3. Rattacher les licences existantes
UPDATE public.licenses l
SET supplier_id = s.id
FROM public.license_suppliers s
WHERE LOWER(l.editor) = LOWER(s.name);

-- 4. Vérifier les licences restant sans fournisseur (si certains noms n’étaient pas insérés)
SELECT id, name, editor
FROM public.licenses
WHERE supplier_id IS NULL;

-- 5. (Optionnel) si toutes les lignes sont rattachées, retirer l’ancien champ texte
-- ALTER TABLE public.licenses DROP COLUMN editor;