-- ==================================================================
-- AJOUT DES POLICIES RLS POUR LICENSE_TYPES
-- Script à exécuter sur une base de données existante
-- ==================================================================

-- 1. Activation de RLS sur la table license_types
ALTER TABLE public.license_types ENABLE ROW LEVEL SECURITY;

-- 2. Policies RLS pour license_types

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

-- Policy 6: Les clients peuvent voir les types actifs (même permission que "Everyone")
CREATE POLICY "Clients can view active license types"
ON public.license_types
FOR SELECT
USING (is_active = TRUE);

-- 3. Commentaires pour la documentation des policies
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

-- 4. Vérification des policies créées
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'license_types'
ORDER BY policyname;
