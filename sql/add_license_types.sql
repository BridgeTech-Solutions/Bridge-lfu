-- Création de la table license_types
CREATE TABLE license_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ajout de l'index pour les performances
CREATE INDEX idx_license_types_is_active ON license_types(is_active);
CREATE INDEX idx_license_types_code ON license_types(code);

-- Ajout de la colonne type_id à la table licenses
ALTER TABLE licenses ADD COLUMN type_id UUID REFERENCES license_types(id);

-- Création de l'index pour les performances
CREATE INDEX idx_licenses_type_id ON licenses(type_id);

-- Insertion de quelques types de licence par défaut
INSERT INTO license_types (name, code, description, created_by) VALUES
('Logiciel', 'SOFTWARE', 'Licences pour logiciels (OS, applications, etc.)', NULL),
('Matériel', 'HARDWARE', 'Licences pour équipements matériels', NULL),
('Abonnement', 'SUBSCRIPTION', 'Abonnements annuels ou mensuels', NULL),
('Open Source', 'OPENSOURCE', 'Licences open source', NULL);

-- Activation de RLS
ALTER TABLE license_types ENABLE ROW LEVEL SECURITY;

-- Policies RLS pour license_types

-- Policy 1: Tout le monde peut lire les types actifs (lecture publique)
CREATE POLICY "Everyone can view active license types"
ON public.license_types
FOR SELECT
USING (is_active = TRUE);

-- Policy 2: Les admins et techniciens peuvent tout voir (même les types inactifs)
CREATE POLICY "Admins and technicians can view all license types"
ON public.license_types
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'technicien')
    )
);

-- Policy 3: Les admins et techniciens peuvent créer des types
CREATE POLICY "Admins and technicians can create license types"
ON public.license_types
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'technicien')
    )
);

-- Policy 4: Les admins et techniciens peuvent modifier des types
CREATE POLICY "Admins and technicians can update license types"
ON public.license_types
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
CREATE POLICY "Admins and technicians can delete license types"
ON public.license_types
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'technicien')
    )
);

-- Policy 6: Les clients peuvent voir les types actifs (même policy que "Everyone")
CREATE POLICY "Clients can view active license types"
ON public.license_types
FOR SELECT
USING (is_active = TRUE);

-- Commentaires pour la documentation des policies
COMMENT ON POLICY "Everyone can view active license types" ON public.license_types
IS 'Permet à tous les utilisateurs authentifiés de voir les types de licence actifs';

COMMENT ON POLICY "Admins and technicians can view all license types" ON public.license_types
IS 'Permet aux administrateurs et techniciens de voir tous les types de licence (actifs et inactifs)';

COMMENT ON POLICY "Admins and technicians can create license types" ON public.license_types
IS 'Permet aux administrateurs et techniciens de créer de nouveaux types de licence';

COMMENT ON POLICY "Admins and technicians can update license types" ON public.license_types
IS 'Permet aux administrateurs et techniciens de modifier les types de licence';

COMMENT ON POLICY "Admins and technicians can delete license types" ON public.license_types
IS 'Permet aux administrateurs et techniciens de supprimer des types de licence';

COMMENT ON POLICY "Clients can view active license types" ON public.license_types
IS 'Permet aux clients de voir les types de licence actifs (même permission que tout le monde)';
